import { createClient } from '@supabase/supabase-js';
import { 
  Employee, Product, ServiceRequest, 
  DBEmployee, DBProduct, DBServiceRequest,
  ServiceType, ServiceStatus
} from '../types';

// Standardized Env Access for Vite
// This relies on the variables being prefixed with VITE_ in your .env file
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Supabase URL or Anon Key is missing! Check your .env file.');
}

// Initialize client
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || ''
);

// --- Data Mappers (DB snake_case <-> App camelCase) ---

export const mapProductFromDB = (data: DBProduct): Product => ({
  id: data.id,
  name: data.name,
  category: data.category as any, // Casts string to specific Union type
  unitPrice: Number(data.unit_price) || 0,
  unit: data.unit,
  lastEditedBy: data.last_edited_by || undefined,
  lastEditedAt: data.last_edited_at || undefined
});

export const mapProductToDB = (p: Partial<Product>) => ({
  name: p.name,
  category: p.category,
  unit_price: p.unitPrice,
  unit: p.unit,
  last_edited_by: p.lastEditedBy,
  last_edited_at: p.lastEditedAt
});

export const mapEmployeeFromDB = (data: DBEmployee): Employee => ({
  id: data.id,
  name: data.name,
  role: data.role,
  phone: data.phone,
  salary: Number(data.salary) || 0,
  joinDate: data.join_date,
  assignedVehicle: data.assigned_vehicle || undefined,
  lastEditedBy: data.last_edited_by || undefined,
  lastEditedAt: data.last_edited_at || undefined
});

export const mapEmployeeToDB = (e: Partial<Employee>) => ({
  name: e.name,
  role: e.role,
  phone: e.phone,
  salary: e.salary,
  join_date: e.joinDate,
  assigned_vehicle: e.assignedVehicle,
  last_edited_by: e.lastEditedBy,
  last_edited_at: e.lastEditedAt
});

export const mapRequestFromDB = (data: DBServiceRequest): ServiceRequest => ({
  id: data.id,
  customerName: data.customer_name,
  phone: data.phone,
  location: data.location,
  date: data.date,
  type: data.type as ServiceType,
  status: data.status as ServiceStatus,
  vehicle: data.vehicle || undefined,
  notes: data.notes || '',
  totalCost: Number(data.total_cost) || 0,
  drillingDepth: Number(data.drilling_depth) || 0,
  drillingRate: Number(data.drilling_rate) || 0,
  // Ensure items is an array even if DB returns null/undefined
  items: Array.isArray(data.items) ? data.items : [], 
  lastEditedBy: data.last_edited_by || undefined,
  lastEditedAt: data.last_edited_at || undefined
});

export const mapRequestToDB = (r: Partial<ServiceRequest>) => ({
  customer_name: r.customerName,
  phone: r.phone,
  location: r.location,
  date: r.date,
  type: r.type,
  status: r.status,
  vehicle: r.vehicle,
  notes: r.notes,
  total_cost: r.totalCost,
  drilling_depth: r.drillingDepth,
  drilling_rate: r.drillingRate,
  items: r.items,
  last_edited_by: r.lastEditedBy,
  last_edited_at: r.lastEditedAt
});