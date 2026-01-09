import { createClient } from '@supabase/supabase-js';
import {
  Employee, Product, ServiceRequest, Vehicle,
  ServiceType, ServiceStatus
} from '../types/index';
import {
  DBEmployee, DBProduct, DBServiceRequest, DBVehicle
} from '../types/database';

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

  let date: Date | null = null;

  // 1. Try manual DD/MM/YYYY parsing first to be strict
  // Matches "23/01/2025" or "1/1/2024"
  const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // Months are 0-indexed
    const year = parseInt(dmyMatch[3], 10);
    date = new Date(year, month, day);
  } else {
    // 2. Fallback to standard parsing (YYYY-MM-DD)
    const stdDate = new Date(dateStr);
    if (!isNaN(stdDate.getTime())) {
      date = stdDate;
    }
  }

  // Check validity
  if (!date || isNaN(date.getTime())) return null;

  // Format as YYYY-MM-DD (ISO 8601 Date only)
  // Use user's local year/month/day but formatted as ISO string part
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
};

// Safely parses a timestamp. Fixes "date/time field value out of range" error.
const safeTimestampToDB = (dateStr: string | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;

  let date: Date | null = null;

  // 1. Try manual DD/MM/YYYY parsing first
  if (dateStr.includes('/')) {
    const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      date = new Date(year, month, day);

      // If time part exists? "23/01/2025, 10:30 PM" - simplistic handling:
      // If we just need the date valid, setting to 00:00:00 is often fine for metadata if parsing fails,
      // but let's try to preserve it if possible or just default to current time if ambiguous.
    }
  }

  // 2. If manual failed, try standard
  if (!date) {
    const stdDate = new Date(dateStr);
    if (!isNaN(stdDate.getTime())) {
      date = stdDate;
    }
  }

  // 3. Final check: if it's still invalid, return current time to ensure DB accepts the row
  if (!date || isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
};

// Safely parses a number. If invalid, returns 0.
const safeNumber = (num: unknown): number => {
  const parsed = Number(num);
  return isNaN(parsed) ? 0 : parsed;
};

// --- Data Mappers (DB snake_case <-> App camelCase) ---

export const mapProductFromDB = (data: DBProduct): Product => ({
  id: data.id,
  name: data.name,
  category: data.category as Product['category'],
  unitPrice: Number(data.unit_price) || 0,
  unit: data.unit,
  lastEditedBy: data.last_edited_by || undefined,
  lastEditedAt: data.last_edited_at || undefined
});

export const mapProductToDB = (p: Partial<Product>): Partial<DBProduct> => ({
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
  designation: data.designation,
  role: data.role,
  email: data.email || undefined,
  phone: data.phone,
  salary: Number(data.salary) || 0,
  joinDate: data.join_date || '',
  assignedVehicle: data.assigned_vehicle || undefined,
  status: data.status || 'active',
  holidayStartDate: data.holiday_start_date || undefined,
  holidayReturnDate: data.holiday_return_date || undefined,
  lastEditedBy: data.last_edited_by || undefined,
  lastEditedAt: data.last_edited_at || undefined
});

export const mapEmployeeToDB = (e: Partial<Employee>): Partial<DBEmployee> => ({
  name: e.name,
  designation: e.designation,
  role: e.role,
  email: e.email || null,
  phone: e.phone,
  salary: safeNumber(e.salary),
  join_date: safeDateToDB(e.joinDate),
  assigned_vehicle: e.assignedVehicle,
  status: e.status || 'active',
  holiday_start_date: e.status === 'on_holiday' ? safeDateToDB(e.holidayStartDate) : null,
  holiday_return_date: e.status === 'on_holiday' ? safeDateToDB(e.holidayReturnDate) : null,
  last_edited_by: e.lastEditedBy,
  last_edited_at: safeTimestampToDB(e.lastEditedAt)
});

export const mapRequestFromDB = (data: DBServiceRequest): ServiceRequest => ({
  id: data.id,
  customerName: data.customer_name,
  phone: data.phone,
  location: data.location,
  addressLine1: data.address_line1 || undefined,
  addressLine2: data.address_line2 || undefined,
  city: data.city || undefined,
  district: data.district || undefined,
  state: data.state || undefined,
  pincode: data.pincode || undefined,
  date: data.date || '',
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
  // Unpack coordinates from "lat,lng" string
  latitude: data.location.includes(',') ? Number(data.location.split(',')[0]) : undefined,
  longitude: data.location.includes(',') ? Number(data.location.split(',')[1]) : undefined,
  items: Array.isArray(data.items) ? data.items : [],
  lastEditedBy: data.last_edited_by || undefined,
  lastEditedAt: data.last_edited_at || undefined,
  createdBy: data.created_by || undefined
});

export const mapRequestToDB = (r: Partial<ServiceRequest>): Partial<DBServiceRequest> => {
  // Pack coordinates into location string "lat,lng" if available
  let locationVal = r.location || '';
  if (r.latitude && r.longitude) {
    locationVal = `${r.latitude},${r.longitude}`;
  }

  return {
    customer_name: r.customerName,
    phone: r.phone,
    location: locationVal,
    address_line1: r.addressLine1 || null,
    address_line2: r.addressLine2 || null,
    city: r.city || null,
    district: r.district || null,
    state: r.state || null,
    pincode: r.pincode || null,
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
    items: r.items,
    last_edited_by: r.lastEditedBy,
    last_edited_at: safeTimestampToDB(r.lastEditedAt),
    created_by: r.createdBy
  };
};
export const mapVehicleFromDB = (data: DBVehicle): Vehicle => ({
  id: data.id,
  name: data.name,
  type: data.type,
  status: data.status,
  lastEditedBy: data.last_edited_by || undefined,
  lastEditedAt: data.last_edited_at || undefined
});

export const mapVehicleToDB = (v: Partial<Vehicle>): Partial<DBVehicle> => ({
  name: v.name,
  type: v.type,
  status: v.status,
  last_edited_by: v.lastEditedBy,
  last_edited_at: safeTimestampToDB(v.lastEditedAt)
});