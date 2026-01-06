// Database Row Types (Snake Case)
// These match exactly what comes back from Supabase

// Re-define for DB types to avoid circular imports
interface DBServiceItem {
    productId: string;
    quantity: number;
    priceAtTime: number;
}

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
    designation: string;
    role: 'admin' | 'staff';
    email: string | null;
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
    items: DBServiceItem[] | null;
    last_edited_by: string | null;
    last_edited_at: string | null;
    created_by: string | null;
}

export interface DBVehicle {
    id: string;
    name: string;
    type: string;
    status: string;
    last_edited_by: string | null;
    last_edited_at: string | null;
}

export interface DBExpense {
    id: string;
    date: string;
    type: 'Fuel' | 'Maintenance' | 'Salary' | 'Miscellaneous';
    amount: number;
    description: string | null;
    vehicle: string | null;
    last_edited_by: string | null;
    last_edited_at: string | null;
    created_by: string | null;
}
