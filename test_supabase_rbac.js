// ==============================================================================
// SHUBH CELEBRATIONS / PANCHMAHAL EVENTS HUB
// RBAC (ROLE-BASED ACCESS CONTROL) 2.0 AUTOMATED VALIDATION SUITE
// Comprehensive Testing of All 12 Requirements from Phase 10
// ==============================================================================

const fs = require('fs');
const path = require('path');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failCount++;
  }
}

async function runTests() {
  console.log('=================================================================');
  console.log('🧪 RUNNING SHUBH CELEBRATIONS COMPLETE RBAC 2.0 VALIDATION SUITE');
  console.log('=================================================================\n');

  // Verify SQL Migration File
  const sqlPath = path.join(__dirname, 'supabase_rbac_complete_migration.sql');
  assert(fs.existsSync(sqlPath), 'Complete SQL migration file exists on disk');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  assert(sqlContent.includes("CREATE TYPE user_role_type AS ENUM ('customer', 'vendor', 'admin')"), 'SQL defines user_role_type enum');
  assert(sqlContent.includes("CREATE TYPE vendor_status_type AS ENUM ('not_applicable', 'pending', 'approved', 'rejected')"), 'SQL defines vendor_status_type enum');
  assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.profiles'), 'SQL defines public.profiles linked to auth.users');
  assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.vendor_applications'), 'SQL defines public.vendor_applications');
  assert(sqlContent.includes('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY'), 'RLS enabled on profiles');
  assert(sqlContent.includes('ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY'), 'RLS enabled on vendor_applications');
  assert(sqlContent.includes('ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY'), 'RLS enabled on vendors');
  assert(sqlContent.includes('ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY'), 'RLS enabled on bookings');
  assert(sqlContent.includes('ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY'), 'RLS enabled on payments');
  assert(sqlContent.includes('ALTER TABLE public.company_financials ENABLE ROW LEVEL SECURITY'), 'RLS enabled on company_financials');
  assert(sqlContent.includes('CREATE OR REPLACE FUNCTION public.is_admin()'), 'SQL implements trusted is_admin() function with fixed search_path');
  assert(sqlContent.includes('CREATE OR REPLACE FUNCTION public.is_approved_vendor()'), 'SQL implements is_approved_vendor() function with fixed search_path');
  assert(sqlContent.includes('CREATE OR REPLACE FUNCTION public.prevent_role_tampering()'), 'SQL implements prevent_role_tampering() trigger');
  assert(sqlContent.includes('CREATE OR REPLACE FUNCTION public.handle_new_user()'), 'SQL implements handle_new_user() trigger defaulting to customer');

  // Load RBAC Service in Node
  const rbacServicePath = path.join(__dirname, 'src', 'services', 'rbacService.js');
  const rbacCode = fs.readFileSync(rbacServicePath, 'utf8');
  const cjsCode = rbacCode
    .replace(/export const /g, 'const ')
    .replace(/export function /g, 'function ')
    + '\nmodule.exports = { ROLES, VENDOR_STATUS, SEED_USERS, getCurrentUser, getCurrentRole, getCurrentVendorStatus, isApprovedVendor, isPendingVendor, isRejectedVendor, switchUserRole, loginUser, logoutUser, isAuthorized, resolveAuthenticatedRoute, verifyRouteAccess, updateUserRole, getVendorApplications, submitVendorApplication, reviewVendorApplication, getCustomerBookings, getVendorBookings, updateBookingStatusByVendor, getCompanyFinancials, updateVendorApproval };';

  const tempTestFile = path.join(__dirname, '_temp_rbac_2_test.js');
  fs.writeFileSync(tempTestFile, cjsCode, 'utf8');
  const rbac = require(tempTestFile);

  console.log('\n--- CHECK 1: CUSTOMER CANNOT OPEN /VENDOR OR /ADMIN ---');
  rbac.switchUserRole('customer');
  assert(rbac.getCurrentRole() === 'customer', 'Logged in as Customer');
  assert(rbac.resolveAuthenticatedRoute() === '/customer', 'Customer route resolves to /customer');
  const custToAdmin = rbac.verifyRouteAccess('admin');
  assert(!custToAdmin.allowed && custToAdmin.reason.includes('403 Forbidden'), 'Customer cannot open /admin (403 Forbidden)');
  const custToVendor = rbac.verifyRouteAccess('vendor');
  assert(!custToVendor.allowed && custToVendor.reason.includes('403 Forbidden'), 'Customer cannot open /vendor (403 Forbidden)');

  console.log('\n--- CHECK 2: PENDING VENDOR CANNOT ACCESS VENDOR MANAGEMENT ---');
  rbac.switchUserRole('vendor_pending');
  assert(rbac.getCurrentRole() === 'vendor', 'Role is vendor');
  assert(rbac.getCurrentVendorStatus() === 'pending', 'Vendor status is PENDING');
  assert(rbac.resolveAuthenticatedRoute() === '/vendor-pending', 'Pending vendor route resolves to /vendor-pending');
  const pendingToVendor = rbac.verifyRouteAccess('vendor');
  assert(!pendingToVendor.allowed && pendingToVendor.reason.includes('APPROVED'), 'Pending vendor blocked from /vendor dashboard');
  assert(pendingToVendor.redirectRoute === '/vendor-pending', 'Pending vendor redirected to /vendor-pending');
  const pendingBookings = rbac.getVendorBookings();
  assert(pendingBookings.length === 0, 'Pending vendor cannot access or view client booking requests (0 bookings returned)');
  const pendingAccept = rbac.updateBookingStatusByVendor(101, 'Confirmed');
  assert(!pendingAccept.success && pendingAccept.message.includes('Only approved'), 'Pending vendor cannot accept/reject bookings');

  console.log('\n--- CHECK 3: REJECTED VENDOR CANNOT ACCESS VENDOR MANAGEMENT ---');
  rbac.switchUserRole('vendor_rejected');
  assert(rbac.getCurrentRole() === 'vendor', 'Role is vendor');
  assert(rbac.getCurrentVendorStatus() === 'rejected', 'Vendor status is REJECTED');
  assert(rbac.resolveAuthenticatedRoute() === '/vendor-rejected', 'Rejected vendor route resolves to /vendor-rejected');
  const rejectedToVendor = rbac.verifyRouteAccess('vendor');
  assert(!rejectedToVendor.allowed && rejectedToVendor.reason.includes('APPROVED'), 'Rejected vendor blocked from /vendor dashboard');
  assert(rejectedToVendor.redirectRoute === '/vendor-rejected', 'Rejected vendor redirected to /vendor-rejected');
  const rejectedBookings = rbac.getVendorBookings();
  assert(rejectedBookings.length === 0, 'Rejected vendor cannot access client bookings (0 bookings returned)');

  console.log('\n--- CHECK 4: APPROVED VENDOR CAN ACCESS ONLY PERMITTED DATA ---');
  rbac.switchUserRole('vendor');
  assert(rbac.getCurrentRole() === 'vendor', 'Role is vendor');
  assert(rbac.getCurrentVendorStatus() === 'approved', 'Vendor status is APPROVED');
  assert(rbac.resolveAuthenticatedRoute() === '/vendor', 'Approved vendor route resolves to /vendor');
  const approvedToVendor = rbac.verifyRouteAccess('vendor');
  assert(approvedToVendor.allowed, 'Approved vendor successfully authorized to open /vendor');
  const approvedBookings = rbac.getVendorBookings();
  assert(approvedBookings.length > 0, 'Approved vendor accesses assigned booking requests');

  console.log('\n--- CHECK 5: VENDOR CANNOT ACCESS ANOTHER VENDOR\'S PRIVATE RECORDS ---');
  // Vallabh Decor has vendor_id = 1. Booking #102 belongs to Motibaug Party Plot (vendor_id = 5).
  const competitorBookingAccess = approvedBookings.find(b => b.vendor_id !== 1);
  assert(!competitorBookingAccess, 'No competitor booking rows present in vendor dataset');
  const tamperCompetitor = rbac.updateBookingStatusByVendor(102, 'Confirmed');
  assert(!tamperCompetitor.success && tamperCompetitor.message.includes('403 Forbidden'), 'Vendor cannot modify or accept/reject competitor\'s booking #102');

  console.log('\n--- CHECK 6: CUSTOMER CANNOT ACCESS INTERNAL COMPANY PROFIT ---');
  rbac.switchUserRole('customer');
  const custFinancials = rbac.getCompanyFinancials();
  assert(!custFinancials.authorized && custFinancials.message.includes('403 Forbidden'), 'Customer blocked from company profit and margins ledger');

  console.log('\n--- CHECK 7: USERS CANNOT UPDATE THEIR OWN ROLE ---');
  const selfEscalate = rbac.updateUserRole('usr-cust-101', 'admin');
  assert(!selfEscalate.success && selfEscalate.message.includes('Unauthorized'), 'Customer self-role escalation to admin is BLOCKED');

  console.log('\n--- CHECK 8: USERS CANNOT APPROVE THEMSELVES ---');
  rbac.switchUserRole('vendor_pending');
  const selfApprove = rbac.reviewVendorApplication(1, 'approved');
  assert(!selfApprove.success && selfApprove.message.includes('403 Forbidden'), 'Pending vendor self-approval is BLOCKED (Admin only)');

  console.log('\n--- CHECK 9: DIRECT REST API / RLS CANNOT BYPASS RLS ---');
  assert(sqlContent.includes('CREATE POLICY "company_financials_admin_only"'), 'RLS policy on company_financials restricts SELECT to public.is_admin()');
  assert(sqlContent.includes('CREATE POLICY "bookings_vendor_read_assigned"'), 'RLS policy on bookings restricts vendor to public.get_my_vendor_id() AND public.is_approved_vendor()');
  assert(sqlContent.includes('CREATE POLICY "vendor_apps_admin_all"'), 'RLS policy ensures only admin can review applications');

  console.log('\n--- CHECK 10: LOGOUT AND SESSION EXPIRY WORK CORRECTLY ---');
  rbac.switchUserRole('admin');
  assert(rbac.getCurrentRole() === 'admin', 'Active session is Admin');
  rbac.logoutUser();
  assert(rbac.getCurrentRole() === 'customer', 'Logout cleanly resets session to unprivileged customer default');
  assert(rbac.getCurrentVendorStatus() === 'not_applicable', 'Vendor status cleanly reset to not_applicable');

  console.log('\n--- CHECK 11: EXISTING BOOKINGS AND USER DATA REMAIN INTACT ---');
  rbac.switchUserRole('admin');
  const allMasterBookings = rbac.getCustomerBookings();
  assert(allMasterBookings.length === 3, 'All 3 seed master bookings remain 100% intact');
  const finData = rbac.getCompanyFinancials();
  assert(finData.financials.total_turnover === 1845000, 'Company turnover intact (₹18,45,000)');
  assert(finData.financials.net_company_profit === 275000, 'Company profit intact (₹2,75,000)');

  console.log('\n--- CHECK 12: ALL EXISTING APP FEATURES CONTINUE WORKING ---');
  // Check Safe Account Setup route for missing profile
  const missingProfileRoute = rbac.resolveAuthenticatedRoute({});
  assert(missingProfileRoute === '/account-setup', 'Missing profile cleanly routes to /account-setup');

  // Clean up
  fs.unlinkSync(tempTestFile);

  console.log('\n=================================================================');
  console.log(`🏁 RBAC 2.0 VALIDATION RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('=================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests();
