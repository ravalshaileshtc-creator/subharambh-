import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  getCustomerEnquiries,
  getAuditLogs,
  logAuditEvent,
} from '../services/marketplaceService';
import { PANCHMAHAL_TALUKAS } from '../constants/locations';

export default function AdminPanelModal({
  visible,
  onClose,
  vendors = [],
  onUpdateVendorVerification,
  onDeleteVendor,
}) {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [activeTab, setActiveTab] = useState('vendors'); // 'vendors' | 'enquiries' | 'audit' | 'locations'

  if (!visible) return null;

  const enquiries = getCustomerEnquiries();
  const auditLogs = getAuditLogs();

  const handleAdminLogin = () => {
    if (adminPin === '9999' || adminPin === 'admin') {
      setIsAdminAuth(true);
      logAuditEvent('ADMIN_LOGIN', 'Superadmin logged in to Panchmahal Admin Panel');
    } else {
      Alert.alert('Unauthorized', 'Incorrect Admin PIN. (Authorized credentials required).');
    }
  };

  const toggleVerification = (vendor) => {
    const newStatus = !vendor.is_verified;
    onUpdateVendorVerification(vendor.id, newStatus);
    logAuditEvent(
      'VENDOR_VERIFY_TOGGLE',
      `Admin set ${vendor.business_name} verified status to ${newStatus}`
    );
    Alert.alert(
      'Status Updated',
      `"${vendor.business_name}" is now marked as ${newStatus ? 'VERIFIED ✓' : 'STANDARD'}.`
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badgeRow}>
                <Text style={styles.topBadge}>🛡️ SUPERADMIN CONSOLE</Text>
              </View>
              <Text style={styles.title}>Panchmahal Marketplace Admin</Text>
              <Text style={styles.subtitle}>
                Moderation, Vendor Verification & Booking Management
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!isAdminAuth ? (
            <View style={styles.authContainer}>
              <Text style={styles.lockIcon}>🔐</Text>
              <Text style={styles.authPrompt}>Enter Administrator Master PIN</Text>
              <Text style={styles.authHint}>
                Only authorized Panchmahal Events Hub admins can modify verification badges and review audit logs.
              </Text>
              <TextInput
                style={styles.pinInput}
                placeholder="Enter PIN (Default: 9999)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                secureTextEntry
                value={adminPin}
                onChangeText={setAdminPin}
              />
              <TouchableOpacity style={styles.loginBtn} onPress={handleAdminLogin}>
                <Text style={styles.loginBtnText}>Authenticate as Admin</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Navigation Tabs */}
              <View style={styles.adminTabs}>
                <TouchableOpacity
                  style={[styles.adminTab, activeTab === 'vendors' && styles.adminTabActive]}
                  onPress={() => setActiveTab('vendors')}
                >
                  <Text
                    style={[
                      styles.adminTabText,
                      activeTab === 'vendors' && styles.adminTabTextActive,
                    ]}
                  >
                    🏪 Vendors ({vendors.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.adminTab, activeTab === 'enquiries' && styles.adminTabActive]}
                  onPress={() => setActiveTab('enquiries')}
                >
                  <Text
                    style={[
                      styles.adminTabText,
                      activeTab === 'enquiries' && styles.adminTabTextActive,
                    ]}
                  >
                    📋 Leads ({enquiries.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.adminTab, activeTab === 'audit' && styles.adminTabActive]}
                  onPress={() => setActiveTab('audit')}
                >
                  <Text
                    style={[
                      styles.adminTabText,
                      activeTab === 'audit' && styles.adminTabTextActive,
                    ]}
                  >
                    📜 Audit Logs
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.adminTab, activeTab === 'locations' && styles.adminTabActive]}
                  onPress={() => setActiveTab('locations')}
                >
                  <Text
                    style={[
                      styles.adminTabText,
                      activeTab === 'locations' && styles.adminTabTextActive,
                    ]}
                  >
                    📍 Talukas
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
                {/* TAB 1: VENDORS MODERATION */}
                {activeTab === 'vendors' && (
                  <View>
                    <Text style={styles.sectionHeading}>
                      Vendor Directory Moderation & Badge Approvals:
                    </Text>
                    {vendors.map((v) => (
                      <View key={v.id} style={styles.vendorItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.vendorName}>{v.business_name}</Text>
                          <Text style={styles.vendorMeta}>
                            {v.category.toUpperCase()} • 📍 {v.location}
                          </Text>
                          <Text style={styles.vendorMeta}>📞 +91 {v.phone} | 💰 {v.price_range}</Text>
                        </View>
                        <View style={styles.actionColumn}>
                          <TouchableOpacity
                            style={[
                              styles.verifyBtn,
                              v.is_verified ? styles.verifyBtnActive : styles.verifyBtnInactive,
                            ]}
                            onPress={() => toggleVerification(v)}
                          >
                            <Text style={styles.verifyBtnText}>
                              {v.is_verified ? '✓ Verified' : 'Mark Verified'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* TAB 2: ENQUIRIES & QUOTES */}
                {activeTab === 'enquiries' && (
                  <View>
                    <Text style={styles.sectionHeading}>Customer Leads & Quote Activity:</Text>
                    {enquiries.map((enq) => (
                      <View key={enq.id} style={styles.enquiryItem}>
                        <View style={styles.enquiryHeader}>
                          <Text style={styles.enquiryId}>{enq.id}</Text>
                          <Text style={styles.enquiryStatusBadge}>{enq.status}</Text>
                        </View>
                        <Text style={styles.enquiryUser}>
                          Customer: {enq.customer_name} ({enq.customer_phone})
                        </Text>
                        <Text style={styles.enquiryDetails}>
                          Event: {enq.event_type} on {enq.event_date} at {enq.location}
                        </Text>
                        <Text style={styles.enquiryDetails}>
                          Budget: {enq.budget} | Guests: {enq.guest_count}
                        </Text>
                        <Text style={styles.enquiryQuotesCount}>
                          Quotes Received: {enq.quotes.length} / {enq.matched_vendor_ids.length} matched vendors
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* TAB 3: AUDIT LOGS */}
                {activeTab === 'audit' && (
                  <View>
                    <Text style={styles.sectionHeading}>Immutable Security Audit Trail:</Text>
                    {auditLogs.map((log) => (
                      <View key={log.id} style={styles.auditRow}>
                        <Text style={styles.auditAction}>[{log.action}]</Text>
                        <Text style={styles.auditDetails}>{log.details}</Text>
                        <Text style={styles.auditTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* TAB 4: TALUKAS & LOCATIONS */}
                {activeTab === 'locations' && (
                  <View>
                    <Text style={styles.sectionHeading}>
                      Panchmahal District Talukas & Areas Covered:
                    </Text>
                    {PANCHMAHAL_TALUKAS.map((t) => (
                      <View key={t.id} style={styles.talukaBox}>
                        <Text style={styles.talukaTitle}>📍 {t.name}</Text>
                        <Text style={styles.talukaAreas}>{t.areas.join(' • ')}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fef2f2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  badgeRow: {
    marginBottom: 4,
  },
  topBadge: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991b1b',
  },
  subtitle: {
    fontSize: 11.5,
    color: '#b91c1c',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(153, 27, 27, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  authContainer: {
    padding: 30,
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  authPrompt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  authHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 18,
  },
  pinInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    width: '75%',
    textAlign: 'center',
    marginBottom: 14,
  },
  loginBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  adminTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  adminTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  adminTabActive: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2.5,
    borderBottomColor: '#dc2626',
  },
  adminTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  adminTabTextActive: {
    color: '#991b1b',
    fontWeight: '800',
  },
  scrollBody: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 10,
  },
  vendorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  vendorMeta: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  actionColumn: {
    marginLeft: 8,
  },
  verifyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifyBtnActive: {
    backgroundColor: '#16a34a',
  },
  verifyBtnInactive: {
    backgroundColor: '#94a3b8',
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  enquiryItem: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  enquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  enquiryId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#d97706',
  },
  enquiryStatusBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontSize: 9.5,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  enquiryUser: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  enquiryDetails: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  enquiryQuotesCount: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 4,
  },
  auditRow: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  auditAction: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#dc2626',
  },
  auditDetails: {
    fontSize: 11,
    color: '#334155',
    marginVertical: 2,
  },
  auditTime: {
    fontSize: 9.5,
    color: '#94a3b8',
  },
  talukaBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  talukaTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  talukaAreas: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
});
