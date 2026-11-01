// ==============================================================================
// SHUBH CELEBRATIONS – UNIVERSAL BILL BOOK TEST SUITE
// 
// Tests:
// Case 1: Approved Vendor creates bill → Calculates accurate math & balance
// Case 2: Customer attempts to create/edit bill → Strictly blocked (403 Forbidden)
// Case 3: Pending/Rejected/Suspended vendors attempt to create bill → Strictly blocked (403)
// Case 4: Vendor Data Isolation → Vendor A cannot view, edit, or cancel Vendor B's bills
// Case 5: Customer Invoices Access → Customer sees only bills issued to their phone
// Case 6: Super Admin & Managers Access → Super Admin sees all platform bills
// Case 7: Record Payment → Recalculates balance & updates status to 'paid'
// Case 8: Bill Cancellation with Reason → Locks bill from editing/payments
// Case 9: WhatsApp Invoice Share Text → Formats itemized invoice message
// Case 10: Bill Duplication → Creates fresh copy with unique bill number
// ==============================================================================

import assert from 'assert';
import {
  canVendorManageBills,
  calculateBillTotals,
  createVendorBill,
  updateVendorBill,
  recordBillPayment,
  cancelVendorBill,
  duplicateVendorBill,
  getVendorBills,
  getCustomerBills,
  getAllPlatformBills,
  getBillsFinancialSummary,
  generateWhatsAppInvoiceShareText,
  generateWhatsAppReceiptShareText,
  generateA4InvoiceHTML,
  generateA4ReceiptHTML,
} from './src/services/billBookService.js';
import { ROLES, VENDOR_STATUS } from './src/services/rbacService.js';

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
  console.log('    SHUBH CELEBRATIONS – UNIVERSAL BILL BOOK TEST SUITE         ');
  console.log('=================================================================\n');

  // Test User Entities
  const approvedVendorUser = {
    id: 'c0570000-0000-4000-8000-009825123401',
    vendor_id: 1,
    role: ROLES.VENDOR,
    vendor_status: VENDOR_STATUS.APPROVED,
    is_approved: true,
    account_status: 'active',
    business_name: 'Vallabh Decoration & Event Management',
    phone: '9825123401',
    location: 'Behind Deep Hospital, Bamroli Road, Godhra',
  };

  const otherVendorUser = {
    id: 'c0570000-0000-4000-8000-009825123402',
    vendor_id: 2,
    role: ROLES.VENDOR,
    vendor_status: VENDOR_STATUS.APPROVED,
    is_approved: true,
    account_status: 'active',
    business_name: 'Shree Sahajanand Mandap Service',
    phone: '9879234502',
    location: 'Kachiyawad, Near Ram Sagar Lake, Godhra',
  };

  const pendingVendorUser = {
    id: 'c0570000-0000-4000-8000-009825445566',
    vendor_id: 3,
    role: ROLES.VENDOR,
    vendor_status: VENDOR_STATUS.PENDING,
    is_approved: false,
    listing_status: 'pending',
    account_status: 'pending',
    business_name: 'Pending Mandap Decor',
    phone: '9825445566',
  };

  const rejectedVendorUser = {
    id: 'c0570000-0000-4000-8000-009825998877',
    vendor_id: 4,
    role: ROLES.VENDOR,
    vendor_status: VENDOR_STATUS.REJECTED,
    is_approved: false,
    listing_status: 'rejected',
    account_status: 'rejected',
    phone: '9825998877',
  };

  const suspendedVendorUser = {
    id: 'c0570000-0000-4000-8000-009825332211',
    vendor_id: 5,
    role: ROLES.VENDOR,
    vendor_status: VENDOR_STATUS.SUSPENDED,
    account_status: 'suspended',
    phone: '9825332211',
  };

  const customerUser = {
    id: 'c0570000-0000-4000-8000-009825098765',
    role: ROLES.CUSTOMER,
    full_name: 'Rajeshbhai Patel',
    phone: '9825098765',
  };

  const otherCustomerUser = {
    id: 'c0570000-0000-4000-8000-009825999999',
    role: ROLES.CUSTOMER,
    full_name: 'Anand Sharma',
    phone: '9825999999',
  };

  const superAdminUser = {
    id: 'c0570000-0000-4000-8000-009825111111',
    role: ROLES.SUPER_ADMIN,
    full_name: 'Super Admin HQ',
    phone: '9825111111',
  };

  let testBill = null;

  // ----------------------------------------------------------------------------
  // CASE 1: Approved Vendor Bill Creation & Decimal Math Verification
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 1: Approved Vendor creates bill with accurate mathematical totals', async () => {
    const payload = {
      customer_name: 'Rajeshbhai Patel',
      customer_phone: '9825098765',
      event_name: 'Grand Wedding & Sangeet Setup',
      event_date: '2026-12-20',
      event_location: 'Motibaug Party Plot, Godhra',
      items: [
        { id: 1, description: 'Royal Wooden Mandap', quantity: 1, rate: 40000 },
        { id: 2, description: 'VIP Sofa Seating (Pairs)', quantity: 10, rate: 1500 },
        { id: 3, description: 'Truss Stage LED Par Lights', quantity: 4, rate: 2500 },
      ],
      discount: 5000,
      additional_charges: 2000, // Transport
      tax_percent: 5, // 5% GST
      advance_paid: 20000,
      payment_method: 'UPI',
    };

    const res = await createVendorBill(payload, approvedVendorUser);
    assert.strictEqual(res.success, true, 'Bill creation must succeed');
    assert.ok(res.bill.bill_number, 'Unique bill number must be generated');
    
    // Subtotal: 40000 + (10 * 1500 = 15000) + (4 * 2500 = 10000) = 65000
    assert.strictEqual(res.bill.subtotal, 65000.00);
    // Taxable: 65000 - 5000 + 2000 = 62000
    // Tax (5%): 62000 * 0.05 = 3100
    assert.strictEqual(res.bill.tax_amount, 3100.00);
    // Grand Total: 62000 + 3100 = 65100
    assert.strictEqual(res.bill.grand_total, 65100.00);
    // Paid: 20000
    assert.strictEqual(res.bill.total_paid, 20000.00);
    // Balance Due: 65100 - 20000 = 45100
    assert.strictEqual(res.bill.balance_due, 45100.00);
    assert.strictEqual(res.bill.payment_status, 'partial');
    assert.strictEqual(res.bill.vendor_id, 1);
    assert.strictEqual(res.bill.customer_phone, '9825098765');

    testBill = res.bill;
  });

  // ----------------------------------------------------------------------------
  // CASE 2: Customer Attempting to Create or Edit Bill → Strictly Blocked (403)
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 2: Customer attempting to create or edit bill is blocked (403 Forbidden)', async () => {
    const customerAttempt = await createVendorBill(
      {
        customer_name: 'Self Issued',
        customer_phone: '9825098765',
        event_name: 'Test Event',
        event_date: '2026-12-20',
        items: [{ id: 1, description: 'Test', quantity: 1, rate: 5000 }],
      },
      customerUser
    );

    assert.strictEqual(customerAttempt.success, false, 'Customer must not be allowed to create bills');
    assert.strictEqual(customerAttempt.status, 403, 'Must return 403 Forbidden');
    assert.strictEqual(customerAttempt.error, 'customer_cannot_create_bills');

    // Customer attempt to edit vendor bill
    const editAttempt = await updateVendorBill(testBill.id, { discount: 50000 }, customerUser);
    assert.strictEqual(editAttempt.success, false, 'Customer must not be allowed to edit bills');
    assert.strictEqual(editAttempt.status, 403);
  });

  // ----------------------------------------------------------------------------
  // CASE 3: Pending, Rejected, or Suspended Vendors Blocked (403)
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 3: Pending, Rejected, or Suspended vendors cannot create bills (403 Forbidden)', async () => {
    // 1. Pending Vendor
    const pendingRes = await createVendorBill(
      {
        customer_name: 'Test',
        customer_phone: '9825098765',
        event_name: 'Test',
        event_date: '2026-12-20',
        items: [{ id: 1, description: 'Test', quantity: 1, rate: 5000 }],
      },
      pendingVendorUser
    );
    assert.strictEqual(pendingRes.success, false);
    assert.strictEqual(pendingRes.status, 403);
    assert.strictEqual(pendingRes.error, 'vendor_not_approved_for_billing');

    // 2. Rejected Vendor
    const rejectedRes = await createVendorBill(
      { customer_name: 'Test', customer_phone: '9825098765', event_name: 'Test', event_date: '2026-12-20', items: [{ id: 1, description: 'Test', quantity: 1, rate: 5000 }] },
      rejectedVendorUser
    );
    assert.strictEqual(rejectedRes.success, false);
    assert.strictEqual(rejectedRes.status, 403);

    // 3. Suspended Vendor
    const suspendedRes = await createVendorBill(
      { customer_name: 'Test', customer_phone: '9825098765', event_name: 'Test', event_date: '2026-12-20', items: [{ id: 1, description: 'Test', quantity: 1, rate: 5000 }] },
      suspendedVendorUser
    );
    assert.strictEqual(suspendedRes.success, false);
    assert.strictEqual(suspendedRes.status, 403);
  });

  // ----------------------------------------------------------------------------
  // CASE 4: Strict Vendor Data Isolation (Vendor A cannot see/edit Vendor B's bills)
  // ----------------------------------------------------------------------------
  await runAsyncTest("Case 4: Vendor Data Isolation: Vendor A cannot view, edit, or cancel Vendor B's bills", async () => {
    // Vendor 2 queries bills
    const vendor2Bills = getVendorBills(otherVendorUser);
    const hasVendor1Bill = vendor2Bills.some((b) => b.id === testBill.id);
    assert.strictEqual(hasVendor1Bill, false, "Vendor 2 must NOT see Vendor 1's bills");

    // Vendor 2 attempts to edit Vendor 1's bill
    const maliciousEdit = await updateVendorBill(testBill.id, { discount: 99999 }, otherVendorUser);
    assert.strictEqual(maliciousEdit.success, false);
    assert.strictEqual(maliciousEdit.status, 403);
    assert.strictEqual(maliciousEdit.error, 'unauthorized_vendor');

    // Vendor 2 attempts to cancel Vendor 1's bill
    const maliciousCancel = await cancelVendorBill(testBill.id, 'Malicious cancel', otherVendorUser);
    assert.strictEqual(maliciousCancel.success, false);
    assert.strictEqual(maliciousCancel.status, 403);
    assert.strictEqual(maliciousCancel.error, 'unauthorized_vendor');
  });

  // ----------------------------------------------------------------------------
  // CASE 5: Customer Invoices Access & Isolation
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 5: Customer sees invoices issued to them; cannot see other customers bills', async () => {
    // Target customer sees their bills
    const customerBills = getCustomerBills(customerUser);
    const hasMyBill = customerBills.some((b) => b.customer_phone === customerUser.phone);
    assert.strictEqual(hasMyBill, true, "Customer must see bills issued to their phone");

    // Other customer queries bills
    const otherCustomerBills = getCustomerBills(otherCustomerUser);
    const hasLeak = otherCustomerBills.some((b) => b.customer_phone === customerUser.phone);
    assert.strictEqual(hasLeak, false, "Other customer must NOT see another customer's bills");
  });

  // ----------------------------------------------------------------------------
  // CASE 6: Super Admin Platform-Wide Bills Access
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 6: Super Admin can view all vendor bills across the platform', async () => {
    const allBills = getAllPlatformBills(superAdminUser);
    assert.ok(allBills.length >= 3, 'Super Admin must see all platform bills');
    const summary = getBillsFinancialSummary(allBills);
    assert.ok(summary.totalInvoiced > 0, 'Financial summary total invoiced must be calculated');
    assert.ok(summary.totalReceived > 0, 'Total received must be calculated');
  });

  // ----------------------------------------------------------------------------
  // CASE 7: Record Partial Payment & Balance Recalculation
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 7: Record partial payment → updates balance, generates receipt & transitions to paid', async () => {
    // Record payment 1: ₹20,000
    const pay1 = await recordBillPayment(
      testBill.id,
      { amount: 20000, method: 'UPI', reference: 'UPI/9819280192', notes: 'Stage 2 payment' },
      approvedVendorUser
    );
    assert.strictEqual(pay1.success, true);
    assert.strictEqual(pay1.bill.total_paid, 40000.00); // 20000 advance + 20000
    assert.strictEqual(pay1.bill.balance_due, 25100.00); // 65100 - 40000
    assert.strictEqual(pay1.bill.payment_status, 'partial');
    assert.ok(pay1.receipt_number.startsWith('RCP-'));

    // Record final payment: ₹25,100 (Full settlement)
    const pay2 = await recordBillPayment(
      testBill.id,
      { amount: 25100, method: 'Cash', reference: 'Cash Settlement', notes: 'Final settlement' },
      approvedVendorUser
    );
    assert.strictEqual(pay2.success, true);
    assert.strictEqual(pay2.bill.total_paid, 65100.00);
    assert.strictEqual(pay2.bill.balance_due, 0.00);
    assert.strictEqual(pay2.bill.payment_status, 'paid', 'Status must transition to paid');
  });

  // ----------------------------------------------------------------------------
  // CASE 8: Bill Cancellation with Reason Locks Bill
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 8: Vendor cancels bill with reason → Status is cancelled and locked', async () => {
    // Create new bill to test cancellation
    const newBillRes = await createVendorBill(
      {
        customer_name: 'Cancel Test Customer',
        customer_phone: '9825112233',
        event_name: 'Cancellation Test Event',
        event_date: '2026-11-30',
        items: [{ id: 1, description: 'Stage Setup', quantity: 1, rate: 25000 }],
      },
      approvedVendorUser
    );
    assert.strictEqual(newBillRes.success, true);
    const cancelTargetId = newBillRes.bill.id;

    const cancelReason = 'Rain forecast; client decided to postpone event.';
    const cancelRes = await cancelVendorBill(cancelTargetId, cancelReason, approvedVendorUser);
    assert.strictEqual(cancelRes.success, true);
    assert.strictEqual(cancelRes.bill.payment_status, 'cancelled');
    assert.strictEqual(cancelRes.bill.cancellation_reason, cancelReason);

    // Attempting to record payment on cancelled bill must fail
    const payAttempt = await recordBillPayment(cancelTargetId, { amount: 5000 }, approvedVendorUser);
    assert.strictEqual(payAttempt.success, false);
    assert.strictEqual(payAttempt.error, 'bill_cancelled');
  });

  // ----------------------------------------------------------------------------
  // CASE 9: WhatsApp Invoice Share Text Generation
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 9: WhatsApp Invoice Share Text formats invoice details and balance', async () => {
    const rawEncoded = generateWhatsAppInvoiceShareText(testBill);
    assert.ok(rawEncoded.length > 50, 'WhatsApp text must be non-empty');
    const decoded = decodeURIComponent(rawEncoded);
    assert.ok(decoded.includes(testBill.bill_number), 'Must contain bill number');
    assert.ok(decoded.includes(testBill.vendor_name), 'Must contain vendor business name');
    assert.ok(decoded.includes(testBill.customer_name), 'Must contain customer name');
    assert.ok(decoded.includes('TAX INVOICE'), 'Must contain invoice title');
  });

  // ----------------------------------------------------------------------------
  // CASE 10: Bill Duplication (Fast Templating)
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 10: Duplicate bill creates fresh copy with unique bill number', async () => {
    const dupRes = await duplicateVendorBill(testBill.id, approvedVendorUser);
    assert.strictEqual(dupRes.success, true);
    assert.notStrictEqual(dupRes.bill.id, testBill.id, 'Duplicated bill must have new ID');
    assert.notStrictEqual(dupRes.bill.bill_number, testBill.bill_number, 'Duplicated bill must have new number');
    assert.ok(dupRes.bill.customer_name.includes('Copy'), 'Customer name must indicate copy');
    assert.strictEqual(dupRes.bill.advance_paid, 0.00, 'Duplicate bill starts with zero advance');
    assert.strictEqual(dupRes.bill.payment_status, 'unpaid', 'Duplicate bill starts as unpaid');
  });

  // ----------------------------------------------------------------------------
  // CASE 11: Professional Blue (#1976D2) + White + Golden (#D4AF37) A4 Invoice HTML
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 11: Professional Blue + White + Golden A4 Invoice HTML layout with signatures', async () => {
    const html = generateA4InvoiceHTML(testBill);
    assert.ok(html.length > 500, 'A4 HTML must be substantial');
    assert.ok(html.includes('#1976D2'), 'Must include Professional Blue (#1976D2)');
    assert.ok(html.includes('#D4AF37'), 'Must include Premium Golden (#D4AF37)');
    assert.ok(html.includes('#ffffff'), 'Must include Pure White (#ffffff)');
    assert.ok(html.includes('TAX INVOICE'), 'Must have TAX INVOICE title');
    assert.ok(html.includes('SHUBH CELEBRATIONS'), 'Must have Shubh Celebrations branding');
    assert.ok(html.includes(testBill.bill_number), 'Must contain unique bill number');
    assert.ok(html.includes(testBill.vendor_name), 'Must contain vendor name');
    assert.ok(html.includes(testBill.customer_name), 'Must contain customer name');
    assert.ok(html.includes('Client Signature'), 'Must contain Client Signature area');
    assert.ok(html.includes('Authorized Signatory'), 'Must contain Authorized Signatory area');
    assert.ok(html.includes('size: A4 portrait'), 'Must contain A4 portrait print rules');
  });

  // ----------------------------------------------------------------------------
  // CASE 12: Payment Receipt Generation (#RCP-), A4 Receipt Slip & WhatsApp Share
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 12: Payment Receipt Generation (#RCP-), A4 Receipt Slip & WhatsApp Share', async () => {
    // Create fresh bill with outstanding balance for receipt testing
    const freshBillRes = await createVendorBill(
      {
        customer_name: 'Anilbhai Shah',
        customer_phone: '9898012345',
        event_name: 'Reception & Music Night',
        event_date: '2026-12-25',
        items: [{ id: 1, description: 'Sound & Orchestra Setup', quantity: 1, rate: 25000 }],
        advance_paid: 5000,
      },
      approvedVendorUser
    );
    assert.strictEqual(freshBillRes.success, true);
    const receiptBill = freshBillRes.bill;

    // Record a partial payment of ₹5,000 on remaining balance
    const payRes = await recordBillPayment(
      receiptBill.id,
      { amount: 5000, method: 'UPI', reference: 'UPI/TEST/9988', notes: 'Advance receipt test' },
      approvedVendorUser
    );
    assert.strictEqual(payRes.success, true);
    assert.ok(payRes.receipt_number.startsWith('RCP-'), 'Must generate receipt number with RCP- prefix');

    // Test A4 Receipt HTML
    const receiptHtml = generateA4ReceiptHTML(payRes.bill, payRes.payment);
    assert.ok(receiptHtml.includes('#1976D2'), 'Receipt must use Professional Blue');
    assert.ok(receiptHtml.includes('#D4AF37'), 'Receipt must use Golden accent');
    assert.ok(receiptHtml.includes('OFFICIAL PAYMENT RECEIPT'), 'Receipt title must be present');
    assert.ok(receiptHtml.includes(payRes.receipt_number), 'Receipt number must be embedded');
    assert.ok(receiptHtml.includes('5,000'), 'Payment amount must be displayed');
    assert.ok(receiptHtml.includes('CLIENT ACKNOWLEDGMENT'), 'Must include Client signature area');
    assert.ok(receiptHtml.includes('AUTHORIZED SIGNATURE'), 'Must include Vendor signature area');

    // Test WhatsApp Receipt share text
    const waText = generateWhatsAppReceiptShareText(payRes.bill, payRes.payment);
    const decodedWa = decodeURIComponent(waText);
    assert.ok(decodedWa.includes('OFFICIAL PAYMENT RECEIPT'));
    assert.ok(decodedWa.includes(payRes.receipt_number));
    assert.ok(decodedWa.includes(payRes.bill.customer_name));
  });

  console.log('\n=================================================================');
  console.log(`  ALL ${totalTests} BILL BOOK TESTS PASSED SUCCESSFULLY! (100% GREEN)  `);
  console.log('=================================================================\n');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
