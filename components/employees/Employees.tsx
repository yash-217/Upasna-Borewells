import React, { useState, useMemo } from 'react';
import { Employee, User, Vehicle } from '../../types';
import { formatPhoneNumberInput } from '../../lib/formatters';
import { UserPlus, X, Phone, Calendar, Edit2, Trash2, Mail, Download, Search, ChevronLeft, ChevronRight, Users, Briefcase } from 'lucide-react';

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

// Designation color mapping
const DESIGNATION_COLORS: Record<string, { bg: string; text: string }> = {
  'Lead Driller': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  'Senior Tech': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  'Rig Operator': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  'Supervisor': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
  'default': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
};

const ITEMS_PER_PAGE = 10;

export const Employees: React.FC<EmployeesProps> = ({
  employees, vehicles, currentUser, onAddEmployee, onUpdateEmployee, onDeleteEmployee, vehicleFilter, isReadOnly
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '', designation: '', role: 'staff', email: '', phone: '', salary: 0, joinDate: new Date().toISOString().split('T')[0], assignedVehicle: '', status: 'active'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const stats = useMemo(() => {
    const total = employees.length;
    const admins = employees.filter(e => e.role === 'admin').length;
    const active = employees.filter(e => e.status === 'active').length;
    const onHoliday = employees.filter(e => e.status === 'on_holiday').length;
    return { total, admins, active, onHoliday };
  }, [employees]);

  // Filtering
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesVehicle = vehicleFilter === 'All Vehicles' || emp.assignedVehicle === vehicleFilter;
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || emp.role === roleFilter.toLowerCase();
      return matchesVehicle && matchesSearch && matchesRole;
    });
  }, [employees, vehicleFilter, searchTerm, roleFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openModal = (emp?: Employee) => {
    if (isReadOnly && !emp) return;

    if (emp) {
      setEditingEmployee(emp);
      setFormData(emp);
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '', designation: '', role: 'staff', email: '', phone: '', salary: 0,
        joinDate: new Date().toISOString().split('T')[0],
        assignedVehicle: '', status: 'active'
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

  const handleExportCSV = () => {
    const headers = ['Name', 'Designation', 'Role', 'Email', 'Phone', 'Assigned Vehicle', 'Join Date'];
    const rows = employees.map(e => [e.name, e.designation, e.role, e.email || '', e.phone, e.assignedVehicle || '', e.joinDate]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDesignationColor = (designation: string) => {
    return DESIGNATION_COLORS[designation] || DESIGNATION_COLORS.default;
  };

  // Render employee card for mobile/card view
  const renderEmployeeCard = (emp: Employee) => {
    const designationColor = getDesignationColor(emp.designation);

    return (
      <div
        key={emp.id}
        className="group flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all p-4"
      >
        <div className="flex items-start justify-between mb-4">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&size=64`}
            alt={emp.name}
            className="w-14 h-14 rounded-lg object-cover"
          />
          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${designationColor.bg} ${designationColor.text}`}>
            {emp.designation}
          </span>
        </div>
        <div className="flex flex-col gap-1 mb-4">
          <p className="text-slate-900 dark:text-white text-lg font-bold">{emp.name}</p>
          <div className="flex items-center gap-2 text-xs font-semibold">
            {emp.status === 'on_holiday' ? (
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="size-2 rounded-full bg-rose-500"></span>
                On Holiday
              </span>
            ) : emp.assignedVehicle ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                On-Site: {emp.assignedVehicle}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="size-2 rounded-full bg-blue-500"></span>
                Available
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <Phone size={14} />
            <span>{emp.phone}</span>
          </div>
          {emp.email && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
              <Mail size={14} />
              <span className="truncate">{emp.email}</span>
            </div>
          )}
        </div>
        {!isReadOnly && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800">
            <button
              onClick={() => openModal(emp)}
              className="flex-1 py-2 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDeleteEmployee(emp.id)}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Employee Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Manage and track all drillers, technicians, and staff</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 h-10 px-4 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          {!isReadOnly && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 h-10 px-4 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Add Employee</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Staff</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-9 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Admins</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.admins}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">On Holiday</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.onHoliday}</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between py-4 border-y border-slate-200 dark:border-neutral-800">
        {/* Role Filters */}
        <div className="flex gap-2 flex-wrap">
          {['All', 'Admin', 'Staff'].map(role => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setCurrentPage(1); }}
              className={`flex h-9 items-center justify-center gap-x-2 rounded-lg px-4 text-sm font-medium transition-colors ${roleFilter === role
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                }`}
            >
              {role === 'All' ? 'All Roles' : role}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px] max-w-md flex-1 md:flex-none">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 h-10 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {paginatedEmployees.map(emp => renderEmployeeCard(emp))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
          <div className="inline-flex p-4 bg-slate-50 dark:bg-neutral-800 rounded-full mb-4 text-slate-400">
            <Users size={24} />
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white">No employees found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Personnel Table (Desktop) */}
      {filteredEmployees.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Personnel List</h2>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-neutral-800/50">
                  <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Assignment</th>
                  {!isReadOnly && <th className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {paginatedEmployees.map(emp => {
                  const designationColor = getDesignationColor(emp.designation);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&size=40`}
                            alt={emp.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <span className="text-slate-900 dark:text-white font-medium">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${designationColor.bg} ${designationColor.text}`}>
                          {emp.designation}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-500 dark:text-slate-400 text-sm">
                        {emp.phone}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${emp.role === 'admin'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}>
                          <span className={`size-1.5 rounded-full ${emp.role === 'admin' ? 'bg-red-600' : 'bg-blue-600'}`}></span>
                          {emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-500 dark:text-slate-400 text-sm">
                        {emp.assignedVehicle || '—'}
                      </td>
                      {!isReadOnly && (
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openModal(emp)}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-white rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-neutral-600 transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDeleteEmployee(emp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-neutral-800/50 border-t border-slate-200 dark:border-neutral-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)}</span> of {filteredEmployees.length} employees
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 3) {
                  if (currentPage === 1) pageNum = i + 1;
                  else if (currentPage === totalPages) pageNum = totalPages - 2 + i;
                  else pageNum = currentPage - 1 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                      ? 'bg-blue-600 text-white font-bold'
                      : 'border border-slate-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-5 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
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
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Email (for Login)</label>
                  <input disabled={isReadOnly} type="email" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                    value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Designation</label>
                  <input disabled={isReadOnly} required type="text" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                    value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Access Role</label>
                  <select disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Phone</label>
                    <input disabled={isReadOnly} required type="tel" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={formData.phone} onChange={e => setFormData({ ...formData, phone: formatPhoneNumberInput(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Monthly Salary</label>
                    <input disabled={isReadOnly} required type="number" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={formData.salary} onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Assigned Vehicle</label>
                  <select disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                    value={formData.assignedVehicle} onChange={e => setFormData({ ...formData, assignedVehicle: e.target.value })}>
                    <option value="">-- None --</option>
                    {vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Joining Date</label>
                  <input disabled={isReadOnly} required type="date" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                    value={formData.joinDate} onChange={e => setFormData({ ...formData, joinDate: e.target.value })} />
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-2">Status</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setFormData({ ...formData, status: 'active', holidayStartDate: undefined, holidayReturnDate: undefined })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${formData.status === 'active'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                        }`}
                    >
                      ✓ Active
                    </button>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setFormData({ ...formData, status: 'on_holiday' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${formData.status === 'on_holiday'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                        }`}
                    >
                      🏖 On Holiday
                    </button>
                  </div>
                </div>

                {/* Holiday Dates (conditional) */}
                {formData.status === 'on_holiday' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-100 dark:border-rose-900/30">
                    <div>
                      <label className="block text-sm font-medium text-rose-700 dark:text-rose-300 mb-1">Holiday Start</label>
                      <input
                        disabled={isReadOnly}
                        type="date"
                        className="w-full bg-white dark:bg-black border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                        value={formData.holidayStartDate || ''}
                        onChange={e => setFormData({ ...formData, holidayStartDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-rose-700 dark:text-rose-300 mb-1">Expected Return</label>
                      <input
                        disabled={isReadOnly}
                        type="date"
                        className="w-full bg-white dark:bg-black border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                        value={formData.holidayReturnDate || ''}
                        onChange={e => setFormData({ ...formData, holidayReturnDate: e.target.value })}
                      />
                    </div>
                  </div>
                )}
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