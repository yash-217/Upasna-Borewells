import React from 'react';
import { Droplets } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-black transition-colors p-4">
      
      {/* Logo Section */}
      <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mb-4 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/20 transform rotate-3 hover:rotate-6 transition-transform">
           <Droplets size={48} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">Upasna<span className="text-blue-600">Borewells</span></h1>
        <p className="text-slate-400 dark:text-neutral-500 mt-2 font-medium tracking-wide uppercase text-sm">Service & Management</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-neutral-800">
         <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Welcome</h2>
         <p className="text-slate-500 dark:text-neutral-400 mb-8">Please sign in to access the dashboard</p>
         
         <button 
           onClick={onLogin}
           className="w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-800 text-slate-700 dark:text-white border border-slate-300 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700 font-medium py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 touch-manipulation mb-4"
         >
           <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
           Sign in with Google
         </button>

         <div className="relative mb-4">
           <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-slate-200 dark:border-neutral-800"></div>
           </div>
           <div className="relative flex justify-center text-sm">
             <span className="px-2 bg-white dark:bg-neutral-900 text-slate-400">or</span>
           </div>
         </div>

         <p className="mt-6 text-xs text-slate-400 dark:text-neutral-500">Authorized personnel only.</p>
      </div>
    </div>
  );
};
