import { ResearchPreferences, UserProfile } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'scoutai_user_profile',
  PREFERENCES: 'scoutai_preferences',
};

export const DEFAULT_PROFILE: UserProfile = {
  country: 'India',
  educationStatus: 'Student',
  experience: 'student',
  skills: ['Python', 'AI', 'Machine Learning', 'Web Development'],
};

export const DEFAULT_PREFERENCES: ResearchPreferences = {
  preferredTypes: ['hackathon', 'internship', 'competition'],
  preferredLocations: ['India', 'Remote'],
  maxCost: 'either',
  participation: 'either',
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function loadUserPreferences(): ResearchPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: ResearchPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}
