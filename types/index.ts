// Application Types (Camel Case)
// These are used throughout the app components

// Enums
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

export enum View {
    HOME = 'Home',
    DASHBOARD = 'Dashboard',
    REQUESTS = 'Service Requests',
    NEW_REQUEST = 'New Request',
    EXPENSES = 'Expenses',
    NEW_EXPENSE = 'New Expense',
    INVENTORY = 'Inventory',
    EMPLOYEES = 'Employees',
    PROFILE = 'Profile',
}

// Base tracked entity interface
export interface TrackedEntity {
    lastEditedBy?: string;
    lastEditedAt?: string;
    createdBy?: string;
}

// Product
export interface Product extends TrackedEntity {
    id: string;
    name: string;
    category: 'Motor' | 'Pipe' | 'Cable' | 'Service' | 'Accessory';
    unitPrice: number;
    unit: string;
}

// Service Item (for service request line items)
export interface ServiceItem {
    productId: string;
    quantity: number;
    priceAtTime: number;
}

// Service Request
export interface ServiceRequest extends TrackedEntity {
    id: string;
    customerName: string;
    phone: string;
    location: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
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

// Employee
export interface Employee extends TrackedEntity {
    id: string;
    name: string;
    designation: string;
    role: 'admin' | 'staff';
    email?: string;
    phone: string;
    salary: number;
    joinDate: string;
    assignedVehicle?: string;
    status: 'active' | 'on_holiday';
    holidayStartDate?: string;
    holidayReturnDate?: string;
}

// Vehicle
export interface Vehicle extends TrackedEntity {
    id: string;
    name: string;
    type: string;
    status: string;
}

// Expense
export interface Expense extends TrackedEntity {
    id: string;
    date: string;
    type: 'Fuel' | 'Maintenance' | 'Salary' | 'Miscellaneous';
    amount: number;
    description?: string;
    vehicle?: string;
}

// User (current logged in user)
export interface User {
    name: string;
    email: string;
    phone?: string;
    photoURL?: string;
    isGuest?: boolean;
    role?: 'admin' | 'staff';
    employeeId?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
}
