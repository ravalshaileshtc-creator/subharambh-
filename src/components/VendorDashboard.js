import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import {
  getVendorBookings,
  updateBookingStatusByVendor,
} from '../services/rbacService';
import {
  getDirectPayments,
  confirmDirectPaymentByVendor,
  disputeDirectPayment,
  getVendorCommissionLedger,
  getVendorOutstandingCommission,
  submitVendorCommissionPayment,
  generateCommissionOnEventCompletion,
} from '../services/marketplaceEngine';
import { PAN_INDIA_CITIES } from '../constants/panIndiaLocations';
import {
  getVendorPackages,
  addVendorPackage,
  updateVendorPackage,
  deleteVendorPackage,
  getVendorPortfolio,
  addVendorPortfolioPhoto,
  deleteVendorPortfolioPhoto,
  getVendorProfileCompletion,
} from '../services/marketplaceService';
import BillBookView from './BillBookView';

export default function VendorDashboard({
  user,
  vendor,
  onOpenCalendar,
  onOpenAuthModal,
  onLogout,
}) {
  const [subTab, setSubTab] = useState('requests'); // 'requests' | 'direct_payments' | 'commission' | 'coverage' | 'services' | 'reviews'
  const [bookingsList, setBookingsList] = useState(getVendorBookings());
  const [directPays, setDirectPays] = useState(getDirectPayments());
  const [commLedger, setCommLedger] = useState(getVendorCommissionLedger(user?.vendor_id || 1));
  const [serviceCities, setServiceCities] = useState(user?.service_cities || ['Godhra', 'Halol', 'Vadodara', 'Kalol (Panchmahal)']);
  
  const myVendorId = user?.vendor_id || vendor?.id || 1;
  const outstandingCommission = getVendorOutstandingCommission(myVendorId);

  // Packages & Portfolio state
  const [packagesList, setPackagesList] = useState(getVendorPackages(myVendorId));
  const [portfolioPhotos, setPortfolioPhotos] = useState(
    getVendorPortfolio({ id: myVendorId })?.photos || []
  );
  const [serviceRadius, setServiceRadius] = useState(vendor?.service_radius_km || 50);

  // Add / Edit Package Modal state
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgCategory, setPkgCategory] = useState(user?.category || 'mandap');
  const [pkgIncludes, setPkgIncludes] = useState('');

  // Add Photo Modal state
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaptionInput, setPhotoCaptionInput] = useState('');
  const [photoCategoryInput, setPhotoCategoryInput] = useState('decor');

  // Commission payment submission form state
  const [payModalLedgerId, setPayModalLedgerId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payUtr, setPayUtr] = useState('');

  const profileCompletion = getVendorProfileCompletion(
    { ...user, ...vendor, service_cities: serviceCities },
    { photos: portfolioPhotos, packages: packagesList }
  );

  const handleOpenAddPackage = () => {
    setEditingPackageId(null);
    setPkgName('');
    setPkgPrice('');
    setPkgCategory(user?.category || 'mandap');
    setPkgIncludes('');
    setPackageModalVisible(true);
  };

  const handleOpenEditPackage = (pkg) => {
    setEditingPackageId(pkg.id || pkg.name);
    setPkgName(pkg.name);
    setPkgPrice(pkg.price);
    setPkgCategory(pkg.category || user?.category || 'mandap');
    setPkgIncludes(pkg.includes);
    setPackageModalVisible(true);
  };

  const handleSavePackage = () => {
    if (!pkgName.trim()) {
      Alert.alert('Required', 'Please enter a package name.');
      return;
    }
    if (!pkgPrice.trim()) {
      Alert.alert('Required', 'Please enter pricing / rate.');
      return;
    }

    if (editingPackageId) {
      updateVendorPackage(myVendorId, editingPackageId, {
        name: pkgName.trim(),
        price: pkgPrice.trim(),
        category: pkgCategory,
        includes: pkgIncludes.trim(),
      });
      Alert.alert('Package Updated ✅', `"${pkgName}" package has been successfully updated.`);
    } else {
      addVendorPackage(myVendorId, {
        name: pkgName.trim(),
        price: pkgPrice.trim(),
        category: pkgCategory,
        includes: pkgIncludes.trim(),
      });
      Alert.alert('Service Added! 🎉', `"${pkgName}" is now active and listed in the Customer Portal.`);
    }

    setPackagesList([...getVendorPackages(myVendorId)]);
    setPackageModalVisible(false);
  };

  const handleDeletePackage = (pkgId, name) => {
    Alert.alert('Delete Service Package', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteVendorPackage(myVendorId, pkgId);
          setPackagesList([...getVendorPackages(myVendorId)]);
          Alert.alert('Deleted', 'Service package has been removed.');
        },
      },
    ]);
  };

  const handleAddPhotoSubmit = () => {
    if (!photoUrlInput.trim() || !photoUrlInput.startsWith('http')) {
      Alert.alert('Invalid URL', 'Please enter a valid image URL (https://...).');
      return;
    }
    addVendorPortfolioPhoto(myVendorId, {
      url: photoUrlInput.trim(),
      caption: photoCaptionInput.trim() || `${user?.business_name || 'Vendor'} Work`,
      category: photoCategoryInput,
    });
    setPortfolioPhotos([...(getVendorPortfolio({ id: myVendorId })?.photos || [])]);
    setPhotoUrlInput('');
    setPhotoCaptionInput('');
    setPhotoModalVisible(false);
    Alert.alert('Photo Added! 📸', 'New service photo has been published to your portfolio.');
  };

  const handleDeletePhoto = (photoId) => {
    Alert.alert('Delete Photo', 'Remove this photo from your portfolio?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteVendorPortfolioPhoto(myVendorId, photoId);
          setPortfolioPhotos([...(getVendorPortfolio({ id: myVendorId })?.photos || [])]);
          Alert.alert('Deleted', 'Photo removed from portfolio.');
        },
      },
    ]);
  };

  const handleBookingAction = (bookingId, action) => {
    const res = updateBookingStatusByVendor(bookingId, action === 'accept' ? 'Confirmed' : 'Cancelled');
    if (!res.success) {
      Alert.alert('Action Failed', res.message);
    } else {
      Alert.alert('Status Updated', `Booking has been ${action === 'accept' ? 'CONFIRMED ✅' : 'REJECTED ❌'}.`);
      setBookingsList(getVendorBookings());
    }
  };

  const handleCompleteEvent = (item) => {
    Alert.alert(
      'Mark Event Completed?',
      `Confirm that the event for "${item.customer_name}" on ${item.event_date} has finished successfully?\n\nAs per pure marketplace business rules, 5% platform commission (₹${(item.total_booking_amount * 0.05).toLocaleString('en-IN')}) will be recorded in your commission ledger.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Event Completed 🏆',
          onPress: () => {
            item.booking_status = 'Completed';
            const res = generateCommissionOnEventCompletion(item);
            Alert.alert('Event Completed! 🏆', `5% Platform Commission of ₹${res.ledger.commission_amount.toLocaleString('en-IN')} has been posted to your statement. Due date: ${res.ledger.due_date}.`);
            setCommLedger([...getVendorCommissionLedger(myVendorId)]);
            setBookingsList([...getVendorBookings()]);
          },
        },
      ]
    );
  };

  const handleConfirmDirectPayment = (paymentId) => {
    const res = confirmDirectPaymentByVendor(paymentId, myVendorId);
    if (res.success) {
      Alert.alert('Payment Confirmed ✅', 'You have confirmed receipt of customer funds directly into your account.');
      setDirectPays([...getDirectPayments()]);
    } else {
      Alert.alert('Failed', res.message);
    }
  };

  const handleDisputePayment = (paymentId) => {
    Alert.prompt
      ? Alert.prompt('Dispute Payment', 'Reason payment was not received:', (text) => {
          disputeDirectPayment(paymentId, text || 'Money not credited to bank account');
          setDirectPays([...getDirectPayments()]);
          Alert.alert('Dispute Logged', 'Admin team notified for reconciliation.');
        })
      : (() => {
          disputeDirectPayment(paymentId, 'Money not credited to vendor UPI/bank account.');
          setDirectPays([...getDirectPayments()]);
          Alert.alert('Dispute Logged', 'Admin team notified for reconciliation.');
        })();
  };

  const handlePayCommissionSubmit = () => {
    if (!payAmount.trim() || Number(payAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Enter valid commission amount to pay.');
      return;
    }
    if (!payUtr.trim()) {
      Alert.alert('UTR Required', 'Please enter UPI transaction reference or Bank UTR number.');
      return;
    }

    const res = submitVendorCommissionPayment({
      ledger_id: payModalLedgerId,
      vendor_id: myVendorId,
      vendor_name: user?.business_name || 'Vendor Partner',
      amount: Number(payAmount),
      payment_mode: 'UPI',
      transaction_ref: payUtr.trim(),
    });

    if (res.success) {
      Alert.alert('Proof Submitted ✅', 'Your 5% commission payment has been submitted for Admin bank reconciliation.');
      setPayModalLedgerId(null);
      setPayAmount('');
      setPayUtr('');
      setCommLedger([...getVendorCommissionLedger(myVendorId)]);
    }
  };

  const totalDirectEarnings = bookingsList.reduce((sum, b) => sum + (Number(b.total_booking_amount) || 0), 0);

  return (
    <View style={styles.container}>
      {/* Vendor Top Header Banner */}
      <View style={styles.vendorBar}>
        <View style={styles.vendorLeft}>
          <Image
            source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200' }}
            style={styles.avatar}
          />
          <View>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>🏪 PURE MARKETPLACE VENDOR</Text>
            </View>
            <Text style={styles.vendorName}>{user.business_name || user.full_name}</Text>
            <Text style={styles.vendorMeta}>
              ✓ Free Listing Active • 5% Commission Model • {user.city_name || 'Godhra'} Hub
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.switchRoleBtn} onPress={onOpenAuthModal}>
          <Text style={styles.switchRoleText}>Switch Role 🔁</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Completion & Verification Status Indicator */}
      <View style={styles.profileProgressBarBox}>
        <View style={styles.profileProgressTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.profileProgressTitle}>Profile Health & Readiness</Text>
            <View style={styles.approvedVendorBadge}>
              <Text style={styles.approvedVendorBadgeText}>✓ APPROVED VENDOR</Text>
            </View>
          </View>
          <Text style={styles.profileProgressPercent}>{profileCompletion.score}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${profileCompletion.score}%` }]} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.checklistRow}>
          {profileCompletion.checks.map((c, i) => (
            <View key={i} style={[styles.checkChip, c.done ? styles.checkChipDone : styles.checkChipPending]}>
              <Text style={[styles.checkChipText, c.done ? styles.checkChipTextDone : styles.checkChipTextPending]}>
                {c.done ? '✓' : '○'} {c.label}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Commission Due Sticky Pill (If Any Outstanding) */}
      {outstandingCommission > 0 && (
        <View style={styles.outstandingAlert}>
          <Text style={styles.outstandingText}>
            🔔 Outstanding 5% Platform Commission: <Text style={{ fontWeight: '900' }}>₹{outstandingCommission.toLocaleString('en-IN')}</Text>
          </Text>
          <TouchableOpacity style={styles.payNowPill} onPress={() => setSubTab('commission')}>
            <Text style={styles.payNowPillText}>View & Pay ➔</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Vendor Horizontal Navigation Tabs */}
      <View style={styles.tabBarWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, subTab === 'requests' && styles.tabActive]}
            onPress={() => setSubTab('requests')}
          >
            <Text style={[styles.tabText, subTab === 'requests' && styles.tabTextActive]}>
              📩 Bookings ({bookingsList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, subTab === 'direct_payments' && styles.tabActive]}
            onPress={() => setSubTab('direct_payments')}
          >
            <Text style={[styles.tabText, subTab === 'direct_payments' && styles.tabTextActive]}>
              💳 Direct Payments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, subTab === 'bill_book' && styles.tabActive]}
            onPress={() => setSubTab('bill_book')}
          >
            <Text style={[styles.tabText, subTab === 'bill_book' && styles.tabTextActive]}>
              📑 Bill Book & Invoices
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, subTab === 'commission' && styles.tabActive]}
            onPress={() => setSubTab('commission')}
          >
            <Text style={[styles.tabText, subTab === 'commission' && styles.tabTextActive]}>
              🧾 5% Commission
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, subTab === 'coverage' && styles.tabActive]}
            onPress={() => setSubTab('coverage')}
          >
            <Text style={[styles.tabText, subTab === 'coverage' && styles.tabTextActive]}>
              📍 Service Coverage ({serviceCities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, subTab === 'services' && styles.tabActive]}
            onPress={() => setSubTab('services')}
          >
            <Text style={[styles.tabText, subTab === 'services' && styles.tabTextActive]}>
              📦 Services & Rates
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, subTab === 'reviews' && styles.tabActive]}
            onPress={() => setSubTab('reviews')}
          >
            <Text style={[styles.tabText, subTab === 'reviews' && styles.tabTextActive]}>
              ⭐ Reviews (4.8)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* TAB 1: BOOKING REQUESTS & EVENT COMPLETION */}
        {subTab === 'requests' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Enquiries & Assigned Events</Text>
            <Text style={styles.sectionSub}>Customer pays you directly. Mark event completed once service is delivered.</Text>

            {bookingsList.map((item) => {
              const isPending = item.booking_status === 'Pending';
              const isCompleted = item.booking_status === 'Completed';

              return (
                <View key={item.id} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <View>
                      <Text style={styles.bookingCode}>{item.booking_code}</Text>
                      <Text style={styles.eventTitle}>
                        {item.event_type} • {item.guest_count}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted
                          ? styles.statusCompleted
                          : item.booking_status === 'Confirmed'
                          ? styles.statusConfirmed
                          : styles.statusPending,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {isCompleted ? '🏆 COMPLETED' : item.booking_status ? item.booking_status.toUpperCase() : 'PENDING'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookingDetailsBox}>
                    <Text style={styles.detailLine}>👤 Client: {item.customer_name} (📞 +91 {item.customer_phone})</Text>
                    <Text style={styles.detailLine}>📅 Date: {item.event_date}</Text>
                    <Text style={styles.detailLine}>📍 Venue: {item.venue_address || 'Panchmahal, Gujarat'}</Text>
                    <Text style={styles.detailPrice}>
                      Total Agreed Value: ₹{(item.total_booking_amount || 0).toLocaleString('en-IN')} (Direct Pay)
                    </Text>
                  </View>

                  {/* Actions */}
                  {isPending ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleBookingAction(item.id, 'accept')}
                      >
                        <Text style={styles.acceptBtnText}>✓ Accept Booking</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleBookingAction(item.id, 'reject')}
                      >
                        <Text style={styles.rejectBtnText}>✕ Decline</Text>
                      </TouchableOpacity>
                    </View>
                  ) : !isCompleted ? (
                    <View style={styles.completeEventRow}>
                      <TouchableOpacity
                        style={styles.completeEventBtn}
                        onPress={() => handleCompleteEvent(item)}
                      >
                        <Text style={styles.completeEventBtnText}>🏆 Mark Event Completed (Trigger 5% Statement)</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.completedNoticeBox}>
                      <Text style={styles.completedNoticeText}>
                        ✅ Event delivered successfully. 5% platform fee: ₹{(item.total_booking_amount * 0.05).toLocaleString('en-IN')}.
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 2: DIRECT CUSTOMER PAYMENTS (CONFIRM RECEIPT) */}
        {subTab === 'direct_payments' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Direct Customer Payment Confirmations</Text>
            <Text style={styles.sectionSub}>
              Customer pays you directly. Confirm receipt to keep customer records updated and build trust.
            </Text>

            {directPays.map((p) => (
              <View key={p.id} style={styles.directPayCard}>
                <View style={styles.directPayHead}>
                  <View>
                    <Text style={styles.directPayAmount}>₹{p.amount.toLocaleString('en-IN')}</Text>
                    <Text style={styles.directPayMethod}>{p.payment_method} • Ref: {p.payment_reference}</Text>
                  </View>
                  <View style={[styles.statusBadge, p.vendor_confirmation ? styles.statusConfirmed : styles.statusPending]}>
                    <Text style={styles.statusBadgeText}>
                      {p.vendor_confirmation ? '✓ CONFIRMED' : 'WAITING VENDOR'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.directPayMeta}>
                  From: {p.customer_name} for Booking {p.booking_code} on {p.payment_date}
                </Text>
                {p.notes ? <Text style={styles.directPayNotes}>Client Note: "{p.notes}"</Text> : null}

                {!p.vendor_confirmation ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.confirmPayBtn}
                      onPress={() => handleConfirmDirectPayment(p.id)}
                    >
                      <Text style={styles.confirmPayText}>✓ Confirm Receipt in My Bank</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.disputePayBtn}
                      onPress={() => handleDisputePayment(p.id)}
                    >
                      <Text style={styles.disputePayText}>⚠️ Not Received</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.confirmedAck}>
                    ✅ You acknowledged receipt of this payment directly into your account.
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* TAB: BILL BOOK & INVOICES (VENDORS ONLY) */}
        {subTab === 'bill_book' && (
          <View style={{ minHeight: 650, backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            <BillBookView mode="vendor" user={user} />
          </View>
        )}

        {/* TAB 3: 5% COMMISSION STATEMENTS & SETTLEMENT */}
        {subTab === 'commission' && (
          <View style={styles.section}>
            <View style={styles.commSummaryCard}>
              <Text style={styles.commSummaryTitle}>5% Marketplace Commission Statement</Text>
              <Text style={styles.commSummarySub}>
                Shubh Celebrations provides free listing and free customer enquiries. A fixed 5% platform fee is payable only upon completed bookings.
              </Text>

              <View style={styles.commKpiRow}>
                <View style={styles.commKpi}>
                  <Text style={styles.commKpiLabel}>Outstanding Due</Text>
                  <Text style={[styles.commKpiVal, { color: outstandingCommission > 0 ? '#dc2626' : '#15803d' }]}>
                    ₹{outstandingCommission.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.commKpi}>
                  <Text style={styles.commKpiLabel}>Fixed Rate</Text>
                  <Text style={styles.commKpiVal}>5.0%</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Commission Ledger Records</Text>

            {commLedger.map((c) => (
              <View key={c.id} style={styles.commItemCard}>
                <View style={styles.commItemHead}>
                  <View>
                    <Text style={styles.commBookingCode}>{c.booking_code}</Text>
                    <Text style={styles.commEligible}>Booking Total: ₹{c.eligible_amount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[styles.statusBadge, c.status === 'paid' ? styles.statusConfirmed : styles.statusPending]}>
                    <Text style={styles.statusBadgeText}>{c.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.commMathRow}>
                  <Text style={styles.commMathText}>
                    5% Platform Fee: <Text style={{ fontWeight: '800' }}>₹{c.commission_amount.toLocaleString('en-IN')}</Text>
                  </Text>
                  <Text style={styles.commDueDate}>Due: {c.due_date}</Text>
                </View>

                {c.outstanding_amount > 0 ? (
                  <View style={styles.commPayRow}>
                    <Text style={styles.commDueText}>Balance: ₹{c.outstanding_amount.toLocaleString('en-IN')}</Text>
                    <TouchableOpacity
                      style={styles.submitUtrBtn}
                      onPress={() => {
                        setPayModalLedgerId(c.id);
                        setPayAmount(String(c.outstanding_amount));
                      }}
                    >
                      <Text style={styles.submitUtrText}>Submit Bank/UPI Proof ➔</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.settledNote}>✓ Settled with Shubh Celebrations</Text>
                )}
              </View>
            ))}

            {/* In-Line Payment Proof Submission Form */}
            {payModalLedgerId && (
              <View style={styles.proofFormBox}>
                <Text style={styles.proofFormTitle}>Submit 5% Commission Payment Proof</Text>
                <Text style={styles.proofFormSub}>Pay to: shubhcelebrations@icici (Current Account) or Scan Shubh QR</Text>

                <Text style={styles.inputLabel}>Amount Paid (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={payAmount}
                  onChangeText={setPayAmount}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>UPI Reference / Bank UTR Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. UPI/2026/99120489"
                  placeholderTextColor="#94a3b8"
                  value={payUtr}
                  onChangeText={setPayUtr}
                />

                <View style={styles.formBtnRow}>
                  <TouchableOpacity style={styles.formSubmitBtn} onPress={handlePayCommissionSubmit}>
                    <Text style={styles.formSubmitText}>Submit for Admin Verification ✅</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.formCancelBtn} onPress={() => setPayModalLedgerId(null)}>
                    <Text style={styles.formCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TAB 4: SERVICE COVERAGE (MULTI-CITY ALL INDIA) */}
        {subTab === 'coverage' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pan-India Service Cities & Areas</Text>
            <Text style={styles.sectionSub}>Select multiple cities where your team travels to deliver wedding & event setups.</Text>

            {/* Travel Radius Selector */}
            <Text style={[styles.sectionTitle, { marginTop: 10, fontSize: 13 }]}>Travel & Delivery Radius:</Text>
            <View style={styles.radiusOptionsRow}>
              {[10, 25, 50, 100, 'ALL'].map((r) => {
                const isActive = serviceRadius === r;
                return (
                  <TouchableOpacity
                    key={String(r)}
                    style={[styles.radiusChip, isActive && styles.radiusChipActive]}
                    onPress={() => setServiceRadius(r)}
                  >
                    <Text style={[styles.radiusChipText, isActive && styles.radiusChipTextActive]}>
                      {r === 'ALL' ? 'All India 🇮🇳' : `${r} km`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.cityPillsWrap}>
              {serviceCities.map((city) => (
                <View key={city} style={styles.cityPillActive}>
                  <Text style={styles.cityPillText}>📍 {city}</Text>
                  <TouchableOpacity
                    onPress={() => setServiceCities(serviceCities.filter((c) => c !== city))}
                    style={{ marginLeft: 4 }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Add Major Indian Event Destinations:</Text>
            <View style={styles.addCityList}>
              {['Ahmedabad', 'Surat', 'Vadodara', 'Halol', 'Kalol (Panchmahal)', 'Udaipur (Royal Weddings)', 'Jaipur', 'Mumbai', 'Pune', 'New Delhi', 'Indore'].map((dest) => {
                const isAdded = serviceCities.includes(dest);
                return (
                  <TouchableOpacity
                    key={dest}
                    style={[styles.destChip, isAdded && styles.destChipSelected]}
                    onPress={() => {
                      if (isAdded) {
                        setServiceCities(serviceCities.filter((c) => c !== dest));
                      } else {
                        setServiceCities([...serviceCities, dest]);
                      }
                    }}
                  >
                    <Text style={[styles.destChipText, isAdded && styles.destChipTextSelected]}>
                      {isAdded ? '✓ ' : '+ '} {dest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.saveCoverageBtn}
              onPress={() => {
                Alert.alert('Coverage Updated ✅', `Your service radius (${serviceRadius === 'ALL' ? 'All India' : serviceRadius + ' km'}) and ${serviceCities.length} service cities have been saved!`);
              }}
            >
              <Text style={styles.saveCoverageBtnText}>Save Service Area Settings 💾</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 5: SERVICES & PACKAGES */}
        {subTab === 'services' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Your Listed Packages & Services</Text>
                <Text style={styles.sectionSub}>All packages appear directly in the Customer Portal for instant enquiry & direct booking.</Text>
              </View>
              <TouchableOpacity style={styles.addServiceBtn} onPress={handleOpenAddPackage} activeOpacity={0.85}>
                <Text style={styles.addServiceBtnText}>+ Add Service</Text>
              </TouchableOpacity>
            </View>

            {packagesList.length === 0 ? (
              <View style={styles.emptyPackagesBox}>
                <Text style={styles.emptyPackagesIcon}>📦</Text>
                <Text style={styles.emptyPackagesTitle}>No service packages added yet</Text>
                <Text style={styles.emptyPackagesSub}>Add your first wedding setup or catering package to start getting customer enquiries.</Text>
                <TouchableOpacity style={styles.addFirstPackageBtn} onPress={handleOpenAddPackage}>
                  <Text style={styles.addFirstPackageBtnText}>+ Create First Package</Text>
                </TouchableOpacity>
              </View>
            ) : (
              packagesList.map((pkg, idx) => (
                <View key={pkg.id || `pkg-${idx}`} style={styles.packageCard}>
                  <View style={styles.packageHead}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      {pkg.category && (
                        <View style={styles.pkgCatTag}>
                          <Text style={styles.pkgCatTagText}>{pkg.category.toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.packagePrice}>{pkg.price}</Text>
                  </View>
                  <Text style={styles.packageDesc}>{pkg.includes || 'Complete verified event service'}</Text>

                  <View style={styles.pkgActionRow}>
                    <TouchableOpacity style={styles.pkgEditBtn} onPress={() => handleOpenEditPackage(pkg)}>
                      <Text style={styles.pkgEditBtnText}>✏️ Edit Package</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pkgDeleteBtn} onPress={() => handleDeletePackage(pkg.id || pkg.name, pkg.name)}>
                      <Text style={styles.pkgDeleteBtnText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Photos & Work Gallery Sub-section */}
            <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Work Portfolio Photos ({portfolioPhotos.length})</Text>
                <Text style={styles.sectionSub}>Showcase real setups, stages, lighting, and dining decor to customers.</Text>
              </View>
              <TouchableOpacity style={styles.addPhotoBtn} onPress={() => setPhotoModalVisible(true)} activeOpacity={0.85}>
                <Text style={styles.addPhotoBtnText}>+ Upload Photo</Text>
              </TouchableOpacity>
            </View>

            {portfolioPhotos.length === 0 ? (
              <View style={styles.emptyPhotosBox}>
                <Text style={styles.emptyPhotosText}>No portfolio photos yet. Upload photos to increase bookings by 3x!</Text>
              </View>
            ) : (
              <View style={styles.photosGrid}>
                {portfolioPhotos.map((photo) => (
                  <View key={photo.id} style={styles.photoGridCard}>
                    <Image source={{ uri: photo.url }} style={styles.photoGridImg} resizeMode="cover" />
                    <View style={styles.photoGridMeta}>
                      <Text style={styles.photoGridCaption} numberOfLines={1}>{photo.caption}</Text>
                      <TouchableOpacity style={styles.photoDeleteBtn} onPress={() => handleDeletePhoto(photo.id)}>
                        <Text style={styles.photoDeleteText}>✕ Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 6: REVIEWS */}
        {subTab === 'reviews' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Testimonials & Ratings</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewAuthor}>Priyaben Dave • Godhra</Text>
              <Text style={styles.reviewStars}>⭐⭐⭐⭐⭐ (5.0)</Text>
              <Text style={styles.reviewText}>
                "Superb mandap decoration for my brother's wedding at Vrindavan Party Plot. On-time setup and direct payment was smooth!"
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ADD / EDIT PACKAGE MODAL */}
      {packageModalVisible && (
      <Modal visible={packageModalVisible} animationType="slide" transparent={true} onRequestClose={() => setPackageModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>{editingPackageId ? '✏️ Edit Service Package' : '✨ Add New Service Package'}</Text>
              <TouchableOpacity onPress={() => setPackageModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <Text style={styles.modalFieldLabel}>Package / Service Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Royal Rajwadi Mandap & Entry Gate"
                placeholderTextColor="#94a3b8"
                value={pkgName}
                onChangeText={setPkgName}
              />

              <Text style={styles.modalFieldLabel}>Service Category *</Text>
              <View style={styles.modalSelectRow}>
                {['mandap', 'catering', 'party_plot', 'photography', 'beauty_parlour', 'lighting', 'horse', 'stage'].map((cat) => {
                  const isCat = pkgCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.modalCategoryChip, isCat && styles.modalCategoryChipActive]}
                      onPress={() => setPkgCategory(cat)}
                    >
                      <Text style={[styles.modalCategoryChipText, isCat && styles.modalCategoryChipTextActive]}>
                        {cat.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalFieldLabel}>Pricing / Package Rate *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. ₹45,000 or ₹450/plate"
                placeholderTextColor="#94a3b8"
                value={pkgPrice}
                onChangeText={setPkgPrice}
              />

              <Text style={styles.modalFieldLabel}>What's Included in This Package *</Text>
              <TextInput
                style={[styles.modalInput, { height: 75, textAlignVertical: 'top' }]}
                placeholder="e.g. Fabric Mandap with floral pillars, 2 Welcome arches, 50 VIP Chairs, Haldi setup"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={pkgIncludes}
                onChangeText={setPkgIncludes}
              />

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSavePackage}>
                <Text style={styles.modalSubmitBtnText}>
                  {editingPackageId ? 'Save Package Changes ✅' : 'Publish Service to Marketplace 🚀'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      )}

      {/* UPLOAD PHOTO MODAL */}
      {photoModalVisible && (
      <Modal visible={photoModalVisible} animationType="slide" transparent={true} onRequestClose={() => setPhotoModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>📸 Add Portfolio Work Photo</Text>
              <TouchableOpacity onPress={() => setPhotoModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <Text style={styles.modalFieldLabel}>Image URL (HTTPS link) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor="#94a3b8"
                value={photoUrlInput}
                onChangeText={setPhotoUrlInput}
              />

              <Text style={styles.modalFieldLabel}>Work Description / Caption</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Wedding Reception Stage at Motibaug Godhra"
                placeholderTextColor="#94a3b8"
                value={photoCaptionInput}
                onChangeText={setPhotoCaptionInput}
              />

              <Text style={styles.modalFieldLabel}>Photo Category</Text>
              <View style={styles.modalSelectRow}>
                {['decor', 'stage', 'food', 'venue', 'real_events'].map((cat) => {
                  const isCat = photoCategoryInput === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.modalCategoryChip, isCat && styles.modalCategoryChipActive]}
                      onPress={() => setPhotoCategoryInput(cat)}
                    >
                      <Text style={[styles.modalCategoryChipText, isCat && styles.modalCategoryChipTextActive]}>
                        {cat.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddPhotoSubmit}>
                <Text style={styles.modalSubmitBtnText}>Upload & Publish Photo 🚀</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  vendorBar: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  vendorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  roleTag: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  roleTagText: {
    color: '#e0f2fe',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vendorName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  vendorMeta: {
    color: '#94a3b8',
    fontSize: 10,
  },
  switchRoleBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchRoleText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  outstandingAlert: {
    backgroundColor: '#450a0a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#7f1d1d',
  },
  outstandingText: {
    color: '#fca5a5',
    fontSize: 11.5,
  },
  payNowPill: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payNowPillText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  tabBarWrapper: {
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  tabActive: {
    backgroundColor: '#0284c7',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scrollBody: {
    flex: 1,
    padding: 14,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 3,
  },
  sectionSub: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginBottom: 12,
  },
  bookingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookingCode: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
  },
  eventTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusConfirmed: {
    backgroundColor: '#dcfce7',
  },
  statusCompleted: {
    backgroundColor: '#dbeafe',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  bookingDetailsBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  detailLine: {
    color: '#cbd5e1',
    fontSize: 11,
    marginVertical: 1.5,
  },
  detailPrice: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  completeEventRow: {
    marginTop: 6,
  },
  completeEventBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeEventBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  completedNoticeBox: {
    backgroundColor: '#064e3b',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  completedNoticeText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '600',
  },
  directPayCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  directPayHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  directPayAmount: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: '900',
  },
  directPayMethod: {
    color: '#94a3b8',
    fontSize: 11,
  },
  directPayMeta: {
    color: '#cbd5e1',
    fontSize: 11,
    marginVertical: 2,
  },
  directPayNotes: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontStyle: 'italic',
  },
  confirmPayBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmPayText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  disputePayBtn: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  disputePayText: {
    color: '#fca5a5',
    fontSize: 11.5,
    fontWeight: '700',
  },
  confirmedAck: {
    color: '#34d399',
    fontSize: 10.5,
    marginTop: 4,
    fontWeight: '600',
  },
  commSummaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  commSummaryTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  commSummarySub: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  commKpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  commKpi: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
  },
  commKpiLabel: {
    color: '#94a3b8',
    fontSize: 10.5,
  },
  commKpiVal: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  commItemCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  commItemHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  commBookingCode: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  commEligible: {
    color: '#94a3b8',
    fontSize: 11,
  },
  commMathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  commMathText: {
    color: '#cbd5e1',
    fontSize: 11.5,
  },
  commDueDate: {
    color: '#94a3b8',
    fontSize: 10.5,
  },
  commPayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  commDueText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '800',
  },
  submitUtrBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  submitUtrText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  settledNote: {
    color: '#34d399',
    fontSize: 10.5,
    marginTop: 6,
  },
  proofFormBox: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0284c7',
    marginTop: 14,
  },
  proofFormTitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
  },
  proofFormSub: {
    color: '#94a3b8',
    fontSize: 10.5,
    marginBottom: 10,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 6,
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  formSubmitBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  formSubmitText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  formCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  formCancelText: {
    color: '#cbd5e1',
    fontSize: 11.5,
  },
  cityPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  cityPillActive: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cityPillText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  addCityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  destChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  destChipSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#0c4a6e',
  },
  destChipText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  destChipTextSelected: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  packageCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  packageHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  packageName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  packagePrice: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
  },
  packageDesc: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  reviewCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reviewAuthor: {
    color: '#f8fafc',
    fontSize: 12.5,
    fontWeight: '700',
  },
  reviewStars: {
    fontSize: 12,
    marginVertical: 2,
  },
  reviewText: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontStyle: 'italic',
  },
  // Profile Progress Bar
  profileProgressBarBox: {
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  profileProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileProgressTitle: {
    color: '#f8fafc',
    fontSize: 12.5,
    fontWeight: '800',
  },
  approvedVendorBadge: {
    backgroundColor: '#065f46',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  approvedVendorBadgeText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
  },
  profileProgressPercent: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 3,
  },
  checklistRow: {
    flexDirection: 'row',
  },
  checkChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
  },
  checkChipDone: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
  },
  checkChipPending: {
    backgroundColor: '#1e293b',
    borderColor: '#475569',
  },
  checkChipText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  checkChipTextDone: {
    color: '#6ee7b7',
  },
  checkChipTextPending: {
    color: '#94a3b8',
  },
  // Services & Packages Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addServiceBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addServiceBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  addPhotoBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addPhotoBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyPackagesBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyPackagesIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyPackagesTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyPackagesSub: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12,
  },
  addFirstPackageBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addFirstPackageBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  pkgCatTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#0369a1',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2,
  },
  pkgCatTagText: {
    color: '#e0f2fe',
    fontSize: 8,
    fontWeight: '800',
  },
  pkgActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  pkgEditBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pkgEditBtnText: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  pkgDeleteBtn: {
    backgroundColor: '#450a0a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pkgDeleteBtnText: {
    color: '#f87171',
    fontSize: 10.5,
    fontWeight: '700',
  },
  // Photos Grid
  emptyPhotosBox: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  emptyPhotosText: {
    color: '#94a3b8',
    fontSize: 11,
    fontStyle: 'italic',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoGridCard: {
    width: '47%',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  photoGridImg: {
    width: '100%',
    height: 100,
  },
  photoGridMeta: {
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoGridCaption: {
    color: '#cbd5e1',
    fontSize: 9.5,
    fontWeight: '600',
    flex: 1,
    marginRight: 4,
  },
  photoDeleteBtn: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoDeleteText: {
    color: '#fca5a5',
    fontSize: 8.5,
    fontWeight: '800',
  },
  // Radius Options
  radiusOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
  },
  radiusChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  radiusChipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  radiusChipTextActive: {
    color: '#ffffff',
  },
  saveCoverageBtn: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  saveCoverageBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalSheetTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
  },
  modalFieldLabel: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  modalCategoryChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalCategoryChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  modalCategoryChipText: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '700',
  },
  modalCategoryChipTextActive: {
    color: '#ffffff',
  },
  modalSubmitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
