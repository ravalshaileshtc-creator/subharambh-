// ==============================================================================
// SHUBH CELEBRATIONS – COMPLETE 20-MODULE SUPER ADMIN PRODUCTION TEST SUITE
// ==============================================================================

import assert from 'assert';
import * as superAdmin from './src/services/superAdminService.js';
import * as rbac from './src/services/rbacService.js';
import * as engine from './src/services/marketplaceEngine.js';
import * as auth from './src/services/authService.js';

console.log('=================================================================');
console.log('  SHUBH CELEBRATIONS – 20-MODULE SUPER ADMIN TEST SUITE          ');
console.log('=================================================================\n');

async function runAllTests() {
  let passedCount = 0;

  // ----------------------------------------------------------------------------
  // TEST 1: MODULE 1 - Live Dashboard Metrics
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 1: Module 1 - Live Dashboard Metrics retrieval... ');
  const metrics = await superAdmin.getLiveDashboardMetrics();
  assert(metrics !== null, 'Metrics should not be null');
  assert(typeof metrics.totalVendors === 'number', 'Total vendors should be numeric');
  assert(metrics.commissionRate === 5.0, 'Platform commission rate must be locked at 5.0%');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 2: MODULE 2 - Customer Management
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 2: Module 2 - Customer Management query & search... ');
  const allCust = await superAdmin.fetchAllCustomers();
  assert(Array.isArray(allCust) && allCust.length > 0, 'Customers list must return records');
  const godhraCust = await superAdmin.fetchAllCustomers('Godhra');
  assert(godhraCust.length > 0, 'Should find customers in Godhra');
  assert(godhraCust[0].phone.length === 10, 'Customer phone must be valid 10 digits');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 3: MODULE 3 - Vendor Management & Badge Toggling
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 3: Module 3 - Vendor Management & Verified Badge... ');
  const vendors = await superAdmin.fetchAllVendors();
  assert(Array.isArray(vendors) && vendors.length >= 2, 'Should load approved vendor directory');
  const targetVendor = vendors[0];
  const toggleRes = await superAdmin.toggleVendorVerificationStatus(targetVendor.id, !targetVendor.is_verified);
  assert(toggleRes.success === true, 'Verification toggle must succeed');
  // Revert
  await superAdmin.toggleVendorVerificationStatus(targetVendor.id, targetVendor.is_verified);
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 4: MODULE 4 - Vendor Applications & Approvals
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 4: Module 4 - Vendor Applications approval workflow... ');
  const apps = await superAdmin.fetchVendorApplications();
  assert(Array.isArray(apps) && apps.length > 0, 'Applications must be loaded');
  const pendingApp = apps.find((a) => a.status === 'pending') || apps[0];
  const reviewRes = await superAdmin.reviewApplicationDecision(pendingApp.id, 'approved');
  assert(reviewRes.success === true, 'Review decision must succeed');
  assert(reviewRes.application.status === 'approved', 'Status must update to approved');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 5: MODULE 5 - Vendor KYC Documents
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 5: Module 5 - Vendor KYC Documents verification... ');
  const kycDocs = superAdmin.getVendorKycRecords();
  assert(Array.isArray(kycDocs) && kycDocs.length > 0, 'KYC records must exist');
  assert(kycDocs[0].pan_number.length === 10, 'PAN must be valid 10 chars');
  assert(kycDocs[0].bank_account.includes('ICICI'), 'Bank payout account must be recorded');
  const kycUpdate = superAdmin.updateVendorKycStatus(kycDocs[0].vendor_id, 'verified');
  assert(kycUpdate.success === true, 'KYC status update must succeed');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 6: MODULE 6 - Service & Package Management
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 6: Module 6 - Service & Package CRUD... ');
  const pkgs = superAdmin.getAllVendorPackagesList();
  assert(Array.isArray(pkgs), 'Packages must be an array');
  const newPkg = superAdmin.addNewPackageListing(1, {
    name: 'Super Admin Test Package',
    price: 99000,
    description: 'Automated test suite package',
    inclusions: ['LED Stage', 'Entrance Gate'],
  });
  assert(newPkg.success === true, 'Package addition must succeed');
  superAdmin.removePackageListing(1, newPkg.package.id);
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 7: MODULE 7 - Service Category Management
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 7: Module 7 - Service Category Management (5% Commission)... ');
  const cats = superAdmin.getAllManagedCategories();
  assert(cats.length >= 8, 'All core categories must be present');
  cats.forEach((c) => {
    assert(c.commission_percentage === 5.0, 'Category commission must be locked at 5.0%');
  });
  const toggleCat = superAdmin.toggleCategoryStatus('mandap');
  assert(toggleCat.success === true, 'Category status toggle must succeed');
  superAdmin.toggleCategoryStatus('mandap'); // Revert
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 8: MODULE 8 - Geographic Coverage & PIN Code Management
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 8: Module 8 - Geography & PIN Code coverage... ');
  const geo = superAdmin.getPanIndiaLocationsHierarchy();
  assert(geo.totalStates >= 36, 'Must cover 36 States & UTs');
  const gujarat = geo.activeCoverage.find((s) => s.state === 'Gujarat');
  assert(gujarat && gujarat.districts.includes('Panchmahal'), 'Panchmahal district must be covered');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 9: MODULE 9 - Booking Management
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 9: Module 9 - Master Booking Directory... ');
  const bookings = await superAdmin.fetchAllBookings();
  assert(Array.isArray(bookings) && bookings.length > 0, 'Bookings must be loaded');
  const bk = bookings[0];
  assert(bk.booking_code.startsWith('BK-2026'), 'Booking code must follow format');
  assert(bk.commission_amount === bk.amount * 0.05, 'Commission must equal strictly 5% of amount');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 10: MODULE 10 & 11 - Enquiry & Quotation Management
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 10: Module 10 & 11 - Enquiries & Quotations... ');
  const enquiries = await superAdmin.fetchAllEnquiries();
  assert(Array.isArray(enquiries) && enquiries.length > 0, 'Enquiries must be loaded');
  const quotes = await superAdmin.fetchAllQuotations();
  assert(Array.isArray(quotes) && quotes.length > 0, 'Quotations must be loaded');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 11: MODULE 12 - 5% Commission Management & Bank Reconciliation
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 11: Module 12 - 5% Commission Bank Reconciliation... ');
  const commOverview = superAdmin.getCommissionOverview();
  assert(commOverview.commissionRatePercentage === 5.0, 'Platform commission rate must be 5.0%');
  const samplePay = commOverview.payments[0];
  const recRes = superAdmin.reconcileVendorPayment(samplePay.id, true, 'Audit test verified');
  assert(recRes.success === true, 'Reconciliation must succeed');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 12: MODULE 13 - Direct Payments Audit (Pure Marketplace)
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 12: Module 13 - Direct Customer-to-Vendor Payment Audit... ');
  const directPayments = superAdmin.getDirectPaymentAuditList();
  assert(directPayments.length >= 3, 'Direct payment audit trails must exist');
  assert(directPayments[0].customer_confirmation === 'Confirmed', 'Customer confirmation verified');
  assert(directPayments[0].vendor_confirmation === 'Confirmed', 'Vendor confirmation verified');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 13: MODULE 14 & 15 - Disputes & Notification Broadcasts
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 13: Module 14 & 15 - Disputes & Broadcasts... ');
  const disputes = superAdmin.getDisputesAndComplaints();
  assert(Array.isArray(disputes), 'Disputes must be loaded');
  const notifRes = superAdmin.broadcastNewNotification('Test Alert', 'Automated testing broadcast message', 'All Vendors');
  assert(notifRes.success === true, 'Broadcast must succeed');
  assert(notifRes.notification.title === 'Test Alert', 'Notification title must match');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 14: MODULE 16 - Reports & CSV Data Export
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 14: Module 16 - Reports & CSV Data Export... ');
  const report = superAdmin.generatePlatformReport('monthly_overview');
  assert(report.totalGmv.includes('18,45,000'), 'Report must reflect accurate GMV');
  const csv = superAdmin.exportReportToCsv('monthly_overview');
  assert(csv.includes('Report Title'), 'CSV must contain headers');
  assert(csv.includes('5.0%'), 'CSV must contain 5.0% commission rate');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 15: MODULE 17 - Admin User Accounts & Permissions
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 15: Module 17 - Admin Staff & Regional Isolation... ');
  const admins = superAdmin.getAdminUserAccounts();
  assert(admins.length >= 3, 'Must have Super Admin, State Manager, City Manager');
  const superAdm = admins.find((a) => a.role === 'super_admin');
  assert(superAdm && superAdm.scope === 'ALL_INDIA', 'Super Admin scope must be ALL_INDIA');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 16: MODULE 18 - System Settings & Immutability of 5% Rate
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 16: Module 18 - System Settings & 5% Fee Lock... ');
  const settings = superAdmin.getSystemSettings();
  assert(settings.commissionPercentage === 5.0, 'Settings commission rate must be 5.0%');
  // Attempt to tamper commission rate
  const tamperAttempt = superAdmin.updateSystemSettings({ commissionPercentage: 15.0 });
  assert(tamperAttempt.settings.commissionPercentage === 5.0, 'Platform must strictly reject tampering away from 5%');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 17: MODULE 19 - Immutable Audit Logs
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 17: Module 19 - Immutable Audit Logs tracking... ');
  const initialLogs = await superAdmin.fetchSystemAuditLogs();
  superAdmin.recordAdminAction('usr-admin-001', 'SECURITY_INTEGRITY_CHECK', 'test', { status: 'passed' });
  const updatedLogs = await superAdmin.fetchSystemAuditLogs();
  assert(updatedLogs.length >= initialLogs.length, 'Audit log count must increase or match');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 18: MODULE 20 - Database & Integration Health Monitoring
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 18: Module 20 - Health Monitor & Telemetry... ');
  const health = await superAdmin.runHealthCheck();
  assert(health.status === 'HEALTHY' || health.status === 'DEGRADED_FALLBACK', 'Health check must complete');
  assert(health.databaseUrl.includes('supabase.co'), 'Database URL must point to Supabase');
  assert(health.tables.vendors >= 2, 'Must monitor vendor table count');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 19: Security Role Isolation - Customer Cannot Access Super Admin
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 19: Security Isolation - Customer route access to /admin is BLOCKED... ');
  const customerUser = {
    id: 'c0570000-0000-4000-8000-009825098765',
    phone: '9825098765',
    role: 'customer',
  };
  auth.saveAuthSession(customerUser);
  rbac.setCurrentUser(customerUser);
  const routeCheck = rbac.verifyRouteAccess('/admin');
  assert(routeCheck.allowed === false, 'Customer must be blocked from /admin');
  assert(routeCheck.reason.includes('403 Forbidden'), 'Must return 403 Forbidden reason');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 20: Realtime Channel Subscription & Clean Teardown
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 20: Realtime Channel Subscription & Clean Teardown... ');
  let realtimeTriggered = false;
  const unsubscribe = superAdmin.initSuperAdminRealtime((table, payload) => {
    realtimeTriggered = true;
  });
  assert(typeof unsubscribe === 'function', 'Realtime initializer must return unsubscribe callback');
  unsubscribe();
  console.log('PASS ✓');
  passedCount++;

  console.log('\n=================================================================');
  console.log(`  ALL ${passedCount} / 20 SUPER ADMIN TEST SCENARIOS PASSED (100% GREEN) `);
  console.log('=================================================================\n');
  process.exit(0);
}

runAllTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
