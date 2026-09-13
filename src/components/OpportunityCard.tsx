import React, { useState } from 'react';
import {
  ExternalLink,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Trophy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ListChecks,
  Bookmark,
  Tag,
} from 'lucide-react';
import { Opportunity } from '../types';
import { getTagBadgeStyle } from '../services/savedOpportunities';

interface OpportunityCardProps {
  opportunity: Opportunity;
  isSaved?: boolean;
  savedTags?: string[];
  onToggleSave?: (opportunity: Opportunity) => void;
  onManageTags?: (opportunity: Opportunity) => void;
  onViewDetails: (opportunity: Opportunity) => void;
  onOpenActionPlan: (opportunity: Opportunity) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  isSaved = false,
  savedTags = [],
  onToggleSave,
  onManageTags,
  onViewDetails,
  onOpenActionPlan,
}) => {
  const [showReasoning, setShowReasoning] = useState(false);

  // Score color semantics (strictly based on backend score: high >=80 green, med 50-79 amber, low <50 red/slate)
  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (score >= 50) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    } else {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <article
      id={`opportunity-card-${opportunity.id}`}
      className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-all duration-200 overflow-hidden"
    >
      <div className="p-5 sm:p-6">
        {/* Top Header: Title, Org, Score */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight leading-snug">
              {opportunity.name}
            </h3>
            <p className="text-xs font-medium text-slate-500">
              {opportunity.organization || 'Organization not specified'}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onToggleSave && (
              <button
                type="button"
                id={`bookmark-btn-${opportunity.id}`}
                onClick={() => onToggleSave(opportunity)}
                title={isSaved ? 'Saved opportunity' : 'Save opportunity'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isSaved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-600' : ''}`} />
              </button>
            )}

            <span
              id={`opportunity-score-${opportunity.id}`}
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border tracking-wide ${getScoreBadge(
                opportunity.match_score
              )}`}
              title="Calculated by backend reasoning model"
            >
              {opportunity.match_score}% Match
            </span>
          </div>
        </div>

        {/* Custom Labels / Tags Bar if Saved */}
        {isSaved && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center mr-1">
              <Tag className="w-3 h-3 mr-1 text-slate-400" />
              Labels:
            </span>
            {savedTags.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">No labels</span>
            ) : (
              savedTags.map((tag) => {
                const style = getTagBadgeStyle(tag);
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {tag}
                  </span>
                );
              })
            )}
            {onManageTags && (
              <button
                type="button"
                onClick={() => onManageTags(opportunity)}
                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 underline ml-1"
              >
                {savedTags.length === 0 ? '+ Add labels' : 'Edit labels'}
              </button>
            )}
          </div>
        )}

        {/* Structured Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-y border-slate-100 text-xs text-slate-600">
          {/* Deadline */}
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong className="text-slate-700">Deadline: </strong>
              {opportunity.deadline || 'Not specified'}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong className="text-slate-700">Loc: </strong>
              {opportunity.location || 'Not specified'}
            </span>
          </div>

          {/* Participation */}
          <div className="flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong className="text-slate-700">Type: </strong>
              {opportunity.participation || 'Not specified'}
            </span>
          </div>

          {/* Cost / Fee */}
          <div className="flex items-center space-x-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong className="text-slate-700">Cost: </strong>
              {opportunity.cost || 'Not specified'}
            </span>
          </div>
        </div>

        {/* Prize / Benefit Row if available */}
        {opportunity.prize && (
          <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-amber-800 bg-amber-50/70 px-2.5 py-1 rounded border border-amber-200/60">
            <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">
              <strong>Prize / Benefit: </strong>
              {opportunity.prize}
            </span>
          </div>
        )}

        {/* Tags: Eligibility & Key Skills */}
        <div className="mt-3.5 space-y-2">
          {opportunity.eligibility && opportunity.eligibility.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Eligibility:</span>
              {opportunity.eligibility.map((el, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60"
                >
                  {el}
                </span>
              ))}
            </div>
          )}

          {opportunity.skills && opportunity.skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Skills:</span>
              {opportunity.skills.map((skill, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Expandable "Why this match?" section */}
        {showReasoning && (
          <div
            id={`opportunity-reasoning-${opportunity.id}`}
            className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-3"
          >
            <div className="font-semibold text-slate-900 border-b border-slate-200/70 pb-1.5 flex items-center justify-between">
              <span>Backend Match Reasoning</span>
              <span className="text-[11px] font-normal text-slate-500">
                Extracted from live web page
              </span>
            </div>

            {/* Strong Matches */}
            {opportunity.strong_matches && opportunity.strong_matches.length > 0 && (
              <div>
                <span className="font-semibold text-emerald-800 block mb-1">
                  Strong matches
                </span>
                <ul className="space-y-1">
                  {opportunity.strong_matches.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Potential Concerns */}
            {opportunity.concerns && opportunity.concerns.length > 0 && (
              <div>
                <span className="font-semibold text-amber-800 block mb-1">
                  Potential concerns
                </span>
                <ul className="space-y-1">
                  {opportunity.concerns.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5 text-slate-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full Reasoning from backend */}
            <div>
              <span className="font-semibold text-slate-800 block mb-0.5">
                Reasoning
              </span>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {opportunity.reasoning || 'No backend reasoning provided.'}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Source link */}
          <div>
            {opportunity.url ? (
              <a
                href={opportunity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors focus:outline-hidden"
                title={`Visit ${opportunity.url}`}
              >
                <span>Visit Source Page</span>
                <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
              </a>
            ) : (
              <span className="text-xs text-slate-400">Source link unavailable</span>
            )}
          </div>

          {/* Right: Three primary actions */}
          <div className="flex items-center space-x-2">
            {/* Why this match button */}
            <button
              type="button"
              id={`why-match-btn-${opportunity.id}`}
              onClick={() => setShowReasoning(!showReasoning)}
              className="inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            >
              <span>Why this match?</span>
              {showReasoning ? (
                <ChevronUp className="w-3.5 h-3.5 ml-1 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-500" />
              )}
            </button>

            {/* Action Plan Button */}
            <button
              type="button"
              id={`action-plan-btn-${opportunity.id}`}
              onClick={() => onOpenActionPlan(opportunity)}
              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <ListChecks className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              <span>Action Plan</span>
            </button>

            {/* View Details Button */}
            <button
              type="button"
              id={`view-details-btn-${opportunity.id}`}
              onClick={() => onViewDetails(opportunity)}
              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
