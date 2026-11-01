// ==============================================================================
// SHUBH CELEBRATIONS – INDIA-WIDE MULTI-LEVEL HIERARCHY TEST SUITE
// ==============================================================================

import assert from 'assert';
import * as rbac from './src/services/rbacService.js';
import * as superAdmin from './src/services/superAdminService.js';
import * as auth from './src/services/authService.js';

console.log('=================================================================');
console.log('  SHUBH CELEBRATIONS – INDIA-WIDE HIERARCHY VALIDATION SUITE     ');
console.log('=================================================================\n');

async function runHierarchyTests() {
  let passedCount = 0;

  // ----------------------------------------------------------------------------
  // TEST 1: Role Definitions & Hierarchy Levels
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 1: Hierarchy role constants & levels registered... ');
  assert(rbac.ROLES.SUPER_ADMIN === 'super_admin', 'Super Admin role must exist');
  assert(rbac.ROLES.STATE_MANAGER === 'state_manager', 'State Manager role must exist');
  assert(rbac.ROLES.CITY_MANAGER === 'city_manager', 'City Manager role must exist');
  assert(rbac.ROLES.VENDOR === 'vendor', 'Vendor role must exist');
  assert(rbac.ROLES.CUSTOMER === 'customer', 'Customer role must exist');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 2: Super Admin Nationwide Access
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 2: Super Admin nationwide access across all states... ');
  const superAdminUser = rbac.SEED_USERS.super_admin;
  rbac.setCurrentUser(superAdminUser);

  const gujaratAccess = rbac.checkLocationAccess(superAdminUser, { state_code: 'GJ', city_name: 'Godhra' });
  assert(gujaratAccess.allowed === true, 'Super Admin must access Gujarat');

  const maharashtraAccess = rbac.checkLocationAccess(superAdminUser, { state_code: 'MH', city_name: 'Mumbai' });
  assert(maharashtraAccess.allowed === true, 'Super Admin must access Maharashtra');

  const rajasthanAccess = rbac.checkLocationAccess(superAdminUser, { state_code: 'RJ', city_name: 'Jaipur' });
  assert(rajasthanAccess.allowed === true, 'Super Admin must access Rajasthan');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 3: State Manager In-State Access Allowed
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 3: State Manager access permitted within assigned state (GJ)... ');
  const stateMgrUser = rbac.SEED_USERS.state_manager; // Assigned to GJ
  rbac.setCurrentUser(stateMgrUser);

  const inStateAccess = rbac.checkLocationAccess(stateMgrUser, { state_code: 'GJ', city_name: 'Godhra' });
  assert(inStateAccess.allowed === true, 'State Manager must access in-state data');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 4: State Manager Cross-State Access Strictly Blocked (403)
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 4: State Manager cross-state access is BLOCKED (403 Forbidden)... ');
  const crossStateAccess = rbac.checkLocationAccess(stateMgrUser, { state_code: 'MH', city_name: 'Mumbai' });
  assert(crossStateAccess.allowed === false, 'State Manager must be blocked from other states');
  assert(crossStateAccess.status === 403, 'Must return 403 Forbidden');
  assert(crossStateAccess.reason.includes('Cross-state access violation'), 'Reason must specify cross-state violation');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 5: City Manager In-City Access Allowed
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 5: City Manager access permitted within assigned city (Godhra)... ');
  const cityMgrUser = rbac.SEED_USERS.city_manager; // Assigned to Godhra, GJ
  rbac.setCurrentUser(cityMgrUser);

  const inCityAccess = rbac.checkLocationAccess(cityMgrUser, { state_code: 'GJ', city_name: 'Godhra' });
  assert(inCityAccess.allowed === true, 'City Manager must access in-city data');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 6: City Manager Cross-City Access Strictly Blocked (403)
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 6: City Manager cross-city access is BLOCKED (403 Forbidden)... ');
  const crossCityAccess = rbac.checkLocationAccess(cityMgrUser, { state_code: 'GJ', city_name: 'Halol' });
  assert(crossCityAccess.allowed === false, 'City Manager must be blocked from other cities');
  assert(crossCityAccess.status === 403, 'Must return 403 Forbidden');
  assert(crossCityAccess.reason.includes('Cross-city access violation'), 'Reason must specify cross-city violation');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 7: Super Admin Creates State Manager with Permissions
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 7: Super Admin creates State Manager invitation... ');
  rbac.setCurrentUser(superAdminUser);
  const inviteStateRes = rbac.createManagerInvitation(superAdminUser, {
    name: 'Rajasthan Regional State Manager',
    phone: '9825998811',
    role: rbac.ROLES.STATE_MANAGER,
    assigned_state_code: 'RJ',
    can_approve_vendors: true,
    can_manage_city_managers: true,
  });
  assert(inviteStateRes.success === true, 'Invitation creation must succeed');
  assert(inviteStateRes.manager.role === 'state_manager', 'Manager role must be state_manager');
  assert(inviteStateRes.manager.assigned_state_code === 'RJ', 'Assigned state must be RJ');
  assert(inviteStateRes.manager.status === 'pending_invitation', 'Status must default to pending_invitation');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 8: State Manager Creates City Manager Within Assigned State
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 8: State Manager creates City Manager within assigned state... ');
  rbac.setCurrentUser(stateMgrUser); // Gujarat Manager
  const inviteCityRes = rbac.createManagerInvitation(stateMgrUser, {
    name: 'Kalol Local City Manager',
    phone: '9825776655',
    role: rbac.ROLES.CITY_MANAGER,
    assigned_state_code: 'GJ',
    city: 'Kalol',
    can_approve_vendors: false,
  });
  assert(inviteCityRes.success === true, 'City Manager invitation must succeed');
  assert(inviteCityRes.manager.assigned_city === 'Kalol', 'Assigned city must be Kalol');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 9: State Manager Cannot Create City Manager in Another State
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 9: State Manager creating City Manager in another state is BLOCKED... ');
  const invalidStateCityRes = rbac.createManagerInvitation(stateMgrUser, {
    name: 'Pune City Manager Attempt',
    phone: '9825334411',
    role: rbac.ROLES.CITY_MANAGER,
    assigned_state_code: 'MH', // State mismatch!
    city: 'Pune',
  });
  assert(invalidStateCityRes.success === false, 'Cross-state creation must be blocked');
  assert(invalidStateCityRes.status === 403, 'Must return 403 Forbidden');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 10: State Manager Cannot Create Super Admin
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 10: State Manager attempting privilege escalation is BLOCKED... ');
  const escalateAttempt = rbac.createManagerInvitation(stateMgrUser, {
    name: 'Unauthorized Admin Escalation',
    phone: '9825112233',
    role: rbac.ROLES.SUPER_ADMIN,
  });
  assert(escalateAttempt.success === false, 'Privilege escalation must be blocked');
  assert(escalateAttempt.status === 403, 'Must return 403 Forbidden');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 11: City Manager Cannot Invite Any Manager
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 11: City Manager attempting to invite managers is BLOCKED... ');
  rbac.setCurrentUser(cityMgrUser);
  const cityMgrInviteAttempt = rbac.createManagerInvitation(cityMgrUser, {
    name: 'Test Invite',
    phone: '9825001122',
    role: rbac.ROLES.CITY_MANAGER,
  });
  assert(cityMgrInviteAttempt.success === false, 'City manager cannot invite');
  assert(cityMgrInviteAttempt.status === 403, 'Must return 403 Forbidden');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 12: Customer Cannot Self-Assign Manager Role
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 12: Customer attempting to invite or self-assign manager is BLOCKED... ');
  const custUser = rbac.SEED_USERS.customer;
  rbac.setCurrentUser(custUser);
  const custAttempt = rbac.createManagerInvitation(custUser, {
    name: 'Customer Hacker',
    phone: '9825990011',
    role: rbac.ROLES.SUPER_ADMIN,
  });
  assert(custAttempt.success === false, 'Customer cannot invite managers');
  assert(custAttempt.status === 403, 'Must return 403 Forbidden');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 13: Manager Deactivation & Immediate Session Revocation
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 13: Deactivated manager session is immediately REVOKED (403)... ');
  rbac.setCurrentUser(superAdminUser);
  const deactRes = rbac.deactivateManager(superAdminUser, 'usr-mgr-city-01', 'Audit failure');
  assert(deactRes.success === true, 'Deactivation must succeed');

  // Attempt access as deactivated manager
  const deactivatedUser = { ...cityMgrUser, status: 'deactivated' };
  rbac.setCurrentUser(deactivatedUser);
  const routeCheck = rbac.verifyRouteAccess('/admin');
  assert(routeCheck.allowed === false, 'Deactivated manager must be blocked from /admin');
  assert(routeCheck.reason.includes('account has been deactivated'), 'Must specify deactivated account');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 14: Super Admin Location Responsibility Transfer
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 14: Super Admin transfers manager location responsibility... ');
  rbac.setCurrentUser(superAdminUser);
  const transferRes = superAdmin.transferManagerLocation(superAdminUser, 'usr-mgr-city-01', {
    state_code: 'GJ',
    state_name: 'Gujarat',
    city_name: 'Halol',
  });
  assert(transferRes.success === true, 'Transfer must succeed');
  assert(transferRes.manager.assigned_city_name === 'Halol', 'Manager city must be updated to Halol');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 15: Manager Activity Logging
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 15: Manager Activity Logging audit trail recorded... ');
  const logItem = superAdmin.logManagerActivity(
    'usr-mgr-state-01',
    'Gujarat Manager',
    'state_manager',
    'APPROVE_VENDOR',
    'vendor',
    '1',
    { state: 'GJ', city: 'Godhra' },
    { vendor_name: 'Vallabh Decoration' }
  );
  assert(logItem.id > 0, 'Log id must be generated');
  assert(logItem.action === 'APPROVE_VENDOR', 'Log action must match');
  assert(superAdmin.getManagerActivityLogs().length > 0, 'Activity logs must be retrievable');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 16: Hierarchy Dashboard Metrics Aggregation
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 16: Hierarchy Dashboard Metrics aggregation... ');
  const metrics = superAdmin.getHierarchyDashboardMetrics();
  assert(metrics.totalStateManagers >= 2, 'Must count State Managers');
  assert(metrics.totalCityManagers >= 2, 'Must count City Managers');
  assert(metrics.activeManagers >= 3, 'Must count Active Managers');
  assert(metrics.pendingInvitations >= 1, 'Must count Pending Invitations');
  assert(metrics.stateWiseVendors.length >= 2, 'Must report State-wise vendors');
  assert(metrics.cityWiseVendors.length >= 3, 'Must report City-wise vendors');
  assert(metrics.stateWiseBookings.length >= 2, 'Must report State-wise bookings');
  assert(metrics.cityWiseBookings.length >= 3, 'Must report City-wise bookings');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 17: Scoped Vendor Filtering for State Manager
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 17: Scoped Vendor list filtering for State Manager... ');
  const allVendors = [
    { id: 1, business_name: 'Vallabh Decor', state_id: 'GJ', location: 'Godhra' },
    { id: 2, business_name: 'Mumbai Sound', state_id: 'MH', location: 'Mumbai' },
  ];
  const gjVendors = superAdmin.getScopedVendors(stateMgrUser, allVendors);
  assert(gjVendors.length === 1 && gjVendors[0].state_id === 'GJ', 'State manager sees only GJ vendors');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 18: Scoped Vendor Filtering for City Manager
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 18: Scoped Vendor list filtering for City Manager... ');
  const godhraVendors = superAdmin.getScopedVendors(cityMgrUser, allVendors);
  assert(godhraVendors.length === 1 && godhraVendors[0].location === 'Godhra', 'City manager sees only Godhra vendors');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 19: Scoped Bookings Filtering for City Manager
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 19: Scoped Bookings list filtering for City Manager... ');
  const allBookings = [
    { id: 101, venue: 'Motibaug, Godhra', city: 'Godhra' },
    { id: 102, venue: 'Grand Hyatt, Mumbai', city: 'Mumbai' },
  ];
  const godhraBookings = superAdmin.getScopedBookings(cityMgrUser, allBookings);
  assert(godhraBookings.length === 1 && godhraBookings[0].city === 'Godhra', 'City manager sees only Godhra bookings');
  console.log('PASS ✓');
  passedCount++;

  // ----------------------------------------------------------------------------
  // TEST 20: SQL Migration Script Integrity
  // ----------------------------------------------------------------------------
  process.stdout.write('Test 20: SQL Migration file contains tables, RLS & check functions... ');
  import('fs').then((fs) => {
    const sql = fs.readFileSync('./supabase_india_wide_hierarchy_migration.sql', 'utf8');
    assert(sql.includes('CREATE TABLE IF NOT EXISTS public.state_city_mapping'), 'Must create state_city_mapping');
    assert(sql.includes('CREATE TABLE IF NOT EXISTS public.manager_assignments'), 'Must create manager_assignments');
    assert(sql.includes('CREATE TABLE IF NOT EXISTS public.role_permissions'), 'Must create role_permissions');
    assert(sql.includes('CREATE TABLE IF NOT EXISTS public.manager_activity_logs'), 'Must create manager_activity_logs');
    assert(sql.includes('check_manager_state_access'), 'Must define state access check function');
    assert(sql.includes('check_manager_city_access'), 'Must define city access check function');
    console.log('PASS ✓');
    passedCount++;

    console.log('\n=================================================================');
    console.log(`  ALL ${passedCount} / 20 HIERARCHY TESTS PASSED (100% GREEN)       `);
    console.log('=================================================================\n');
    process.exit(0);
  });
}

runHierarchyTests().catch((err) => {
  console.error('\n❌ Hierarchy test execution failed:', err);
  process.exit(1);
});
