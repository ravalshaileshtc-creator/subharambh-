import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Linking,
  Alert,
  Platform,
} from 'react-native';

export default function VendorCompareModal({
  visible,
  onClose,
  comparedVendors = [],
  onRemoveVendor,
  onSendEnquiry,
  makeCall,
  openWhatsApp,
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>⚖️ SIDE-BY-SIDE VENDOR COMPARISON</Text>
              </View>
              <Text style={styles.title}>
                Comparing {comparedVendors.length} of 5 Vendors
              </Text>
              <Text style={styles.subtitle}>
                Compare verified pricing, packages, ratings & Panchmahal location
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {comparedVendors.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>⚖️</Text>
              <Text style={styles.emptyTitle}>No Vendors Selected for Comparison</Text>
              <Text style={styles.emptyDesc}>
                Tap the "⚖️ Compare" button on any vendor card to add up to 5 vendors and compare them here.
              </Text>
              <TouchableOpacity style={styles.browseBtn} onPress={onClose}>
                <Text style={styles.browseBtnText}>Browse Vendors</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
              <View style={styles.tableContainer}>
                {comparedVendors.map((vendor) => {
                  return (
                    <View key={vendor.id} style={styles.vendorCol}>
                      {/* Remove Button */}
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => onRemoveVendor(vendor.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.removeBtnText}>✕ Remove</Text>
                      </TouchableOpacity>

                      {/* Photo & Name */}
                      <Image
                        source={{
                          uri:
                            vendor.image_url ||
                            'https://images.unsplash.com/photo-1519741497674-611481863552?w=500',
                        }}
                        style={styles.vendorImage}
                        resizeMode="cover"
                      />

                      <Text style={styles.vendorName} numberOfLines={2}>
                        {vendor.business_name}
                      </Text>

                      {/* Verification Status */}
                      <View
                        style={[
                          styles.verifyBadge,
                          { backgroundColor: vendor.is_verified ? '#dcfce7' : '#f1f5f9' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.verifyText,
                            { color: vendor.is_verified ? '#15803d' : '#64748b' },
                          ]}
                        >
                          {vendor.is_verified ? '✓ 100% Verified' : 'Standard'}
                        </Text>
                      </View>

                      {/* Category */}
                      <View style={styles.cell}>
                        <Text style={styles.cellLabel}>Category</Text>
                        <Text style={styles.cellValue}>{vendor.category?.toUpperCase()}</Text>
                      </View>

                      {/* Price / Package */}
                      <View style={styles.cell}>
                        <Text style={styles.cellLabel}>Price / Starting Rate</Text>
                        <Text style={styles.cellPriceHighlight}>{vendor.price_range}</Text>
                      </View>

                      {/* Rating */}
                      <View style={styles.cell}>
                        <Text style={styles.cellLabel}>Rating</Text>
                        <Text style={styles.cellValue}>⭐ {vendor.rating || '4.9'} / 5.0</Text>
                      </View>

                      {/* Location */}
                      <View style={styles.cell}>
                        <Text style={styles.cellLabel}>Location</Text>
                        <Text style={styles.cellValue} numberOfLines={2}>
                          📍 {vendor.location}
                        </Text>
                      </View>

                      {/* Special Services Included */}
                      <View style={styles.cell}>
                        <Text style={styles.cellLabel}>Included Highlights</Text>
                        <Text style={styles.cellSubValue} numberOfLines={3}>
                          {vendor.description || 'Verified local event management in Panchmahal'}
                        </Text>
                      </View>

                      {/* Direct Actions */}
                      <View style={styles.actionCol}>
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => makeCall(vendor.phone, vendor.business_name)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.btnText}>📞 Call Now</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.waBtn}
                          onPress={() =>
                            openWhatsApp(vendor.phone, vendor.business_name, vendor.category)
                          }
                          activeOpacity={0.8}
                        >
                          <Text style={styles.btnText}>💬 WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.enquiryBtn}
                          onPress={() => onSendEnquiry(vendor)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.enquiryBtnText}>⚡ Get Quote</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              💡 Direct contact with 0% commission. Rates and ratings are verified by Panchmahal Events Hub team.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
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
  browseBtn: {
    marginTop: 16,
    backgroundColor: '#d97706',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  horizontalScroll: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tableContainer: {
    flexDirection: 'row',
  },
  vendorCol: {
    width: 240,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginRight: 12,
  },
  removeBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  removeBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#dc2626',
  },
  vendorImage: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    height: 38,
  },
  verifyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  verifyText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cell: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cellLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  cellValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  cellPriceHighlight: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 2,
  },
  cellSubValue: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 2,
    lineHeight: 14,
  },
  actionCol: {
    marginTop: 8,
  },
  callBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  waBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  enquiryBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  enquiryBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerNote: {
    fontSize: 10.5,
    color: '#64748b',
    textAlign: 'center',
  },
});
