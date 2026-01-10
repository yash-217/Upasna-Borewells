import React, { useState, useEffect, useMemo } from 'react';
import { Product, ServiceRequest, ServiceStatus, User, Vehicle, Employee, View } from '../../types';
import { Search, Edit2, Trash2, X, Truck, Calendar, Phone, MessageCircle, MapPin, ChevronLeft, ChevronRight, TrendingUp, Users, CheckCircle, Download, MoreVertical, Eye } from 'lucide-react';
import { ServiceRequestForm } from './ServiceRequestForm';

interface ServiceRequestsProps {
  requests: ServiceRequest[];
  products: Product[];
  vehicles: Vehicle[];
  employees: Employee[];
  currentUser: User;
  onAddRequest: (req: ServiceRequest) => void;
  onUpdateRequest: (req: ServiceRequest) => void;
  onDeleteRequest: (id: string) => void;
  vehicleFilter: string;
  isReadOnly?: boolean;
  onResetFilters?: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setCurrentView?: (view: View) => void;
}

// Status configuration
const STATUS_CONFIG: Record<ServiceStatus, { bg: string; text: string; dotColor: string }> = {
  [ServiceStatus.PENDING]: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    dotColor: 'bg-blue-600'
  },
  [ServiceStatus.IN_PROGRESS]: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    dotColor: 'bg-amber-500'
  },
  [ServiceStatus.COMPLETED]: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dotColor: 'bg-emerald-500'
  },
  [ServiceStatus.CANCELLED]: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-400',
    dotColor: 'bg-slate-500'
  }
};

const ITEMS_PER_PAGE = 10;

export const ServiceRequests: React.FC<ServiceRequestsProps> = ({
  requests, products, vehicles, employees, currentUser, onUpdateRequest, onDeleteRequest, vehicleFilter, isReadOnly, onResetFilters, showToast, setCurrentView
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [employeeFilter, setEmployeeFilter] = useState<string>('All');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser.role === 'staff') {
      setEmployeeFilter(currentUser.name);
    } else {
      setEmployeeFilter('All');
    }
  }, [currentUser]);

  // Statistics calculations
  const stats = useMemo(() => {
    const openRequests = requests.filter(r => r.status === ServiceStatus.PENDING || r.status === ServiceStatus.IN_PROGRESS).length;
    const completedThisMonth = requests.filter(r => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return r.status === ServiceStatus.COMPLETED && new Date(r.date) >= monthStart;
    }).length;
    const totalThisMonth = requests.filter(r => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return new Date(r.date) >= monthStart;
    }).length;
    const completionRate = totalThisMonth > 0 ? Math.round((completedThisMonth / totalThisMonth) * 100) : 0;

    // Active teams (unique vehicles with active requests)
    const activeTeams = new Set(requests.filter(r => r.status === ServiceStatus.IN_PROGRESS && r.vehicle).map(r => r.vehicle)).size;

    return { openRequests, activeTeams, completionRate };
  }, [requests]);

  const handleSubmit = (formData: ServiceRequest) => {
    const timestamp = new Date().toLocaleString();
    if (editingRequest) {
      onUpdateRequest({
        ...editingRequest,
        ...formData,
        lastEditedBy: currentUser.name,
        lastEditedAt: timestamp
      } as ServiceRequest);
    }
    closeModal();
  };

  const openModal = (req?: ServiceRequest) => {
    if (req) {
      setEditingRequest(req);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRequest(null);
  };

  // Filtering
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = req.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVehicle = vehicleFilter === 'All Vehicles' || req.vehicle === vehicleFilter;
      const matchesEmployee = employeeFilter === 'All' || req.createdBy === employeeFilter || (!req.createdBy && req.lastEditedBy === employeeFilter);

      // Status filter logic
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = req.status === ServiceStatus.PENDING || req.status === ServiceStatus.IN_PROGRESS;
      } else if (statusFilter !== 'all') {
        matchesStatus = req.status === statusFilter;
      }

      let matchesDate = true;
      if (startDate && req.date < startDate) matchesDate = false;
      if (endDate && req.date > endDate) matchesDate = false;

      return matchesSearch && matchesStatus && matchesVehicle && matchesDate && matchesEmployee;
    });
  }, [requests, searchTerm, statusFilter, vehicleFilter, employeeFilter, startDate, endDate]);

  // Sorting
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      const statusPriority: Record<ServiceStatus, number> = {
        [ServiceStatus.PENDING]: 1,
        [ServiceStatus.IN_PROGRESS]: 2,
        [ServiceStatus.COMPLETED]: 3,
        [ServiceStatus.CANCELLED]: 4
      };

      const priorityA = statusPriority[a.status] || 99;
      const priorityB = statusPriority[b.status] || 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (a.status === ServiceStatus.PENDING) {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }, [filteredRequests]);

  // Pagination
  const totalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = sortedRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTeamInitials = (vehicle?: string) => {
    if (!vehicle) return '?';
    return vehicle.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const handleExportCSV = () => {
    const headers = ['Customer', 'Location', 'Date', 'Status', 'Type', 'Vehicle', 'Total Cost'];
    const rows = sortedRequests.map(r => [
      r.customerName,
      r.location,
      r.date,
      r.status,
      r.type,
      r.vehicle || '',
      r.totalCost.toString()
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'service-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully', 'success');
  };

  // Render request card for mobile
  const renderRequestCard = (req: ServiceRequest) => {
    const statusConfig = STATUS_CONFIG[req.status];
    const teamInitials = getTeamInitials(req.vehicle);

    return (
      <div
        key={req.id}
        className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm"
        onClick={() => openModal(req)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{req.customerName}</h4>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-0.5">
              <MapPin size={12} />
              <span className="text-xs truncate max-w-[180px]">{req.location}</span>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
            <span className={`size-1.5 rounded-full ${statusConfig.dotColor}`}></span>
            {req.status}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Date:</span>
            <span className="text-slate-700 dark:text-slate-300">{formatDate(req.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Specs:</span>
            <span className="text-slate-700 dark:text-slate-300">
              {req.drillingDepth ? `${req.drillingDepth}ft` : req.type}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-neutral-800">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total:</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">₹{req.totalCost.toLocaleString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-neutral-800">
          {/* Team */}
          {req.vehicle ? (
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center text-xs font-bold">
                {teamInitials}
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">{req.vehicle}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Unassigned</span>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <a
              href={`https://wa.me/${req.phone.replace(/\D/g, '').length > 10 ? req.phone.replace(/\D/g, '') : '91' + req.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-green-500 transition-colors"
            >
              <MessageCircle size={16} />
            </a>
            <a
              href={`tel:${req.phone}`}
              className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
            >
              <Phone size={16} />
            </a>
            <button
              onClick={(e) => { e.stopPropagation(); openModal(req); }}
              className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
            >
              {isReadOnly ? <Eye size={16} /> : <Edit2 size={16} />}
            </button>
            {!isReadOnly && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteRequest(req.id); }}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Service Requests</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Manage and track all borewell service operations</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 h-10 px-4 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          {!isReadOnly && setCurrentView && (
            <button
              onClick={() => setCurrentView(View.NEW_REQUEST)}
              className="flex items-center gap-2 h-10 px-4 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
            >
              <span className="hidden sm:inline">Create Request</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Filters & Search Row */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Mobile: Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="md:hidden w-full h-10 px-3 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-slate-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Requests</option>
          <option value="active">Active (Pending + In Progress)</option>
          {Object.values(ServiceStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        {/* Desktop: Pills */}
        <div className="hidden md:flex gap-1 p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl">
          <button
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            className={`flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${statusFilter === 'all'
              ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-neutral-700/50'
              }`}
          >
            All
          </button>
          <button
            onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
            className={`flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${statusFilter === 'active'
              ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-neutral-700/50'
              }`}
          >
            Active
          </button>
          {Object.values(ServiceStatus).map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className={`flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${statusFilter === status
                ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-neutral-700/50'
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search customers or locations..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 h-10 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Active Vehicle Filter Banner */}
      {vehicleFilter !== 'All Vehicles' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-sm font-medium opacity-80">Filtered by Vehicle</p>
              <p className="font-bold">{vehicleFilter}</p>
            </div>
          </div>
          <button
            onClick={onResetFilters}
            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"
            title="Clear Filter"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Desktop: Table View | Mobile: Card View */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {/* Desktop Table - Hidden on mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer & Location</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Borewell Specs</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned Team</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
              {paginatedRequests.map(req => {
                const statusConfig = STATUS_CONFIG[req.status];
                const teamInitials = getTeamInitials(req.vehicle);

                return (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                    {/* Customer & Location */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-900 dark:text-white font-bold text-sm">{req.customerName}</span>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-0.5">
                          <MapPin size={12} />
                          <span className="text-xs truncate max-w-[200px]">{req.location}</span>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDate(req.date)}</span>
                      </div>
                    </td>

                    {/* Borewell Specs */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-700 dark:text-slate-300 text-sm">
                          {req.drillingDepth ? `${req.drillingDepth}ft Depth` : req.type}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          {req.casingDepth ? `${req.casingType || '7"'} Casing: ${req.casingDepth}ft` : 'Standard'}
                        </span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                          ₹{req.totalCost.toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                        <span className={`size-1.5 rounded-full ${statusConfig.dotColor}`}></span>
                        {req.status}
                      </span>
                    </td>

                    {/* Assigned Team */}
                    <td className="px-6 py-4">
                      {req.vehicle ? (
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {teamInitials}
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{req.vehicle}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 flex items-center justify-center text-xs font-bold">?</div>
                          <span className="text-sm text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === req.id ? null : req.id)}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {actionMenuOpen === req.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-slate-200 dark:border-neutral-700 z-20 py-1 animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => { openModal(req); setActionMenuOpen(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                            >
                              <Edit2 size={14} /> {isReadOnly ? 'View Details' : 'Edit Request'}
                            </button>
                            <a
                              href={`https://wa.me/${req.phone.replace(/\D/g, '').length > 10 ? req.phone.replace(/\D/g, '') : '91' + req.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                              onClick={() => setActionMenuOpen(null)}
                            >
                              <MessageCircle size={14} /> WhatsApp
                            </a>
                            <a
                              href={`tel:${req.phone}`}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                              onClick={() => setActionMenuOpen(null)}
                            >
                              <Phone size={14} /> Call Customer
                            </a>
                            {!isReadOnly && (
                              <button
                                onClick={() => { onDeleteRequest(req.id); setActionMenuOpen(null); }}
                                className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - Shown only on mobile */}
        <div className="md:hidden p-4 space-y-4">
          {paginatedRequests.map(req => renderRequestCard(req))}
        </div>

        {/* Empty State */}
        {sortedRequests.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-slate-50 dark:bg-neutral-800 rounded-full mb-4 text-slate-400">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-white">No service requests found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Table Footer / Pagination */}
        {sortedRequests.length > 0 && (
          <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/30">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span>-
              <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, sortedRequests.length)}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{sortedRequests.length}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-neutral-800'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Open Requests */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined">event_note</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Open Requests</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.openRequests}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp size={12} />
            Pending + In Progress
          </p>
        </div>

        {/* Active Teams */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Teams</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeTeams}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium">Currently deployed</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Completion Rate</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completionRate}%</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp size={12} />
            This month
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto backdrop-blur-sm" onClick={closeModal}>
          <div
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-neutral-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {isReadOnly ? 'Request Details' : (editingRequest ? 'Edit Request' : 'Request')}
              </h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"><X size={24} /></button>
            </div>
            <div className="p-6">
              <ServiceRequestForm
                initialData={editingRequest || {}}
                products={products}
                vehicles={vehicles}
                currentUser={currentUser}
                onSubmit={handleSubmit}
                onCancel={closeModal}
                isReadOnly={isReadOnly}
                isEditing={!!editingRequest}
                showToast={showToast}
              />
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)} />
      )}
    </div>
  );
};
