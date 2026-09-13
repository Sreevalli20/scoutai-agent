import { AuthSession, UserAccount, UserProfile } from '../types';
import { getApiBaseUrl } from './api';
import { DEFAULT_PROFILE } from './storage';

const STORAGE_KEYS = {
  SESSION: 'scoutai_auth_session',
  ACCOUNTS: 'scoutai_user_accounts',
};

interface StoredAccountRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  createdAt: string;
  profile: UserProfile;
}

/**
 * Hash password securely using Web Crypto API (SHA-256 + salt)
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getStoredAccounts(): StoredAccountRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredAccounts(accounts: StoredAccountRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

/**
 * Get currently authenticated session
 */
export function getActiveSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getCurrentUser(): UserAccount | null {
  const session = getActiveSession();
  return session ? session.user : null;
}

export function getAuthToken(): string | null {
  const session = getActiveSession();
  return session ? session.token : null;
}

export function saveActiveSession(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearActiveSession(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Sign up a new user
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  initialProfile?: Partial<UserProfile>
): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (!cleanName) {
    throw new Error('Please enter your full name.');
  }

  // 1. Try backend API first if online
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password,
        name: cleanName,
        profile: initialProfile || DEFAULT_PROFILE,
      }),
    });

    if (res.ok) {
      const data: AuthSession = await res.json();
      saveActiveSession(data);
      return data.user;
    }
  } catch {
    // Fallback to local secure store
  }

  // 2. Local secure account creation
  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.email === cleanEmail);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const profile: UserProfile = {
    ...DEFAULT_PROFILE,
    ...initialProfile,
  };

  const newAccountRecord: StoredAccountRecord = {
    id: userId,
    email: cleanEmail,
    name: cleanName,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    profile,
  };

  accounts.push(newAccountRecord);
  saveStoredAccounts(accounts);

  const user: UserAccount = {
    id: userId,
    email: cleanEmail,
    name: cleanName,
    createdAt: newAccountRecord.createdAt,
    profile,
  };

  const token = `token_${userId}_${Date.now()}`;
  saveActiveSession({ token, user });
  return user;
}

/**
 * Log in an existing user
 */
export async function logIn(email: string, password: string): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error('Please enter both email and password.');
  }

  // 1. Try backend API first if online
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    if (res.ok) {
      const data: AuthSession = await res.json();
      saveActiveSession(data);
      return data.user;
    }
  } catch {
    // Fallback to local secure store
  }

  // 2. Local secure verification
  const accounts = getStoredAccounts();
  const account = accounts.find((a) => a.email === cleanEmail);
  if (!account) {
    throw new Error('No account found with this email. Please sign up.');
  }

  const computedHash = await hashPassword(password, account.salt);
  if (computedHash !== account.passwordHash) {
    throw new Error('Invalid password. Please try again.');
  }

  const user: UserAccount = {
    id: account.id,
    email: account.email,
    name: account.name,
    createdAt: account.createdAt,
    profile: account.profile || DEFAULT_PROFILE,
  };

  const token = `token_${user.id}_${Date.now()}`;
  saveActiveSession({ token, user });
  return user;
}

/**
 * Log out
 */
export function logOut(): void {
  clearActiveSession();
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updatedProfile: Partial<UserProfile>,
  updatedName?: string
): Promise<UserAccount> {
  const session = getActiveSession();
  if (!session || session.user.id !== userId) {
    throw new Error('Not authenticated.');
  }

  // Update backend if available
  const baseUrl = getApiBaseUrl();
  try {
    await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        name: updatedName || session.user.name,
        profile: updatedProfile,
      }),
    });
  } catch {
    // fallback
  }

  // Update local accounts
  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.id === userId);
  const newName = updatedName ? updatedName.trim() : session.user.name;
  const newProfile: UserProfile = {
    ...session.user.profile,
    ...updatedProfile,
  };

  if (idx !== -1) {
    accounts[idx].name = newName;
    accounts[idx].profile = newProfile;
    saveStoredAccounts(accounts);
  }

  const updatedUser: UserAccount = {
    ...session.user,
    name: newName,
    profile: newProfile,
  };

  saveActiveSession({
    token: session.token,
    user: updatedUser,
  });

  return updatedUser;
}
