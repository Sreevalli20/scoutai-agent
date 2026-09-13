import {
  BackendHealth,
  HistoryItem,
  ResearchRequest,
  ResearchResponse,
  ResearchStatusResponse,
} from '../types';
import { getAuthToken } from './auth';

const STORAGE_KEYS = {
  API_BASE_URL: 'scoutai_api_base_url',
  SEARCH_HISTORY: 'scoutai_search_history',
  USER_PROFILE: 'scoutai_user_profile',
  PREFERENCES: 'scoutai_user_preferences',
};

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: string;

  constructor(message: string, status?: number, code?: string, details?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Returns the configured base URL for the FastAPI backend.
 * Checks localStorage first, then VITE_API_BASE_URL, with a fallback to http://localhost:8000.
 */
export function getApiBaseUrl(): string {
  const customUrl = localStorage.getItem(STORAGE_KEYS.API_BASE_URL);
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/+$/, '');
  }

  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return 'http://localhost:8000';
}

/**
 * Updates the custom backend base URL in client storage.
 */
export function setApiBaseUrl(url: string): void {
  const sanitized = url.trim().replace(/\/+$/, '');
  if (!sanitized) {
    localStorage.removeItem(STORAGE_KEYS.API_BASE_URL);
  } else {
    localStorage.setItem(STORAGE_KEYS.API_BASE_URL, sanitized);
  }
}

/**
 * Performs a real health check ping against the configured FastAPI backend.
 * Tries /api/health or /health or /api/status.
 */
export async function checkBackendHealth(): Promise<BackendHealth> {
  const baseUrl = getApiBaseUrl();
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    }).catch(async () => {
      // Fallback to /health if /api/health returns 404/network
      return await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    });

    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - startTime);

    if (res.ok) {
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { status: 'ok' };
      }
      return {
        connected: true,
        checkedAt: new Date().toISOString(),
        endpoint: baseUrl,
        statusMessage: data.status || data.message || 'Connected - FastAPI Backend Active',
        latencyMs: latency,
        version: data.version,
      };
    } else {
      return {
        connected: false,
        checkedAt: new Date().toISOString(),
        endpoint: baseUrl,
        statusMessage: `Backend responded with HTTP status ${res.status}: ${res.statusText}`,
        latencyMs: latency,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      checkedAt: new Date().toISOString(),
      endpoint: baseUrl,
      statusMessage:
        err.name === 'AbortError'
          ? `Connection timed out after 4000ms at ${baseUrl}`
          : `Offline / Connection refused at ${baseUrl}`,
    };
  }
}

/**
 * Submits a real research request to POST /api/research on the FastAPI backend.
 */
export async function submitResearch(
  request: ResearchRequest,
  signal?: AbortSignal
): Promise<ResearchResponse> {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/research`;

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      signal,
    });
  } catch (networkError: any) {
    if (networkError.name === 'AbortError') {
      throw new ApiError('Research request was cancelled by user.', 0, 'CANCELLED');
    }
    throw new ApiError(
      `Failed to connect to backend at ${baseUrl}. Ensure the FastAPI server is running with CORS enabled.`,
      0,
      'NETWORK_ERROR',
      networkError.message
    );
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }

    if (response.status === 429) {
      throw new ApiError(
        'Research rate limit reached. Please wait before issuing another query.',
        429,
        'RATE_LIMIT',
        errorDetail
      );
    } else if (response.status === 404) {
      throw new ApiError(
        `Endpoint /api/research was not found on ${baseUrl}. Verify FastAPI routing.`,
        404,
        'NOT_FOUND',
        errorDetail
      );
    } else if (response.status === 422) {
      throw new ApiError(
        'Invalid research request schema sent to backend.',
        422,
        'VALIDATION_ERROR',
        errorDetail
      );
    }

    throw new ApiError(
      `Backend error (${response.status}): ${errorDetail || response.statusText}`,
      response.status,
      'BACKEND_ERROR',
      errorDetail
    );
  }

  const data: ResearchResponse = await response.json();
  return data;
}

/**
 * Polls status for asynchronous or long-running research jobs.
 * GET /api/research/{research_id}/status
 */
export async function pollResearchStatus(
  researchId: string,
  signal?: AbortSignal
): Promise<ResearchStatusResponse> {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/research/${encodeURIComponent(researchId)}/status`;

  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal,
    });

    if (!res.ok) {
      throw new ApiError(
        `Failed to retrieve research status: HTTP ${res.status}`,
        res.status,
        'STATUS_ERROR'
      );
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      `Status polling error: ${err.message}`,
      0,
      'POLL_NETWORK_ERROR'
    );
  }
}

/**
 * Client-side History management associated with individual accounts
 */
export function getStoredHistory(userId?: string): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    if (!raw) return [];
    const parsed: HistoryItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const targetUser = userId || 'guest';
    return parsed.filter((item) => (item.userId || 'guest') === targetUser);
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: HistoryItem, userId?: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    const allHistory: HistoryItem[] = raw ? JSON.parse(raw) : [];
    const targetUser = userId || item.userId || 'guest';
    const normalizedItem: HistoryItem = {
      ...item,
      userId: targetUser,
    };

    // Filter out duplicate ID and prepend
    const updated = [
      normalizedItem,
      ...allHistory.filter((h) => h.id !== normalizedItem.id),
    ].slice(0, 100);

    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updated));
  } catch {
    // ignore storage quota errors
  }
}

export function clearStoredHistory(userId?: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    if (!raw) return;
    const allHistory: HistoryItem[] = JSON.parse(raw);
    const targetUser = userId || 'guest';
    const remaining = allHistory.filter((item) => (item.userId || 'guest') !== targetUser);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(remaining));
  } catch {
    // ignore
  }
}
