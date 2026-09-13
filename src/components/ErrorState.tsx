import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Server, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { ApiError } from '../services/api';

interface ErrorStateProps {
  error: ApiError | Error | null;
  onRetry: () => void;
  onOpenSettings: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  onOpenSettings,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  const isApiError = error instanceof ApiError;
  const status = isApiError ? error.status : undefined;
  const code = isApiError ? error.code : undefined;
  const details = isApiError ? error.details : undefined;

  let title = 'Research could not be completed';
  let description = error.message || 'An unexpected error occurred while communicating with the backend.';
  let remedyTip = 'Verify that your Python FastAPI server is running and accessible.';

  if (code === 'NETWORK_ERROR' || status === 0) {
    title = 'Backend Unavailable';
    description =
      'Could not reach the FastAPI backend server. The agent requires an active backend service to crawl live opportunity pages and reason on eligibility.';
    remedyTip =
      'Ensure your FastAPI backend is running (e.g. `uvicorn main:app --reload --port 8000`) and CORS is enabled.';
  } else if (status === 429 || code === 'RATE_LIMIT') {
    title = 'Rate Limit Reached';
    description = 'The research agent or scraping engine has hit a rate limit for live queries.';
    remedyTip = 'Please wait a moment before trying your research query again.';
  } else if (status === 404) {
    title = 'Research Endpoint Not Found';
    description = 'The backend endpoint /api/research was not found on the specified server.';
    remedyTip = 'Check your API base URL in Settings and verify the route matches the FastAPI contract.';
  } else if (code === 'CANCELLED') {
    title = 'Research Cancelled';
    description = 'The search operation was cancelled before completion.';
    remedyTip = 'Click Try Again whenever you are ready to restart.';
  }

  return (
    <div
      id="research-error-state"
      className="bg-white rounded-xl border border-rose-200/90 shadow-xs p-6 sm:p-8"
    >
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              {title}
            </h3>
            {status !== undefined && status > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-50 text-rose-800 border border-rose-200">
                HTTP {status}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {description}
          </p>

          <div className="mt-3 p-3 rounded-md bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
            <span className="font-semibold text-slate-900 block mb-0.5">Troubleshooting:</span>
            <span>{remedyTip}</span>
          </div>

          {/* Collapsible Technical Details */}
          {(details || code) && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center text-[11px] font-medium text-slate-500 hover:text-slate-800"
              >
                <span>Technical details</span>
                {showDetails ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </button>

              {showDetails && (
                <pre className="mt-1.5 p-2.5 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto">
                  {code ? `Code: ${code}\n` : ''}
                  {details || error.stack || 'No additional technical details.'}
                </pre>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="error-retry-btn"
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              <span>Try Again</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
            >
              <Server className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span>Configure Backend Endpoint</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
