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

export default function VendorPendingScreen({
  user,
  onRefreshStatus,
  onOpenAuthModal,
  onLogout,
}) {
  const openSupportWhatsApp = () => {
    const msg = `Namaste Panchmahal Events Admin! 🙏\nRegarding my pending vendor application:\n• Application ID: ${user.application_id || 'APP-Pending'}\n• Business: ${user.business_name || user.full_name}\n• Phone: ${user.phone}\nPlease update on verification status.`;
    Linking.openURL(`https://wa.me/919825123401?text=${encodeURIComponent(msg)}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {/* Status Badge */}
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>⏳</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>APPLICATION STATUS: PENDING VERIFICATION</Text>
        </View>

        <Text style={styles.title}>Vendor Profile Under Review</Text>
        <Text style={styles.subtitle}>વેપારી પ્રોફાઇલ વહીવટી ચકાસણી હેઠળ છે</Text>

        <Text style={styles.description}>
          Thank you for applying to list on <Text style={{ fontWeight: '700' }}>Shubh Celebrations (Panchmahal Events Hub)</Text>. Our Godhra operations team is currently verifying your business credentials to maintain marketplace quality.
        </Text>

        {/* Application Details Summary */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application ID:</Text>
            <Text style={styles.infoValueHighlight}>{user.application_id || 'APP-2026-9041'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Name:</Text>
            <Text style={styles.infoValue}>{user.business_name || user.full_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoValue}>{user.category || 'Mandap & Event Decor'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registered Phone:</Text>
            <Text style={styles.infoValue}>+91 {user.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{user.city || 'Godhra'}, Panchmahal</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Submitted On:</Text>
            <Text style={styles.infoValue}>
              {user.submitted_at ? new Date(user.submitted_at).toLocaleDateString() : 'Recently'}
            </Text>
          </View>
        </View>

        {/* Verification Timeline */}
        <View style={styles.timelineBox}>
          <Text style={styles.timelineTitle}>Verification Stages:</Text>

          <View style={styles.timelineItem}>
            <Text style={styles.timelineIcon}>✅</Text>
            <View style={styles.timelineTextGroup}>
              <Text style={styles.timelineStepTitle}>Step 1: Application Registered</Text>
              <Text style={styles.timelineStepDesc}>Your details were safely recorded in Supabase.</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <Text style={styles.timelineIcon}>⏳</Text>
            <View style={styles.timelineTextGroup}>
              <Text style={styles.timelineStepTitleActive}>Step 2: Local Panchmahal Verification (Active)</Text>
              <Text style={styles.timelineStepDesc}>Our team confirms your phone number and local business legitimacy.</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <Text style={styles.timelineIcon}>🔒</Text>
            <View style={styles.timelineTextGroup}>
              <Text style={styles.timelineStepTitle}>Step 3: Vendor Dashboard Activation</Text>
              <Text style={styles.timelineStepDesc}>Full access to accept booking requests, manage pricing and calendars.</Text>
            </View>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            🛡️ <Text style={{ fontWeight: '700' }}>Marketplace Protection Policy:</Text> To prevent fake listings and protect customer advances, vendor dashboards remain locked until approved by the Panchmahal administration.
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.refreshBtn}
          activeOpacity={0.85}
          onPress={() => {
            Alert.alert(
              'Checking Status...',
              'Your application is still under review by the Godhra verification team. Estimated approval within 24 to 48 hours.'
            );
            if (onRefreshStatus) onRefreshStatus();
          }}
        >
          <Text style={styles.refreshBtnText}>🔄 Refresh Application Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whatsappBtn}
          activeOpacity={0.85}
          onPress={openSupportWhatsApp}
        >
          <Text style={styles.whatsappBtnText}>💬 Chat with Godhra Concierge Team</Text>
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
});
