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

// --- Helper Functions ---

// Safely parses a date string. If invalid or empty, returns NULL (for DB).
const safeDateToDB = (dateStr: string | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  
  // Format as YYYY-MM-DD (ISO 8601) which Postgres universally accepts
  return date.toISOString().split('T')[0];
};

// Safely parses a timestamp. Fixes "date/time field value out of range" error.
const safeTimestampToDB = (dateStr: string | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;

  const date = new Date(dateStr);

  // If the browser can parse it (e.g. ISO string), use it
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }

  // If parsing failed (likely a locale string like "22/12/2025..."), 
  // we assume the user intended "Now", so we generate a fresh ISO timestamp.
  // This is safe because 'lastEditedAt' is always set to 'now' when saving.
  return new Date().toISOString();
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
  category: data.category as any, // Casts string to specific Union type
  unitPrice: Number(data.unit_price) || 0,
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
  last_edited_at: safeTimestampToDB(p.lastEditedAt) // <--- Fixed
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
  salary: safeNumber(e.salary),
  join_date: safeDateToDB(e.joinDate),
  assigned_vehicle: e.assignedVehicle,
  last_edited_by: e.lastEditedBy,
  last_edited_at: safeTimestampToDB(e.lastEditedAt) // <--- Fixed
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
  date: safeDateToDB(r.date),
  type: r.type,
  status: r.status,
  vehicle: r.vehicle,
  notes: r.notes,
  total_cost: safeNumber(r.totalCost),
  drilling_depth: safeNumber(r.drillingDepth),
  drilling_rate: safeNumber(r.drillingRate),
  items: r.items,
  last_edited_by: r.lastEditedBy,
  last_edited_at: safeTimestampToDB(r.lastEditedAt) // <--- Fixed
});