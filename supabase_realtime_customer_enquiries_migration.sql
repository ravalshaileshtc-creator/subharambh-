-- ==============================================================================
-- SHUBH CELEBRATIONS – REAL-TIME CUSTOMER ENQUIRIES & QUOTATIONS MIGRATION
-- Enables RLS policies for seamless insert, select, and real-time syncing
-- ==============================================================================

-- 1. Ensure public.enquiries table exists
CREATE TABLE IF NOT EXISTS public.enquiries (
  id BIGSERIAL PRIMARY KEY,
  enquiry_code TEXT UNIQUE NOT NULL,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'wedding',
  event_date DATE NOT NULL,
  city_id TEXT DEFAULT 'godhra',
  state_id VARCHAR(4) DEFAULT 'GJ',
  guest_count TEXT,
  budget NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add extra columns if missing (services, status, matched_vendor_ids, location)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Godhra';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Dispatched to Vendors';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS matched_vendor_ids JSONB DEFAULT '[]'::jsonb;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 3. Row Level Security Policies for enquiries
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enquiries_select_policy" ON public.enquiries;
CREATE POLICY "enquiries_select_policy" ON public.enquiries
FOR SELECT USING (true);

DROP POLICY IF EXISTS "enquiries_insert_policy" ON public.enquiries;
CREATE POLICY "enquiries_insert_policy" ON public.enquiries
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "enquiries_update_policy" ON public.enquiries;
CREATE POLICY "enquiries_update_policy" ON public.enquiries
FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Ensure public.quotations table exists
CREATE TABLE IF NOT EXISTS public.quotations (
  id BIGSERIAL PRIMARY KEY,
  enquiry_id BIGINT REFERENCES public.enquiries(id) ON DELETE CASCADE,
  enquiry_code TEXT,
  vendor_id BIGINT,
  vendor_name TEXT,
  category TEXT,
  quoted_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  quoted_price TEXT,
  package_details TEXT,
  valid_until TEXT DEFAULT '15 Days',
  status TEXT NOT NULL DEFAULT 'Sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add extra columns to quotations if missing
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS enquiry_code TEXT;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS vendor_name TEXT;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS category TEXT;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS quoted_price TEXT;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 5. Row Level Security Policies for quotations
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotations_select_policy" ON public.quotations;
CREATE POLICY "quotations_select_policy" ON public.quotations
FOR SELECT USING (true);

DROP POLICY IF EXISTS "quotations_insert_policy" ON public.quotations;
CREATE POLICY "quotations_insert_policy" ON public.quotations
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "quotations_update_policy" ON public.quotations;
CREATE POLICY "quotations_update_policy" ON public.quotations
FOR UPDATE USING (true) WITH CHECK (true);
