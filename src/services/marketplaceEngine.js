// ==============================================================================
// SHUBH CELEBRATIONS – PAN INDIA 5% COMMISSION & DIRECT PAYMENT ENGINE
// Pure Vendor Marketplace Engine:
// 1. Customer pays Vendor DIRECTLY (Platform does not collect customer funds)
// 2. Platform commission is FIXED at 5% on completed eligible bookings
// 3. Vendor owes 5% commission to Shubh Celebrations on completed bookings
// 4. Commission collection & admin bank reconciliation workflow
// ==============================================================================

export const COMMISSION_RATE = 5.0; // 5% FIXED

// In-Memory Direct Payments Store (Customer to Vendor)
let directPayments = [
  {
    id: 1,
    booking_id: 101,
    booking_code: 'BK-2026-7841',
    customer_id: 'usr-cust-101',
    customer_name: 'Rajeshbhai Patel',
    customer_phone: '9825098765',
    vendor_id: 1,
    vendor_name: 'Vallabh Decoration & Event Management',
    amount: 35000,
    payment_method: 'UPI',
    payment_reference: 'UPI/2026/894120847',
    payment_date: '2026-10-25',
    customer_confirmation: true,
    vendor_confirmation: true,
    status: 'vendor_confirmed',
    proof_reference: 'screenshot_upi_35000.png',
    notes: 'Advance booking deposit paid directly via PhonePe UPI to vendor QR.',
    created_at: '2026-10-25T14:35:00Z',
  },
  {
    id: 2,
    booking_id: 101,
    booking_code: 'BK-2026-7841',
    customer_id: 'usr-cust-101',
    customer_name: 'Rajeshbhai Patel',
    customer_phone: '9825098765',
    vendor_id: 1,
    vendor_name: 'Vallabh Decoration & Event Management',
    amount: 50000,
    payment_method: 'Cash Receipt',
    payment_reference: 'RCPT-VALLABH-401',
    payment_date: '2026-10-28',
    customer_confirmation: true,
    vendor_confirmation: true,
    status: 'vendor_confirmed',
    proof_reference: 'receipt_cash_50000.jpg',
    notes: 'Final settlement paid in cash directly to decorator at venue.',
    created_at: '2026-10-28T18:00:00Z',
  },
  {
    id: 3,
    booking_id: 102,
    booking_code: 'BK-2026-8912',
    customer_id: 'usr-cust-101',
    customer_name: 'Rajeshbhai Patel',
    vendor_id: 5,
    vendor_name: 'Motibaug Party Plot',
    amount: 50000,
    payment_method: 'Direct Bank Transfer',
    payment_reference: 'NEFT/HDFC/00918237',
    payment_date: '2026-10-29',
    customer_confirmation: true,
    vendor_confirmation: false, // Pending vendor acknowledgement
    status: 'customer_confirmed',
    proof_reference: 'neft_hdfc_ack.pdf',
    notes: 'Direct RTGS/NEFT advance to party plot bank account.',
    created_at: '2026-10-29T11:20:00Z',
  },
];

// In-Memory Commission Ledger (5% Platform Fee Owed by Vendors on Completed Events)
let commissionLedger = [
  {
    id: 1,
    booking_id: 101,
    booking_code: 'BK-2026-7841',
    vendor_id: 1,
    vendor_name: 'Vallabh Decoration & Event Management',
    city_name: 'Godhra',
    state_id: 'GJ',
    eligible_amount: 85000, // Client Total
    commission_rate_snapshot: 5.0, // 5%
    commission_amount: 4250, // 85,000 * 0.05 = 4,250
    due_date: '2026-11-05',
    paid_amount: 4250,
    outstanding_amount: 0,
    status: 'paid', // 'unpaid' | 'partially_paid' | 'paid' | 'waived' | 'disputed'
    waiver_reason: null,
    created_at: '2026-10-28T18:30:00Z',
  },
  {
    id: 2,
    booking_id: 104,
    booking_code: 'BK-2026-9418',
    vendor_id: 1,
    vendor_name: 'Vallabh Decoration & Event Management',
    city_name: 'Halol',
    state_id: 'GJ',
    eligible_amount: 60000,
    commission_rate_snapshot: 5.0,
    commission_amount: 3000, // 60,000 * 0.05 = 3,000
    due_date: '2026-11-10',
    paid_amount: 1500,
    outstanding_amount: 1500,
    status: 'partially_paid',
    waiver_reason: null,
    created_at: '2026-10-30T10:00:00Z',
  },
  {
    id: 3,
    booking_id: 105,
    booking_code: 'BK-2026-9550',
    vendor_id: 2, // Shree Ram Mandap
    vendor_name: 'Shree Ram Mandap & Sound System',
    city_name: 'Godhra',
    state_id: 'GJ',
    eligible_amount: 40000,
    commission_rate_snapshot: 5.0,
    commission_amount: 2000, // 40,000 * 0.05 = 2,000
    due_date: '2026-11-12',
    paid_amount: 0,
    outstanding_amount: 2000,
    status: 'unpaid',
    waiver_reason: null,
    created_at: '2026-10-30T16:00:00Z',
  },
];

// In-Memory Commission Payments (Vendor Paying Shubh Celebrations via Bank/UPI)
let commissionPayments = [
  {
    id: 1,
    ledger_id: 1,
    booking_code: 'BK-2026-7841',
    vendor_id: 1,
    vendor_name: 'Vallabh Decoration & Event Management',
    amount: 4250,
    payment_mode: 'UPI',
    transaction_ref: 'UPI/SHUBH/2026/991204',
    payment_proof_url: 'shubh_commission_upi_4250.png',
    payment_date: '2026-10-29',
    reconciled_by: 'usr-admin-001',
    reconciled_at: '2026-10-29T19:00:00Z',
    is_verified: true,
    admin_notes: 'Verified against Shubh Celebrations ICICI Current Account statement.',
    created_at: '2026-10-29T18:45:00Z',
  },
  {
    id: 2,
    ledger_id: 2,
    booking_code: 'BK-2026-9418',
    vendor_id: 1,
    vendor_name: 'Vallabh Decoration & Event Management',
    amount: 1500,
    payment_mode: 'IMPS',
    transaction_ref: 'IMPS/BANK/2026/884120',
    payment_proof_url: 'bank_challan_1500.pdf',
    payment_date: '2026-10-31',
    reconciled_by: 'usr-admin-001',
    reconciled_at: '2026-10-31T14:00:00Z',
    is_verified: true,
    admin_notes: 'Part 1 of 2 commission settlement verified.',
    created_at: '2026-10-31T13:30:00Z',
  },
];

// In-Memory Disputes
let disputes = [
  {
    id: 1,
    booking_id: 102,
    booking_code: 'BK-2026-8912',
    raised_by_role: 'customer',
    raised_by_name: 'Rajeshbhai Patel',
    vendor_name: 'Motibaug Party Plot',
    dispute_type: 'Direct Payment Acknowledgement',
    description: 'Customer transferred ₹50,000 via NEFT on 29 Oct, but vendor status is still pending confirmation.',
    claimed_amount: 50000,
    status: 'Under Review',
    created_at: '2026-10-30T12:00:00Z',
  },
];

// ==============================================================================
// 1. COMMISSION ENGINE (5% CALCULATION & LEDGER GENERATION)
// ==============================================================================

export function calculate5PercentCommission(eligibleBookingAmount) {
  const eligible = Math.max(0, Number(eligibleBookingAmount) || 0);
  const commission = Math.round(eligible * 0.05 * 100) / 100;
  return {
    eligibleAmount: eligible,
    ratePercentage: COMMISSION_RATE,
    commissionAmount: commission,
  };
}

export function generateCommissionOnEventCompletion(booking) {
  // Idempotent check: Ensure commission not already created for this booking
  const existing = commissionLedger.find((c) => c.booking_id === booking.id);
  if (existing) {
    return { success: true, ledger: existing, message: 'Commission already recorded.' };
  }

  const { eligibleAmount, commissionAmount } = calculate5PercentCommission(booking.total_booking_amount);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // Due within 7 days

  const newEntry = {
    id: commissionLedger.length + 1,
    booking_id: booking.id,
    booking_code: booking.booking_code,
    vendor_id: booking.vendor_id,
    vendor_name: booking.vendor_name,
    city_name: booking.city_name || 'Godhra',
    state_id: booking.state_id || 'GJ',
    eligible_amount: eligibleAmount,
    commission_rate_snapshot: COMMISSION_RATE,
    commission_amount: commissionAmount,
    due_date: dueDate.toISOString().split('T')[0],
    paid_amount: 0,
    outstanding_amount: commissionAmount,
    status: 'unpaid',
    waiver_reason: null,
    created_at: new Date().toISOString(),
  };

  commissionLedger.unshift(newEntry);
  return { success: true, ledger: newEntry, message: '5% Commission entry generated.' };
}

// ==============================================================================
// 2. DIRECT PAYMENT WORKFLOW (CUSTOMER PAYS VENDOR DIRECTLY)
// ==============================================================================

export function getDirectPayments(bookingId, filterUser = null) {
  let list = directPayments;
  if (bookingId) {
    list = list.filter((p) => p.booking_id === bookingId);
  }
  if (filterUser && filterUser.role === 'customer') {
    const cleanPhone = String(filterUser.phone || '').replace(/\D/g, '').slice(-10);
    const userId = filterUser.id ? String(filterUser.id) : '';
    list = list.filter((p) => 
      (cleanPhone && p.customer_phone === cleanPhone) ||
      (userId && p.customer_id === userId)
    );
  }
  return list;
}

export function recordDirectPayment({
  booking_id,
  booking_code,
  customer_id,
  customer_name,
  vendor_id,
  vendor_name,
  amount,
  payment_method,
  payment_reference,
  proof_reference,
  notes,
}) {
  const newPayment = {
    id: directPayments.length + 1,
    booking_id,
    booking_code: booking_code || `BK-${booking_id}`,
    customer_id,
    customer_name: customer_name || 'Valued Customer',
    vendor_id,
    vendor_name: vendor_name || 'Vendor Partner',
    amount: Number(amount) || 0,
    payment_method: payment_method || 'UPI',
    payment_reference: payment_reference || 'REF-DIRECT',
    payment_date: new Date().toISOString().split('T')[0],
    customer_confirmation: true,
    vendor_confirmation: false, // Pending vendor receipt confirmation
    status: 'customer_confirmed',
    proof_reference: proof_reference || 'payment_receipt.jpg',
    notes: notes || 'Paid directly to vendor.',
    created_at: new Date().toISOString(),
  };

  directPayments.unshift(newPayment);
  return { success: true, payment: newPayment };
}

export function confirmDirectPaymentByVendor(paymentId, vendorId) {
  const payment = directPayments.find((p) => p.id === paymentId);
  if (!payment) {
    return { success: false, message: 'Direct payment record not found.' };
  }
  if (payment.vendor_id !== vendorId) {
    return { success: false, message: '403 Forbidden: Only the designated vendor can confirm receipt.' };
  }

  payment.vendor_confirmation = true;
  payment.status = 'vendor_confirmed';
  return { success: true, payment, message: 'Vendor confirmed direct payment receipt.' };
}

export function disputeDirectPayment(paymentId, reason) {
  const payment = directPayments.find((p) => p.id === paymentId);
  if (!payment) return { success: false, message: 'Payment not found.' };

  payment.status = 'disputed';
  payment.notes = `Dispute: ${reason}`;

  disputes.unshift({
    id: disputes.length + 1,
    booking_id: payment.booking_id,
    booking_code: payment.booking_code,
    raised_by_role: 'vendor',
    raised_by_name: payment.vendor_name,
    vendor_name: payment.vendor_name,
    dispute_type: 'Payment Not Received in Bank',
    description: reason,
    claimed_amount: payment.amount,
    status: 'Open',
    created_at: new Date().toISOString(),
  });

  return { success: true, payment, message: 'Payment marked as disputed and forwarded to Admin.' };
}

// ==============================================================================
// 3. VENDOR COMMISSION COLLECTION & ADMIN RECONCILIATION
// ==============================================================================

export function getVendorCommissionLedger(vendorId) {
  if (vendorId) {
    return commissionLedger.filter((c) => c.vendor_id === vendorId);
  }
  return commissionLedger;
}

export function getVendorOutstandingCommission(vendorId) {
  const ledger = getVendorCommissionLedger(vendorId);
  return ledger.reduce((sum, item) => sum + (Number(item.outstanding_amount) || 0), 0);
}

export function submitVendorCommissionPayment({
  ledger_id,
  vendor_id,
  vendor_name,
  amount,
  payment_mode,
  transaction_ref,
  proof_url,
}) {
  const ledgerItem = commissionLedger.find((l) => l.id === ledger_id);
  if (!ledgerItem) {
    return { success: false, message: 'Commission ledger item not found.' };
  }

  const newCommPay = {
    id: commissionPayments.length + 1,
    ledger_id,
    booking_code: ledgerItem.booking_code,
    vendor_id,
    vendor_name: vendor_name || ledgerItem.vendor_name,
    amount: Number(amount) || 0,
    payment_mode: payment_mode || 'UPI',
    transaction_ref,
    payment_proof_url: proof_url || 'receipt.png',
    payment_date: new Date().toISOString().split('T')[0],
    reconciled_by: null,
    reconciled_at: null,
    is_verified: false,
    admin_notes: 'Pending Admin Bank Statement Reconciliation',
    created_at: new Date().toISOString(),
  };

  commissionPayments.unshift(newCommPay);
  return { success: true, payment: newCommPay, message: 'Commission payment proof submitted to Admin.' };
}

export function reconcileCommissionPayment(paymentId, adminId, isVerified, adminNotes) {
  const pay = commissionPayments.find((p) => p.id === paymentId);
  if (!pay) return { success: false, message: 'Commission payment not found.' };

  pay.is_verified = isVerified;
  pay.reconciled_by = adminId || 'usr-admin-001';
  pay.reconciled_at = new Date().toISOString();
  pay.admin_notes = adminNotes || (isVerified ? 'Reconciled with Platform Bank Statement' : 'Rejected - Not Reflected');

  if (isVerified) {
    const ledgerItem = commissionLedger.find((l) => l.id === pay.ledger_id);
    if (ledgerItem) {
      ledgerItem.paid_amount += pay.amount;
      ledgerItem.outstanding_amount = Math.max(0, ledgerItem.commission_amount - ledgerItem.paid_amount);
      ledgerItem.status = ledgerItem.outstanding_amount === 0 ? 'paid' : 'partially_paid';
    }
  }

  return { success: true, payment: pay, message: 'Commission payment reconciled.' };
}

export function waiveCommission(ledgerId, adminId, reason) {
  const item = commissionLedger.find((l) => l.id === ledgerId);
  if (!item) return { success: false, message: 'Ledger record not found.' };

  item.waiver_reason = reason;
  item.outstanding_amount = 0;
  item.status = 'waived';
  return { success: true, ledger: item, message: `Commission waived: ${reason}` };
}

export function getAllCommissionPayments() {
  return commissionPayments;
}

export function getAllDisputes() {
  return disputes;
}

// Pan-India Marketplace Aggregated Health
export function getPanIndiaMarketplaceMetrics() {
  // Direct customer payments total (Pure marketplace volume)
  const totalDirectVolume = directPayments
    .filter((p) => p.status === 'vendor_confirmed')
    .reduce((sum, p) => sum + p.amount, 0);

  // 5% Platform Commission
  const totalCommissionEarned = commissionLedger.reduce((sum, c) => sum + c.commission_amount, 0);
  const totalCommissionCollected = commissionLedger.reduce((sum, c) => sum + c.paid_amount, 0);
  const totalCommissionOutstanding = commissionLedger.reduce((sum, c) => sum + c.outstanding_amount, 0);

  return {
    totalDirectVolume,
    totalCommissionEarned,
    totalCommissionCollected,
    totalCommissionOutstanding,
    activeBookingsCount: commissionLedger.length,
    activeDisputesCount: disputes.filter((d) => d.status === 'Open' || d.status === 'Under Review').length,
  };
}
