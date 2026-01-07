import React, { useState } from 'react';
import { Product, ServiceRequest, ServiceStatus, ServiceType, Vehicle, User } from '../../types';
import { Loader2, Trash2, Navigation } from 'lucide-react';
import { formatPhoneNumberInput } from '../../lib/formatters';
import { reverseGeocodeStructured } from '../../services/mappls';

interface ServiceRequestFormProps {
  initialData?: Partial<ServiceRequest>;
  products: Product[];
  vehicles: Vehicle[];
  currentUser: User;
  onSubmit: (data: ServiceRequest) => void;
  onCancel: () => void;
  isReadOnly?: boolean;
  isEditing?: boolean;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  initialData, products, vehicles, currentUser, onSubmit, onCancel, isReadOnly, isEditing, showToast
}) => {
  // Form State
  const [formData, setFormData] = useState<Partial<ServiceRequest>>(initialData || {
    customerName: '',
    phone: '+91 ',
    location: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    date: new Date().toISOString().split('T')[0],
    type: ServiceType.DRILLING,
    status: ServiceStatus.PENDING,
    vehicle: vehicles.length > 0 ? vehicles[0].name : '',
    items: [],
    notes: '',
    totalCost: 0,
    drillingDepth: 0,
    drillingRate: 0,
    casingDepth: 0,
    casingRate: 0,
    casingType: '7"',
    casing10Depth: 0,
    casing10Rate: 0,
    latitude: undefined,
    longitude: undefined
  });

  // Location State
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Get current GPS location and populate address fields
  const handleGetCurrentLocationForForm = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by this browser.", "error");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // First update with coordinates
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));

        // Get structured address using MapplsService
        reverseGeocodeStructured(lat, lng).then((address) => {
          setIsGettingLocation(false);
          if (address) {
            setFormData(prev => ({
              ...prev,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              city: address.city,
              district: address.district,
              state: address.state,
              pincode: address.pincode,
              location: address.formatted
            }));
            showToast("Location detected!", "success");
          } else {
            showToast("Could not retrieve address.", "info");
          }
        }).catch(() => {
          setIsGettingLocation(false);
          showToast("Could not retrieve address.", "error");
        });
      },
      () => {
        setIsGettingLocation(false);
        showToast("Unable to retrieve your location.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Progressive drilling rate calculation:
  // - 0-300 ft: base rate
  // - 301-400 ft: base rate + 10
  // - 401-500 ft: base rate + 20, etc.
  const calculateDrillingCost = (depth: number, baseRate: number) => {
    if (depth <= 0 || baseRate <= 0) return 0;

    let cost = 0;
    let remainingDepth = depth;

    // First 300ft at base rate
    const firstChunk = Math.min(remainingDepth, 300);
    cost += firstChunk * baseRate;
    remainingDepth -= firstChunk;

    // Subsequent 100ft chunks at +10 increments
    let currentRate = baseRate;
    while (remainingDepth > 0) {
      currentRate += 10;
      const chunk = Math.min(remainingDepth, 100);
      cost += chunk * currentRate;
      remainingDepth -= chunk;
    }

    return cost;
  };

  const calculateTotal = (data: typeof formData) => {
    const itemsTotal = (data.items || []).reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0);
    const drillingTotal = calculateDrillingCost(data.drillingDepth || 0, data.drillingRate || 0);
    const casingTotal = (data.casingDepth || 0) * (data.casingRate || 0);
    const casing10Total = (data.casing10Depth || 0) * (data.casing10Rate || 0);
    return itemsTotal + drillingTotal + casingTotal + casing10Total;
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

    const updatedFormData = { ...formData, items: newItems };
    setFormData({ ...updatedFormData, totalCost: calculateTotal(updatedFormData) });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...(formData.items || [])];
    newItems.splice(index, 1);
    const updatedFormData = { ...formData, items: newItems };
    setFormData({ ...updatedFormData, totalCost: calculateTotal(updatedFormData) });
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newItems = [...(formData.items || [])];
    newItems[index].quantity = quantity;
    const updatedFormData = { ...formData, items: newItems };
    setFormData({ ...updatedFormData, totalCost: calculateTotal(updatedFormData) });
  };

  const handleDrillingChange = (depth: number, rate: number) => {
    const updatedFormData = { ...formData, drillingDepth: depth, drillingRate: rate };
    setFormData({ ...updatedFormData, totalCost: calculateTotal(updatedFormData) });
  };

  const handleCasingChange = (depth: number, rate: number, type: string) => {
    const updatedFormData = { ...formData, casingDepth: depth, casingRate: rate, casingType: type };
    setFormData({ ...updatedFormData, totalCost: calculateTotal(updatedFormData) });
  };

  const handleCasing10Change = (depth: number, rate: number) => {
    const updatedFormData = { ...formData, casing10Depth: depth, casing10Rate: rate };
    setFormData({ ...updatedFormData, totalCost: calculateTotal(updatedFormData) });
  };

  const validateForm = (): boolean => {
    if (!formData.customerName?.trim()) {
      showToast("Customer Name is required", "error");
      return false;
    }
    if (!formData.phone?.match(/^(\+91\s?)?\d{10}$/)) {
      showToast("Please enter a valid phone number", "error");
      return false;
    }
    if ((formData.totalCost || 0) < 0) {
      showToast("Total cost cannot be negative", "error");
      return false;
    }
    if ((formData.casingDepth || 0) > (formData.drillingDepth || 0)) {
      showToast("Casing depth cannot be greater than drilling depth", "error");
      return false;
    }
    if ((formData.casing10Depth || 0) > (formData.drillingDepth || 0)) {
      showToast("10\" Casing depth cannot be greater than drilling depth", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData as ServiceRequest);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={isReadOnly ? 'pointer-events-none opacity-90' : ''}>
        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Customer Name</label>
            <input disabled={isReadOnly} required type="text" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
              value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Phone</label>
            <input disabled={isReadOnly} required type="tel" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
              value={formData.phone} onChange={e => setFormData({ ...formData, phone: formatPhoneNumberInput(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">Address</label>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleGetCurrentLocationForForm}
                  disabled={isGettingLocation}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2 text-sm"
                  title="Get Current Location"
                >
                  {isGettingLocation ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                  <span className="font-medium">GPS</span>
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <input
                  disabled={isReadOnly}
                  type="text"
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                  value={formData.addressLine1 || ''}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  placeholder="Address Line 1 (Building, Street)"
                />
              </div>
              <div>
                <input
                  disabled={isReadOnly}
                  type="text"
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                  value={formData.addressLine2 || ''}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  placeholder="Address Line 2 (Area, Landmark)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  disabled={isReadOnly}
                  type="text"
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
                <input
                  disabled={isReadOnly}
                  type="text"
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                  value={formData.district || ''}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="District"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  disabled={isReadOnly}
                  type="text"
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                />
                <input
                  disabled={isReadOnly}
                  type="text"
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="Pincode"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Service Type</label>
            <select disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
              value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as ServiceType })}>
              {Object.values(ServiceType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Assigned Vehicle</label>
            <select disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
              value={formData.vehicle} onChange={e => setFormData({ ...formData, vehicle: e.target.value })}>
              {vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Date</label>
            <input disabled={isReadOnly} required type="date" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
              value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Status</label>
            <select disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
              value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ServiceStatus })}>
              {Object.values(ServiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Drilling Specifics */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 mt-6">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 text-sm">Drilling Details (Variable Charge)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Depth (ft)</label>
              <input disabled={isReadOnly} type="number" min="0" placeholder="0" className="w-full bg-white dark:bg-black border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2 text-sm dark:text-white"
                value={formData.drillingDepth || ''} onChange={e => handleDrillingChange(Number(e.target.value), formData.drillingRate || 0)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Base Rate (₹/ft)</label>
              <input disabled={isReadOnly} type="number" min="0" placeholder="0" className="w-full bg-white dark:bg-black border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2 text-sm dark:text-white"
                value={formData.drillingRate || ''} onChange={e => handleDrillingChange(formData.drillingDepth || 0, Number(e.target.value))} />
            </div>
          </div>
          <div className="mt-2 text-right text-sm text-blue-700 dark:text-blue-400 font-medium">
            Drilling Total: ₹{calculateDrillingCost(formData.drillingDepth || 0, formData.drillingRate || 0).toLocaleString()}
          </div>
        </div>

        {/* Casing Pipe Details */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm">Casing Pipe Details</h4>
            <select
              disabled={isReadOnly}
              className="bg-white dark:bg-black border border-emerald-200 dark:border-emerald-800/50 rounded px-2 py-1 text-xs text-emerald-900 dark:text-emerald-100 focus:outline-none"
              value={formData.casingType || '7"'}
              onChange={(e) => handleCasingChange(formData.casingDepth || 0, formData.casingRate || 0, e.target.value)}
            >
              <option value='7"'>7" Pipe</option>
              <option value='8"'>8" Pipe</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-emerald-800 dark:text-emerald-200 mb-1">Depth (ft)</label>
              <input disabled={isReadOnly} type="number" min="0" placeholder="0" className="w-full bg-white dark:bg-black border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-3 py-2 text-sm dark:text-white"
                value={formData.casingDepth || ''} onChange={e => handleCasingChange(Number(e.target.value), formData.casingRate || 0, formData.casingType || '7"')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-emerald-800 dark:text-emerald-200 mb-1">Rate (₹/ft)</label>
              <input disabled={isReadOnly} type="number" min="0" placeholder="0" className="w-full bg-white dark:bg-black border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-3 py-2 text-sm dark:text-white"
                value={formData.casingRate || ''} onChange={e => handleCasingChange(formData.casingDepth || 0, Number(e.target.value), formData.casingType || '7"')} />
            </div>
          </div>
          <div className="mt-2 text-right text-sm text-emerald-700 dark:text-emerald-400 font-medium">
            Casing Total: ₹{((formData.casingDepth || 0) * (formData.casingRate || 0)).toLocaleString()}
          </div>
        </div>

        {/* 10" Casing Details */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-900/30 mt-4">
          <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-3 text-sm">10" Casing Pipe Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-purple-800 dark:text-purple-200 mb-1">Depth (ft)</label>
              <input disabled={isReadOnly} type="number" min="0" placeholder="0" className="w-full bg-white dark:bg-black border border-purple-200 dark:border-purple-800/50 rounded-lg px-3 py-2 text-sm dark:text-white"
                value={formData.casing10Depth || ''} onChange={e => handleCasing10Change(Number(e.target.value), formData.casing10Rate || 0)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-purple-800 dark:text-purple-200 mb-1">Rate (₹/ft)</label>
              <input disabled={isReadOnly} type="number" min="0" placeholder="0" className="w-full bg-white dark:bg-black border border-purple-200 dark:border-purple-800/50 rounded-lg px-3 py-2 text-sm dark:text-white"
                value={formData.casing10Rate || ''} onChange={e => handleCasing10Change(formData.casing10Depth || 0, Number(e.target.value))} />
            </div>
          </div>
          <div className="mt-2 text-right text-sm text-purple-700 dark:text-purple-400 font-medium">
            10" Casing Total: ₹{((formData.casing10Depth || 0) * (formData.casing10Rate || 0)).toLocaleString()}
          </div>
        </div>

        {/* Items & Cost Calculator */}
        <div className="bg-slate-50 dark:bg-black/50 p-4 rounded-lg border border-slate-200 dark:border-neutral-800 mt-6">
          <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center justify-between">
            <span>Items Used</span>
            <span className="text-blue-600 dark:text-blue-400">Total: ₹{formData.totalCost?.toLocaleString()}</span>
          </h4>

          {!isReadOnly && (
            <div className="mb-3 flex gap-2">
              <div className="relative flex-1 min-w-0">
                <select id="product-select" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white truncate"
                  onChange={(e) => {
                    if (e.target.value) {
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

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Notes</label>
          <textarea disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm h-20 resize-none text-slate-900 dark:text-white"
            value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional details about the job..."></textarea>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-neutral-800 flex justify-end gap-3 bg-slate-50 dark:bg-neutral-900/50 rounded-b-xl mt-6">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg text-sm font-medium transition-colors">
            {isReadOnly ? 'Back' : 'Cancel'}
          </button>
          {!isReadOnly && (
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
              {isEditing ? 'Update Request' : 'Create Request'}
            </button>
          )}
        </div>
      </form>
    </>
  );
};
