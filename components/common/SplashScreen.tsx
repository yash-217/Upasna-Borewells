import React from 'react';
import { Droplets } from 'lucide-react';

export const SplashScreen = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-black transition-colors duration-500">
    <div className="relative flex flex-col items-center">
      {/* Animated Logo Container */}
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 bg-blue-600 rounded-3xl rotate-3 opacity-20 animate-pulse"></div>
        <div className="absolute inset-0 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-400/30 dark:shadow-blue-900/30 transform transition-transform animate-bounce-slight">
          <Droplets size={48} className="text-white animate-pulse" />
        </div>
      </div>
      
      {/* Branding Text */}
      <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Upasna<span className="text-blue-600">Borewells</span>
        </h1>
        <p className="text-slate-400 dark:text-neutral-500 font-medium tracking-widest uppercase text-xs">
          Management System
        </p>
      </div>

      {/* Loading Bar */}
      <div className="mt-12 w-48 h-1 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 animate-progress-indeterminate rounded-full"></div>
      </div>
    </div>
  </div>
);
