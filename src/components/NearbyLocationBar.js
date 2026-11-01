import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  PAN_INDIA_CITIES,
  INDIAN_STATES_AND_UTS,
  getCitiesByState,
  searchLocations,
} from '../constants/panIndiaLocations.js';
import {
  QUICK_RADIUS_OPTIONS,
  resolveLocationByPincode,
  resolveLocationByCityName,
  detectCustomerGPSLocation,
} from '../services/nearbySearchService.js';
import { useTranslation } from '../localization/i18n.js';

export default function NearbyLocationBar({
  currentLocation,
  onLocationChange,
  currentRadius,
  onRadiusChange,
}) {
  const { language, t, fontFamily } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('GJ'); // Default Gujarat
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const handleUseGPS = async () => {
    setIsGpsLoading(true);
    const gpsRes = await detectCustomerGPSLocation();
    setIsGpsLoading(false);

    if (gpsRes.success) {
      onLocationChange({
        city: 'Current GPS Location',
        district: 'Detected via Device',
        state_id: 'IN',
        state_name: 'India',
        latitude: gpsRes.latitude,
        longitude: gpsRes.longitude,
        is_gps: true,
        label: gpsRes.label,
      });
      Alert.alert('GPS Location Acquired 🎯', `Latitude: ${gpsRes.latitude}, Longitude: ${gpsRes.longitude}\n\nNearby vendors are now sorted from your exact device coordinates.`);
      setModalVisible(false);
    } else {
      Alert.alert(
        'GPS Notice',
        `${gpsRes.error || 'Could not fetch device location.'}\n\nYou can manually select your City, District, or PIN Code.`
      );
    }
  };

  const handlePincodeSearch = () => {
    if (!pincodeInput.trim()) {
      Alert.alert('Enter PIN', 'Please enter a 6-digit Indian PIN Code.');
      return;
    }
    const resolved = resolveLocationByPincode(pincodeInput.trim());
    if (resolved) {
      onLocationChange(resolved);
      setPincodeInput('');
      setModalVisible(false);
      Alert.alert('Location Updated 📍', `Set to: ${resolved.label}`);
    } else {
      Alert.alert('PIN Code Not Mapped', 'Could not locate exact city for this PIN. Please pick your city from the list below.');
    }
  };

  const handleSelectCity = (city) => {
    const loc = {
      city: city.name,
      district: city.district,
      state_id: city.state_id,
      state_name: city.state_name,
      pincode: `${city.pincode_prefix}01`,
      latitude: city.latitude,
      longitude: city.longitude,
      is_gps: false,
      label: `${city.name}, ${city.district}, ${city.state_name}`,
    };
    onLocationChange(loc);
    setModalVisible(false);
  };

  const availableCities = citySearchQuery.trim()
    ? searchLocations(citySearchQuery)
    : getCitiesByState(selectedState);

  return (
    <View style={styles.container}>
      {/* Top Location Bar */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.locationBadge}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.locationPinIcon}>📍</Text>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.locationCity} numberOfLines={1}>
              {currentLocation.city || 'Godhra'}
            </Text>
            <Text style={styles.locationSub} numberOfLines={1}>
              {currentLocation.district ? `${currentLocation.district}, ` : ''}{currentLocation.state_name || 'Gujarat'}
            </Text>
          </View>
          <View style={styles.changePill}>
            <Text style={[styles.changePillText, { fontFamily }]}>{t('change_location')}</Text>
          </View>
        </TouchableOpacity>

        {/* GPS Quick Button */}
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={handleUseGPS}
          activeOpacity={0.8}
          disabled={isGpsLoading}
        >
          <Text style={[styles.gpsBtnText, { fontFamily }]}>{isGpsLoading ? '⏳' : `🎯 ${t('use_gps')}`}</Text>
        </TouchableOpacity>
      </View>

      {/* Radius Filters ScrollView */}
      <View style={styles.radiusRowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.radiusScroll}
        >
          <Text style={[styles.radiusPrefixText, { fontFamily }]}>{language === 'gu' ? 'ત્રિજ્યા:' : language === 'hi' ? 'दायरा:' : 'Radius:'}</Text>
          {QUICK_RADIUS_OPTIONS.map((opt) => {
            const isActive = currentRadius === opt.value;
            const radiusLabel = opt.value === 'ALL'
              ? t('radius_all')
              : language === 'gu'
              ? `${opt.value} કિ.મી.`
              : language === 'hi'
              ? `${opt.value} कि.મી.`
              : `${opt.value} km`;

            return (
              <TouchableOpacity
                key={String(opt.value)}
                style={[styles.radiusPill, isActive && styles.radiusPillActive]}
                onPress={() => onRadiusChange(opt.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.radiusText, isActive && styles.radiusTextActive, { fontFamily }]}>
                  {radiusLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* MANUAL CITY / PIN CODE PICKER MODAL */}
      {modalVisible && (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { fontFamily }]}>{t('search_by_city')}</Text>
                <Text style={[styles.modalSub, { fontFamily }]}>{t('serves_your_location')}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* GPS Instant Locate Button */}
              <TouchableOpacity style={styles.modalGpsAction} onPress={handleUseGPS} activeOpacity={0.85}>
                <Text style={styles.modalGpsIcon}>🎯</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.modalGpsTitle, { fontFamily }]}>{t('use_gps')} Coordinates</Text>
                  <Text style={[styles.modalGpsSub, { fontFamily }]}>{t('serves_your_location')}</Text>
                </View>
              </TouchableOpacity>

              {/* PIN Code Search Input */}
              <View style={styles.sectionBox}>
                <Text style={[styles.sectionLabel, { fontFamily }]}>{t('search_by_pincode')}:</Text>
                <View style={styles.pincodeInputRow}>
                  <TextInput
                    style={styles.pincodeInput}
                    placeholder={t('enter_pincode_placeholder')}
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={pincodeInput}
                    onChangeText={setPincodeInput}
                  />
                  <TouchableOpacity style={styles.pinSubmitBtn} onPress={handlePincodeSearch}>
                    <Text style={[styles.pinSubmitText, { fontFamily }]}>{t('apply_location')} ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter By State Scroll */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionLabel}>Select State / Region:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stateScroll}>
                  {INDIAN_STATES_AND_UTS.map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      style={[styles.statePill, selectedState === st.id && styles.statePillActive]}
                      onPress={() => {
                        setSelectedState(st.id);
                        setCitySearchQuery('');
                      }}
                    >
                      <Text style={[styles.stateText, selectedState === st.id && styles.stateTextActive]}>
                        {st.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* City Filter / Search */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionLabel}>Filter Cities in {selectedState}:</Text>
                <TextInput
                  style={styles.citySearchInput}
                  placeholder="Type city or district (e.g. Godhra, Halol, Vadodara)..."
                  placeholderTextColor="#94a3b8"
                  value={citySearchQuery}
                  onChangeText={setCitySearchQuery}
                />
              </View>

              {/* Cities Grid List */}
              <Text style={styles.sectionLabel}>Available Cities ({availableCities.length}):</Text>
              <View style={styles.cityList}>
                {availableCities.map((c) => {
                  const isSelected = currentLocation.city === c.name;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.cityCard, isSelected && styles.cityCardActive]}
                      onPress={() => handleSelectCity(c)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={[styles.cityName, isSelected && styles.cityNameActive]}>
                            {c.name}
                          </Text>
                          {c.is_featured && <Text style={styles.featuredBadge}>★ Hub</Text>}
                        </View>
                        <Text style={styles.cityMeta}>
                          {c.district} • PIN {c.pincode_prefix}xx
                        </Text>
                      </View>
                      <Text style={styles.citySelectArrow}>{isSelected ? '✓ Selected' : '➔'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  locationPinIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationCity: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
  },
  locationSub: {
    fontSize: 9,
    color: '#b45309',
  },
  changePill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  changePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#b45309',
  },
  gpsBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  radiusRowWrapper: {
    marginTop: 3,
  },
  radiusScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  radiusPrefixText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    marginRight: 2,
  },
  radiusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  radiusPillActive: {
    backgroundColor: '#d97706',
    borderColor: '#b45309',
  },
  radiusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  radiusTextActive: {
    color: '#ffffff',
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  modalBody: {
    padding: 16,
  },
  modalGpsAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  modalGpsIcon: {
    fontSize: 22,
  },
  modalGpsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  modalGpsSub: {
    fontSize: 10.5,
    color: '#15803d',
  },
  sectionBox: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  pincodeInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pincodeInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#0f172a',
  },
  pinSubmitBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinSubmitText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  stateScroll: {
    flexDirection: 'row',
    paddingBottom: 4,
  },
  statePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statePillActive: {
    backgroundColor: '#1e293b',
    borderColor: '#0f172a',
  },
  stateText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  stateTextActive: {
    color: '#ffffff',
  },
  citySearchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
  },
  cityList: {
    gap: 6,
    marginBottom: 20,
  },
  cityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
  },
  cityCardActive: {
    borderColor: '#d97706',
    backgroundColor: '#fffbeb',
  },
  cityName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  cityNameActive: {
    color: '#92400e',
  },
  featuredBadge: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cityMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  citySelectArrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d97706',
  },
});
