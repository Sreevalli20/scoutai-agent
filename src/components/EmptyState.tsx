import React from 'react';
import { Compass, BookOpen, BrainCircuit, CheckSquare, Sparkles, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  onQuickQuery?: (query: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onQuickQuery }) => {
  return (
    <div
      id="empty-research-state"
      className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-8 sm:p-12 text-center"
    >
      <div className="max-w-xl mx-auto">
        {/* Minimal Icon */}
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-200/60 shadow-2xs">
          <Compass className="w-6 h-6 text-slate-700" />
        </div>

        {/* Title & Subtitle exact match to prompt */}
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
          Ready to research
        </h2>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          Tell ScoutAI what you're looking for and it will research the live web.
        </p>

        {/* The Core Concept: READ -> REASON -> ACT */}
        <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {/* Step 1: Read */}
          <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200/60">
            <div className="flex items-center space-x-2 text-slate-900 mb-1.5">
              <BookOpen className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold uppercase tracking-wider">1. Read</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Crawls live web listings, official contest portals, and developer platforms to extract ground-truth dates and requirements.
            </p>
          </div>

          {/* Step 2: Reason */}
          <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200/60">
            <div className="flex items-center space-x-2 text-slate-900 mb-1.5">
              <BrainCircuit className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold uppercase tracking-wider">2. Reason</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Synthesizes eligibility rules, team constraints, prize structures, and location restrictions against your profile.
            </p>
          </div>

          {/* Step 3: Act */}
          <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200/60">
            <div className="flex items-center space-x-2 text-emerald-800 mb-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-wider">3. Act</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates a concrete, numbered task checklist with submission materials and deadline reminders ready for execution.
            </p>
          </div>
        </div>

        {/* Real Backend Integration Note */}
        <div className="mt-8 text-xs text-slate-400 font-mono">
          FastAPI Backend ready: POST /api/research • Live Web Search • Zero synthetic data
        </div>
      </div>
    </div>
  );
};
