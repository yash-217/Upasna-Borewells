import React, { useState, useEffect, useRef } from 'react';
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
  Loader2
} from 'lucide-react';
import { ServiceRequests } from './components/ServiceRequests';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Employees } from './components/Employees';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Employee, Product, ServiceRequest, User } from './types';
import { VEHICLES } from './constants';
import { 
  supabase, 
  mapProductFromDB, mapProductToDB, 
  mapEmployeeFromDB, mapEmployeeToDB, 
  mapRequestFromDB, mapRequestToDB 
} from './services/supabase';

enum View {
  DASHBOARD = 'Dashboard',
  REQUESTS = 'Service Requests',
  INVENTORY = 'Inventory',
  EMPLOYEES = 'Employees'
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<string>('All Vehicles');
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Data State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

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

  // Auth & Data Initialization
  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          name: session.user.user_metadata.full_name || 'User',
          email: session.user.email || '',
          photoURL: session.user.user_metadata.avatar_url
        });
        fetchData();
      } else {
        setIsLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          name: session.user.user_metadata.full_name || 'User',
          email: session.user.email || '',
          photoURL: session.user.user_metadata.avatar_url
        });
        fetchData();
      } else {
        setCurrentUser(null);
        setRequests([]);
        setProducts([]);
        setEmployees([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, prodRes, empRes] = await Promise.all([
        supabase.from('service_requests').select('*').order('date', { ascending: false }),
        supabase.from('products').select('*').order('name'),
        supabase.from('employees').select('*').order('name')
      ]);

      if (reqRes.data) setRequests(reqRes.data.map(mapRequestFromDB));
      if (prodRes.data) setProducts(prodRes.data.map(mapProductFromDB));
      if (empRes.data) setEmployees(empRes.data.map(mapEmployeeFromDB));
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Login failed:", error);
      alert("Failed to login. Please try again.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
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

  // --- CRUD Operations ---

  // Service Requests
  const handleAddRequest = async (req: ServiceRequest) => {
    const dbData = mapRequestToDB(req);
    // Remove ID to let DB generate it
    const { data, error } = await supabase.from('service_requests').insert(dbData).select().single();
    if (error) {
      console.error("Error adding request:", error);
      return;
    }
    if (data) {
      setRequests([mapRequestFromDB(data), ...requests]);
    }
  };

  const handleUpdateRequest = async (updatedReq: ServiceRequest) => {
    const dbData = mapRequestToDB(updatedReq);
    const { error } = await supabase.from('service_requests').update(dbData).eq('id', updatedReq.id);
    if (error) {
      console.error("Error updating request:", error);
      return;
    }
    setRequests(requests.map(r => r.id === updatedReq.id ? updatedReq : r));
  };

  const handleDeleteRequest = (id: string) => {
    triggerConfirm(
      "Delete Service Request",
      "Are you sure you want to delete this service request? This action cannot be undone.",
      async () => {
        const { error } = await supabase.from('service_requests').delete().eq('id', id);
        if (!error) {
          setRequests(requests.filter(r => r.id !== id));
        }
      }
    );
  };

  // Products
  const handleAddProduct = async (p: Product) => {
    const dbData = mapProductToDB(p);
    const { data, error } = await supabase.from('products').insert(dbData).select().single();
    if (error) {
      console.error("Error adding product:", error);
      return;
    }
    if (data) {
      setProducts([...products, mapProductFromDB(data)]);
    }
  };

  const handleUpdateProduct = async (p: Product) => {
    const dbData = mapProductToDB(p);
    const { error } = await supabase.from('products').update(dbData).eq('id', p.id);
    if (!error) {
      setProducts(products.map(pr => pr.id === p.id ? p : pr));
    }
  };

  const handleDeleteProduct = (id: string) => {
    triggerConfirm(
      "Delete Product",
      "Are you sure you want to remove this product from inventory?",
      async () => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) {
          setProducts(products.filter(p => p.id !== id));
        }
      }
    );
  };

  // Employees
  const handleAddEmployee = async (e: Employee) => {
    const dbData = mapEmployeeToDB(e);
    const { data, error } = await supabase.from('employees').insert(dbData).select().single();
    if (error) {
      console.error("Error adding employee:", error);
      return;
    }
    if (data) {
      setEmployees([...employees, mapEmployeeFromDB(data)]);
    }
  };

  const handleUpdateEmployee = async (e: Employee) => {
    const dbData = mapEmployeeToDB(e);
    const { error } = await supabase.from('employees').update(dbData).eq('id', e.id);
    if (!error) {
      setEmployees(employees.map(emp => emp.id === e.id ? e : emp));
    }
  };

  const handleDeleteEmployee = (id: string) => {
    triggerConfirm(
      "Remove Employee",
      "Are you sure you want to remove this employee record?",
      async () => {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (!error) {
          setEmployees(employees.filter(e => e.id !== id));
        }
      }
    );
  };

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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-black">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-slate-500 dark:text-neutral-400 font-medium">Loading Upasna Manager...</p>
      </div>
    );
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
           <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Welcome Back</h2>
           <p className="text-slate-500 dark:text-neutral-400 mb-8">Please sign in to access the dashboard</p>
           
           <button 
             onClick={handleLogin}
             className="w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-800 text-slate-700 dark:text-white border border-slate-300 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700 font-medium py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 touch-manipulation"
           >
             <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
             Sign in with Google
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

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl lg:shadow-none
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

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <NavItem view={View.DASHBOARD} icon={LayoutDashboard} />
          <NavItem view={View.REQUESTS} icon={Wrench} />
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
             v1.5.0 &copy; 2024
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-black w-full">
        {/* Header */}
        <header className="bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 sticky top-0 z-30 transition-all duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between px-4 lg:px-8 py-3 gap-3">
            <div className="flex items-center justify-between w-full md:w-auto">
              {/* Left: Hamburger & Title */}
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg touch-manipulation">
                  <Menu size={24} />
                </button>
                <div className="lg:hidden font-semibold text-slate-800 dark:text-white truncate max-w-[200px]">
                  {currentView}
                </div>
              </div>
              
              {/* Mobile Right: Just Profile */}
              <div className="flex items-center gap-2 md:hidden">
                 <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden border border-slate-300 dark:border-neutral-700">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">{currentUser.name[0]}</div>
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
                    {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
               </div>

               <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-neutral-800">
                  <div className="flex flex-col text-right">
                      <span className="text-sm font-semibold text-slate-800 dark:text-white">{currentUser.name}</span>
                      <span className="text-xs text-slate-500 dark:text-neutral-500">{currentUser.email}</span>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden border border-slate-300 dark:border-neutral-700">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">{currentUser.name[0]}</div>
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
                    {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
               </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8">
          {currentView === View.DASHBOARD && (
            <div className="animate-in fade-in duration-500">
               <Dashboard requests={requests} employees={employees} vehicleFilter={vehicleFilter} />
            </div>
          )}
          {currentView === View.REQUESTS && (
            <div className="animate-in fade-in duration-500">
              <ServiceRequests 
                requests={requests} 
                products={products} 
                currentUser={currentUser}
                onAddRequest={handleAddRequest} 
                onUpdateRequest={handleUpdateRequest}
                onDeleteRequest={handleDeleteRequest}
                vehicleFilter={vehicleFilter}
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
              />
            </div>
          )}
          {currentView === View.EMPLOYEES && (
            <div className="animate-in fade-in duration-500">
              <Employees 
                employees={employees} 
                currentUser={currentUser}
                onAddEmployee={handleAddEmployee} 
                onUpdateEmployee={handleUpdateEmployee} 
                onDeleteEmployee={handleDeleteEmployee}
                vehicleFilter={vehicleFilter}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}