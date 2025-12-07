import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Package, 
  Users as UsersIcon, 
  Menu,
  Settings,
  Droplets,
  Moon,
  Sun,
  LogOut,
  Truck
} from 'lucide-react';
import { ServiceRequests } from './components/ServiceRequests';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Employees } from './components/Employees';
import { Employee, Product, ServiceRequest, User } from './types';
import { INITIAL_EMPLOYEES, INITIAL_PRODUCTS, INITIAL_REQUESTS, VEHICLES } from './constants';

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
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Data State (Mocking a database)
  const [requests, setRequests] = useState<ServiceRequest[]>(INITIAL_REQUESTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  // Apply Dark Mode to HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth Handler
  const handleLogin = () => {
    // Simulate Google Login
    setCurrentUser({
      name: 'Ravi Kumar',
      email: 'ravi.k@upasnaborewells.com',
      photoURL: 'https://ui-avatars.com/api/?name=Ravi+Kumar&background=0D8ABC&color=fff'
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Handlers
  const handleAddRequest = (req: ServiceRequest) => setRequests([req, ...requests]);
  const handleUpdateRequest = (updatedReq: ServiceRequest) => setRequests(requests.map(r => r.id === updatedReq.id ? updatedReq : r));
  const handleDeleteRequest = (id: string) => {
    if (window.confirm("Are you sure you want to delete this request?")) {
      setRequests(requests.filter(r => r.id !== id));
    }
  };

  const handleAddProduct = (p: Product) => setProducts([...products, p]);
  const handleUpdateProduct = (p: Product) => setProducts(products.map(pr => pr.id === p.id ? p : pr));
  const handleDeleteProduct = (id: string) => {
    if(window.confirm("Delete this product?")) setProducts(products.filter(p => p.id !== id));
  };

  const handleAddEmployee = (e: Employee) => setEmployees([...employees, e]);
  const handleUpdateEmployee = (e: Employee) => setEmployees(employees.map(emp => emp.id === e.id ? e : emp));
  const handleDeleteEmployee = (id: string) => {
    if(window.confirm("Remove this employee?")) setEmployees(employees.filter(e => e.id !== id));
  };

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black transition-colors">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-neutral-800">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-blue-200 dark:shadow-none">
             <Droplets size={32} />
           </div>
           <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Upasna Borewells</h1>
           <p className="text-slate-500 dark:text-neutral-400 mb-8">Management Portal</p>
           
           <button 
             onClick={handleLogin}
             className="w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-800 text-slate-700 dark:text-white border border-slate-300 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700 font-medium py-3 px-4 rounded-xl transition-all"
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
      className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-colors mb-1 touch-manipulation ${
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
    <div className="min-h-screen bg-slate-50 dark:bg-black flex transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center space-x-2 px-6 py-6 border-b border-slate-100 dark:border-neutral-800">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Droplets size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white leading-tight">Upasna<br/><span className="text-blue-600 dark:text-blue-400">Borewells</span></h1>
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
             v1.3.1 &copy; 2024
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-black">
        {/* Header */}
        <header className="bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 sticky top-0 z-30">
          <div className="flex flex-col md:flex-row md:items-center justify-between px-4 lg:px-8 py-3 gap-3">
            <div className="flex items-center justify-between w-full md:w-auto">
              {/* Left: Hamburger & Title */}
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg touch-manipulation">
                  <Menu size={24} />
                </button>
                <div className="lg:hidden font-semibold text-slate-800 dark:text-white">
                  Upasna Borewells
                </div>
              </div>
              
              {/* Mobile Right: Theme Toggle & Profile */}
              <div className="flex items-center gap-2 md:hidden">
                 <button onClick={toggleDarkMode} className="p-2 text-slate-600 dark:text-neutral-300 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors touch-manipulation">
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </button>
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
            
            {/* Mobile Filters (Below header usually, but here stacking) */}
            <div className="md:hidden w-full pt-2 border-t border-slate-100 dark:border-neutral-800">
                <div className="flex items-center bg-slate-100 dark:bg-black rounded-lg px-3 py-2 border border-slate-200 dark:border-neutral-800 w-full">
                  <Truck size={16} className="text-slate-500 dark:text-neutral-500 mr-2 shrink-0" />
                  <select 
                    value={vehicleFilter}
                    onChange={(e) => setVehicleFilter(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 dark:text-neutral-300 w-full cursor-pointer dark:bg-black focus:outline-none"
                  >
                    <option value="All Vehicles">All Vehicles</option>
                    {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
               </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                 <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{currentView}</h1>
                 {vehicleFilter !== 'All Vehicles' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                       {vehicleFilter}
                    </span>
                 )}
              </div>
              <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1">
                {currentView === View.DASHBOARD && 'Overview of company performance.'}
                {currentView === View.REQUESTS && 'Manage service jobs and invoices.'}
                {currentView === View.INVENTORY && 'Manage products and pricing.'}
                {currentView === View.EMPLOYEES && 'View staff details.'}
              </p>
            </div>

            {currentView === View.DASHBOARD && (
              <Dashboard 
                requests={requests} 
                employees={employees}
                vehicleFilter={vehicleFilter}
              />
            )}
            
            {currentView === View.REQUESTS && (
              <ServiceRequests 
                requests={requests} 
                products={products} 
                currentUser={currentUser}
                onAddRequest={handleAddRequest}
                onUpdateRequest={handleUpdateRequest}
                onDeleteRequest={handleDeleteRequest}
                vehicleFilter={vehicleFilter}
              />
            )}
            
            {currentView === View.INVENTORY && (
              <Inventory 
                products={products} 
                currentUser={currentUser}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}
            
            {currentView === View.EMPLOYEES && (
              <Employees 
                employees={employees} 
                currentUser={currentUser}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                vehicleFilter={vehicleFilter}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}