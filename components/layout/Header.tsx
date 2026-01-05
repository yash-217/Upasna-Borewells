import React from 'react';
import { Menu, Droplets, Eye, Truck } from 'lucide-react';
import { User, Vehicle, View } from '../../types';

interface HeaderProps {
  setSidebarOpen: (isOpen: boolean) => void;
  currentUser: User;
  vehicleFilter: string;
  setVehicleFilter: (filter: string) => void;
  vehicles: Vehicle[];
  setCurrentView: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({
  setSidebarOpen,
  currentUser,
  vehicleFilter,
  setVehicleFilter,
  vehicles,
  setCurrentView
}) => {
  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 sticky top-0 z-30 transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 lg:px-8 py-3 gap-3">
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Left: Hamburger (For Settings on Mobile) & Title */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg touch-manipulation">
              <Menu size={24} />
            </button>
            {/* Mobile Brand Label instead of page title */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Droplets size={18} />
              </div>
              <span className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">Upasna<span className="text-blue-600 dark:text-blue-400">Borewells</span></span>
            </div>
          </div>
          
          {/* Mobile Right: Just Profile */}
          <div className="flex items-center gap-2 md:hidden">
             <div 
               onClick={() => setCurrentView(View.PROFILE)}
               className="h-9 w-9 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden border border-slate-300 dark:border-neutral-700 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
             >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : currentUser.isGuest ? (
                  <Eye size={16} className="text-slate-500 dark:text-neutral-400" />
                ) : (
                  <div className="text-slate-500 font-bold">{currentUser.name[0]}</div>
                )}
             </div>
          </div>
        </div>

        {/* Desktop: Filters & Profile */}
        <div className="hidden md:flex flex-1 flex-row items-center justify-end gap-6">
           <div className="flex items-center bg-slate-100 dark:bg-black rounded-lg px-3 py-2 border border-slate-200 dark:border-neutral-800">
              <Truck size={16} className="text-slate-500 dark:text-neutral-500 mr-2 shrink-0" />
              <select 
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 dark:text-neutral-300 w-48 cursor-pointer dark:bg-black focus:outline-none"
              >
                <option value="All Vehicles">All Vehicles</option>
                {vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
           </div>

           <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-neutral-800 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setCurrentView(View.PROFILE)}>
              <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">{currentUser.name}</span>
                  <span className="text-xs text-slate-500 dark:text-neutral-500">
                    {currentUser.isGuest ? 'Read Only Access' : currentUser.email}
                  </span>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden border border-slate-300 dark:border-neutral-700 flex items-center justify-center">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : currentUser.isGuest ? (
                  <Eye size={20} className="text-slate-500 dark:text-neutral-400" />
                ) : (
                  <div className="text-slate-500 font-bold">{currentUser.name[0]}</div>
                )}
              </div>
           </div>
        </div>
        
        {/* Mobile Filters (Below header) */}
        <div className="md:hidden">
           <div className="flex items-center bg-slate-100 dark:bg-neutral-800 rounded-lg px-3 py-2">
              <Truck size={16} className="text-slate-500 dark:text-neutral-500 mr-2 shrink-0" />
              <select 
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full bg-transparent border-none text-sm font-medium text-slate-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="All Vehicles">All Vehicles</option>
                {vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
           </div>
        </div>
      </div>
    </header>
  );
};
