// ==============================================================================
// SHUBH CELEBRATIONS – STRICT ADMIN APPROVAL & CUSTOMER VISIBILITY TEST SUITE
// 
// Tests:
// Case 1: New vendor registers → listing remains hidden (listing_status = 'pending', is_approved = false)
// Case 2: Customer searches → pending vendor does not appear in search or nearby results
// Case 3: Admin approves → listing becomes visible in public search
// Case 4: Admin rejects → listing remains hidden with rejection reason
// Case 5: Admin suspends → listing disappears immediately from public feeds
// Case 6: Vendor attempts to change approval status → strictly blocked (403 Forbidden)
// Case 7: Direct enquiry / API request for pending vendor → strictly blocked
// ==============================================================================

import assert from 'assert';
import {
  submitBusinessListing,
  fetchBusinessListings,
  approveBusinessListing,
  rejectBusinessListing,
  requestListingCorrections,
  suspendBusinessListing,
  reactivateBusinessListing,
  vendorAttemptSelfApproval,
  getVendorListingByPhone,
} from './src/services/superAdminService.js';
import {
  isPubliclyVisibleVendor,
  smartMatchVendors,
  createCustomerEnquiry,
} from './src/services/marketplaceService.js';
import { searchNearbyVendors } from './src/services/nearbySearchService.js';

let passedTests = 0;
let totalTests = 0;

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
  console.log('  SHUBH CELEBRATIONS – STRICT ADMIN APPROVAL SYSTEM TEST SUITE  ');
  console.log('=================================================================\n');

  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const testPhone = `9825${randomSuffix}`;
  const superAdminUser = {
    id: 'c0570000-0000-4000-8000-000000000001',
    role: 'super_admin',
    full_name: 'Super Admin HQ',
  };
  const regularVendorUser = {
    id: 'c0570000-0000-4000-8000-000000000002',
    role: 'vendor',
    phone: testPhone,
    full_name: 'Test Vendor Owner',
  };

  let pendingListingId = null;

  // ----------------------------------------------------------------------------
  // CASE 1: New vendor registration creates strictly PENDING listing
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 1: New Vendor Registration → Status is strictly PENDING and UNAPPROVED', async () => {
    const res = await submitBusinessListing({
      business_name: 'Jay Ambe Sound & DJ System',
      category: 'dj',
      location: 'Civil Lines, Godhra',
      price_range: '₹15,000 - ₹50,000',
      phone: testPhone,
      description: 'Top-tier wedding JBL sound system and live stage setup in Godhra.',
      owner_name: 'Ramesh Patel',
      owner_id: regularVendorUser.id,
    });

    assert.strictEqual(res.success, true, 'Registration submission must succeed');
    assert.strictEqual(res.listing.listing_status, 'pending', 'Listing status must be pending');
    assert.strictEqual(res.listing.is_approved, false, 'is_approved must be false');
    assert.strictEqual(res.listing.account_status, 'pending', 'account_status must be pending');
    assert.ok(res.listing.id, 'Listing must have an ID');

    pendingListingId = res.listing.id;

    // Verify vendor can view their own pending listing
    const vendorView = getVendorListingByPhone(testPhone);
    assert.ok(vendorView, 'Vendor must be able to view their pending listing');
    assert.strictEqual(vendorView.listing_status, 'pending', 'Listing status must be pending for vendor');
  });

  // ----------------------------------------------------------------------------
  // CASE 2: Customer searches strictly EXCLUDE the pending listing
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 2: Customer App Visibility Lockdown → Pending vendor hidden from all searches', async () => {
    const pendingListing = getVendorListingByPhone(testPhone);
    assert.ok(pendingListing, 'Pending listing must exist');

    // 1. Direct visibility checker
    const isVisible = isPubliclyVisibleVendor(pendingListing);
    assert.strictEqual(isVisible, false, 'isPubliclyVisibleVendor must return false for pending listing');

    // 2. Smart Match
    const matchedVendors = smartMatchVendors([pendingListing], { category: 'dj', city: 'Godhra' });
    const foundInMatch = matchedVendors.some((v) => v.phone === testPhone);
    assert.strictEqual(foundInMatch, false, 'Pending vendor must NOT appear in smartMatchVendors results');

    // 3. Nearby Geospatial Search
    const nearbyResults = searchNearbyVendors({
      vendors: [pendingListing],
      radiusKm: 50,
      category: 'all',
    });
    const foundInNearby = nearbyResults.vendors.some((v) => v.phone === testPhone);
    assert.strictEqual(foundInNearby, false, 'Pending vendor must NOT appear in searchNearbyVendors results');

    // 4. Duplicate Registration Guard
    const dupRes = await submitBusinessListing({
      business_name: 'Jay Ambe Sound Duplicate',
      category: 'dj',
      location: 'Civil Lines, Godhra',
      price_range: '₹15,000 - ₹50,000',
      phone: testPhone,
    });
    assert.strictEqual(dupRes.success, false, 'Duplicate phone listing must be blocked');
    assert.strictEqual(dupRes.error, 'duplicate_listing');
  });

  // ----------------------------------------------------------------------------
  // CASE 3: Admin approves → Listing becomes publicly visible
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 3: Super Admin approves → Listing becomes visible in public search', async () => {
    const approveRes = await approveBusinessListing(pendingListingId, superAdminUser);
    assert.strictEqual(approveRes.success, true, 'Approval must succeed');
    assert.strictEqual(approveRes.listing.listing_status, 'approved', 'Status must be approved');
    assert.strictEqual(approveRes.listing.is_approved, true, 'is_approved must be true');
    assert.strictEqual(approveRes.listing.account_status, 'active', 'account_status must be active');

    // Verify visibility check passes
    const approvedListing = getVendorListingByPhone(testPhone);
    const isVisible = isPubliclyVisibleVendor(approvedListing);
    assert.strictEqual(isVisible, true, 'Approved listing must now be publicly visible');

    // Verify it appears in smart match
    const matched = smartMatchVendors([approvedListing], { category: 'dj', city: 'Godhra' });
    assert.ok(matched.length > 0, 'Approved vendor must appear in smart matching');
    assert.strictEqual(matched[0].phone, testPhone, 'Matched vendor phone must match');
  });

  // ----------------------------------------------------------------------------
  // CASE 4: Admin rejects with reason → Listing remains hidden with rejection note
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 4: Admin rejects listing with reason → Remains hidden from public', async () => {
    const rejectPhone = `9825${Math.floor(100000 + Math.random() * 900000)}`;
    const regRes = await submitBusinessListing({
      business_name: 'Dubious Event Rentals',
      category: 'mandap',
      location: 'Unknown Area, Godhra',
      price_range: '₹5,000',
      phone: rejectPhone,
    });
    assert.strictEqual(regRes.success, true);
    const rejectListingId = regRes.listing.id;

    const rejectionReason = 'Incomplete business documents and unverified phone contact.';
    const rejectRes = await rejectBusinessListing(rejectListingId, superAdminUser, rejectionReason);
    assert.strictEqual(rejectRes.success, true, 'Rejection must succeed');
    assert.strictEqual(rejectRes.listing.listing_status, 'rejected', 'Status must be rejected');
    assert.strictEqual(rejectRes.listing.is_approved, false, 'is_approved must be false');
    assert.strictEqual(rejectRes.listing.rejection_reason, rejectionReason);

    // Verify visibility
    const rejectedListing = getVendorListingByPhone(rejectPhone);
    assert.strictEqual(isPubliclyVisibleVendor(rejectedListing), false, 'Rejected vendor must NOT be visible');
  });

  // ----------------------------------------------------------------------------
  // CASE 5: Admin suspends an approved vendor → Immediately hidden from public
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 5: Admin suspends listing → Listing vanishes immediately from public feeds', async () => {
    const suspensionReason = 'Excessive customer cancellation complaints without refunds.';
    const suspendRes = await suspendBusinessListing(pendingListingId, superAdminUser, suspensionReason);
    assert.strictEqual(suspendRes.success, true, 'Suspension must succeed');
    assert.strictEqual(suspendRes.listing.listing_status, 'suspended', 'Status must be suspended');
    assert.strictEqual(suspendRes.listing.account_status, 'suspended', 'account_status must be suspended');

    // Verify visibility is immediately revoked
    const suspendedListing = getVendorListingByPhone(testPhone);
    assert.strictEqual(isPubliclyVisibleVendor(suspendedListing), false, 'Suspended listing must NOT be visible');

    // Reactivation test
    const reactivateRes = await reactivateBusinessListing(pendingListingId, superAdminUser);
    assert.strictEqual(reactivateRes.success, true, 'Reactivation must succeed');
    assert.strictEqual(reactivateRes.listing.listing_status, 'approved', 'Status must be restored to approved');
    assert.strictEqual(isPubliclyVisibleVendor(getVendorListingByPhone(testPhone)), true, 'Reactivated vendor must be visible');
  });

  // ----------------------------------------------------------------------------
  // CASE 6: Vendor attempts to self-approve or elevate permissions → Strictly 403 Forbidden
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 6: Vendor attempts self-approval → Strictly blocked (403 Forbidden)', async () => {
    const attempt = await vendorAttemptSelfApproval(pendingListingId, regularVendorUser);
    assert.strictEqual(attempt.success, false, 'Self approval must fail');
    assert.strictEqual(attempt.error, 'permission_denied', 'Must return permission_denied error code');
    assert.strictEqual(attempt.status, 403, 'Must return HTTP 403');
  });

  // ----------------------------------------------------------------------------
  // CASE 7: Direct customer enquiry / API request for unapproved vendor → Strictly blocked
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 7: Customer enquiry creation for unapproved vendor → Strictly blocked', async () => {
    const unapprovedVendor = {
      id: 999999,
      business_name: 'Unapproved Fake Mandap',
      phone: '9999988888',
      listing_status: 'pending',
      is_approved: false,
      account_status: 'pending',
    };

    const enquiryRes = createCustomerEnquiry({
      customerName: 'Aarav Mehta',
      customerPhone: '9825112233',
      vendor: unapprovedVendor,
      eventDate: '2026-12-15',
      eventType: 'Wedding',
    });

    assert.strictEqual(enquiryRes.success, false, 'Enquiry to unapproved vendor must be rejected');
    assert.strictEqual(enquiryRes.error, 'vendor_not_approved', 'Error code must be vendor_not_approved');
  });

  console.log('\n=================================================================');
  console.log(`  ALL ${totalTests} STRICT ADMIN APPROVAL TESTS PASSED SUCCESSFULLY! (100%)  `);
  console.log('=================================================================\n');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
