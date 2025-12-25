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
  role text not null,
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
CREATE TABLE public.expenses (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Fuel', 'Maintenance', 'Salary', 'Miscellaneous')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Goal: Authenticated users can do everything. Anon users can do nothing (except login).

alter table public.products enable row level security;
alter table public.employees enable row level security;
alter table public.service_requests enable row level security;
alter table public.expenses enable row level security;

-- Policy: Allow full access to authenticated users
create policy "Allow full access to authenticated users" on public.products
  for all to authenticated using (true) with check (true);

create policy "Allow full access to authenticated users" on public.employees
  for all to authenticated using (true) with check (true);

create policy "Allow full access to authenticated users" on public.service_requests
  for all to authenticated using (true) with check (true);

create policy "Allow full access to authenticated users" on public.expenses
  for all to authenticated using (true) with check (true);

-- Optional: Allow Guest (Read-Only) if you implement a specific "guest" role
-- create policy "Allow read access to guests" on public.products
--   for select to authenticated using (auth.jwt() ->> 'email' = 'guest@upasna.local');