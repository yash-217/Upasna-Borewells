// ... (Keep existing Enums) ...
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

// --- Database Row Types (Snake Case) ---
// These match exactly what comes back from Supabase
export interface DBProduct {
  id: string;
  name: string;
  category: string;
  unit_price: number;
  unit: string;
  last_edited_by: string | null;
  last_edited_at: string | null;
}

export interface DBEmployee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  join_date: string;
  assigned_vehicle: string | null;
  last_edited_by: string | null;
  last_edited_at: string | null;
}

export interface DBServiceRequest {
  id: string;
  customer_name: string;
  phone: string;
  location: string;
  date: string;
  type: string;
  status: string;
  vehicle: string | null;
  notes: string | null;
  total_cost: number;
  drilling_depth: number;
  drilling_rate: number;
  casing_depth: number;
  casing_rate: number;
  casing_type: string | null;
  casing10_depth: number;
  casing10_rate: number;
  latitude: number | null;
  longitude: number | null;
  items: any; // JSONB is hard to type strictly, but we parse it to ServiceItem[]
  last_edited_by: string | null;
  last_edited_at: string | null;
}

// --- Application Types (Camel Case) ---
export interface TrackedEntity {
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface Product extends TrackedEntity {
  id: string;
  name: string;
  category: 'Motor' | 'Pipe' | 'Cable' | 'Service' | 'Accessory';
  unitPrice: number;
  unit: string;
}

export interface ServiceItem {
  productId: string;
  quantity: number;
  priceAtTime: number;
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
  vehicle?: string;
  drillingDepth?: number;
  drillingRate?: number;
  casingDepth?: number;
  casingRate?: number;
  casingType?: string;
  casing10Depth?: number;
  casing10Rate?: number;
  latitude?: number;
  longitude?: number;
}

export interface Employee extends TrackedEntity {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  joinDate: string;
  assignedVehicle?: string;
}

export interface User {
  name: string;
  email: string;
  photoURL?: string;
  isGuest?: boolean;
}