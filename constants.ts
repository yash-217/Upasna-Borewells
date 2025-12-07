import { Employee, Product, ServiceRequest, ServiceStatus, ServiceType } from "./types";

export const VEHICLES = [
  'Rig KA-01 (Drilling)',
  'Rig KA-02 (Drilling)',
  'Truck MH-12 (Support)',
  'Pickup TN-05 (Service)',
  'Jeep KA-55 (Survey)'
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: '6" PVC Casing Pipe', category: 'Pipe', unitPrice: 450, unit: 'ft' },
  { id: 'p2', name: '4" PVC Casing Pipe', category: 'Pipe', unitPrice: 280, unit: 'ft' },
  { id: 'p3', name: '5HP Submersible Pump (Texmo)', category: 'Motor', unitPrice: 28000, unit: 'pcs' },
  { id: 'p4', name: '7.5HP Submersible Pump (Texmo)', category: 'Motor', unitPrice: 35000, unit: 'pcs' },
  { id: 'p5', name: '3 Core 2.5mm Flat Cable', category: 'Cable', unitPrice: 65, unit: 'meter' },
  { id: 'p6', name: 'Drilling Charge (Standard Soil)', category: 'Service', unitPrice: 110, unit: 'ft' },
  { id: 'p7', name: 'Drilling Charge (Hard Rock)', category: 'Service', unitPrice: 160, unit: 'ft' },
  { id: 'p8', name: 'Installation Labor', category: 'Service', unitPrice: 2500, unit: 'pcs' },
  { id: 'p9', name: 'Starter Panel', category: 'Accessory', unitPrice: 4500, unit: 'pcs' },
  { id: 'p10', name: 'Safety Rope (Nylon)', category: 'Accessory', unitPrice: 15, unit: 'meter' },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Ramesh Kumar', role: 'Drilling Supervisor', phone: '9876543210', salary: 25000, joinDate: '2021-03-15', assignedVehicle: 'Rig KA-01 (Drilling)' },
  { id: 'e2', name: 'Suresh Singh', role: 'Motor Mechanic', phone: '9876543211', salary: 22000, joinDate: '2022-01-10', assignedVehicle: 'Pickup TN-05 (Service)' },
  { id: 'e3', name: 'Mahesh Yadav', role: 'Helper', phone: '9876543212', salary: 15000, joinDate: '2023-06-01', assignedVehicle: 'Rig KA-01 (Drilling)' },
];

export const INITIAL_REQUESTS: ServiceRequest[] = [
  {
    id: 'sr1',
    customerName: 'Rajesh Gupta',
    phone: '9988776655',
    location: 'Sector 4, Industrial Area',
    date: '2023-10-15',
    type: ServiceType.DRILLING,
    status: ServiceStatus.COMPLETED,
    vehicle: 'Rig KA-01 (Drilling)',
    notes: 'Hard rock encountered at 200ft. Drilling continued successfully.',
    items: [
      { productId: 'p1', quantity: 20, priceAtTime: 450 },
      { productId: 'p6', quantity: 300, priceAtTime: 110 },
    ],
    totalCost: 42000 // (20*450 + 300*110) = 9000 + 33000 = 42000
  },
  {
    id: 'sr2',
    customerName: 'Amit Farmhouse',
    phone: '8877665544',
    location: 'Village Raipur',
    date: '2023-10-20',
    type: ServiceType.MOTOR_INSTALLATION,
    status: ServiceStatus.COMPLETED,
    vehicle: 'Truck MH-12 (Support)',
    items: [
      { productId: 'p3', quantity: 1, priceAtTime: 28000 },
      { productId: 'p5', quantity: 150, priceAtTime: 65 },
      { productId: 'p8', quantity: 1, priceAtTime: 2500 },
    ],
    totalCost: 40250 // 28000 + 9750 + 2500 = 40250
    , notes: ''
  },
  {
    id: 'sr3',
    customerName: 'City Park Management',
    phone: '7766554433',
    location: 'Central Park Zone A',
    date: '2023-11-05',
    type: ServiceType.REPAIR,
    status: ServiceStatus.PENDING,
    vehicle: 'Pickup TN-05 (Service)',
    items: [
      { productId: 'p8', quantity: 1, priceAtTime: 2500 },
    ],
    totalCost: 2500
    , notes: 'Motor not starting, suspect capacitor issue.'
  }
];