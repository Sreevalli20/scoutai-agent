import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowUpDown,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  Bookmark,
  Tag,
} from 'lucide-react';
import { Opportunity, ResearchSummary, SavedOpportunity } from '../types';
import { OpportunityCard } from './OpportunityCard';
import { getTagBadgeStyle } from '../services/savedOpportunities';

interface ResultsWorkspaceProps {
  summary?: ResearchSummary;
  opportunities: Opportunity[];
  savedItems?: SavedOpportunity[];
  onToggleSave?: (opp: Opportunity) => void;
  onManageTags?: (opp: Opportunity) => void;
  onViewDetails: (opp: Opportunity) => void;
  onOpenActionPlan: (opp: Opportunity) => void;
  onResetSearch: () => void;
  onOpenSavedDrawer?: () => void;
}

export const ResultsWorkspace: React.FC<ResultsWorkspaceProps> = ({
  summary,
  opportunities,
  savedItems = [],
  onToggleSave,
  onManageTags,
  onViewDetails,
  onOpenActionPlan,
  onResetSearch,
  onOpenSavedDrawer,
}) => {
  const [sortBy, setSortBy] = useState<'score' | 'deadline' | 'name'>('score');
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCustomTag, setSelectedCustomTag] = useState<string>('all'); // 'all' | 'saved_only' | specific tag

  const formattedTimestamp = useMemo(() => {
    if (!summary?.timestamp) return null;
    try {
      return new Date(summary.timestamp).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return summary.timestamp;
    }
  }, [summary?.timestamp]);

  // Map of opportunityId -> saved opportunity
  const savedMap = useMemo(() => {
    const map = new Map<string, SavedOpportunity>();
    savedItems.forEach((item) => {
      map.set(item.opportunityId, item);
      map.set(item.opportunity.id, item);
    });
    return map;
  }, [savedItems]);

  // Distinct tags present in the current result set + saved items
  const availableCustomTags = useMemo(() => {
    const set = new Set<string>();
    savedItems.forEach((s) => s.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [savedItems]);

  const filteredAndSortedOpportunities = useMemo(() => {
    let list = [...opportunities];

    // 1. Filter by custom label/tag
    if (selectedCustomTag === 'saved_only') {
      list = list.filter((opp) => savedMap.has(opp.id));
    } else if (selectedCustomTag !== 'all') {
      list = list.filter((opp) => {
        const saved = savedMap.get(opp.id);
        return saved && saved.tags.includes(selectedCustomTag);
      });
    }

    // 2. Filter by search query
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(
        (opp) =>
          opp.name.toLowerCase().includes(q) ||
          (opp.organization && opp.organization.toLowerCase().includes(q)) ||
          opp.skills.some((s) => s.toLowerCase().includes(q)) ||
          (opp.location && opp.location.toLowerCase().includes(q))
      );
    }

    // 3. Sort
    list.sort((a, b) => {
      if (sortBy === 'score') {
        return b.match_score - a.match_score;
      }
      if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [opportunities, sortBy, filterQuery, selectedCustomTag, savedMap]);

  return (
    <div id="results-workspace" className="space-y-5">
      {/* Top Results Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Title & Summary */}
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                Research Results
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Web Verified
              </span>
            </div>

            {/* Metrics: Only display values when provided by backend */}
            {summary && (
              <div
                id="research-summary-stats"
                className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500"
              >
                {typeof summary.evaluated === 'number' && (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">Evaluated:</span>
                    <span className="font-semibold text-slate-800">
                      {summary.evaluated} pages
                    </span>
                  </div>
                )}

                {typeof summary.matches === 'number' && (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">Matches:</span>
                    <span className="font-semibold text-emerald-700">
                      {summary.matches} opportunities
                    </span>
                  </div>
                )}

                {formattedTimestamp && (
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Researched at {formattedTimestamp}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Controls (Sort + Search within results) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search within results */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter results..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="score">Highest Match</option>
                <option value="deadline">Soonest Deadline</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Labels / Tags Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 flex items-center mr-1">
              <Tag className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Filter by Label:
            </span>

            <button
              type="button"
              onClick={() => setSelectedCustomTag('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                selectedCustomTag === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Results ({opportunities.length})
            </button>

            {savedItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCustomTag('saved_only')}
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  selectedCustomTag === 'saved_only'
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3 h-3 mr-1 fill-current" />
                <span>Saved Only ({savedItems.length})</span>
              </button>
            )}

            {/* Custom Tag pills */}
            {availableCustomTags.map((tag) => {
              const countInResults = opportunities.filter((opp) => {
                const s = savedMap.get(opp.id);
                return s && s.tags.includes(tag);
              }).length;

              const style = getTagBadgeStyle(tag);
              const isSelected = selectedCustomTag === tag;

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedCustomTag(isSelected ? 'all' : tag)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                    isSelected
                      ? `${style.bg} ${style.text} ${style.border} ring-2 ring-slate-900/10`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{tag}</span>
                  <span className="ml-1 text-[10px] opacity-75">({countInResults})</span>
                </button>
              );
            })}
          </div>

          {onOpenSavedDrawer && (
            <button
              type="button"
              onClick={onOpenSavedDrawer}
              className="inline-flex items-center text-xs font-medium text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200"
            >
              <Bookmark className="w-3 h-3 mr-1 fill-emerald-700" />
              <span>Manage Saved ({savedItems.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards List or Empty State */}
      {filteredAndSortedOpportunities.length > 0 ? (
        <div className="space-y-4" id="opportunity-cards-container">
          {filteredAndSortedOpportunities.map((opportunity) => {
            const savedRecord = savedMap.get(opportunity.id);
            return (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                isSaved={!!savedRecord}
                savedTags={savedRecord?.tags || []}
                onToggleSave={onToggleSave}
                onManageTags={onManageTags}
                onViewDetails={onViewDetails}
                onOpenActionPlan={onOpenActionPlan}
              />
            );
          })}
        </div>
      ) : (
        <div
          id="no-matches-state"
          className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500"
        >
          {selectedCustomTag !== 'all' ? (
            <div>
              <p className="font-semibold text-slate-700">
                No opportunities tagged with "{selectedCustomTag}" in these results.
              </p>
              <button
                onClick={() => setSelectedCustomTag('all')}
                className="mt-2 text-emerald-700 font-semibold hover:underline"
              >
                Reset tag filter
              </button>
            </div>
          ) : filterQuery ? (
            <div>
              <p className="font-semibold text-slate-700">No results match "{filterQuery}"</p>
              <button
                onClick={() => setFilterQuery('')}
                className="mt-2 text-emerald-700 font-semibold hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-slate-700">No matching opportunities found</p>
              <p className="text-slate-500 mt-1">
                The agent evaluated live pages but found 0 matches meeting your specified constraints.
              </p>
              <button
                onClick={onResetSearch}
                className="mt-3 inline-flex items-center px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                Adjust Search Criteria
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
