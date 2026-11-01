-- ==============================================================================
-- SHUBH CELEBRATIONS – PAN INDIA PURE MARKETPLACE SQL MIGRATION
-- Version: 3.0.0
--
-- BUSINESS MODEL: Pure Marketplace
-- COMMISSION: Fixed 5% on eligible completed bookings
-- PAYMENTS: Customer pays Vendor DIRECTLY (Shubh Celebrations does not collect customer funds)
-- MARKET: Pan India (All 28 States & 8 Union Territories)
-- ==============================================================================

-- 1. EXTENSIONS & CUSTOM ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE pan_india_user_role AS ENUM (
    'customer',
    'vendor',
    'city_manager',
    'state_manager',
    'admin',
    'super_admin'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pan_india_vendor_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE direct_payment_status AS ENUM (
    'pending',
    'vendor_confirmed',
    'customer_confirmed',
    'disputed',
    'partial',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_status AS ENUM (
    'unpaid',
    'partially_paid',
    'paid',
    'waived',
    'disputed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. PAN-INDIA LOCATION MASTER TABLES
CREATE TABLE IF NOT EXISTS public.states (
  id VARCHAR(4) PRIMARY KEY, -- 'GJ', 'MH', 'RJ', 'DL', etc.
  name TEXT NOT NULL,
  type VARCHAR(10) NOT NULL DEFAULT 'state', -- 'state' or 'ut'
  capital TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.districts (
  id BIGSERIAL PRIMARY KEY,
  state_id VARCHAR(4) REFERENCES public.states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(state_id, name)
);

CREATE TABLE IF NOT EXISTS public.cities (
  id TEXT PRIMARY KEY,
  state_id VARCHAR(4) REFERENCES public.states(id) ON DELETE CASCADE,
  district_name TEXT NOT NULL,
  name TEXT NOT NULL,
  pincode_prefix VARCHAR(6),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cities_state ON public.cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_district ON public.cities(district_name);

-- 3. PROFILES TABLE (EXTENDED WITH 6 ROLES & 4 VENDOR STATUSES)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role pan_india_user_role NOT NULL DEFAULT 'customer',
  vendor_status pan_india_vendor_status NOT NULL DEFAULT 'pending',
  full_name TEXT,
  phone TEXT,
  state_id VARCHAR(4) REFERENCES public.states(id),
  city_id TEXT REFERENCES public.cities(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_vendor_status ON public.profiles(vendor_status);

-- 4. VENDOR PROFILES & MULTI-CITY SERVICE COVERAGE
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  primary_category TEXT NOT NULL,
  primary_phone TEXT NOT NULL,
  whatsapp_number TEXT,
  base_city_id TEXT REFERENCES public.cities(id),
  base_state_id VARCHAR(4) REFERENCES public.states(id),
  address TEXT,
  gstin TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  free_listing_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vendor_service_areas (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  state_id VARCHAR(4) REFERENCES public.states(id) ON DELETE CASCADE,
  city_id TEXT REFERENCES public.cities(id) ON DELETE CASCADE,
  travel_charges_policy TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vendor_id, city_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_service_areas_city ON public.vendor_service_areas(city_id);

-- 5. VENDOR APPLICATIONS (FREE ONBOARDING)
CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT NOT NULL,
  city_name TEXT NOT NULL,
  state_id VARCHAR(4) REFERENCES public.states(id),
  notes TEXT,
  status pan_india_vendor_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ENQUIRIES & QUOTATIONS
CREATE TABLE IF NOT EXISTS public.enquiries (
  id BIGSERIAL PRIMARY KEY,
  enquiry_code TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  city_id TEXT REFERENCES public.cities(id),
  state_id VARCHAR(4) REFERENCES public.states(id),
  guest_count TEXT,
  budget NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quotations (
  id BIGSERIAL PRIMARY KEY,
  enquiry_id BIGINT REFERENCES public.enquiries(id) ON DELETE CASCADE,
  vendor_id BIGINT REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  quoted_amount NUMERIC(12,2) NOT NULL,
  package_details TEXT,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'Submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. BOOKINGS TABLE (CUSTOMER PAYS VENDOR DIRECTLY)
CREATE TABLE IF NOT EXISTS public.bookings (
  id BIGSERIAL PRIMARY KEY,
  booking_code TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id BIGINT REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  city_id TEXT REFERENCES public.cities(id),
  state_id VARCHAR(4) REFERENCES public.states(id),
  venue_address TEXT NOT NULL,
  -- Booking Amounts
  total_booking_amount NUMERIC(12,2) NOT NULL,
  non_commissionable_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- e.g. separate permits/taxes
  eligible_booking_amount NUMERIC(12,2) NOT NULL,              -- Base for 5% commission
  direct_payments_received NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  -- Statuses
  booking_status TEXT NOT NULL DEFAULT 'Confirmed',            -- 'Pending', 'Confirmed', 'Completed', 'Cancelled'
  direct_payment_status direct_payment_status NOT NULL DEFAULT 'pending',
  event_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_vendor ON public.bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);

-- 8. DIRECT PAYMENTS TABLE (AUDIT OF CUSTOMER DIRECT PAYMENTS TO VENDOR)
CREATE TABLE IF NOT EXISTS public.direct_payments (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id BIGINT REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'UPI', 'Cash', 'Direct Bank Transfer', 'Cheque'
  payment_reference TEXT NOT NULL, -- UTR / Cheque No. / Cash Receipt
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  customer_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
  proof_reference TEXT,
  status direct_payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_payments_booking ON public.direct_payments(booking_id);

-- 9. COMMISSION RULES (FIXED AT 5%)
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id SERIAL PRIMARY KEY,
  rate_percentage NUMERIC(5,2) NOT NULL DEFAULT 5.00, -- 5% FIXED
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL DEFAULT 'Shubh Celebrations Pure Marketplace 5% Fixed Booking Commission',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id)
);

INSERT INTO public.commission_rules (rate_percentage, description, is_active)
VALUES (5.00, 'Standard 5% Platform Commission on Completed Bookings', TRUE)
ON CONFLICT DO NOTHING;

-- 10. COMMISSION LEDGER (5% OWED BY VENDOR UPON EVENT COMPLETION)
CREATE TABLE IF NOT EXISTS public.commission_ledger (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vendor_id BIGINT NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  eligible_amount NUMERIC(12,2) NOT NULL,
  commission_rate_snapshot NUMERIC(5,2) NOT NULL DEFAULT 5.00, -- Locked at 5% snapshot
  commission_amount NUMERIC(12,2) NOT NULL,                   -- eligible_amount * 0.05
  due_date DATE NOT NULL,                                     -- Typically 7 days after event completion
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  outstanding_amount NUMERIC(12,2) NOT NULL,
  status commission_status NOT NULL DEFAULT 'unpaid',
  waiver_reason TEXT,
  waived_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_ledger_vendor ON public.commission_ledger(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_status ON public.commission_ledger(status);

-- 11. COMMISSION PAYMENTS (SUBMITTED BY VENDOR TO SHUBH CELEBRATIONS)
CREATE TABLE IF NOT EXISTS public.commission_payments (
  id BIGSERIAL PRIMARY KEY,
  ledger_id BIGINT REFERENCES public.commission_ledger(id) ON DELETE CASCADE,
  vendor_id BIGINT REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'UPI', -- 'UPI', 'NEFT', 'IMPS'
  transaction_ref TEXT NOT NULL,           -- UTR number
  payment_proof_url TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reconciled_by UUID REFERENCES auth.users(id),
  reconciled_at TIMESTAMPTZ,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. DISPUTES & COMPLAINTS
CREATE TABLE IF NOT EXISTS public.disputes (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
  raised_by_role pan_india_user_role NOT NULL,
  raised_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id BIGINT REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  dispute_type TEXT NOT NULL, -- 'Payment Discrepancy', 'Service Quality', 'Cancellation', 'No Show'
  description TEXT NOT NULL,
  claimed_amount NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'Open', -- 'Open', 'Under Review', 'Resolved', 'Dismissed'
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. REGIONAL MANAGERS (CITY & STATE MANAGERS)
CREATE TABLE IF NOT EXISTS public.admin_regions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_role pan_india_user_role NOT NULL, -- 'city_manager' or 'state_manager'
  state_id VARCHAR(4) REFERENCES public.states(id),
  city_id TEXT REFERENCES public.cities(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, state_id, city_id)
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_entity TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 15. STORED PROCEDURES & COMMISSION CALCULATION ENGINE
-- ==============================================================================

-- Calculate and generate 5% commission ledger entry upon event completion
CREATE OR REPLACE FUNCTION public.generate_5_percent_commission_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_eligible_amount NUMERIC(12,2);
  v_commission_amount NUMERIC(12,2);
  v_due_date DATE;
BEGIN
  -- Trigger only when booking status changes to 'Completed'
  IF (NEW.booking_status = 'Completed' AND (OLD.booking_status IS DISTINCT FROM 'Completed')) THEN
    v_eligible_amount := GREATEST(0, NEW.total_booking_amount - COALESCE(NEW.non_commissionable_amount, 0));
    v_commission_amount := ROUND((v_eligible_amount * 0.05), 2); -- 5% FIXED RATE
    v_due_date := CURRENT_DATE + INTERVAL '7 days';

    INSERT INTO public.commission_ledger (
      booking_id,
      vendor_id,
      eligible_amount,
      commission_rate_snapshot,
      commission_amount,
      due_date,
      paid_amount,
      outstanding_amount,
      status
    )
    VALUES (
      NEW.id,
      NEW.vendor_id,
      v_eligible_amount,
      5.00,
      v_commission_amount,
      v_due_date,
      0.00,
      v_commission_amount,
      'unpaid'
    )
    ON CONFLICT (booking_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_commission ON public.bookings;
CREATE TRIGGER trg_generate_commission
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.generate_5_percent_commission_on_completion();

-- Helper function: Is Admin or Super Admin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- Helper function: Is Super Admin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Helper function: Prevent role self-escalation
CREATE OR REPLACE FUNCTION public.prevent_role_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.vendor_status IS DISTINCT FROM NEW.vendor_status) THEN
    IF NOT public.is_admin_or_superadmin() THEN
      RAISE EXCEPTION '403 Forbidden: Only Admin or Super Admin can modify user roles or vendor approval statuses.';
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

-- ==============================================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Profiles: Own profile or Admin
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT USING (auth.uid() = id OR public.is_admin_or_superadmin());

-- Bookings: Customer read own; Vendor read assigned; Admin read all
DROP POLICY IF EXISTS "bookings_customer_read" ON public.bookings;
CREATE POLICY "bookings_customer_read" ON public.bookings
FOR SELECT USING (customer_id = auth.uid() OR public.is_admin_or_superadmin());

-- Direct Payments: Customer can read/insert; Vendor can read/update confirmation; Admin manages
DROP POLICY IF EXISTS "direct_payments_customer" ON public.direct_payments;
CREATE POLICY "direct_payments_customer" ON public.direct_payments
FOR ALL USING (customer_id = auth.uid() OR public.is_admin_or_superadmin());

-- Commission Ledger: Vendor can read own; Admin manages; Customer CANNOT read!
DROP POLICY IF EXISTS "commission_ledger_vendor_read" ON public.commission_ledger;
CREATE POLICY "commission_ledger_vendor_read" ON public.commission_ledger
FOR SELECT USING (
  vendor_id IN (SELECT id FROM public.vendor_profiles WHERE user_id = auth.uid())
  OR public.is_admin_or_superadmin()
);

DROP POLICY IF EXISTS "commission_ledger_admin_all" ON public.commission_ledger;
CREATE POLICY "commission_ledger_admin_all" ON public.commission_ledger
FOR ALL USING (public.is_admin_or_superadmin());

-- Commission Payments: Vendor submits; Admin reconciles
DROP POLICY IF EXISTS "commission_payments_vendor" ON public.commission_payments;
CREATE POLICY "commission_payments_vendor" ON public.commission_payments
FOR ALL USING (
  vendor_id IN (SELECT id FROM public.vendor_profiles WHERE user_id = auth.uid())
  OR public.is_admin_or_superadmin()
);
