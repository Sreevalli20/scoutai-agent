import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Square,
  Calendar,
  ExternalLink,
  Sparkles,
  FileText,
  Briefcase,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Opportunity } from '../types';

interface ActionPlanModalProps {
  opportunity: Opportunity | null;
  onClose: () => void;
}

export const ActionPlanModal: React.FC<ActionPlanModalProps> = ({
  opportunity,
  onClose,
}) => {
  if (!opportunity) return null;

  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const toggleTask = (index: number) => {
    setCompletedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCopyChecklist = () => {
    const lines = [
      `Action Plan for: ${opportunity.name}`,
      `Organization: ${opportunity.organization}`,
      `Deadline: ${opportunity.deadline || 'Not specified'}`,
      `Source: ${opportunity.url}`,
      '',
      `Recommended Next Step:`,
      opportunity.action_plan?.recommendation || 'None provided',
      '',
      `Checklist:`,
      ...(opportunity.action_plan?.checklist || []).map(
        (task, i) => `[${completedItems[i] ? 'x' : ' '}] ${i + 1}. ${task}`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checklist = opportunity.action_plan?.checklist || [];
  const completedCount = Object.values(completedItems).filter(Boolean).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  return (
    <div
      id="action-plan-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="action-plan-modal-dialog"
        className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-plan-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="space-y-1 pr-4">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Action Plan
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 font-medium">
                {opportunity.organization || 'Verified Opportunity'}
              </span>
            </div>
            <h2 id="action-plan-title" className="text-base font-semibold text-slate-900 tracking-tight">
              {opportunity.name}
            </h2>
          </div>

          <button
            type="button"
            id="action-plan-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors focus:outline-hidden"
            aria-label="Close action plan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Recommended Next Step */}
          <div id="action-plan-recommendation" className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-emerald-900 font-semibold text-xs uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Recommended Next Step</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              {opportunity.action_plan?.recommendation ||
                'Review the official application guidelines and verify your eligibility.'}
            </p>
          </div>

          {/* Section 2: Checklist */}
          <div id="action-plan-checklist">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Actionable Checklist
                </span>
                {checklist.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium">
                    ({completedCount}/{checklist.length} done)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyChecklist}
                className="inline-flex items-center text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
                title="Copy checklist to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 mr-1" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400 mr-1" />
                    <span>Copy Checklist</span>
                  </>
                )}
              </button>
            </div>

            {/* Checklist items */}
            {checklist.length > 0 ? (
              <div className="space-y-2">
                {checklist.map((task, index) => {
                  const isDone = !!completedItems[index];
                  return (
                    <div
                      key={index}
                      onClick={() => toggleTask(index)}
                      className={`flex items-start space-x-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors select-none ${
                        isDone
                          ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-slate-400 focus:outline-hidden"
                        aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
                      >
                        {isDone ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <span className="font-semibold mr-1.5 text-slate-700">
                          {index + 1}.
                        </span>
                        <span>{task}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-200">
                No specific numbered checklist generated by backend for this entry.
              </p>
            )}
          </div>

          {/* Section 3 & 4: Deadline & Required Materials Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Deadline */}
            <div id="action-plan-deadline" className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-800 text-xs font-semibold uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Deadline</span>
              </div>
              <p className="text-xs text-slate-700 font-medium">
                {opportunity.action_plan?.deadline || opportunity.deadline || 'Not specified'}
              </p>
            </div>

            {/* Required Materials */}
            <div id="action-plan-materials" className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-800 text-xs font-semibold uppercase tracking-wider mb-1">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Required Materials</span>
              </div>
              {opportunity.action_plan?.required_materials &&
              opportunity.action_plan.required_materials.length > 0 ? (
                <ul className="text-xs text-slate-700 space-y-1">
                  {opportunity.action_plan.required_materials.map((mat, i) => (
                    <li key={i} className="flex items-center space-x-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                      <span>{mat}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Not specified by live source
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Source Link */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md border border-slate-200 hover:bg-white transition-colors"
          >
            Close
          </button>

          {opportunity.url && (
            <a
              href={opportunity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
            >
              <span>Open Original Opportunity</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-slate-300" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
