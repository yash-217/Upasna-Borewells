import React, { useState, useRef, useEffect } from 'react';
import { Product, ServiceRequest, ServiceStatus, ServiceType, Vehicle, User } from '../../types';
import { Truck, MapPin, X, Loader2, Crosshair, Trash2 } from 'lucide-react';

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

  // Map State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [pickedAddress, setPickedAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const searchTimeoutRef = useRef<any>(null);

  const loadMapplsScript = () => {
    return new Promise((resolve, reject) => {
      if (window.mappls && window.mappls.placePicker) {
        resolve(window.mappls);
        return;
      }
      
      let apiKey = import.meta.env.VITE_MAPPLS_API_KEY;
      if (apiKey && apiKey.startsWith('VITE_MAPPLS_API_KEY=')) {
          apiKey = apiKey.replace('VITE_MAPPLS_API_KEY=', '');
      }

      if (!apiKey) {
        alert("Mappls API Key is missing! Please check your .env file.");
        reject(new Error("VITE_MAPPLS_API_KEY is missing"));
        return;
      }

      const loadScript = (src: string) => {
          return new Promise((res, rej) => {
              const existingScript = document.querySelector(`script[src="${src}"]`);
              if (existingScript) {
                  if (existingScript.getAttribute('data-loaded') === 'true') {
                      res(true);
                  } else {
                      existingScript.addEventListener('load', () => res(true));
                      existingScript.addEventListener('error', rej);
                  }
                  return;
              }
              const script = document.createElement('script');
              script.src = src;
              script.async = true;
              script.setAttribute('data-loaded', 'false');
              script.onload = () => {
                  script.setAttribute('data-loaded', 'true');
                  res(true);
              };
              script.onerror = rej;
              document.body.appendChild(script);
          });
      };

      loadScript(`https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${apiKey}`)
        .then(() => loadScript(`https://sdk.mappls.com/map/sdk/plugins?v=3.0&access_token=${apiKey}`))
        .then(() => resolve(window.mappls))
        .catch(err => reject(err));
    });
  };

  useEffect(() => {
    if (isMapOpen) {
        setTimeout(() => {
            loadMapplsScript().then((mappls: any) => {
                if (mapInstance.current) return;

                const defaultCenter = { lat: 19.8762, lng: 75.3433 };
                const mapObj = new mappls.Map('mappls-map-picker-form', {
                    center: defaultCenter,
                    zoom: 12,
                    zoomControl: true,
                    scrollWheel: true,
                    draggable: true,
                    clickableIcons: false
                });

                mapInstance.current = mapObj;
                markerInstance.current = new mappls.Marker({
                    map: mapObj,
                    position: defaultCenter,
                    draggable: true
                });

                markerInstance.current.addListener('dragend', (e: any) => {
                    if (e && e.target && typeof e.target.getPosition === 'function') {
                        const pos = e.target.getPosition();
                        setPickedLocation({ lat: Number(pos.lat), lng: Number(pos.lng) });
                        fetchAddress(Number(pos.lat), Number(pos.lng));
                    }
                });
                
                if (mapObj && typeof mapObj.addListener === 'function') {
                    mapObj.addListener('click', (e: any) => {
                        if (e && e.lngLat) {
                            const lat = e.lngLat.lat;
                            const lng = e.lngLat.lng;
                            
                            if (markerInstance.current) {
                                markerInstance.current.setPosition({ lat, lng });
                            } else {
                                markerInstance.current = new mappls.Marker({
                                    map: mapObj,
                                    position: { lat, lng },
                                    draggable: true
                                });
                                markerInstance.current.addListener('dragend', (e: any) => {
                                    if (e && e.target && typeof e.target.getPosition === 'function') {
                                        const pos = e.target.getPosition();
                                        setPickedLocation({ lat: Number(pos.lat), lng: Number(pos.lng) });
                                        fetchAddress(Number(pos.lat), Number(pos.lng));
                                    }
                                });
                            }
                            setPickedLocation({ lat, lng });
                            fetchAddress(lat, lng);
                        }
                    });
                }
            }).catch(err => console.error("Failed to load Mappls:", err));
        }, 100);
    } else {
        if (mapInstance.current) {
            try {
                mapInstance.current.remove();
            } catch(e) { /* ignore */ }
            mapInstance.current = null;
        }
    }
  }, [isMapOpen]);

  const handleConfirmLocation = () => {
      if (pickedLocation) {
          const updates: Partial<ServiceRequest> = {
              latitude: pickedLocation.lat,
              longitude: pickedLocation.lng
          };

          if (pickedAddress) {
              updates.location = pickedAddress;
          } else {
              updates.location = `${pickedLocation.lat.toFixed(6)}, ${pickedLocation.lng.toFixed(6)}`;
          }
          setFormData({ ...formData, ...updates });
      }
      setIsMapOpen(false);
  };
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setMapSearchQuery(query);
      
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      
      if (!query.trim()) {
          setSearchSuggestions([]);
          return;
      }

      if (window.mappls && window.mappls.search) {
          searchTimeoutRef.current = setTimeout(() => {
              try {
                  const searchOptions: any = { 
                      q: query,
                      pod: 'City,Locality,POI'
                  };
                  
                  if (pickedLocation) {
                      searchOptions.location = `${pickedLocation.lat},${pickedLocation.lng}`;
                  } else if (mapInstance.current && typeof mapInstance.current.getCenter === 'function') {
                      const center = mapInstance.current.getCenter();
                      if (center) {
                          searchOptions.location = `${center.lat},${center.lng}`;
                      }
                  }

                  new window.mappls.search(searchOptions, (data: any) => {
                      if (data) {
                          if (Array.isArray(data)) {
                              setSearchSuggestions(data);
                          } else if (data.suggestedLocations) {
                              setSearchSuggestions(data.suggestedLocations);
                          }
                      } else {
                          setSearchSuggestions([]);
                      }
                  });
              } catch (e) {
                  console.error("Search error", e);
              }
          }, 300);
      }
  };

  const handleSelectSuggestion = (item: any) => {
      const lat = parseFloat(item.latitude || item.lat);
      const lng = parseFloat(item.longitude || item.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
          const pos = { lat, lng };
          if (mapInstance.current) {
              mapInstance.current.setCenter(pos);
              mapInstance.current.setZoom(16);
          }
          if (markerInstance.current) {
              markerInstance.current.setPosition(pos);
          }
          setPickedLocation(pos);
          setMapSearchQuery(item.placeName || item.placeAddress || '');
          setSearchSuggestions([]);
          setPickedAddress(item.placeName || item.placeAddress || '');
      }
  };

  const handleMapSearch = () => {
      if (!mapSearchQuery.trim() || !window.mappls || !window.mappls.search) return;

      setIsSearching(true);
      
      const searchOptions: any = { q: mapSearchQuery };
      if (pickedLocation) {
          searchOptions.location = `${pickedLocation.lat},${pickedLocation.lng}`;
      } else if (mapInstance.current && typeof mapInstance.current.getCenter === 'function') {
          const center = mapInstance.current.getCenter();
          if (center) {
              searchOptions.location = `${center.lat},${center.lng}`;
          }
      }

      new window.mappls.search(searchOptions, (data: any) => {
          setIsSearching(false);
          let results: any[] = [];
          if (data) {
              if (Array.isArray(data)) {
                  results = data;
              } else if (data.suggestedLocations) {
                  results = data.suggestedLocations;
              }
          }

          const validResult = results.find(r => {
              const lat = parseFloat(r.latitude || r.lat || r.entryLatitude);
              const lng = parseFloat(r.longitude || r.lng || r.entryLongitude);
              return !isNaN(lat) && !isNaN(lng);
          });

          if (validResult) {
              const lat = parseFloat(validResult.latitude || validResult.lat || validResult.entryLatitude);
              const lng = parseFloat(validResult.longitude || validResult.lng || validResult.entryLongitude);
              
              const pos = { lat, lng };
                  if (mapInstance.current) {
                      mapInstance.current.setCenter(pos);
                      mapInstance.current.setZoom(16);
                  }
                  if (markerInstance.current) {
                      markerInstance.current.setPosition(pos);
                  }
                  setPickedLocation(pos);
                  setPickedAddress(validResult.placeName || validResult.placeAddress || '');
                  setSearchSuggestions([]);
          } else {
              showToast("Location not found or invalid coordinates.", "error");
          }
      });
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const pos = { lat, lng };

          if (mapInstance.current) {
            mapInstance.current.setCenter(pos);
            mapInstance.current.setZoom(16);
          }
          if (markerInstance.current) {
            markerInstance.current.setPosition(pos);
          }
          setPickedLocation(pos);
          fetchAddress(lat, lng);
        },
        (error) => {
          console.error("Error getting location:", error);
          showToast("Unable to retrieve your location.", "error");
        }
      );
    } else {
      showToast("Geolocation is not supported by this browser.", "error");
    }
  };

  const fetchAddress = (lat: number, lng: number) => {
      if (window.mappls && window.mappls.rev_geocode) {
          try {
              new window.mappls.rev_geocode({ lat, lng }, (data: any) => {
                  if (data && Array.isArray(data) && data.length > 0) {
                       setPickedAddress(data[0].formatted_address);
                  } else if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
                       setPickedAddress(data.results[0].formatted_address);
                  } else {
                       setPickedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                  }
              });
          } catch (e) {
              console.error("Reverse geocode error", e);
          }
      }
  };

  const highlightMatch = (text: string, query: string) => {
      if (!query || !text) return text;
      const cleanQuery = query.trim();
      if (!cleanQuery) return text;
      const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
      return parts.map((part, i) => 
        part.toLowerCase() === cleanQuery.toLowerCase() ? 
          <span key={i} className="text-blue-600 dark:text-blue-400 font-bold">{part}</span> : part
      );
  };

  // Calculations
  const calculateTotal = (data: typeof formData) => {
    const itemsTotal = (data.items || []).reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0);
    const drillingTotal = (data.drillingDepth || 0) * (data.drillingRate || 0);
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
                      {vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
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
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 mt-6">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 text-sm">Drilling Details (Variable Charge)</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Depth (ft)</label>
                        <input disabled={isReadOnly} type="number" min="0" placeholder="0" className="w-full bg-white dark:bg-black border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2 text-sm dark:text-white"
                          value={formData.drillingDepth || ''} onChange={e => handleDrillingChange(Number(e.target.value), formData.drillingRate || 0)} />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Rate (₹/ft)</label>
                        <input disabled={isReadOnly} type="number" min="0" placeholder="0" className="w-full bg-white dark:bg-black border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2 text-sm dark:text-white"
                          value={formData.drillingRate || ''} onChange={e => handleDrillingChange(formData.drillingDepth || 0, Number(e.target.value))} />
                     </div>
                  </div>
                  <div className="mt-2 text-right text-sm text-blue-700 dark:text-blue-400 font-medium">
                     Drilling Total: ₹{((formData.drillingDepth || 0) * (formData.drillingRate || 0)).toLocaleString()}
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

                <div className="mt-6">
                   <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Notes</label>
                   <textarea disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm h-20 resize-none text-slate-900 dark:text-white"
                     value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} 
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

      {/* Map Picker Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-3xl h-[500px] flex flex-col animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-neutral-800">
            <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Pick Location</h3>
              <div className="flex items-center gap-2">
                 {pickedLocation && (
                   <button onClick={handleConfirmLocation} type="button" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
                     Confirm
                   </button>
                 )}
                 <button onClick={() => setIsMapOpen(false)} type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"><X size={24} /></button>
              </div>
            </div>
            
            <div className="p-2 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 relative z-10">
                <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="Search for a place..." 
                      className="w-full bg-slate-100 dark:bg-neutral-800 border-none rounded-lg pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                      value={mapSearchQuery}
                      onChange={handleSearchInputChange}
                      onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()}
                    />
                    {mapSearchQuery && (
                        <button 
                            onClick={() => {
                                setMapSearchQuery('');
                                setSearchSuggestions([]);
                                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                            }}
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 p-1"
                        >
                            <X size={16} />
                        </button>
                    )}
                    {searchSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                            {searchSuggestions.map((item, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(item)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 border-b border-slate-100 dark:border-neutral-800 last:border-0"
                                >
                                    <div className="font-medium">{highlightMatch(item.placeName, mapSearchQuery)}</div>
                                    <div className="text-xs text-slate-500 dark:text-neutral-400 truncate">{highlightMatch(item.placeAddress, mapSearchQuery)}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button type="button" onClick={handleMapSearch} disabled={isSearching} className="bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-neutral-200 px-4 py-2 rounded-lg text-sm font-medium min-w-[80px] flex justify-center items-center disabled:opacity-70">
                   {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
                </button>
                <button type="button" onClick={handleCurrentLocation} className="bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-neutral-200 px-3 py-2 rounded-lg text-sm font-medium" title="Use Current Location">
                   <Crosshair size={20} />
                </button>
            </div>

            <div className="flex-1 relative bg-slate-100 dark:bg-neutral-800">
               <div id="mappls-map-picker-form" ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
               {!mapInstance.current && (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-neutral-400">
                    Loading Map...
                 </div>
               )}
            </div>
            
            <div className="p-3 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 rounded-b-xl z-10 relative">
                <p className="text-sm text-slate-700 dark:text-neutral-300 truncate flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600 shrink-0" />
                    {pickedAddress || (pickedLocation ? `${pickedLocation.lat.toFixed(6)}, ${pickedLocation.lng.toFixed(6)}` : 'No location selected')}
                </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
