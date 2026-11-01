// ==============================================================================
// SHUBH CELEBRATIONS – I18N LOCALIZATION ENGINE & REACT CONTEXT
// Features:
// 1. Instant reactivity (zero reload required)
// 2. Safe key fallback & automatic humanization (never raw technical snake_case)
// 3. Multi-platform persistence (Web localStorage, Native fallback, Supabase profile)
// 4. Script & font styling helpers for Gujarati, Hindi, and English
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { TRANSLATIONS, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './translations.js';

const STORAGE_KEY = 'shubh_celebrations_language';

// In-memory memory storage fallback for native/node environments
let inMemoryLanguage = DEFAULT_LANGUAGE;

/**
 * Universal safe storage getter
 */
export function getSavedLanguageSync() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && ['en', 'gu', 'hi'].includes(saved)) {
        return saved;
      }
    }
  } catch (e) {
    // Ignore storage access errors in sandboxed contexts
  }
  return inMemoryLanguage || DEFAULT_LANGUAGE;
}

/**
 * Universal safe storage setter
 */
export function saveLanguageSync(lang) {
  if (!['en', 'gu', 'hi'].includes(lang)) return;
  inMemoryLanguage = lang;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Humanizes snake_case technical keys into natural readable English titles as an emergency fallback
 * e.g. "vendor_register" -> "Vendor Register", "min_rating" -> "Min Rating"
 */
export function humanizeKey(key) {
  if (!key || typeof key !== 'string') return '';
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Core translation resolver
 */
export function translate(key, currentLang = DEFAULT_LANGUAGE, params = {}, fallback = null) {
  if (!key) return '';

  const langDict = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANGUAGE];
  let text = langDict[key];

  // 1. Fallback to English if key missing in chosen language
  if (text == null && currentLang !== DEFAULT_LANGUAGE) {
    text = TRANSLATIONS[DEFAULT_LANGUAGE]?.[key];
  }

  // 2. Fallback to user-supplied fallback string if present
  if (text == null && fallback != null) {
    text = fallback;
  }

  // 3. Fallback to humanized key instead of exposing technical snake_case
  if (text == null) {
    text = humanizeKey(key);
  }

  // Parameter interpolation: {dist} -> 2.5
  if (params && typeof params === 'object') {
    Object.keys(params).forEach((paramKey) => {
      const val = params[paramKey];
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
    });
  }

  return text;
}

/**
 * Returns optimal font family string for the active language script
 */
export function getLocalizedFontFamily(lang = DEFAULT_LANGUAGE) {
  if (lang === 'gu') {
    return "'Noto Sans Gujarati', 'Gujarati Sangam MN', 'Shruti', 'Mukta Vaani', system-ui, sans-serif";
  }
  if (lang === 'hi') {
    return "'Noto Sans Devanagari', 'Mangal', 'Kohinoor Devanagari', 'Mukta', system-ui, sans-serif";
  }
  return "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
}

// React Context
export const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, params, fallback) => translate(key, DEFAULT_LANGUAGE, params, fallback),
  supportedLanguages: SUPPORTED_LANGUAGES,
  fontFamily: getLocalizedFontFamily(DEFAULT_LANGUAGE),
});

/**
 * Provider component wrapping the app tree
 */
export function LanguageProvider({ children, initialLanguage, onLanguageChange }) {
  const [language, setLanguageState] = useState(() => {
    return initialLanguage || getSavedLanguageSync();
  });

  // Sync state changes to storage and optional external callback (e.g. Supabase profile update)
  const setLanguage = useCallback((newLang) => {
    if (!['en', 'gu', 'hi'].includes(newLang)) return;
    setLanguageState(newLang);
    saveLanguageSync(newLang);
    if (typeof onLanguageChange === 'function') {
      onLanguageChange(newLang);
    }
  }, [onLanguageChange]);

  // Translation helper bound to active language
  const t = useCallback(
    (key, params, fallback) => {
      return translate(key, language, params, fallback);
    },
    [language]
  );

  const fontFamily = useMemo(() => getLocalizedFontFamily(language), [language]);

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
      fontFamily,
    }),
    [language, setLanguage, t, fontFamily]
  );

  return React.createElement(LanguageContext.Provider, { value: contextValue }, children);
}

/**
 * Hook for functional components
 */
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      language: getSavedLanguageSync(),
      setLanguage: saveLanguageSync,
      t: (k, p, fb) => translate(k, getSavedLanguageSync(), p, fb),
      supportedLanguages: SUPPORTED_LANGUAGES,
      fontFamily: getLocalizedFontFamily(getSavedLanguageSync()),
    };
  }
  return context;
}
