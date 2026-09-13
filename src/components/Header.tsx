import React from 'react';
import {
  Compass,
  History,
  Settings,
  User,
  Radio,
  ArrowRight,
  Bookmark,
  LogIn,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { BackendHealth, UserAccount, UserProfile } from '../types';

interface HeaderProps {
  backendHealth: BackendHealth | null;
  userProfile: UserProfile;
  currentUser: UserAccount | null;
  historyCount: number;
  savedCount: number;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenSaved: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  backendHealth,
  userProfile,
  currentUser,
  historyCount,
  savedCount,
  onOpenHistory,
  onOpenSettings,
  onOpenProfile,
  onOpenSaved,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header
      id="scoutai-header"
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Concept */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 tracking-tight text-lg">
                  ScoutAI
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                  Autonomous Agent
                </span>
              </div>
              <p className="text-[12px] text-slate-500 font-normal leading-none mt-0.5">
                Autonomous Opportunity Research
              </p>
            </div>
          </div>

          {/* Workflow Concept Indicator: READ -> REASON -> ACT */}
          <div
            id="workflow-concept-badge"
            className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-600"
            title="Core agent methodology: Read live web pages, reason on eligibility, act on concrete steps"
          >
            <span className="text-slate-800 font-semibold tracking-wide">READ</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 font-semibold tracking-wide">REASON</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="text-emerald-700 font-semibold tracking-wide">ACT</span>
          </div>
        </div>

        {/* Right: Controls, Saved, History & Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Backend Connection Status Badge */}
          <button
            id="header-backend-status"
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs rounded-md font-medium border transition-colors hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-slate-400 text-slate-700 border-slate-200"
            title={`Backend: ${backendHealth ? (backendHealth.connected ? 'Connected' : 'Offline / Not connected') : 'Checking...'}`}
            aria-label="Backend status"
          >
            <span className="relative flex h-2 w-2">
              {backendHealth?.connected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              )}
            </span>
            <span className="hidden sm:inline text-[12px]">
              {backendHealth?.connected ? 'Backend Active' : 'Backend Disconnected'}
            </span>
          </button>

          {/* Saved Opportunities Button */}
          <button
            id="header-saved-btn"
            onClick={onOpenSaved}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            aria-label="Saved Opportunities"
            title="Saved Opportunities & Labels"
          >
            <Bookmark className="w-4 h-4" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-[10px] font-semibold text-white flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </button>

          {/* Search History Button */}
          <button
            id="header-history-btn"
            onClick={onOpenHistory}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            aria-label="Search History"
            title="Research History"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-slate-900 text-[10px] font-semibold text-white flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            id="header-settings-btn"
            onClick={onOpenSettings}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            aria-label="Settings"
            title="Research & API Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Auth / Account Profile */}
          {currentUser ? (
            <div className="flex items-center space-x-1.5 pl-1">
              <button
                id="header-profile-btn"
                onClick={onOpenProfile}
                className="flex items-center space-x-2 pl-2 pr-2.5 py-1 text-xs text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors focus:outline-hidden"
                aria-label="Manage Account Profile"
                title={`Logged in as ${currentUser.name} (${currentUser.email})`}
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline font-semibold text-[12px] truncate max-w-28">
                  {currentUser.name}
                </span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="header-auth-btn"
              onClick={onOpenAuth}
              className="inline-flex items-center px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors space-x-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
