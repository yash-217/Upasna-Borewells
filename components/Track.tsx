import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Truck, Clock, AlertCircle, Loader } from 'lucide-react';
import { Employee, ServiceRequest, ServiceStatus } from '../types';
import { VEHICLES } from '../constants';

interface TrackedVehicle {
  id: string;
  vehicleName: string;
  driver: string;
  driverId: string;
  lastUpdate: Date;
  status: 'active' | 'idle' | 'offline';
  assignedServiceId?: string;
  serviceLocation?: string;
  lat?: number;
  lng?: number;
}

interface TrackProps {
  employees: Employee[];
  requests: ServiceRequest[];
}

interface MapCoordinates {
  lat: number;
  lng: number;
}

// Geocoding cache to avoid repeated requests
const geocodingCache = new Map<string, MapCoordinates>();

// Simple geocoding function using OpenStreetMap's Nominatim API (free, no key required)
const geocodeLocation = async (location: string): Promise<MapCoordinates | undefined> => {
  if (!location || location.trim() === '') return undefined;
  
  // Check cache first
  if (geocodingCache.has(location)) {
    return geocodingCache.get(location);
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'Upasna-Borewells-App' } }
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      const coordinates = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      geocodingCache.set(location, coordinates);
      return coordinates;
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  
  return undefined;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'idle':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'offline':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return '🟢';
    case 'idle':
      return '🟡';
    case 'offline':
      return '🔴';
    default:
      return '⚪';
  }
};

const formatLastUpdate = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
};

// Vehicle marker component for the map
const VehicleMarker = ({ 
  vehicle, 
  isSelected, 
  onClick 
}: { 
  vehicle: TrackedVehicle; 
  isSelected: boolean; 
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`cursor-pointer transition-all ${
      isSelected ? 'scale-125' : 'hover:scale-110'
    }`}
    title={vehicle.vehicleName}
  >
    <div
      className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-white ${
        isSelected ? 'ring-4 ring-blue-400' : ''
      }`}
      style={{
        backgroundColor: getStatusColor2(vehicle.status),
        boxShadow: `0 4px 12px ${getStatusColor2(vehicle.status)}60`
      }}
    >
      <Truck size={20} />
    </div>
    <div className="absolute top-full mt-1 bg-white dark:bg-neutral-800 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap shadow-md pointer-events-none border border-slate-200 dark:border-neutral-700">
      {vehicle.vehicleName}
    </div>
  </div>
);

export const Track = ({ employees, requests }: TrackProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState<TrackedVehicle | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle' | 'offline'>('all');
  const [isLoadingCoords, setIsLoadingCoords] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Default to Delhi

  // Generate vehicle data from employees and service requests
  const vehicles = useMemo(() => {
    const vehicleMap = new Map<string, TrackedVehicle>();

    // Create a map of employees by their assigned vehicles
    const employeesByVehicle = new Map<string, Employee>();
    employees.forEach(emp => {
      if (emp.assignedVehicle) {
        employeesByVehicle.set(emp.assignedVehicle, emp);
      }
    });

    // Create a map of active services by vehicle
    const serviceByVehicle = new Map<string, ServiceRequest>();
    requests.forEach(req => {
      if (req.vehicle && req.status !== ServiceStatus.COMPLETED && req.status !== ServiceStatus.CANCELLED) {
        serviceByVehicle.set(req.vehicle, req);
      }
    });

    // Build vehicle list
    VEHICLES.forEach(vehicleName => {
      const employee = employeesByVehicle.get(vehicleName);
      const service = serviceByVehicle.get(vehicleName);
      
      // Determine status based on active service
      const status = service && service.status === ServiceStatus.IN_PROGRESS ? 'active' : 
                     service ? 'idle' : 'offline';
      
      // Last update is when the service was created/updated or now if active
      const lastUpdate = service ? new Date(service.date) : new Date(Date.now() - 24 * 60 * 60 * 1000);

      vehicleMap.set(vehicleName, {
        id: vehicleName.replace(/\s+/g, '-').toLowerCase(),
        vehicleName,
        driver: employee?.name || 'Unassigned',
        driverId: employee?.id || '',
        lastUpdate,
        status,
        assignedServiceId: service?.id,
        serviceLocation: service?.location
      });
    });

    return Array.from(vehicleMap.values());
  }, [employees, requests]);

  // Geocode vehicle locations
  useEffect(() => {
    const geocodeVehicles = async () => {
      setIsLoadingCoords(true);
      const vehiclesWithCoords = await Promise.all(
        vehicles.map(async (vehicle) => {
          if (vehicle.serviceLocation) {
            const coords = await geocodeLocation(vehicle.serviceLocation);
            return { ...vehicle, ...coords };
          }
          return vehicle;
        })
      );
      
      // Update vehicles with coordinates
      const activeVehicles = vehiclesWithCoords.filter(v => v.lat !== undefined && v.lng !== undefined);
      if (activeVehicles.length > 0) {
        // Calculate center based on active vehicles
        const avgLat = activeVehicles.reduce((sum, v) => sum + (v.lat || 0), 0) / activeVehicles.length;
        const avgLng = activeVehicles.reduce((sum, v) => sum + (v.lng || 0), 0) / activeVehicles.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
      }
      
      setIsLoadingCoords(false);
    };

    if (vehicles.length > 0) {
      geocodeVehicles();
    }
  }, [vehicles]);

  // Initialize Mappls map
  useEffect(() => {
    if (typeof (window as any).mappls === 'undefined') {
      console.error('Mappls SDK not loaded');
      return;
    }

    try {
      const mapElement = document.getElementById('map');
      if (!mapElement) return;

      const map = new (window as any).mappls.Map('map', {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: 12,
        zoomControl: true
      });

      // Add markers for vehicles with coordinates
      vehiclesWithCoords.forEach(vehicle => {
        if (vehicle.lat && vehicle.lng) {
          new (window as any).mappls.Marker({
            map: map,
            position: { lat: vehicle.lat, lng: vehicle.lng },
            title: vehicle.vehicleName,
            icon: 'https://apis.mappls.com/map_v3/marker/marker.png'
          });
        }
      });
    } catch (error) {
      console.error('Error initializing Mappls map:', error);
    }
  }, [mapCenter, vehiclesWithCoords]);

  const filteredVehicles = filterStatus === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.status === filterStatus);

  const vehiclesWithCoords = filteredVehicles.filter(v => v.lat !== undefined && v.lng !== undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <MapPin size={32} className="text-blue-600 dark:text-blue-400" />
          Vehicle Tracking
        </h1>
        <p className="text-slate-600 dark:text-neutral-400 mt-2">Real-time location and status of all vehicles</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'idle', 'offline'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              filterStatus === status
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
            }`}
          >
            {status === 'all' ? 'All Vehicles' : `${status.charAt(0).toUpperCase() + status.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Map Container - Mappls Map */}
      <div className="rounded-lg overflow-hidden border-2 border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-800 relative">
        {isLoadingCoords && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-neutral-900 z-10 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader size={32} className="text-blue-600 animate-spin" />
              <p className="text-slate-600 dark:text-neutral-400">Loading vehicle locations...</p>
            </div>
          </div>
        )}
        <div 
          id="map"
          style={{ height: '500px', width: '100%' }}
        />
      </div>

      {/* Map Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-300">Real-time Tracking</h3>
          <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
            {vehiclesWithCoords.length} of {filteredVehicles.length} vehicles have location data. Locations are geocoded from service request addresses.
          </p>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredVehicles.map(vehicle => (
          <div
            key={vehicle.id}
            onClick={() => setSelectedVehicle(vehicle)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedVehicle?.id === vehicle.id
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-400 dark:hover:border-blue-600'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getStatusIcon(vehicle.status)}</div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Truck size={18} />
                    {vehicle.vehicleName}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-neutral-400">Driver: {vehicle.driver}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(vehicle.status)}`}>
                {vehicle.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {vehicle.serviceLocation && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-400">
                  <MapPin size={16} />
                  <span>{vehicle.serviceLocation}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-400">
                <Clock size={16} />
                <span>{formatLastUpdate(vehicle.lastUpdate)}</span>
              </div>
              {vehicle.lat !== undefined && vehicle.lng !== undefined && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs">
                  <span>✓</span>
                  <span>Coordinates found</span>
                </div>
              )}
              {vehicle.assignedServiceId && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <span>📋</span>
                  <span className="text-xs">Active Service</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-neutral-400">
          <Truck size={48} className="mx-auto mb-2 opacity-30" />
          <p>No vehicles found with the selected filter</p>
        </div>
      )}

      {/* Selected Vehicle Details */}
      {selectedVehicle && (
        <div className="bg-slate-50 dark:bg-neutral-800 rounded-lg p-6 border border-slate-200 dark:border-neutral-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
            {selectedVehicle.vehicleName} - Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-neutral-400">Assigned Driver</p>
              <p className="font-semibold text-slate-800 dark:text-white">{selectedVehicle.driver}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-neutral-400">Status</p>
              <p className={`font-semibold capitalize ${getStatusColor(selectedVehicle.status)}`}>
                {selectedVehicle.status}
              </p>
            </div>
            {selectedVehicle.serviceLocation && (
              <div>
                <p className="text-sm text-slate-600 dark:text-neutral-400">Current Service Location</p>
                <p className="font-semibold text-slate-800 dark:text-white">{selectedVehicle.serviceLocation}</p>
              </div>
            )}
            {selectedVehicle.lat !== undefined && selectedVehicle.lng !== undefined && (
              <>
                <div>
                  <p className="text-sm text-slate-600 dark:text-neutral-400">Latitude</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{selectedVehicle.lat.toFixed(6)}°</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-neutral-400">Longitude</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{selectedVehicle.lng.toFixed(6)}°</p>
                </div>
              </>
            )}
            <div>
              <p className="text-sm text-slate-600 dark:text-neutral-400">Last Status Update</p>
              <p className="font-semibold text-slate-800 dark:text-white">
                {selectedVehicle.lastUpdate.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
