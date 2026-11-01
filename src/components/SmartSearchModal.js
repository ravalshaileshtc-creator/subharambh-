import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { EVENT_TYPES, GUEST_RANGES, BUDGET_RANGES } from '../constants/eventTypes';
import { PANCHMAHAL_TALUKAS } from '../constants/locations';

export default function SmartSearchModal({
  visible,
  onClose,
  onApplySearch,
  currentFilters,
  categories = [],
}) {
  const [eventType, setEventType] = useState(currentFilters?.eventType || 'wedding');
  const [selectedLocation, setSelectedLocation] = useState(currentFilters?.location || 'Godhra');
  const [eventDate, setEventDate] = useState(currentFilters?.eventDate || '2026-12-15');
  const [guestCount, setGuestCount] = useState(currentFilters?.guestCount || '350-700');
  const [selectedBudget, setSelectedBudget] = useState(currentFilters?.budget || 'budget-2');
  const [selectedServices, setSelectedServices] = useState(currentFilters?.services || ['mandap']);
  const [verifiedOnly, setVerifiedOnly] = useState(currentFilters?.verifiedOnly ?? true);
  const [sortBy, setSortBy] = useState(currentFilters?.sortBy || 'recommended');

  if (!visible) return null;

  const toggleService = (catId) => {
    setSelectedServices((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleApply = () => {
    onApplySearch({
      eventType,
      location: selectedLocation,
      eventDate,
      guestCount,
      budget: selectedBudget,
      requiredServices: selectedServices,
      verifiedOnly,
      sortBy,
    });
    onClose();
  };

  const handleReset = () => {
    setEventType('wedding');
    setSelectedLocation('Godhra');
    setEventDate('');
    setGuestCount('350-700');
    setSelectedBudget('budget-2');
    setSelectedServices(['mandap']);
    setVerifiedOnly(false);
    setSortBy('recommended');
    onApplySearch({
      eventType: 'wedding',
      location: '',
      eventDate: '',
      guestCount: '',
      budget: '',
      requiredServices: [],
      verifiedOnly: false,
      sortBy: 'recommended',
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>🎯 AI-POWERED SMART SEARCH</Text>
              </View>
              <Text style={styles.title}>Find Verified Vendors in Panchmahal</Text>
              <Text style={styles.subtitle}>
                Customized for your event type, location, date & budget
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* 1. Event Type Selector */}
            <Text style={styles.sectionTitle}>1. Select Event Type (પ્રસંગનો પ્રકાર)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {EVENT_TYPES.map((et) => {
                const active = eventType === et.id;
                return (
                  <TouchableOpacity
                    key={et.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setEventType(et.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chipIcon}>{et.icon}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {et.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 2. Location (Taluka / City in Panchmahal) */}
            <Text style={styles.sectionTitle}>2. Event Location (સ્થળ / તાલુકો)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {PANCHMAHAL_TALUKAS.map((taluka) => {
                const active = selectedLocation === taluka.name.split(' ')[0];
                return (
                  <TouchableOpacity
                    key={taluka.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedLocation(taluka.name.split(' ')[0])}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chipIcon}>📍</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {taluka.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 3. Event Date Selector */}
            <Text style={styles.sectionTitle}>3. Event Date (તારીખ)</Text>
            <View style={styles.dateSelectorBox}>
              <Text style={styles.dateLabel}>Auspicious Wedding Dates (તારીખો):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datePillsRow}>
                {['2026-11-25', '2026-12-10', '2026-12-15', '2026-12-18', '2026-12-25', '2027-01-18', '2027-02-14'].map((d) => {
                  const active = eventDate === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.datePill, active && styles.datePillActive]}
                      onPress={() => setEventDate(d)}
                    >
                      <Text style={[styles.datePillText, active && styles.datePillTextActive]}>
                        📅 {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TextInput
                style={styles.customDateInput}
                placeholder="Or enter date (YYYY-MM-DD)"
                placeholderTextColor="#94a3b8"
                value={eventDate}
                onChangeText={setEventDate}
              />
            </View>

            {/* 4. Guest Count & Budget */}
            <View style={styles.twoCol}>
              <View style={styles.col}>
                <Text style={styles.sectionTitle}>4. Guests (મહેમાનો)</Text>
                {GUEST_RANGES.slice(0, 4).map((g) => {
                  const active = guestCount === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.radioItem, active && styles.radioItemActive]}
                      onPress={() => setGuestCount(g.id)}
                    >
                      <Text style={[styles.radioText, active && styles.radioTextActive]}>
                        {active ? '●' : '○'} {g.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.col}>
                <Text style={styles.sectionTitle}>5. Budget (બજેટ)</Text>
                {BUDGET_RANGES.map((b) => {
                  const active = selectedBudget === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.radioItem, active && styles.radioItemActive]}
                      onPress={() => setSelectedBudget(b.id)}
                    >
                      <Text style={[styles.radioText, active && styles.radioTextActive]}>
                        {active ? '●' : '○'} {b.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 6. Required Services (Multi-Select) */}
            <Text style={styles.sectionTitle}>6. Required Services (જરૂરી સેવાઓ)</Text>
            <View style={styles.servicesGrid}>
              {categories
                .filter((c) => c.id !== 'all')
                .map((cat) => {
                  const active = selectedServices.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.serviceCheckCard, active && styles.serviceCheckCardActive]}
                      onPress={() => toggleService(cat.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.serviceIcon}>{cat.icon}</Text>
                      <View style={styles.serviceTextGroup}>
                        <Text style={[styles.serviceTitle, active && styles.serviceTitleActive]}>
                          {cat.label}
                        </Text>
                        <Text style={styles.serviceGuj}>{cat.gujarati}</Text>
                      </View>
                      <Text style={styles.checkMarker}>{active ? '✅' : '➕'}</Text>
                    </TouchableOpacity>
                  );
                })}
            </View>

            {/* 7. Sorting & Verification */}
            <Text style={styles.sectionTitle}>7. Filter & Sort Options</Text>
            <View style={styles.sortRow}>
              {[
                { id: 'recommended', label: '⭐ Recommended' },
                { id: 'price_low', label: '💰 Price Low to High' },
                { id: 'price_high', label: '💎 Luxury First' },
                { id: 'rating', label: '🏆 Top Rated (5.0)' },
              ].map((s) => {
                const active = sortBy === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.sortPill, active && styles.sortPillActive]}
                    onPress={() => setSortBy(s.id)}
                  >
                    <Text style={[styles.sortPillText, active && styles.sortPillTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Verified Only Switch */}
            <TouchableOpacity
              style={styles.verifiedToggleRow}
              onPress={() => setVerifiedOnly(!verifiedOnly)}
              activeOpacity={0.85}
            >
              <Text style={styles.verifiedToggleIcon}>{verifiedOnly ? '🛡️' : '⚪'}</Text>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.verifiedToggleTitle}>Only 100% Verified Local Vendors</Text>
                <Text style={styles.verifiedToggleDesc}>
                  Physically verified service providers in Godhra & Panchmahal
                </Text>
              </View>
              <Text style={styles.verifiedToggleState}>{verifiedOnly ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Action Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.resetBtnText}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>✨ View Matching Vendors</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
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
  badge: {
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
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#d97706',
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#92400e',
    fontWeight: '800',
  },
  dateSelectorBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  datePillsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  datePill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  datePillActive: {
    backgroundColor: '#16a34a',
    borderColor: '#15803d',
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  datePillTextActive: {
    color: '#ffffff',
  },
  customDateInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#1e293b',
  },
  twoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  col: {
    flex: 1,
    marginRight: 6,
  },
  radioItem: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  radioItemActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#d97706',
  },
  radioText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  radioTextActive: {
    color: '#92400e',
    fontWeight: '800',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCheckCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  serviceCheckCardActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  serviceIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  serviceTextGroup: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  serviceTitleActive: {
    color: '#1d4ed8',
  },
  serviceGuj: {
    fontSize: 9.5,
    color: '#64748b',
  },
  checkMarker: {
    fontSize: 12,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  sortPill: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  sortPillActive: {
    backgroundColor: '#78350f',
    borderColor: '#78350f',
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  sortPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  verifiedToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  verifiedToggleIcon: {
    fontSize: 20,
  },
  verifiedToggleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  verifiedToggleDesc: {
    fontSize: 10.5,
    color: '#15803d',
  },
  verifiedToggleState: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  resetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
