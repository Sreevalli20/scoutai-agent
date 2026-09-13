import React from 'react';
import {
  Compass,
  FileSearch,
  BrainCircuit,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';
import { StageInfo, StageState, WorkflowStage } from '../types';

interface WorkflowProgressProps {
  currentStage: WorkflowStage;
  stageStates: Record<WorkflowStage, StageState>;
  stageDetails?: Record<WorkflowStage, string>;
  activeMessage?: string;
  onCancel?: () => void;
  error?: string;
}

const STAGES: { id: WorkflowStage; title: string; defaultDesc: string }[] = [
  {
    id: 'discover',
    title: 'Discover',
    defaultDesc: 'Searching for relevant opportunities across live web indexes.',
  },
  {
    id: 'read',
    title: 'Read',
    defaultDesc: 'Reading live opportunity pages and extracting structured data.',
  },
  {
    id: 'reason',
    title: 'Reason',
    defaultDesc: 'Checking eligibility, requirements, and relevance against profile.',
  },
  {
    id: 'rank',
    title: 'Rank',
    defaultDesc: 'Comparing matching opportunities and computing objective fit scores.',
  },
  {
    id: 'act',
    title: 'Act',
    defaultDesc: 'Preparing recommended next steps, deadlines, and actionable checklist.',
  },
];

const STAGE_ICONS: Record<WorkflowStage, React.ComponentType<{ className?: string }>> = {
  discover: Compass,
  read: FileSearch,
  reason: BrainCircuit,
  rank: BarChart3,
  act: CheckCircle2,
};

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  currentStage,
  stageStates,
  stageDetails = {},
  activeMessage,
  onCancel,
  error,
}) => {
  const getStageBadge = (state: StageState) => {
    switch (state) {
      case 'completed':
        return (
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'active':
        return (
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs ring-4 ring-slate-100">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          </div>
        );
      case 'failed':
        return (
          <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div
      id="research-workflow-panel"
      className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Agent Pipeline Execution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Autonomous research workflow: Discover → Read → Reason → Rank → Act
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel Research
          </button>
        )}
      </div>

      {/* Stages List */}
      <div className="space-y-4">
        {STAGES.map((stage, idx) => {
          const state = stageStates[stage.id] || 'pending';
          const Icon = STAGE_ICONS[stage.id];
          const isCurrent = currentStage === stage.id && state === 'active';
          const detailText = stageDetails[stage.id] || stage.defaultDesc;

          return (
            <div
              key={stage.id}
              id={`workflow-stage-${stage.id}`}
              className={`flex items-start space-x-3.5 p-3 rounded-lg border transition-all ${
                isCurrent
                  ? 'bg-slate-50/90 border-slate-300 ring-1 ring-slate-200'
                  : state === 'completed'
                  ? 'bg-white border-slate-200/70'
                  : state === 'failed'
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-white/60 border-slate-100 opacity-65'
              }`}
            >
              {getStageBadge(state)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? 'text-slate-900'
                          : state === 'completed'
                          ? 'text-slate-800'
                          : state === 'failed'
                          ? 'text-rose-800'
                          : 'text-slate-500'
                      }`}
                    >
                      {idx + 1}. {stage.title}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded ${
                      state === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : state === 'active'
                        ? 'bg-slate-900 text-white'
                        : state === 'failed'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {state}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {detailText}
                </p>

                {isCurrent && activeMessage && (
                  <p className="text-[11px] text-emerald-700 font-mono mt-1.5 flex items-center">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping"></span>
                    {activeMessage}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Error Banner */}
      {error && (
        <div
          id="workflow-error-banner"
          className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2.5 text-xs text-rose-800"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Pipeline halted:</span> {error}
          </div>
        </div>
      )}
    </div>
  );
};
