import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { recordDirectPayment } from '../services/marketplaceEngine';

export default function CustomerDirectPaymentModal({
  visible,
  onClose,
  booking,
  currentUser,
  onPaymentRecorded,
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI'); // 'UPI' | 'Cash' | 'Direct Bank Transfer' | 'Cheque'
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  if (!visible || !booking) return null;

  const handleSubmit = () => {
    if (!amount.trim() || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }
    if (!reference.trim()) {
      Alert.alert('Required Field', 'Please provide the transaction reference, UTR, or Cash Receipt number.');
      return;
    }

    const res = recordDirectPayment({
      booking_id: booking.id,
      booking_code: booking.booking_code,
      customer_id: currentUser?.id || 'usr-cust-101',
      customer_name: currentUser?.full_name || 'Valued Customer',
      vendor_id: booking.vendor_id,
      vendor_name: booking.vendor_name,
      amount: Number(amount),
      payment_method: method,
      payment_reference: reference.trim(),
      notes: notes.trim(),
    });

    if (res.success) {
      Alert.alert(
        'Direct Payment Logged ✅',
        `₹${Number(amount).toLocaleString('en-IN')} via ${method} has been registered.\n\nRef: ${reference}\n\nThe vendor has been notified to verify and confirm receipt in their dashboard.`
      );
      if (onPaymentRecorded) onPaymentRecorded(res.payment);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>⚡ 100% DIRECT TO VENDOR • 0% COMMISSION ON CLIENT</Text>
              </View>
              <Text style={styles.title}>Direct Vendor Payment</Text>
              <Text style={styles.subtitle}>ગ્રાહક દ્વારા વેપારીને સીધું પેમેન્ટ</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Zero Intermediation Policy Banner */}
            <View style={styles.policyBanner}>
              <Text style={styles.policyTitle}>🛡️ Pure Marketplace Payment Model:</Text>
              <Text style={styles.policyText}>
                Shubh Celebrations does <Text style={{ fontWeight: '800' }}>NOT</Text> collect your event money. You pay your vendor directly using their preferred payment method (GPay/PhonePe/Cash/NEFT).
              </Text>
            </View>

            {/* Booking Summary */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Booking Code:</Text>
                <Text style={styles.summaryValHighlight}>{booking.booking_code}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Vendor Name:</Text>
                <Text style={styles.summaryVal}>{booking.vendor_name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Event Date & Venue:</Text>
                <Text style={styles.summaryVal}>{booking.event_date} • {booking.city_name || 'Godhra'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Agreed Package Total:</Text>
                <Text style={styles.summaryValBold}>₹{(booking.total_booking_amount || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.inputLabel}>Payment Mode Used: *</Text>
            <View style={styles.methodRow}>
              {['UPI', 'Cash', 'Direct Bank Transfer', 'Cheque'].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodBtn, method === m && styles.methodBtnActive]}
                  onPress={() => setMethod(m)}
                >
                  <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount Paid */}
            <Text style={styles.inputLabel}>Amount Paid Directly to Vendor (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 35000"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Transaction Reference */}
            <Text style={styles.inputLabel}>Transaction Ref / UTR / Cash Receipt No. *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. UPI/2026/894120847 or Receipt #104"
              placeholderTextColor="#94a3b8"
              value={reference}
              onChangeText={setReference}
            />

            {/* Security Notice */}
            <View style={styles.securityBox}>
              <Text style={styles.securityText}>
                🔒 <Text style={{ fontWeight: '700' }}>Security Rule:</Text> Never enter UPI PINs or card details. Only record the completed transaction reference number for audit verification.
              </Text>
            </View>

            {/* Notes */}
            <Text style={styles.inputLabel}>Notes / Purpose (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="e.g. 50% advance for Mandap setup and stage decor"
              placeholderTextColor="#94a3b8"
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Confirm Direct Payment Record ➔</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tagText: {
    color: '#15803d',
    fontSize: 9.5,
    fontWeight: '800',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  body: {
    padding: 16,
  },
  policyBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 14,
  },
  policyTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 2,
  },
  policyText: {
    fontSize: 11,
    color: '#1e3a8a',
    lineHeight: 16,
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 11.5,
    color: '#64748b',
  },
  summaryVal: {
    fontSize: 11.5,
    color: '#0f172a',
    fontWeight: '600',
  },
  summaryValHighlight: {
    fontSize: 11.5,
    color: '#0284c7',
    fontWeight: '800',
  },
  summaryValBold: {
    fontSize: 12.5,
    color: '#0f172a',
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
    marginTop: 6,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  methodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  methodBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  methodText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
    color: '#0f172a',
    marginBottom: 8,
  },
  securityBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginVertical: 8,
  },
  securityText: {
    fontSize: 10.5,
    color: '#991b1b',
    lineHeight: 15,
  },
  submitBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
