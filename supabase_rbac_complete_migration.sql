-- ==============================================================================
-- SHUBH CELEBRATIONS / PANCHMAHAL EVENTS HUB
-- PRODUCTION SUPABASE RBAC (ROLE-BASED ACCESS CONTROL) COMPLETE MIGRATION
-- Version: 2.0.0
--
-- ROLES: customer | vendor | admin
-- VENDOR STATUSES: not_applicable | pending | approved | rejected
-- ==============================================================================

-- 1. EXTENSIONS & CUSTOM ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('customer', 'vendor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vendor_status_type AS ENUM ('not_applicable', 'pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. PUBLIC.PROFILES TABLE (LINKED TO AUTH.USERS)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'customer',
  vendor_status vendor_status_type NOT NULL DEFAULT 'not_applicable',
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role lookup performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_vendor_status ON public.profiles(vendor_status);

-- 3. EXTEND PUBLIC.VENDORS (IF NOT ALREADY PRESENT)
ALTER TABLE public.vendors 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_status vendor_status_type NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_status ON public.vendors(vendor_status);

-- 4. PUBLIC.VENDOR_APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Godhra',
  notes TEXT,
  status vendor_status_type NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_apps_user ON public.vendor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_apps_status ON public.vendor_applications(status);

-- 5. PUBLIC.BOOKINGS TABLE (MULTI-TENANT ISOLATED)
CREATE TABLE IF NOT EXISTS public.bookings (
  id BIGSERIAL PRIMARY KEY,
  booking_code TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  vendor_id BIGINT REFERENCES public.vendors(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  category TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_location TEXT NOT NULL,
  guest_count TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  -- STRICTLY SENSITIVE FIELDS: Hidden from Customers & Vendors
  internal_vendor_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  company_margin NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Completed', 'Cancelled'
  payment_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Partial', 'Paid'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor ON public.bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(event_date);

-- 6. PUBLIC.PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGSERIAL PRIMARY KEY,
  payment_id TEXT UNIQUE NOT NULL,
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id BIGINT REFERENCES public.vendors(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'UPI', -- 'UPI', 'Cash', 'Bank Transfer'
  transaction_ref TEXT,
  status TEXT NOT NULL DEFAULT 'Success',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_vendor ON public.payments(vendor_id);

-- 7. PUBLIC.COMPANY_FINANCIALS (STRICTLY RESTRICTED TO SUPERADMIN)
CREATE TABLE IF NOT EXISTS public.company_financials (
  id SERIAL PRIMARY KEY,
  financial_year TEXT NOT NULL UNIQUE,
  total_turnover NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  vendor_payouts NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  platform_commission NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  operational_costs NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  net_company_profit NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Company Financials if not present
INSERT INTO public.company_financials (financial_year, total_turnover, vendor_payouts, platform_commission, operational_costs, net_company_profit)
VALUES ('2026-2027', 1845000.00, 1485000.00, 360000.00, 85000.00, 275000.00)
ON CONFLICT (financial_year) DO NOTHING;

-- 8. SECURITY HELPER FUNCTIONS (WITH FIXED SEARCH_PATH TO PREVENT INJECTION)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_approved_vendor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'vendor' AND vendor_status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_vendor_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT id FROM public.vendors
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT role::text FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_vendor_status()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT vendor_status::text FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- 9. TRIGGERS: PREVENT SELF-ROLE TAMPERING & NEW USER DEFAULTS
CREATE OR REPLACE FUNCTION public.prevent_role_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- If non-admin attempts to change their own role or vendor_status
  IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.vendor_status IS DISTINCT FROM NEW.vendor_status) THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION '403 Forbidden: Only Superadmin can modify user roles or vendor approval status.';
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_tampering ON public.profiles;
CREATE TRIGGER trg_prevent_role_tampering
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_tampering();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Strict security: All new signups default to customer and not_applicable
  INSERT INTO public.profiles (id, role, vendor_status, full_name, phone)
  VALUES (
    NEW.id,
    'customer',
    'not_applicable',
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Valued Customer'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_financials ENABLE ROW LEVEL SECURITY;

-- ---------------- PROFILES POLICIES ----------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- ---------------- VENDOR APPLICATIONS POLICIES ----------------
DROP POLICY IF EXISTS "vendor_apps_insert_own" ON public.vendor_applications;
CREATE POLICY "vendor_apps_insert_own" ON public.vendor_applications
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vendor_apps_select_own" ON public.vendor_applications;
CREATE POLICY "vendor_apps_select_own" ON public.vendor_applications
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "vendor_apps_admin_all" ON public.vendor_applications;
CREATE POLICY "vendor_apps_admin_all" ON public.vendor_applications
FOR ALL USING (public.is_admin());

-- ---------------- VENDORS POLICIES ----------------
DROP POLICY IF EXISTS "vendors_public_read_approved" ON public.vendors;
CREATE POLICY "vendors_public_read_approved" ON public.vendors
FOR SELECT USING (vendor_status = 'approved' OR user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "vendors_update_own" ON public.vendors;
CREATE POLICY "vendors_update_own" ON public.vendors
FOR UPDATE USING ((user_id = auth.uid() AND public.is_approved_vendor()) OR public.is_admin());

DROP POLICY IF EXISTS "vendors_admin_all" ON public.vendors;
CREATE POLICY "vendors_admin_all" ON public.vendors
FOR ALL USING (public.is_admin());

-- ---------------- BOOKINGS POLICIES ----------------
-- Note: Internal costs & company margins are restricted at the DB column grant level
DROP POLICY IF EXISTS "bookings_customer_read_own" ON public.bookings;
CREATE POLICY "bookings_customer_read_own" ON public.bookings
FOR SELECT USING (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "bookings_vendor_read_assigned" ON public.bookings;
CREATE POLICY "bookings_vendor_read_assigned" ON public.bookings
FOR SELECT USING ((vendor_id = public.get_my_vendor_id() AND public.is_approved_vendor()) OR public.is_admin());

DROP POLICY IF EXISTS "bookings_vendor_update_assigned" ON public.bookings;
CREATE POLICY "bookings_vendor_update_assigned" ON public.bookings
FOR UPDATE USING ((vendor_id = public.get_my_vendor_id() AND public.is_approved_vendor()) OR public.is_admin());

DROP POLICY IF EXISTS "bookings_admin_all" ON public.bookings;
CREATE POLICY "bookings_admin_all" ON public.bookings
FOR ALL USING (public.is_admin());

-- ---------------- PAYMENTS POLICIES ----------------
DROP POLICY IF EXISTS "payments_customer_read" ON public.payments;
CREATE POLICY "payments_customer_read" ON public.payments
FOR SELECT USING (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "payments_vendor_read" ON public.payments;
CREATE POLICY "payments_vendor_read" ON public.payments
FOR SELECT USING ((vendor_id = public.get_my_vendor_id() AND public.is_approved_vendor()) OR public.is_admin());

DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all" ON public.payments
FOR ALL USING (public.is_admin());

-- ---------------- COMPANY FINANCIALS POLICIES (SUPERADMIN ONLY) ----------------
DROP POLICY IF EXISTS "company_financials_admin_only" ON public.company_financials;
CREATE POLICY "company_financials_admin_only" ON public.company_financials
FOR ALL USING (public.is_admin());
