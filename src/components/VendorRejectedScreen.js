import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';

export default function VendorRejectedScreen({
  user,
  onReapply,
  onOpenAuthModal,
  onLogout,
}) {
  const openAppealWhatsApp = () => {
    const msg = `Namaste Panchmahal Events Admin! 🙏\nRegarding my rejected vendor application:\n• Application ID: ${user.application_id || 'APP-Rejected'}\n• Business: ${user.business_name || user.full_name}\n• Phone: ${user.phone}\nI would like to provide updated verification documents and appeal this decision.`;
    Linking.openURL(`https://wa.me/919825123401?text=${encodeURIComponent(msg)}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {/* Status Badge */}
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>❌</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>APPLICATION STATUS: NOT APPROVED</Text>
        </View>

        <Text style={styles.title}>Vendor Application Declined</Text>
        <Text style={styles.subtitle}>વેપારી નોંધણી સ્વીકારવામાં આવી નથી</Text>

        <Text style={styles.description}>
          We reviewed the application for <Text style={{ fontWeight: '700' }}>{user.business_name || user.full_name}</Text>. At this time, our Godhra verification committee could not approve the listing based on our marketplace requirements.
        </Text>

        {/* Reason Box */}
        <View style={styles.reasonBox}>
          <Text style={styles.reasonHeader}>Official Verification Committee Feedback:</Text>
          <Text style={styles.reasonText}>
            "{user.rejection_reason || 'Verification criteria could not be met. Missing valid Panchmahal district local business address proof or phone number was unreachable.'}"
          </Text>
        </View>

        {/* Application Details Summary */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application ID:</Text>
            <Text style={styles.infoValueHighlight}>{user.application_id || 'APP-2026-8812'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Name:</Text>
            <Text style={styles.infoValue}>{user.business_name || user.full_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{user.city || 'Halol'}, Panchmahal</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reviewed Date:</Text>
            <Text style={styles.infoValue}>
              {user.reviewed_at ? new Date(user.reviewed_at).toLocaleDateString() : 'Recent'}
            </Text>
          </View>
        </View>

        {/* Reapplication Help */}
        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>How to get your profile approved:</Text>
          <Text style={styles.helpItem}>1. Ensure your phone number is active and responsive.</Text>
          <Text style={styles.helpItem}>2. Provide authentic local Panchmahal address verification.</Text>
          <Text style={styles.helpItem}>3. Share genuine wedding/event work photos or client references.</Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.reapplyBtn}
          activeOpacity={0.85}
          onPress={() => {
            Alert.alert(
              'Re-application',
              'You can submit a fresh application with verified documents or contact our Godhra administrative desk directly.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Appeal via WhatsApp', onPress: openAppealWhatsApp },
              ]
            );
            if (onReapply) onReapply();
          }}
        >
          <Text style={styles.reapplyBtnText}>📝 Submit Updated Details / Re-apply</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whatsappBtn}
          activeOpacity={0.85}
          onPress={openAppealWhatsApp}
        >
          <Text style={styles.whatsappBtnText}>💬 Appeal with Admin via WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchBtn}
          activeOpacity={0.85}
          onPress={onOpenAuthModal}
        >
          <Text style={styles.switchBtnText}>Switch Account or Login with Another User 🔁</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
  },
  badge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  badgeText: {
    color: '#b91c1c',
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
  reasonBox: {
    backgroundColor: '#fff1f2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
    width: '100%',
    marginBottom: 16,
  },
  reasonHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#be123c',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  reasonText: {
    fontSize: 12.5,
    color: '#881337',
    fontStyle: 'italic',
    lineHeight: 18,
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
    paddingVertical: 4,
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
    color: '#e11d48',
    fontWeight: '800',
  },
  helpBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 18,
  },
  helpTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  helpItem: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 17,
    marginVertical: 2,
  },
  reapplyBtn: {
    backgroundColor: '#e11d48',
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  reapplyBtnText: {
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
});
