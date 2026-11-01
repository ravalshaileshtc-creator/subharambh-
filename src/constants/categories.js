// ==============================================================================
// SHUBH CELEBRATIONS – EVENT CATEGORIES WITH MULTILINGUAL SUPPORT
// ==============================================================================

export const CATEGORIES = [
  { id: 'all', label: 'All Services', gujarati: 'બધી સેવાઓ', hindi: 'सभी सेवाएँ', icon: '✨' },
  { id: 'mandap', label: 'Mandap Decor', gujarati: 'મંડપ ડેકોરેશન', hindi: 'मंडप डेकोरेशन', icon: '🎪' },
  { id: 'party_plot', label: 'Party Plot', gujarati: 'પાર્ટી પ્લોટ', hindi: 'पार्टी प्लॉट', icon: '🌿' },
  { id: 'beauty_parlour', label: 'Beauty Parlour', gujarati: 'બ્યુટી પાર્લર', hindi: 'ब्यूटी पार्लर', icon: '💄' },
  { id: 'horse', label: 'Ghodi & Horse', gujarati: 'ઘોડી અને બગી', hindi: 'घोड़ी एवं बग्गी', icon: '🐎' },
  { id: 'lighting', label: 'Lighting & Sound', gujarati: 'લાઇટિંગ અને સાઉન્ડ', hindi: 'लाइटिंग एवं साउंड', icon: '🔊' },
  { id: 'varraja_gadi', label: 'Varraja Gadi', gujarati: 'વરરાજા ગાડી', hindi: 'वरराजा गाड़ी', icon: '🚗' },
  { id: 'bride_entry', label: 'Bride Entry', gujarati: 'દુલ્હન એન્ટ્રી', hindi: 'दुल्हन एंट्री', icon: '👰' },
  { id: 'catering', label: 'Catering Service', gujarati: 'કેટરિંગ સર્વિસ', hindi: 'कैटरिंग सर्विस', icon: '🍲' },
];

export const SERVICE_CATEGORIES = CATEGORIES.filter((c) => c.id !== 'all');

export function getCategoryTitle(cat, lang = 'en') {
  if (!cat) return '';
  if (lang === 'gu') return cat.gujarati || cat.label;
  if (lang === 'hi') return cat.hindi || cat.label;
  return cat.label;
}
