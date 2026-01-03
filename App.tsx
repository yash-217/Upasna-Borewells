import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Wrench,
  Package,
  Users as UsersIcon,
  Menu,
  Droplets,
  Moon,
  Sun,
  LogOut,
  Truck,
  Eye,
  MapPin,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  PieChart,
  Plus
} from 'lucide-react';
import { ConfirmationModal } from './components/ConfirmationModal';
import type { Expense } from './components/Expenses';

const ServiceRequests = React.lazy(() => import('./components/ServiceRequests').then(module => ({ default: module.ServiceRequests })));
const CreateServiceRequest = React.lazy(() => import('./components/CreateServiceRequest').then(module => ({ default: module.CreateServiceRequest })));
const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Inventory = React.lazy(() => import('./components/Inventory').then(module => ({ default: module.Inventory })));
const Employees = React.lazy(() => import('./components/Employees').then(module => ({ default: module.Employees })));
const Expenses = React.lazy(() => import('./components/Expenses').then(module => ({ default: module.Expenses })));
const CreateExpense = React.lazy(() => import('./components/CreateExpense').then(module => ({ default: module.CreateExpense })));
import { Employee, Product, ServiceRequest, User, Vehicle } from './types';
import {
  supabase,
  mapProductFromDB, mapProductToDB,
  mapEmployeeFromDB, mapEmployeeToDB,
  mapRequestFromDB, mapRequestToDB,
  mapVehicleFromDB
} from './services/supabase';

enum View {
  DASHBOARD = 'Dashboard',
  REQUESTS = 'Service Requests',
  NEW_REQUEST = 'New Request',
  EXPENSES = 'Expenses',
  NEW_EXPENSE = 'New Expense',
  INVENTORY = 'Inventory',
  EMPLOYEES = 'Employees',  
}
// --- Slick Splash Screen Component ---
const SplashScreen = () => (
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

export default function App() {
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<string>('All Vehicles');
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const toastTimeoutRef = useRef<any>(null);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Touch Gesture State
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // Apply Dark Mode to HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth Initialization
  useEffect(() => {
    // 1. Check active session from LocalStorage (Persistence)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          name: session.user.user_metadata.full_name || 'User',
          email: session.user.email || '',
          photoURL: session.user.user_metadata.avatar_url,
          isGuest: false
        });
      }
      setIsAuthLoading(false);
    });

    // 2. Listen for auth changes (Sign In / Sign Out events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          name: session.user.user_metadata.full_name || 'User',
          email: session.user.email || '',
          photoURL: session.user.user_metadata.avatar_url,
          isGuest: false
        });
        setIsAuthLoading(false);
      } else if (!currentUser?.isGuest) {
        // Only clear if we aren't explicitly in guest mode
        setCurrentUser(null);
        setIsAuthLoading(false);
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [currentUser?.isGuest, queryClient]);

  // --- React Query Fetching ---

  const { data: requests = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_requests').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data.map(mapRequestFromDB);
    },
    enabled: !!currentUser,
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data.map(mapProductFromDB);
    },
    enabled: !!currentUser,
  });

  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (error) throw error;
      return data.map(mapEmployeeFromDB);
    },
    enabled: !!currentUser,
  });

  const { data: expenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data.map((e: any) => ({ ...e, amount: Number(e.amount) }));
    },
    enabled: !!currentUser,
  });

  const { data: vehicles = [], isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*').order('name');
      if (error) throw error;
      return data.map(mapVehicleFromDB);
    },
    enabled: !!currentUser,
  });

  // Combined Loading State
  const isLoading = isAuthLoading || (!!currentUser && (isRequestsLoading || isProductsLoading || isEmployeesLoading || isExpensesLoading || isVehiclesLoading));

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type, isVisible: true });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const handleLogin = async () => {
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Login failed:", error);
      showToast("Failed to login. Please try again.", "error");
    }
  };

  const handleGuestLogin = () => {
    setCurrentUser({
      name: 'Guest',
      email: 'guest@upasna.local',
      isGuest: true
    });
  };

  const handleLogout = async () => {
    if (currentUser?.isGuest) {
      setCurrentUser(null);
    } else {
      await supabase.auth.signOut();
    }
    queryClient.clear();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleResetFilters = () => {
    setVehicleFilter('All Vehicles');
  };

  // Confirmation Helpers
  const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));
  
  const triggerConfirm = (title: string, message: string, action: () => void) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        closeConfirm();
      }
    });
  };

  // --- CRUD Operations (Mutations) ---

  // Service Requests
  const addRequestMutation = useMutation({
    mutationFn: async (req: ServiceRequest) => {
      const dbData = mapRequestToDB(req);
      const { data, error } = await supabase.from('service_requests').insert(dbData).select().single();
      if (error) throw error;
      return mapRequestFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (error) => {
      console.error("Error adding request:", error);
      showToast("Error adding request", "error");
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: async (updatedReq: ServiceRequest) => {
      const dbData = mapRequestToDB(updatedReq);
      const { error } = await supabase.from('service_requests').update(dbData).eq('id', updatedReq.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (error) => {
      console.error("Error updating request:", error);
      showToast("Error updating request", "error");
    }
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (error) => {
      console.error("Error deleting request:", error);
      showToast("Error deleting request", "error");
    }
  });

  // Products
  const addProductMutation = useMutation({
    mutationFn: async (p: Product) => {
      const dbData = mapProductToDB(p);
      const { data, error } = await supabase.from('products').insert(dbData).select().single();
      if (error) throw error;
      return mapProductFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => console.error("Error adding product:", error)
  });

  const updateProductMutation = useMutation({
    mutationFn: async (p: Product) => {
      const dbData = mapProductToDB(p);
      const { error } = await supabase.from('products').update(dbData).eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => console.error("Error updating product:", error)
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => console.error("Error deleting product:", error)
  });

  // Employees
  const addEmployeeMutation = useMutation({
    mutationFn: async (e: Employee) => {
      const dbData = mapEmployeeToDB(e);
      const { data, error } = await supabase.from('employees').insert(dbData).select().single();
      if (error) throw error;
      return mapEmployeeFromDB(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    onError: (error) => console.error("Error adding employee:", error)
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (e: Employee) => {
      const dbData = mapEmployeeToDB(e);
      const { error } = await supabase.from('employees').update(dbData).eq('id', e.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    onError: (error) => console.error("Error updating employee:", error)
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    onError: (error) => console.error("Error deleting employee:", error)
  });

  // Expenses
  const addExpenseMutation = useMutation({
    mutationFn: async (exp: Expense) => {
      const { id, ...rest } = exp;
      const dbData = {
        ...rest,
        last_edited_by: currentUser?.name,
        last_edited_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('expenses').insert(dbData).select().single();
      if (error) throw error;
      return { ...data, amount: Number(data.amount) };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (error) => console.error("Error adding expense:", error)
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (error) => console.error("Error deleting expense:", error)
  });

  // --- Handler Adapters ---

  const handleAddRequest = (req: ServiceRequest) => addRequestMutation.mutate(req);
  const handleUpdateRequest = (req: ServiceRequest) => updateRequestMutation.mutate(req);
  const handleDeleteRequest = (id: string) => {
    triggerConfirm(
      "Delete Service Request",
      "Are you sure you want to delete this service request? This action cannot be undone.",
      () => deleteRequestMutation.mutate(id)
    );
  };

  const handleAddProduct = (p: Product) => addProductMutation.mutate(p);
  const handleUpdateProduct = (p: Product) => updateProductMutation.mutate(p);
  const handleDeleteProduct = (id: string) => {
    triggerConfirm(
      "Delete Product",
      "Are you sure you want to remove this product from inventory?",
      () => deleteProductMutation.mutate(id)
    );
  };

  const handleAddEmployee = (e: Employee) => addEmployeeMutation.mutate(e);
  const handleUpdateEmployee = (e: Employee) => updateEmployeeMutation.mutate(e);
  const handleDeleteEmployee = (id: string) => {
    triggerConfirm(
      "Remove Employee",
      "Are you sure you want to remove this employee record?",
      () => deleteEmployeeMutation.mutate(id)
    );
  };

  const handleAddExpense = (exp: Expense) => addExpenseMutation.mutate(exp);
  const handleDeleteExpense = (id: string) => deleteExpenseMutation.mutate(id);

  // Gesture Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe && !isSidebarOpen) {
      setSidebarOpen(true);
    }
    if (isLeftSwipe && isSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  // Login Screen
  if (!currentUser) {
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
             onClick={handleLogin}
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

           <button 
             onClick={handleGuestLogin}
             className="w-full flex items-center justify-center gap-2 text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white font-medium py-2 transition-colors text-sm"
           >
             <Eye size={16} />
             Continue as Guest (Read Only)
           </button>

           <p className="mt-6 text-xs text-slate-400 dark:text-neutral-500">Authorized personnel only.</p>
        </div>
      </div>
    );
  }

  const NavItem = ({ view, icon: Icon }: { view: View; icon: React.ElementType }) => (
    <button
      onClick={() => { setCurrentView(view); setSidebarOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-colors mb-1 touch-manipulation select-none ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-slate-600 dark:text-neutral-400 hover:bg-blue-50 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{view}</span>
    </button>
  );

  return (
    <div 
      className="min-h-screen bg-slate-50 dark:bg-black flex transition-colors duration-200 overflow-x-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Toast Notification */}
      <div className={`fixed top-4 right-4 z-[100] transition-all duration-300 transform ${toast.isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] ${
          toast.type === 'success' ? 'bg-green-600' : 
          toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <AlertCircle size={20} />}
          {toast.type === 'info' && <Info size={20} />}
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button 
            onClick={() => setToast(prev => ({ ...prev, isVisible: false }))}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
        isDangerous={true}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar (Desktop Nav + Mobile Settings Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center space-x-3 px-6 py-6 border-b border-slate-100 dark:border-neutral-800">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200 dark:shadow-none">
            <Droplets size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white leading-tight text-lg">Upasna<br/><span className="text-blue-600 dark:text-blue-400">Borewells</span></h1>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <NavItem view={View.DASHBOARD} icon={LayoutDashboard} />
          
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
          <NavItem view={View.INVENTORY} icon={Package} />
          <NavItem view={View.EMPLOYEES} icon={UsersIcon} />          
        </nav>

        <div className="border-t border-slate-100 dark:border-neutral-800 p-4 space-y-2 mt-auto">
           <button onClick={toggleDarkMode} className="w-full flex items-center space-x-3 px-4 py-3 text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-700 dark:hover:text-neutral-200 rounded-lg transition-colors touch-manipulation">
             {darkMode ? <Sun size={20} /> : <Moon size={20} />}
             <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
           </button>
           <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-slate-500 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors touch-manipulation">
             <LogOut size={20} />
             <span>Sign Out</span>
           </button>
           <div className="px-4 py-2 text-xs text-slate-400 dark:text-neutral-600 text-center">
             v1.8.0 &copy; 2024
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-black w-full lg:ml-72">
        {/* Header */}
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
                 <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden border border-slate-300 dark:border-neutral-700 flex items-center justify-center">
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

               <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-neutral-800">
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

        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-full min-h-[50vh]">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
          {currentView === View.DASHBOARD && (
            <div className="animate-in fade-in duration-500">
               <Dashboard requests={requests} employees={employees} expenses={expenses} vehicleFilter={vehicleFilter} />
            </div>
          )}
          {currentView === View.REQUESTS && (
            <div className="animate-in fade-in duration-500">
              <ServiceRequests 
                requests={requests} 
                products={products} 
                vehicles={vehicles}
                currentUser={currentUser}
                onAddRequest={handleAddRequest} 
                onUpdateRequest={handleUpdateRequest}
                onDeleteRequest={handleDeleteRequest}
                vehicleFilter={vehicleFilter}
                isReadOnly={currentUser.isGuest}
                onResetFilters={handleResetFilters}
                showToast={showToast}
              />
            </div>
          )}
          {currentView === View.NEW_REQUEST && (
            <div className="animate-in fade-in duration-500">
              <CreateServiceRequest
                products={products}
                vehicles={vehicles}
                currentUser={currentUser}
                onAddRequest={handleAddRequest}
                onCancel={() => setCurrentView(View.REQUESTS)}
                showToast={showToast}
              />
            </div>
          )}
          {currentView === View.INVENTORY && (
            <div className="animate-in fade-in duration-500">
              <Inventory 
                products={products} 
                currentUser={currentUser}
                onAddProduct={handleAddProduct} 
                onUpdateProduct={handleUpdateProduct} 
                onDeleteProduct={handleDeleteProduct}
                isReadOnly={currentUser.isGuest}
              />
            </div>
          )}
          {currentView === View.EMPLOYEES && (
            <div className="animate-in fade-in duration-500">
              <Employees 
                employees={employees} 
                vehicles={vehicles}
                currentUser={currentUser}
                onAddEmployee={handleAddEmployee} 
                onUpdateEmployee={handleUpdateEmployee} 
                onDeleteEmployee={handleDeleteEmployee}
                vehicleFilter={vehicleFilter}
                isReadOnly={currentUser.isGuest}
              />
            </div>
          )}
          {currentView === View.EXPENSES && (
            <div className="animate-in fade-in duration-500">
              <Expenses 
                expenses={expenses}
                vehicles={vehicles}
                onAdd={handleAddExpense}
                onDelete={handleDeleteExpense}
                isReadOnly={currentUser.isGuest}
                vehicleFilter={vehicleFilter}
                onResetFilters={handleResetFilters}
              />
            </div>
          )}
          {currentView === View.NEW_EXPENSE && (
             <div className="animate-in fade-in duration-500">
               <CreateExpense 
                 vehicles={vehicles}
                 onAdd={handleAddExpense}
                 onCancel={() => setCurrentView(View.EXPENSES)}
               />
             </div>
          )}
          </React.Suspense>
        </div>
      </main>
    </div>
  );
}