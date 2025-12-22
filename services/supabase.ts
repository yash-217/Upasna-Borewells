import { createClient } from '@supabase/supabase-js';
import { 
  Employee, Product, ServiceRequest, 
  DBEmployee, DBProduct, DBServiceRequest,
  ServiceType, ServiceStatus
} from '../types';

// Standardized Env Access for Vite
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Supabase URL or Anon Key is missing! Check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || ''
);

// --- Helper Functions (THE FIX IS HERE) ---

// Safely parses a date string. If invalid or empty, returns NULL (for DB) or undefined.
// This fixes the "date/time field value out of range" error by normalizing to ISO YYYY-MM-DD.
const safeDateToDB = (dateStr: string | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  
  // Format as YYYY-MM-DD (ISO 8601) which Postgres universally accepts regardless of Datestyle
  return date.toISOString().split('T')[0];
};

// Safely parses a number. If invalid, returns 0.
const safeNumber = (num: any): number => {
  const parsed = Number(num);
  return isNaN(parsed) ? 0 : parsed;
};

// --- Data Mappers (DB snake_case <-> App camelCase) ---

export const mapProductFromDB = (data: DBProduct): Product => ({
  id: data.id,
  name: data.name,
  category: data.category as any,
  unitPrice: safeNumber(data.unit_price),
  unit: data.unit,
  lastEditedBy: data.last_edited_by || undefined,
  lastEditedAt: data.last_edited_at || undefined
});

export const mapProductToDB = (p: Partial<Product>) => ({
  name: p.name,
  category: p.category,
  unit_price: safeNumber(p.unitPrice),
  unit: p.unit,
  last_edited_by: p.lastEditedBy,
  last_edited_at: p.lastEditedAt
});

export const mapEmployeeFromDB = (data: DBEmployee): Employee => ({
  id: data.id,
  name: data.name,
  role: data.role,
  phone: data.phone,
  salary: safeNumber(data.salary),
  joinDate: data.join_date,
  assignedVehicle: data.assigned_vehicle || undefined,
  lastEditedBy: data.last_edited_by || undefined,
  lastEditedAt: data.last_edited_at || undefined
});

export const mapEmployeeToDB = (e: Partial<Employee>) => ({
  name: e.name,
  role: e.role,
  phone: e.phone,
  salary: safeNumber(e.salary),
  join_date: safeDateToDB(e.joinDate), // <--- FIX APPLIED
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
  totalCost: safeNumber(data.total_cost),
  drillingDepth: safeNumber(data.drilling_depth),
  drillingRate: safeNumber(data.drilling_rate),
  items: Array.isArray(data.items) ? data.items : [], 
  lastEditedBy: data.last_edited_by || undefined,
  lastEditedAt: data.last_edited_at || undefined
});

export const mapRequestToDB = (r: Partial<ServiceRequest>) => ({
  customer_name: r.customerName,
  phone: r.phone,
  location: r.location,
  date: safeDateToDB(r.date), // <--- FIX APPLIED
  type: r.type,
  status: r.status,
  vehicle: r.vehicle,
  notes: r.notes,
  total_cost: safeNumber(r.totalCost),
  drilling_depth: safeNumber(r.drillingDepth),
  drilling_rate: safeNumber(r.drillingRate),
  items: r.items,
  last_edited_by: r.lastEditedBy,
  last_edited_at: r.lastEditedAt
});