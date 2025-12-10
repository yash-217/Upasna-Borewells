import React, { useState } from 'react';
import { MapPin, Truck, Clock, AlertCircle } from 'lucide-react';

interface TrackedVehicle {
  id: string;
  name: string;
  driver: string;
  latitude: number;
  longitude: number;
  lastUpdate: Date;
  status: 'active' | 'idle' | 'offline';
  speed?: number;
}

const mockVehicles: TrackedVehicle[] = [
  {
    id: '1',
    name: 'Vehicle 001',
    driver: 'John Doe',
    latitude: 28.6139,
    longitude: 77.2090,
    lastUpdate: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    status: 'active',
    speed: 45
  },
  {
    id: '2',
    name: 'Vehicle 002',
    driver: 'Jane Smith',
    latitude: 28.5355,
    longitude: 77.3910,
    lastUpdate: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    status: 'idle',
    speed: 0
  },
  {
    id: '3',
    name: 'Vehicle 003',
    driver: 'Mike Johnson',
    latitude: 28.7041,
    longitude: 77.1025,
    lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'offline',
  }
];

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

export const Track = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<TrackedVehicle | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle' | 'offline'>('all');

  const filteredVehicles = filterStatus === 'all' 
    ? mockVehicles 
    : mockVehicles.filter(v => v.status === filterStatus);

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

      {/* Map Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-300">Map Integration</h3>
          <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
            Interactive map view is coming soon. For now, you can view vehicle locations and details below.
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
                    {vehicle.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-neutral-400">Driver: {vehicle.driver}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(vehicle.status)}`}>
                {vehicle.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-400">
                <MapPin size={16} />
                <span>{vehicle.latitude.toFixed(4)}°, {vehicle.longitude.toFixed(4)}°</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-400">
                <Clock size={16} />
                <span>{formatLastUpdate(vehicle.lastUpdate)}</span>
              </div>
              {vehicle.speed !== undefined && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-400">
                  <span>⚡</span>
                  <span>{vehicle.speed} km/h</span>
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
            {selectedVehicle.name} - Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-neutral-400">Driver Name</p>
              <p className="font-semibold text-slate-800 dark:text-white">{selectedVehicle.driver}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-neutral-400">Status</p>
              <p className={`font-semibold capitalize ${getStatusColor(selectedVehicle.status)}`}>
                {selectedVehicle.status}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-neutral-400">Latitude</p>
              <p className="font-semibold text-slate-800 dark:text-white">{selectedVehicle.latitude.toFixed(6)}°</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-neutral-400">Longitude</p>
              <p className="font-semibold text-slate-800 dark:text-white">{selectedVehicle.longitude.toFixed(6)}°</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-neutral-400">Last Updated</p>
              <p className="font-semibold text-slate-800 dark:text-white">
                {selectedVehicle.lastUpdate.toLocaleString()}
              </p>
            </div>
            {selectedVehicle.speed !== undefined && (
              <div>
                <p className="text-sm text-slate-600 dark:text-neutral-400">Speed</p>
                <p className="font-semibold text-slate-800 dark:text-white">{selectedVehicle.speed} km/h</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
