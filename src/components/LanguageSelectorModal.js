// ==============================================================================
// SHUBH CELEBRATIONS – LANGUAGE SELECTOR MODAL & HEADER PILL
// Supports instant 1-tap language switching between Gujarati, Hindi & English
// ==============================================================================

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useTranslation } from '../localization/i18n.js';
import { SUPPORTED_LANGUAGES } from '../localization/translations.js';

/**
 * Compact Header / Top Bar Pill for instant access
 */
export function LanguageSwitchPill({ onPress, style }) {
  const { language, t } = useTranslation();

  const currentObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <TouchableOpacity
      style={[styles.pillBtn, style]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={styles.pillGlobeIcon}>🌐</Text>
      <Text style={styles.pillText}>{currentObj.nativeName}</Text>
      <Text style={styles.pillCaret}>▾</Text>
    </TouchableOpacity>
  );
}

/**
 * Full Language Selection Modal
 */
export default function LanguageSelectorModal({ visible, onClose }) {
  const { language, setLanguage, t, fontFamily } = useTranslation();

  if (!visible) return null;

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    if (onClose) {
      setTimeout(onClose, 250);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>🌐</Text>
              <View>
                <Text style={[styles.headerTitle, { fontFamily }]}>
                  {t('select_language')}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {t('choose_preferred_language')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Language Options List */}
          <ScrollView contentContainerStyle={styles.optionsList}>
            {SUPPORTED_LANGUAGES.map((item) => {
              const isSelected = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.langCard,
                    isSelected && styles.langCardSelected,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => handleSelectLanguage(item.code)}
                >
                  <View style={styles.langLeftCol}>
                    <Text style={styles.langFlag}>{item.flag}</Text>
                    <View style={styles.langMeta}>
                      <View style={styles.langTitleRow}>
                        <Text style={[styles.langNativeName, isSelected && styles.langTextSelected]}>
                          {item.nativeName}
                        </Text>
                        <Text style={styles.langEngName}>({item.name})</Text>
                      </View>
                      <Text style={styles.langSubTag}>
                        {item.code === 'gu'
                          ? 'ગુજરાતીમાં સંપૂર્ણ એપ્લિકેશન'
                          : item.code === 'hi'
                          ? 'हिन्दी में सम्पूर्ण ऐप'
                          : 'Complete English experience'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleActive,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer Notice */}
          <View style={styles.modalFooter}>
            <Text style={styles.footerNote}>
              💡 {t('language_saved')} • Instant update across all screens
            </Text>
            <TouchableOpacity
              style={styles.doneBtn}
              activeOpacity={0.85}
              onPress={onClose}
            >
              <Text style={styles.doneBtnText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pillGlobeIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 3,
  },
  pillCaret: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  optionsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  langCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  langLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  langFlag: {
    fontSize: 26,
    marginRight: 14,
  },
  langMeta: {
    flex: 1,
  },
  langTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  langNativeName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  langTextSelected: {
    color: '#1d4ed8',
  },
  langEngName: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  langSubTag: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioCircleActive: {
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerNote: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 10,
  },
  doneBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
