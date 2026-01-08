import React from 'react';
import {
  LayoutDashboard,
  Wrench,
  Package,
  Users as UsersIcon,
  Droplets,
  PieChart,
  Plus,
  Home as HomeIcon
} from 'lucide-react';
import { View, User } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentView: View;
  setCurrentView: (view: View) => void;
  currentUser: User;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  currentView,
  setCurrentView,
  currentUser
}) => {
  const NavItem = ({ view, icon: Icon }: { view: View; icon: React.ElementType }) => (
    <button
      onClick={() => { setCurrentView(view); setIsOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 mb-2 group relative overflow-hidden ${currentView === view
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
        : 'text-slate-600 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-white/5 hover:text-brand-600 dark:hover:text-brand-400'
        }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 transition-opacity duration-300 ${currentView === view ? 'opacity-100' : ''}`} />
      <Icon size={20} className={`relative z-10 transition-transform duration-300 ${currentView !== view && 'group-hover:scale-110'}`} />
      <span className="font-medium relative z-10">{view}</span>
      {currentView === view && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full" />
      )}
    </button>
  );

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out flex flex-col
      lg:m-4 lg:h-[calc(100vh-2rem)] lg:rounded-3xl lg:border lg:border-white/20 lg:shadow-2xl
      bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-slate-200 dark:border-white/5
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="flex items-center space-x-3 px-6 py-8">
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-2.5 rounded-xl text-white shadow-lg shadow-brand-500/30">
          <Droplets size={24} className="animate-pulse-slow" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white leading-tight text-xl tracking-tight">Upasna<br /><span className="text-brand-600 dark:text-brand-400">Borewells</span></h1>
        </div>
      </div>

      {/* Sidebar Nav */}
      <nav className="flex-1 px-4 overflow-y-auto scrollbar-hide space-y-1">
        <NavItem view={View.HOME} icon={HomeIcon} />

        {currentUser.role !== 'staff' && (
          <NavItem view={View.DASHBOARD} icon={LayoutDashboard} />
        )}

        <div className="pt-6 pb-3 px-4">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Services</p>
        </div>

        {!currentUser.isGuest && (
          <NavItem view={View.NEW_REQUEST} icon={Plus} />
        )}
        {!currentUser.isGuest && (
          <NavItem view={View.NEW_EXPENSE} icon={Plus} />
        )}

        <div className="pt-6 pb-3 px-4">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Manage</p>
        </div>
        <NavItem view={View.REQUESTS} icon={Wrench} />
        <NavItem view={View.EXPENSES} icon={PieChart} />
        {currentUser.role !== 'staff' && (
          <>
            <NavItem view={View.INVENTORY} icon={Package} />
            <NavItem view={View.EMPLOYEES} icon={UsersIcon} />
          </>
        )}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-brand-50/50 dark:bg-white/5 rounded-2xl p-4 border border-brand-100/50 dark:border-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>v1.8.0</span>
            <span>&copy; 2024</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
