-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PRODUCTS TABLE
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  category text not null, -- 'Motor', 'Pipe', etc.
  unit_price numeric default 0,
  unit text default 'pcs',
  last_edited_by text,
  last_edited_at text
);

-- 2. EMPLOYEES TABLE
create table public.employees (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  designation text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  email text unique,
  phone text,
  salary numeric default 0,
  join_date date,
  assigned_vehicle text,
  last_edited_by text,
  last_edited_at text
);

-- 3. SERVICE REQUESTS TABLE
create table public.service_requests (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  phone text,
  location text,
  date date default current_date,
  type text not null, -- 'Drilling', 'Repair'
  status text default 'Pending',
  vehicle text,
  notes text,
  total_cost numeric default 0,
  drilling_depth numeric default 0,
  drilling_rate numeric default 0,
  items jsonb default '[]'::jsonb, -- Stores array of {productId, quantity, price}
  last_edited_by text,
  last_edited_at text
);

-- 4. EXPENSES TABLE
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null,
  type text not null check (type in ('Fuel', 'Maintenance', 'Salary', 'Miscellaneous')),
  amount numeric not null,
  description text,
  last_edited_by text,
  last_edited_at text
);

-- 5. Vehicles TABLE
CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- e.g., 'Drilling', 'Support', 'Service', 'Survey'
  status TEXT DEFAULT 'Active', -- 'Active', 'Maintenance', 'Retired'
  last_edited_by TEXT,
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Goal: Authenticated users can do everything. Anon users can do nothing (except login).

alter table public.products enable row level security;
alter table public.employees enable row level security;
alter table public.service_requests enable row level security;
alter table public.expenses enable row level security;
-- Products Policies
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- Employees Policies
CREATE POLICY "Enable read access for all users" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON public.employees FOR ALL USING (auth.role() = 'authenticated');

-- Service Requests Policies
CREATE POLICY "Enable read access for all users" ON public.service_requests FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON public.service_requests FOR ALL USING (auth.role() = 'authenticated');

-- Expenses Policies
CREATE POLICY "Enable read access for all users" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');

-- Vehicles Policies
CREATE POLICY "Enable read access for all users" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON public.vehicles FOR ALL USING (auth.role() = 'authenticated');
