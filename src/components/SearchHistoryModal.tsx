import React from 'react';
import { X, History, Trash2, ArrowRight, Calendar, Search } from 'lucide-react';
import { HistoryItem } from '../types';

interface SearchHistoryModalProps {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectHistoryItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export const SearchHistoryModal: React.FC<SearchHistoryModalProps> = ({
  history,
  isOpen,
  onClose,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="search-history-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="search-history-dialog"
        className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-700" />
            <h2 id="history-modal-title" className="text-sm font-semibold text-slate-900">
              Research History
            </h2>
            {history.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                ({history.length})
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-xs text-slate-500 hover:text-rose-600 p-1 transition-colors"
                title="Clear all research history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
              aria-label="Close history"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 max-h-96 overflow-y-auto">
          {history.length > 0 ? (
            <div className="space-y-2.5">
              {history.map((item) => {
                let formattedTime = item.timestamp;
                try {
                  formattedTime = new Date(item.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                } catch {}

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectHistoryItem(item);
                      onClose();
                    }}
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 cursor-pointer transition-colors group flex items-start justify-between"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                        "{item.query}"
                      </p>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          {formattedTime}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-emerald-700">
                          {item.resultCount} {item.resultCount === 1 ? 'match' : 'matches'}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-700">
                No research history yet.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed opportunity searches will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-200 hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
