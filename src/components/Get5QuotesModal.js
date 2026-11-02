import React, { useState, useEffect } from 'react';
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
import { EVENT_TYPES, GUEST_RANGES, BUDGET_RANGES } from '../constants/eventTypes';
import { PANCHMAHAL_TALUKAS } from '../constants/locations';
import {
  createCustomerEnquiry,
  getCustomerEnquiries,
  fetchRealtimeCustomerEnquiries,
  submitVendorQuote,
  maskPhoneNumber,
} from '../services/marketplaceService';

export default function Get5QuotesModal({
  visible,
  onClose,
  allVendors = [],
  categories = [],
  makeCall,
  openWhatsApp,
  user = null,
  currentUser = null,
}) {
  const activeUser = user || currentUser;
  const isVendorOrAdmin =
    activeUser?.role === 'vendor' ||
    activeUser?.role === 'admin' ||
    activeUser?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState('new_request'); // 'new_request' | 'my_quotes' | 'vendor_leads'
  const [enquiries, setEnquiries] = useState([]);

  // Calculate default future date (30 days from now)
  const getDefaultEventDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  // Form State
  const [name, setName] = useState(activeUser?.full_name || '');
  const [phone, setPhone] = useState(activeUser?.phone || '');
  const [eventType, setEventType] = useState('wedding');
  const [location, setLocation] = useState('Godhra (Bamroli Road)');
  const [eventDate, setEventDate] = useState(getDefaultEventDate());
  const [guestCount, setGuestCount] = useState('350-700 મહેમાનો (Large)');
  const [selectedServices, setSelectedServices] = useState(['mandap', 'catering']);
  const [budget, setBudget] = useState('₹2,00,000 - ₹5,00,000');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState(null);

  // Vendor quote submission helper
  const [vendorQuotePrice, setVendorQuotePrice] = useState('');
  const [vendorQuoteDetails, setVendorQuoteDetails] = useState('');

  // Sync enquiries whenever modal opens or user updates
  const refreshEnquiries = async () => {
    const local = getCustomerEnquiries(activeUser);
    setEnquiries(local || []);
    try {
      const live = await fetchRealtimeCustomerEnquiries(activeUser);
      if (Array.isArray(live)) {
        setEnquiries([...live]);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (visible) {
      if (activeUser?.full_name && !name) setName(activeUser.full_name);
      if (activeUser?.phone && !phone) setPhone(activeUser.phone);
      refreshEnquiries();
    }
  }, [visible, activeUser]);

  if (!visible) return null;

  const toggleService = (catId) => {
    setSelectedServices((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleSubmitLead = () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit Indian Mobile Number (starts with 6-9).');
      return;
    }

    if (selectedServices.length === 0) {
      Alert.alert('Select Service', 'Please select at least one required service (Mandap, Catering, etc.).');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const result = createCustomerEnquiry(
        {
          customer_id: activeUser?.id || null,
          customer_name: name.trim(),
          customer_phone: cleanPhone,
          event_type: eventType,
          location,
          event_date: eventDate,
          guest_count: guestCount,
          services: selectedServices,
          budget,
          notes: notes.trim(),
        },
        allVendors
      );

      setSubmitting(false);
      setLastSubmissionResult(result);
      refreshEnquiries();
      setActiveTab('my_quotes');

      Alert.alert(
        '🎉 Requirement Dispatched!',
        `Your Enquiry ID: ${result.enquiryCode}\n\nMatched with ${result.matchedCount} top verified local vendors in Panchmahal.\n\nThey have been notified and will send verified quotations directly to your dashboard & WhatsApp!`,
        [{ text: 'View Quotes & Status' }]
      );
    }, 600);
  };

  const handleSimulateVendorQuote = (enquiryId, vendor) => {
    if (!vendorQuotePrice.trim()) {
      Alert.alert('Enter Price', 'Please enter quoted amount (e.g. ₹65,000).');
      return;
    }

    submitVendorQuote(enquiryId, vendor.id, {
      vendor_name: vendor.business_name || vendor.name,
      category: vendor.category,
      quoted_price: vendorQuotePrice.trim(),
      package_details: vendorQuoteDetails.trim() || 'Custom Panchmahal wedding package tailored for your date.',
      valid_until: '10 Days',
    });

    setVendorQuotePrice('');
    setVendorQuoteDetails('');
    refreshEnquiries();
    Alert.alert('Quotation Sent!', `Quotation submitted to customer for Enquiry ${enquiryId}.`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badgeRow}>
                <Text style={styles.topBadge}>⚡ 1-CLICK EVENT REQUIREMENT</Text>
              </View>
              <Text style={styles.title}>Get 5 Event Quotes</Text>
              <Text style={styles.subtitle}>
                Fill once ➔ Receive competitive quotes from verified Panchmahal vendors
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Top Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'new_request' && styles.tabActive]}
              onPress={() => setActiveTab('new_request')}
            >
              <Text style={[styles.tabText, activeTab === 'new_request' && styles.tabTextActive]}>
                📝 Post Requirement
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'my_quotes' && styles.tabActive]}
              onPress={() => {
                setActiveTab('my_quotes');
                refreshEnquiries();
              }}
            >
              <Text style={[styles.tabText, activeTab === 'my_quotes' && styles.tabTextActive]}>
                💬 My Quotes ({enquiries.length})
              </Text>
            </TouchableOpacity>

            {/* Vendor Leads Portal is strictly visible to vendors and admins, never confusing regular customers */}
            {isVendorOrAdmin && (
              <TouchableOpacity
                style={[styles.tab, activeTab === 'vendor_leads' && styles.tabActive]}
                onPress={() => setActiveTab('vendor_leads')}
              >
                <Text style={[styles.tabText, activeTab === 'vendor_leads' && styles.tabTextActive]}>
                  🏢 Vendor Leads
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* TAB 1: NEW REQUIREMENT FORM */}
            {activeTab === 'new_request' && (
              <View>
                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerText}>
                    💡 How it works: We route your requirements to up to 5 verified local vendors. You compare their quotes and deal directly with 0% commission!
                  </Text>
                </View>

                {/* Personal Details */}
                <Text style={styles.fieldLabel}>Your Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rameshbhai Patel"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.fieldLabel}>Your 10-Digit Mobile Number (WhatsApp) *</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText}>+91</Text>
                  </View>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                {/* Event Type */}
                <Text style={styles.fieldLabel}>Event Type *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                  {EVENT_TYPES.map((et) => {
                    const active = eventType === et.id;
                    return (
                      <TouchableOpacity
                        key={et.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setEventType(et.id)}
                      >
                        <Text style={styles.chipIcon}>{et.icon}</Text>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {et.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Location */}
                <Text style={styles.fieldLabel}>Event Location in Panchmahal *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                  {PANCHMAHAL_TALUKAS.map((t) => {
                    const active = location.includes(t.name.split(' ')[0]);
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setLocation(`${t.name.split(' ')[0]} (Panchmahal)`)}
                      >
                        <Text style={styles.chipIcon}>📍</Text>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {t.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TextInput
                  style={styles.input}
                  placeholder="Or enter specific venue / hall / village"
                  placeholderTextColor="#94a3b8"
                  value={location}
                  onChangeText={setLocation}
                />

                {/* Event Date & Guests */}
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.fieldLabel}>Event Date *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={eventDate}
                      onChangeText={setEventDate}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.fieldLabel}>Approx. Guests *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 500 Guests"
                      placeholderTextColor="#94a3b8"
                      value={guestCount}
                      onChangeText={setGuestCount}
                    />
                  </View>
                </View>

                {/* Required Services */}
                <Text style={styles.fieldLabel}>Required Services (Check all that apply) *</Text>
                <View style={styles.servicesGrid}>
                  {categories
                    .filter((c) => c.id !== 'all')
                    .map((cat) => {
                      const active = selectedServices.includes(cat.id);
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[styles.servicePill, active && styles.servicePillActive]}
                          onPress={() => toggleService(cat.id)}
                        >
                          <Text style={styles.servicePillIcon}>{cat.icon}</Text>
                          <Text
                            style={[
                              styles.servicePillText,
                              active && styles.servicePillTextActive,
                            ]}
                          >
                            {cat.label}
                          </Text>
                          <Text style={styles.checkMark}>{active ? '✓' : '+'}</Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>

                {/* Total Budget Range */}
                <Text style={styles.fieldLabel}>Total Event Budget *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                  {BUDGET_RANGES.map((b) => {
                    const active = budget === b.label;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setBudget(b.label)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {b.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Additional Requirements */}
                <Text style={styles.fieldLabel}>Special Requirements / Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g. AC banquet, pure veg Kathiyawadi feast, dry ice entrance, royal LED setup..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.disabledBtn]}
                  onPress={handleSubmitLead}
                  disabled={submitting}
                >
                  <Text style={styles.submitBtnText}>
                    {submitting ? 'Matching Panchmahal Vendors...' : '🚀 Get 5 Free Quotes Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 2: MY QUOTES & STATUS DASHBOARD */}
            {activeTab === 'my_quotes' && (
              <View>
                {enquiries.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyTitle}>No Enquiries Submitted Yet</Text>
                    <Text style={styles.emptyDesc}>
                      Post your event requirements to receive up to 5 verified vendor quotes.
                    </Text>
                    <TouchableOpacity
                      style={styles.postNowBtn}
                      onPress={() => setActiveTab('new_request')}
                    >
                      <Text style={styles.postNowBtnText}>+ Post Event Requirement</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  enquiries.map((enq) => (
                    <View key={enq.id} style={styles.enquiryCard}>
                      <View style={styles.enquiryHead}>
                        <View>
                          <Text style={styles.enquiryCode}>{enq.id}</Text>
                          <Text style={styles.enquiryTitle}>
                            {enq.event_type.toUpperCase()} • {enq.location}
                          </Text>
                        </View>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>{enq.status}</Text>
                        </View>
                      </View>

                      <View style={styles.enquiryMetaRow}>
                        <Text style={styles.enquiryMeta}>📅 Date: {enq.event_date}</Text>
                        <Text style={styles.enquiryMeta}>👥 {enq.guest_count}</Text>
                        <Text style={styles.enquiryMeta}>💰 Budget: {enq.budget}</Text>
                      </View>

                      <Text style={styles.servicesTag}>
                        Services: {enq.services.join(', ').toUpperCase()}
                      </Text>

                      {/* Matched Vendors Section */}
                      <Text style={styles.subSectionTitle}>
                        Dispatched to {enq.matched_vendor_ids.length} Verified Vendors:
                      </Text>
                      <View style={styles.matchedVendorsRow}>
                        {enq.matched_vendors?.map((v) => (
                          <View key={v.id} style={styles.matchedVendorTag}>
                            <Text style={styles.matchedVendorName} numberOfLines={1}>
                              ✓ {v.name}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Quotations Received */}
                      <Text style={styles.subSectionTitle}>
                        Received Quotations ({enq.quotes.length}):
                      </Text>
                      {enq.quotes.length === 0 ? (
                        <View style={styles.waitingQuoteBox}>
                          <Text style={styles.waitingQuoteText}>
                            ⏳ Waiting for vendor quotes. Matched vendors usually respond within 15-30 minutes.
                          </Text>
                        </View>
                      ) : (
                        enq.quotes.map((q) => (
                          <View key={q.id} style={styles.quoteItemCard}>
                            <View style={styles.quoteHead}>
                              <Text style={styles.quoteVendor}>{q.vendor_name}</Text>
                              <Text style={styles.quotePrice}>{q.quoted_price}</Text>
                            </View>
                            <Text style={styles.quoteDetails}>{q.package_details}</Text>
                            <View style={styles.quoteActionRow}>
                              <TouchableOpacity
                                style={styles.acceptBtn}
                                onPress={() =>
                                  Alert.alert(
                                    'Quotation Accepted!',
                                    `Congratulations! You have selected ${q.vendor_name}. Our coordinator will connect both parties.`
                                  )
                                }
                              >
                                <Text style={styles.acceptBtnText}>✓ Accept Quote</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.quoteContactBtn}
                                onPress={() =>
                                  openWhatsApp('9825123401', q.vendor_name, q.category)
                                }
                              >
                                <Text style={styles.quoteContactText}>💬 Chat</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 3: VENDOR PORTAL (SIMULATE VENDOR QUOTATION) */}
            {activeTab === 'vendor_leads' && (
              <View>
                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerText}>
                    🏢 Vendor Quotation Portal: Verified vendors in Panchmahal can view customer leads and submit competitive quotations. (Customer phone is protected for privacy).
                  </Text>
                </View>

                {enquiries.map((enq) => (
                  <View key={`lead-${enq.id}`} style={styles.vendorLeadCard}>
                    <Text style={styles.leadId}>{enq.id} - New Customer Lead</Text>
                    <Text style={styles.leadCustomer}>
                      Customer: {enq.customer_name} ({maskPhoneNumber(enq.customer_phone)})
                    </Text>
                    <Text style={styles.leadDetails}>
                      📍 {enq.location} | 📅 {enq.event_date} | 👥 {enq.guest_count}
                    </Text>
                    <Text style={styles.leadBudget}>Budget: {enq.budget}</Text>
                    <Text style={styles.leadNotes}>Requirement: {enq.notes}</Text>

                    {/* Quotation Input for Vendors */}
                    <View style={styles.quoteForm}>
                      <Text style={styles.quoteFormLabel}>Submit Official Quotation:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Quoted Amount (e.g. ₹55,000)"
                        placeholderTextColor="#94a3b8"
                        value={vendorQuotePrice}
                        onChangeText={setVendorQuotePrice}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Package details & inclusions"
                        placeholderTextColor="#94a3b8"
                        value={vendorQuoteDetails}
                        onChangeText={setVendorQuoteDetails}
                      />
                      <TouchableOpacity
                        style={styles.sendQuoteBtn}
                        onPress={() =>
                          handleSimulateVendorQuote(enq.id, allVendors[0] || { id: 1, name: 'Vallabh Decor' })
                        }
                      >
                        <Text style={styles.sendQuoteBtnText}>📤 Send Quote to Customer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
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
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '94%',
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
    backgroundColor: '#16a34a',
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
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2.5,
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#15803d',
    fontWeight: '800',
  },
  body: {
    padding: 16,
  },
  infoBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  infoBannerText: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 10,
    color: '#1e293b',
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  codeBox: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#d97706',
  },
  chipIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#92400e',
    fontWeight: '800',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  servicePillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  servicePillIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  servicePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  servicePillTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  checkMark: {
    fontSize: 11,
    marginLeft: 6,
    fontWeight: 'bold',
  },
  textArea: {
    height: 64,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabledBtn: {
    backgroundColor: '#94a3b8',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  postNowBtn: {
    marginTop: 14,
    backgroundColor: '#16a34a',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  postNowBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  enquiryCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  enquiryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  enquiryCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#d97706',
  },
  enquiryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  enquiryMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  enquiryMeta: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  servicesTag: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 6,
    marginBottom: 6,
  },
  matchedVendorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  matchedVendorTag: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchedVendorName: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
  },
  waitingQuoteBox: {
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  waitingQuoteText: {
    fontSize: 11,
    color: '#92400e',
  },
  quoteItemCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  quoteHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  quoteVendor: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  quotePrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803d',
  },
  quoteDetails: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 8,
  },
  quoteActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  quoteContactBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  quoteContactText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  vendorLeadCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  leadId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#d97706',
  },
  leadCustomer: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  leadDetails: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  leadBudget: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 2,
  },
  leadNotes: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontStyle: 'italic',
  },
  quoteForm: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quoteFormLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  sendQuoteBtn: {
    backgroundColor: '#d97706',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  sendQuoteBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
});
