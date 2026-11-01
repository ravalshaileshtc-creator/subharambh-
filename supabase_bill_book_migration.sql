-- ==============================================================================
-- SHUBH CELEBRATIONS – UNIVERSAL BILL BOOK DATABASE MIGRATION
-- Version: 5.0.0 (Vendors-Only Creation & Customer Invoices Access)
--
-- Security Rules:
-- 1. Vendors can only CREATE, EDIT, and MANAGE their own business bills.
-- 2. Pending, rejected, or suspended vendors CANNOT create bills.
-- 3. Customers CANNOT create or edit bills; can only VIEW/DOWNLOAD invoices issued to them.
-- 4. Super Admin can view all platform bills for reporting and financial oversight.
-- 5. Safe for execution in Supabase SQL Editor (100% TEXT based, zero 55P04 enum locks).
-- ==============================================================================

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create public.bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id BIGSERIAL PRIMARY KEY,
  bill_number TEXT UNIQUE NOT NULL,
  vendor_id BIGINT REFERENCES public.vendor_profiles(id) ON DELETE SET NULL,
  vendor_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_phone TEXT NOT NULL,
  vendor_location TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_location TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  additional_charges NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  advance_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'paid' | 'partial' | 'unpaid' | 'cancelled'
  cancellation_reason TEXT,
  notes TEXT,
  terms TEXT,
  payments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bills_vendor_user ON public.bills(vendor_user_id);
CREATE INDEX IF NOT EXISTS idx_bills_vendor_id ON public.bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_customer_phone ON public.bills(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON public.bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON public.bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON public.bills(bill_number);

-- 3. Create public.bill_payments table (Granular payment audit trail)
CREATE TABLE IF NOT EXISTS public.bill_payments (
  id BIGSERIAL PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  bill_id BIGINT REFERENCES public.bills(id) ON DELETE CASCADE,
  vendor_id BIGINT,
  vendor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_phone TEXT,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  payment_reference TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_id ON public.bill_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_vendor ON public.bill_payments(vendor_id);

-- 4. Create public.bill_audit_logs table
CREATE TABLE IF NOT EXISTS public.bill_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  bill_id BIGINT,
  bill_number TEXT,
  actor_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL, -- 'CREATE_BILL', 'EDIT_BILL', 'RECORD_PAYMENT', 'CANCEL_BILL'
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_audit_logs_bill ON public.bill_audit_logs(bill_id);

-- 5. Helper Function: Is User Approved Vendor
CREATE OR REPLACE FUNCTION public.is_approved_vendor(p_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id 
      AND role = 'vendor' 
      AND vendor_status = 'approved'
  );
$$;

-- 6. Row Level Security (RLS) Policies on public.bills
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_audit_logs ENABLE ROW LEVEL SECURITY;

-- VENDOR POLICY: Vendor can SELECT their own bills only
DROP POLICY IF EXISTS "bills_vendor_select_own" ON public.bills;
CREATE POLICY "bills_vendor_select_own" ON public.bills
FOR SELECT
USING (
  vendor_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- VENDOR POLICY: Vendor can INSERT bills ONLY if approved and active!
-- Customers CANNOT INSERT!
DROP POLICY IF EXISTS "bills_vendor_insert_approved_only" ON public.bills;
CREATE POLICY "bills_vendor_insert_approved_only" ON public.bills
FOR INSERT
WITH CHECK (
  (vendor_user_id = auth.uid() AND public.is_approved_vendor(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- VENDOR POLICY: Vendor can UPDATE their own bills only (Customers CANNOT UPDATE!)
DROP POLICY IF EXISTS "bills_vendor_update_own" ON public.bills;
CREATE POLICY "bills_vendor_update_own" ON public.bills
FOR UPDATE
USING (
  (vendor_user_id = auth.uid() AND public.is_approved_vendor(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- CUSTOMER POLICY: Customer can ONLY SELECT bills issued to their phone or UUID
DROP POLICY IF EXISTS "bills_customer_select_own" ON public.bills;
CREATE POLICY "bills_customer_select_own" ON public.bills
FOR SELECT
USING (
  customer_id = auth.uid()
  OR customer_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid())
);

-- BILL PAYMENTS POLICIES
DROP POLICY IF EXISTS "bill_payments_vendor_manage" ON public.bill_payments;
CREATE POLICY "bill_payments_vendor_manage" ON public.bill_payments
FOR ALL
USING (
  vendor_user_id = auth.uid()
  OR customer_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "bill_audit_admin_read" ON public.bill_audit_logs;
CREATE POLICY "bill_audit_admin_read" ON public.bill_audit_logs
FOR SELECT
USING (
  actor_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 7. Verification Query
SELECT 'SUCCESS: Universal Bill Book tables and RLS policies configured without enum locks.' AS migration_status;
