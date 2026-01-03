import React, { useState } from 'react';
import { Employee, User, Vehicle } from '../types';
import { UserPlus, X, Phone, Calendar, DollarSign, Truck, Edit2, Trash2 } from 'lucide-react';

interface EmployeesProps {
  employees: Employee[];
  vehicles: Vehicle[];
  currentUser: User;
  onAddEmployee: (e: Employee) => void;
  onUpdateEmployee: (e: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  vehicleFilter: string;
  isReadOnly?: boolean;
}

export const Employees: React.FC<EmployeesProps> = ({ 
  employees, vehicles, currentUser, onAddEmployee, onUpdateEmployee, onDeleteEmployee, vehicleFilter, isReadOnly
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '', role: '', phone: '', salary: 0, joinDate: new Date().toISOString().split('T')[0], assignedVehicle: vehicles.length > 0 ? vehicles[0].name : ''
  });

  const openModal = (emp?: Employee) => {
    if (isReadOnly && !emp) return; 

    if (emp) {
      setEditingEmployee(emp);
      setFormData(emp);
    } else {
      setEditingEmployee(null);
      setFormData({ 
        name: '', role: '', phone: '', salary: 0, 
        joinDate: new Date().toISOString().split('T')[0], 
        assignedVehicle: vehicles.length > 0 ? vehicles[0].name : '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toLocaleString();

    if (editingEmployee) {
      onUpdateEmployee({
        ...editingEmployee,
        ...formData,
        lastEditedBy: currentUser.name,
        lastEditedAt: timestamp
      } as Employee);
    } else {
      onAddEmployee({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        lastEditedBy: currentUser.name,
        lastEditedAt: timestamp
      } as Employee);
    }
    setIsModalOpen(false);
  };

  const filteredEmployees = vehicleFilter === 'All Vehicles' 
    ? employees 
    : employees.filter(e => e.assignedVehicle === vehicleFilter);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Staff Directory</h2>
        {!isReadOnly && (
          <button 
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm touch-manipulation"
          >
            <UserPlus size={18} /> <span className="hidden sm:inline">Add Employee</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
          <div key={emp.id} className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800 p-6 flex items-start space-x-4">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} 
              alt={emp.name} 
              className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 dark:border-neutral-700"
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate pr-2">{emp.name}</h3>
                {!isReadOnly && (
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={() => openModal(emp)} 
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-neutral-800 rounded transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDeleteEmployee(emp.id)} 
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-neutral-800 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-3">{emp.role}</p>
              
              <div className="space-y-1.5">
                <div className="flex items-center text-sm text-slate-500 dark:text-neutral-400">
                  <Phone size={14} className="mr-2 opacity-70" />
                  {emp.phone}
                </div>
                {!isReadOnly && (
                  <div className="flex items-center text-sm text-slate-500 dark:text-neutral-400">
                     <DollarSign size={14} className="mr-2 opacity-70" />
                     ₹{emp.salary.toLocaleString()} / mo
                  </div>
                )}
                {emp.assignedVehicle && (
                  <div className="flex items-center text-sm text-slate-500 dark:text-neutral-400">
                    <Truck size={14} className="mr-2 opacity-70" />
                    {emp.assignedVehicle}
                  </div>
                )}
                <div className="flex items-center text-sm text-slate-500 dark:text-neutral-400">
                  <Calendar size={14} className="mr-2 opacity-70" />
                  Joined {emp.joinDate}
                </div>
              </div>
              
              {emp.lastEditedBy && (
                 <p className="text-xs text-slate-300 dark:text-neutral-600 mt-3 text-right">
                   Updated by {emp.lastEditedBy}
                 </p>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full py-10 text-center text-slate-400 dark:text-neutral-500">
             No employees assigned to {vehicleFilter}.
          </div>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-neutral-800">
            <form onSubmit={handleSubmit}>
              <div className="p-5 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {isReadOnly ? 'Employee Details' : (editingEmployee ? 'Edit Employee' : 'Add New Employee')}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200">
                  <X size={20} />
                </button>
              </div>
              
              <div className={`p-5 space-y-4 ${isReadOnly ? 'pointer-events-none opacity-90' : ''}`}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Full Name</label>
                  <input disabled={isReadOnly} required type="text" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Role / Designation</label>
                   <input disabled={isReadOnly} required type="text" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                     value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Phone</label>
                     <input disabled={isReadOnly} required type="tel" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                       value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Monthly Salary</label>
                     <input disabled={isReadOnly} required type="number" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                       value={formData.salary} onChange={e => setFormData({...formData, salary: Number(e.target.value)})} />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Assigned Vehicle</label>
                   <select disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={formData.assignedVehicle} onChange={e => setFormData({...formData, assignedVehicle: e.target.value})}>
                      {vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                   </select>
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Joining Date</label>
                   <input disabled={isReadOnly} required type="date" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                     value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} />
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-neutral-800 flex justify-end gap-3 bg-slate-50 dark:bg-neutral-900/50 rounded-b-xl">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg text-sm font-medium">
                  {isReadOnly ? 'Close' : 'Cancel'}
                </button>
                {!isReadOnly && (
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                    {editingEmployee ? 'Save Changes' : 'Add Employee'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};