import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from './contexts/AppContext';
import { useTheme } from './contexts/ThemeContext';
import { useAuth, useAppQuery, useAppMutations, useSwipeGesture } from './hooks';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { SplashScreen } from './components/common/SplashScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Login } from './components/auth/Login';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Toast } from './components/common/Toast';
import type { Expense } from './types/index';
import { Employee, Product, ServiceRequest, View } from './types/index';

// Lazy loaded views
const ServiceRequests = React.lazy(() => import('./components/servicerequests/ServiceRequests').then(module => ({ default: module.ServiceRequests })));
const CreateServiceRequest = React.lazy(() => import('./components/servicerequests/CreateServiceRequest').then(module => ({ default: module.CreateServiceRequest })));
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const Inventory = React.lazy(() => import('./components/inventory/Inventory').then(module => ({ default: module.Inventory })));
const Employees = React.lazy(() => import('./components/employees/Employees').then(module => ({ default: module.Employees })));
const Expenses = React.lazy(() => import('./components/expenses/Expenses').then(module => ({ default: module.Expenses })));
const CreateExpense = React.lazy(() => import('./components/expenses/CreateExpense').then(module => ({ default: module.CreateExpense })));
const Home = React.lazy(() => import('./components/common/Home').then(module => ({ default: module.Home })));
const Profile = React.lazy(() => import('./components/profile/Profile').then(module => ({ default: module.Profile })));

export default function App() {
  const queryClient = useQueryClient();

  // Context hooks
  const { toast, showToast, hideToast, confirmState, triggerConfirm, closeConfirm } = useApp();
  const { darkMode, toggleDarkMode } = useTheme();

  // Auth hook
  const { currentUser, isAuthLoading, handleLogin, handleLogout } = useAuth();

  // UI State
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<string>('All Vehicles');

  // Swipe gesture for sidebar
  const swipeHandlers = useSwipeGesture({
    onSwipeRight: () => !isSidebarOpen && setSidebarOpen(true),
    onSwipeLeft: () => isSidebarOpen && setSidebarOpen(false),
  });

  // Data fetching
  const { requests, products, employees, expenses, vehicles, isLoading: isDataLoading } = useAppQuery(currentUser);

  // Combined loading state
  const isLoading = isAuthLoading || (!!currentUser && isDataLoading);

  // CRUD mutations
  const {
    addRequest, updateRequest, deleteRequest,
    addProduct, updateProduct, deleteProduct,
    addEmployee, updateEmployee, deleteEmployee,
    addExpense, deleteExpense, updateUserProfile
  } = useAppMutations({ queryClient, currentUser, showToast });

  // Handler adapters with confirmations
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
  const handleResetFilters = () => setVehicleFilter('All Vehicles');

  // Show splash screen while loading
  if (isLoading) {
    return <SplashScreen />;
  }

  // Show login if not authenticated
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-black flex transition-colors duration-200 overflow-x-hidden"
      {...swipeHandlers}
    >
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
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

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-black w-full lg:ml-72">
        {/* Header */}
        <Header
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
          currentView={currentView}
          vehicleFilter={vehicleFilter}
          setVehicleFilter={setVehicleFilter}
          vehicles={vehicles}
          setCurrentView={setCurrentView}
        />

        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          <ErrorBoundary>
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-full min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              {currentView === View.HOME && (
                <div className="animate-in fade-in duration-500">
                  <Home currentUser={currentUser} setCurrentView={setCurrentView} />
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
              {currentView === View.PROFILE && (
                <div className="animate-in fade-in duration-500 -m-4 md:-m-6 lg:-m-8">
                  <Profile
                    currentUser={currentUser}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    handleLogout={handleLogout}
                    setCurrentView={setCurrentView}
                    onUpdateProfile={updateUserProfile}
                    showToast={showToast}
                  />
                </div>
              )}
            </React.Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}