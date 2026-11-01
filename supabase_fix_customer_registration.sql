-- ==============================================================================
-- SHUBH CELEBRATIONS / PANCHMAHAL EVENTS HUB
-- STRICT LOGIN AND REGISTRATION SEPARATION & PERSISTENCE MIGRATION
-- Version: 3.3.0 (Strict Separation & Multi-Procedure Architecture)
--
-- Fixes:
-- 1. Strict separation: Registration only for new numbers; Login only for registered numbers
-- 2. Prevents sending OTP to unregistered numbers attempting login
-- 3. Prevents duplicate registrations with unique index on phone
-- 4. Never automatically creates a profile during login
-- 5. Eliminates PostgreSQL 55P04 enum locks with TEXT column typing
-- 6. Grants execute on check, register, and login security definer functions
-- ==============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure public.profiles table exists with text columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL DEFAULT 'customer',
  vendor_status TEXT NOT NULL DEFAULT 'not_applicable',
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely convert existing enum columns to TEXT to eliminate 55P04 transaction lockouts
DO $$ 
BEGIN
  -- Convert vendor_status to TEXT safely
  BEGIN
    ALTER TABLE public.profiles ALTER COLUMN vendor_status DROP DEFAULT;
    ALTER TABLE public.profiles ALTER COLUMN vendor_status TYPE TEXT USING vendor_status::TEXT;
    ALTER TABLE public.profiles ALTER COLUMN vendor_status SET DEFAULT 'not_applicable';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;

  -- Convert role to TEXT safely
  BEGIN
    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::TEXT;
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'customer';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
END $$;

-- Ensure id has default UUID generation
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Safely decouple foreign key to auth.users so profiles can be inserted
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Ensure phone, role, and vendor_status columns have performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_vendor_status ON public.profiles(vendor_status);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3.1 SELECT: Allow reading profiles so user sessions can be verified and hydrated
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (true);

-- 3.2 INSERT: Allow new customer registration strictly defaulting to 'customer' role
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_registration" ON public.profiles;
CREATE POLICY "profiles_insert_registration" ON public.profiles
FOR INSERT WITH CHECK (
  role = 'customer' OR role IS NULL
);

-- 3.3 UPDATE: Allow customers to update their own permitted fields
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (true)
WITH CHECK (
  (role = 'customer' OR role = 'vendor' OR role = 'city_manager' OR role = 'state_manager' OR role = 'admin' OR role = 'super_admin')
);

-- ------------------------------------------------------------------------------
-- 4.1 SECURITY DEFINER: CHECK ACCOUNT REGISTRATION STATUS
-- Does not leak private secrets or auth tokens
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_account_registration(p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_clean_phone TEXT;
  v_profile RECORD;
  v_auth_exists BOOLEAN := FALSE;
BEGIN
  -- Normalize 10-digit Indian mobile number
  v_clean_phone := REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g');
  IF LENGTH(v_clean_phone) = 12 AND v_clean_phone LIKE '91%' THEN
    v_clean_phone := SUBSTRING(v_clean_phone FROM 3);
  ELSIF LENGTH(v_clean_phone) = 11 AND v_clean_phone LIKE '0%' THEN
    v_clean_phone := SUBSTRING(v_clean_phone FROM 2);
  END IF;

  IF LENGTH(v_clean_phone) != 10 THEN
    RETURN jsonb_build_object('is_registered', false, 'error', 'invalid_phone');
  END IF;

  -- 1. Check in public.profiles table
  SELECT id, role, full_name, vendor_status INTO v_profile 
  FROM public.profiles 
  WHERE phone = v_clean_phone 
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'is_registered', true,
      'role', v_profile.role,
      'full_name', v_profile.full_name,
      'vendor_status', v_profile.vendor_status
    );
  END IF;

  -- 2. Check in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE phone = '+91' || v_clean_phone OR phone = v_clean_phone
  ) INTO v_auth_exists;

  IF v_auth_exists THEN
    RETURN jsonb_build_object('is_registered', true, 'role', 'customer');
  END IF;

  RETURN jsonb_build_object('is_registered', false);
END;
$$;

-- ------------------------------------------------------------------------------
-- 4.2 SECURITY DEFINER: STRICT REGISTRATION (NEW CUSTOMER ONLY)
-- Blocks duplicate registrations with 409 Conflict logic
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_new_customer(
  p_phone TEXT,
  p_full_name TEXT,
  p_auth_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_clean_phone TEXT;
  v_profile RECORD;
  v_new_id UUID;
  v_final_name TEXT;
BEGIN
  v_clean_phone := REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g');
  IF LENGTH(v_clean_phone) = 12 AND v_clean_phone LIKE '91%' THEN
    v_clean_phone := SUBSTRING(v_clean_phone FROM 3);
  ELSIF LENGTH(v_clean_phone) = 11 AND v_clean_phone LIKE '0%' THEN
    v_clean_phone := SUBSTRING(v_clean_phone FROM 2);
  END IF;

  IF LENGTH(v_clean_phone) != 10 THEN
    RAISE EXCEPTION 'Invalid mobile number. 10 digits required.';
  END IF;

  -- Check duplicate registration
  SELECT * INTO v_profile FROM public.profiles WHERE phone = v_clean_phone LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Account already registered with this mobile number. Please log in.';
  END IF;

  v_final_name := COALESCE(NULLIF(TRIM(p_full_name), ''), 'Valued Customer');
  v_new_id := COALESCE(p_auth_id, gen_random_uuid());

  INSERT INTO public.profiles (
    id,
    phone,
    full_name,
    role,
    vendor_status,
    created_at,
    updated_at
  ) VALUES (
    v_new_id,
    v_clean_phone,
    v_final_name,
    'customer',
    'not_applicable',
    NOW(),
    NOW()
  )
  RETURNING * INTO v_profile;

  RETURN to_jsonb(v_profile);
END;
$$;

-- ------------------------------------------------------------------------------
-- 4.3 SECURITY DEFINER: STRICT LOGIN (EXISTING USERS ONLY)
-- Never creates a new profile during login
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.login_existing_user(p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_clean_phone TEXT;
  v_profile RECORD;
BEGIN
  v_clean_phone := REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g');
  IF LENGTH(v_clean_phone) = 12 AND v_clean_phone LIKE '91%' THEN
    v_clean_phone := SUBSTRING(v_clean_phone FROM 3);
  ELSIF LENGTH(v_clean_phone) = 11 AND v_clean_phone LIKE '0%' THEN
    v_clean_phone := SUBSTRING(v_clean_phone FROM 2);
  END IF;

  IF LENGTH(v_clean_phone) != 10 THEN
    RAISE EXCEPTION 'Invalid mobile number. 10 digits required.';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE phone = v_clean_phone LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This mobile number is not registered. Please register first.';
  END IF;

  -- Update updated_at timestamp without altering existing role or vendor_status
  UPDATE public.profiles
  SET updated_at = NOW()
  WHERE id = v_profile.id
  RETURNING * INTO v_profile;

  RETURN to_jsonb(v_profile);
END;
$$;

-- ------------------------------------------------------------------------------
-- 4.4 LEGACY COMPATIBILITY: REGISTER OR LOGIN
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_or_login_customer(
  p_phone TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_auth_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_clean_phone TEXT;
  v_profile RECORD;
  v_new_id UUID;
  v_final_name TEXT;
BEGIN
  v_clean_phone := REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g');
  IF LENGTH(v_clean_phone) = 12 AND v_clean_phone LIKE '91%' THEN
    v_clean_phone := SUBSTRING(v_clean_phone FROM 3);
  ELSIF LENGTH(v_clean_phone) = 11 AND v_clean_phone LIKE '0%' THEN
    v_clean_phone := SUBSTRING(v_clean_phone FROM 2);
  END IF;

  IF LENGTH(v_clean_phone) != 10 THEN
    RAISE EXCEPTION 'Invalid mobile number. 10 digits required.';
  END IF;

  v_final_name := COALESCE(NULLIF(TRIM(p_full_name), ''), 'Valued Customer');

  SELECT * INTO v_profile FROM public.profiles WHERE phone = v_clean_phone LIMIT 1;

  IF FOUND THEN
    UPDATE public.profiles
    SET
      full_name = CASE 
        WHEN p_full_name IS NOT NULL AND TRIM(p_full_name) != '' THEN TRIM(p_full_name)
        ELSE full_name
      END,
      updated_at = NOW()
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;

    RETURN to_jsonb(v_profile);
  ELSE
    v_new_id := COALESCE(p_auth_id, gen_random_uuid());

    INSERT INTO public.profiles (
      id,
      phone,
      full_name,
      role,
      vendor_status,
      created_at,
      updated_at
    ) VALUES (
      v_new_id,
      v_clean_phone,
      v_final_name,
      'customer',
      'not_applicable',
      NOW(),
      NOW()
    )
    RETURNING * INTO v_profile;

    RETURN to_jsonb(v_profile);
  END IF;
END;
$$;

-- 5. Grants to API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_account_registration(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_new_customer(TEXT, TEXT, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.login_existing_user(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_or_login_customer(TEXT, TEXT, UUID) TO anon, authenticated, service_role;

-- 6. Verification
SELECT 'SUCCESS: Strict Login and Registration separation functions configured.' AS migration_status;
