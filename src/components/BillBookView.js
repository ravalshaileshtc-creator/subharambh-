// ==============================================================================
// SHUBH CELEBRATIONS – UNIVERSAL BILL BOOK VIEW COMPONENT
// 
// Access Controls:
// - Vendor Mode: Available ONLY to approved & active vendors.
//   Includes Create Bill, Edit Draft, Record Payment, View, Print, WhatsApp Share, Financial Summary.
// - Customer Mode: Read-only access to bills issued to customer phone. View, Print, WhatsApp Query.
// - Admin Mode: Global platform view of all vendor bills with vendor and status filters.
// ==============================================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
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
  generateAndDownloadInvoicePDF,
  INVOICE_I18N,
} from '../services/billBookService.js';
import { useTranslation } from '../localization/i18n.js';

export default function BillBookView({
  mode = 'vendor', // 'vendor' | 'customer' | 'admin'
  user,
  onClose,
  initialVendorId = null,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const { t, language, fontFamily } = useTranslation();
  const isMobile = screenWidth < 768;

  // Authorization check for vendors
  const vendorAuth = useMemo(() => {
    if (mode === 'vendor') {
      return canVendorManageBills(user);
    }
    return { allowed: true };
  }, [mode, user]);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'paid' | 'partial' | 'unpaid' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [invoicePreviewModalVisible, setInvoicePreviewModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [editingBillId, setEditingBillId] = useState(null);

  // Multilingual Invoice State ('en' | 'gu' | 'hi')
  const [invoiceLanguage, setInvoiceLanguage] = useState(
    ['en', 'gu', 'hi'].includes(language) ? language : 'en'
  );
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Form State for Create/Edit Bill
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formEventName, setFormEventName] = useState('');
  const [formEventDate, setFormEventDate] = useState('');
  const [formEventLocation, setFormEventLocation] = useState('');
  const [formItems, setFormItems] = useState([
    { id: 1, description: 'Mandap Decoration & Floral Setup', quantity: 1, rate: 35000 },
  ]);
  const [formDiscount, setFormDiscount] = useState('0');
  const [formAdditional, setFormAdditional] = useState('0');
  const [formTaxPercent, setFormTaxPercent] = useState('0');
  const [formAdvancePaid, setFormAdvancePaid] = useState('0');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Cash');
  const [formPaymentRef, setFormPaymentRef] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTerms, setFormTerms] = useState(
    '1. Advance payment confirms event dates.\n2. Balance must be cleared 24h before event setup.\n3. Damage to decor will be charged.'
  );

  // Record Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Cancel Bill Form State
  const [cancelReason, setCancelReason] = useState('');

  // ----------------------------------------------------------------------------
  // LIVE BILLS DATA FETCHING ACCORDING TO ROLE
  // ----------------------------------------------------------------------------
  const bills = useMemo(() => {
    // refreshTrigger dependency forces recalculation
    const _ = refreshTrigger;
    if (mode === 'vendor') {
      return getVendorBills(user, { status: statusFilter, search: searchQuery });
    } else if (mode === 'customer') {
      return getCustomerBills(user, { status: statusFilter, search: searchQuery });
    } else if (mode === 'admin') {
      return getAllPlatformBills(user, { status: statusFilter, search: searchQuery, vendor_id: initialVendorId });
    }
    return [];
  }, [mode, user, statusFilter, searchQuery, refreshTrigger, initialVendorId]);

  const summary = useMemo(() => {
    return getBillsFinancialSummary(bills);
  }, [bills]);

  // Live Auto-Calculation for the Bill Form
  const formCalculations = useMemo(() => {
    return calculateBillTotals({
      items: formItems,
      discount: Number(formDiscount) || 0,
      additionalCharges: Number(formAdditional) || 0,
      taxPercent: Number(formTaxPercent) || 0,
      advancePaid: Number(formAdvancePaid) || 0,
      existingPayments: selectedBill?.payments || [],
    });
  }, [formItems, formDiscount, formAdditional, formTaxPercent, formAdvancePaid, selectedBill]);

  // ----------------------------------------------------------------------------
  // FORM HANDLERS
  // ----------------------------------------------------------------------------
  const resetForm = () => {
    setEditingBillId(null);
    setSelectedBill(null);
    setFormCustomerName('');
    setFormCustomerPhone('');
    setFormEventName('');
    setFormEventDate(new Date().toISOString().split('T')[0]);
    setFormEventLocation(user?.location || 'Godhra, Panchmahal');
    setFormItems([{ id: 1, description: 'Mandap Decoration & Entrance Gate', quantity: 1, rate: 30000 }]);
    setFormDiscount('0');
    setFormAdditional('0');
    setFormTaxPercent('0');
    setFormAdvancePaid('0');
    setFormPaymentMethod('Cash');
    setFormPaymentRef('');
    setFormNotes('Thank you for booking with us! We look forward to creating unforgettable wedding memories.');
    setFormTerms(
      '1. 30% advance required for date reservation.\n2. Balance must be cleared before event commencement.\n3. Govt taxes extra if applicable.'
    );
  };

  const handleOpenCreateModal = () => {
    if (mode === 'vendor' && !vendorAuth.allowed) {
      Alert.alert('Permission Denied', vendorAuth.message);
      return;
    }
    resetForm();
    setCreateModalVisible(true);
  };

  const handleOpenEditModal = (bill) => {
    if (bill.payment_status === 'cancelled') {
      Alert.alert('Notice', 'Cancelled bills cannot be edited.');
      return;
    }
    setEditingBillId(bill.id);
    setSelectedBill(bill);
    setFormCustomerName(bill.customer_name);
    setFormCustomerPhone(bill.customer_phone);
    setFormEventName(bill.event_name);
    setFormEventDate(bill.event_date);
    setFormEventLocation(bill.event_location);
    setFormItems(bill.items.map((it) => ({ ...it })));
    setFormDiscount(String(bill.discount || 0));
    setFormAdditional(String(bill.additional_charges || 0));
    setFormTaxPercent(String(bill.tax_percent || 0));
    setFormAdvancePaid(String(bill.advance_paid || 0));
    setFormPaymentMethod(bill.payment_method || 'Cash');
    setFormNotes(bill.notes || '');
    setFormTerms(bill.terms || '');
    setCreateModalVisible(true);
  };

  const handleAddItemRow = () => {
    setFormItems((prev) => [
      ...prev,
      { id: Date.now(), description: '', quantity: 1, rate: 0 },
    ]);
  };

  const handleRemoveItemRow = (id) => {
    if (formItems.length <= 1) {
      Alert.alert('Notice', 'A bill must have at least one line item.');
      return;
    }
    setFormItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setFormItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            [field]: field === 'description' ? value : Number(value) || 0,
          };
        }
        return it;
      })
    );
  };

  const handleSaveBill = async () => {
    if (!formCustomerName.trim() || formCustomerName.trim().length < 2) {
      Alert.alert('Required Field', 'Please enter customer full name.');
      return;
    }
    const cleanPhone = formCustomerPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      Alert.alert('Required Field', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!formEventName.trim()) {
      Alert.alert('Required Field', 'Please enter event name.');
      return;
    }
    if (!formEventDate.trim()) {
      Alert.alert('Required Field', 'Please enter event date.');
      return;
    }

    const payload = {
      customer_name: formCustomerName.trim(),
      customer_phone: cleanPhone,
      event_name: formEventName.trim(),
      event_date: formEventDate.trim(),
      event_location: formEventLocation.trim(),
      items: formItems,
      discount: Number(formDiscount) || 0,
      additional_charges: Number(formAdditional) || 0,
      tax_percent: Number(formTaxPercent) || 0,
      advance_paid: Number(formAdvancePaid) || 0,
      payment_method: formPaymentMethod,
      payment_reference: formPaymentRef.trim(),
      notes: formNotes.trim(),
      terms: formTerms.trim(),
    };

    if (editingBillId) {
      const res = await updateVendorBill(editingBillId, payload, user);
      if (res.success) {
        Alert.alert('Bill Updated', res.message);
        setCreateModalVisible(false);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        Alert.alert('Error', res.message);
      }
    } else {
      const res = await createVendorBill(payload, user);
      if (res.success) {
        Alert.alert('🎉 Bill Created Successfully', res.message);
        setCreateModalVisible(false);
        setRefreshTrigger((prev) => prev + 1);
        // Automatically open invoice preview
        setSelectedBill(res.bill);
        setInvoicePreviewModalVisible(true);
      } else {
        Alert.alert('Error', res.message);
      }
    }
  };

  // ----------------------------------------------------------------------------
  // PAYMENT RECORDING HANDLER
  // ----------------------------------------------------------------------------
  const handleOpenPaymentModal = (bill) => {
    setSelectedBill(bill);
    setPayAmount(String(bill.balance_due));
    setPayMethod('Cash');
    setPayRef('');
    setPayNotes('');
    setPaymentModalVisible(true);
  };

  const handleSavePayment = async () => {
    const amount = Number(payAmount) || 0;
    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than ₹0.');
      return;
    }
    if (!selectedBill) return;

    const res = await recordBillPayment(
      selectedBill.id,
      {
        amount,
        method: payMethod,
        reference: payRef.trim() || 'Direct Cash/UPI Entry',
        notes: payNotes.trim(),
        date: new Date().toISOString().split('T')[0],
      },
      user
    );

    if (res.success) {
      setPaymentModalVisible(false);
      setSelectedBill(res.bill);
      setSelectedReceiptPayment(res.payment);
      setRefreshTrigger((prev) => prev + 1);
      setReceiptModalVisible(true);
      Alert.alert('🎉 Receipt Generated', res.message);
    } else {
      Alert.alert('Payment Error', res.message);
    }
  };

  // ----------------------------------------------------------------------------
  // RECEIPT MODAL & ACTIONS
  // ----------------------------------------------------------------------------
  const handleOpenReceiptModal = (bill, payment) => {
    setSelectedBill(bill);
    setSelectedReceiptPayment(payment);
    setReceiptModalVisible(true);
  };

  const handlePrintReceipt = (bill = selectedBill, payment = selectedReceiptPayment) => {
    if (!bill || !payment) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const htmlContent = generateA4ReceiptHTML(bill, payment);
      const printWindow = window.open('', '_blank', 'width=750,height=880');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      } else {
        window.print();
      }
    } else {
      Alert.alert('Print Receipt', 'Please use WhatsApp Share to deliver digital payment receipt on mobile.');
    }
  };

  const handleShareReceiptWhatsApp = (bill = selectedBill, payment = selectedReceiptPayment) => {
    if (!bill || !payment) return;
    const text = generateWhatsAppReceiptShareText(bill, payment);
    const url = `https://wa.me/91${bill.customer_phone}?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('WhatsApp Error', 'Could not open WhatsApp on device.');
      });
    }
  };

  // ----------------------------------------------------------------------------
  // CANCELLATION HANDLER
  // ----------------------------------------------------------------------------
  const handleOpenCancelModal = (bill) => {
    setSelectedBill(bill);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBill) return;
    const res = await cancelVendorBill(selectedBill.id, cancelReason.trim(), user);
    if (res.success) {
      Alert.alert('Bill Cancelled', res.message);
      setCancelModalVisible(false);
      setRefreshTrigger((prev) => prev + 1);
    } else {
      Alert.alert('Cancellation Error', res.message);
    }
  };

  // ----------------------------------------------------------------------------
  // DUPLICATE HANDLER
  // ----------------------------------------------------------------------------
  const handleDuplicateBill = async (bill) => {
    const res = await duplicateVendorBill(bill.id, user);
    if (res.success) {
      Alert.alert('Bill Duplicated', `Created fresh copy ${res.bill.bill_number}.`);
      setRefreshTrigger((prev) => prev + 1);
      setSelectedBill(res.bill);
      setInvoicePreviewModalVisible(true);
    } else {
      Alert.alert('Duplication Error', res.message);
    }
  };

  // ----------------------------------------------------------------------------
  // WHATSAPP SHARE, PRINT & DOWNLOAD ACTIONS (PROFESSIONAL A4 LAYOUT)
  // Multilingual Support: English, Gujarati, Hindi
  // ----------------------------------------------------------------------------
  const handleShareWhatsApp = (bill = selectedBill) => {
    if (!bill) return;
    const text = generateWhatsAppInvoiceShareText(bill, invoiceLanguage);
    const url = `https://wa.me/91${bill.customer_phone}?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('WhatsApp Error', 'Could not open WhatsApp on device.');
      });
    }
  };

  const handlePrintInvoice = (bill = selectedBill) => {
    if (!bill) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const htmlContent = generateA4InvoiceHTML(bill, invoiceLanguage);
      const printWindow = window.open('', '_blank', 'width=900,height=960');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 350);
      } else {
        window.print();
      }
    } else {
      Alert.alert('Print / PDF', 'On mobile devices, use WhatsApp Share or capture screenshot for instant A4 PDF.');
    }
  };

  const handleDownloadInvoicePDF = async (bill = selectedBill) => {
    if (!bill || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const res = await generateAndDownloadInvoicePDF(bill, invoiceLanguage);
      if (res && res.success) {
        if (Platform.OS !== 'web') {
          Alert.alert(
            'PDF Generated',
            `Invoice saved as ${res.filename}. You can also share directly on WhatsApp.`
          );
        }
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      Alert.alert(
        'PDF Export Error',
        `Failed to generate PDF invoice: ${err.message || 'Please check network and try again.'}`
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ----------------------------------------------------------------------------
  // RENDER PERMISSION DENIED (PENDING/REJECTED VENDOR)
  // ----------------------------------------------------------------------------
  if (mode === 'vendor' && !vendorAuth.allowed) {
    return (
      <View style={styles.restrictedContainer}>
        <View style={styles.restrictedCard}>
          <Text style={styles.restrictedIcon}>🔒</Text>
          <Text style={styles.restrictedTitle}>Bill Book Restricted</Text>
          <Text style={styles.restrictedText}>{vendorAuth.message}</Text>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Listing Status: {user?.listing_status?.toUpperCase() || 'PENDING'}</Text>
          </View>
          <Text style={styles.restrictedHint}>
            Once the Super Admin verifies your business listing and KYC documents, you will be able to issue unlimited digital invoices, track advances, and record customer payments.
          </Text>
          {onClose && (
            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
              <Text style={styles.closeActionBtnText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ----------------------------------------------------------------------------
  // MAIN BILL BOOK RENDER
  // ----------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            {mode === 'vendor'
              ? `📑 ${user?.business_name || 'Vendor'} – Bill Book`
              : mode === 'customer'
              ? '🧾 My Invoices & Payment Receipts'
              : '📑 Platform Master Bill Book (Super Admin)'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {mode === 'vendor'
              ? 'Create, manage, print and share digital GST & token wedding bills'
              : mode === 'customer'
              ? 'Official tax invoices issued by verified wedding vendors'
              : 'All vendor-generated platform invoices with financial audit trail'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {mode === 'vendor' && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleOpenCreateModal}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>+ Create New Bill</Text>
            </TouchableOpacity>
          )}
          {onClose && (
            <TouchableOpacity style={styles.closeIconButton} onPress={onClose}>
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Financial Overview Cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { borderLeftColor: '#1976D2' }]}>
          <Text style={styles.summaryLabel}>Total Invoiced (₹)</Text>
          <Text style={styles.summaryValue}>₹{summary.totalInvoiced.toLocaleString('en-IN')}</Text>
          <Text style={styles.summarySub}>{summary.totalBills} Total Bills</Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: '#16a34a' }]}>
          <Text style={styles.summaryLabel}>Total Received (₹)</Text>
          <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
            ₹{summary.totalReceived.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summarySub}>{summary.paidCount} Fully Paid</Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: '#D4AF37' }]}>
          <Text style={styles.summaryLabel}>Outstanding Balance (₹)</Text>
          <Text style={[styles.summaryValue, { color: '#d97706' }]}>
            ₹{summary.totalOutstanding.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summarySub}>{summary.partialCount} Partial • {summary.unpaidCount} Unpaid</Text>
        </View>
      </View>

      {/* Search & Status Filter Controls */}
      <View style={styles.filterBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={mode === 'customer' ? 'Search by bill no or vendor name...' : 'Search by bill no or customer name...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          {[
            { id: 'all', label: `All (${summary.totalBills})` },
            { id: 'paid', label: `✅ Paid (${summary.paidCount})` },
            { id: 'partial', label: `⏳ Partial (${summary.partialCount})` },
            { id: 'unpaid', label: `⚠️ Unpaid (${summary.unpaidCount})` },
            { id: 'cancelled', label: `❌ Cancelled (${summary.cancelledCount})` },
          ].map((pill) => (
            <TouchableOpacity
              key={pill.id}
              style={[styles.filterPill, statusFilter === pill.id && styles.filterPillActive]}
              onPress={() => setStatusFilter(pill.id)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  statusFilter === pill.id && styles.filterPillTextActive,
                ]}
              >
                {pill.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bills Listing List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {bills.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>No Bills Found</Text>
            <Text style={styles.emptySubtitle}>
              {mode === 'vendor'
                ? 'You have not created any bills matching the selected filter.'
                : mode === 'customer'
                ? 'No invoices have been issued to your registered mobile number yet.'
                : 'No bills found matching platform criteria.'}
            </Text>
            {mode === 'vendor' && (
              <TouchableOpacity style={styles.createFirstBtn} onPress={handleOpenCreateModal}>
                <Text style={styles.createFirstBtnText}>+ Create Your First Bill</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          bills.map((bill) => {
            const isPaid = bill.payment_status === 'paid';
            const isPartial = bill.payment_status === 'partial';
            const isCancelled = bill.payment_status === 'cancelled';

            return (
              <View key={bill.id} style={styles.billCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.billNumberBadge}>
                      <Text style={styles.billNumberText}>{bill.bill_number}</Text>
                    </View>
                    <Text style={styles.billDateText}>📅 {bill.event_date} (Event)</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isPaid
                        ? styles.statusPaid
                        : isPartial
                        ? styles.statusPartial
                        : isCancelled
                        ? styles.statusCancelled
                        : styles.statusUnpaid,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isPaid
                          ? styles.statusPaidText
                          : isPartial
                          ? styles.statusPartialText
                          : isCancelled
                          ? styles.statusCancelledText
                          : styles.statusUnpaidText,
                      ]}
                    >
                      {bill.payment_status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Event & Parties Information */}
                <View style={styles.cardBody}>
                  <Text style={styles.eventName}>{bill.event_name}</Text>
                  <Text style={styles.cardLocation}>📍 {bill.event_location}</Text>

                  <View style={styles.partiesRow}>
                    <View style={styles.partyBox}>
                      <Text style={styles.partyLabel}>Client:</Text>
                      <Text style={styles.partyValue}>{bill.customer_name}</Text>
                      <Text style={styles.partyPhone}>📞 +91 {bill.customer_phone}</Text>
                    </View>

                    <View style={styles.partyBox}>
                      <Text style={styles.partyLabel}>Vendor:</Text>
                      <Text style={styles.partyValue}>{bill.vendor_name}</Text>
                      <Text style={styles.partyPhone}>📞 +91 {bill.vendor_phone}</Text>
                    </View>
                  </View>

                  {/* Financial Breakdown Summary */}
                  <View style={styles.amountStrip}>
                    <View style={styles.amountCol}>
                      <Text style={styles.amountLabel}>Grand Total</Text>
                      <Text style={styles.amountVal}>₹{Number(bill.grand_total).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.amountCol}>
                      <Text style={styles.amountLabel}>Paid</Text>
                      <Text style={[styles.amountVal, { color: '#16a34a' }]}>
                        ₹{Number(bill.total_paid).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.amountCol}>
                      <Text style={styles.amountLabel}>Balance Due</Text>
                      <Text style={[styles.amountVal, { color: '#d97706', fontWeight: '800' }]}>
                        ₹{Number(bill.balance_due).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Card Action Buttons */}
                <View style={styles.cardFooterActions}>
                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={() => {
                      setSelectedBill(bill);
                      setInvoicePreviewModalVisible(true);
                    }}
                  >
                    <Text style={styles.actionBtnSecondaryText}>📄 View Invoice</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnWhatsApp}
                    onPress={() => handleShareWhatsApp(bill)}
                  >
                    <Text style={styles.actionBtnWhatsAppText}>💬 WhatsApp</Text>
                  </TouchableOpacity>

                  {mode === 'vendor' && !isCancelled && !isPaid && (
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => handleOpenPaymentModal(bill)}
                    >
                      <Text style={styles.actionBtnPrimaryText}>💳 Record Payment</Text>
                    </TouchableOpacity>
                  )}

                  {mode === 'vendor' && !isCancelled && (
                    <TouchableOpacity
                      style={styles.actionBtnIcon}
                      onPress={() => handleOpenEditModal(bill)}
                      title="Edit Bill"
                    >
                      <Text style={styles.actionBtnIconText}>✏️</Text>
                    </TouchableOpacity>
                  )}

                  {mode === 'vendor' && !isCancelled && (
                    <TouchableOpacity
                      style={styles.actionBtnIcon}
                      onPress={() => handleDuplicateBill(bill)}
                      title="Duplicate Bill"
                    >
                      <Text style={styles.actionBtnIconText}>📋</Text>
                    </TouchableOpacity>
                  )}

                  {mode === 'vendor' && !isCancelled && (
                    <TouchableOpacity
                      style={styles.actionBtnIconDanger}
                      onPress={() => handleOpenCancelModal(bill)}
                      title="Cancel Bill"
                    >
                      <Text style={styles.actionBtnIconDangerText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ====================================================================== */}
      {/* MODAL 1: CREATE / EDIT BILL MODAL (VENDORS ONLY) */}
      {/* ====================================================================== */}
      <Modal visible={createModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCardLarge, isMobile && { width: '96%', maxHeight: '92%' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingBillId ? '✏️ Edit Bill' : '📑 Create New Digital Bill'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Issued by: {user?.business_name || 'Vendor'} (+91 {user?.phone})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Client & Event Section */}
              <Text style={styles.formSectionHeader}>1. Customer & Event Details</Text>
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Customer Full Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Rameshchandra Patel"
                    value={formCustomerName}
                    onChangeText={setFormCustomerName}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Customer 10-Digit Mobile *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 9825098765"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={formCustomerPhone}
                    onChangeText={setFormCustomerPhone}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Event / Ceremony Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Royal Wedding & Reception"
                    value={formEventName}
                    onChangeText={setFormEventName}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Event Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 2026-12-18"
                    value={formEventDate}
                    onChangeText={setFormEventDate}
                  />
                </View>
              </View>

              <View style={styles.formFullCol}>
                <Text style={styles.inputLabel}>Event Location / Venue</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Motibaug Party Plot, Godhra"
                  value={formEventLocation}
                  onChangeText={setFormEventLocation}
                />
              </View>

              {/* Line Items Section */}
              <View style={styles.itemsSectionHeaderRow}>
                <Text style={styles.formSectionHeader}>2. Services & Line Items</Text>
                <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItemRow}>
                  <Text style={styles.addItemBtnText}>+ Add Item</Text>
                </TouchableOpacity>
              </View>

              {formItems.map((item, index) => (
                <View key={item.id} style={styles.itemRowCard}>
                  <View style={styles.itemDescCol}>
                    <Text style={styles.subItemLabel}>Description</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Grand Entrance Fiber Gate"
                      value={item.description}
                      onChangeText={(val) => handleItemChange(item.id, 'description', val)}
                    />
                  </View>

                  <View style={styles.itemQtyCol}>
                    <Text style={styles.subItemLabel}>Qty</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={String(item.quantity)}
                      onChangeText={(val) => handleItemChange(item.id, 'quantity', val)}
                    />
                  </View>

                  <View style={styles.itemRateCol}>
                    <Text style={styles.subItemLabel}>Rate (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={String(item.rate)}
                      onChangeText={(val) => handleItemChange(item.id, 'rate', val)}
                    />
                  </View>

                  <View style={styles.itemAmountCol}>
                    <Text style={styles.subItemLabel}>Amount (₹)</Text>
                    <Text style={styles.computedAmount}>
                      ₹{(Number(item.quantity) * Number(item.rate)).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.removeItemBtn}
                    onPress={() => handleRemoveItemRow(item.id)}
                  >
                    <Text style={styles.removeItemBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Discounts, Taxes & Extra Charges */}
              <Text style={styles.formSectionHeader}>3. Financial Adjustments & Advance</Text>
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Discount (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={formDiscount}
                    onChangeText={setFormDiscount}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Extra Charges (₹ Transport/Labor)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={formAdditional}
                    onChangeText={setFormAdditional}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Tax / GST (%)</Text>
                  <View style={styles.taxPillsRow}>
                    {['0', '5', '12', '18'].map((pct) => (
                      <TouchableOpacity
                        key={pct}
                        style={[styles.taxPill, formTaxPercent === pct && styles.taxPillActive]}
                        onPress={() => setFormTaxPercent(pct)}
                      >
                        <Text style={[styles.taxPillText, formTaxPercent === pct && styles.taxPillTextActive]}>
                          {pct}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Advance Payment (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={formAdvancePaid}
                    onChangeText={setFormAdvancePaid}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Payment Method</Text>
                  <View style={styles.taxPillsRow}>
                    {['Cash', 'UPI', 'Bank', 'Cheque'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.taxPill, formPaymentMethod === m && styles.taxPillActive]}
                        onPress={() => setFormPaymentMethod(m)}
                      >
                        <Text style={[styles.taxPillText, formPaymentMethod === m && styles.taxPillTextActive]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Payment Reference / UTR</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. UPI / Cheque Ref"
                    value={formPaymentRef}
                    onChangeText={setFormPaymentRef}
                  />
                </View>
              </View>

              {/* Notes & Terms */}
              <View style={styles.formFullCol}>
                <Text style={styles.inputLabel}>Notes to Customer</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  multiline
                  value={formNotes}
                  onChangeText={setFormNotes}
                />
              </View>

              {/* Live Calculation Box */}
              <View style={styles.liveCalculationCard}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Subtotal:</Text>
                  <Text style={styles.calcVal}>₹{formCalculations.subtotal.toLocaleString('en-IN')}</Text>
                </View>
                {formCalculations.discount > 0 && (
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Discount:</Text>
                    <Text style={[styles.calcVal, { color: '#dc2626' }]}>
                      -₹{formCalculations.discount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
                {formCalculations.additional_charges > 0 && (
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Additional Charges:</Text>
                    <Text style={styles.calcVal}>+₹{formCalculations.additional_charges.toLocaleString('en-IN')}</Text>
                  </View>
                )}
                {formCalculations.tax_amount > 0 && (
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>GST ({formCalculations.tax_percent}%):</Text>
                    <Text style={styles.calcVal}>+₹{formCalculations.tax_amount.toLocaleString('en-IN')}</Text>
                  </View>
                )}
                <View style={[styles.calcRow, styles.calcRowTotal]}>
                  <Text style={styles.calcGrandLabel}>Grand Total:</Text>
                  <Text style={styles.calcGrandVal}>₹{formCalculations.grand_total.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Advance / Paid:</Text>
                  <Text style={[styles.calcVal, { color: '#16a34a' }]}>
                    ₹{formCalculations.total_paid.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.calcRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6 }]}>
                  <Text style={[styles.calcLabel, { fontWeight: '800', color: '#b45309' }]}>Outstanding Balance:</Text>
                  <Text style={[styles.calcVal, { fontWeight: '900', color: '#b45309', fontSize: 16 }]}>
                    ₹{formCalculations.balance_due.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Bottom Save Action */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSaveBill}>
                <Text style={styles.modalSubmitBtnText}>
                  {editingBillId ? 'Save Changes' : 'Issue Bill & Save Invoice ➔'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====================================================================== */}
      {/* MODAL 2: PRINTABLE INVOICE PREVIEW MODAL (PROFESSIONAL BLUE + WHITE + GOLDEN) */}
      {/* Multilingual Support: English, Gujarati, Hindi */}
      {/* ====================================================================== */}
      <Modal visible={invoicePreviewModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.invoicePrintCard, isMobile && { width: '96%', maxHeight: '94%' }]}>
            {/* Top Toolbar */}
            <View style={styles.invoiceToolbar}>
              <View style={styles.toolbarLeft}>
                {/* 3-Pill Language Selector */}
                <View style={styles.langSelectorRow}>
                  <TouchableOpacity
                    style={[styles.langPillBtn, invoiceLanguage === 'en' && styles.langPillBtnActive]}
                    onPress={() => setInvoiceLanguage('en')}
                  >
                    <Text style={[styles.langPillBtnText, invoiceLanguage === 'en' && styles.langPillBtnTextActive]}>
                      English
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.langPillBtn, invoiceLanguage === 'gu' && styles.langPillBtnActive]}
                    onPress={() => setInvoiceLanguage('gu')}
                  >
                    <Text style={[styles.langPillBtnText, invoiceLanguage === 'gu' && styles.langPillBtnTextActive]}>
                      ગુજરાતી
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.langPillBtn, invoiceLanguage === 'hi' && styles.langPillBtnActive]}
                    onPress={() => setInvoiceLanguage('hi')}
                  >
                    <Text style={[styles.langPillBtnText, invoiceLanguage === 'hi' && styles.langPillBtnTextActive]}>
                      हिन्दी
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* PDF Download Button with Loading State */}
                <TouchableOpacity
                  style={[styles.downloadActionBtn, downloadingPdf && styles.downloadActionBtnDisabled]}
                  onPress={() => handleDownloadInvoicePDF(selectedBill)}
                  disabled={downloadingPdf}
                >
                  <Text style={styles.downloadActionBtnText}>
                    {downloadingPdf ? '⏳ Generating PDF...' : '⬇️ Download PDF'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.printActionBtn} onPress={() => handlePrintInvoice(selectedBill)}>
                  <Text style={styles.printActionBtnText}>🖨️ Print Invoice</Text>
                </TouchableOpacity>

                {selectedBill && (
                  <TouchableOpacity
                    style={styles.whatsAppActionBtn}
                    onPress={() => handleShareWhatsApp(selectedBill)}
                  >
                    <Text style={styles.whatsAppActionBtnText}>💬 Share on WhatsApp</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.invoiceCloseBtn}
                onPress={() => setInvoicePreviewModalVisible(false)}
              >
                <Text style={styles.invoiceCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedBill && (() => {
              const activeLabels = INVOICE_I18N[invoiceLanguage] || INVOICE_I18N.en;
              const statusLabel =
                selectedBill.payment_status === 'paid' ? activeLabels.statusPaid :
                selectedBill.payment_status === 'partial' ? activeLabels.statusPartial :
                selectedBill.payment_status === 'cancelled' ? activeLabels.statusCancelled : activeLabels.statusUnpaid;

              return (
                <ScrollView style={styles.invoicePrintBody} showsVerticalScrollIndicator={false}>
                  {/* Brand Banner */}
                  <View style={styles.invoiceBrandBanner}>
                    <Text style={styles.invoiceBrandLogoText}>{activeLabels.brandName}</Text>
                    <Text style={styles.invoiceBrandTagline}>{activeLabels.brandSubtitle}</Text>
                  </View>

                  {/* Letterhead */}
                  <View style={styles.invoiceLetterhead}>
                    <View style={styles.brandTitleCol}>
                      <Text style={styles.invoiceVendorName}>{selectedBill.vendor_name}</Text>
                      <Text style={styles.invoiceVendorSub}>{activeLabels.vendorBadge}</Text>
                      <Text style={styles.invoiceVendorAddress}>📍 {selectedBill.vendor_location}</Text>
                      <Text style={styles.invoiceVendorPhone}>📞 {activeLabels.phone}: +91 {selectedBill.vendor_phone}</Text>
                    </View>
                    <View style={styles.invoiceMetaCol}>
                      <View style={styles.invoiceBadge}>
                        <Text style={styles.invoiceBadgeText}>{activeLabels.taxInvoice}</Text>
                      </View>
                      <Text style={styles.metaRowText}>
                        <Text style={styles.metaBold}>{activeLabels.billNo}: </Text>
                        {selectedBill.bill_number}
                      </Text>
                      <Text style={styles.metaRowText}>
                        <Text style={styles.metaBold}>{activeLabels.billDate}: </Text>
                        {selectedBill.created_at?.split('T')[0] || selectedBill.event_date}
                      </Text>
                      <Text style={styles.metaRowText}>
                        <Text style={styles.metaBold}>{activeLabels.eventDate}: </Text>
                        {selectedBill.event_date}
                      </Text>

                      {/* Status Badge */}
                      <View style={[
                        styles.statusPillBadge,
                        selectedBill.payment_status === 'paid' && styles.statusPillPaid,
                        selectedBill.payment_status === 'partial' && styles.statusPillPartial,
                        selectedBill.payment_status === 'unpaid' && styles.statusPillUnpaid,
                        selectedBill.payment_status === 'cancelled' && styles.statusPillCancelled,
                      ]}>
                        <Text style={[
                          styles.statusPillBadgeText,
                          selectedBill.payment_status === 'paid' && styles.statusPillPaidText,
                          selectedBill.payment_status === 'partial' && styles.statusPillPartialText,
                          selectedBill.payment_status === 'unpaid' && styles.statusPillUnpaidText,
                          selectedBill.payment_status === 'cancelled' && styles.statusPillCancelledText,
                        ]}>
                          {statusLabel.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Client & Event Box */}
                  <View style={styles.clientEventBox}>
                    <View style={styles.clientCol}>
                      <Text style={styles.boxHeaderTitle}>{activeLabels.billedTo}:</Text>
                      <Text style={styles.clientName}>{selectedBill.customer_name}</Text>
                      <Text style={styles.clientPhone}>{activeLabels.phone}: +91 {selectedBill.customer_phone}</Text>
                    </View>
                    <View style={styles.eventCol}>
                      <Text style={styles.boxHeaderTitle}>{activeLabels.eventParticulars}:</Text>
                      <Text style={styles.eventTitle}>{selectedBill.event_name}</Text>
                      <Text style={styles.eventVenue}>{activeLabels.venue}: {selectedBill.event_location}</Text>
                    </View>
                  </View>

                  {/* Itemized Table */}
                  <View style={styles.invoiceTable}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.th, { width: 36, textAlign: 'center' }]}>{activeLabels.srNo}</Text>
                      <Text style={[styles.th, { flex: 1 }]}>{activeLabels.description}</Text>
                      <Text style={[styles.th, { width: 48, textAlign: 'center' }]}>{activeLabels.quantity}</Text>
                      <Text style={[styles.th, { width: 90, textAlign: 'right' }]}>{activeLabels.rate}</Text>
                      <Text style={[styles.th, { width: 90, textAlign: 'right' }]}>{activeLabels.amount}</Text>
                    </View>

                    {(selectedBill.items || []).map((it, idx) => (
                      <View key={it.id || idx} style={[styles.tableDataRow, idx % 2 === 1 && styles.tableDataRowAlt]}>
                        <Text style={[styles.td, { width: 36, textAlign: 'center', color: '#64748b' }]}>
                          {idx + 1}
                        </Text>
                        <Text style={[styles.td, { flex: 1, fontWeight: '600', color: '#1e293b' }]}>
                          {it.description}
                        </Text>
                        <Text style={[styles.td, { width: 48, textAlign: 'center' }]}>{it.quantity}</Text>
                        <Text style={[styles.td, { width: 90, textAlign: 'right' }]}>
                          ₹{Number(it.rate).toLocaleString('en-IN')}
                        </Text>
                        <Text style={[styles.td, { width: 90, textAlign: 'right', fontWeight: '700', color: '#1976D2' }]}>
                          ₹{Number(it.amount).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Totals & Payment Summary Box */}
                  <View style={styles.invoiceFooterSection}>
                    <View style={styles.termsNotesCol}>
                      <Text style={styles.termsTitle}>{activeLabels.termsTitle}:</Text>
                      <Text style={styles.termsText}>{selectedBill.terms || activeLabels.defaultTerms}</Text>

                      {selectedBill.notes ? (
                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.termsTitle}>{activeLabels.notesTitle}:</Text>
                          <Text style={styles.termsText}>{selectedBill.notes}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.totalsCol}>
                      <View style={styles.summaryLine}>
                        <Text style={styles.summaryLineLabel}>{activeLabels.subtotal}:</Text>
                        <Text style={styles.summaryLineVal}>₹{Number(selectedBill.subtotal).toLocaleString('en-IN')}</Text>
                      </View>
                      {selectedBill.discount > 0 && (
                        <View style={styles.summaryLine}>
                          <Text style={styles.summaryLineLabel}>{activeLabels.discount}:</Text>
                          <Text style={[styles.summaryLineVal, { color: '#dc2626' }]}>
                            -₹{Number(selectedBill.discount).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      )}
                      {selectedBill.additional_charges > 0 && (
                        <View style={styles.summaryLine}>
                          <Text style={styles.summaryLineLabel}>{activeLabels.additionalCharges}:</Text>
                          <Text style={styles.summaryLineVal}>
                            +₹{Number(selectedBill.additional_charges).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      )}
                      {selectedBill.tax_amount > 0 && (
                        <View style={styles.summaryLine}>
                          <Text style={styles.summaryLineLabel}>{activeLabels.gst} ({selectedBill.tax_percent}%):</Text>
                          <Text style={styles.summaryLineVal}>
                            +₹{Number(selectedBill.tax_amount).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      )}
                      <View style={styles.grandTotalHighlightBanner}>
                        <Text style={styles.grandTotalBannerLabel}>{activeLabels.grandTotal}:</Text>
                        <Text style={styles.grandTotalBannerVal}>
                          ₹{Number(selectedBill.grand_total).toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.summaryLine}>
                        <Text style={styles.summaryLineLabel}>{activeLabels.totalPaid}:</Text>
                        <Text style={[styles.summaryLineVal, { color: '#15803d', fontWeight: '700' }]}>
                          ₹{Number(selectedBill.total_paid).toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.remainingBalanceHighlightBanner}>
                        <Text style={styles.remainingBalanceBannerLabel}>{activeLabels.remainingBalance}:</Text>
                        <Text style={styles.remainingBalanceBannerVal}>
                          ₹{Number(selectedBill.balance_due).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Payment History Receipts */}
                  {selectedBill.payments && selectedBill.payments.length > 0 && (
                    <View style={styles.paymentHistoryBox}>
                      <Text style={styles.boxHeaderTitle}>{activeLabels.paymentHistoryTitle}:</Text>
                      {selectedBill.payments.map((p, pIdx) => (
                        <View key={p.id || pIdx} style={styles.paymentHistoryRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.receiptIdText}>#{p.id} • {p.date}</Text>
                            <Text style={styles.receiptMethodText}>{p.method} ({p.reference || 'Direct'})</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <Text style={styles.receiptAmountText}>+₹{Number(p.amount).toLocaleString('en-IN')}</Text>
                            <TouchableOpacity
                              style={styles.receiptMiniBtn}
                              onPress={() => handleOpenReceiptModal(selectedBill, p)}
                            >
                              <Text style={styles.receiptMiniBtnText}>🧾 View Receipt</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Signatures Section: Vendor & Customer */}
                  <View style={styles.invoiceSignaturesRow}>
                    <View style={styles.signatureBox}>
                      <Text style={styles.signatureTitle}>{activeLabels.clientSignature}</Text>
                      <Text style={styles.signatureName}>{selectedBill.customer_name}</Text>
                      <Text style={styles.signatureDesc}>{activeLabels.clientSignSub}</Text>
                    </View>
                    <View style={styles.signatureBox}>
                      <Text style={styles.signatureTitle}>{activeLabels.vendorSignature}</Text>
                      <Text style={styles.signatureName}>{selectedBill.vendor_name}</Text>
                      <Text style={styles.signatureDesc}>{activeLabels.vendorSignSub}</Text>
                    </View>
                  </View>

                  {/* Platform Footer */}
                  <View style={styles.invoiceFooterAttribution}>
                    <Text style={styles.platformAttribution}>
                      {activeLabels.footerText}
                    </Text>
                  </View>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ====================================================================== */}
      {/* MODAL 3: RECORD PAYMENT MODAL (VENDORS ONLY) */}
      {/* ====================================================================== */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardSmall}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>💳 Record Payment / Receipt</Text>
                <Text style={styles.modalSubtitle}>Bill: {selectedBill?.bill_number}</Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSmallBody}>
              <View style={styles.balanceInfoBox}>
                <Text style={styles.balanceInfoLabel}>Outstanding Balance:</Text>
                <Text style={styles.balanceInfoVal}>₹{Number(selectedBill?.balance_due || 0).toLocaleString('en-IN')}</Text>
              </View>

              <Text style={styles.inputLabel}>Payment Amount (₹) *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Payment Method *</Text>
              <View style={styles.taxPillsRow}>
                {['Cash', 'UPI', 'Bank', 'Cheque'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.taxPill, payMethod === m && styles.taxPillActive]}
                    onPress={() => setPayMethod(m)}
                  >
                    <Text style={[styles.taxPillText, payMethod === m && styles.taxPillTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Reference / UTR / Receipt No.</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. UTR / Cheque No / Cash Voucher"
                value={payRef}
                onChangeText={setPayRef}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Notes</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Received via PhonePe"
                value={payNotes}
                onChangeText={setPayNotes}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPaymentModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSavePayment}>
                <Text style={styles.modalSubmitBtnText}>Issue Payment Receipt ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====================================================================== */}
      {/* MODAL 4: CANCEL BILL MODAL (VENDORS ONLY) */}
      {/* ====================================================================== */}
      <Modal visible={cancelModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardSmall}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: '#dc2626' }]}>❌ Cancel Bill</Text>
                <Text style={styles.modalSubtitle}>Bill: {selectedBill?.bill_number}</Text>
              </View>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSmallBody}>
              <Text style={styles.warningText}>
                Are you sure you want to cancel this bill? Once cancelled, the outstanding balance will be set to ₹0 and the bill cannot be edited.
              </Text>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Reason for Cancellation *</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                multiline
                placeholder="e.g. Event cancelled by customer / Date shifted"
                value={cancelReason}
                onChangeText={setCancelReason}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCancelModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>No, Keep Active</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#dc2626' }]}
                onPress={handleConfirmCancel}
              >
                <Text style={styles.modalSubmitBtnText}>Yes, Cancel Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====================================================================== */}
      {/* MODAL 5: OFFICIAL PAYMENT RECEIPT SLIP MODAL */}
      {/* ====================================================================== */}
      <Modal visible={receiptModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.receiptSlipCard, isMobile && { width: '96%' }]}>
            {/* Header */}
            <View style={styles.receiptSlipHeader}>
              <View>
                <Text style={styles.receiptSlipBrand}>✨ SHUBH CELEBRATIONS</Text>
                <Text style={styles.receiptSlipBadge}>OFFICIAL PAYMENT RECEIPT</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setReceiptModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedBill && selectedReceiptPayment && (
              <ScrollView style={styles.receiptSlipBody} showsVerticalScrollIndicator={false}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Receipt Number:</Text>
                  <Text style={[styles.receiptRowVal, { color: '#1976D2', fontWeight: '800' }]}>
                    #{selectedReceiptPayment.id}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Payment Date:</Text>
                  <Text style={styles.receiptRowVal}>{selectedReceiptPayment.date}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Linked Bill Number:</Text>
                  <Text style={styles.receiptRowVal}>{selectedBill.bill_number}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Received From (Customer):</Text>
                  <Text style={styles.receiptRowVal}>{selectedBill.customer_name} (+91 {selectedBill.customer_phone})</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Issued By (Vendor):</Text>
                  <Text style={styles.receiptRowVal}>{selectedBill.vendor_name} (+91 {selectedBill.vendor_phone})</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Event Particulars:</Text>
                  <Text style={styles.receiptRowVal}>{selectedBill.event_name} ({selectedBill.event_date})</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Payment Method & Ref:</Text>
                  <Text style={styles.receiptRowVal}>
                    {selectedReceiptPayment.method} ({selectedReceiptPayment.reference || 'Manual Entry'})
                  </Text>
                </View>

                {/* Amount Highlight Card */}
                <View style={styles.receiptAmountCard}>
                  <Text style={styles.receiptAmountCardLabel}>AMOUNT RECEIVED</Text>
                  <Text style={styles.receiptAmountCardVal}>
                    ₹{Number(selectedReceiptPayment.amount).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.receiptAmountCardSub}>
                    Recorded towards Tax Invoice #{selectedBill.bill_number}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Total Invoiced Amount:</Text>
                  <Text style={styles.receiptRowVal}>₹{Number(selectedBill.grand_total).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Total Paid to Date:</Text>
                  <Text style={[styles.receiptRowVal, { color: '#15803d', fontWeight: '800' }]}>
                    ₹{Number(selectedBill.total_paid).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.receiptRow, { backgroundColor: '#fff8e1', paddingHorizontal: 8, borderRadius: 6, borderColor: '#D4AF37', borderWidth: 1 }]}>
                  <Text style={[styles.receiptRowLabel, { color: '#92400e', fontWeight: '800' }]}>Remaining Balance:</Text>
                  <Text style={[styles.receiptRowVal, { color: '#92400e', fontSize: 14, fontWeight: '900' }]}>
                    ₹{Number(selectedBill.balance_due).toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Signatures */}
                <View style={styles.receiptSignaturesRow}>
                  <View style={styles.receiptSignBox}>
                    <Text style={styles.receiptSignTitle}>CLIENT ACKNOWLEDGMENT</Text>
                    <Text style={styles.receiptSignName}>{selectedBill.customer_name}</Text>
                  </View>
                  <View style={styles.receiptSignBox}>
                    <Text style={styles.receiptSignTitle}>AUTHORIZED SIGNATURE</Text>
                    <Text style={styles.receiptSignName}>{selectedBill.vendor_name}</Text>
                  </View>
                </View>

                <View style={styles.receiptActionsRow}>
                  <TouchableOpacity
                    style={styles.printActionBtn}
                    onPress={() => handlePrintReceipt(selectedBill, selectedReceiptPayment)}
                  >
                    <Text style={styles.printActionBtnText}>🖨️ Print Receipt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.whatsAppActionBtn}
                    onPress={() => handleShareReceiptWhatsApp(selectedBill, selectedReceiptPayment)}
                  >
                    <Text style={styles.whatsAppActionBtnText}>💬 Share Receipt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.receiptCloseBtn}
                    onPress={() => setReceiptModalVisible(false)}
                  >
                    <Text style={styles.receiptCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ------------------------------------------------------------------------------
// STYLESHEET (CLEAN WHITE, MODERN SLATE, ROYAL BLUE & GOLD HIGHLIGHTS)
// ------------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#1976D2', // Professional Blue Primary
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  closeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  closeIconText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '700',
  },

  // Summary Cards
  summaryGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 4,
  },
  summarySub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },

  // Filters Bar
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  clearSearchText: {
    fontSize: 14,
    color: '#94a3b8',
    paddingHorizontal: 4,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterPillActive: {
    backgroundColor: '#1976D2',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },

  // List Container & Cards
  listContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 340,
    marginTop: 4,
    marginBottom: 16,
  },
  createFirstBtn: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createFirstBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  billCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  billNumberBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  billNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  billDateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPaid: { backgroundColor: '#dcfce7' },
  statusPartial: { backgroundColor: '#fef3c7' },
  statusUnpaid: { backgroundColor: '#fee2e2' },
  statusCancelled: { backgroundColor: '#f1f5f9' },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  statusPaidText: { color: '#15803d' },
  statusPartialText: { color: '#b45309' },
  statusUnpaidText: { color: '#b91c1c' },
  statusCancelledText: { color: '#64748b' },

  cardBody: {
    marginBottom: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  partiesRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    gap: 12,
  },
  partyBox: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  partyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  partyPhone: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  amountStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  amountCol: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  amountVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 1,
  },

  cardFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  actionBtnWhatsApp: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnWhatsAppText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  actionBtnPrimary: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnIconText: {
    fontSize: 13,
  },
  actionBtnIconDanger: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnIconDangerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },

  // Modals Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCardLarge: {
    width: '90%',
    maxWidth: 780,
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  modalCardSmall: {
    width: '90%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  modalScrollBody: {
    padding: 20,
  },
  modalSmallBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalSubmitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#1976D2',
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Form Fields
  formSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 10,
    marginTop: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  formCol: {
    flex: 1,
  },
  formFullCol: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  itemsSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  addItemBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  itemRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  itemDescCol: { flex: 3 },
  itemQtyCol: { flex: 1 },
  itemRateCol: { flex: 1.5 },
  itemAmountCol: { flex: 1.5, alignItems: 'flex-end' },
  subItemLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', marginBottom: 2 },
  computedAmount: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  removeItemBtn: { padding: 6 },
  removeItemBtnText: { color: '#dc2626', fontSize: 14, fontWeight: '800' },

  taxPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  taxPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  taxPillActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1565C0',
  },
  taxPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  taxPillTextActive: {
    color: '#ffffff',
  },

  liveCalculationCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 14,
    marginTop: 14,
    marginBottom: 10,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  calcRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#fde68a',
    paddingTop: 6,
    marginTop: 4,
  },
  calcLabel: { fontSize: 12, color: '#78350f', fontWeight: '600' },
  calcVal: { fontSize: 12, color: '#78350f', fontWeight: '700' },
  calcGrandLabel: { fontSize: 14, color: '#78350f', fontWeight: '800' },
  calcGrandVal: { fontSize: 15, color: '#78350f', fontWeight: '900' },

  // Invoice Print Preview Card (Professional Blue #1976D2, Pure White #FFFFFF, Golden #D4AF37)
  invoicePrintCard: {
    width: '90%',
    maxWidth: 820,
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  invoiceToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  langSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e2e8f0',
    padding: 3,
    borderRadius: 6,
  },
  langPillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  langPillBtnActive: {
    backgroundColor: '#1976D2',
  },
  langPillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  langPillBtnTextActive: {
    color: '#ffffff',
  },
  downloadActionBtnDisabled: {
    opacity: 0.65,
  },
  printActionBtn: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1565C0',
  },
  printActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  downloadActionBtn: {
    backgroundColor: '#0D47A1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  downloadActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  whatsAppActionBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  whatsAppActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  invoiceCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceCloseBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  invoicePrintBody: {
    padding: 20,
    backgroundColor: '#ffffff',
  },

  // Branding Top Banner
  invoiceBrandBanner: {
    backgroundColor: '#1976D2',
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  invoiceBrandLogoText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  invoiceBrandTagline: {
    fontSize: 11,
    color: '#FFF9C4',
    fontWeight: '600',
  },

  invoiceLetterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 14,
    marginBottom: 14,
  },
  brandTitleCol: {
    flex: 1,
  },
  invoiceVendorName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1976D2',
  },
  invoiceVendorSub: {
    fontSize: 11,
    color: '#D4AF37',
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invoiceVendorAddress: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  invoiceVendorPhone: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  invoiceMetaCol: {
    alignItems: 'flex-end',
  },
  invoiceBadge: {
    backgroundColor: '#1976D2',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
  },
  invoiceBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  metaRowText: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 1,
  },
  metaBold: {
    fontWeight: '700',
    color: '#1e293b',
  },

  // Status Pill Badges
  statusPillBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillPaid: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  statusPillPartial: { backgroundColor: '#fff8e1', borderColor: '#D4AF37' },
  statusPillUnpaid: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  statusPillCancelled: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  statusPillBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  statusPillPaidText: { color: '#15803d' },
  statusPillPartialText: { color: '#b45309' },
  statusPillUnpaidText: { color: '#dc2626' },
  statusPillCancelledText: { color: '#64748b' },

  clientEventBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 16,
    gap: 16,
  },
  clientCol: {
    flex: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#1976D2',
    paddingLeft: 10,
  },
  eventCol: {
    flex: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
    paddingLeft: 10,
  },
  boxHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1976D2',
    textTransform: 'uppercase',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  clientName: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  clientPhone: { fontSize: 11, color: '#475569', marginTop: 1 },
  eventTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  eventVenue: { fontSize: 11, color: '#475569', marginTop: 1 },

  // Table (Professional Blue Header, Golden Border)
  invoiceTable: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    borderBottomWidth: 2,
    borderBottomColor: '#D4AF37',
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  th: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableDataRowAlt: {
    backgroundColor: '#f8fafc',
  },
  td: {
    fontSize: 11,
    color: '#334155',
  },

  invoiceFooterSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  termsNotesCol: {
    flex: 1.2,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1976D2',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  termsText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  totalsCol: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  summaryLineLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  summaryLineVal: { fontSize: 11, color: '#1e293b', fontWeight: '700' },

  grandTotalHighlightBanner: {
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 4,
  },
  grandTotalBannerLabel: { fontSize: 12, color: '#ffffff', fontWeight: '800' },
  grandTotalBannerVal: { fontSize: 14, color: '#ffffff', fontWeight: '900' },

  remainingBalanceHighlightBanner: {
    backgroundColor: '#fff8e1',
    borderTopWidth: 2,
    borderTopColor: '#D4AF37',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  remainingBalanceBannerLabel: { fontSize: 12, color: '#92400e', fontWeight: '800' },
  remainingBalanceBannerVal: { fontSize: 14, color: '#92400e', fontWeight: '900' },

  // Payments History Box
  paymentHistoryBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  paymentHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  receiptIdText: { fontSize: 11, fontWeight: '700', color: '#15803d' },
  receiptDateText: { fontSize: 11, color: '#64748b' },
  receiptMethodText: { fontSize: 11, color: '#475569' },
  receiptAmountText: { fontSize: 11, fontWeight: '800', color: '#15803d' },
  receiptMiniBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  receiptMiniBtnText: {
    fontSize: 10,
    color: '#15803d',
    fontWeight: '700',
  },

  // Both Signatures Section
  invoiceSignaturesRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 30,
  },
  signatureBox: {
    flex: 1,
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#94a3b8',
    borderStyle: 'dashed',
    paddingTop: 8,
    marginTop: 24,
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1976D2',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signatureName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  signatureDesc: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },

  invoiceFooterAttribution: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  platformAttribution: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Payment Receipt Slip Modal (MODAL 5)
  receiptSlipCard: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  receiptSlipHeader: {
    backgroundColor: '#1976D2',
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptSlipBrand: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  receiptSlipBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF9C4',
    letterSpacing: 0.5,
  },
  receiptSlipBody: {
    padding: 18,
    backgroundColor: '#ffffff',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  receiptRowLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  receiptRowVal: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  receiptAmountCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#86efac',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    alignItems: 'center',
  },
  receiptAmountCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  receiptAmountCardVal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#15803d',
    marginVertical: 2,
  },
  receiptAmountCardSub: {
    fontSize: 11,
    color: '#475569',
  },
  receiptSignaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  receiptSignBox: {
    flex: 1,
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#94a3b8',
    borderStyle: 'dashed',
    paddingTop: 6,
  },
  receiptSignTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1976D2',
    letterSpacing: 0.5,
  },
  receiptSignName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  receiptActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  receiptCloseBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptCloseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },

  // Payment Small Modal
  balanceInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 7,
    marginBottom: 12,
  },
  balanceInfoLabel: { fontSize: 12, fontWeight: '700', color: '#92400e' },
  balanceInfoVal: { fontSize: 14, fontWeight: '900', color: '#92400e' },
  warningText: { fontSize: 13, color: '#64748b', lineHeight: 18 },

  // Restricted Access View
  restrictedContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  restrictedCard: {
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  restrictedIcon: { fontSize: 40, marginBottom: 12 },
  restrictedTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  restrictedText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 14,
  },
  pendingBadgeText: { fontSize: 11, fontWeight: '800', color: '#b45309' },
  restrictedHint: { fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  closeActionBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
  },
  closeActionBtnText: { fontSize: 13, fontWeight: '700', color: '#475569' },
});
