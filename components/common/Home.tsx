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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/2 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight font-sans">
            Welcome, <span className="text-brand-100">{currentUser.name.split(' ')[0]}</span>
          </h1>
          <p className="text-brand-50 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
            You are logged in as <span className="font-semibold uppercase text-xs bg-white/20 px-2.5 py-1 rounded-lg ml-1 backdrop-blur-md border border-white/10">{currentUser.role}</span>.
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
          className="group glass dark:glass-dark p-8 rounded-3xl cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border-white/40 dark:border-white/5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent dark:from-brand-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="relative z-10 flex justify-between items-start mb-8">
            <div className="p-4 bg-brand-50 dark:bg-brand-900/30 rounded-2xl text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <Wrench size={32} />
            </div>
            <div className="p-2 rounded-full bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300">
              <ArrowRight size={20} />
            </div>
          </div>

          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Service Requests</h3>
            <p className="text-slate-500 dark:text-slate-400">
              View and update job status, details, and logs.
            </p>
          </div>
        </div>

        {/* Expenses Card */}
        <div
          onClick={() => setCurrentView(View.EXPENSES)}
          className="group glass dark:glass-dark p-8 rounded-3xl cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border-white/40 dark:border-white/5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="relative z-10 flex justify-between items-start mb-8">
            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <PieChart size={32} />
            </div>
            <div className="p-2 rounded-full bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
              <ArrowRight size={20} />
            </div>
          </div>

          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Expenses</h3>
            <p className="text-slate-500 dark:text-slate-400">
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
