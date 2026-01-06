import React, { useState } from 'react';
import { Droplets, Mail, Lock, Loader2, AlertCircle, User as UserIcon, Phone } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const fullEmail = `${username}@upasnaborewells.com`;

        // 1. Domain Validation (Implicit by design, but good to double check)
        if (!fullEmail.endsWith('@upasnaborewells.com')) {
          throw new Error('Registration is restricted to @upasnaborewells.com emails only.');
        }

        // 2. Sign Up with Metadata
        const { data, error } = await supabase.auth.signUp({
          email: fullEmail,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone
            }
          }
        });
        if (error) throw error;

        if (data.session) {
          // Session created immediately (Email confirmation disabled)
          // App.tsx listener will handle the redirect.
        } else {
          // Account created but maybe waiting for something else, or just switch to login
          setIsSignUp(false);
          setEmail(fullEmail);
          setMessage('Account created successfully! You can now sign in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Successful login will be handled by the auth state listener in App.tsx
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during authentication';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setMessage(null);
    if (isSignUp) {
      // Switching to Login: Pre-fill email if username was typed
      if (username) setEmail(`${username}@upasnaborewells.com`);
    } else {
      // Switching to SignUp: Extract username if email matches domain
      if (email.endsWith('@upasnaborewells.com')) {
        setUsername(email.split('@')[0]);
      } else {
        setUsername('');
      }
    }
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-black transition-colors p-4">

      {/* Logo Section */}
      <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-4 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/20 transform rotate-3 hover:rotate-6 transition-transform">
          <Droplets size={40} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Upasna<span className="text-blue-600">Borewells</span></h1>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 dark:border-neutral-800">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome'}
          </h2>
          <p className="text-slate-500 dark:text-neutral-400 text-sm">
            {isSignUp ? 'Join the team management portal' : 'Please sign in to continue'}
          </p>
        </div>

        {/* Error & Message Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-start gap-3 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg text-sm text-green-600 dark:text-green-400 text-center">
            {message}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">

          {/* Additional Fields for Sign Up */}
          {isSignUp && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1 ml-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input
                    type="tel"
                    required={isSignUp}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1 ml-1">
              {isSignUp ? 'Username' : 'Email Address'}
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 text-slate-400 z-10" size={18} />
              {isSignUp ? (
                <>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
                    className="w-full pl-10 pr-[180px] py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                    placeholder="username"
                  />
                  <span className="absolute right-4 text-slate-400 dark:text-neutral-500 text-sm font-medium pointer-events-none select-none">
                    @upasnaborewells.com
                  </span>
                </>
              ) : (
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                  placeholder="name@upasnaborewells.com"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-white dark:bg-neutral-900 text-slate-400">Or continue with</span>
          </div>
        </div>

        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-800 text-slate-700 dark:text-white border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700 font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 touch-manipulation mb-6"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Google
        </button>

        <div className="text-center">
          <button
            onClick={toggleMode}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
