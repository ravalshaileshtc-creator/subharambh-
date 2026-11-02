// ==============================================================================
// SHUBH CELEBRATIONS – UNIVERSAL BILL BOOK SERVICE LAYER
// 
// Access & Authorization Rules:
// 1. Approved & Active Vendors: Full access to create, edit, view, print, record payments, and share bills.
// 2. Pending, Rejected, or Suspended Vendors: Strictly BLOCKED from creating or issuing bills.
// 3. Customers: View and download invoices issued to their verified phone/UUID only. Cannot create or edit bills.
// 4. Super Admin: Global platform view of all vendor bills and financial summaries.
// 5. State / City Managers: Scoped geographic access to bills within assigned territories.
// ==============================================================================

import { supabase } from './authService.js';
import { ROLES, VENDOR_STATUS } from './rbacService.js';

// ------------------------------------------------------------------------------
// INITIAL IN-MEMORY BILLS STORE (Seeded for Vallabh Decoration & Motibaug)
// ------------------------------------------------------------------------------
let localBills = [
  {
    id: 1001,
    bill_number: 'VD-2026-0001',
    vendor_id: 1,
    vendor_user_id: 'c0570000-0000-4000-8000-009825123401',
    vendor_name: 'Vallabh Decoration & Event Management',
    vendor_phone: '9825123401',
    vendor_location: 'Behind Deep Hospital, Bamroli Road, Godhra',
    customer_id: 'c0570000-0000-4000-8000-009825098765',
    customer_name: 'Rajeshbhai Patel',
    customer_phone: '9825098765',
    event_name: 'Royal Wedding & Reception Mandap',
    event_date: '2026-12-18',
    event_location: 'Motibaug Party Plot, Godhra',
    items: [
      { id: 1, description: 'Grand Rajwadi Entrance Gate (40ft Fiber & Floral Setup)', quantity: 1, rate: 35000, amount: 35000 },
      { id: 2, description: 'Royal Stage LED Backdrop & Couple Sofa Seating', quantity: 1, rate: 25000, amount: 25000 },
      { id: 3, description: 'Carved Wooden Chori Mandap with Holy Fire Setup', quantity: 1, rate: 20000, amount: 20000 },
      { id: 4, description: 'Ambient Halogen & Warm White LED Pathway Lighting', quantity: 1, rate: 10000, amount: 10000 },
    ],
    subtotal: 90000.00,
    discount: 5000.00,
    additional_charges: 2000.00, // Transport & setup labor
    tax_percent: 5.00, // 5% GST
    tax_amount: 4350.00, // (90000 - 5000 + 2000) * 0.05
    grand_total: 91350.00,
    advance_paid: 30000.00,
    total_paid: 60000.00,
    balance_due: 31350.00,
    payment_method: 'UPI',
    payment_status: 'partial', // 'paid' | 'partial' | 'unpaid' | 'cancelled'
    cancellation_reason: null,
    notes: 'Thank you for choosing Vallabh Decoration. Please clear remaining balance 24 hours prior to wedding setup.',
    terms: '1. 30% advance required for booking confirmation.\n2. In case of cancellation due to force majeure, 50% advance is refundable.\n3. Any physical damage to decorative structures during event will be billed separately.',
    payments: [
      {
        id: 'PAY-1001-1',
        date: '2026-10-15',
        amount: 30000.00,
        method: 'UPI',
        reference: 'UPI/629182910291/HDFC',
        notes: 'Initial booking token advance',
      },
      {
        id: 'PAY-1001-2',
        date: '2026-10-28',
        amount: 30000.00,
        method: 'Bank Transfer',
        reference: 'NEFT/SBIN0029182',
        notes: 'Second stage advance',
      },
    ],
    created_at: '2026-10-15T10:30:00.000Z',
    updated_at: '2026-10-28T16:00:00.000Z',
  },
  {
    id: 1002,
    bill_number: 'VD-2026-0002',
    vendor_id: 1,
    vendor_user_id: 'c0570000-0000-4000-8000-009825123401',
    vendor_name: 'Vallabh Decoration & Event Management',
    vendor_phone: '9825123401',
    vendor_location: 'Behind Deep Hospital, Bamroli Road, Godhra',
    customer_id: null,
    customer_name: 'Dipakbhai Shah',
    customer_phone: '9876543210',
    event_name: 'Haldi & Sangeet Floral Decor',
    event_date: '2026-11-25',
    event_location: 'Vavdi Buzarg, Godhra',
    items: [
      { id: 1, description: 'Yellow Marigold Floral Canopy & Brass Urli Setup', quantity: 1, rate: 22000, amount: 22000 },
      { id: 2, description: 'Sangeet Stage Draping with Fairylight Mesh', quantity: 1, rate: 18000, amount: 18000 },
    ],
    subtotal: 40000.00,
    discount: 2000.00,
    additional_charges: 0.00,
    tax_percent: 0.00,
    tax_amount: 0.00,
    grand_total: 38000.00,
    advance_paid: 38000.00,
    total_paid: 38000.00,
    balance_due: 0.00,
    payment_method: 'Cash',
    payment_status: 'paid',
    cancellation_reason: null,
    notes: 'Full payment received in cash on booking. Complete receipt issued.',
    terms: '1. Standard cancellation policies apply.',
    payments: [
      {
        id: 'PAY-1002-1',
        date: '2026-10-20',
        amount: 38000.00,
        method: 'Cash',
        reference: 'CASH-REC-0092',
        notes: 'Full payment on contract signing',
      },
    ],
    created_at: '2026-10-20T11:00:00.000Z',
    updated_at: '2026-10-20T11:00:00.000Z',
  },
  {
    id: 1003,
    bill_number: 'MPP-2026-0001',
    vendor_id: 5,
    vendor_user_id: 'c0570000-0000-4000-8000-009825123405',
    vendor_name: 'Motibaug Party Plot',
    vendor_phone: '9825123405',
    vendor_location: 'Near Moti Baug, Godhra',
    customer_id: 'c0570000-0000-4000-8000-009825098765',
    customer_name: 'Rajeshbhai Patel',
    customer_phone: '9825098765',
    event_name: 'Lawn Venue Booking (1 Day Full)',
    event_date: '2026-12-18',
    event_location: 'Motibaug Party Plot Main Lawn, Godhra',
    items: [
      { id: 1, description: 'Main Lawn Rental (Capacity 1500 Pax, 24 Hours)', quantity: 1, rate: 65000, amount: 65000 },
      { id: 2, description: 'VIP Air-Conditioned Bride & Groom Green Rooms (2 Suites)', quantity: 2, rate: 5000, amount: 10000 },
      { id: 3, description: 'Heavy Generator Power Backup (125 kVA with Diesel)', quantity: 1, rate: 8000, amount: 8000 },
    ],
    subtotal: 83000.00,
    discount: 3000.00,
    additional_charges: 1500.00, // Sanitation & cleaning charge
    tax_percent: 5.00,
    tax_amount: 4075.00,
    grand_total: 85575.00,
    advance_paid: 25000.00,
    total_paid: 25000.00,
    balance_due: 60575.00,
    payment_method: 'Cheque',
    payment_status: 'partial',
    cancellation_reason: null,
    notes: 'Balance payable 3 days before the wedding date.',
    terms: '1. No loud music after 10:00 PM as per local guidelines.\n2. Outside catering allowed with prior permit.',
    payments: [
      {
        id: 'PAY-1003-1',
        date: '2026-10-18',
        amount: 25000.00,
        method: 'Cheque',
        reference: 'CHQ-819201-BOB',
        notes: 'Lawn booking deposit cheque cleared',
      },
    ],
    created_at: '2026-10-18T14:15:00.000Z',
    updated_at: '2026-10-18T14:15:00.000Z',
  },
];

let nextBillCounter = 1004;

// ------------------------------------------------------------------------------
// 1. AUTHORIZATION GATEKEEPERS
// ------------------------------------------------------------------------------

/**
 * Strictly verifies whether a user is an approved and active vendor
 * Permitted: role === 'vendor' AND vendor_status === 'approved' AND is_approved === true
 * Blocked: customers, pending vendors, rejected vendors, suspended vendors
 */
export function canVendorManageBills(user) {
  if (!user) {
    return {
      allowed: false,
      status: 401,
      error: 'unauthenticated',
      message: 'Please log in to access the Bill Book.',
    };
  }

  // Super Admin override for administrative debugging/maintenance
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) {
    return { allowed: true, isAdmin: true };
  }

  // Must have role === 'vendor'
  if (user.role !== ROLES.VENDOR) {
    return {
      allowed: false,
      status: 403,
      error: 'customer_cannot_create_bills',
      message: 'Access Denied: Only approved vendors can create or issue bills. Customers can view invoices issued to them.',
    };
  }

  // Check vendor status (MUST be approved and active)
  const isApproved =
    (user.vendor_status === 'approved' || user.vendor_status === VENDOR_STATUS.APPROVED) &&
    user.is_approved !== false &&
    user.account_status !== 'suspended' &&
    user.account_status !== 'rejected' &&
    user.listing_status !== 'pending' &&
    user.listing_status !== 'rejected' &&
    user.listing_status !== 'suspended';

  if (!isApproved) {
    return {
      allowed: false,
      status: 403,
      error: 'vendor_not_approved_for_billing',
      message: 'Access Restricted: Your vendor listing is currently pending admin approval or suspended. Only approved and active vendors can create digital bills.',
    };
  }

  return { allowed: true, isVendor: true };
}

// ------------------------------------------------------------------------------
// 2. MATHEMATICAL CALCULATION ENGINE (ACCURATE DECIMALS)
// ------------------------------------------------------------------------------

export function calculateBillTotals({
  items = [],
  discount = 0,
  additionalCharges = 0,
  taxPercent = 0,
  advancePaid = 0,
  existingPayments = [],
}) {
  const safeItems = Array.isArray(items) ? items : [];
  
  // 1. Subtotal = Sum of (Qty * Rate)
  let subtotal = 0;
  const computedItems = safeItems.map((item, index) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const rate = Math.max(0, Number(item.rate) || 0);
    const amount = Number((qty * rate).toFixed(2));
    subtotal += amount;
    return {
      id: item.id || index + 1,
      description: String(item.description || '').trim() || `Service Item #${index + 1}`,
      quantity: qty,
      rate,
      amount,
    };
  });

  subtotal = Number(subtotal.toFixed(2));
  const safeDiscount = Math.max(0, Number(discount) || 0);
  const safeAdditional = Math.max(0, Number(additionalCharges) || 0);
  const safeTaxPercent = Math.max(0, Number(taxPercent) || 0);

  // Taxable Base = (Subtotal - Discount + Additional Charges)
  const taxableBase = Math.max(0, subtotal - safeDiscount + safeAdditional);
  const taxAmount = Number(((taxableBase * safeTaxPercent) / 100).toFixed(2));
  const grandTotal = Number((taxableBase + taxAmount).toFixed(2));

  // Payments & Balance
  const safeAdvance = Math.max(0, Number(advancePaid) || 0);
  let totalPaymentsRecorded = 0;
  if (Array.isArray(existingPayments)) {
    existingPayments.forEach((p) => {
      totalPaymentsRecorded += Math.max(0, Number(p.amount) || 0);
    });
  }

  const totalPaid = Number((safeAdvance + totalPaymentsRecorded).toFixed(2));
  const balanceDue = Number(Math.max(0, grandTotal - totalPaid).toFixed(2));

  let paymentStatus = 'unpaid';
  if (grandTotal > 0 && balanceDue <= 0) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  }

  return {
    items: computedItems,
    subtotal,
    discount: safeDiscount,
    additional_charges: safeAdditional,
    tax_percent: safeTaxPercent,
    tax_amount: taxAmount,
    grand_total: grandTotal,
    advance_paid: safeAdvance,
    total_paid: totalPaid,
    balance_due: balanceDue,
    payment_status: paymentStatus,
  };
}

// ------------------------------------------------------------------------------
// 3. CREATE NEW BILL (APPROVED VENDORS ONLY)
// ------------------------------------------------------------------------------

export async function createVendorBill(payload, vendorUser) {
  // 1. Authorization check
  const authCheck = canVendorManageBills(vendorUser);
  if (!authCheck.allowed) {
    return {
      success: false,
      status: authCheck.status || 403,
      error: authCheck.error,
      message: authCheck.message,
    };
  }

  // 2. Validate mandatory fields
  const customerName = String(payload.customer_name || '').trim();
  const customerPhone = String(payload.customer_phone || '').replace(/\D/g, '').slice(-10);
  const eventName = String(payload.event_name || '').trim();
  const eventDate = String(payload.event_date || '').trim();

  if (!customerName || customerName.length < 2) {
    return { success: false, error: 'invalid_customer_name', message: 'Customer full name is required.' };
  }
  if (!customerPhone || customerPhone.length !== 10 || !/^[6-9]\d{9}$/.test(customerPhone)) {
    return { success: false, error: 'invalid_customer_phone', message: 'Valid 10-digit customer mobile number is required.' };
  }
  if (!eventName) {
    return { success: false, error: 'invalid_event_name', message: 'Event or ceremony name is required.' };
  }
  if (!eventDate) {
    return { success: false, error: 'invalid_event_date', message: 'Event date is required.' };
  }
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    return { success: false, error: 'empty_items', message: 'Please add at least one line item to the bill.' };
  }

  // 3. Mathematical Calculations
  const totals = calculateBillTotals({
    items: payload.items,
    discount: payload.discount,
    additionalCharges: payload.additional_charges,
    taxPercent: payload.tax_percent,
    advancePaid: payload.advance_paid,
    existingPayments: [],
  });

  // 4. Generate Unique Bill Number (Prefix + Year + Counter)
  const currentYear = new Date().getFullYear();
  const vendorInitials = (vendorUser.business_name || vendorUser.full_name || 'BILL')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 3)
    .join('')
    .toUpperCase();
  const billNumber = `${vendorInitials}-${currentYear}-${String(nextBillCounter).slice(-4)}`;
  const newBillId = nextBillCounter++;

  // payments array records subsequent installment payments (advance is tracked in advance_paid)
  const initialPayments = [];

  const newBill = {
    id: newBillId,
    bill_number: billNumber,
    vendor_id: vendorUser.vendor_id || vendorUser.id || 1,
    vendor_user_id: vendorUser.id || 'vendor-auth-uuid',
    vendor_name: vendorUser.business_name || vendorUser.full_name || 'Verified Wedding Vendor',
    vendor_phone: vendorUser.phone || '',
    vendor_location: vendorUser.location || vendorUser.city || 'Godhra, Panchmahal',
    customer_id: payload.customer_id || null,
    customer_name: customerName,
    customer_phone: customerPhone,
    event_name: eventName,
    event_date: eventDate,
    event_location: payload.event_location ? String(payload.event_location).trim() : 'Godhra, Panchmahal',
    items: totals.items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    additional_charges: totals.additional_charges,
    tax_percent: totals.tax_percent,
    tax_amount: totals.tax_amount,
    grand_total: totals.grand_total,
    advance_paid: totals.advance_paid,
    total_paid: totals.total_paid,
    balance_due: totals.balance_due,
    payment_method: payload.payment_method || 'UPI',
    payment_status: totals.payment_status,
    cancellation_reason: null,
    notes: payload.notes || 'Thank you for your business. We look forward to making your celebration special!',
    terms: payload.terms || '1. Advance payment confirms booking.\n2. Balance must be cleared before setup.\n3. Government taxes applicable.',
    payments: initialPayments,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localBills.unshift(newBill);

  // Sync to Supabase if available
  if (supabase) {
    try {
      const { data: insData, error: insErr } = await supabase.from('bills').insert([{
        bill_number: newBill.bill_number,
        vendor_id: newBill.vendor_id,
        vendor_user_id: newBill.vendor_user_id,
        vendor_name: newBill.vendor_name,
        vendor_phone: newBill.vendor_phone,
        vendor_location: newBill.vendor_location,
        customer_name: newBill.customer_name,
        customer_phone: newBill.customer_phone,
        customer_id: newBill.customer_id,
        event_name: newBill.event_name,
        event_date: newBill.event_date,
        event_location: newBill.event_location,
        items: newBill.items,
        subtotal: newBill.subtotal,
        discount: newBill.discount,
        additional_charges: newBill.additional_charges,
        tax_percent: newBill.tax_percent,
        tax_amount: newBill.tax_amount,
        grand_total: newBill.grand_total,
        advance_paid: newBill.advance_paid,
        total_paid: newBill.total_paid,
        balance_due: newBill.balance_due,
        payment_method: newBill.payment_method,
        payment_status: newBill.payment_status,
        notes: newBill.notes,
        terms: newBill.terms,
        payments: newBill.payments,
      }]).select().maybeSingle();

      if (!insErr && insData) {
        newBill.id = insData.id || newBill.id;
      }
    } catch (e) {
      // Offline fallback
    }
  }

  return {
    success: true,
    bill: newBill,
    message: `Bill ${newBill.bill_number} created successfully for ${newBill.customer_name}!`,
  };
}

// ------------------------------------------------------------------------------
// 4. EDIT EXISTING BILL (VENDOR ONLY, BEFORE CANCELLATION)
// ------------------------------------------------------------------------------

export async function updateVendorBill(billId, updatePayload, vendorUser) {
  const authCheck = canVendorManageBills(vendorUser);
  if (!authCheck.allowed) {
    return { success: false, status: 403, error: 'permission_denied', message: authCheck.message };
  }

  const bill = localBills.find((b) => String(b.id) === String(billId) || b.bill_number === String(billId));
  if (!bill) {
    return { success: false, error: 'not_found', message: 'Bill not found.' };
  }

  // Security: Vendor can only edit their own bills
  const isOwner =
    authCheck.isAdmin ||
    String(bill.vendor_id) === String(vendorUser.vendor_id || vendorUser.id) ||
    bill.vendor_user_id === vendorUser.id ||
    bill.vendor_phone === vendorUser.phone;

  if (!isOwner) {
    return {
      success: false,
      status: 403,
      error: 'unauthorized_vendor',
      message: '403 Forbidden: You can only edit your own business bills.',
    };
  }

  if (bill.payment_status === 'cancelled') {
    return {
      success: false,
      error: 'cannot_edit_cancelled_bill',
      message: 'This bill has been cancelled and cannot be edited.',
    };
  }

  // Recalculate if items or amounts changed
  const newItems = updatePayload.items || bill.items;
  const newDiscount = updatePayload.discount !== undefined ? updatePayload.discount : bill.discount;
  const newAdditional = updatePayload.additional_charges !== undefined ? updatePayload.additional_charges : bill.additional_charges;
  const newTaxPercent = updatePayload.tax_percent !== undefined ? updatePayload.tax_percent : bill.tax_percent;
  const newAdvance = updatePayload.advance_paid !== undefined ? updatePayload.advance_paid : bill.advance_paid;

  const totals = calculateBillTotals({
    items: newItems,
    discount: newDiscount,
    additionalCharges: newAdditional,
    taxPercent: newTaxPercent,
    advancePaid: newAdvance,
    existingPayments: bill.payments,
  });

  bill.customer_name = updatePayload.customer_name || bill.customer_name;
  bill.customer_phone = updatePayload.customer_phone ? String(updatePayload.customer_phone).replace(/\D/g, '').slice(-10) : bill.customer_phone;
  bill.event_name = updatePayload.event_name || bill.event_name;
  bill.event_date = updatePayload.event_date || bill.event_date;
  bill.event_location = updatePayload.event_location || bill.event_location;
  bill.items = totals.items;
  bill.subtotal = totals.subtotal;
  bill.discount = totals.discount;
  bill.additional_charges = totals.additional_charges;
  bill.tax_percent = totals.tax_percent;
  bill.tax_amount = totals.tax_amount;
  bill.grand_total = totals.grand_total;
  bill.advance_paid = totals.advance_paid;
  bill.total_paid = totals.total_paid;
  bill.balance_due = totals.balance_due;
  bill.payment_status = totals.payment_status;
  bill.payment_method = updatePayload.payment_method || bill.payment_method;
  bill.notes = updatePayload.notes !== undefined ? updatePayload.notes : bill.notes;
  bill.terms = updatePayload.terms !== undefined ? updatePayload.terms : bill.terms;
  bill.updated_at = new Date().toISOString();

  return {
    success: true,
    bill,
    message: `Bill ${bill.bill_number} updated successfully.`,
  };
}

// ------------------------------------------------------------------------------
// 5. RECORD ADVANCE OR PARTIAL PAYMENT & RECEIPT GENERATION
// ------------------------------------------------------------------------------

export async function recordBillPayment(billId, paymentPayload, vendorUser) {
  const authCheck = canVendorManageBills(vendorUser);
  if (!authCheck.allowed) {
    return { success: false, status: 403, error: 'permission_denied', message: authCheck.message };
  }

  const bill = localBills.find((b) => String(b.id) === String(billId) || b.bill_number === String(billId));
  if (!bill) {
    return { success: false, error: 'not_found', message: 'Bill not found.' };
  }

  const isOwner =
    authCheck.isAdmin ||
    String(bill.vendor_id) === String(vendorUser.vendor_id || vendorUser.id) ||
    bill.vendor_user_id === vendorUser.id ||
    bill.vendor_phone === vendorUser.phone;

  if (!isOwner) {
    return {
      success: false,
      status: 403,
      error: 'unauthorized_vendor',
      message: '403 Forbidden: You can only record payments for your own business bills.',
    };
  }

  if (bill.payment_status === 'cancelled') {
    return {
      success: false,
      error: 'bill_cancelled',
      message: 'Cannot record payments on a cancelled bill.',
    };
  }

  const payAmount = Number(paymentPayload.amount) || 0;
  if (payAmount <= 0) {
    return { success: false, error: 'invalid_amount', message: 'Please enter a valid payment amount greater than ₹0.' };
  }

  if (payAmount > bill.balance_due) {
    return {
      success: false,
      error: 'amount_exceeds_balance',
      message: `Payment amount (₹${payAmount}) cannot exceed outstanding balance (₹${bill.balance_due}).`,
    };
  }

  const receiptId = `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const paymentRecord = {
    id: receiptId,
    date: paymentPayload.date || new Date().toISOString().split('T')[0],
    amount: Number(payAmount.toFixed(2)),
    method: paymentPayload.method || 'Cash',
    reference: paymentPayload.reference || 'Manual Payment Entry',
    notes: paymentPayload.notes || '',
    recorded_at: new Date().toISOString(),
  };

  bill.payments = Array.isArray(bill.payments) ? bill.payments : [];
  bill.payments.push(paymentRecord);

  // Recalculate totals
  const totalPaid = Number((bill.advance_paid + bill.payments.reduce((s, p) => s + p.amount, 0)).toFixed(2));
  bill.total_paid = totalPaid;
  bill.balance_due = Number(Math.max(0, bill.grand_total - totalPaid).toFixed(2));
  bill.payment_status = bill.balance_due <= 0 ? 'paid' : 'partial';
  bill.updated_at = new Date().toISOString();

  return {
    success: true,
    bill,
    payment: paymentRecord,
    receipt_number: receiptId,
    message: `Payment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully. Receipt #${receiptId} generated!`,
  };
}

// ------------------------------------------------------------------------------
// 6. CANCEL BILL WITH RECORDED REASON
// ------------------------------------------------------------------------------

export async function cancelVendorBill(billId, reason, vendorUser) {
  const authCheck = canVendorManageBills(vendorUser);
  if (!authCheck.allowed) {
    return { success: false, status: 403, error: 'permission_denied', message: authCheck.message };
  }

  const bill = localBills.find((b) => String(b.id) === String(billId) || b.bill_number === String(billId));
  if (!bill) {
    return { success: false, error: 'not_found', message: 'Bill not found.' };
  }

  const isOwner =
    authCheck.isAdmin ||
    String(bill.vendor_id) === String(vendorUser.vendor_id || vendorUser.id) ||
    bill.vendor_user_id === vendorUser.id ||
    bill.vendor_phone === vendorUser.phone;

  if (!isOwner) {
    return {
      success: false,
      status: 403,
      error: 'unauthorized_vendor',
      message: '403 Forbidden: You can only cancel your own business bills.',
    };
  }

  const cleanReason = String(reason || '').trim() || 'Event cancelled by mutual customer consent.';
  bill.payment_status = 'cancelled';
  bill.cancellation_reason = cleanReason;
  bill.balance_due = 0.00;
  bill.updated_at = new Date().toISOString();

  return {
    success: true,
    bill,
    message: `Bill ${bill.bill_number} has been cancelled.`,
  };
}

// ------------------------------------------------------------------------------
// 7. DUPLICATE BILL (FAST TEMPLATING)
// ------------------------------------------------------------------------------

export async function duplicateVendorBill(billId, vendorUser) {
  const authCheck = canVendorManageBills(vendorUser);
  if (!authCheck.allowed) {
    return { success: false, status: 403, error: 'permission_denied', message: authCheck.message };
  }

  const sourceBill = localBills.find((b) => String(b.id) === String(billId) || b.bill_number === String(billId));
  if (!sourceBill) {
    return { success: false, error: 'not_found', message: 'Source bill not found.' };
  }

  const isOwner =
    authCheck.isAdmin ||
    String(sourceBill.vendor_id) === String(vendorUser.vendor_id || vendorUser.id) ||
    sourceBill.vendor_user_id === vendorUser.id ||
    sourceBill.vendor_phone === vendorUser.phone;

  if (!isOwner) {
    return { success: false, status: 403, error: 'unauthorized_vendor', message: 'Access denied.' };
  }

  const duplicatePayload = {
    customer_name: `${sourceBill.customer_name} (Copy)`,
    customer_phone: sourceBill.customer_phone,
    event_name: sourceBill.event_name,
    event_date: new Date().toISOString().split('T')[0],
    event_location: sourceBill.event_location,
    items: sourceBill.items.map((it) => ({ ...it })),
    discount: sourceBill.discount,
    additional_charges: sourceBill.additional_charges,
    tax_percent: sourceBill.tax_percent,
    advance_paid: 0.00,
    payment_method: sourceBill.payment_method,
    notes: sourceBill.notes,
    terms: sourceBill.terms,
  };

  return createVendorBill(duplicatePayload, vendorUser);
}

// ------------------------------------------------------------------------------
// 8. VENDOR BILLS QUERY (STRICT VENDOR ISOLATION)
// ------------------------------------------------------------------------------

export function getVendorBills(vendorUser, filters = {}) {
  const authCheck = canVendorManageBills(vendorUser);
  if (!authCheck.allowed && !authCheck.isAdmin) {
    return [];
  }

  const vendorIdStr = String(vendorUser.vendor_id || vendorUser.id || '');
  const vendorUserId = String(vendorUser.id || '');
  const vendorPhone = String(vendorUser.phone || '').slice(-10);

  // Vendor sees ONLY their own bills!
  const filtered = localBills.filter((bill) => {
    const isMine =
      authCheck.isAdmin ||
      String(bill.vendor_id) === vendorIdStr ||
      bill.vendor_user_id === vendorUserId ||
      bill.vendor_phone === vendorPhone;

    if (!isMine) return false;

    // Optional status filter
    if (filters.status && filters.status !== 'all') {
      if (bill.payment_status !== filters.status) return false;
    }

    // Optional search filter
    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      const matchNum = (bill.bill_number || '').toLowerCase().includes(q);
      const matchCust = (bill.customer_name || '').toLowerCase().includes(q);
      const matchPhone = (bill.customer_phone || '').includes(q);
      const matchEvent = (bill.event_name || '').toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchPhone && !matchEvent) return false;
    }

    return true;
  });

  return filtered;
}

// ------------------------------------------------------------------------------
// 9. CUSTOMER INVOICES QUERY (STRICT CUSTOMER ISOLATION)
// ------------------------------------------------------------------------------

export function getCustomerBills(customerUser, filters = {}) {
  if (!customerUser) return [];

  const cleanPhone = String(customerUser.phone || '').replace(/\D/g, '').slice(-10);
  const custId = String(customerUser.id || '');

  // Customer sees ONLY bills issued to their phone or user ID!
  const filtered = localBills.filter((bill) => {
    const isTargetCustomer =
      (cleanPhone && bill.customer_phone === cleanPhone) ||
      (custId && bill.customer_id === custId);

    if (!isTargetCustomer) return false;

    if (filters.status && filters.status !== 'all') {
      if (bill.payment_status !== filters.status) return false;
    }

    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      const matchNum = (bill.bill_number || '').toLowerCase().includes(q);
      const matchVendor = (bill.vendor_name || '').toLowerCase().includes(q);
      const matchEvent = (bill.event_name || '').toLowerCase().includes(q);
      if (!matchNum && !matchVendor && !matchEvent) return false;
    }

    return true;
  });

  return filtered;
}

// ------------------------------------------------------------------------------
// 10. ADMIN & REGIONAL MANAGERS BILL QUERY
// ------------------------------------------------------------------------------

export function getAllPlatformBills(adminUser, filters = {}) {
  if (!adminUser) return [];

  // Super Admin: Full platform view
  // Managers: Filtered by territory
  const isSuper = adminUser.role === ROLES.SUPER_ADMIN || adminUser.role === ROLES.ADMIN;
  const isStateMgr = adminUser.role === ROLES.STATE_MANAGER;
  const isCityMgr = adminUser.role === ROLES.CITY_MANAGER;

  if (!isSuper && !isStateMgr && !isCityMgr) return [];

  return localBills.filter((bill) => {
    // Geographic scope for state/city manager
    if (isStateMgr && adminUser.state_id) {
      // Scoped state check
      if (bill.vendor_state_id && bill.vendor_state_id !== adminUser.state_id) return false;
    }
    if (isCityMgr && adminUser.city) {
      // Scoped city check
      if (bill.vendor_location && !bill.vendor_location.toLowerCase().includes(adminUser.city.toLowerCase())) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (bill.payment_status !== filters.status) return false;
    }

    // Vendor filter
    if (filters.vendor_id && filters.vendor_id !== 'all') {
      if (String(bill.vendor_id) !== String(filters.vendor_id)) return false;
    }

    // Search filter
    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      const matchNum = (bill.bill_number || '').toLowerCase().includes(q);
      const matchCust = (bill.customer_name || '').toLowerCase().includes(q);
      const matchVendor = (bill.vendor_name || '').toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchVendor) return false;
    }

    return true;
  });
}

// ------------------------------------------------------------------------------
// 11. FINANCIAL SUMMARY AGGREGATOR
// ------------------------------------------------------------------------------

export function getBillsFinancialSummary(billsList = []) {
  let totalInvoiced = 0;
  let totalReceived = 0;
  let totalOutstanding = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;
  let cancelledCount = 0;

  billsList.forEach((bill) => {
    if (bill.payment_status === 'cancelled') {
      cancelledCount++;
      return;
    }
    totalInvoiced += bill.grand_total || 0;
    totalReceived += bill.total_paid || 0;
    totalOutstanding += bill.balance_due || 0;

    if (bill.payment_status === 'paid') paidCount++;
    else if (bill.payment_status === 'partial') partialCount++;
    else unpaidCount++;
  });

  return {
    totalInvoiced: Number(totalInvoiced.toFixed(2)),
    totalReceived: Number(totalReceived.toFixed(2)),
    totalOutstanding: Number(totalOutstanding.toFixed(2)),
    totalBills: billsList.length,
    paidCount,
    partialCount,
    unpaidCount,
    cancelledCount,
  };
}

// ------------------------------------------------------------------------------
// 12. WHATSAPP SHARE MESSAGE GENERATORS
// ------------------------------------------------------------------------------

// ------------------------------------------------------------------------------
// MULTILINGUAL INVOICE DICTIONARIES (English, Gujarati, Hindi)
// Strict isolation: Each invoice uses only its selected language
// ------------------------------------------------------------------------------
export const INVOICE_I18N = {
  en: {
    locale: 'en',
    brandName: '✨ SHUBH CELEBRATIONS',
    brandSubtitle: 'All India Event Marketplace & Digital Invoicing',
    vendorBadge: 'Verified Wedding & Event Vendor',
    taxInvoice: 'TAX INVOICE',
    billNo: 'Bill No',
    billDate: 'Bill Date',
    eventDate: 'Event Date',
    statusPaid: 'PAID',
    statusPartial: 'PARTIALLY PAID',
    statusUnpaid: 'UNPAID',
    statusCancelled: 'CANCELLED',
    billedTo: 'Billed To (Client)',
    phone: 'Phone',
    eventParticulars: 'Event Particulars',
    venue: 'Venue',
    srNo: '#',
    description: 'Service / Product Description',
    quantity: 'Qty',
    rate: 'Rate (₹)',
    amount: 'Amount (₹)',
    termsTitle: 'Terms & Conditions',
    defaultTerms: '1. Advance payment confirms booking.\n2. Balance must be cleared before event setup.\n3. Extra hours or damages will be charged as per actuals.',
    notesTitle: 'Vendor Notes',
    subtotal: 'Subtotal',
    discount: 'Discount',
    additionalCharges: 'Additional Charges',
    gst: 'GST',
    grandTotal: 'Grand Total',
    advancePaid: 'Advance Paid',
    totalPaid: 'Total Paid',
    remainingBalance: 'Remaining Balance',
    paymentHistoryTitle: 'Payment History & Receipts Issued',
    clientSignature: 'Client Signature',
    clientSignSub: 'Received in good order & accepted',
    vendorSignature: 'Authorized Signatory',
    vendorSignSub: 'Authorized Seal & Signature',
    footerText: 'Digitally Issued & Verified via Shubh Celebrations • All India Event Marketplace • Thank you for your business!',
  },
  gu: {
    locale: 'gu',
    brandName: '✨ શુભ સેલિબ્રેશન્સ',
    brandSubtitle: 'ઓલ ઇન્ડિયા ઇવેન્ટ માર્કેટપ્લેસ અને ડિજિટલ બિલિંગ',
    vendorBadge: 'પ્રમાણિત વેડિંગ અને ઇવેન્ટ વેન્ડર',
    taxInvoice: 'ટેક્સ ઇન્વોઇસ / બિલ',
    billNo: 'બિલ નંબર',
    billDate: 'બિલ તારીખ',
    eventDate: 'ઇવેન્ટ તારીખ',
    statusPaid: 'સંપૂર્ણ ચૂકવેલ',
    statusPartial: 'અંશતઃ ચૂકવેલ',
    statusUnpaid: 'બાકી ચૂકવણી',
    statusCancelled: 'રદ કરેલ',
    billedTo: 'ગ્રાહકની વિગત (ક્લાયન્ટ)',
    phone: 'મોબાઇલ',
    eventParticulars: 'પ્રસંગ / ઇવેન્ટ વિગત',
    venue: 'સ્થળ',
    srNo: 'ક્રમ',
    description: 'સેવા / સામગ્રીની વિગત',
    quantity: 'જથ્થો',
    rate: 'દર (₹)',
    amount: 'રકમ (₹)',
    termsTitle: 'નિયમો અને શરતો',
    defaultTerms: '૧. એડવાન્સ રકમ ચૂકવ્યા બાદ જ બુકિંગ કન્ફર્મ ગણાશે.\n૨. ઇવેન્ટ શરૂ થવાના ૨૪ કલાક પહેલાં બાકી રકમ ચૂકવવાની રહેશે.\n૩. કોઈપણ વધારાની સેવા માટે અલગથી ચાર્જ લેવામાં આવશે.',
    notesTitle: 'વેન્ડર નોંધ',
    subtotal: 'કુલ રકમ (સબટોટલ)',
    discount: 'ડિસ્કાઉન્ટ / છૂટ',
    additionalCharges: 'વધારાનો ચાર્જ',
    gst: 'જી.એસ.ટી (GST)',
    grandTotal: 'ચુકવવાપાત્ર કુલ રકમ',
    advancePaid: 'ચૂકવેલ એડવાન્સ',
    totalPaid: 'કુલ ચૂકવેલ રકમ',
    remainingBalance: 'બાકી ચૂકવવાપાત્ર રકમ',
    paymentHistoryTitle: 'ચૂકવણી ઇતિહાસ અને પાવતી',
    clientSignature: 'ગ્રાહકની સહી',
    clientSignSub: 'શરતો વાંચીને સ્વીકારેલ છે',
    vendorSignature: 'અધિકૃત વેન્ડર સહી',
    vendorSignSub: 'શુભ સેલિબ્રેશન્સ પ્રમાણિત વેન્ડર',
    footerText: 'શુભ સેલિબ્રેશન્સ દ્વારા ડિજિટલી પ્રમાણિત ઇન્વોઇસ • પસંદ કરવા બદલ આપનો ખૂબ ખૂબ આભાર!',
  },
  hi: {
    locale: 'hi',
    brandName: '✨ शुभ सेलिब्रेशन्स',
    brandSubtitle: 'अखिल भारतीय इवेंट मार्केटप्लेस और डिजिटल बिलिंग',
    vendorBadge: 'सत्यापित वेडिंग एवं इवेंट वेंडर',
    taxInvoice: 'टैक्स इनवॉइस / बिल',
    billNo: 'बिल संख्या',
    billDate: 'बिल दिनांक',
    eventDate: 'आयोजन दिनांक',
    statusPaid: 'पूर्ण भुगतान',
    statusPartial: 'आंशिक भुगतान',
    statusUnpaid: 'भुगतान शेष',
    statusCancelled: 'रद्द',
    billedTo: 'बिल विवरण (ग्राहक)',
    phone: 'मोबाइल',
    eventParticulars: 'आयोजन / समारोह विवरण',
    venue: 'स्थान / वेन्यू',
    srNo: 'क्र.',
    description: 'सेवा / सामग्री का विवरण',
    quantity: 'मात्रा',
    rate: 'दर (₹)',
    amount: 'राशि (₹)',
    termsTitle: 'नियम एवं शर्तें',
    defaultTerms: '1. अग्रिम (Advance) भुगतान के पश्चात ही बुकिंग सुनिश्चित मानी जाएगी।\n2. शेष राशि का भुगतान आयोजन से 24 घंटे पूर्व अनिवार्य है।\n3. किसी भी अतिरिक्त सेवा या सामग्री का शुल्क पृथक देय होगा।',
    notesTitle: 'वेंडर की टिप्पणी',
    subtotal: 'उप-योग (Subtotal)',
    discount: 'छूट (Discount)',
    additionalCharges: 'अतिरिक्त शुल्क',
    gst: 'जीएसटी (GST)',
    grandTotal: 'कुल देय राशि',
    advancePaid: 'अग्रिम भुगतान',
    totalPaid: 'कुल प्राप्त भुगतान',
    remainingBalance: 'बकाया राशि',
    paymentHistoryTitle: 'भुगतान इतिहास एवं रसीद विवरण',
    clientSignature: 'ग्राहक के हस्ताक्षर',
    clientSignSub: 'नियम व शर्तें स्वीकार की गईं',
    vendorSignature: 'वेंडर के अधिकृत हस्ताक्षर',
    vendorSignSub: 'शुभ सेलिब्रेशन्स सत्यापित वेंडर',
    footerText: 'शुभ सेलिब्रेशन्स द्वारा डिजिटल रूप से प्रमाणित • हमें चुनने के लिए आपका बहुत-बहुत धन्यवाद!',
  },
};

export function generateWhatsAppInvoiceShareText(bill, lang = 'en') {
  if (!bill) return '';
  const labels = INVOICE_I18N[lang] || INVOICE_I18N.en;

  const statusMap = {
    paid: `✅ ${labels.statusPaid}`,
    partial: `⏳ ${labels.statusPartial}`,
    unpaid: `⚠️ ${labels.statusUnpaid}`,
    cancelled: `❌ ${labels.statusCancelled}`,
  };
  const statusEmoji = statusMap[bill.payment_status] || labels.statusUnpaid;

  let itemsText = (bill.items || [])
    .map((it, idx) => `  ${idx + 1}. ${it.description} (${it.quantity}x @ ₹${Number(it.rate).toLocaleString('en-IN')}) = ₹${Number(it.amount).toLocaleString('en-IN')}`)
    .join('\n');

  return encodeURIComponent(
    `🧾 *${labels.taxInvoice.toUpperCase()}*\n` +
    `-----------------------------------------\n` +
    `🏢 *${labels.vendorBadge}:* ${bill.vendor_name}\n` +
    `📞 *${labels.phone}:* +91 ${bill.vendor_phone}\n` +
    `📍 *${labels.venue}:* ${bill.vendor_location}\n` +
    `-----------------------------------------\n` +
    `📋 *${labels.billNo}:* ${bill.bill_number}\n` +
    `📅 *${labels.eventDate}:* ${bill.event_date}\n` +
    `🎪 *${labels.eventParticulars}:* ${bill.event_name}\n` +
    `👤 *${labels.billedTo}:* ${bill.customer_name} (+91 ${bill.customer_phone})\n` +
    `📍 *${labels.venue}:* ${bill.event_location}\n` +
    `-----------------------------------------\n` +
    `*${labels.description.toUpperCase()}:*\n${itemsText}\n` +
    `-----------------------------------------\n` +
    `💰 *${labels.subtotal}:* ₹${Number(bill.subtotal).toLocaleString('en-IN')}\n` +
    (bill.discount > 0 ? `🎁 *${labels.discount}:* -₹${Number(bill.discount).toLocaleString('en-IN')}\n` : '') +
    (bill.additional_charges > 0 ? `🚚 *${labels.additionalCharges}:* +₹${Number(bill.additional_charges).toLocaleString('en-IN')}\n` : '') +
    (bill.tax_amount > 0 ? `🏛️ *${labels.gst} (${bill.tax_percent}%):* +₹${Number(bill.tax_amount).toLocaleString('en-IN')}\n` : '') +
    `💳 *${labels.grandTotal.toUpperCase()}:* ₹${Number(bill.grand_total).toLocaleString('en-IN')}\n` +
    `💵 *${labels.totalPaid}:* ₹${Number(bill.total_paid).toLocaleString('en-IN')}\n` +
    `🔴 *${labels.remainingBalance.toUpperCase()}:* ₹${Number(bill.balance_due).toLocaleString('en-IN')}\n` +
    `📌 *Status:* ${statusEmoji}\n` +
    `-----------------------------------------\n` +
    `*Payment Method:* ${bill.payment_method}\n` +
    `*${labels.termsTitle}:* ${bill.terms ? bill.terms.split('\n')[0] : labels.defaultTerms.split('\n')[0]}\n\n` +
    `🙏 ${labels.footerText}`
  );
}

export function generateWhatsAppReceiptShareText(bill, payment) {
  if (!bill || !payment) return '';
  return encodeURIComponent(
    `🧾 *OFFICIAL PAYMENT RECEIPT*\n` +
    `-----------------------------------------\n` +
    `🏢 *Vendor:* ${bill.vendor_name}\n` +
    `📞 *Contact:* +91 ${bill.vendor_phone}\n` +
    `-----------------------------------------\n` +
    `🔢 *Receipt No:* #${payment.id}\n` +
    `📅 *Date:* ${payment.date}\n` +
    `📋 *Linked Bill No:* ${bill.bill_number}\n` +
    `👤 *Received From:* ${bill.customer_name} (+91 ${bill.customer_phone})\n` +
    `🎪 *Event:* ${bill.event_name}\n` +
    `-----------------------------------------\n` +
    `💰 *AMOUNT RECEIVED:* ₹${Number(payment.amount).toLocaleString('en-IN')}\n` +
    `💳 *Payment Method:* ${payment.method} (${payment.reference || 'Direct'})\n` +
    `📉 *Remaining Balance:* ₹${Number(bill.balance_due).toLocaleString('en-IN')}\n` +
    `-----------------------------------------\n` +
    `🙏 Thank you for your payment! Keep this receipt for your records.\n` +
    `✨ Digitally Issued via Shubh Celebrations`
  );
}

// ------------------------------------------------------------------------------
// 13. PROFESSIONAL A4 INVOICE & RECEIPT HTML GENERATORS
// Palette: Professional Blue (#1976D2), Pure White (#FFFFFF), Premium Golden (#D4AF37)
// Full Unicode font support for Gujarati, Hindi and English
// ------------------------------------------------------------------------------

export function generateA4InvoiceHTML(bill, lang = 'en') {
  if (!bill) return '';
  const labels = INVOICE_I18N[lang] || INVOICE_I18N.en;

  const itemsRows = (bill.items || []).map((it, idx) => `
    <tr>
      <td style="text-align:center; color:#64748b;">${idx + 1}</td>
      <td style="font-weight:600; color:#1e293b;">${it.description}</td>
      <td style="text-align:center;">${it.quantity}</td>
      <td style="text-align:right;">₹${Number(it.rate).toLocaleString('en-IN')}</td>
      <td style="text-align:right; font-weight:700; color:#1976D2;">₹${Number(it.amount).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const statusClass =
    bill.payment_status === 'paid' ? 'status-paid' :
    bill.payment_status === 'partial' ? 'status-partial' :
    bill.payment_status === 'cancelled' ? 'status-cancelled' : 'status-unpaid';

  const statusLabel =
    bill.payment_status === 'paid' ? labels.statusPaid :
    bill.payment_status === 'partial' ? labels.statusPartial :
    bill.payment_status === 'cancelled' ? labels.statusCancelled : labels.statusUnpaid;

  const paymentsRows = (bill.payments && bill.payments.length > 0) ? `
    <div class="payments-box">
      <div class="box-title">${labels.paymentHistoryTitle}:</div>
      ${bill.payments.map(p => `
        <div class="payment-row">
          <span><strong style="color:#1976D2;">#${p.id}</strong> • ${p.date} (${p.method} - ${p.reference || 'Direct'})</span>
          <span style="font-weight:800; color:#15803d;">+₹${Number(p.amount).toLocaleString('en-IN')}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const vendorLogoHtml = (bill.vendor_logo || bill.logo_url) ? `
    <img src="${bill.vendor_logo || bill.logo_url}" alt="Vendor Logo" class="vendor-logo-img" />
  ` : '';

  const fontConfig = lang === 'gu'
    ? `'Noto Sans Gujarati', 'Inter', sans-serif`
    : lang === 'hi'
    ? `'Noto Sans Devanagari', 'Inter', sans-serif`
    : `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${labels.taxInvoice} - ${bill.bill_number}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;600;700;800;900&family=Noto+Sans+Gujarati:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 8mm 8mm 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: ${fontConfig};
      background: #ffffff;
      color: #1e293b;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.45;
    }
    .invoice-card {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .invoice-card {
        border: none !important;
        border-radius: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
    }
    tr, .parties-row, .totals-terms-section, .signatures-section, .payments-box {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    /* Brand Top Banner */
    .brand-top-bar {
      background: #1976D2;
      color: #ffffff;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #D4AF37;
    }
    .brand-name {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #FFF9C4;
      font-weight: 600;
    }

    /* Letterhead */
    .letterhead-section {
      padding: 20px 26px 16px 26px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      background: #ffffff;
    }
    .vendor-header-flex {
      display: flex;
      align-items: center;
      gap: 14px;
      max-width: 60%;
    }
    .vendor-logo-img {
      width: 58px;
      height: 58px;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid #D4AF37;
    }
    .vendor-info-col {
      flex: 1;
    }
    .vendor-title {
      font-size: 22px;
      font-weight: 900;
      color: #1976D2;
      margin: 0 0 4px 0;
      line-height: 1.2;
    }
    .vendor-specialty {
      font-size: 11px;
      font-weight: 700;
      color: #D4AF37;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 4px 0;
    }
    .vendor-meta-text {
      font-size: 12px;
      color: #475569;
      margin: 2px 0;
    }

    /* Invoice Meta & Badge */
    .invoice-meta-col {
      text-align: right;
    }
    .tax-invoice-badge {
      display: inline-block;
      background: #1976D2;
      color: #ffffff;
      border: 1.5px solid #D4AF37;
      font-weight: 900;
      font-size: 11px;
      letter-spacing: 1px;
      padding: 4px 14px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .meta-line {
      font-size: 12px;
      color: #475569;
      margin: 3px 0;
    }
    .meta-line strong {
      color: #0f172a;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-top: 5px;
      text-transform: uppercase;
    }
    .status-paid {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .status-partial {
      background: #fff8e1;
      color: #b45309;
      border: 1px solid #D4AF37;
    }
    .status-unpaid {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fca5a5;
    }
    .status-cancelled {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #cbd5e1;
    }

    /* Client & Event Particulars */
    .parties-row {
      padding: 14px 26px;
      display: flex;
      gap: 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .party-card {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-top: 3px solid #1976D2;
      border-radius: 6px;
      padding: 10px 14px;
    }
    .party-card-title {
      font-size: 11px;
      font-weight: 800;
      color: #1976D2;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .party-title-text {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .party-sub-text {
      font-size: 11.5px;
      color: #475569;
      margin: 1px 0;
    }

    /* Itemized Services Table */
    .table-container {
      padding: 14px 26px;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    table.items-table th {
      background: #1976D2;
      color: #ffffff;
      padding: 9px 12px;
      font-size: 11.5px;
      font-weight: 700;
      text-align: left;
      border-bottom: 2px solid #D4AF37;
    }
    table.items-table td {
      padding: 8px 12px;
      font-size: 11.5px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    table.items-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Footer / Totals Section */
    .totals-terms-section {
      padding: 0 26px 14px 26px;
      display: flex;
      gap: 18px;
    }
    .terms-box {
      flex: 1.15;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
    }
    .box-title {
      font-size: 11px;
      font-weight: 800;
      color: #1976D2;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .terms-text {
      font-size: 10.5px;
      color: #475569;
      line-height: 1.45;
      white-space: pre-line;
    }
    .totals-box {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .total-line {
      display: flex;
      justify-content: space-between;
      padding: 5px 12px;
      font-size: 11.5px;
      color: #475569;
      border-bottom: 1px solid #f1f5f9;
    }
    .grand-total-banner {
      background: #1976D2;
      color: #ffffff;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 900;
    }
    .remaining-balance-banner {
      background: #fff8e1;
      border-top: 2px solid #D4AF37;
      color: #92400e;
      padding: 7px 12px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 900;
    }

    /* Payments History */
    .payments-box {
      margin: 0 26px 14px 26px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 3px 0;
      border-bottom: 1px dashed #dcfce7;
      color: #334155;
    }

    /* Signatures Section */
    .signatures-section {
      padding: 16px 26px 14px 26px;
      display: flex;
      justify-content: space-between;
      gap: 36px;
    }
    .sign-card {
      flex: 1;
      text-align: center;
      border-top: 1.5px dashed #94a3b8;
      padding-top: 8px;
      margin-top: 28px;
    }
    .sign-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #1976D2;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sign-name {
      font-size: 11.5px;
      color: #0f172a;
      font-weight: 700;
      margin-top: 2px;
    }
    .sign-desc {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 1px;
    }

    /* Bottom Attribution */
    .bottom-attribution {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 8px 24px;
      text-align: center;
      font-size: 9.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Top Branding Banner -->
    <div class="brand-top-bar">
      <div class="brand-name">${labels.brandName}</div>
      <div class="brand-subtitle">${labels.brandSubtitle}</div>
    </div>

    <!-- Letterhead -->
    <div class="letterhead-section">
      <div class="vendor-header-flex">
        ${vendorLogoHtml}
        <div class="vendor-info-col">
          <h1 class="vendor-title">${bill.vendor_name}</h1>
          <div class="vendor-specialty">${labels.vendorBadge}</div>
          <div class="vendor-meta-text">📍 ${bill.vendor_location}</div>
          <div class="vendor-meta-text">📞 +91 ${bill.vendor_phone}</div>
        </div>
      </div>
      <div class="invoice-meta-col">
        <div class="tax-invoice-badge">${labels.taxInvoice}</div>
        <div class="meta-line"><strong>${labels.billNo}:</strong> ${bill.bill_number}</div>
        <div class="meta-line"><strong>${labels.billDate}:</strong> ${bill.created_at?.split('T')[0] || bill.event_date}</div>
        <div class="meta-line"><strong>${labels.eventDate}:</strong> ${bill.event_date}</div>
        <div class="status-badge ${statusClass}">${statusLabel}</div>
      </div>
    </div>

    <!-- Client & Event Info -->
    <div class="parties-row">
      <div class="party-card">
        <div class="party-card-title">${labels.billedTo}:</div>
        <div class="party-title-text">${bill.customer_name}</div>
        <div class="party-sub-text">📞 ${labels.phone}: +91 ${bill.customer_phone}</div>
      </div>
      <div class="party-card">
        <div class="party-card-title">${labels.eventParticulars}:</div>
        <div class="party-title-text">${bill.event_name}</div>
        <div class="party-sub-text">📍 ${labels.venue}: ${bill.event_location}</div>
      </div>
    </div>

    <!-- Table of Services -->
    <div class="table-container">
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:36px; text-align:center;">${labels.srNo}</th>
            <th>${labels.description}</th>
            <th style="width:48px; text-align:center;">${labels.quantity}</th>
            <th style="width:95px; text-align:right;">${labels.rate}</th>
            <th style="width:105px; text-align:right;">${labels.amount}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Totals and Terms Section -->
    <div class="totals-terms-section">
      <div class="terms-box">
        <div class="box-title">${labels.termsTitle}:</div>
        <div class="terms-text">${bill.terms || labels.defaultTerms}</div>
        ${bill.notes ? `
          <div class="box-title" style="margin-top:8px;">${labels.notesTitle}:</div>
          <div class="terms-text">${bill.notes}</div>
        ` : ''}
      </div>

      <div class="totals-box">
        <div class="total-line">
          <span>${labels.subtotal}:</span>
          <strong>₹${Number(bill.subtotal).toLocaleString('en-IN')}</strong>
        </div>
        ${bill.discount > 0 ? `
          <div class="total-line" style="color:#dc2626;">
            <span>${labels.discount}:</span>
            <strong>-₹${Number(bill.discount).toLocaleString('en-IN')}</strong>
          </div>
        ` : ''}
        ${bill.additional_charges > 0 ? `
          <div class="total-line">
            <span>${labels.additionalCharges}:</span>
            <strong>+₹${Number(bill.additional_charges).toLocaleString('en-IN')}</strong>
          </div>
        ` : ''}
        ${bill.tax_amount > 0 ? `
          <div class="total-line">
            <span>${labels.gst} (${bill.tax_percent}%):</span>
            <strong>+₹${Number(bill.tax_amount).toLocaleString('en-IN')}</strong>
          </div>
        ` : ''}
        <div class="grand-total-banner">
          <span>${labels.grandTotal}:</span>
          <span>₹${Number(bill.grand_total).toLocaleString('en-IN')}</span>
        </div>
        <div class="total-line" style="color:#15803d; font-weight:700;">
          <span>${labels.totalPaid}:</span>
          <span>₹${Number(bill.total_paid).toLocaleString('en-IN')}</span>
        </div>
        <div class="remaining-balance-banner">
          <span>${labels.remainingBalance}:</span>
          <span>₹${Number(bill.balance_due).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>

    <!-- Payment History -->
    ${paymentsRows}

    <!-- Signatures -->
    <div class="signatures-section">
      <div class="sign-card">
        <div class="sign-title">${labels.clientSignature}</div>
        <div class="sign-name">${bill.customer_name}</div>
        <div class="sign-desc">${labels.clientSignSub}</div>
      </div>
      <div class="sign-card">
        <div class="sign-title">${labels.vendorSignature}</div>
        <div class="sign-name">${bill.vendor_name}</div>
        <div class="sign-desc">${labels.vendorSignSub}</div>
      </div>
    </div>

    <!-- Footer Attribution -->
    <div class="bottom-attribution">
      ${labels.footerText}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates and downloads a real A4 PDF document for the specified bill.
 * Filename format: Shubh-Celebrations-Bill-BILLNUMBER.pdf
 * Supports English ('en'), Gujarati ('gu'), and Hindi ('hi') separately.
 */
export async function generateAndDownloadInvoicePDF(bill, lang = 'en') {
  if (!bill) {
    throw new Error('No bill provided for PDF generation');
  }

  const filename = `Shubh-Celebrations-Bill-${bill.bill_number}.pdf`;
  const htmlContent = generateA4InvoiceHTML(bill, lang);

  // 1. Browser Environment (Web & Mobile Web): Pixel-perfect html2pdf rendering
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    let html2pdfModule = window.html2pdf;
    if (!html2pdfModule) {
      try {
        const mod = await import('html2pdf.js');
        html2pdfModule = mod.default || mod;
      } catch (err) {
        console.warn('Could not dynamically import html2pdf.js:', err);
      }
    }

    if (!html2pdfModule && typeof document !== 'undefined') {
      // Dynamic fallback injection
      await new Promise((resolve, reject) => {
        if (window.html2pdf) {
          html2pdfModule = window.html2pdf;
          return resolve();
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
          html2pdfModule = window.html2pdf;
          resolve();
        };
        script.onerror = (e) => reject(new Error('Failed to load html2pdf script: ' + e));
        document.head.appendChild(script);
      }).catch(err => {
        console.warn('CDN script injection error, proceeding to vector fallback:', err);
      });
    }

    if (html2pdfModule) {
      const container = document.createElement('div');
      container.id = 'shubh-pdf-render-temp';
      container.style.position = 'fixed';
      container.style.left = '-99999px';
      container.style.top = '0';
      container.style.width = '794px'; // 210mm at 96 DPI
      container.style.background = '#ffffff';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      try {
        await new Promise(resolve => setTimeout(resolve, 200));

        const opt = {
          margin: [8, 8, 8, 8],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false,
            windowWidth: 794,
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        };

        await html2pdfModule().set(opt).from(container).save();
        return { success: true, filename, method: 'html2pdf' };
      } finally {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    }
  }

  // 2. Node.js or Standalone Vector Fallback using jsPDF
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const labels = INVOICE_I18N[lang] || INVOICE_I18N.en;

    // Top Brand Bar (Professional Blue #1976D2 + Golden Accent #D4AF37)
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 16, 'F');
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 15, 210, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SHUBH CELEBRATIONS', 14, 10.5);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('All India Event Marketplace & Digital Invoicing', 196, 10.5, { align: 'right' });

    // Vendor header
    doc.setTextColor(25, 118, 210);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(bill.vendor_name || 'Vendor', 14, 27);

    doc.setFontSize(8.5);
    doc.setTextColor(212, 175, 55);
    doc.text('VERIFIED WEDDING & EVENT VENDOR', 14, 32);

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`Location: ${bill.vendor_location || 'N/A'}`, 14, 37);
    doc.text(`Phone: +91 ${bill.vendor_phone || 'N/A'}`, 14, 42);

    // Invoice Meta Right Box
    doc.setFillColor(25, 118, 210);
    doc.roundedRect(138, 20, 58, 8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(labels.taxInvoice || 'TAX INVOICE', 167, 25.5, { align: 'center' });

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${labels.billNo}: ${bill.bill_number}`, 196, 33, { align: 'right' });
    doc.text(`${labels.billDate}: ${bill.created_at?.split('T')[0] || bill.event_date}`, 196, 38, { align: 'right' });
    doc.text(`${labels.eventDate}: ${bill.event_date}`, 196, 43, { align: 'right' });

    const statusStr = bill.payment_status === 'paid' ? 'PAID' : bill.payment_status === 'partial' ? 'PARTIALLY PAID' : 'UNPAID';
    doc.text(`Status: ${statusStr}`, 196, 48, { align: 'right' });

    // Client & Event Section
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 52, 88, 22, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 52, 88, 22, 2, 2, 'D');
    doc.setFillColor(25, 118, 210);
    doc.rect(14, 52, 88, 2, 'F');

    doc.setTextColor(25, 118, 210);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text((labels.billedTo || 'BILLED TO (CLIENT)').toUpperCase(), 18, 58);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.text(bill.customer_name || 'Client', 18, 64);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Phone: +91 ${bill.customer_phone || 'N/A'}`, 18, 70);

    // Event box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(108, 52, 88, 22, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(108, 52, 88, 22, 2, 2, 'D');
    doc.setFillColor(25, 118, 210);
    doc.rect(108, 52, 88, 2, 'F');

    doc.setTextColor(25, 118, 210);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text((labels.eventParticulars || 'EVENT PARTICULARS').toUpperCase(), 112, 58);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.text(bill.event_name || 'Event', 112, 64);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Venue: ${bill.event_location || 'N/A'}`, 112, 70);

    // Items Table Header
    let y = 82;
    doc.setFillColor(25, 118, 210);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFillColor(212, 175, 55);
    doc.rect(14, y + 7.5, 182, 0.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(labels.srNo || '#', 18, y + 5.5);
    doc.text(labels.description || 'Description', 30, y + 5.5);
    doc.text(labels.quantity || 'Qty', 130, y + 5.5, { align: 'center' });
    doc.text(labels.rate || 'Rate (Rs)', 160, y + 5.5, { align: 'right' });
    doc.text(labels.amount || 'Amount (Rs)', 192, y + 5.5, { align: 'right' });

    y += 9;
    (bill.items || []).forEach((item, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 1, 182, 7, 'F');
      }
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(String(index + 1), 18, y + 4);
      doc.text(item.description.substring(0, 52), 30, y + 4);
      doc.text(String(item.quantity), 130, y + 4, { align: 'center' });
      doc.text(`Rs. ${Number(item.rate).toLocaleString('en-IN')}`, 160, y + 4, { align: 'right' });
      doc.setTextColor(25, 118, 210);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${Number(item.amount).toLocaleString('en-IN')}`, 192, y + 4, { align: 'right' });
      y += 7;
    });

    // Totals Section
    y += 4;
    const totalsX = 120;
    const totalsW = 76;

    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, 196, y);
    y += 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    // Terms box on left
    doc.text(`${labels.termsTitle}:`, 14, y + 2);
    doc.setFontSize(7.5);
    const termsLines = doc.splitTextToSize(bill.terms || labels.defaultTerms, 95);
    doc.text(termsLines, 14, y + 6);

    // Totals on right
    doc.text(`${labels.subtotal}:`, totalsX, y + 2);
    doc.text(`Rs. ${Number(bill.subtotal).toLocaleString('en-IN')}`, 192, y + 2, { align: 'right' });
    y += 5;

    if (bill.discount > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`${labels.discount}:`, totalsX, y + 2);
      doc.text(`-Rs. ${Number(bill.discount).toLocaleString('en-IN')}`, 192, y + 2, { align: 'right' });
      y += 5;
    }

    if (bill.additional_charges > 0) {
      doc.setTextColor(71, 85, 105);
      doc.text(`${labels.additionalCharges}:`, totalsX, y + 2);
      doc.text(`+Rs. ${Number(bill.additional_charges).toLocaleString('en-IN')}`, 192, y + 2, { align: 'right' });
      y += 5;
    }

    if (bill.tax_amount > 0) {
      doc.setTextColor(71, 85, 105);
      doc.text(`${labels.gst} (${bill.tax_percent}%):`, totalsX, y + 2);
      doc.text(`+Rs. ${Number(bill.tax_amount).toLocaleString('en-IN')}`, 192, y + 2, { align: 'right' });
      y += 5;
    }

    // Grand total banner
    doc.setFillColor(25, 118, 210);
    doc.rect(totalsX - 2, y, totalsW + 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${labels.grandTotal}:`, totalsX + 2, y + 5);
    doc.text(`Rs. ${Number(bill.grand_total).toLocaleString('en-IN')}`, 192, y + 5, { align: 'right' });
    y += 9;

    // Total Paid
    doc.setTextColor(21, 128, 61);
    doc.setFontSize(8.5);
    doc.text(`${labels.totalPaid}:`, totalsX, y + 2);
    doc.text(`Rs. ${Number(bill.total_paid).toLocaleString('en-IN')}`, 192, y + 2, { align: 'right' });
    y += 6;

    // Remaining balance
    doc.setFillColor(255, 248, 225);
    doc.rect(totalsX - 2, y - 1, totalsW + 2, 7, 'F');
    doc.setDrawColor(212, 175, 55);
    doc.rect(totalsX - 2, y - 1, totalsW + 2, 7, 'D');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${labels.remainingBalance}:`, totalsX + 2, y + 4);
    doc.text(`Rs. ${Number(bill.balance_due).toLocaleString('en-IN')}`, 192, y + 4, { align: 'right' });

    // Signatures
    y = Math.max(y + 24, 235);
    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(20, y, 80, y);
    doc.line(130, y, 190, y);
    doc.setLineDashPattern([], 0);

    doc.setTextColor(25, 118, 210);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(labels.clientSignature || 'CLIENT SIGNATURE', 50, y + 5, { align: 'center' });
    doc.text(labels.vendorSignature || 'AUTHORIZED SIGNATURE', 160, y + 5, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(bill.customer_name || 'Client', 50, y + 9, { align: 'center' });
    doc.text(bill.vendor_name || 'Vendor', 160, y + 9, { align: 'center' });

    // Footer
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.text(labels.footerText || 'Thank you for choosing Shubh Celebrations', 105, 292, { align: 'center' });

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      doc.save(filename);
      return { success: true, filename, method: 'jspdf-browser' };
    } else {
      const buffer = Buffer.from(doc.output('arraybuffer'));
      return { success: true, filename, buffer, method: 'jspdf-node' };
    }
  } catch (err) {
    console.error('PDF generation error:', err);
    throw err;
  }
}

export function generateA4ReceiptHTML(bill, payment) {
  if (!bill || !payment) return '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${payment.id}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
      color: #1e293b;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .receipt-card {
      width: 100%;
      max-width: 680px;
      margin: 20px auto;
      background: #ffffff;
      border: 2px solid #1976D2;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .receipt-header {
      background: #1976D2;
      color: #ffffff;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #D4AF37;
    }
    .receipt-brand {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .receipt-badge {
      background: #D4AF37;
      color: #000000;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 12px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .receipt-body {
      padding: 24px;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .receipt-row-label {
      color: #64748b;
      font-weight: 600;
    }
    .receipt-row-val {
      color: #0f172a;
      font-weight: 700;
    }
    .amount-highlight-box {
      margin: 20px 0;
      background: #f0fdf4;
      border: 2px solid #86efac;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .amount-title {
      font-size: 12px;
      color: #15803d;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .amount-val {
      font-size: 28px;
      color: #15803d;
      font-weight: 900;
      margin: 4px 0;
    }
    .receipt-signatures {
      margin-top: 36px;
      display: flex;
      justify-content: space-between;
      gap: 30px;
    }
    .receipt-sign-box {
      flex: 1;
      text-align: center;
      border-top: 1.5px dashed #94a3b8;
      padding-top: 8px;
    }
    .receipt-footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 10px 24px;
      text-align: center;
      font-size: 10px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="receipt-header">
      <div class="receipt-brand">✨ SHUBH CELEBRATIONS</div>
      <div class="receipt-badge">OFFICIAL PAYMENT RECEIPT</div>
    </div>
    <div class="receipt-body">
      <div class="receipt-row">
        <span class="receipt-row-label">Receipt Number:</span>
        <span class="receipt-row-val" style="color:#1976D2;">#${payment.id}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-row-label">Payment Date:</span>
        <span class="receipt-row-val">${payment.date}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-row-label">Linked Bill Number:</span>
        <span class="receipt-row-val">${bill.bill_number}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-row-label">Received From (Client):</span>
        <span class="receipt-row-val">${bill.customer_name} (+91 ${bill.customer_phone})</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-row-label">Issued By (Vendor):</span>
        <span class="receipt-row-val">${bill.vendor_name} (+91 ${bill.vendor_phone})</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-row-label">Event:</span>
        <span class="receipt-row-val">${bill.event_name} (${bill.event_date})</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-row-label">Payment Method & Reference:</span>
        <span class="receipt-row-val">${payment.method} (${payment.reference || 'Manual Entry'})</span>
      </div>

      <div class="amount-highlight-box">
        <div class="amount-title">Amount Received (₹)</div>
        <div class="amount-val">₹${Number(payment.amount).toLocaleString('en-IN')}</div>
        <div style="font-size:12px; color:#475569;">Recorded towards Tax Invoice #${bill.bill_number}</div>
      </div>

      <div class="receipt-row">
        <span class="receipt-row-label">Total Invoiced Amount:</span>
        <span class="receipt-row-val">₹${Number(bill.grand_total).toLocaleString('en-IN')}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-row-label">Total Paid to Date:</span>
        <span class="receipt-row-val" style="color:#15803d;">₹${Number(bill.total_paid).toLocaleString('en-IN')}</span>
      </div>
      <div class="receipt-row" style="background:#fff8e1; padding:8px 6px; border-radius:4px; border:1px solid #D4AF37;">
        <span class="receipt-row-label" style="color:#92400e;">Remaining Outstanding Balance:</span>
        <span class="receipt-row-val" style="color:#92400e; font-size:14px;">₹${Number(bill.balance_due).toLocaleString('en-IN')}</span>
      </div>

      <div class="receipt-signatures">
        <div class="receipt-sign-box">
          <div style="font-size:11px; font-weight:800; color:#1976D2;">CLIENT ACKNOWLEDGMENT</div>
          <div style="font-size:12px; color:#0f172a; margin-top:2px;">${bill.customer_name}</div>
        </div>
        <div class="receipt-sign-box">
          <div style="font-size:11px; font-weight:800; color:#1976D2;">AUTHORIZED SIGNATURE</div>
          <div style="font-size:12px; color:#0f172a; margin-top:2px;">${bill.vendor_name}</div>
        </div>
      </div>
    </div>
    <div class="receipt-footer">
      This is a digitally issued payment receipt powered by Shubh Celebrations • Valid for all billing reconciliations.
    </div>
  </div>
</body>
</html>`;
}

