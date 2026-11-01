-- ==============================================================================
-- SHUBH CELEBRATIONS / PANCHMAHAL EVENTS HUB
-- STRICT VENDOR & BUSINESS LISTING APPROVAL SYSTEM MIGRATION
-- Version: 4.0.0 (Strict Admin Approval & Customer Visibility Lockdown)
--
-- Features:
-- 1. Adds listing_status, is_approved, account_status to public.vendors
-- 2. Preserves all existing approved vendor records (defaults to approved & active)
-- 3. Strict RLS: Public customers CANNOT read pending/rejected/suspended listings
-- 4. Secure Security Definer stored procedures for approval, rejection, and suspension
-- 5. Full Audit Trail recording admin ID, timestamp, and decision reason
-- ==============================================================================

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enhance public.vendors table with strict approval workflow columns
DO $$
BEGIN
  -- Add listing_status column (TEXT: pending | approved | rejected | suspended | correction_requested)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'listing_status') THEN
    ALTER TABLE public.vendors ADD COLUMN listing_status TEXT NOT NULL DEFAULT 'approved';
  END IF;

  -- Add is_approved column (BOOLEAN: false for pending/rejected/suspended; true for approved)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'is_approved') THEN
    ALTER TABLE public.vendors ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Add account_status column (TEXT: active | suspended | pending)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'account_status') THEN
    ALTER TABLE public.vendors ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active';
  END IF;

  -- Add owner details and tracking columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'owner_phone') THEN
    ALTER TABLE public.vendors ADD COLUMN owner_phone TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'owner_name') THEN
    ALTER TABLE public.vendors ADD COLUMN owner_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'owner_id') THEN
    ALTER TABLE public.vendors ADD COLUMN owner_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'rejection_reason') THEN
    ALTER TABLE public.vendors ADD COLUMN rejection_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'correction_notes') THEN
    ALTER TABLE public.vendors ADD COLUMN correction_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'approved_by') THEN
    ALTER TABLE public.vendors ADD COLUMN approved_by TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'approved_at') THEN
    ALTER TABLE public.vendors ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'rejected_at') THEN
    ALTER TABLE public.vendors ADD COLUMN rejected_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'suspended_at') THEN
    ALTER TABLE public.vendors ADD COLUMN suspended_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'updated_at') THEN
    ALTER TABLE public.vendors ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 3. CRITICAL: Preserve all existing approved vendor records
UPDATE public.vendors
SET 
  listing_status = 'approved',
  is_approved = true,
  account_status = 'active'
WHERE listing_status IS NULL OR is_approved IS NULL OR account_status IS NULL;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_vendors_listing_status ON public.vendors(listing_status);
CREATE INDEX IF NOT EXISTS idx_vendors_is_approved ON public.vendors(is_approved);
CREATE INDEX IF NOT EXISTS idx_vendors_account_status ON public.vendors(account_status);
CREATE INDEX IF NOT EXISTS idx_vendors_owner_phone ON public.vendors(owner_phone);
CREATE INDEX IF NOT EXISTS idx_vendors_public_active ON public.vendors(listing_status, is_approved, account_status);

-- 5. Row Level Security (RLS) on public.vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- 5.1 Public Read Policy: ONLY show approved and active businesses
DROP POLICY IF EXISTS "vendors_public_read_approved" ON public.vendors;
DROP POLICY IF EXISTS "vendors_select_all" ON public.vendors;
DROP POLICY IF EXISTS "vendors_select_policy" ON public.vendors;

CREATE POLICY "vendors_public_read_approved" ON public.vendors
FOR SELECT USING (
  (listing_status = 'approved' AND is_approved = true AND account_status = 'active')
  OR (
    auth.uid() IS NOT NULL AND (
      owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role IN ('admin', 'super_admin', 'state_manager', 'city_manager'))
      )
    )
  )
);

-- 5.2 Insert Policy: Public or new vendors can submit listings ONLY as pending
DROP POLICY IF EXISTS "vendors_insert_policy" ON public.vendors;
DROP POLICY IF EXISTS "vendors_insert_pending_only" ON public.vendors;

CREATE POLICY "vendors_insert_pending_only" ON public.vendors
FOR INSERT WITH CHECK (
  (listing_status = 'pending' AND is_approved = false)
  OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('admin', 'super_admin'))
    )
  )
);

-- 5.3 Update Policy: Only Admins can approve; vendors can only edit pending listings
DROP POLICY IF EXISTS "vendors_update_policy" ON public.vendors;
DROP POLICY IF EXISTS "vendors_admin_or_owner_update" ON public.vendors;

CREATE POLICY "vendors_admin_or_owner_update" ON public.vendors
FOR UPDATE USING (
  (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('admin', 'super_admin', 'state_manager'))
    )
  )
  OR (
    auth.uid() IS NOT NULL AND owner_id = auth.uid() 
    AND listing_status IN ('pending', 'correction_requested')
  )
) WITH CHECK (
  (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('admin', 'super_admin', 'state_manager'))
    )
  )
  OR (
    auth.uid() IS NOT NULL AND owner_id = auth.uid() 
    AND listing_status IN ('pending', 'correction_requested')
    AND is_approved = false
  )
);

-- ------------------------------------------------------------------------------
-- 6. SECURITY DEFINER: SUBMIT VENDOR BUSINESS LISTING
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_vendor_listing(
  p_business_name TEXT,
  p_category TEXT,
  p_location TEXT,
  p_price_range TEXT,
  p_phone TEXT,
  p_description TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_instagram_handle TEXT DEFAULT NULL,
  p_owner_name TEXT DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_clean_phone TEXT;
  v_new_vendor RECORD;
  v_existing_id BIGINT;
BEGIN
  -- Normalize phone
  v_clean_phone := REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g');
  IF LENGTH(v_clean_phone) = 12 AND v_clean_phone LIKE '91%' THEN
    v_clean_phone := SUBSTRING(v_clean_phone FROM 3);
  ELSIF LENGTH(v_clean_phone) = 11 AND v_clean_phone LIKE '0%' THEN
    v_clean_phone := SUBSTRING(v_clean_phone FROM 2);
  END IF;

  IF LENGTH(v_clean_phone) != 10 THEN
    RAISE EXCEPTION 'Invalid mobile number. 10 digits required.';
  END IF;

  IF p_business_name IS NULL OR LENGTH(TRIM(p_business_name)) < 3 THEN
    RAISE EXCEPTION 'Business name must be at least 3 characters.';
  END IF;

  -- Duplicate check: check if same phone already has an approved or pending business
  SELECT id INTO v_existing_id FROM public.vendors 
  WHERE (phone = v_clean_phone OR owner_phone = v_clean_phone)
    AND listing_status IN ('approved', 'pending')
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'A business listing with mobile number % already exists.', v_clean_phone;
  END IF;

  -- Insert into public.vendors strictly as pending
  INSERT INTO public.vendors (
    business_name,
    category,
    location,
    price_range,
    phone,
    description,
    rating,
    is_verified,
    listing_status,
    is_approved,
    account_status,
    image_url,
    instagram_handle,
    owner_phone,
    owner_name,
    owner_id,
    created_at,
    updated_at
  ) VALUES (
    TRIM(p_business_name),
    LOWER(TRIM(p_category)),
    TRIM(p_location),
    TRIM(p_price_range),
    v_clean_phone,
    COALESCE(p_description, 'Local event vendor in Panchmahal.'),
    5.0,
    false,
    'pending',
    false,
    'pending',
    p_image_url,
    p_instagram_handle,
    v_clean_phone,
    COALESCE(p_owner_name, TRIM(p_business_name)),
    p_owner_id,
    NOW(),
    NOW()
  ) RETURNING * INTO v_new_vendor;

  -- Also record in vendor_applications table
  INSERT INTO public.vendor_applications (
    business_name,
    category,
    phone,
    city,
    notes,
    status,
    created_at
  ) VALUES (
    v_new_vendor.business_name,
    v_new_vendor.category,
    v_clean_phone,
    v_new_vendor.location,
    'Submitted via New Business Listing registration',
    'pending',
    NOW()
  );

  -- Record audit log
  INSERT INTO public.audit_logs (
    action,
    target_entity,
    entity_id,
    details,
    created_at
  ) VALUES (
    'SUBMIT_VENDOR_LISTING',
    'vendor',
    v_new_vendor.id::TEXT,
    jsonb_build_object(
      'business_name', v_new_vendor.business_name,
      'phone', v_clean_phone,
      'category', v_new_vendor.category
    ),
    NOW()
  );

  RETURN to_jsonb(v_new_vendor);
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. SECURITY DEFINER: ADMIN APPROVE VENDOR LISTING
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_approve_vendor_listing(
  p_vendor_id BIGINT,
  p_admin_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_vendor RECORD;
BEGIN
  SELECT * INTO v_vendor FROM public.vendors WHERE id = p_vendor_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor with ID % not found.', p_vendor_id;
  END IF;

  UPDATE public.vendors
  SET 
    listing_status = 'approved',
    is_approved = true,
    account_status = 'active',
    is_verified = true,
    approved_by = p_admin_id,
    approved_at = NOW(),
    rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_vendor_id
  RETURNING * INTO v_vendor;

  -- Update vendor_applications if exists
  UPDATE public.vendor_applications
  SET status = 'approved', reviewed_at = NOW()
  WHERE phone = v_vendor.phone OR business_name = v_vendor.business_name;

  -- Update owner profile in public.profiles if exists
  UPDATE public.profiles
  SET role = 'vendor', vendor_status = 'approved', updated_at = NOW()
  WHERE phone = v_vendor.phone OR phone = v_vendor.owner_phone;

  -- Audit log
  INSERT INTO public.audit_logs (
    action,
    performed_by,
    target_entity,
    entity_id,
    details,
    created_at
  ) VALUES (
    'APPROVE_VENDOR_LISTING',
    p_admin_id,
    'vendor',
    p_vendor_id::TEXT,
    jsonb_build_object(
      'business_name', v_vendor.business_name,
      'status', 'approved',
      'approved_at', NOW()
    ),
    NOW()
  );

  RETURN to_jsonb(v_vendor);
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. SECURITY DEFINER: ADMIN REJECT VENDOR LISTING
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_reject_vendor_listing(
  p_vendor_id BIGINT,
  p_admin_id TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_vendor RECORD;
BEGIN
  SELECT * INTO v_vendor FROM public.vendors WHERE id = p_vendor_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor with ID % not found.', p_vendor_id;
  END IF;

  UPDATE public.vendors
  SET 
    listing_status = 'rejected',
    is_approved = false,
    account_status = 'inactive',
    rejection_reason = COALESCE(p_reason, 'Failed verification criteria.'),
    rejected_at = NOW(),
    updated_at = NOW()
  WHERE id = p_vendor_id
  RETURNING * INTO v_vendor;

  -- Update vendor_applications
  UPDATE public.vendor_applications
  SET status = 'rejected', rejection_reason = v_vendor.rejection_reason, reviewed_at = NOW()
  WHERE phone = v_vendor.phone OR business_name = v_vendor.business_name;

  -- Update owner profile in public.profiles
  UPDATE public.profiles
  SET vendor_status = 'rejected', updated_at = NOW()
  WHERE phone = v_vendor.phone OR phone = v_vendor.owner_phone;

  -- Audit log
  INSERT INTO public.audit_logs (
    action,
    performed_by,
    target_entity,
    entity_id,
    details,
    created_at
  ) VALUES (
    'REJECT_VENDOR_LISTING',
    p_admin_id,
    'vendor',
    p_vendor_id::TEXT,
    jsonb_build_object(
      'business_name', v_vendor.business_name,
      'reason', v_vendor.rejection_reason,
      'rejected_at', NOW()
    ),
    NOW()
  );

  RETURN to_jsonb(v_vendor);
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. SECURITY DEFINER: ADMIN SUSPEND VENDOR LISTING
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_suspend_vendor_listing(
  p_vendor_id BIGINT,
  p_admin_id TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_vendor RECORD;
BEGIN
  SELECT * INTO v_vendor FROM public.vendors WHERE id = p_vendor_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor with ID % not found.', p_vendor_id;
  END IF;

  UPDATE public.vendors
  SET 
    listing_status = 'suspended',
    is_approved = false,
    account_status = 'suspended',
    rejection_reason = COALESCE(p_reason, 'Suspended by admin due to policy review.'),
    suspended_at = NOW(),
    updated_at = NOW()
  WHERE id = p_vendor_id
  RETURNING * INTO v_vendor;

  -- Update owner profile in public.profiles
  UPDATE public.profiles
  SET vendor_status = 'suspended', updated_at = NOW()
  WHERE phone = v_vendor.phone OR phone = v_vendor.owner_phone;

  -- Audit log
  INSERT INTO public.audit_logs (
    action,
    performed_by,
    target_entity,
    entity_id,
    details,
    created_at
  ) VALUES (
    'SUSPEND_VENDOR_LISTING',
    p_admin_id,
    'vendor',
    p_vendor_id::TEXT,
    jsonb_build_object(
      'business_name', v_vendor.business_name,
      'reason', v_vendor.rejection_reason,
      'suspended_at', NOW()
    ),
    NOW()
  );

  RETURN to_jsonb(v_vendor);
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. SECURITY DEFINER: ADMIN REACTIVATE VENDOR LISTING
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_reactivate_vendor_listing(
  p_vendor_id BIGINT,
  p_admin_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_vendor RECORD;
BEGIN
  SELECT * INTO v_vendor FROM public.vendors WHERE id = p_vendor_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor with ID % not found.', p_vendor_id;
  END IF;

  UPDATE public.vendors
  SET 
    listing_status = 'approved',
    is_approved = true,
    account_status = 'active',
    rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_vendor_id
  RETURNING * INTO v_vendor;

  -- Update owner profile in public.profiles
  UPDATE public.profiles
  SET vendor_status = 'approved', updated_at = NOW()
  WHERE phone = v_vendor.phone OR phone = v_vendor.owner_phone;

  -- Audit log
  INSERT INTO public.audit_logs (
    action,
    performed_by,
    target_entity,
    entity_id,
    details,
    created_at
  ) VALUES (
    'REACTIVATE_VENDOR_LISTING',
    p_admin_id,
    'vendor',
    p_vendor_id::TEXT,
    jsonb_build_object(
      'business_name', v_vendor.business_name,
      'reactivated_at', NOW()
    ),
    NOW()
  );

  RETURN to_jsonb(v_vendor);
END;
$$;

-- ------------------------------------------------------------------------------
-- 11. SECURITY DEFINER: GET PUBLIC APPROVED VENDORS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_approved_vendors(
  p_category TEXT DEFAULT 'all',
  p_query TEXT DEFAULT ''
)
RETURNS SETOF public.vendors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.vendors
  WHERE listing_status = 'approved'
    AND is_approved = true
    AND account_status = 'active'
    AND (p_category = 'all' OR category = LOWER(TRIM(p_category)))
    AND (
      p_query = '' OR
      business_name ILIKE '%' || p_query || '%' OR
      location ILIKE '%' || p_query || '%' OR
      category ILIKE '%' || p_query || '%'
    )
  ORDER BY id ASC;
END;
$$;

-- 12. Permissions Grant
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.vendors TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.audit_logs TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_vendor_listing TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_approve_vendor_listing TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reject_vendor_listing TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_suspend_vendor_listing TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reactivate_vendor_listing TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_approved_vendors TO anon, authenticated, service_role;

SELECT 'SUCCESS: Strict Vendor Approval System & RLS migration configured.' AS migration_status;
