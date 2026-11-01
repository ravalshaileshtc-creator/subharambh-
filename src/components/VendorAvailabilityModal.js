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
  checkVendorDateAvailability,
  updateVendorDateAvailability,
} from '../services/marketplaceService';

// Sample upcoming wedding dates for Panchmahal
const SAMPLE_DATES = [
  '2026-11-20', '2026-11-22', '2026-11-25', '2026-11-28',
  '2026-12-05', '2026-12-10', '2026-12-12', '2026-12-15',
  '2026-12-18', '2026-12-20', '2026-12-25', '2026-12-28',
  '2027-01-15', '2027-01-18', '2027-01-22', '2027-01-26',
  '2027-02-10', '2027-02-14', '2027-02-18', '2027-02-22',
];

export default function VendorAvailabilityModal({
  visible,
  vendor,
  onClose,
  onSendBookingEnquiry,
}) {
  const [selectedDate, setSelectedDate] = useState('2026-12-15');
  const [customDate, setCustomDate] = useState('');
  const [isVendorMode, setIsVendorMode] = useState(false);
  const [vendorPin, setVendorPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [newStatus, setNewStatus] = useState('booked');
  const [statusNote, setStatusNote] = useState('');

  if (!visible || !vendor) return null;

  const activeDate = customDate.trim() || selectedDate;
  const currentAvail = checkVendorDateAvailability(vendor.id, activeDate);

  const handleUnlockVendor = () => {
    if (vendorPin === '1234' || vendorPin === vendor.phone?.slice(-4)) {
      setIsUnlocked(true);
      Alert.alert('Vendor Authorized', `You can now manage dates for ${vendor.business_name}.`);
    } else {
      Alert.alert('Invalid PIN', 'Enter "1234" or the last 4 digits of vendor mobile number.');
    }
  };

  const handleUpdateAvailability = () => {
    if (!activeDate) {
      Alert.alert('Missing Date', 'Please select or enter an event date.');
      return;
    }

    const res = updateVendorDateAvailability(vendor.id, activeDate, newStatus, statusNote);
    if (!res.success) {
      Alert.alert('Action Blocked', res.message);
    } else {
      Alert.alert('Status Updated', res.message);
      setStatusNote('');
    }
  };

  const handleCustomerBookingRequest = () => {
    if (currentAvail.status === 'booked') {
      Alert.alert(
        'Date Already Booked',
        `Sorry! ${vendor.business_name} is already confirmed for another wedding on ${activeDate}. Please select another date or use "Get 5 Quotes" to find available vendors.`
      );
      return;
    }

    onSendBookingEnquiry(vendor, activeDate);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return { label: 'AVAILABLE FOR BOOKING ✅', bg: '#dcfce7', text: '#15803d' };
      case 'booked':
        return { label: 'CONFIRMED BOOKED ❌', bg: '#fee2e2', text: '#b91c1c' };
      case 'pending_enquiry':
        return { label: 'PENDING ENQUIRY ⏳', bg: '#fef3c7', text: '#b45309' };
      case 'blocked':
        return { label: 'DATE BLOCKED / CLOSED 🔒', bg: '#f1f5f9', text: '#475569' };
      default:
        return { label: 'AVAILABLE ✅', bg: '#dcfce7', text: '#15803d' };
    }
  };

  const badge = getStatusBadge(currentAvail.status);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badgeRow}>
                <Text style={styles.topBadge}>📅 EVENT DATE AVAILABILITY</Text>
              </View>
              <Text style={styles.title}>{vendor.business_name}</Text>
              <Text style={styles.subtitle}>Check real-time calendar & prevent double-booking</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.modeSwitchRow}>
            <TouchableOpacity
              style={[styles.modeTab, !isVendorMode && styles.modeTabActive]}
              onPress={() => setIsVendorMode(false)}
            >
              <Text style={[styles.modeTabText, !isVendorMode && styles.modeTabTextActive]}>
                👤 Customer View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, isVendorMode && styles.modeTabActive]}
              onPress={() => setIsVendorMode(true)}
            >
              <Text style={[styles.modeTabText, isVendorMode && styles.modeTabTextActive]}>
                ⚙️ Vendor Calendar Dashboard
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Mode 1: Customer View */}
            {!isVendorMode ? (
              <View>
                <Text style={styles.sectionLabel}>Select Your Event Date in Panchmahal:</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
                  {SAMPLE_DATES.map((d) => {
                    const isSelected = activeDate === d;
                    const dateStatus = checkVendorDateAvailability(vendor.id, d).status;
                    const isBooked = dateStatus === 'booked';
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.dateItem,
                          isSelected && styles.dateItemActive,
                          isBooked && styles.dateItemBooked,
                        ]}
                        onPress={() => {
                          setSelectedDate(d);
                          setCustomDate('');
                        }}
                      >
                        <Text style={[styles.dateText, isSelected && styles.dateTextActive]}>
                          {d}
                        </Text>
                        <Text style={styles.statusDot}>
                          {isBooked ? '❌ Booked' : '✅ Open'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TextInput
                  style={styles.input}
                  placeholder="Or enter custom date: YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  value={customDate}
                  onChangeText={setCustomDate}
                />

                {/* Status Box for Active Date */}
                <View style={styles.statusDisplayCard}>
                  <Text style={styles.statusDateHeading}>Selected Date: {activeDate}</Text>
                  <View style={[styles.statusBadgePill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                  {currentAvail.note ? (
                    <Text style={styles.statusNote}>Note: {currentAvail.note}</Text>
                  ) : null}
                </View>

                {/* 7-Stage Booking Lifecycle Legend */}
                <View style={styles.lifecycleCard}>
                  <Text style={styles.lifecycleTitle}>Verified Booking Lifecycle:</Text>
                  <View style={styles.lifecycleSteps}>
                    <Text style={styles.stepText}>1. New Enquiry ➔ 2. Contacted ➔ 3. Quotation Sent</Text>
                    <Text style={styles.stepText}>4. Pending Confirmation ➔ 5. Confirmed ✅ ➔ 6. Completed</Text>
                  </View>
                </View>

                {/* Action button */}
                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    currentAvail.status === 'booked' && styles.disabledActionBtn,
                  ]}
                  onPress={handleCustomerBookingRequest}
                  disabled={currentAvail.status === 'booked'}
                >
                  <Text style={styles.primaryActionBtnText}>
                    {currentAvail.status === 'booked'
                      ? '❌ Date Already Booked'
                      : '📝 Send Booking Enquiry for this Date'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Mode 2: Vendor Calendar Dashboard */
              <View>
                {!isUnlocked ? (
                  <View style={styles.authBox}>
                    <Text style={styles.authTitle}>Vendor Calendar Access</Text>
                    <Text style={styles.authSubtitle}>
                      Enter your PIN (Default: 1234 or last 4 digits of mobile) to manage your calendar dates.
                    </Text>
                    <TextInput
                      style={styles.pinInput}
                      placeholder="Enter 4-Digit PIN"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      secureTextEntry
                      value={vendorPin}
                      onChangeText={setVendorPin}
                    />
                    <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlockVendor}>
                      <Text style={styles.unlockBtnText}>Unlock Vendor Calendar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.vendorPanel}>
                    <Text style={styles.sectionLabel}>Date to Update: {activeDate}</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
                      {SAMPLE_DATES.slice(0, 10).map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.dateItem, activeDate === d && styles.dateItemActive]}
                          onPress={() => setSelectedDate(d)}
                        >
                          <Text style={[styles.dateText, activeDate === d && styles.dateTextActive]}>
                            {d}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.sectionLabel}>Select Status:</Text>
                    <View style={styles.statusButtonsRow}>
                      {[
                        { id: 'available', label: '✅ Available' },
                        { id: 'booked', label: '❌ Booked' },
                        { id: 'pending_enquiry', label: '⏳ Pending' },
                        { id: 'blocked', label: '🔒 Blocked' },
                      ].map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.statusChoiceBtn,
                            newStatus === s.id && styles.statusChoiceBtnActive,
                          ]}
                          onPress={() => setNewStatus(s.id)}
                        >
                          <Text
                            style={[
                              styles.statusChoiceText,
                              newStatus === s.id && styles.statusChoiceTextActive,
                            ]}
                          >
                            {s.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      style={styles.input}
                      placeholder="Booking notes (e.g. Patel Family Wedding, Motibaug Plot)"
                      placeholderTextColor="#94a3b8"
                      value={statusNote}
                      onChangeText={setStatusNote}
                    />

                    <TouchableOpacity
                      style={styles.updateStatusBtn}
                      onPress={handleUpdateAvailability}
                    >
                      <Text style={styles.updateStatusBtnText}>
                        💾 Save Date Status (Double-Booking Protected)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
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
    backgroundColor: '#fffbeb',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  badgeRow: {
    marginBottom: 4,
  },
  topBadge: {
    backgroundColor: '#d97706',
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
    color: '#78350f',
  },
  subtitle: {
    fontSize: 11.5,
    color: '#92400e',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(120, 53, 15, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#78350f',
  },
  modeSwitchRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  modeTabActive: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2.5,
    borderBottomColor: '#d97706',
  },
  modeTabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
  },
  modeTabTextActive: {
    color: '#b45309',
    fontWeight: '800',
  },
  body: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 6,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dateItem: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  dateItemActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#d97706',
  },
  dateItemBooked: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  dateTextActive: {
    color: '#92400e',
    fontWeight: '800',
  },
  statusDot: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 10,
  },
  statusDisplayCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDateHeading: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  statusBadgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  statusNote: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
    fontStyle: 'italic',
  },
  lifecycleCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  lifecycleTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 4,
  },
  lifecycleSteps: {
    gap: 2,
  },
  stepText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: '600',
  },
  primaryActionBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledActionBtn: {
    backgroundColor: '#94a3b8',
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  authBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  authSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 8,
  },
  pinInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    width: '70%',
    textAlign: 'center',
    marginBottom: 10,
  },
  unlockBtn: {
    backgroundColor: '#d97706',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  unlockBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  vendorPanel: {
    paddingBottom: 20,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  statusChoiceBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusChoiceBtnActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#d97706',
  },
  statusChoiceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  statusChoiceTextActive: {
    color: '#92400e',
    fontWeight: '800',
  },
  updateStatusBtn: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  updateStatusBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
