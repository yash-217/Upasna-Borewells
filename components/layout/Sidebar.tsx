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
      className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-colors mb-1 touch-manipulation select-none ${currentView === view
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-slate-600 dark:text-neutral-400 hover:bg-blue-50 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{view}</span>
    </button>
  );

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl lg:shadow-none
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="flex items-center space-x-3 px-6 py-6 border-b border-slate-100 dark:border-neutral-800">
        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200 dark:shadow-none">
          <Droplets size={24} />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 dark:text-white leading-tight text-lg">Upasna<br /><span className="text-blue-600 dark:text-blue-400">Borewells</span></h1>
        </div>
      </div>

      {/* Sidebar Nav */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        <NavItem view={View.HOME} icon={HomeIcon} />

        {currentUser.role !== 'staff' && (
          <NavItem view={View.DASHBOARD} icon={LayoutDashboard} />
        )}

        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Services</p>
        </div>

        {!currentUser.isGuest && (
          <NavItem view={View.NEW_REQUEST} icon={Plus} />
        )}
        {!currentUser.isGuest && (
          <NavItem view={View.NEW_EXPENSE} icon={Plus} />
        )}

        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Manage</p>
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

      <div className="border-t border-slate-100 dark:border-neutral-800 p-4 mt-auto">
        <div className="px-4 py-2 text-xs text-slate-400 dark:text-neutral-600 text-center">
          v1.8.0 &copy; 2024
        </div>
      </div>
    </aside>
  );
};
