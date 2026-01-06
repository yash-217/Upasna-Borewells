import React from 'react';
import { User, View } from '../../types';
import { Droplets, Wrench, PieChart, Info, ArrowRight } from 'lucide-react';

interface HomeProps {
  currentUser: User;
  setCurrentView: (view: View) => void;
}

export const Home: React.FC<HomeProps> = ({ currentUser, setCurrentView }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Welcome Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Welcome, <span className="opacity-90">{currentUser.name.split(' ')[0]}</span>!
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
            You are logged in as <span className="font-semibold uppercase text-xs bg-white/20 px-2 py-1 rounded ml-1">{currentUser.role}</span>.
            {currentUser.role === 'staff'
              ? " Access your assigned service requests and manage expenses efficiently."
              : " Manage operations, track performance, and oversee the entire borewell service workflow."}
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Service Requests Card */}
        <div
          onClick={() => setCurrentView(View.REQUESTS)}
          className="group bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-48"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Wrench size={32} />
            </div>
            <ArrowRight className="text-slate-300 dark:text-neutral-600 group-hover:text-blue-500 transition-colors" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Service Requests</h3>
            <p className="text-slate-500 dark:text-neutral-400 text-sm">
              View and update job status, details, and logs.
            </p>
          </div>
        </div>

        {/* Expenses Card */}
        <div
          onClick={() => setCurrentView(View.EXPENSES)}
          className="group bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-48"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
              <PieChart size={32} />
            </div>
            <ArrowRight className="text-slate-300 dark:text-neutral-600 group-hover:text-green-500 transition-colors" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Expenses</h3>
            <p className="text-slate-500 dark:text-neutral-400 text-sm">
              Record and track operational costs and fuel.
            </p>
          </div>
        </div>

      </div>

      {/* Company Info / Footer */}
      <div className="flex flex-col items-center justify-center pt-8 text-center text-slate-400 dark:text-neutral-500">
        <div className="w-16 h-1 bg-slate-100 dark:bg-neutral-800 rounded-full mb-4"></div>
        <div className="flex items-center gap-2 mb-2">
          <Droplets size={16} className="text-blue-500" />
          <span className="font-semibold text-slate-600 dark:text-neutral-400">Upasna Borewells Management System</span>
        </div>
        <p className="text-xs">
          &copy; {new Date().getFullYear()} All rights reserved. • Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};
