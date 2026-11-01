import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { getCustomerBookings } from '../services/rbacService';
import { getDirectPayments } from '../services/marketplaceEngine';
import BillBookView from './BillBookView';

export default function CustomerDashboard({
  user,
  onOpenSmartSearch,
  onOpenGet5Quotes,
  onOpenAuthModal,
  onOpenDirectPayment,
  onLogout,
  onNavigateTab,
}) {
  const [subTab, setSubTab] = useState('bookings'); // 'bookings' | 'payments' | 'profile'
  const bookings = getCustomerBookings();
  const directPayments = getDirectPayments();

  const totalPaidDirect = directPayments
    .filter((p) => p.status === 'vendor_confirmed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <View style={styles.container}>
      {/* Customer Header Banner */}
      <View style={styles.userBar}>
        <View style={styles.userLeft}>
          <Image
            source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
            style={styles.avatar}
          />
          <View>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>👤 CUSTOMER PORTAL</Text>
            </View>
            <Text style={styles.userName}>{user.full_name}</Text>
            <Text style={styles.userMeta}>📞 +91 {user.phone} • Godhra, Panchmahal</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.switchRoleBtn} onPress={onOpenAuthModal}>
          <Text style={styles.switchRoleText}>Switch Role 🔁</Text>
        </TouchableOpacity>
      </View>

      {/* Customer Navigation Pills */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTab, subTab === 'bookings' && styles.subTabActive]}
          onPress={() => setSubTab('bookings')}
        >
          <Text style={[styles.subTabText, subTab === 'bookings' && styles.subTabTextActive]}>
            📋 My Bookings ({bookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, subTab === 'payments' && styles.subTabActive]}
          onPress={() => setSubTab('payments')}
        >
          <Text style={[styles.subTabText, subTab === 'payments' && styles.subTabTextActive]}>
            💳 Direct Payments ({directPayments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, subTab === 'invoices' && styles.subTabActive]}
          onPress={() => setSubTab('invoices')}
        >
          <Text style={[styles.subTabText, subTab === 'invoices' && styles.subTabTextActive]}>
            🧾 Invoices & Bills
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, subTab === 'profile' && styles.subTabActive]}
          onPress={() => setSubTab('profile')}
        >
          <Text style={[styles.subTabText, subTab === 'profile' && styles.subTabTextActive]}>
            👤 Profile & Account
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SUBTAB 1: MY BOOKINGS */}
        {subTab === 'bookings' && (
          <View style={styles.tabSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Your Wedding & Event Bookings</Text>
              <TouchableOpacity style={styles.quickQuoteBtn} onPress={onOpenGet5Quotes}>
                <Text style={styles.quickQuoteText}>+ New Requirement</Text>
              </TouchableOpacity>
            </View>

            {bookings.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>💍</Text>
                <Text style={styles.emptyTitle}>No Active Bookings</Text>
                <Text style={styles.emptySub}>
                  Explore verified Mandap, Party Plots, and Caterers in Godhra to book for your event.
                </Text>
              </View>
            ) : (
              bookings.map((item) => (
                <View key={item.id} style={styles.bookingCard}>
                  <View style={styles.bookingCardHead}>
                    <View>
                      <Text style={styles.bookingCode}>{item.booking_code}</Text>
                      <Text style={styles.bookingVendor}>{item.vendor_name}</Text>
                      <Text style={styles.bookingCategory}>{item.category ? item.category.toUpperCase() : 'EVENT'}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        item.status === 'Confirmed' ? styles.statusConfirmed : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          item.status === 'Confirmed' ? styles.statusTextConfirmed : styles.statusTextPending,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookingDetailsBox}>
                    <Text style={styles.detailText}>📅 Date: {item.event_date} ({item.event_type})</Text>
                    <Text style={styles.detailText}>📍 Venue: {item.event_location}</Text>
                    <Text style={styles.detailText}>👥 Attendance: {item.guest_count} Guests</Text>
                  </View>

                  <View style={styles.financialRow}>
                    <View>
                      <Text style={styles.amountLabel}>Total Package</Text>
                      <Text style={styles.amountValue}>₹{(item.total_amount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View>
                      <Text style={styles.amountLabel}>Paid Directly</Text>
                      <Text style={styles.paidValue}>₹{(item.paid_amount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View>
                      <Text style={styles.amountLabel}>Status</Text>
                      <Text style={styles.paymentStatusText}>{item.payment_status || 'Partial'}</Text>
                    </View>
                  </View>

                  {/* Direct Payment Action */}
                  <TouchableOpacity
                    style={styles.payVendorDirectBtn}
                    onPress={() => onOpenDirectPayment && onOpenDirectPayment(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.payVendorDirectText}>Pay Vendor Directly 💳</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* SUBTAB 2: DIRECT PAYMENTS */}
        {subTab === 'payments' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>Direct Vendor Payments & Receipts</Text>
            
            {/* Pure Marketplace Policy Banner */}
            <View style={styles.directPayBanner}>
              <Text style={styles.directPayBannerTitle}>⚡ 100% Direct Payment to Vendor</Text>
              <Text style={styles.directPayBannerText}>
                Under the Shubh Celebrations Pure Marketplace model, you pay your wedding vendor directly via UPI, Cash, or Direct Bank Transfer. Shubh Celebrations never touches your event funds and charges 0% fee to customers.
              </Text>
            </View>

            <View style={styles.paymentSummaryCard}>
              <Text style={styles.summaryLabel}>Total Paid Directly to Vendors</Text>
              <Text style={styles.summaryValue}>₹{totalPaidDirect.toLocaleString('en-IN')}</Text>
              <Text style={styles.summarySub}>0% Client Fee • Verified by Vendor Receipts</Text>
            </View>

            <Text style={styles.subSectionTitle}>Payment Audit Trail</Text>

            {directPayments.map((p) => (
              <View key={p.id} style={styles.paymentHistoryItem}>
                <View style={styles.payIconBox}>
                  <Text style={styles.payIcon}>⚡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.payTitle}>{p.vendor_name}</Text>
                    <View style={[
                      styles.statusPillSmall,
                      p.status === 'vendor_confirmed' ? styles.statusApproved : p.status === 'disputed' ? styles.statusRejected : styles.statusPending
                    ]}>
                      <Text style={styles.statusPillSmallText}>
                        {p.status === 'vendor_confirmed' ? 'CONFIRMED ✓' : p.status === 'disputed' ? 'DISPUTED ⚠️' : 'PENDING ACK ⏳'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.payDate}>Booking: {p.booking_code} • {p.payment_date} ({p.payment_method})</Text>
                  <Text style={styles.payRef}>Ref/UTR: {p.payment_reference}</Text>
                  {p.notes ? <Text style={styles.payNotes}>"{p.notes}"</Text> : null}
                </View>
                <Text style={styles.payAmount}>₹{p.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* SUBTAB 3: PROFILE */}
        {subTab === 'profile' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>Customer Account Details</Text>
            <View style={styles.profileBox}>
              <Text style={styles.profileField}>Full Name: {user.full_name}</Text>
              <Text style={styles.profileField}>Mobile: +91 {user.phone}</Text>
              <Text style={styles.profileField}>Email: {user.email}</Text>
              <Text style={styles.profileField}>Role: CUSTOMER (Authorized)</Text>
              <Text style={styles.profileField}>Marketplace Mode: Pure Vendor Direct Settlement</Text>
              <Text style={styles.profileField}>Location: Godhra, Panchmahal, Gujarat</Text>

              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                <Text style={styles.logoutBtnText}>🔒 Sign Out of Customer Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* SUBTAB 4: INVOICES & BILLS (CUSTOMER ACCESS) */}
        {subTab === 'invoices' && (
          <View style={[styles.tabSection, { minHeight: 550, backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden' }]}>
            <BillBookView mode="customer" user={user} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#d97706',
  },
  roleTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  userMeta: {
    fontSize: 10.5,
    color: '#64748b',
  },
  switchRoleBtn: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  subTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  subTabActive: {
    backgroundColor: '#d97706',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  subTabTextActive: {
    color: '#ffffff',
  },
  contentScroll: {
    flex: 1,
    padding: 16,
  },
  tabSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
    marginBottom: 8,
  },
  quickQuoteBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickQuoteText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bookingCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookingCode: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '800',
  },
  bookingVendor: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 1,
  },
  bookingCategory: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusConfirmed: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusTextConfirmed: {
    color: '#15803d',
  },
  statusTextPending: {
    color: '#b45309',
  },
  bookingDetailsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  detailText: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 18,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  paidValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  payVendorDirectBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  payVendorDirectText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  directPayBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
    marginBottom: 12,
  },
  directPayBannerTitle: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  directPayBannerText: {
    color: '#1e40af',
    fontSize: 10.5,
    lineHeight: 16,
  },
  paymentSummaryCard: {
    backgroundColor: '#92400e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  summaryLabel: {
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  summarySub: {
    color: '#fde68a',
    fontSize: 10.5,
  },
  paymentHistoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  payIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  payIcon: {
    fontSize: 16,
  },
  payTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  payDate: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  payRef: {
    fontSize: 10,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 1,
  },
  payNotes: {
    fontSize: 10,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 2,
  },
  payAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
    marginLeft: 8,
  },
  statusPillSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusApproved: {
    backgroundColor: '#15803d',
  },
  statusRejected: {
    backgroundColor: '#b91c1c',
  },
  statusPending: {
    backgroundColor: '#d97706',
  },
  statusPillSmallText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
  },
  profileBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  profileField: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 22,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '800',
  },
});
