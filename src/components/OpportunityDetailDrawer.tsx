import React from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileCheck,
  Briefcase,
  ListChecks,
} from 'lucide-react';
import { Opportunity } from '../types';

interface OpportunityDetailDrawerProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onOpenActionPlan: (opp: Opportunity) => void;
}

export const OpportunityDetailDrawer: React.FC<OpportunityDetailDrawerProps> = ({
  opportunity,
  onClose,
  onOpenActionPlan,
}) => {
  if (!opportunity) return null;

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div
      id="opportunity-drawer-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="opportunity-detail-drawer"
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-drawer-title"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/80 shrink-0">
          <div className="pr-4 space-y-1">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold border ${getScoreBadge(
                  opportunity.match_score
                )}`}
              >
                {opportunity.match_score}% Match Score
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {opportunity.organization || 'Organization Not Specified'}
              </span>
            </div>
            <h2
              id="detail-drawer-title"
              className="text-lg font-semibold text-slate-900 tracking-tight leading-snug"
            >
              {opportunity.name}
            </h2>
          </div>

          <button
            type="button"
            id="drawer-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors focus:outline-hidden"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                Deadline
              </span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {opportunity.deadline || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                Location
              </span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {opportunity.location || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                Participation
              </span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {opportunity.participation || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                Cost
              </span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {opportunity.cost || 'Not specified'}
              </span>
            </div>
          </div>

          {/* Prize / Benefit if present */}
          {opportunity.prize && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
              <Trophy className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block uppercase tracking-wider text-[11px]">
                  Prize & Benefits
                </span>
                <p className="mt-0.5">{opportunity.prize}</p>
              </div>
            </div>
          )}

          {/* Description if present */}
          {opportunity.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Overview & Description
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {opportunity.description}
              </p>
            </div>
          )}

          {/* Eligibility & Requirements */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Eligibility & Verification
            </h3>

            {opportunity.eligibility && opportunity.eligibility.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {opportunity.eligibility.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1.5 shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Eligibility details not explicitly stated on live page.
              </p>
            )}

            {opportunity.requirements && opportunity.requirements.length > 0 && (
              <div className="mt-2">
                <span className="text-xs font-medium text-slate-700 block mb-1">
                  Specific Requirements:
                </span>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  {opportunity.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Skills */}
          {opportunity.skills && opportunity.skills.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Key Skills & Technologies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {opportunity.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded bg-slate-50 text-slate-700 border border-slate-200 font-mono"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning & Concerns */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Agent Fit Reasoning
            </h3>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3 text-xs">
              {opportunity.reasoning && (
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">
                    AI Model Evaluation:
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {opportunity.reasoning}
                  </p>
                </div>
              )}

              {opportunity.strong_matches && opportunity.strong_matches.length > 0 && (
                <div>
                  <span className="font-semibold text-emerald-800 block mb-1">
                    Strong Matches:
                  </span>
                  <ul className="space-y-1">
                    {opportunity.strong_matches.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-1.5 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {opportunity.concerns && opportunity.concerns.length > 0 && (
                <div>
                  <span className="font-semibold text-amber-800 block mb-1">
                    Potential Concerns:
                  </span>
                  <ul className="space-y-1">
                    {opportunity.concerns.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-1.5 text-slate-700">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Plan Summary */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 mr-1.5" />
                Action Plan Preview
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenActionPlan(opportunity);
                }}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
              >
                Open Full Action Plan
              </button>
            </div>
            <p className="text-xs text-emerald-950">
              {opportunity.action_plan?.recommendation || 'No custom recommendation provided.'}
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          {opportunity.url ? (
            <a
              href={opportunity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <span>Visit Official Source</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 text-slate-400" />
            </a>
          ) : (
            <span className="text-xs text-slate-400">Source link unavailable</span>
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenActionPlan(opportunity);
              }}
              className="inline-flex items-center px-3.5 py-2 rounded-md bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-2xs"
            >
              <ListChecks className="w-3.5 h-3.5 mr-1.5" />
              <span>Action Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
