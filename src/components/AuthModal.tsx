import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  MapPin,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount, UserProfile } from '../types';
import { logIn, signUp } from '../services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Profile fields on Sign Up
  const [educationStatus, setEducationStatus] = useState('Undergraduate Student');
  const [country, setCountry] = useState('India');
  const [skillsInput, setSkillsInput] = useState('Python, AI, Machine Learning');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const skills = skillsInput
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        const initialProfile: Partial<UserProfile> = {
          educationStatus,
          country,
          skills,
          experience: educationStatus.toLowerCase().includes('student')
            ? 'student'
            : 'entry',
        };

        const newUser = await signUp(email, password, name, initialProfile);
        onAuthSuccess(newUser);
        onClose();
      } else {
        const user = await logIn(email, password);
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="auth-modal"
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {mode === 'signin' ? 'Sign in to ScoutAI' : 'Create ScoutAI Account'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {mode === 'signin'
                  ? 'Access your saved opportunities & personalized research'
                  : 'Sync your opportunity labels, profile & history'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-name"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="auth-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                id="auth-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="auth-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
                className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Profile setup fields during Sign Up */}
          {mode === 'signup' && (
            <div className="pt-2 border-t border-slate-200/80 space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                <span>Eligibility & Research Profile</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="auth-country"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Country / Region
                  </label>
                  <input
                    type="text"
                    id="auth-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="auth-education"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Education Status
                  </label>
                  <input
                    type="text"
                    id="auth-education"
                    value={educationStatus}
                    onChange={(e) => setEducationStatus(e.target.value)}
                    placeholder="e.g. Undergraduate"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-skills"
                  className="block text-[11px] font-medium text-slate-600 mb-1"
                >
                  Key Skills (comma separated)
                </label>
                <input
                  type="text"
                  id="auth-skills"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="Python, AI, React"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              id="auth-submit-btn"
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer switch prompt */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          {mode === 'signin' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className="font-semibold text-slate-900 hover:underline"
              >
                Sign up now
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className="font-semibold text-slate-900 hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
