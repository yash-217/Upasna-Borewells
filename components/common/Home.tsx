import React, { useMemo } from 'react';
import { User, View, ServiceRequest, Employee, ServiceStatus } from '../../types';
import { Droplets, Wrench, PieChart, ArrowRight, Users, Package, TrendingUp, CheckCircle, MapPin } from 'lucide-react';

interface HomeProps {
  currentUser: User;
  setCurrentView: (view: View) => void;
  requests?: ServiceRequest[];
  employees?: Employee[];
}

export const Home: React.FC<HomeProps> = ({ currentUser, setCurrentView, requests = [], employees = [] }) => {
  // Get current date formatted
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });

  // Stats
  const stats = useMemo(() => {
    const activeRequests = requests.filter(r => r.status === ServiceStatus.PENDING || r.status === ServiceStatus.IN_PROGRESS).length;
    const completedToday = requests.filter(r => r.status === ServiceStatus.COMPLETED && r.date === today.toISOString().split('T')[0]).length;
    const activeEmployees = employees.filter(e => e.status === 'active').length;

    return { activeRequests, completedToday, activeEmployees };
  }, [requests, employees]);

  // Get current user's assigned vehicle
  const currentEmployee = useMemo(() => {
    if (!currentUser.employeeId) return null;
    return employees.find(e => e.id === currentUser.employeeId);
  }, [employees, currentUser.employeeId]);

  // Recent activity (last 4 requests)
  const recentActivity = useMemo(() => {
    return [...requests]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [requests]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Page Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Welcome back, {currentUser.name.split(' ')[0]}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base">
          Here's your overview for <span className="font-semibold text-blue-600">{formattedDate}</span>
        </p>
      </div>

      {/* Dashboard Grid (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Quick Stats Widget (Span 2) */}
        <div className="md:col-span-2 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              Today's Overview
            </h3>
            <button onClick={() => setCurrentView(View.DASHBOARD)} className="text-sm font-semibold text-blue-600 hover:underline">
              View Dashboard
            </button>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 p-6 h-full flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-3xl font-black text-blue-600">{stats.activeRequests}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Active Jobs</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <p className="text-3xl font-black text-emerald-600">{stats.completedToday}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Completed Today</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-3xl font-black text-amber-600">{stats.activeEmployees}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Active Staff</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Widget */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              My Profile
            </h3>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 p-6 flex flex-col h-full justify-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-blue-500/10">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">{currentUser.role}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-neutral-800 p-3 rounded-lg text-center">
                <span className="block text-xs text-slate-500 dark:text-slate-400">Status</span>
                <span className="text-sm font-bold text-emerald-600">Active</span>
              </div>
              {currentUser.role === 'staff' ? (
                <div className="bg-slate-50 dark:bg-neutral-800 p-3 rounded-lg text-center">
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Vehicle</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                    {currentEmployee?.assignedVehicle || 'None'}
                  </span>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-neutral-800 p-3 rounded-lg text-center">
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Access</span>
                  <span className="text-sm font-bold capitalize">{currentUser.role}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Service Requests Card */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Wrench className="text-blue-600" size={20} />
              Service Requests
            </h3>
            <button onClick={() => setCurrentView(View.REQUESTS)} className="text-sm font-semibold text-blue-600 hover:underline">
              View All
            </button>
          </div>
          <div
            onClick={() => setCurrentView(View.REQUESTS)}
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 p-6 cursor-pointer hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                <Wrench size={24} />
              </div>
              <div className="p-2 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ArrowRight size={16} />
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              View and update job status, customer details, and service logs.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
              <span className="size-2 rounded-full bg-blue-600 animate-pulse"></span>
              {stats.activeRequests} active requests
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <PieChart className="text-blue-600" size={20} />
              Expenses
            </h3>
            <button onClick={() => setCurrentView(View.EXPENSES)} className="text-sm font-semibold text-blue-600 hover:underline">
              View All
            </button>
          </div>
          <div
            onClick={() => setCurrentView(View.EXPENSES)}
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 p-6 cursor-pointer hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                <PieChart size={24} />
              </div>
              <div className="p-2 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ArrowRight size={16} />
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Record and track operational costs, fuel, and maintenance.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
              <TrendingUp size={12} />
              Track expenses
            </div>
          </div>
        </div>

        {/* Inventory Card */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Package className="text-blue-600" size={20} />
              Inventory
            </h3>
            <button onClick={() => setCurrentView(View.INVENTORY)} className="text-sm font-semibold text-blue-600 hover:underline">
              Manage
            </button>
          </div>
          <div
            onClick={() => setCurrentView(View.INVENTORY)}
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800 p-6 cursor-pointer hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
              <div className="p-2 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <ArrowRight size={16} />
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Track equipment, pipes, motors, and spare parts.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
              <Package size={12} />
              Manage product catalog
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      {recentActivity.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Operational Feed</h2>
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800">
            <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-sm font-bold">Recent Service Requests</span>
              <button onClick={() => setCurrentView(View.REQUESTS)} className="text-xs font-bold text-blue-600 hover:underline">
                View All
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
              {recentActivity.map(req => (
                <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-full flex items-center justify-center ${req.status === ServiceStatus.COMPLETED
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                      : req.status === ServiceStatus.IN_PROGRESS
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      }`}>
                      {req.status === ServiceStatus.COMPLETED ? <CheckCircle size={20} /> : <Wrench size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{req.customerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin size={10} />
                        {req.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${req.status === ServiceStatus.COMPLETED
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : req.status === ServiceStatus.IN_PROGRESS
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                      {req.status}
                    </span>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{req.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
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
