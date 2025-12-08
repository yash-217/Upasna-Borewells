export enum ServiceStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum ServiceType {
  DRILLING = 'New Borewell Drilling',
  MOTOR_INSTALLATION = 'Motor Installation',
  REPAIR = 'Repair & Maintenance',
  CLEANING = 'Borewell Cleaning',
  PLUMBING = 'Pipeline Extension'
}

export interface TrackedEntity {
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface Product extends TrackedEntity {
  id: string;
  name: string;
  category: 'Motor' | 'Pipe' | 'Cable' | 'Service' | 'Accessory';
  unitPrice: number;
  unit: string; // e.g., 'ft', 'pcs', 'meter'
}

export interface ServiceItem {
  productId: string;
  quantity: number;
  priceAtTime: number; // Snapshot of price
}

export interface ServiceRequest extends TrackedEntity {
  id: string;
  customerName: string;
  phone: string;
  location: string;
  date: string;
  type: ServiceType;
  status: ServiceStatus;
  items: ServiceItem[];
  notes: string;
  totalCost: number;
  vehicle?: string; // Assigned vehicle
  // Specific drilling fields
  drillingDepth?: number;
  drillingRate?: number;
}

export interface Employee extends TrackedEntity {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  joinDate: string;
  assignedVehicle?: string; // Main vehicle assignment
}

export interface User {
  name: string;
  email: string;
  photoURL?: string;
  isGuest?: boolean;
}