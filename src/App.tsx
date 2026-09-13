import React, { useState, useEffect, useRef } from 'react';
import {
  Header,
} from './components/Header';
import { ResearchForm } from './components/ResearchForm';
import { WorkflowProgress } from './components/WorkflowProgress';
import { ResultsWorkspace } from './components/ResultsWorkspace';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { ActionPlanModal } from './components/ActionPlanModal';
import { OpportunityDetailDrawer } from './components/OpportunityDetailDrawer';
import { SearchHistoryModal } from './components/SearchHistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { TagManagerModal } from './components/TagManagerModal';
import { SavedOpportunitiesDrawer } from './components/SavedOpportunitiesDrawer';
import {
  BackendHealth,
  HistoryItem,
  Opportunity,
  ResearchFilters,
  ResearchPreferences,
  ResearchRequest,
  ResearchResponse,
  SavedOpportunity,
  StageState,
  UserAccount,
  UserProfile,
  WorkflowStage,
} from './types';
import {
  checkBackendHealth,
  clearStoredHistory,
  getApiBaseUrl,
  getStoredHistory,
  pollResearchStatus,
  saveHistoryItem,
  setApiBaseUrl,
  submitResearch,
  ApiError,
} from './services/api';
import {
  DEFAULT_PREFERENCES,
  DEFAULT_PROFILE,
  loadUserPreferences,
  loadUserProfile,
  saveUserPreferences,
  saveUserProfile,
} from './services/storage';
import {
  clearActiveSession,
  getCurrentUser,
  updateUserProfile as updateAccountProfile,
} from './services/auth';
import {
  getSavedOpportunities,
  saveOpportunity,
  unsaveOpportunity,
  setOpportunityTags,
  setOpportunityNotes,
} from './services/savedOpportunities';

export default function App() {
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // User Profile & Preferences
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const user = getCurrentUser();
    return user?.profile || loadUserProfile();
  });
  const [preferences, setPreferences] = useState<ResearchPreferences>(loadUserPreferences());
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(getApiBaseUrl());

  // Saved Opportunities & Custom Labels
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>(() =>
    getSavedOpportunities(getCurrentUser()?.id)
  );
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [tagModalOpportunity, setTagModalOpportunity] = useState<Opportunity | null>(null);

  // Search form query & filters
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ResearchFilters>({
    types: preferences.preferredTypes.length > 0 ? preferences.preferredTypes : ['hackathon'],
    location: preferences.preferredLocations[0] || 'Anywhere',
    participation: preferences.participation || 'either',
    cost: preferences.maxCost || 'either',
    deadline: 'any',
    skills: userProfile.skills.slice(0, 4),
  });

  // Backend connection status
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Search & Execution state
  const [isSearching, setIsSearching] = useState(false);
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('discover');
  const [stageStates, setStageStates] = useState<Record<WorkflowStage, StageState>>({
    discover: 'pending',
    read: 'pending',
    reason: 'pending',
    rank: 'pending',
    act: 'pending',
  });
  const [stageDetails, setStageDetails] = useState<Record<WorkflowStage, string>>({});
  const [activeStageMessage, setActiveStageMessage] = useState<string>('');
  const [researchResponse, setResearchResponse] = useState<ResearchResponse | null>(null);
  const [searchError, setSearchError] = useState<ApiError | Error | null>(null);

  // History state (scoped to user or guest)
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    getStoredHistory(getCurrentUser()?.id)
  );

  // Modals & Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [actionPlanOpportunity, setActionPlanOpportunity] = useState<Opportunity | null>(null);
  const [detailOpportunity, setDetailOpportunity] = useState<Opportunity | null>(null);

  // Abort controller ref for cancelling in-flight searches
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initial mount: test backend connection & load initial state
  useEffect(() => {
    handleCheckHealth();
  }, []);

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const health = await checkBackendHealth();
      setBackendHealth(health);
    } catch (e) {
      setBackendHealth({
        connected: false,
        checkedAt: new Date().toISOString(),
        endpoint: getApiBaseUrl(),
        statusMessage: 'Unable to reach backend',
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Authentication Handlers
  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.profile) {
      setUserProfile(user.profile);
      saveUserProfile(user.profile);
    }
    // Reload user-scoped search history & saved opportunities
    setHistory(getStoredHistory(user.id));
    setSavedOpportunities(getSavedOpportunities(user.id));
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    clearActiveSession();
    setCurrentUser(null);
    // Reload guest history & saved items
    setHistory(getStoredHistory('guest'));
    setSavedOpportunities(getSavedOpportunities('guest'));
  };

  const handleUpdateAccountName = async (newName: string) => {
    if (!currentUser) return;
    try {
      const updated = await updateAccountProfile(currentUser.id, userProfile, newName);
      setCurrentUser(updated);
    } catch {
      // ignore
    }
  };

  // Saved Opportunities & Tagging Handlers
  const handleToggleSave = (opportunity: Opportunity) => {
    const isSaved = savedOpportunities.some(
      (s) => s.opportunityId === opportunity.id || s.opportunity.id === opportunity.id
    );
    if (isSaved) {
      // Open modal to manage tags / notes or remove
      setTagModalOpportunity(opportunity);
    } else {
      // Save with default 'Good Fit' tag and open modal to allow adding custom labels
      saveOpportunity(opportunity, currentUser?.id, ['Good Fit']);
      setSavedOpportunities(getSavedOpportunities(currentUser?.id));
      setTagModalOpportunity(opportunity);
    }
  };

  const handleSaveOpportunityTags = (
    opportunity: Opportunity,
    tags: string[],
    notes?: string
  ) => {
    const userId = currentUser?.id;
    // Ensure item is saved
    saveOpportunity(opportunity, userId, tags);
    setOpportunityTags(opportunity.id, tags, userId);
    if (notes !== undefined) {
      setOpportunityNotes(opportunity.id, notes, userId);
    }
    setSavedOpportunities(getSavedOpportunities(userId));
    setTagModalOpportunity(null);
  };

  const handleUnsaveOpportunity = (opportunityId: string) => {
    unsaveOpportunity(opportunityId, currentUser?.id);
    setSavedOpportunities(getSavedOpportunities(currentUser?.id));
    if (tagModalOpportunity && (tagModalOpportunity.id === opportunityId)) {
      setTagModalOpportunity(null);
    }
  };

  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);
    if (currentUser) {
      updateAccountProfile(currentUser.id, newProfile, currentUser.name).catch(() => {});
    }
    // Sync skills into filters if current filter skills is empty
    if (filters.skills.length === 0 && newProfile.skills.length > 0) {
      setFilters((prev) => ({ ...prev, skills: newProfile.skills.slice(0, 4) }));
    }
  };

  const handleSavePreferences = (newPrefs: ResearchPreferences) => {
    setPreferences(newPrefs);
    saveUserPreferences(newPrefs);
  };

  const handleSaveApiBaseUrl = (newUrl: string) => {
    setApiBaseUrl(newUrl);
    setApiBaseUrlState(newUrl);
    setTimeout(() => {
      handleCheckHealth();
    }, 100);
  };

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSearching(false);
    setStageStates((prev) => ({
      ...prev,
      [currentStage]: 'failed',
    }));
    setActiveStageMessage('Cancelled by user');
  };

  const handleStartResearch = async () => {
    if (!query.trim() || isSearching) return;

    // Reset results & errors
    setSearchError(null);
    setResearchResponse(null);
    setIsSearching(true);

    // Initialize agent workflow progression
    setCurrentStage('discover');
    setStageStates({
      discover: 'active',
      read: 'pending',
      reason: 'pending',
      rank: 'pending',
      act: 'pending',
    });
    setStageDetails({
      discover: 'Querying live search indexes for matching opportunity URLs...',
    });
    setActiveStageMessage('Connecting to backend agent...');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestPayload: ResearchRequest = {
      query: query.trim(),
      profile: userProfile,
      filters: filters,
    };

    try {
      // Execute the request to the FastAPI backend
      const result = await submitResearch(requestPayload, controller.signal);

      // If backend returns immediate completed results
      if (result.status === 'completed' || Array.isArray(result.opportunities)) {
        setStageStates({
          discover: 'completed',
          read: 'completed',
          reason: 'completed',
          rank: 'completed',
          act: 'completed',
        });
        setCurrentStage('act');
        setResearchResponse(result);
        setActiveStageMessage('');

        // Store in research history
        const historyItem: HistoryItem = {
          id: result.research_id || `hist_${Date.now()}`,
          userId: currentUser?.id,
          query: query.trim(),
          timestamp: result.summary?.timestamp || new Date().toISOString(),
          resultCount: result.opportunities?.length || 0,
          evaluatedCount: result.summary?.evaluated,
          filters: { ...filters },
          response: result,
        };
        saveHistoryItem(historyItem, currentUser?.id);
        setHistory(getStoredHistory(currentUser?.id));
      } else if (result.research_id && result.status !== 'failed') {
        // Long-running or queued status polling
        await pollUntilFinished(result.research_id, controller.signal);
      } else {
        throw new ApiError(
          result.error || 'Backend returned an incomplete research response.',
          500,
          'INVALID_RESPONSE'
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.code === 'CANCELLED') {
        setSearchError(new ApiError('Research request cancelled by user.', 0, 'CANCELLED'));
      } else {
        setSearchError(err instanceof ApiError ? err : new ApiError(err.message || 'Unknown error'));
        setStageStates((prev) => ({
          ...prev,
          [currentStage]: 'failed',
        }));
      }
    } finally {
      setIsSearching(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * Status Poller for asynchronous FastAPI workers
   */
  const pollUntilFinished = async (researchId: string, signal: AbortSignal) => {
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // Up to 2 minutes with 2s delay

    while (!completed && attempts < maxAttempts && !signal.aborted) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusRes = await pollResearchStatus(researchId, signal);

      // Map backend stage to UI stage
      if (statusRes.status === 'discovering') {
        setCurrentStage('discover');
        setStageStates((prev) => ({ ...prev, discover: 'active' }));
        if (statusRes.message) setActiveStageMessage(statusRes.message);
      } else if (statusRes.status === 'reading') {
        setCurrentStage('read');
        setStageStates((prev) => ({ ...prev, discover: 'completed', read: 'active' }));
        if (statusRes.message) setActiveStageMessage(statusRes.message);
      } else if (statusRes.status === 'reasoning') {
        setCurrentStage('reason');
        setStageStates((prev) => ({ ...prev, read: 'completed', reason: 'active' }));
        if (statusRes.message) setActiveStageMessage(statusRes.message);
      } else if (statusRes.status === 'ranking') {
        setCurrentStage('rank');
        setStageStates((prev) => ({ ...prev, reason: 'completed', rank: 'active' }));
        if (statusRes.message) setActiveStageMessage(statusRes.message);
      } else if (statusRes.status === 'completed') {
        completed = true;
        setStageStates({
          discover: 'completed',
          read: 'completed',
          reason: 'completed',
          rank: 'completed',
          act: 'completed',
        });
        setCurrentStage('act');
        if (statusRes.result) {
          setResearchResponse(statusRes.result);
          const historyItem: HistoryItem = {
            id: statusRes.research_id,
            userId: currentUser?.id,
            query: query.trim(),
            timestamp: statusRes.result.summary?.timestamp || new Date().toISOString(),
            resultCount: statusRes.result.opportunities?.length || 0,
            evaluatedCount: statusRes.result.summary?.evaluated,
            filters: { ...filters },
            response: statusRes.result,
          };
          saveHistoryItem(historyItem, currentUser?.id);
          setHistory(getStoredHistory(currentUser?.id));
        }
      } else if (statusRes.status === 'failed') {
        throw new ApiError(statusRes.error || 'Agent research failed on backend.', 500, 'BACKEND_FAILED');
      }
    }

    if (!completed && attempts >= maxAttempts) {
      throw new ApiError('Research request timed out waiting for backend worker.', 504, 'TIMEOUT');
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setQuery(item.query);
    if (item.filters) {
      setFilters(item.filters);
    }
    if (item.response) {
      setResearchResponse(item.response);
      setSearchError(null);
    }
  };

  const handleClearHistory = () => {
    clearStoredHistory(currentUser?.id);
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header */}
      <Header
        backendHealth={backendHealth}
        userProfile={userProfile}
        currentUser={currentUser}
        historyCount={history.length}
        savedCount={savedOpportunities.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsSettingsOpen(true)}
        onOpenSaved={() => setIsSavedDrawerOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Research Input & Filters Form */}
        <ResearchForm
          query={query}
          onQueryChange={setQuery}
          filters={filters}
          onFiltersChange={setFilters}
          onSubmit={handleStartResearch}
          isSearching={isSearching}
        />

        {/* Live Research Workflow UI Progress */}
        {isSearching && (
          <WorkflowProgress
            currentStage={currentStage}
            stageStates={stageStates}
            stageDetails={stageDetails}
            activeMessage={activeStageMessage}
            onCancel={handleCancelSearch}
          />
        )}

        {/* Error State */}
        {searchError && !isSearching && (
          <ErrorState
            error={searchError}
            onRetry={handleStartResearch}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Results Workspace (When real backend response is received) */}
        {researchResponse && !isSearching && (
          <ResultsWorkspace
            summary={researchResponse.summary}
            opportunities={researchResponse.opportunities || []}
            savedItems={savedOpportunities}
            onToggleSave={handleToggleSave}
            onManageTags={(opp) => setTagModalOpportunity(opp)}
            onViewDetails={(opp) => setDetailOpportunity(opp)}
            onOpenActionPlan={(opp) => setActionPlanOpportunity(opp)}
            onOpenSavedDrawer={() => setIsSavedDrawerOpen(true)}
            onResetSearch={() => {
              setResearchResponse(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Empty State (When no search has occurred or no results are present) */}
        {!researchResponse && !isSearching && !searchError && (
          <EmptyState
            onQuickQuery={(quickQuery) => {
              setQuery(quickQuery);
            }}
          />
        )}
      </main>

      {/* 3. Footer with Core Product Principle */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">ScoutAI</span>
            <span className="text-slate-300">•</span>
            <span>Autonomous Opportunity Research</span>
          </div>
          <div className="text-slate-500">
            READ <span className="text-slate-400">→</span> REASON{' '}
            <span className="text-slate-400">→</span> ACT
          </div>
          <div className="text-slate-400 text-[11px] font-mono">
            FastAPI Contract: POST /api/research
          </div>
        </div>
      </footer>

      {/* Action Plan Modal */}
      <ActionPlanModal
        opportunity={actionPlanOpportunity}
        onClose={() => setActionPlanOpportunity(null)}
      />

      {/* Opportunity Detail Drawer */}
      <OpportunityDetailDrawer
        opportunity={detailOpportunity}
        onClose={() => setDetailOpportunity(null)}
        onOpenActionPlan={(opp) => {
          setDetailOpportunity(null);
          setActionPlanOpportunity(opp);
        }}
      />

      {/* Search History Modal */}
      <SearchHistoryModal
        history={history}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />

      {/* Settings & Profile Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateAccountName={handleUpdateAccountName}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        apiBaseUrl={apiBaseUrl}
        onSaveApiBaseUrl={handleSaveApiBaseUrl}
        backendHealth={backendHealth}
        onCheckHealth={handleCheckHealth}
        isCheckingHealth={isCheckingHealth}
      />

      {/* Tag & Custom Labels Manager Modal */}
      <TagManagerModal
        isOpen={!!tagModalOpportunity}
        opportunity={tagModalOpportunity}
        savedItem={
          tagModalOpportunity
            ? savedOpportunities.find(
                (s) =>
                  s.opportunityId === tagModalOpportunity.id ||
                  s.opportunity.id === tagModalOpportunity.id
              ) || null
            : null
        }
        onClose={() => setTagModalOpportunity(null)}
        onSaveTags={handleSaveOpportunityTags}
      />

      {/* Saved Opportunities Drawer with Custom Tag Filters */}
      <SavedOpportunitiesDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedList={savedOpportunities}
        onUnsave={handleUnsaveOpportunity}
        onEditTags={(opp) => setTagModalOpportunity(opp)}
        onViewDetails={(opp) => setDetailOpportunity(opp)}
        onOpenActionPlan={(opp) => setActionPlanOpportunity(opp)}
      />

      {/* User Authentication Modal (Sign Up, Log In, Account Management) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
