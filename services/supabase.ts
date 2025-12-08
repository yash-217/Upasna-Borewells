import { createClient } from '@supabase/supabase-js';
import { Employee, Product, ServiceRequest } from '../types';

// Detect environment variables (works for Vite or Create React App)
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_PUBLIC_SUPABASE_URL || '';
const supabaseKey = env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- Data Mappers (DB snake_case <-> App camelCase) ---

export const mapProductFromDB = (data: any): Product => ({
  id: data.id,
  name: data.name,
  category: data.category,
  unitPrice: data.unit_price,
  unit: data.unit,
  lastEditedBy: data.last_edited_by,
  lastEditedAt: data.last_edited_at
});

export const mapProductToDB = (p: Partial<Product>) => ({
  name: p.name,
  category: p.category,
  unit_price: p.unitPrice,
  unit: p.unit,
  last_edited_by: p.lastEditedBy,
  last_edited_at: p.lastEditedAt
});

export const mapEmployeeFromDB = (data: any): Employee => ({
  id: data.id,
  name: data.name,
  role: data.role,
  phone: data.phone,
  salary: data.salary,
  joinDate: data.join_date,
  assignedVehicle: data.assigned_vehicle,
  lastEditedBy: data.last_edited_by,
  lastEditedAt: data.last_edited_at
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

export const mapRequestFromDB = (data: any): ServiceRequest => ({
  id: data.id,
  customerName: data.customer_name,
  phone: data.phone,
  location: data.location,
  date: data.date,
  type: data.type,
  status: data.status,
  vehicle: data.vehicle,
  notes: data.notes,
  totalCost: data.total_cost,
  drillingDepth: data.drilling_depth,
  drillingRate: data.drilling_rate,
  items: data.items || [], // JSONB comes back as object/array
  lastEditedBy: data.last_edited_by,
  lastEditedAt: data.last_edited_at
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