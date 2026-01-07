import React, { useState, useEffect } from 'react';
import { Product, ServiceRequest, ServiceStatus, User, Vehicle, Employee } from '../../types';
import { Search, Filter, Edit2, Trash2, X, Truck, Eye, Calendar, Phone, MessageCircle, Map, User as UserIcon } from 'lucide-react';
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
}

export const ServiceRequests: React.FC<ServiceRequestsProps> = ({
  requests, products, vehicles, employees, currentUser, onAddRequest, onUpdateRequest, onDeleteRequest, vehicleFilter, isReadOnly, onResetFilters, showToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  // Employee Filter: If staff, default to their name and lock it. If admin, default to 'All'.
  const [employeeFilter, setEmployeeFilter] = useState<string>('All');

  useEffect(() => {
    if (currentUser.role === 'staff') {
      setEmployeeFilter(currentUser.name);
    } else {
      setEmployeeFilter('All');
    }
  }, [currentUser]);

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
    // We removed 'Create' logic from here as it's handled in CreateServiceRequest page
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
  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'All' || req.status === statusFilter;
    const matchesVehicle = vehicleFilter === 'All Vehicles' || req.vehicle === vehicleFilter;

    // Employee Filter Logic: using createdBy for ownership/assignment
    const matchesEmployee = employeeFilter === 'All' || req.createdBy === employeeFilter || (!req.createdBy && req.lastEditedBy === employeeFilter);

    let matchesDate = true;
    if (startDate && req.date < startDate) matchesDate = false;
    if (endDate && req.date > endDate) matchesDate = false;

    return matchesSearch && matchesFilter && matchesVehicle && matchesDate && matchesEmployee;
  });

  // Sorting Logic
  const sortedRequests = [...filteredRequests].sort((a, b) => {
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
      return dateA - dateB; // Oldest to newest
    } else {
      return dateB - dateA; // Newest first
    }
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
    setIsDateFilterOpen(false);
    if (currentUser.role !== 'staff') {
      setEmployeeFilter('All');
    }
    if (onResetFilters) onResetFilters();
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'All' || vehicleFilter !== 'All Vehicles' || startDate !== '' || endDate !== '' || (currentUser.role !== 'staff' && employeeFilter !== 'All');

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Service Requests</h2>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-neutral-500" size={18} />
            <input
              type="text"
              placeholder="Search customers or locations..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">

            {/* Employee Filter (Admin Only) */}
            {currentUser.role !== 'staff' ? (
              <div className="relative">
                <div className="absolute left-3 top-2.5 pointer-events-none text-slate-400">
                  <UserIcon size={16} />
                </div>
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white appearance-none cursor-pointer min-w-[150px]"
                >
                  <option value="All">All Employees</option>
                  {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="hidden"></div>
            )}

            <div className="relative">
              <button
                onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium ${startDate || endDate
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                  : 'bg-white dark:bg-black border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800'
                  }`}
              >
                <Calendar size={16} />
                <span className="hidden sm:inline">{startDate || endDate ? 'Date Active' : 'Filter by Date'}</span>
              </button>

              {isDateFilterOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-slate-200 dark:border-neutral-800 p-4 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Date Range</h4>
                    <button onClick={() => setIsDateFilterOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1 block">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        max={endDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1 block">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>
                    {(startDate || endDate) && (
                      <button
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        className="w-full py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Clear Dates
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Filter size={18} className="text-slate-400 dark:text-neutral-500" />
            <select
              className="flex-1 md:flex-none bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              {Object.values(ServiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors" title="Clear Filters">
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {sortedRequests.length > 0 ? sortedRequests.map(req => (
          <div
            key={req.id}
            onClick={() => openModal(req)}
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800 overflow-hidden flex flex-col hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{req.customerName}</h3>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">{req.location}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.status === ServiceStatus.COMPLETED ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                  req.status === ServiceStatus.PENDING ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                    req.status === ServiceStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                      'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}>
                  {req.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Type:</span>
                  <span className="text-slate-700 dark:text-neutral-200 font-medium text-right">{req.type}</span>
                </div>
                {req.vehicle && (
                  <div className="text-sm flex justify-between">
                    <span className="text-slate-500 dark:text-neutral-400">Vehicle:</span>
                    <span className="text-slate-700 dark:text-neutral-200 font-medium text-right flex items-center gap-1">
                      <Truck size={12} /> {req.vehicle}
                    </span>
                  </div>
                )}
                <div className="text-sm flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Date:</span>
                  <span className="text-slate-700 dark:text-neutral-200">{req.date}</span>
                </div>
                {(req.drillingDepth || 0) > 0 && (
                  <div className="text-sm flex justify-between">
                    <span className="text-slate-500 dark:text-neutral-400">Drilling:</span>
                    <span className="text-slate-700 dark:text-neutral-200">{req.drillingDepth}ft (Base: ₹{req.drillingRate}/ft)</span>
                  </div>
                )}
                {(req.casingDepth || 0) > 0 && (
                  <div className="text-sm flex justify-between">
                    <span className="text-slate-500 dark:text-neutral-400">Casing ({req.casingType || '7"'}):</span>
                    <span className="text-slate-700 dark:text-neutral-200">{req.casingDepth}ft @ ₹{req.casingRate}/ft</span>
                  </div>
                )}
                {(req.casing10Depth || 0) > 0 && (
                  <div className="text-sm flex justify-between">
                    <span className="text-slate-500 dark:text-neutral-400">10" Casing:</span>
                    <span className="text-slate-700 dark:text-neutral-200">{req.casing10Depth}ft @ ₹{req.casing10Rate}/ft</span>
                  </div>
                )}
                <div className="text-sm flex justify-between pt-2 border-t border-slate-100 dark:border-neutral-800">
                  <span className="text-slate-500 dark:text-neutral-400 font-medium">Total:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">₹{req.totalCost.toLocaleString()}</span>
                </div>
              </div>

              {req.createdBy && (
                <div className="text-xs text-slate-400 dark:text-neutral-500 mb-1">
                  Created by: <span className="font-medium text-slate-600 dark:text-neutral-300">{req.createdBy}</span>
                </div>
              )}
              {req.lastEditedBy && (
                <div className="text-xs text-slate-300 dark:text-neutral-600 mb-2 italic">
                  Last updated by {req.lastEditedBy}
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-black/40 px-5 py-3 border-t border-slate-100 dark:border-neutral-800 flex justify-end items-center">
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${req.phone.replace(/\D/g, '').length > 10 ? req.phone.replace(/\D/g, '') : '91' + req.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-green-500 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle size={16} />
                </a>
                <a
                  href={`tel:${req.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-green-600 transition-colors"
                  title="Call Customer"
                >
                  <Phone size={16} />
                </a>
                {req.latitude && req.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${req.latitude},${req.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-orange-500 transition-colors"
                    title="Open in Google Maps"
                  >
                    <Map size={16} />
                  </a>
                )}
                <button onClick={(e) => { e.stopPropagation(); openModal(req); }} className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-blue-600 transition-colors">
                  {isReadOnly ? <Eye size={16} /> : <Edit2 size={16} />}
                </button>
                {!isReadOnly && (
                  <button onClick={(e) => { e.stopPropagation(); onDeleteRequest(req.id); }} className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="py-10 text-center text-slate-400 dark:text-neutral-500">
            No service requests found.
          </div>
        )}
      </div>

      {/* Edit/Create Modal (In ReadOnly, acts as View Details) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-neutral-800">
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
    </div>
  );
};
