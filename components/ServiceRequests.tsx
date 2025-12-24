import React, { useState, useRef, useEffect } from 'react';
import { Product, ServiceRequest, ServiceStatus, ServiceType, ServiceItem, User } from '../types';
import { Plus, Search, Filter, Edit2, Trash2, X, Truck, Eye, MapPin } from 'lucide-react';
import { VEHICLES } from '../constants';

interface ServiceRequestsProps {
  requests: ServiceRequest[];
  products: Product[];
  currentUser: User;
  onAddRequest: (req: ServiceRequest) => void;
  onUpdateRequest: (req: ServiceRequest) => void;
  onDeleteRequest: (id: string) => void;
  vehicleFilter: string;
  isReadOnly?: boolean;
}

export const ServiceRequests: React.FC<ServiceRequestsProps> = ({ 
  requests, products, currentUser, onAddRequest, onUpdateRequest, onDeleteRequest, vehicleFilter, isReadOnly
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Map State & Refs
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{lat: number, lng: number} | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  const loadMapplsScript = () => {
    return new Promise((resolve, reject) => {
      if (window.mappls) {
        resolve(window.mappls);
        return;
      }
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_MAPPLS_API_KEY;
      if (!apiKey) {
        reject(new Error("VITE_MAPPLS_API_KEY is missing"));
        return;
      }
      script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0`;
      script.async = true;
      script.onload = () => resolve(window.mappls);
      script.onerror = () => reject(new Error("Failed to load Mappls SDK"));
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    if (isMapOpen && mapContainerRef.current && !mapInstance.current) {
        loadMapplsScript().then((mappls: any) => {
             // Default to India center or current location if available
             const defaultCenter = { lat: 20.5937, lng: 78.9629 };
             
             mapInstance.current = new mappls.Map(mapContainerRef.current, {
                center: defaultCenter,
                zoom: 5
             });
             
             mapInstance.current.addListener('click', (e: any) => {
                 // Mappls event structure might vary, but usually e.lngLat contains {lat, lng}
                 const lat = e.lngLat ? e.lngLat.lat : e.latLng.lat(); 
                 const lng = e.lngLat ? e.lngLat.lng : e.latLng.lng();
                 setPickedLocation({ lat, lng });
                 
                 if (markerInstance.current) {
                     markerInstance.current.setPosition({ lat, lng });
                 } else {
                     markerInstance.current = new mappls.Marker({
                         map: mapInstance.current,
                         position: { lat, lng }
                     });
                 }
             });
        }).catch(err => console.error("Failed to load Mappls:", err));
    }
    // Cleanup if needed, though Mappls cleanup is tricky without destroying DOM
  }, [isMapOpen]);

  const handleConfirmLocation = () => {
      if (pickedLocation) {
          // Format as "Lat, Lng" string since we don't have reverse geocoding API key guaranteed
          setFormData({ ...formData, location: `${pickedLocation.lat.toFixed(6)}, ${pickedLocation.lng.toFixed(6)}` });
      }
      setIsMapOpen(false);
  };
  
  // Form State
  const [formData, setFormData] = useState<Partial<ServiceRequest>>({
    customerName: '',
    phone: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    type: ServiceType.DRILLING,
    status: ServiceStatus.PENDING,
    vehicle: VEHICLES[0],
    items: [],
    notes: '',
    totalCost: 0,
    drillingDepth: 0,
    drillingRate: 0
  });

  // Helper to calculate total cost
  const calculateTotal = (items: ServiceItem[], depth: number = 0, rate: number = 0) => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0);
    const drillingTotal = depth * rate;
    return itemsTotal + drillingTotal;
  };

  const handleAddItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItemIndex = (formData.items || []).findIndex(i => i.productId === productId);
    let newItems = [...(formData.items || [])];

    if (existingItemIndex >= 0) {
      newItems[existingItemIndex].quantity += 1;
    } else {
      newItems.push({ productId, quantity: 1, priceAtTime: product.unitPrice });
    }

    setFormData({
      ...formData,
      items: newItems,
      totalCost: calculateTotal(newItems, formData.drillingDepth, formData.drillingRate)
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...(formData.items || [])];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems,
      totalCost: calculateTotal(newItems, formData.drillingDepth, formData.drillingRate)
    });
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newItems = [...(formData.items || [])];
    newItems[index].quantity = quantity;
    setFormData({
      ...formData,
      items: newItems,
      totalCost: calculateTotal(newItems, formData.drillingDepth, formData.drillingRate)
    });
  };

  const handleDrillingChange = (depth: number, rate: number) => {
    setFormData({
      ...formData,
      drillingDepth: depth,
      drillingRate: rate,
      totalCost: calculateTotal(formData.items || [], depth, rate)
    });
  };
  
  const validateForm = (): boolean => {
    if (!formData.customerName?.trim()) {
      alert("Customer Name is required");
      return false;
    }
    if (!formData.phone?.match(/^\d{10}$/)) {
      alert("Please enter a valid 10-digit phone number");
      return false;
    }
    if ((formData.totalCost || 0) < 0) {
      alert("Total cost cannot be negative");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add Validation Check
    if (!validateForm()) return;
    const timestamp = new Date().toLocaleString();
    if (editingRequest) {
      onUpdateRequest({ 
        ...editingRequest, 
        ...formData,
        lastEditedBy: currentUser.name,
        lastEditedAt: timestamp
      } as ServiceRequest);
    } else {
      onAddRequest({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        lastEditedBy: currentUser.name,
        lastEditedAt: timestamp
      } as ServiceRequest);
    }
    closeModal();
  };

  const openModal = (req?: ServiceRequest) => {
    if (req) {
      setEditingRequest(req);
      setFormData(req);
    } else {
      if (isReadOnly) return; // Should not happen but just in case
      setEditingRequest(null);
      setFormData({
        customerName: '',
        phone: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        type: ServiceType.DRILLING,
        status: ServiceStatus.PENDING,
        vehicle: vehicleFilter !== 'All Vehicles' ? vehicleFilter : VEHICLES[0],
        items: [],
        notes: '',
        totalCost: 0,
        drillingDepth: 0,
        drillingRate: 0
      });
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
    return matchesSearch && matchesFilter && matchesVehicle;
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Service Requests</h2>
        {!isReadOnly && (
          <button 
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center touch-manipulation"
          >
            <Plus size={18} /> New Request
          </button>
        )}
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
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400 dark:text-neutral-500" />
            <select 
              className="flex-1 md:flex-none bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              {Object.values(ServiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {sortedRequests.length > 0 ? sortedRequests.map(req => (
          <div key={req.id} className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{req.customerName}</h3>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">{req.location}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  req.status === ServiceStatus.COMPLETED ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
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
                    <span className="text-slate-700 dark:text-neutral-200">{req.drillingDepth}ft @ ₹{req.drillingRate}/ft</span>
                  </div>
                )}
                 <div className="text-sm flex justify-between pt-2 border-t border-slate-100 dark:border-neutral-800">
                  <span className="text-slate-500 dark:text-neutral-400 font-medium">Total:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">₹{req.totalCost.toLocaleString()}</span>
                </div>
              </div>

              {req.lastEditedBy && (
                <div className="text-xs text-slate-300 dark:text-neutral-600 mb-2 italic">
                  Last updated by {req.lastEditedBy}
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 dark:bg-black/40 px-5 py-3 border-t border-slate-100 dark:border-neutral-800 flex justify-end items-center">
               <div className="flex gap-2">
                 <button onClick={() => openModal(req)} className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-blue-600 transition-colors">
                   {isReadOnly ? <Eye size={16} /> : <Edit2 size={16} />}
                 </button>
                 {!isReadOnly && (
                   <button onClick={() => onDeleteRequest(req.id)} className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-red-600 transition-colors">
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
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  {isReadOnly ? 'Request Details' : (editingRequest ? 'Edit Request' : 'New Service Request')}
                </h3>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"><X size={24} /></button>
              </div>
              
              <div className={`p-6 space-y-6 ${isReadOnly ? 'pointer-events-none opacity-90' : ''}`}>
                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Customer Name</label>
                    <input disabled={isReadOnly} required type="text" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Phone</label>
                    <input disabled={isReadOnly} required type="tel" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Location</label>
                    <div className="flex gap-2">
                      <input disabled={isReadOnly} required type="text" className="flex-1 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                        value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Address or Coordinates" />
                      {!isReadOnly && (
                        <button type="button" onClick={() => setIsMapOpen(true)} className="px-3 py-2 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors" title="Pick on Map">
                           <MapPin size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Service Type</label>
                    <select disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ServiceType})}>
                      {Object.values(ServiceType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Assigned Vehicle</label>
                    <select disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})}>
                      {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Date</label>
                    <input disabled={isReadOnly} required type="date" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Status</label>
                    <select disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ServiceStatus})}>
                      {Object.values(ServiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Drilling Specifics */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 text-sm">Drilling Details (Variable Charge)</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Depth (ft)</label>
                        <input disabled={isReadOnly} type="number" min="0" className="w-full bg-white dark:bg-black border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2 text-sm dark:text-white"
                          value={formData.drillingDepth} onChange={e => handleDrillingChange(Number(e.target.value), formData.drillingRate || 0)} />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Rate (₹/ft)</label>
                        <input disabled={isReadOnly} type="number" min="0" className="w-full bg-white dark:bg-black border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2 text-sm dark:text-white"
                          value={formData.drillingRate} onChange={e => handleDrillingChange(formData.drillingDepth || 0, Number(e.target.value))} />
                     </div>
                  </div>
                  <div className="mt-2 text-right text-sm text-blue-700 dark:text-blue-400 font-medium">
                     Drilling Total: ₹{((formData.drillingDepth || 0) * (formData.drillingRate || 0)).toLocaleString()}
                  </div>
                </div>

                {/* Items & Cost Calculator */}
                <div className="bg-slate-50 dark:bg-black/50 p-4 rounded-lg border border-slate-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center justify-between">
                    <span>Items Used</span>
                    <span className="text-blue-600 dark:text-blue-400">Total: ₹{formData.totalCost?.toLocaleString()}</span>
                  </h4>
                  
                  {!isReadOnly && (
                    <div className="mb-3 flex gap-2">
                       <div className="relative flex-1 min-w-0">
                         <select id="product-select" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white truncate"
                            onChange={(e) => {
                              if(e.target.value) {
                                 handleAddItem(e.target.value);
                                 e.target.value = '';
                              }
                            }}
                         >
                           <option value="">Add Product...</option>
                           {products.map(p => (
                             <option key={p.id} value={p.id}>
                               {p.name.substring(0, 30)}{p.name.length > 30 ? '...' : ''} - ₹{p.unitPrice}/{p.unit}
                             </option>
                           ))}
                         </select>
                       </div>
                    </div>
                  )}

                  {formData.items && formData.items.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {formData.items.map((item, idx) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm bg-white dark:bg-neutral-800 p-3 rounded-lg border border-slate-100 dark:border-neutral-700 gap-2 sm:gap-0">
                             <div className="flex-1">
                               <div className="font-medium text-slate-700 dark:text-neutral-200">{product?.name}</div>
                               <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">₹{item.priceAtTime} x {item.quantity} {product?.unit}</div>
                             </div>
                             
                             <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-neutral-700">
                               <div className="font-medium text-slate-800 dark:text-white">₹{item.priceAtTime * item.quantity}</div>
                               {!isReadOnly && (
                                 <div className="flex items-center gap-3">
                                     <div className="flex items-center border border-slate-200 dark:border-neutral-600 rounded bg-white dark:bg-black">
                                        <button type="button" onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)} className="px-3 py-1 text-slate-500 hover:bg-slate-50 dark:hover:bg-neutral-700 text-lg leading-none flex items-center justify-center">-</button>
                                        <span className="px-2 py-1 text-xs font-medium text-slate-800 dark:text-neutral-200 min-w-[1.5rem] text-center">{item.quantity}</span>
                                        <button type="button" onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)} className="px-3 py-1 text-slate-500 hover:bg-slate-50 dark:hover:bg-neutral-700 text-lg leading-none flex items-center justify-center">+</button>
                                     </div>
                                     <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                 </div>
                               )}
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 dark:text-neutral-500 text-sm py-4 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">No items added yet</div>
                  )}
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Notes</label>
                   <textarea disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm h-20 resize-none text-slate-900 dark:text-white"
                     value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} 
                     placeholder="Additional details about the job..."></textarea>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-neutral-800 flex justify-end gap-3 bg-slate-50 dark:bg-neutral-900/50 rounded-b-xl">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg text-sm font-medium transition-colors">
                  {isReadOnly ? 'Close' : 'Cancel'}
                </button>
                {!isReadOnly && (
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
                    {editingRequest ? 'Update Request' : 'Create Request'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Map Picker Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-3xl h-[500px] flex flex-col animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-neutral-800">
            <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Pick Location</h3>
              <button onClick={() => setIsMapOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"><X size={24} /></button>
            </div>
            
            <div className="flex-1 relative bg-slate-100 dark:bg-neutral-800">
               <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
               {!mapInstance.current && (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-neutral-400">
                    Loading Map...
                 </div>
               )}
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-slate-50 dark:bg-neutral-900/50 rounded-b-xl">
              <div className="text-sm text-slate-600 dark:text-neutral-400">
                 {pickedLocation ? `Selected: ${pickedLocation.lat.toFixed(5)}, ${pickedLocation.lng.toFixed(5)}` : 'Click on map to select location'}
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setIsMapOpen(false)} className="px-4 py-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg text-sm font-medium transition-colors">
                   Cancel
                 </button>
                 <button onClick={handleConfirmLocation} disabled={!pickedLocation} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                   Confirm Location
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};