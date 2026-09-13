import React, { useState } from 'react';
import {
  X,
  Tag,
  Plus,
  Check,
  Bookmark,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Opportunity, SavedOpportunity } from '../types';
import {
  DEFAULT_SUGGESTED_TAGS,
  getTagBadgeStyle,
} from '../services/savedOpportunities';

interface TagManagerModalProps {
  isOpen: boolean;
  opportunity: Opportunity | null;
  savedItem: SavedOpportunity | null;
  onClose: () => void;
  onSaveTags: (opportunity: Opportunity, tags: string[], notes?: string) => void;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  opportunity,
  savedItem,
  onClose,
  onSaveTags,
}) => {
  if (!isOpen || !opportunity) return null;

  const [activeTags, setActiveTags] = useState<string[]>(
    savedItem?.tags && savedItem.tags.length > 0 ? savedItem.tags : ['Good Fit']
  );
  const [newTagInput, setNewTagInput] = useState('');
  const [notes, setNotes] = useState(savedItem?.notes || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter((t) => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim();
    if (!clean) return;

    if (clean.length > 30) {
      setErrorMsg('Tag name cannot exceed 30 characters.');
      return;
    }

    if (activeTags.map((t) => t.toLowerCase()).includes(clean.toLowerCase())) {
      setErrorMsg('This tag is already assigned.');
      return;
    }

    setErrorMsg(null);
    setActiveTags([...activeTags, clean]);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setActiveTags(activeTags.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    onSaveTags(opportunity, activeTags, notes.trim());
    onClose();
  };

  return (
    <div
      id="tag-manager-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="tag-manager-modal"
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Custom Labels & Tags
              </h2>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {opportunity.name} • {opportunity.organization}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick Preset Labels */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-2">
              Preset Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_SUGGESTED_TAGS.map((tag) => {
                const isSelected = activeTags.includes(tag);
                const style = getTagBadgeStyle(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      isSelected
                        ? `${style.bg} ${style.text} ${style.border} ring-2 ring-slate-900/10`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3 h-3 mr-1.5 shrink-0" />
                    ) : (
                      <Plus className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                    )}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Assigned Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-2">
              Assigned Tags ({activeTags.length})
            </label>
            {activeTags.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No labels assigned yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {activeTags.map((tag) => {
                  const style = getTagBadgeStyle(tag);
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1.5 p-0.5 rounded-full hover:bg-black/10 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Custom Tag Form */}
          <form onSubmit={handleAddCustomTag} className="space-y-1.5">
            <label
              htmlFor="custom-tag-input"
              className="block text-xs font-semibold text-slate-800"
            >
              Add Custom Label
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="custom-tag-input"
                value={newTagInput}
                onChange={(e) => {
                  setNewTagInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="e.g. Dream Opportunity, Summer 2026..."
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-300"
              >
                Add Tag
              </button>
            </div>
            {errorMsg && (
              <p className="text-[11px] text-rose-600 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 inline" />
                <span>{errorMsg}</span>
              </p>
            )}
          </form>

          {/* Personal Note */}
          <div>
            <label
              htmlFor="opportunity-notes"
              className="block text-xs font-semibold text-slate-800 mb-1"
            >
              Personal Note (optional)
            </label>
            <textarea
              id="opportunity-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Met organizers at meetup, need pitch deck ready by Friday"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            id="save-tags-btn"
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
          >
            Save Labels
          </button>
        </div>
      </div>
    </div>
  );
};
