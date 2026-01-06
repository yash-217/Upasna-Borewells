-- Migration: Add profile address columns to employees table
-- Run this in your Supabase SQL Editor

ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT;

-- Optional: Add comment for documentation
COMMENT ON COLUMN employees.address_line1 IS 'User address line 1 (building, street)';
COMMENT ON COLUMN employees.address_line2 IS 'User address line 2 (area, landmark)';
COMMENT ON COLUMN employees.city IS 'User city';
COMMENT ON COLUMN employees.state IS 'User state';
COMMENT ON COLUMN employees.pincode IS 'User postal/pincode';
