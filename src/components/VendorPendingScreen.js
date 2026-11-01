import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {
  getVendorListingByPhone,
  vendorResubmitListing,
} from '../services/superAdminService';

export default function VendorPendingScreen({
  user,
  onRefreshStatus,
  onOpenAuthModal,
  onLogout,
}) {
  const listing = getVendorListingByPhone(user?.phone) || {};
  const currentStatus = listing.listing_status || (user?.vendor_status === 'approved' ? 'approved' : 'pending');

  // Edit & Resubmit Modal State
  const [resubmitModalVisible, setResubmitModalVisible] = useState(false);
  const [editBizName, setEditBizName] = useState(listing.business_name || user?.business_name || '');
  const [editCategory, setEditCategory] = useState(listing.category || user?.category || 'mandap');
  const [editPrice, setEditPrice] = useState(listing.price_range || '₹25,000 - ₹75,000');
  const [editLocation, setEditLocation] = useState(listing.location || user?.city || 'Godhra');
  const [editDesc, setEditDesc] = useState(listing.description || '');

  const openSupportWhatsApp = () => {
    const msg = `Namaste Panchmahal Events Admin! 🙏\nRegarding my pending vendor application:\n• Application ID: ${user?.application_id || 'APP-Pending'}\n• Business: ${listing.business_name || user?.business_name || user?.full_name}\n• Phone: ${user?.phone}\nPlease update on verification status.`;
    Linking.openURL(`https://wa.me/919825123401?text=${encodeURIComponent(msg)}`);
  };

  const handleResubmit = async () => {
    if (!editBizName.trim()) {
      Alert.alert('Required', 'Please enter your business name.');
      return;
    }
    const res = await vendorResubmitListing(listing.id || Date.now(), user?.phone, {
      business_name: editBizName.trim(),
      category: editCategory.trim(),
      price_range: editPrice.trim(),
      location: editLocation.trim(),
      description: editDesc.trim(),
    });

    if (res.success) {
      setResubmitModalVisible(false);
      Alert.alert(
        'Listing Resubmitted! ⏳',
        'Your business listing is submitted and waiting for Admin approval.'
      );
      if (onRefreshStatus) onRefreshStatus();
    } else {
      Alert.alert('Error', res.message || 'Could not resubmit listing.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {/* Status Badge */}
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>
            {currentStatus === 'correction_requested' ? '📝' : '⏳'}
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            currentStatus === 'correction_requested' && { backgroundColor: '#eff6ff' },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              currentStatus === 'correction_requested' && { color: '#1d4ed8' },
            ]}
          >
            {currentStatus === 'correction_requested'
              ? 'ACTION REQUIRED: CORRECTIONS REQUESTED'
              : 'APPLICATION STATUS: WAITING FOR ADMIN APPROVAL'}
          </Text>
        </View>

        <Text style={styles.title}>
          {currentStatus === 'correction_requested'
            ? 'Corrections Requested by Admin'
            : 'Vendor Profile Under Review'}
        </Text>
        <Text style={styles.subtitle}>
          {currentStatus === 'correction_requested'
            ? 'એડમિન દ્વારા સુધારાની વિનંતી કરવામાં આવી છે'
            : 'વેપારી પ્રોફાઇલ વહીવટી ચકાસણી હેઠળ છે'}
        </Text>

        <Text style={styles.description}>
          Your business listing is submitted and waiting for Admin approval. Our verification team reviews all credentials to protect event customers.
        </Text>

        {/* Correction Notes Banner if Admin requested updates */}
        {listing.correction_notes && (
          <View style={styles.correctionAlertBox}>
            <Text style={styles.correctionAlertTitle}>📋 Admin Correction Notes:</Text>
            <Text style={styles.correctionAlertText}>"{listing.correction_notes}"</Text>
            <TouchableOpacity
              style={styles.resubmitActionBtn}
              activeOpacity={0.85}
              onPress={() => setResubmitModalVisible(true)}
            >
              <Text style={styles.resubmitActionBtnText}>✏️ Edit & Resubmit Business Listing</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Application Details Summary */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application ID:</Text>
            <Text style={styles.infoValueHighlight}>{user?.application_id || `APP-2026-${String(listing.id || '9041').slice(-4)}`}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Name:</Text>
            <Text style={styles.infoValue}>{listing.business_name || user?.business_name || user?.full_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoValue}>{listing.category || user?.category || 'Mandap & Event Decor'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registered Phone:</Text>
            <Text style={styles.infoValue}>+91 {user?.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{listing.location || user?.city || 'Godhra'}, Panchmahal</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Submitted On:</Text>
            <Text style={styles.infoValue}>
              {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'Recently'}
            </Text>
          </View>
        </View>

        {/* Verification Timeline */}
        <View style={styles.timelineBox}>
          <Text style={styles.timelineTitle}>Verification Stages:</Text>

          <View style={styles.timelineItem}>
            <Text style={styles.timelineIcon}>✅</Text>
            <View style={styles.timelineTextGroup}>
              <Text style={styles.timelineStepTitle}>Step 1: Listing Submitted</Text>
              <Text style={styles.timelineStepDesc}>Your business details were safely recorded in Supabase.</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <Text style={styles.timelineIcon}>⏳</Text>
            <View style={styles.timelineTextGroup}>
              <Text style={styles.timelineStepTitleActive}>Step 2: Admin Approval (Pending)</Text>
              <Text style={styles.timelineStepDesc}>Admin verifies business authenticity and credentials before public listing.</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <Text style={styles.timelineIcon}>🔒</Text>
            <View style={styles.timelineTextGroup}>
              <Text style={styles.timelineStepTitle}>Step 3: Public Marketplace Activation</Text>
              <Text style={styles.timelineStepDesc}>Your business becomes visible to customers across Panchmahal & Gujarat.</Text>
            </View>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            🛡️ <Text style={{ fontWeight: '700' }}>Strict Marketplace Protection:</Text> Businesses remain hidden from public customer searches, home page, and enquiries until approved by an authorized Administrator.
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.refreshBtn}
          activeOpacity={0.85}
          onPress={() => {
            Alert.alert(
              'Checking Status...',
              'Your business listing is submitted and waiting for Admin approval. Estimated review within 24 hours.'
            );
            if (onRefreshStatus) onRefreshStatus();
          }}
        >
          <Text style={styles.refreshBtnText}>🔄 Refresh Application Status</Text>
        </TouchableOpacity>

        {/* Resubmit button accessible anytime */}
        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: '#334155', marginTop: 10 }]}
          activeOpacity={0.85}
          onPress={() => setResubmitModalVisible(true)}
        >
          <Text style={styles.refreshBtnText}>✏️ Edit Listing Details & Resubmit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whatsappBtn}
          activeOpacity={0.85}
          onPress={openSupportWhatsApp}
        >
          <Text style={styles.whatsappBtnText}>💬 Chat with Admin Team</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchBtn}
          activeOpacity={0.85}
          onPress={onOpenAuthModal}
        >
          <Text style={styles.switchBtnText}>Switch Account or Login with Another User 🔁</Text>
        </TouchableOpacity>
      </View>

      {/* Edit & Resubmit Modal */}
      <Modal visible={resubmitModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.resubmitCard}>
            <Text style={styles.modalTitle}>✏️ Edit & Resubmit Listing</Text>
            <Text style={styles.modalSub}>Update your business information for Admin review.</Text>

            <Text style={styles.fieldLabel}>Business Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={editBizName}
              onChangeText={setEditBizName}
              placeholder="e.g. Shree Ram Mandap"
            />

            <Text style={styles.fieldLabel}>Category *</Text>
            <TextInput
              style={styles.modalInput}
              value={editCategory}
              onChangeText={setEditCategory}
              placeholder="e.g. mandap, catering, dj"
            />

            <Text style={styles.fieldLabel}>Price Range *</Text>
            <TextInput
              style={styles.modalInput}
              value={editPrice}
              onChangeText={setEditPrice}
              placeholder="e.g. ₹20,000 - ₹50,000"
            />

            <Text style={styles.fieldLabel}>Location in Panchmahal *</Text>
            <TextInput
              style={styles.modalInput}
              value={editLocation}
              onChangeText={setEditLocation}
              placeholder="e.g. Godhra, Halol Road"
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              value={editDesc}
              onChangeText={setEditDesc}
              multiline
              placeholder="Tell customers about your services..."
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setResubmitModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleResubmit}
              >
                <Text style={styles.modalSubmitBtnText}>Resubmit Listing 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
  },
  badge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  badgeText: {
    color: '#b45309',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 14,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4.5,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  infoValueHighlight: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '800',
  },
  timelineBox: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  timelineIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 1,
  },
  timelineTextGroup: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  timelineStepTitleActive: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#d97706',
  },
  timelineStepDesc: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  noticeBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 18,
    width: '100%',
  },
  noticeText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 16,
  },
  refreshBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 11,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  switchBtn: {
    paddingVertical: 10,
  },
  switchBtnText: {
    color: '#64748b',
    fontSize: 11.5,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  correctionAlertBox: {
    width: '100%',
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  correctionAlertTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 4,
  },
  correctionAlertText: {
    fontSize: 11.5,
    color: '#1e3a8a',
    lineHeight: 16,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  resubmitActionBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  resubmitActionBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  resubmitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 480,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  modalCancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
  },
  modalSubmitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
});
