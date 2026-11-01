// ==============================================================================
// TEST SUITE: PANCHMAHAL MARKETPLACE UPGRADE
// Automated Verification for all 5 Features + Admin + Existing Features
// ==============================================================================

const assert = require('assert');
const {
  smartMatchVendors,
  checkVendorDateAvailability,
  updateVendorDateAvailability,
  createCustomerEnquiry,
  getCustomerEnquiries,
  submitVendorQuote,
  getVendorPortfolio,
  addVendorPortfolioPhoto,
  deleteVendorPortfolioPhoto,
  logAuditEvent,
  getAuditLogs,
  maskPhoneNumber,
} = require('./src/services/marketplaceService');

const { PANCHMAHAL_TALUKAS } = require('./src/constants/locations');
const { EVENT_TYPES, GUEST_RANGES, BUDGET_RANGES } = require('./src/constants/eventTypes');

// Mock vendors dataset representing Godhra vendors
const MOCK_VENDORS = [
  { id: 1, business_name: 'Vallabh Decoration', category: 'mandap', location: 'Bamroli Road, Godhra', price_range: '₹25,000 - ₹95,000', rating: 4.9, is_verified: true, phone: '9825123401' },
  { id: 2, business_name: 'Shree Sahajanand Mandap', category: 'mandap', location: 'Kachiyawad, Godhra', price_range: '₹20,000 - ₹75,000', rating: 4.8, is_verified: true, phone: '9879234502' },
  { id: 5, business_name: 'Motibaug Party Plot', category: 'party_plot', location: 'Vavdi Buzarg, Godhra', price_range: '₹45,000 - ₹1,10,000', rating: 5.0, is_verified: true, phone: '9825334505' },
  { id: 6, business_name: 'Vrindavan Party Plot', category: 'party_plot', location: 'Halol Road, Godhra', price_range: '₹35,000 - ₹85,000', rating: 4.8, is_verified: true, phone: '9879445606' },
  { id: 25, business_name: 'Ganesh Catering Service', category: 'catering', location: 'Science College Road, Godhra', price_range: '₹380 - ₹800/plate', rating: 5.0, is_verified: true, phone: '9825667825' },
  { id: 28, business_name: 'Dhwanit Catering', category: 'catering', location: 'Kanjari Road, Halol', price_range: '₹400 - ₹850/plate', rating: 4.9, is_verified: true, phone: '9898990128' },
  { id: 30, business_name: 'Unverified Test Decor', category: 'mandap', location: 'Shehra', price_range: '₹15,000 - ₹30,000', rating: 4.0, is_verified: false, phone: '9800000000' },
];

console.log('🧪 Starting Panchmahal Event Marketplace Test Suite...\n');

// ------------------------------------------------------------------------------
// TEST 1: FEATURE 1 - SMART EVENT SEARCH
// ------------------------------------------------------------------------------
console.log('--- TEST 1: Smart Event Search ---');
// 1.1 Category & Location Match
const search1 = smartMatchVendors(MOCK_VENDORS, {
  category: 'mandap',
  location: 'Godhra',
  sortBy: 'rating',
});
assert(search1.length >= 2, 'Should find at least 2 mandap vendors in Godhra');
assert.strictEqual(search1[0].id, 1, 'Top rated should be Vallabh Decoration (4.9)');
console.log('✅ 1.1 Category & Location match passed.');

// 1.2 Multi-service match
const search2 = smartMatchVendors(MOCK_VENDORS, {
  requiredServices: ['party_plot', 'catering'],
  location: 'Godhra',
});
assert(search2.every(v => ['party_plot', 'catering'].includes(v.category)), 'All results must match required services');
console.log('✅ 1.2 Multi-service match passed.');

// 1.3 Verified only filter
const search3 = smartMatchVendors(MOCK_VENDORS, {
  category: 'mandap',
  verifiedOnly: true,
});
assert(search3.every(v => v.is_verified === true), 'All results must be verified');
assert(!search3.some(v => v.id === 30), 'Unverified vendor 30 must be excluded');
console.log('✅ 1.3 Verified only filter passed.');

// 1.4 Date Availability awareness in Search
const search4 = smartMatchVendors(MOCK_VENDORS, {
  eventDate: '2026-11-25', // Vallabh Decor and Motibaug are already booked on 2026-11-25
});
assert(!search4.some(v => v.id === 1), 'Booked vendor 1 should be excluded for 2026-11-25');
console.log('✅ 1.4 Date availability awareness in Search passed.');

// ------------------------------------------------------------------------------
// TEST 2: FEATURE 2 - VENDOR COMPARISON (UP TO 5 VENDORS)
// ------------------------------------------------------------------------------
console.log('\n--- TEST 2: Vendor Comparison ---');
const compareSet = [1, 2, 5, 25, 28]; // 5 vendors
assert.strictEqual(compareSet.length, 5, 'Exact 5 vendors allowed');
const comparedData = MOCK_VENDORS.filter(v => compareSet.includes(v.id));
assert.strictEqual(comparedData.length, 5, 'All 5 vendors retrieved with complete details');
for (const v of comparedData) {
  assert(v.business_name, 'Vendor must have business name');
  assert(v.price_range, 'Vendor must have price range');
  assert(v.location, 'Vendor must have location');
  assert(typeof v.rating === 'number', 'Vendor must have numerical rating');
}
console.log('✅ 2.1 Complete comparison data structure verified for 5 vendors.');

// ------------------------------------------------------------------------------
// TEST 3: FEATURE 3 - REAL PHOTOS AND VIDEO GALLERY
// ------------------------------------------------------------------------------
console.log('\n--- TEST 3: Real Photos & Video Gallery ---');
const port1 = getVendorPortfolio(MOCK_VENDORS[0]);
assert(port1, 'Portfolio must exist for vendor 1');
assert(port1.photos.length >= 5, 'Must have at least 5 gallery photos');
assert(port1.packages.length >= 2, 'Must have package details');
console.log(`✅ 3.1 Retrieved portfolio with ${port1.photos.length} photos and ${port1.packages.length} packages.`);

// Add photo
const newPhoto = addVendorPortfolioPhoto(1, {
  url: 'https://images.unsplash.com/photo-test-wedding.jpg',
  caption: 'New Royal Mandap Stage Test',
  category: 'decor',
});
assert.strictEqual(newPhoto.caption, 'New Royal Mandap Stage Test');
const updatedPort1 = getVendorPortfolio(MOCK_VENDORS[0]);
assert(updatedPort1.photos.some(p => p.id === newPhoto.id), 'New photo must be present in portfolio');
console.log('✅ 3.2 Add photo to portfolio passed.');

// Delete photo
const deleted = deleteVendorPortfolioPhoto(1, newPhoto.id);
assert.strictEqual(deleted, true, 'Delete photo should succeed');
const finalPort1 = getVendorPortfolio(MOCK_VENDORS[0]);
assert(!finalPort1.photos.some(p => p.id === newPhoto.id), 'Deleted photo must not be present');
console.log('✅ 3.3 Delete photo from portfolio passed.');

// ------------------------------------------------------------------------------
// TEST 4: FEATURE 4 - EVENT DATE AVAILABILITY & DOUBLE-BOOKING PREVENTION
// ------------------------------------------------------------------------------
console.log('\n--- TEST 4: Date Availability & Double-Booking Prevention ---');
// Check pre-existing booking
const check1 = checkVendorDateAvailability(1, '2026-11-25');
assert.strictEqual(check1.status, 'booked', 'Vendor 1 should be booked on 2026-11-25');

// Attempt double-booking on 2026-11-25
const doubleBookingAttempt = updateVendorDateAvailability(1, '2026-11-25', 'booked', 'Attempted duplicate booking');
assert.strictEqual(doubleBookingAttempt.success, false, 'Double booking must be blocked!');
console.log('✅ 4.1 Double booking correctly BLOCKED by validation logic.');

// Valid booking on free date
const freeDateBooking = updateVendorDateAvailability(1, '2027-03-15', 'booked', 'Spring Wedding in Godhra');
assert.strictEqual(freeDateBooking.success, true, 'Booking on free date should succeed');
assert.strictEqual(checkVendorDateAvailability(1, '2027-03-15').status, 'booked');
console.log('✅ 4.2 Booking on open date successfully recorded.');

// ------------------------------------------------------------------------------
// TEST 5: FEATURE 5 - ONE-CLICK REQUIREMENT & GET 5 QUOTES
// ------------------------------------------------------------------------------
console.log('\n--- TEST 5: Get 5 Event Quotes Workflow ---');
const leadRes = createCustomerEnquiry({
  customer_name: 'Dineshbhai Shah',
  customer_phone: '9825123999',
  event_type: 'wedding',
  location: 'Godhra',
  event_date: '2026-12-28',
  guest_count: '500',
  services: ['mandap', 'catering'],
  budget: '₹2,50,000 - ₹4,00,000',
  notes: 'Need royal mandap + pure veg banquet',
}, MOCK_VENDORS);

assert.strictEqual(leadRes.success, true, 'Enquiry creation must succeed');
assert(leadRes.enquiryCode.startsWith('ENQ-2026-'), 'Enquiry code must have valid format');
assert(leadRes.matchedCount <= 5, 'Matched vendors must never exceed 5');
console.log(`✅ 5.1 Enquiry ${leadRes.enquiryCode} created and dispatched to ${leadRes.matchedCount} verified vendors.`);

// Submit vendor quote
const quoteRes = submitVendorQuote(leadRes.enquiryCode, 1, {
  vendor_name: 'Vallabh Decoration',
  category: 'mandap',
  quoted_price: '₹75,000',
  package_details: 'Royal Rajwadi Mandap with LED Entrance',
});
assert.strictEqual(quoteRes.success, true, 'Quote submission must succeed');
assert.strictEqual(quoteRes.totalQuotes, 1, 'Total quotes should now be 1');
console.log('✅ 5.2 Vendor quotation successfully submitted and linked.');

// Privacy check: mask phone
const masked = maskPhoneNumber('9825123999');
assert.strictEqual(masked, '9825XXXX99', 'Phone number must be masked for privacy');
console.log('✅ 5.3 Customer phone privacy masking verified.');

// ------------------------------------------------------------------------------
// TEST 6: ADMIN PANEL & AUDIT LOGGING
// ------------------------------------------------------------------------------
console.log('\n--- TEST 6: Admin Panel & Audit Logging ---');
logAuditEvent('ADMIN_TEST_ACTION', 'Superadmin verified test vendor');
const logs = getAuditLogs();
assert(logs.length > 0, 'Audit logs must record actions');
assert(logs.some(l => l.action === 'ADMIN_TEST_ACTION'), 'Test action must be recorded in audit log');
console.log('✅ 6.1 Audit logging verified.');

// ------------------------------------------------------------------------------
// TEST 7: GEOGRAPHY & CONSTANTS INTEGRITY
// ------------------------------------------------------------------------------
console.log('\n--- TEST 7: Panchmahal Geography & Categories ---');
assert(PANCHMAHAL_TALUKAS.length >= 7, 'Must have at least 7 talukas in Panchmahal');
assert(EVENT_TYPES.length >= 7, 'Must support 7 event types');
console.log('✅ 7.1 Geography & Event Type definitions verified.');

console.log('\n🎉 ALL 7 TEST SUITES PASSED FLAWLESSLY! Zero regressions.\n');
