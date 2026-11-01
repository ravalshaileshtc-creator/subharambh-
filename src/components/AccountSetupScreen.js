import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';

export default function AccountSetupScreen({
  user,
  onCompleteSetup,
  onOpenAuthModal,
  onLogout,
}) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [accountType, setAccountType] = useState('customer'); // 'customer' | 'vendor'
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('mandap');

  const handleSubmit = () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (accountType === 'vendor' && !businessName.trim()) {
      Alert.alert('Business Name Required', 'Please provide your event business or brand name.');
      return;
    }

    const profileData = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      role: accountType,
      vendor_status: accountType === 'vendor' ? 'pending' : 'not_applicable',
      business_name: accountType === 'vendor' ? businessName.trim() : null,
      category: accountType === 'vendor' ? category : null,
    };

    Alert.alert(
      'Profile Configured ✅',
      accountType === 'vendor'
        ? 'Your vendor application has been registered and submitted for Godhra administrative review.'
        : 'Welcome to Panchmahal Events Hub! You can now explore verified vendors and send inquiries.'
    );

    if (onCompleteSetup) {
      onCompleteSetup(profileData);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>📝</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>SETUP REQUIRED</Text>
        </View>

        <Text style={styles.title}>Complete Your Account Profile</Text>
        <Text style={styles.subtitle}>પંચમહાલ ઇવેન્ટ્સ હબ પર તમારી પ્રોફાઇલ બનાવો</Text>

        <Text style={styles.description}>
          To protect marketplace security and apply correct Role-Based Access Control, please complete your user profile.
        </Text>

        {/* Account Type Selector */}
        <Text style={styles.inputLabel}>I am joining as: *</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, accountType === 'customer' && styles.typeBtnActive]}
            onPress={() => setAccountType('customer')}
          >
            <Text style={styles.typeIcon}>👤</Text>
            <Text style={[styles.typeText, accountType === 'customer' && styles.typeTextActive]}>
              Customer
            </Text>
            <Text style={styles.typeSub}>Planning an event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, accountType === 'vendor' && styles.typeBtnActive]}
            onPress={() => setAccountType('vendor')}
          >
            <Text style={styles.typeIcon}>🏪</Text>
            <Text style={[styles.typeText, accountType === 'vendor' && styles.typeTextActive]}>
              Event Vendor
            </Text>
            <Text style={styles.typeSub}>List my business</Text>
          </TouchableOpacity>
        </View>

        {/* Inputs */}
        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Rajeshbhai Patel"
          placeholderTextColor="#94a3b8"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.inputLabel}>Mobile Number (WhatsApp) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 98250 98765"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
        />

        {accountType === 'vendor' && (
          <>
            <Text style={styles.inputLabel}>Business / Mandap / Studio Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Shree Ram Mandap Decorators"
              placeholderTextColor="#94a3b8"
              value={businessName}
              onChangeText={setBusinessName}
            />

            <View style={styles.vendorNoticeBox}>
              <Text style={styles.vendorNoticeText}>
                ⏳ <Text style={{ fontWeight: '700' }}>Note:</Text> Vendor accounts require verification by Godhra & Panchmahal administrators before the Vendor Dashboard is activated.
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Save & Proceed to Marketplace ➔</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchBtn} activeOpacity={0.85} onPress={onOpenAuthModal}>
          <Text style={styles.switchBtnText}>Switch Account or Login 🔁</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 28,
  },
  badge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 8,
  },
  badgeText: {
    color: '#0284c7',
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
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  typeBtnActive: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  typeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  typeTextActive: {
    color: '#0284c7',
  },
  typeSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 8,
  },
  vendorNoticeBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fef08a',
    marginVertical: 10,
  },
  vendorNoticeText: {
    fontSize: 11,
    color: '#854d0e',
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  switchBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchBtnText: {
    color: '#64748b',
    fontSize: 11.5,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
