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
// 12. WHATSAPP SHARE MESSAGE GENERATOR
// ------------------------------------------------------------------------------

export function generateWhatsAppInvoiceShareText(bill) {
  if (!bill) return '';

  const statusEmoji =
    bill.payment_status === 'paid' ? '✅ PAID' : bill.payment_status === 'partial' ? '⏳ PARTIALLY PAID' : '⚠️ UNPAID';

  let itemsText = (bill.items || [])
    .map((it, idx) => `  ${idx + 1}. ${it.description} (${it.quantity}x @ ₹${Number(it.rate).toLocaleString('en-IN')}) = ₹${Number(it.amount).toLocaleString('en-IN')}`)
    .join('\n');

  return encodeURIComponent(
    `🧾 *TAX INVOICE / BILL DETAILS*\n` +
    `-----------------------------------------\n` +
    `🏢 *Business:* ${bill.vendor_name}\n` +
    `📞 *Phone:* +91 ${bill.vendor_phone}\n` +
    `📍 *Location:* ${bill.vendor_location}\n` +
    `-----------------------------------------\n` +
    `📋 *Bill No:* ${bill.bill_number}\n` +
    `📅 *Event Date:* ${bill.event_date}\n` +
    `🎪 *Event:* ${bill.event_name}\n` +
    `👤 *Client:* ${bill.customer_name} (+91 ${bill.customer_phone})\n` +
    `📍 *Venue:* ${bill.event_location}\n` +
    `-----------------------------------------\n` +
    `*ITEMIZED SERVICES:*\n${itemsText}\n` +
    `-----------------------------------------\n` +
    `💰 *Subtotal:* ₹${Number(bill.subtotal).toLocaleString('en-IN')}\n` +
    (bill.discount > 0 ? `🎁 *Discount:* -₹${Number(bill.discount).toLocaleString('en-IN')}\n` : '') +
    (bill.tax_amount > 0 ? `🏛️ *GST (${bill.tax_percent}%):* ₹${Number(bill.tax_amount).toLocaleString('en-IN')}\n` : '') +
    `💳 *GRAND TOTAL:* ₹${Number(bill.grand_total).toLocaleString('en-IN')}\n` +
    `💵 *Advance / Paid:* ₹${Number(bill.total_paid).toLocaleString('en-IN')}\n` +
    `🔴 *BALANCE DUE:* ₹${Number(bill.balance_due).toLocaleString('en-IN')}\n` +
    `📌 *Status:* ${statusEmoji}\n` +
    `-----------------------------------------\n` +
    `*Payment Method:* ${bill.payment_method}\n` +
    `*Terms:* ${bill.terms ? bill.terms.split('\n')[0] : 'Standard vendor policy'}\n\n` +
    `🙏 Thank you for choosing *${bill.vendor_name}* on Shubh Celebrations!`
  );
}
