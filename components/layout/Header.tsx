import React from 'react';
import { Menu, Droplets, Eye, Truck } from 'lucide-react';
import { User, Vehicle, View } from '../../types';

interface HeaderProps {
  setSidebarOpen: (isOpen: boolean) => void;
  currentUser: User;
  currentView: View;
  vehicleFilter: string;
  setVehicleFilter: (filter: string) => void;
  vehicles: Vehicle[];
  setCurrentView: (view: View) => void;
}

// Views where vehicle filter should be shown
const FILTER_VIEWS = [View.REQUESTS, View.EMPLOYEES, View.EXPENSES, View.DASHBOARD];

export const Header: React.FC<HeaderProps> = ({
  setSidebarOpen,
  currentUser,
  currentView,
  vehicleFilter,
  setVehicleFilter,
  vehicles,
  setCurrentView
}) => {
  const showFilter = FILTER_VIEWS.includes(currentView);
  return (
    <header className="sticky top-0 z-30 px-4 py-3 lg:px-8 lg:py-4 transition-all duration-200">
      <div className="glass dark:glass-dark rounded-2xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Left: Hamburger (For Settings on Mobile) & Title */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl touch-manipulation">
              <Menu size={24} />
            </button>
            {/* Mobile Brand Label instead of page title */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="bg-brand-600 p-1.5 rounded-lg text-white">
                <Droplets size={18} />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">Upasna<span className="text-brand-600 dark:text-brand-400">Borewells</span></span>
            </div>

            {/* Desktop Title Hint */}
            <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{currentView}</h2>
            </div>
          </div>

          {/* Mobile Right: Just Profile */}
          <div className="flex items-center gap-2 md:hidden">
            <div
              onClick={() => setCurrentView(View.PROFILE)}
              className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden border-2 border-white dark:border-white/10 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            >
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : currentUser.isGuest ? (
                <Eye size={18} className="text-slate-500 dark:text-slate-400" />
              ) : (
                <div className="text-slate-500 dark:text-white font-bold">{currentUser.name[0]}</div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: Filters & Profile */}
        <div className="hidden md:flex flex-1 flex-row items-center justify-end gap-6">
          {showFilter && (
            <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg px-4 py-2.5 border border-slate-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors shadow-sm">
              <Truck size={16} className="text-blue-600 mr-2 shrink-0" />
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-800 dark:text-white w-44 cursor-pointer focus:outline-none"
              >
                <option value="All Vehicles">All Vehicles</option>
                {vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>
          )}

          <div className="h-8 w-px bg-slate-200 dark:bg-white/10"></div>

          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity p-1.5 pr-2 rounded-full hover:bg-slate-50 dark:hover:bg-white/5"
            onClick={() => setCurrentView(View.PROFILE)}
          >
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{currentUser.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${currentUser.isGuest ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                {currentUser.role}
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden border-2 border-white dark:border-white/10 shadow-sm flex items-center justify-center">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : currentUser.isGuest ? (
                <Eye size={20} className="text-slate-500 dark:text-slate-400" />
              ) : (
                <div className="text-slate-500 dark:text-white font-bold">{currentUser.name[0]}</div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filters (Below header content) */}
        {showFilter && (
          <div className="md:hidden mt-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
            <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg px-3 py-2.5 border border-slate-200 dark:border-neutral-700 shadow-sm">
              <Truck size={16} className="text-blue-600 mr-2 shrink-0" />
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full bg-transparent border-none text-sm font-medium text-slate-800 dark:text-white focus:outline-none"
              >
                <option value="All Vehicles">All Vehicles</option>
                {vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
