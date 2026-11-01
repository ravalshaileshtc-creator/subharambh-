import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function UnauthorizedScreen({
  reason,
  onRedirectToSafeDashboard,
  onOpenAuthModal,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🚫</Text>
        </View>

        <Text style={styles.title}>403 Access Denied</Text>
        <Text style={styles.subTitle}>Role Authorization Failure</Text>

        <Text style={styles.reasonText}>
          {reason || 'You do not have the required permissions or verified account role to access this dashboard.'}
        </Text>

        <View style={styles.policyBox}>
          <Text style={styles.policyTitle}>🛡️ Shubh Celebrations Security Policy:</Text>
          <Text style={styles.policyItem}>• Customer accounts cannot access vendor operations or admin financials.</Text>
          <Text style={styles.policyItem}>• Vendor partners cannot access company profits or other vendors\' records.</Text>
          <Text style={styles.policyItem}>• Admin consoles require authenticated server-side superadmin roles.</Text>
        </View>

        <TouchableOpacity style={styles.safeRedirectBtn} onPress={onRedirectToSafeDashboard}>
          <Text style={styles.safeRedirectText}>➔ Return to Your Authorized Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchRoleBtn} onPress={onOpenAuthModal}>
          <Text style={styles.switchRoleText}>Switch or Login with Authorized Account 🔁</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#991b1b',
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 2,
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  policyBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  policyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  policyItem: {
    fontSize: 10.5,
    color: '#64748b',
    lineHeight: 15,
    marginBottom: 3,
  },
  safeRedirectBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  safeRedirectText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  switchRoleBtn: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  switchRoleText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '700',
  },
});
