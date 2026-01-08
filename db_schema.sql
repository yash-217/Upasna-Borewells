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
  location text, -- Stores "lat,lng" coordinates
  address_line1 text,
  address_line2 text,
  city text,
  district text,
  state text,
  pincode text,
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
  last_edited_at text,
  created_by text
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
  last_edited_at text,
  created_by text
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

-- ==========================================
-- AUTOMATION (FUNCTIONS & TRIGGERS)
-- ==========================================

-- 1. Helper Function: IS_ADMIN()
-- Security Definer to bypass RLS recursion when checking admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.employees
    WHERE email = (auth.jwt() ->> 'email')
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger: Handle New User
-- Ensures an entry in public.employees exists for every auth user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.employees (email, name, designation, role, join_date, phone)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'New Staff',
    'staff',
    CURRENT_DATE,
    COALESCE(NEW.raw_user_meta_data->>'phone', 'N/A')
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

alter table public.products enable row level security;
alter table public.employees enable row level security;
alter table public.service_requests enable row level security;
alter table public.expenses enable row level security;
alter table public.vehicles enable row level security;

-- 1. PRODUCTS (Inventory)
-- Read: All
-- Write: Admin Only
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Enable full access for admins" ON public.products
  FOR ALL USING (public.is_admin());

-- 2. EMPLOYEES
-- Read: All
-- Write: Admin (Everything), User (Self Update only)
CREATE POLICY "Enable read access for all users" ON public.employees FOR SELECT USING (true);

CREATE POLICY "Enable full access for admins" ON public.employees
  FOR ALL USING (public.is_admin());

CREATE POLICY "Enable self update" ON public.employees
  FOR UPDATE USING (
    email = (select auth.jwt() ->> 'email')
  );

-- 3. VEHICLES
-- Read: All
-- Write: Admin Only
CREATE POLICY "Enable read access for all users" ON public.vehicles FOR SELECT USING (true);

CREATE POLICY "Enable full access for admins" ON public.vehicles
  FOR ALL USING (public.is_admin());

-- 4. SERVICE REQUESTS
-- Read: All
-- Write: Admin (All), Staff (Insert & Update, No Delete)
CREATE POLICY "Enable read access for all users" ON public.service_requests FOR SELECT USING (true);

CREATE POLICY "Enable full access for admins" ON public.service_requests
  FOR ALL USING (public.is_admin());

CREATE POLICY "Enable insert for staff" ON public.service_requests
  FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );

CREATE POLICY "Enable update for staff" ON public.service_requests
  FOR UPDATE USING ( auth.role() = 'authenticated' );

-- 5. EXPENSES
-- Read: All
-- Write: Admin (All), Staff (Insert & Update, No Delete)
CREATE POLICY "Enable read access for all users" ON public.expenses FOR SELECT USING (true);

CREATE POLICY "Enable full access for admins" ON public.expenses
  FOR ALL USING (public.is_admin());

CREATE POLICY "Enable insert for staff" ON public.expenses
  FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );

CREATE POLICY "Enable update for staff" ON public.expenses
  FOR UPDATE USING ( auth.role() = 'authenticated' );