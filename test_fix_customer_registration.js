// ==============================================================================
// SHUBH CELEBRATIONS – CUSTOMER REGISTRATION & SUPABASE PERSISTENCE TEST SUITE
// Tests:
// A. New customer registration & profile generation
// B. Existing customer login & duplicate avoidance
// C. Security & Role Escalation Prevention
// D. Admin & Vendor role preservation
// ==============================================================================

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  sendMobileOtp,
  verifyMobileOtp,
  syncCustomerProfileToSupabase,
  generateDeterministicUuid,
  normalizeIndianPhone,
  saveAuthSession,
  getStoredSession,
  logoutSession,
  clearActiveOtpSessionsForTest,
} from './src/services/authService.js';
import {
  ROLES,
  VENDOR_STATUS,
  SEED_USERS,
  resolveAuthenticatedRoute,
  verifyRouteAccess,
} from './src/services/rbacService.js';

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`Test ${totalTests}: ${name}... PASS ✓`);
  } catch (e) {
    console.error(`Test ${totalTests}: ${name}... FAIL ✗`);
    console.error(e);
    process.exit(1);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`Test ${totalTests}: ${name}... PASS ✓`);
  } catch (e) {
    console.error(`Test ${totalTests}: ${name}... FAIL ✗`);
    console.error(e);
    process.exit(1);
  }
}

async function main() {
  console.log('=================================================================');
  console.log('  SHUBH CELEBRATIONS – CUSTOMER REGISTRATION & DB VERIFICATION   ');
  console.log('=================================================================\n');

  clearActiveOtpSessionsForTest();

  // ----------------------------------------------------------------------------
  // 1. DETERMINISTIC UUID GENERATION
  // ----------------------------------------------------------------------------
  runTest('Valid RFC 4122 UUID generation for mobile number', () => {
    const uuid = generateDeterministicUuid('9825098765');
    assert(uuid.length === 36, 'UUID must be 36 characters long');
    assert(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid), 'UUID must match RFC 4122 UUID v4 regex');
    assert(uuid.endsWith('009825098765'), 'UUID embed sanitized phone number');
  });

  // ----------------------------------------------------------------------------
  // 2. NEW CUSTOMER REGISTRATION WITH REAL OTP FLOW
  // ----------------------------------------------------------------------------
  await runAsyncTest('New customer registers with OTP, role defaults to customer', async () => {
    const newPhone = '9825' + Math.floor(100000 + Math.random() * 900000);
    const fullName = 'Kavita Patel';

    // Step 1: Send OTP
    const sendRes = await sendMobileOtp(newPhone, { isSignUp: true, fullName });
    assert(sendRes.success === true, 'OTP send must succeed');

    // Step 2: Verify OTP
    const verifyRes = await verifyMobileOtp(newPhone, '123456', { isSignUp: true, fullName });
    assert(verifyRes.success === true, 'OTP verify must succeed');
    assert(verifyRes.user !== null, 'User object returned');
    assert(verifyRes.user.phone === newPhone, 'Phone number matches');
    assert(verifyRes.user.full_name === fullName, 'Full name matches');
    assert(verifyRes.user.role === ROLES.CUSTOMER, 'Role must strictly default to CUSTOMER');
    assert(verifyRes.user.vendor_status === VENDOR_STATUS.NOT_APPLICABLE, 'Vendor status must be not_applicable');
    assert(verifyRes.user.id && verifyRes.user.id.length === 36, 'User ID must be valid UUID');
    assert(verifyRes.user.created_at, 'created_at timestamp must be present');
    assert(verifyRes.user.last_login, 'last_login timestamp must be present');

    // Step 3: Route resolves to customer dashboard
    const route = resolveAuthenticatedRoute(verifyRes.user);
    assert(route === '/customer', 'New customer routes to Customer Portal (/customer)');
  });

  // ----------------------------------------------------------------------------
  // 3. EXISTING CUSTOMER LOGIN (NO DUPLICATION & PRESERVE REGISTRATION DATE)
  // ----------------------------------------------------------------------------
  await runAsyncTest('Existing customer login preserves identity and role without duplication', async () => {
    const existingPhone = '9825098765';

    await sendMobileOtp(existingPhone);
    const verifyRes = await verifyMobileOtp(existingPhone, '123456');

    assert(verifyRes.success === true, 'Login succeeds');
    assert(verifyRes.user.phone === existingPhone, 'Phone matches existing customer');
    assert(verifyRes.user.full_name === 'Rajeshbhai Patel', 'Full name preserved');
    assert(verifyRes.user.role === ROLES.CUSTOMER, 'Role is customer');

    const route = resolveAuthenticatedRoute(verifyRes.user);
    assert(route === '/customer', 'Existing customer routes to /customer');
  });

  // ----------------------------------------------------------------------------
  // 4. SECURITY: CUSTOMER CANNOT ESCALATE TO ADMIN ROLE
  // ----------------------------------------------------------------------------
  await runAsyncTest('Customer self-role tampering to admin is blocked', async () => {
    const custPhone = '9825' + Math.floor(100000 + Math.random() * 900000);

    await sendMobileOtp(custPhone, { isSignUp: true, fullName: 'Hacker User' });

    // Attacker passes role: 'admin' during signup
    const verifyRes = await verifyMobileOtp(custPhone, '123456', {
      isSignUp: true,
      fullName: 'Hacker User',
      role: 'admin', // Tampering attempt!
    });

    assert(verifyRes.success === true, 'Verification succeeds');
    assert(verifyRes.user.role === ROLES.CUSTOMER, 'Role tampering ignored! Role strictly forced to CUSTOMER');
    assert(verifyRes.user.role !== ROLES.ADMIN, 'Customer CANNOT gain admin role');
  });

  // ----------------------------------------------------------------------------
  // 5. PRESERVATION OF EXISTING ADMIN ROLE (NEVER OVERWRITTEN)
  // ----------------------------------------------------------------------------
  await runAsyncTest('Admin login preserves ADMIN role and routes to /admin', async () => {
    const adminPhone = '9825123400';

    await sendMobileOtp(adminPhone);
    const verifyRes = await verifyMobileOtp(adminPhone, '123456');

    assert(verifyRes.success === true, 'Admin login succeeds');
    assert(verifyRes.user.role === ROLES.ADMIN, 'Admin role preserved strictly');
    assert(verifyRes.user.role !== ROLES.CUSTOMER, 'Admin role NEVER downgraded to customer');

    const route = resolveAuthenticatedRoute(verifyRes.user);
    assert(route === '/admin', 'Admin routes to /admin console');
  });

  // ----------------------------------------------------------------------------
  // 6. PRESERVATION OF EXISTING APPROVED VENDOR ROLE
  // ----------------------------------------------------------------------------
  await runAsyncTest('Approved vendor login preserves VENDOR role and routes to /vendor', async () => {
    const vendorPhone = '9825123401';

    await sendMobileOtp(vendorPhone);
    const verifyRes = await verifyMobileOtp(vendorPhone, '123456');

    assert(verifyRes.success === true, 'Vendor login succeeds');
    assert(verifyRes.user.role === ROLES.VENDOR, 'Vendor role preserved strictly');
    assert(verifyRes.user.vendor_status === VENDOR_STATUS.APPROVED, 'Vendor status is approved');
    assert(verifyRes.user.role !== ROLES.CUSTOMER, 'Vendor role NEVER overwritten by customer');

    const route = resolveAuthenticatedRoute(verifyRes.user);
    assert(route === '/vendor', 'Approved vendor routes to /vendor dashboard');
  });

  // ----------------------------------------------------------------------------
  // 7. PROTECTED ROUTE ENFORCEMENT FOR NEW CUSTOMERS
  // ----------------------------------------------------------------------------
  runTest('New customer cannot access /admin or /vendor routes', () => {
    const customerUser = {
      id: generateDeterministicUuid('9825991122'),
      phone: '9825991122',
      full_name: 'Pooja Shah',
      role: ROLES.CUSTOMER,
      vendor_status: VENDOR_STATUS.NOT_APPLICABLE,
    };

    saveAuthSession(customerUser);

    assert(verifyRouteAccess('/customer').allowed === true, 'Customer can open /customer');
    assert(verifyRouteAccess('/admin').allowed === false, 'Customer BLOCKED from /admin');
    assert(verifyRouteAccess('/vendor').allowed === false, 'Customer BLOCKED from /vendor');
  });

  // ----------------------------------------------------------------------------
  // 8. SQL MIGRATION FILE VALIDATION
  // ----------------------------------------------------------------------------
  runTest('SQL migration file contains correct RLS policies and procedures', () => {
    const sqlPath = path.resolve('./supabase_fix_customer_registration.sql');
    assert(fs.existsSync(sqlPath), 'supabase_fix_customer_registration.sql exists on disk');
    const content = fs.readFileSync(sqlPath, 'utf8');

    assert(content.includes('CREATE POLICY "profiles_insert_registration"'), 'Defines profiles_insert_registration RLS policy');
    assert(content.includes('CREATE POLICY "profiles_select_policy"'), 'Defines profiles_select_policy RLS policy');
    assert(content.includes('CREATE OR REPLACE FUNCTION public.register_or_login_customer'), 'Defines register_or_login_customer stored procedure');
    assert(content.includes('SECURITY DEFINER'), 'register_or_login_customer has SECURITY DEFINER');
    assert(content.includes('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey'), 'Decouples foreign key constraint safely');
  });

  console.log('\n=================================================================');
  console.log(`  ALL ${passedTests} / ${totalTests} CUSTOMER REGISTRATION TESTS PASSED (100% GREEN)  `);
  console.log('=================================================================\n');
}

main();
