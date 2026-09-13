import React, { useState } from 'react';
import {
  X,
  Settings as SettingsIcon,
  User,
  Sliders,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import {
  BackendHealth,
  CostFilter,
  OpportunityType,
  ParticipationType,
  ResearchPreferences,
  UserAccount,
  UserProfile,
} from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onUpdateAccountName?: (newName: string) => void;
  onOpenAuth?: () => void;
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  preferences: ResearchPreferences;
  onSavePreferences: (prefs: ResearchPreferences) => void;
  apiBaseUrl: string;
  onSaveApiBaseUrl: (url: string) => void;
  backendHealth: BackendHealth | null;
  onCheckHealth: () => Promise<void>;
  isCheckingHealth: boolean;
}

const ALL_TYPES: { id: OpportunityType; label: string }[] = [
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'internship', label: 'Internships' },
  { id: 'competition', label: 'Competitions' },
  { id: 'scholarship', label: 'Scholarships' },
  { id: 'grant', label: 'Grants' },
  { id: 'other', label: 'Other' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateAccountName,
  onOpenAuth,
  userProfile,
  onSaveProfile,
  preferences,
  onSavePreferences,
  apiBaseUrl,
  onSaveApiBaseUrl,
  backendHealth,
  onCheckHealth,
  isCheckingHealth,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'api'>('profile');

  // Local draft states
  const [profileDraft, setProfileDraft] = useState<UserProfile>({ ...userProfile });
  const [accountNameDraft, setAccountNameDraft] = useState(currentUser?.name || '');
  const [prefsDraft, setPrefsDraft] = useState<ResearchPreferences>({ ...preferences });
  const [urlDraft, setUrlDraft] = useState(apiBaseUrl);
  const [newSkill, setNewSkill] = useState('');
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const handleAddSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    if (!profileDraft.skills.includes(s)) {
      setProfileDraft({
        ...profileDraft,
        skills: [...profileDraft.skills, s],
      });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    setProfileDraft({
      ...profileDraft,
      skills: profileDraft.skills.filter((s) => s !== skill),
    });
  };

  const togglePrefType = (type: OpportunityType) => {
    const exists = prefsDraft.preferredTypes.includes(type);
    const updated = exists
      ? prefsDraft.preferredTypes.filter((t) => t !== type)
      : [...prefsDraft.preferredTypes, type];
    setPrefsDraft({ ...prefsDraft, preferredTypes: updated });
  };

  const handleSaveAll = () => {
    if (currentUser && onUpdateAccountName && accountNameDraft.trim() !== currentUser.name) {
      onUpdateAccountName(accountNameDraft.trim());
    }
    onSaveProfile(profileDraft);
    onSavePreferences(prefsDraft);
    onSaveApiBaseUrl(urlDraft);
    setSaveNotification('Settings saved successfully');
    setTimeout(() => setSaveNotification(null), 2500);
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="settings-modal-dialog"
        className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-4 h-4 text-slate-700" />
            <h2 id="settings-dialog-title" className="text-sm font-semibold text-slate-900">
              Settings & Profile
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'profile'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'preferences'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'api'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>API & Backend Status</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              {/* Account Details Box */}
              {currentUser ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{currentUser.name}</div>
                        <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                      Active Account
                    </span>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Account Display Name
                    </label>
                    <input
                      type="text"
                      value={accountNameDraft}
                      onChange={(e) => setAccountNameDraft(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800">Guest User</div>
                    <div className="text-[11px] text-slate-500">
                      Sign in to associate your search history and sync tagged opportunities across devices.
                    </div>
                  </div>
                  {onOpenAuth && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors ml-3"
                    >
                      Sign In / Sign Up
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Education / Student Status
                </label>
                <select
                  value={profileDraft.educationStatus}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, educationStatus: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Student">Current University / College Student</option>
                  <option value="High School">High School Student</option>
                  <option value="Recent Graduate">Recent Graduate (&lt; 2 years)</option>
                  <option value="Professional">Working Professional / Developer</option>
                  <option value="Researcher">Academic / Independent Researcher</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Country / Primary Residence
                </label>
                <input
                  type="text"
                  value={profileDraft.country}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, country: e.target.value })
                  }
                  placeholder="e.g. India, United States, Germany..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={profileDraft.experience}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, experience: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                >
                  <option value="student">Student / Early Learner</option>
                  <option value="entry">Entry Level (&lt; 2 yrs)</option>
                  <option value="mid">Mid Level (2-5 yrs)</option>
                  <option value="senior">Senior / Lead (5+ yrs)</option>
                  <option value="researcher">Researcher / Postgrad</option>
                </select>
              </div>

              {/* Profile Skills */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Primary Skills & Background
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-300 rounded-md mb-2 min-h-12">
                  {profileDraft.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 shadow-2xs font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Add skill (e.g. PyTorch, Next.js)"
                    className="flex-1 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-200"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Preferred Opportunity Types
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_TYPES.map((t) => {
                    const isChecked = prefsDraft.preferredTypes.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center space-x-2 p-2 rounded border cursor-pointer ${
                          isChecked
                            ? 'bg-slate-50 border-slate-300 font-semibold text-slate-900'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePrefType(t.id)}
                          className="rounded text-slate-900 focus:ring-slate-900"
                        />
                        <span>{t.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Maximum Cost Preference
                </label>
                <select
                  value={prefsDraft.maxCost}
                  onChange={(e) =>
                    setPrefsDraft({ ...prefsDraft, maxCost: e.target.value as CostFilter })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900"
                >
                  <option value="either">Any Cost (Free & Paid)</option>
                  <option value="free">Free Only (Strictly zero fee)</option>
                  <option value="paid">Paid programs acceptable</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Individual / Team Preference
                </label>
                <select
                  value={prefsDraft.participation}
                  onChange={(e) =>
                    setPrefsDraft({
                      ...prefsDraft,
                      participation: e.target.value as ParticipationType,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900"
                >
                  <option value="either">Either (No restriction)</option>
                  <option value="individual">Individual Participation Only</option>
                  <option value="team">Team Participation</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 3: API & BACKEND STATUS */}
          {activeTab === 'api' && (
            <div className="space-y-4 text-xs">
              {/* Security Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start space-x-2.5 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-slate-900">Secure Architecture: </span>
                  Anakin and Groq API keys are handled strictly inside the FastAPI backend. Never entered or exposed in the browser.
                </div>
              </div>

              {/* Backend URL input */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  FastAPI Backend Base URL
                </label>
                <input
                  type="text"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="w-full font-mono text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Configurable via VITE_API_BASE_URL or override here for development.
                </p>
              </div>

              {/* Health Check Button & Status Display */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Connection Diagnostics</span>
                  <button
                    type="button"
                    onClick={onCheckHealth}
                    disabled={isCheckingHealth}
                    className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                  >
                    <RefreshCw
                      className={`w-3 h-3 mr-1.5 ${isCheckingHealth ? 'animate-spin' : ''}`}
                    />
                    <span>{isCheckingHealth ? 'Pinging...' : 'Check Connection'}</span>
                  </button>
                </div>

                {backendHealth ? (
                  <div
                    className={`p-3 rounded border text-xs ${
                      backendHealth.connected
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-semibold mb-1">
                      {backendHealth.connected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Status: Connected</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Status: Disconnected / Offline</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] font-mono leading-relaxed">
                      {backendHealth.statusMessage}
                    </p>
                    {backendHealth.latencyMs !== undefined && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Latency: {backendHealth.latencyMs}ms • Endpoint: {backendHealth.endpoint}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Click "Check Connection" to test connectivity to your FastAPI server.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notification message */}
        {saveNotification && (
          <div className="px-6 py-2 bg-emerald-50 text-emerald-800 text-xs font-medium border-t border-emerald-200 flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            {saveNotification}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-200 hover:bg-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
