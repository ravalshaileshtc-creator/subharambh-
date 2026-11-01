// ==============================================================================
// EVENT TYPES & BUDGET RANGES FOR PANCHMAHAL MARKETPLACE
// ==============================================================================

export const EVENT_TYPES = [
  { id: 'wedding', label: 'Wedding (લગ્ન પ્રસંગ)', icon: '💍', avgGuests: '500 - 1500' },
  { id: 'engagement', label: 'Engagement / Ring Ceremony (સગાઈ)', icon: '✨', avgGuests: '150 - 400' },
  { id: 'reception', label: 'Wedding Reception (રિસેપ્શન)', icon: '👑', avgGuests: '400 - 1000' },
  { id: 'birthday', label: 'Birthday Party (જન્મદિવસ)', icon: '🎂', avgGuests: '50 - 200' },
  { id: 'anniversary', label: 'Anniversary (વર્ષગાંઠ)', icon: '🥂', avgGuests: '100 - 300' },
  { id: 'religious', label: 'Religious / Katha / Satsang (ધાર્મિક પ્રસંગ)', icon: '🪔', avgGuests: '300 - 1200' },
  { id: 'corporate', label: 'Corporate Event / Annual Function (કોર્પોરેટ)', icon: '🏢', avgGuests: '100 - 500' },
];

export const GUEST_RANGES = [
  { id: '50-150', label: '50 - 150 મહેમાનો (Small)' },
  { id: '150-350', label: '150 - 350 મહેમાનો (Medium)' },
  { id: '350-700', label: '350 - 700 મહેમાનો (Large)' },
  { id: '700-1500', label: '700 - 1500 મહેમાનો (Grand Wedding)' },
  { id: '1500+', label: '1500+ મહેમાનો (Mega Royal)' },
];

export const BUDGET_RANGES = [
  { id: 'budget-1', label: '₹25,000 - ₹75,000', min: 25000, max: 75000 },
  { id: 'budget-2', label: '₹75,000 - ₹2,00,000', min: 75000, max: 200000 },
  { id: 'budget-3', label: '₹2,00,000 - ₹5,00,000', min: 200000, max: 500000 },
  { id: 'budget-4', label: '₹5,00,000 - ₹12,00,000', min: 500000, max: 1200000 },
  { id: 'budget-5', label: '₹12,00,000+ (Royal Package)', min: 1200000, max: 5000000 },
];
