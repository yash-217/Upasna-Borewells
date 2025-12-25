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

// --- Helper Functions ---

// Safely parses a date string. If invalid or empty, returns NULL (for DB).
const safeDateToDB = (dateStr: string | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Try standard parsing first
  let date = new Date(dateStr);
  
  // Handle DD/MM/YYYY format if standard parsing fails
  if (isNaN(date.getTime()) && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
       // Swap to YYYY-MM-DD
       const day = parts[0];
       const month = parts[1];
       const year = parts[2].split(',')[0].trim(); // Remove time part if present
       date = new Date(`${year}-${month}-${day}`);
    }
  }

  if (isNaN(date.getTime())) return null;
  
  // Format as YYYY-MM-DD (ISO 8601)
  return date.toISOString().split('T')[0];
};

// Safely parses a timestamp. Fixes "date/time field value out of range" error.
const safeTimestampToDB = (dateStr: string | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;

  // 1. Try standard parsing
  let date = new Date(dateStr);

  // 2. If standard parsing fails (e.g. "22/12/2025, 11:12:08 pm"), parse manually
  if (isNaN(date.getTime())) {
     // Check for DD/MM/YYYY format
     if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
        // We really just want "NOW" if it's a "Last Edited" timestamp that failed parsing.
        // It's safer to generate a new timestamp than to try to parse a locale string perfectly.
        return new Date().toISOString(); 
     }
  }

  // 3. Final check: if it's still invalid, return current time
  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
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
  last_edited_at: safeTimestampToDB(p.lastEditedAt)
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
  last_edited_at: safeTimestampToDB(e.lastEditedAt)
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
  casingDepth: Number(data.casing_depth) || 0,
  casingRate: Number(data.casing_rate) || 0,
  casingType: data.casing_type || undefined,
  casing10Depth: Number(data.casing10_depth) || 0,
  casing10Rate: Number(data.casing10_rate) || 0,
  latitude: data.latitude !== null ? Number(data.latitude) : undefined,
  longitude: data.longitude !== null ? Number(data.longitude) : undefined,
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
  casing_depth: safeNumber(r.casingDepth),
  casing_rate: safeNumber(r.casingRate),
  casing_type: r.casingType || null,
  casing10_depth: safeNumber(r.casing10Depth),
  casing10_rate: safeNumber(r.casing10Rate),
  latitude: r.latitude ?? null,
  longitude: r.longitude ?? null,
  items: r.items,
  last_edited_by: r.lastEditedBy,
  last_edited_at: safeTimestampToDB(r.lastEditedAt)
});