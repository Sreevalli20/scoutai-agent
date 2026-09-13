import { Opportunity, SavedOpportunity } from '../types';
import { getApiBaseUrl } from './api';
import { getAuthToken } from './auth';

const STORAGE_KEY = 'scoutai_saved_opportunities';

export const DEFAULT_SUGGESTED_TAGS = ['Urgent', 'Long-term', 'Good Fit'];

export const TAG_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  Urgent: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Long-term': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Good Fit': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export function getTagBadgeStyle(tag: string): { bg: string; text: string; border: string } {
  if (TAG_COLOR_MAP[tag]) {
    return TAG_COLOR_MAP[tag];
  }
  // Deterministic neutral/slate styling for custom labels
  return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300/80' };
}

function getAllRawSaved(): SavedOpportunity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRaw(items: SavedOpportunity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

/**
 * Get saved opportunities filtered for a specific user (or guest)
 */
export function getSavedOpportunities(userId?: string): SavedOpportunity[] {
  const all = getAllRawSaved();
  const targetId = userId || 'guest';
  return all.filter((item) => item.userId === targetId);
}

export function isOpportunitySaved(opportunityId: string, userId?: string): boolean {
  const items = getSavedOpportunities(userId);
  return items.some((item) => item.opportunityId === opportunityId || item.opportunity.id === opportunityId);
}

export function getSavedOpportunity(opportunityId: string, userId?: string): SavedOpportunity | null {
  const items = getSavedOpportunities(userId);
  return items.find((item) => item.opportunityId === opportunityId || item.opportunity.id === opportunityId) || null;
}

/**
 * Save an opportunity with optional initial tags
 */
export function saveOpportunity(
  opportunity: Opportunity,
  userId?: string,
  initialTags: string[] = ['Good Fit']
): SavedOpportunity {
  const all = getAllRawSaved();
  const targetUser = userId || 'guest';

  const existingIdx = all.findIndex(
    (item) => item.userId === targetUser && (item.opportunityId === opportunity.id || item.opportunity.id === opportunity.id)
  );

  if (existingIdx !== -1) {
    return all[existingIdx];
  }

  const newSaved: SavedOpportunity = {
    id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: targetUser,
    opportunityId: opportunity.id,
    opportunity,
    savedAt: new Date().toISOString(),
    tags: initialTags.length > 0 ? initialTags : ['Good Fit'],
  };

  all.unshift(newSaved);
  saveRaw(all);

  // Sync to backend if token present
  syncToBackend('POST', newSaved);

  return newSaved;
}

/**
 * Remove an opportunity from saved
 */
export function unsaveOpportunity(opportunityId: string, userId?: string): void {
  const all = getAllRawSaved();
  const targetUser = userId || 'guest';

  const filtered = all.filter(
    (item) => !(item.userId === targetUser && (item.opportunityId === opportunityId || item.opportunity.id === opportunityId))
  );

  saveRaw(filtered);
  syncToBackend('DELETE', { opportunityId });
}

/**
 * Add a custom tag/label to a saved opportunity
 */
export function addTagToOpportunity(
  opportunityId: string,
  tag: string,
  userId?: string
): SavedOpportunity | null {
  const cleanTag = tag.trim();
  if (!cleanTag) return null;

  const all = getAllRawSaved();
  const targetUser = userId || 'guest';

  const idx = all.findIndex(
    (item) => item.userId === targetUser && (item.opportunityId === opportunityId || item.opportunity.id === opportunityId)
  );

  if (idx === -1) return null;

  if (!all[idx].tags.includes(cleanTag)) {
    all[idx].tags = [...all[idx].tags, cleanTag];
    saveRaw(all);
    syncToBackend('PUT', all[idx]);
  }

  return all[idx];
}

/**
 * Remove a custom tag from a saved opportunity
 */
export function removeTagFromOpportunity(
  opportunityId: string,
  tag: string,
  userId?: string
): SavedOpportunity | null {
  const all = getAllRawSaved();
  const targetUser = userId || 'guest';

  const idx = all.findIndex(
    (item) => item.userId === targetUser && (item.opportunityId === opportunityId || item.opportunity.id === opportunityId)
  );

  if (idx === -1) return null;

  all[idx].tags = all[idx].tags.filter((t) => t !== tag);
  saveRaw(all);
  syncToBackend('PUT', all[idx]);

  return all[idx];
}

/**
 * Set exact tags on a saved opportunity
 */
export function setOpportunityTags(
  opportunityId: string,
  tags: string[],
  userId?: string
): SavedOpportunity | null {
  const all = getAllRawSaved();
  const targetUser = userId || 'guest';

  const idx = all.findIndex(
    (item) => item.userId === targetUser && (item.opportunityId === opportunityId || item.opportunity.id === opportunityId)
  );

  if (idx === -1) return null;

  all[idx].tags = tags;
  saveRaw(all);
  syncToBackend('PUT', all[idx]);

  return all[idx];
}

/**
 * Update notes for a saved opportunity
 */
export function updateOpportunityNotes(
  opportunityId: string,
  notes: string,
  userId?: string
): SavedOpportunity | null {
  const all = getAllRawSaved();
  const targetUser = userId || 'guest';

  const idx = all.findIndex(
    (item) => item.userId === targetUser && (item.opportunityId === opportunityId || item.opportunity.id === opportunityId)
  );

  if (idx === -1) return null;

  all[idx].notes = notes;
  saveRaw(all);
  syncToBackend('PUT', all[idx]);

  return all[idx];
}

export const setOpportunityNotes = updateOpportunityNotes;

/**
 * Get list of all distinct tags currently in use by this user, combined with default suggestions
 */
export function getAllAvailableTags(userId?: string): string[] {
  const saved = getSavedOpportunities(userId);
  const tagSet = new Set<string>(DEFAULT_SUGGESTED_TAGS);

  saved.forEach((item) => {
    item.tags.forEach((t) => tagSet.add(t));
  });

  return Array.from(tagSet);
}

/**
 * Optional async sync to backend API if available
 */
async function syncToBackend(method: 'POST' | 'PUT' | 'DELETE', payload: any) {
  const token = getAuthToken();
  if (!token) return;

  const baseUrl = getApiBaseUrl();
  try {
    await fetch(`${baseUrl}/api/user/saved-opportunities`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Graceful offline behavior
  }
}
