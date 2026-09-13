import React, { useState, useMemo } from 'react';
import {
  X,
  Bookmark,
  Tag,
  Search,
  ExternalLink,
  Calendar,
  MapPin,
  Trash2,
  CheckCircle,
  FileText,
  Filter,
} from 'lucide-react';
import { Opportunity, SavedOpportunity } from '../types';
import {
  getTagBadgeStyle,
  getAllAvailableTags,
} from '../services/savedOpportunities';

interface SavedOpportunitiesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedList: SavedOpportunity[];
  onUnsave: (opportunityId: string) => void;
  onEditTags: (opportunity: Opportunity) => void;
  onViewDetails: (opportunity: Opportunity) => void;
  onOpenActionPlan: (opportunity: Opportunity) => void;
}

export const SavedOpportunitiesDrawer: React.FC<SavedOpportunitiesDrawerProps> = ({
  isOpen,
  onClose,
  savedList,
  onUnsave,
  onEditTags,
  onViewDetails,
  onOpenActionPlan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');

  // Available tags across all saved items
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    savedList.forEach((item) => {
      item.tags.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [savedList]);

  // Filtered saved opportunities
  const filteredSaved = useMemo(() => {
    return savedList.filter((item) => {
      // Tag filter
      if (selectedTagFilter !== 'all' && !item.tags.includes(selectedTagFilter)) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.opportunity.name.toLowerCase().includes(q);
        const matchesOrg = item.opportunity.organization.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        return matchesName || matchesOrg || matchesNotes || matchesTags;
      }
      return true;
    });
  }, [savedList, selectedTagFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      id="saved-opportunities-drawer-overlay"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        id="saved-opportunities-drawer"
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Bookmark className="w-4 h-4 fill-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Saved Opportunities ({savedList.length})
              </h2>
              <p className="text-xs text-slate-500">
                Opportunities tagged with custom labels for tracking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Custom Tag Filters Bar */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          {/* Quick text filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved opportunities by title, org, tag, or note..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-slate-800"
            />
          </div>

          {/* Custom Labels / Tags Filter Pills */}
          <div>
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Filter by Custom Tag:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTagFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  selectedTagFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All ({savedList.length})
              </button>

              {availableTags.map((tag) => {
                const count = savedList.filter((item) => item.tags.includes(tag)).length;
                const style = getTagBadgeStyle(tag);
                const isSelected = selectedTagFilter === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTagFilter(isSelected ? 'all' : tag)}
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                      isSelected
                        ? `${style.bg} ${style.text} ${style.border} ring-2 ring-slate-900/10`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{tag}</span>
                    <span className="ml-1 text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Saved List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {savedList.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                No saved opportunities yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                When you find a high-relevance opportunity in your research results, click the
                bookmark button to save it and tag it with custom labels like 'Urgent', 'Long-term', or 'Good Fit'.
              </p>
            </div>
          ) : filteredSaved.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-xs font-medium text-slate-600">
                No saved opportunities match your filter "{selectedTagFilter !== 'all' ? selectedTagFilter : searchQuery}".
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedTagFilter('all');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs font-semibold text-slate-900 underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredSaved.map((item) => {
              const opp = item.opportunity;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {opp.name}
                      </h4>
                      <p className="text-xs text-slate-500">{opp.organization}</p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => onEditTags(opp)}
                        title="Manage Custom Labels"
                        className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUnsave(opp.id)}
                        title="Remove from saved"
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Active Custom Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.tags.map((tag) => {
                      const style = getTagBadgeStyle(tag);
                      return (
                        <span
                          key={tag}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => onEditTags(opp)}
                      className="text-[11px] text-slate-500 hover:text-slate-900 underline ml-1"
                    >
                      + Edit labels
                    </button>
                  </div>

                  {/* Notes snippet if any */}
                  {item.notes && (
                    <div className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-700 italic">
                      "{item.notes}"
                    </div>
                  )}

                  {/* Quick Meta */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    {opp.deadline && (
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                        {opp.deadline}
                      </span>
                    )}
                    {opp.location && (
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                        {opp.location}
                      </span>
                    )}
                    {opp.match_score !== undefined && (
                      <span className="font-semibold text-slate-700">
                        {opp.match_score}% Match
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => onViewDetails(opp)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenActionPlan(opp)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Action Plan</span>
                      </button>
                    </div>

                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center space-x-1"
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
          <span>Saved locally & synced to your account</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
