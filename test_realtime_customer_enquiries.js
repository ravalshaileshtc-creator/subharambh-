// ==============================================================================
// TEST SUITE: ZERO MOCK DATA & REAL-TIME CUSTOMER ENQUIRIES / QUOTES ISOLATION
// Verifies:
// 1. Initial customer login has ZERO mock data (no Bhaveshbhai, no ENQ-2026-1001)
// 2. Strict Customer Data Isolation: Customer A cannot see Customer B's enquiries
// 3. Vendor quotation workflow updates real customer quotes in real-time
// 4. Customer bookings and direct payments isolation (zero leaks)
// 5. Unapproved vendors cannot receive customer enquiries
// ==============================================================================

const assert = require('assert');
const {
  createCustomerEnquiry,
  getCustomerEnquiries,
  fetchRealtimeCustomerEnquiries,
  submitVendorQuote,
  clearCustomerEnquiriesForTest,
  maskPhoneNumber,
} = require('./src/services/marketplaceService');

const { getCustomerBookings } = require('./src/services/rbacService');
const { getDirectPayments } = require('./src/services/marketplaceEngine');

// Mock approved vendors
const VENDORS = [
  { id: 1, business_name: 'Vallabh Decoration', category: 'mandap', is_verified: true, listing_status: 'approved', is_approved: true, account_status: 'active' },
  { id: 5, business_name: 'Motibaug Party Plot', category: 'party_plot', is_verified: true, listing_status: 'approved', is_approved: true, account_status: 'active' },
  { id: 25, business_name: 'Ganesh Catering Service', category: 'catering', is_verified: true, listing_status: 'approved', is_approved: true, account_status: 'active' },
  { id: 99, business_name: 'Pending Decorator', category: 'mandap', is_verified: false, listing_status: 'pending', is_approved: false },
];

console.log('=================================================================');
console.log('  TESTING REAL-TIME CUSTOMER ENQUIRIES & ZERO MOCK DATA ISOLATION');
console.log('=================================================================\n');

// Reset state
clearCustomerEnquiriesForTest();

// ------------------------------------------------------------------------------
// TEST 1: ZERO MOCK DATA ON FRESH CUSTOMER LOGIN
// ------------------------------------------------------------------------------
console.log('Test 1: Zero mock data on fresh customer login...');
const freshCustomer = {
  id: 'c0570000-0000-4000-8000-009988776655',
  phone: '9988776655',
  full_name: 'Pooja Sharma',
  role: 'customer',
};

const initialEnquiries = getCustomerEnquiries(freshCustomer);
assert.strictEqual(
  initialEnquiries.length,
  0,
  `Customer must have ZERO mock enquiries upon login! Found: ${initialEnquiries.length}`
);
// Ensure ENQ-2026-1001 and Bhaveshbhai Patel never appear
assert(
  !initialEnquiries.some((e) => e.customer_name === 'Bhaveshbhai Patel'),
  'Mock customer "Bhaveshbhai Patel" must not appear!'
);
assert(
  !initialEnquiries.some((e) => e.id === 'ENQ-2026-1001'),
  'Mock enquiry "ENQ-2026-1001" must not appear!'
);
console.log('  PASS: Fresh customer login has exactly 0 enquiries. Zero mock data.\n');

// ------------------------------------------------------------------------------
// TEST 2: REAL-TIME CUSTOMER REQUIREMENT DISPATCH
// ------------------------------------------------------------------------------
console.log('Test 2: Customer posts real requirement...');
const created = createCustomerEnquiry(
  {
    customer_id: freshCustomer.id,
    customer_name: freshCustomer.full_name,
    customer_phone: freshCustomer.phone,
    event_type: 'wedding',
    location: 'Godhra (Bamroli Road)',
    event_date: '2026-12-25',
    guest_count: '500 Guests',
    services: ['mandap', 'catering'],
    budget: '₹3,00,000 - ₹5,00,000',
    notes: 'Require royal mandap setup and pure veg feast.',
  },
  VENDORS
);

assert.strictEqual(created.success, true, 'Enquiry creation must succeed');
assert(created.enquiryCode.startsWith('ENQ-'), 'Enquiry code must have valid prefix');
assert(created.matchedCount >= 1, 'Must match with verified approved vendors');

const customerEnquiriesAfterPost = getCustomerEnquiries(freshCustomer);
assert.strictEqual(customerEnquiriesAfterPost.length, 1, 'Customer should now have 1 enquiry');
assert.strictEqual(customerEnquiriesAfterPost[0].id, created.enquiryCode);
assert.strictEqual(customerEnquiriesAfterPost[0].customer_name, 'Pooja Sharma');
assert.strictEqual(customerEnquiriesAfterPost[0].customer_phone, '9988776655');
assert.strictEqual(customerEnquiriesAfterPost[0].quotes.length, 0, 'Initial quotes count must be 0');
console.log(`  PASS: Requirement ${created.enquiryCode} created and visible to Pooja Sharma.\n`);

// ------------------------------------------------------------------------------
// TEST 3: STRICT CUSTOMER DATA ISOLATION (NO DATA LEAKS)
// ------------------------------------------------------------------------------
console.log('Test 3: Customer isolation between different users...');
const customerB = {
  id: 'c0570000-0000-4000-8000-009123456789',
  phone: '9123456789',
  full_name: 'Anil Mehta',
  role: 'customer',
};

const customerBEnquiries = getCustomerEnquiries(customerB);
assert.strictEqual(
  customerBEnquiries.length,
  0,
  'Customer B must NOT see Customer A (Pooja Sharma) enquiries!'
);
console.log('  PASS: Strict customer isolation confirmed. Customer B sees 0 enquiries.\n');

// ------------------------------------------------------------------------------
// TEST 4: REAL-TIME VENDOR QUOTATION SUBMISSION & REFLECTION
// ------------------------------------------------------------------------------
console.log('Test 4: Vendor submits quote → instantly reflects in Customer A quotes...');
const quoteRes = submitVendorQuote(created.enquiryCode, 1, {
  vendor_name: 'Vallabh Decoration',
  category: 'mandap',
  quoted_price: '₹68,000',
  package_details: 'Royal Rajwadi Mandap with LED Entrance Gates & Chori set.',
  valid_until: '15 Days',
});

assert.strictEqual(quoteRes.success, true, 'Vendor quote submission must succeed');
assert.strictEqual(quoteRes.totalQuotes, 1, 'Total quotes should now be 1');

// Verify Customer A sees the new quote live
const updatedCustomerEnquiries = getCustomerEnquiries(freshCustomer);
assert.strictEqual(updatedCustomerEnquiries[0].quotes.length, 1, 'Customer A should see 1 received quote');
assert.strictEqual(updatedCustomerEnquiries[0].quotes[0].vendor_name, 'Vallabh Decoration');
assert.strictEqual(updatedCustomerEnquiries[0].quotes[0].quoted_price, '₹68,000');
assert.strictEqual(updatedCustomerEnquiries[0].status, '1 Quotes Received');

// Verify Customer B STILL sees 0
assert.strictEqual(getCustomerEnquiries(customerB).length, 0, 'Customer B must still see 0');
console.log('  PASS: Real-time vendor quote reflection verified. Status updated to 1 Quotes Received.\n');

// ------------------------------------------------------------------------------
// TEST 5: CUSTOMER BOOKINGS & DIRECT PAYMENTS ISOLATION
// ------------------------------------------------------------------------------
console.log('Test 5: Customer bookings & direct payments isolation...');
// Fresh customer should have ZERO bookings and ZERO direct payments
const freshBookings = getCustomerBookings(freshCustomer);
assert.strictEqual(freshBookings.length, 0, 'Fresh customer must have 0 bookings');

const freshPayments = getDirectPayments(null, freshCustomer);
assert.strictEqual(freshPayments.length, 0, 'Fresh customer must have 0 direct payments');

console.log('  PASS: Customer bookings & direct payments have zero mock leaks.\n');

// ------------------------------------------------------------------------------
// TEST 6: UNAPPROVED VENDOR ENQUIRY PREVENTION
// ------------------------------------------------------------------------------
console.log('Test 6: Customer cannot send direct enquiry to pending/unapproved vendor...');
const unapprovedEnquiry = createCustomerEnquiry({
  customer_name: 'Pooja Sharma',
  customer_phone: '9988776655',
  vendor_id: 99, // Unapproved vendor
  services: ['mandap'],
}, VENDORS);

assert.strictEqual(unapprovedEnquiry.success, false, 'Enquiry to unapproved vendor must fail');
assert.strictEqual(unapprovedEnquiry.error, 'vendor_not_approved');
console.log('  PASS: Pending vendor enquiry blocked with vendor_not_approved.\n');

console.log('=================================================================');
console.log('  ALL 6 REAL-TIME CUSTOMER ENQUIRIES TESTS PASSED! (100% GREEN)  ');
console.log('=================================================================\n');
