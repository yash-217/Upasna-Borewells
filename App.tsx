import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { SplashScreen } from './components/common/SplashScreen';
import { Login } from './components/auth/Login';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Toast } from './components/common/Toast';
import { useAppQuery } from './hooks/useAppQuery';
import { useAppMutations } from './hooks/useAppMutations';
import type { Expense } from './components/expenses/Expenses';

const ServiceRequests = React.lazy(() => import('./components/servicerequests/ServiceRequests').then(module => ({ default: module.ServiceRequests })));
const CreateServiceRequest = React.lazy(() => import('./components/servicerequests/CreateServiceRequest').then(module => ({ default: module.CreateServiceRequest })));
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const Inventory = React.lazy(() => import('./components/inventory/Inventory').then(module => ({ default: module.Inventory })));
const Employees = React.lazy(() => import('./components/employees/Employees').then(module => ({ default: module.Employees })));
const Expenses = React.lazy(() => import('./components/expenses/Expenses').then(module => ({ default: module.Expenses })));
const CreateExpense = React.lazy(() => import('./components/expenses/CreateExpense').then(module => ({ default: module.CreateExpense })));
const Home = React.lazy(() => import('./components/common/Home').then(module => ({ default: module.Home })));
import { Employee, Product, ServiceRequest, User, Vehicle, View } from './types';
import { supabase } from './services/supabase';


export default function App() {
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<View>(View.HOME);
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
    const ensureEmployeeExists = async (user: any) => {
      const email = user.email;
      const name = user.user_metadata.full_name || 'Unknown';
      
      // Check if exists
      const { data: existing } = await supabase
        .from('employees')
        .select('role')
        .eq('email', email)
        .single();

      if (existing) {
        return existing.role;
      }

      // Insert new
      const newEmployee = {
        name,
        email,
        designation: 'New Staff', // Default
        role: 'staff',
        phone: 'N/A',
        salary: 0,
        join_date: new Date().toISOString().split('T')[0],
        assigned_vehicle: null
      };

      const { error } = await supabase.from('employees').insert(newEmployee);
      if (error) {
          console.error("Error creating employee record:", error);
          return 'staff'; // Fallback
      }
      return 'staff';
    };

    // 1. Check active session from LocalStorage (Persistence)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const role = await ensureEmployeeExists(session.user);
        setCurrentUser({
          name: session.user.user_metadata.full_name || 'User',
          email: session.user.email || '',
          photoURL: session.user.user_metadata.avatar_url,
          isGuest: false,
          role: role as 'admin' | 'staff'
        });
      }
      setIsAuthLoading(false);
    });

    // 2. Listen for auth changes (Sign In / Sign Out events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const role = await ensureEmployeeExists(session.user);
        setCurrentUser({
          name: session.user.user_metadata.full_name || 'User',
          email: session.user.email || '',
          photoURL: session.user.user_metadata.avatar_url,
          isGuest: false,
          role: role as 'admin' | 'staff'
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
  const { 
    requests, 
    products, 
    employees, 
    expenses, 
    vehicles, 
    isLoading: isDataLoading 
  } = useAppQuery(currentUser);

  // Combined Loading State
  const isLoading = isAuthLoading || (!!currentUser && isDataLoading);

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
  const {
    addRequest, updateRequest, deleteRequest,
    addProduct, updateProduct, deleteProduct,
    addEmployee, updateEmployee, deleteEmployee,
    addExpense, deleteExpense
  } = useAppMutations({ queryClient, currentUser, showToast });

  // --- Handler Adapters ---

  const handleAddRequest = (req: ServiceRequest) => addRequest(req);
  const handleUpdateRequest = (req: ServiceRequest) => updateRequest(req);
  const handleDeleteRequest = (id: string) => {
    triggerConfirm(
      "Delete Service Request",
      "Are you sure you want to delete this service request? This action cannot be undone.",
      () => deleteRequest(id)
    );
  };

  const handleAddProduct = (p: Product) => addProduct(p);
  const handleUpdateProduct = (p: Product) => updateProduct(p);
  const handleDeleteProduct = (id: string) => {
    triggerConfirm(
      "Delete Product",
      "Are you sure you want to remove this product from inventory?",
      () => deleteProduct(id)
    );
  };

  const handleAddEmployee = (e: Employee) => addEmployee(e);
  const handleUpdateEmployee = (e: Employee) => updateEmployee(e);
  const handleDeleteEmployee = (id: string) => {
    triggerConfirm(
      "Remove Employee",
      "Are you sure you want to remove this employee record?",
      () => deleteEmployee(id)
    );
  };

  const handleAddExpense = (exp: Expense) => addExpense(exp);
  const handleDeleteExpense = (id: string) => deleteExpense(id);

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
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div 
      className="min-h-screen bg-slate-50 dark:bg-black flex transition-colors duration-200 overflow-x-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Toast Notification */}
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

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
      <Sidebar 
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-black w-full lg:ml-72">
        {/* Header */}
        <Header 
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
          vehicleFilter={vehicleFilter}
          setVehicleFilter={setVehicleFilter}
          vehicles={vehicles}
        />

        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-full min-h-[50vh]">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
          {currentView === View.HOME && (
             <div className="animate-in fade-in duration-500">
                <Home currentUser={currentUser} setCurrentView={setCurrentView} View={View} />
             </div>
          )}
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
                employees={employees}
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
                employees={employees}
                currentUser={currentUser}
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