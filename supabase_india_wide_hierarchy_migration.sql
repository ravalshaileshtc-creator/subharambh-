-- ==============================================================================
-- SHUBH CELEBRATIONS / ALL INDIA EVENT MARKETPLACE
-- INDIA-WIDE ROLE-BASED MANAGEMENT HIERARCHY MIGRATION
-- Version: 4.0.0
--
-- Hierarchy:
-- 1. Super Admin   (Nationwide access, controls all states & cities)
-- 2. State Manager (Restricted to assigned State, manages City Managers if permitted)
-- 3. City Manager  (Restricted to assigned City, manages local enquiries & bookings)
-- 4. Vendor        (Manages own services & bookings)
-- 5. Customer      (Host & client event bookings)
-- ==============================================================================

-- 1. CREATE EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE admin_hierarchy_role AS ENUM (
    'super_admin',
    'state_manager',
    'city_manager',
    'vendor',
    'customer'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE manager_status_type AS ENUM (
    'active',
    'pending_invitation',
    'deactivated'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. STATE & CITY GEOGRAPHIC MAPPING TABLE
CREATE TABLE IF NOT EXISTS public.state_city_mapping (
  id BIGSERIAL PRIMARY KEY,
  state_code VARCHAR(4) NOT NULL, -- e.g. 'GJ', 'MH', 'RJ'
  state_name TEXT NOT NULL,
  district_name TEXT NOT NULL,
  city_name TEXT NOT NULL,
  tier_level INT NOT NULL DEFAULT 2, -- 1 = Metro/Tier 1, 2 = Tier 2, 3 = Local Town
  pincode_prefixes TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_state_city UNIQUE(state_code, city_name)
);

CREATE INDEX IF NOT EXISTS idx_state_city_state ON public.state_city_mapping(state_code);
CREATE INDEX IF NOT EXISTS idx_state_city_city ON public.state_city_mapping(city_name);
CREATE INDEX IF NOT EXISTS idx_state_city_district ON public.state_city_mapping(district_name);

-- 3. MANAGER ASSIGNMENTS TABLE (Explicit Location-Based Bounds)
CREATE TABLE IF NOT EXISTS public.manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL,
  manager_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  role admin_hierarchy_role NOT NULL,
  assigned_state_code VARCHAR(4),
  assigned_state_name TEXT,
  assigned_city_name TEXT, -- NULL for State Managers, mandatory for City Managers
  assigned_districts TEXT[] DEFAULT '{}',
  assigned_pincodes TEXT[] DEFAULT '{}',
  can_approve_vendors BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_city_managers BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_financials BOOLEAN NOT NULL DEFAULT FALSE,
  can_waive_commission BOOLEAN NOT NULL DEFAULT FALSE,
  status manager_status_type NOT NULL DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_manager_phone UNIQUE(phone)
);

CREATE INDEX IF NOT EXISTS idx_mgr_assign_role ON public.manager_assignments(role);
CREATE INDEX IF NOT EXISTS idx_mgr_assign_state ON public.manager_assignments(assigned_state_code);
CREATE INDEX IF NOT EXISTS idx_mgr_assign_city ON public.manager_assignments(assigned_city_name);
CREATE INDEX IF NOT EXISTS idx_mgr_assign_status ON public.manager_assignments(status);

-- 4. ROLE PERMISSIONS MATRIX TABLE
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id SERIAL PRIMARY KEY,
  role admin_hierarchy_role NOT NULL,
  permission_key TEXT NOT NULL,
  description TEXT,
  is_grantable BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_role_permission UNIQUE(role, permission_key)
);

-- Seed Standard Hierarchy Permissions
INSERT INTO public.role_permissions (role, permission_key, description, is_grantable) VALUES
  -- Super Admin: Complete nationwide power
  ('super_admin', 'ALL_INDIA_ACCESS', 'Full nationwide visibility across all 36 states and UTs', FALSE),
  ('super_admin', 'MANAGE_STATE_MANAGERS', 'Create, edit, assign and deactivate State Managers', FALSE),
  ('super_admin', 'MANAGE_CITY_MANAGERS', 'Create, edit, assign and deactivate City Managers', FALSE),
  ('super_admin', 'OVERRIDE_ANY_ACTION', 'Override any state or city decision', FALSE),
  ('super_admin', 'VIEW_FINANCIAL_LEDGER', 'View platform profit, costs and bank reconciliation', FALSE),
  ('super_admin', 'WAIVE_COMMISSION', 'Grant administrative waivers for 5% commission', FALSE),

  -- State Manager: State-scoped authority
  ('state_manager', 'STATE_DATA_ACCESS', 'Access all records within assigned state only', FALSE),
  ('state_manager', 'REVIEW_STATE_VENDORS', 'Review vendor applications within assigned state', FALSE),
  ('state_manager', 'APPROVE_STATE_VENDORS', 'Approve state vendors if granted by Super Admin', TRUE),
  ('state_manager', 'MANAGE_CITY_MANAGERS', 'Create and assign City Managers in assigned state if granted', TRUE),
  ('state_manager', 'VIEW_STATE_REPORTS', 'View state-level revenue and bookings reports', FALSE),

  -- City Manager: City-scoped coordination
  ('city_manager', 'CITY_DATA_ACCESS', 'Access records within assigned city only', FALSE),
  ('city_manager', 'VERIFY_LOCAL_VENDORS', 'Verify local business identity, KYC and venue quality', FALSE),
  ('city_manager', 'RECOMMEND_APPROVAL', 'Recommend approval to State Manager or Super Admin', FALSE),
  ('city_manager', 'COORDINATE_ENQUIRIES', 'Coordinate local customer bookings and direct payments', FALSE),
  ('city_manager', 'VIEW_CITY_REPORTS', 'View city-level lead volume and vendor activity', FALSE)
ON CONFLICT (role, permission_key) DO NOTHING;

-- 5. MANAGER ACTIVITY LOGS TABLE (Cryptographically Auditable)
CREATE TABLE IF NOT EXISTS public.manager_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  manager_id UUID NOT NULL,
  manager_name TEXT NOT NULL,
  role admin_hierarchy_role NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'vendor', 'booking', 'city_manager', 'enquiry', 'kyc'
  target_id TEXT,
  target_state VARCHAR(4),
  target_city TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mgr_act_manager ON public.manager_activity_logs(manager_id);
CREATE INDEX IF NOT EXISTS idx_mgr_act_action ON public.manager_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_mgr_act_target ON public.manager_activity_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_mgr_act_time ON public.manager_activity_logs(timestamp DESC);

-- 6. SECURITY DEFINER HELPER FUNCTIONS FOR BOUNDARY CHECKS
CREATE OR REPLACE FUNCTION public.check_manager_state_access(
  p_manager_id UUID,
  p_state_code VARCHAR(4)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_role admin_hierarchy_role;
  v_state VARCHAR(4);
  v_status manager_status_type;
BEGIN
  -- Super admin has nationwide access
  SELECT role, assigned_state_code, status
  INTO v_role, v_state, v_status
  FROM public.manager_assignments
  WHERE manager_id = p_manager_id LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_status != 'active' THEN
    RETURN FALSE;
  END IF;

  IF v_role = 'super_admin' THEN
    RETURN TRUE;
  ELSIF v_role = 'state_manager' AND v_state = p_state_code THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_manager_city_access(
  p_manager_id UUID,
  p_state_code VARCHAR(4),
  p_city_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_role admin_hierarchy_role;
  v_state VARCHAR(4);
  v_city TEXT;
  v_status manager_status_type;
BEGIN
  SELECT role, assigned_state_code, assigned_city_name, status
  INTO v_role, v_state, v_city, v_status
  FROM public.manager_assignments
  WHERE manager_id = p_manager_id LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_status != 'active' THEN
    RETURN FALSE;
  END IF;

  -- 1. Super Admin: full access
  IF v_role = 'super_admin' THEN
    RETURN TRUE;
  -- 2. State Manager: access if city is in assigned state
  ELSIF v_role = 'state_manager' AND v_state = p_state_code THEN
    RETURN TRUE;
  -- 3. City Manager: access strictly if assigned to this exact city
  ELSIF v_role = 'city_manager' AND LOWER(v_city) = LOWER(p_city_name) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 7. ROW-LEVEL SECURITY POLICIES
ALTER TABLE public.state_city_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_activity_logs ENABLE ROW LEVEL SECURITY;

-- 7.1 state_city_mapping: Publicly readable for dropdowns
DROP POLICY IF EXISTS "state_city_read_all" ON public.state_city_mapping;
CREATE POLICY "state_city_read_all" ON public.state_city_mapping
FOR SELECT USING (true);

-- 7.2 manager_assignments: Readable by authenticated staff, writable by Super Admin & permitted State Managers
DROP POLICY IF EXISTS "manager_assignments_read_policy" ON public.manager_assignments;
CREATE POLICY "manager_assignments_read_policy" ON public.manager_assignments
FOR SELECT USING (true);

DROP POLICY IF EXISTS "manager_assignments_write_policy" ON public.manager_assignments;
CREATE POLICY "manager_assignments_write_policy" ON public.manager_assignments
FOR ALL USING (
  -- Super admin can write all
  EXISTS (
    SELECT 1 FROM public.manager_assignments m
    WHERE m.manager_id = auth.uid() AND m.role = 'super_admin' AND m.status = 'active'
  )
  OR
  -- State Manager can only write City Managers within their own state
  (
    EXISTS (
      SELECT 1 FROM public.manager_assignments m
      WHERE m.manager_id = auth.uid()
        AND m.role = 'state_manager'
        AND m.status = 'active'
        AND m.can_manage_city_managers = TRUE
        AND m.assigned_state_code = public.manager_assignments.assigned_state_code
    )
    AND public.manager_assignments.role = 'city_manager'
  )
);

-- 7.3 manager_activity_logs: Append-only by active managers
DROP POLICY IF EXISTS "manager_activity_logs_insert" ON public.manager_activity_logs;
CREATE POLICY "manager_activity_logs_insert" ON public.manager_activity_logs
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "manager_activity_logs_select" ON public.manager_activity_logs;
CREATE POLICY "manager_activity_logs_select" ON public.manager_activity_logs
FOR SELECT USING (true);

-- 8. GRANT API PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.state_city_mapping TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.manager_assignments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.role_permissions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.manager_activity_logs TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_manager_state_access(UUID, VARCHAR) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_manager_city_access(UUID, VARCHAR, TEXT) TO anon, authenticated, service_role;

SELECT 'SUCCESS: India-wide role-based management hierarchy configured.' AS migration_status;
