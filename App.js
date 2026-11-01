import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Modular Marketplace Feature Components
import SmartSearchModal from './src/components/SmartSearchModal';
import VendorCompareModal from './src/components/VendorCompareModal';
import VendorProfileModal from './src/components/VendorProfileModal';
import VendorAvailabilityModal from './src/components/VendorAvailabilityModal';
import Get5QuotesModal from './src/components/Get5QuotesModal';
import AdminPanelModal from './src/components/AdminPanelModal';
import NearbyLocationBar from './src/components/NearbyLocationBar';
import { smartMatchVendors, isPubliclyVisibleVendor } from './src/services/marketplaceService';
import { submitBusinessListing, getVendorListingByPhone } from './src/services/superAdminService';
import {
  DEFAULT_CUSTOMER_LOCATION,
  searchNearbyVendors,
  getDistanceTier,
  getLocalizedTierLabel,
  formatLocalizedDistance,
} from './src/services/nearbySearchService';
import {
  LanguageProvider,
  useTranslation,
  getLocalizedFontFamily,
} from './src/localization/i18n.js';
import LanguageSelectorModal, {
  LanguageSwitchPill,
} from './src/components/LanguageSelectorModal.js';
import { SUPPORTED_LANGUAGES } from './src/localization/translations.js';

// Supabase RBAC Dashboards & Security Components
import CustomerDashboard from './src/components/CustomerDashboard';
import VendorDashboard from './src/components/VendorDashboard';
import AdminDashboard from './src/components/AdminDashboard';
import CustomerDirectPaymentModal from './src/components/CustomerDirectPaymentModal';
import VendorPendingScreen from './src/components/VendorPendingScreen';
import VendorRejectedScreen from './src/components/VendorRejectedScreen';
import AccountSetupScreen from './src/components/AccountSetupScreen';
import AuthModal from './src/components/AuthModal';
import UnauthorizedScreen from './src/components/UnauthorizedScreen';
import {
  getStoredSession,
  saveAuthSession,
  logoutSession,
} from './src/services/authService';
import {
  ROLES,
  VENDOR_STATUS,
  getCurrentUser,
  getCurrentRole,
  getCurrentVendorStatus,
  setCurrentUser as setCurrentUserInRbac,
  logoutUser as logoutUserInRbac,
  verifyRouteAccess,
  resolveAuthenticatedRoute,
  isAuthorized,
} from './src/services/rbacService';

// ==============================================================================
// 1. SUPABASE CLIENT CONFIGURATION
// Supports Expo Public Environment Variables with safe fallback
// ==============================================================================
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gxngvppaflqwviikvgwq.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4hz877Yx3Ra2gCKzZ2G_KA_JfELCsNZ';

const isSupabaseConfigured =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_ANON_KEY) &&
  !SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT') &&
  SUPABASE_URL.startsWith('https://');

const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ==============================================================================
// 2. CATEGORIES CONFIGURATION (8 Core Event Categories + "All")
// ==============================================================================
import {
  CATEGORIES,
  SERVICE_CATEGORIES,
  getCategoryTitle,
} from './src/constants/categories.js';

export { CATEGORIES, SERVICE_CATEGORIES, getCategoryTitle };

// Default High-Res Category Images (Used as fallback or category banners)
export const DEFAULT_CATEGORY_IMAGES = {
  mandap: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
  party_plot: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80',
  beauty_parlour: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=800&auto=format&fit=crop&q=80',
  horse: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
  lighting: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
  varraja_gadi: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
  bride_entry: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80',
  all: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
};

const POPULAR_LOCATIONS = [
  'Godhra (Station Road)',
  'Godhra (Bamroli Road)',
  'Godhra (Vavdi Buzarg)',
  'Godhra (Bhamaiya)',
  'Halol Road, Godhra',
  'Halol',
  'Kalol',
  'Shehra',
  'Lunawada',
];

// ==============================================================================
// 3. TOP HERO SLIDER BANNERS (3 Luxury Auto-Rotating Wedding Highlights)
// ==============================================================================
export const HERO_SLIDER_BANNERS = [
  {
    id: 'slide-1',
    tag: '👑 GODHRA & PANCHMAHAL',
    title: 'Grand Mandap & Royal Venues',
    subtitle: 'Direct booking with verified Panchmahal decorators. 0% Commission.',
    badge: '100% VERIFIED',
    badgeBg: '#15803d',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop&q=80',
    btnText: 'Explore Venues →',
    actionType: 'category',
    actionValue: 'mandap',
  },
  {
    id: 'slide-2',
    tag: '💰 ઓર્ડર અપાવો અને મેળવો ₹10,000',
    title: 'ઓર્ડર અપાવો, મેળવો ₹10,000 રોકડ',
    subtitle: 'સગા-સંબંધી કે મિત્રોના લગ્નનો ઓર્ડર ગોધરામાં બુક કરાવો અને કેશ ઇનામ મેળવો!',
    badge: 'ધમાકા ઓફર',
    badgeBg: '#d97706',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1000&auto=format&fit=crop&q=80',
    btnText: 'ઓફર જુઓ →',
    actionType: 'popup',
    actionValue: 'reward_popup',
  },
  {
    id: 'slide-3',
    tag: '⚡ 24x7 CONCIERGE & BACKUP',
    title: 'Need Urgent Booking Assistance?',
    subtitle: 'Godhra Event Concierge arranges top caterers, DJ & groom cars in 15 mins.',
    badge: 'EMERGENCY BACKUP',
    badgeBg: '#2563eb',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1000&auto=format&fit=crop&q=80',
    btnText: 'Contact Helpdesk →',
    actionType: 'tab',
    actionValue: 'concierge',
  },
];

// ==============================================================================
// 3. SEED DATA (Real Vendors in Godhra & Panchmahal with Images & Instagram)
// ==============================================================================
const INITIAL_GODHRA_VENDORS = [
  // 1. Mandap Decoration (mandap)
  {
    id: 1,
    business_name: 'Vallabh Decoration & Event Management',
    category: 'mandap',
    location: 'Behind Deep Hospital, Bamroli Road, Godhra',
    price_range: '₹25,000 - ₹95,000',
    phone: '9825123401',
    description: 'Specialists in Grand Entrance Gates, Royal LED Stage, Rajwadi Mandap, and designer flower decoration.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'vallabh_events_godhra',
  },
  {
    id: 2,
    business_name: 'Shree Sahajanand Mandap Service',
    category: 'mandap',
    location: 'Kachiyawad, Near Ram Sagar Lake, Godhra',
    price_range: '₹20,000 - ₹75,000',
    phone: '9879234502',
    description: 'Traditional wood & fabric mandaps, VIP sofa seating arrangements, and large-scale social gathering infrastructure.',
    rating: 4.8,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'sahajanand_mandap_godhra',
  },
  {
    id: 3,
    business_name: 'Shreeji Mandap Decoration',
    category: 'mandap',
    location: 'Govindi / Vavdi Buzarg, Godhra',
    price_range: '₹18,000 - ₹60,000',
    phone: '9428345603',
    description: 'Affordable & beautiful theme mandaps, Haldi, Mehendi, Sangeet backdrops with ambient stage lighting.',
    rating: 4.7,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'shreeji_mandap_godhra',
  },
  {
    id: 4,
    business_name: 'Sai Krishna Events & Stage Decor',
    category: 'mandap',
    location: 'Bamroli Road Area, Godhra',
    price_range: '₹30,000 - ₹1,10,000',
    phone: '9898456704',
    description: 'Modern floral mandaps, crystal stage setup, pathway lighting, and reception gate decoration.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1545232979-fbf6717a6c0c?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'saikrishna_events_godhra',
  },

  // 2. Party Plot & Lawns (party_plot)
  {
    id: 5,
    business_name: 'Motibaug Party Plot & Banquet Hall',
    category: 'party_plot',
    location: 'Moti Baug, Godhra',
    price_range: '₹45,000 - ₹1,40,000/day',
    phone: '9727567805',
    description: 'Spacious open-air lush lawn with 1,500+ guests capacity, large parking space, and attached banquet hall.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'motibaug_partyplot_godhra',
  },
  {
    id: 6,
    business_name: 'Shree Party Plot & AC Banquet',
    category: 'party_plot',
    location: 'Godhra Bypass Road, Bamroli Khurd, Godhra',
    price_range: '₹50,000 - ₹1,75,000/day',
    phone: '9408678906',
    description: 'Highway touch prime location. Spacious wedding lawn, guest rooms, huge stage, and 24/7 power backup.',
    rating: 4.8,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'shree_partyplot_godhra',
  },
  {
    id: 7,
    business_name: 'Banjara Party Plot & Events Lawn',
    category: 'party_plot',
    location: 'Opp. Dodapa Lake, Daruniya Road, GIDC, Godhra',
    price_range: '₹35,000 - ₹1,10,000/day',
    phone: '9824789007',
    description: 'Popular community wedding lawn, spacious dining ground, and complete amenities for social gatherings.',
    rating: 4.7,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'banjara_partyplot_godhra',
  },
  {
    id: 8,
    business_name: 'Mahalaxmi Farms & Party Plot',
    category: 'party_plot',
    location: 'Godhra-Damavav Road, Bamroli Khurd, Godhra',
    price_range: '₹40,000 - ₹1,30,000/day',
    phone: '9909890108',
    description: 'Scenic farm-style lawn with green landscape, peaceful setting, and overnight guest accommodation.',
    rating: 4.8,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'mahalaxmi_farms_godhra',
  },

  // 3. Beauty Parlour & Bridal Makeup (beauty_parlour)
  {
    id: 9,
    business_name: 'The Oceanic Beauty Salon & Bridal Studio',
    category: 'beauty_parlour',
    location: 'Swaminarayan Height, Gadukpur Chokdi, Bamroli Road, Godhra',
    price_range: '₹8,000 - ₹30,000',
    phone: '9712901209',
    description: 'Luxury Bridal studio. HD Makeup, Airbrush bridal look, Pre-bridal skin care rituals, and hairstyle artistry.',
    rating: 5.0,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'theoceanic_beautysalon',
  },
  {
    id: 10,
    business_name: 'Shrungar Makeup Studio',
    category: 'beauty_parlour',
    location: 'Behind S.T. Nagar, Bhuravav Road, Godhra',
    price_range: '₹6,500 - ₹25,000',
    phone: '9879112310',
    description: 'Specialized in Bridal & Engagement makeovers, MAC & Huda Beauty cosmetics, and Saree draping.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'shrungar_studio_godhra',
  },
  {
    id: 11,
    business_name: 'Panchi Bridal Studio',
    category: 'beauty_parlour',
    location: 'Kachhiyawad, Shala Pol, Godhra',
    price_range: '₹5,500 - ₹20,000',
    phone: '9429223411',
    description: 'Traditional Gujarati bridal transformation, organic Mehendi art, flower jewelry styling, and party makeup.',
    rating: 4.8,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1588516903720-8ceb67f9ef84?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'panchibridal_godhra',
  },
  {
    id: 12,
    business_name: 'Kaya Makeover & Salon',
    category: 'beauty_parlour',
    location: 'Near Power House, Bhuravav Cross Road, Godhra',
    price_range: '₹5,000 - ₹18,000',
    phone: '9978334512',
    description: 'Bridal packages, pre-wedding facials, hair smoothening, and customized bridesmaids styling.',
    rating: 4.7,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'kayamakeover_godhra',
  },

  // 4. Ghodi & Horse Rental (horse)
  {
    id: 13,
    business_name: 'Akrambhai Baggiwala & Ghodi Service',
    category: 'horse',
    location: 'Near Simla Market, Ahmedabad Highway, Rena, Godhra',
    price_range: '₹7,000 - ₹22,000',
    phone: '9825445613',
    description: 'Well-trained royal white horses, Royal Golden Chariot (Baggi) with LED lights and umbrella for grand Barat.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'akrambhai_baggiwala_godhra',
  },
  {
    id: 14,
    business_name: 'Maharaja White Ghodi & Wedding Baggi',
    category: 'horse',
    location: 'Vavdi Buzarg, Godhra',
    price_range: '₹8,000 - ₹24,000',
    phone: '9879556714',
    description: 'Majestic Barat mare, decorated antique-style Baggi, dancing horse performance, and royal handlers.',
    rating: 4.8,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'maharaja_ghodi_godhra',
  },
  {
    id: 15,
    business_name: 'Jai Bhavani Horse & Rath Rental',
    category: 'horse',
    location: 'Bhamaiya, Godhra',
    price_range: '₹6,500 - ₹19,000',
    phone: '9428667815',
    description: 'Complete Barat procession setup: White Ghodi, ceremonial Rath, and traditional attire attendants.',
    rating: 4.8,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'jaibhavani_rath_godhra',
  },

  // 5. Lighting & Sound (lighting)
  {
    id: 16,
    business_name: 'DJ Sarkar Sound System & Concert Lighting',
    category: 'lighting',
    location: 'Uttamnagar, Marketing Yard Road, Godhra',
    price_range: '₹14,000 - ₹50,000',
    phone: '9898778916',
    description: 'High-wattage line array speakers, heavy punch bass, Sharpie beam lights, concert truss, and wedding DJ.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'djsarkar_sound_godhra',
  },
  {
    id: 17,
    business_name: 'DJ I Shree Digital Sound',
    category: 'lighting',
    location: 'Vadi Area, Godhra',
    price_range: '₹12,000 - ₹42,000',
    phone: '9727889017',
    description: 'Mobile Barat DJ truck, Punjabi Dhol mix, moving head stage lights, and Bollywood/Garba sound setup.',
    rating: 4.8,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'djishree_godhra',
  },
  {
    id: 18,
    business_name: 'DJ Shivam & Laser Stage System',
    category: 'lighting',
    location: 'Down Yard, Godhra',
    price_range: '₹10,000 - ₹38,000',
    phone: '9408990118',
    description: 'Specialists in Sangeet Sandhya, Haldi DJ beats, laser show, and atmospheric truss wash lights.',
    rating: 4.7,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'djshivam_godhra',
  },

  // 6. Varraja Gadi (Groom Car Rental) (varraja_gadi)
  {
    id: 19,
    business_name: 'Rrathore Travels & Luxury Wedding Fleet',
    category: 'varraja_gadi',
    location: 'Bhuravav, Godhra',
    price_range: '₹9,000 - ₹25,000/day',
    phone: '9824001219',
    description: 'Open Red/Black Mahindra Thar, White Audi A4, Sunroof BMW with fresh flower decoration & dressed chauffeur.',
    rating: 5.0,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'rrathore_travels_godhra',
  },
  {
    id: 20,
    business_name: 'Jay Ambe Tours & Groom Car Rental',
    category: 'varraja_gadi',
    location: 'Near Bus Stand, Godhra',
    price_range: '₹8,000 - ₹22,000/day',
    phone: '9909112320',
    description: 'Toyota Fortuner, Innova Crysta, and Mercedes for groom entry and bride bidaai ceremony.',
    rating: 4.8,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'jayambe_travels_godhra',
  },
  {
    id: 21,
    business_name: 'Shiv Shakti Luxury Wedding Cars',
    category: 'varraja_gadi',
    location: 'Godhra Bypass Road, Godhra',
    price_range: '₹10,000 - ₹28,000/day',
    phone: '9712223421',
    description: 'Vintage collection cars & premium luxury sedans. VIP floral ribbon styling and photo stops included.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'shivshakti_cars_godhra',
  },

  // 7. Bride Entry (bride_entry)
  {
    id: 22,
    business_name: 'Royal Palkhi & Cold Pyro Sparkular Entry',
    category: 'bride_entry',
    location: 'Bamroli Road, Godhra',
    price_range: '₹12,000 - ₹38,000',
    phone: '9879334522',
    description: 'Maharani Royal Palkhi, remote-controlled Cold Pyro guns, low-lying Dry Ice cloud effect, and entrance music.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'royalpalkhi_godhra',
  },
  {
    id: 23,
    business_name: 'Apsara Doli & Revolving Lotus Entry',
    category: 'bride_entry',
    location: 'Station Road, Godhra',
    price_range: '₹14,000 - ₹42,000',
    phone: '9429445623',
    description: 'Revolving Lotus entry concept, Golden Floral Chaadar carried by brothers, bubble blast & sparkle flares.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'apsaradoli_godhra',
  },
  {
    id: 24,
    business_name: 'Shubh Vivah Bridal Entry Concepts',
    category: 'bride_entry',
    location: 'College Road, Godhra',
    price_range: '₹8,500 - ₹26,000',
    phone: '9978556724',
    description: 'Traditional LED Floral Umbrella, Jasmine Phoolon Ki Chaadar, and smoke cannons for grand bridal entry.',
    rating: 4.8,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'shubhvivah_entry_godhra',
  },

  // 8. Catering Services (catering)
  {
    id: 25,
    business_name: 'Ganesh Catering Service (30+ Years Legacy)',
    category: 'catering',
    location: 'Science College Road, Patthar Talavdi, Godhra',
    price_range: '₹380 - ₹800/plate',
    phone: '9825667825',
    description: 'Pure-veg Gujarati & Kathiyawadi wedding feasts, live Chaat counter, traditional sweets & royal Maharaaj team.',
    rating: 5.0,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'ganesh_catering_godhra',
  },
  {
    id: 26,
    business_name: 'Purohit Caterers (M Purohit Caterers)',
    category: 'catering',
    location: 'Jay Yogeshwar Society, Ankur School Road, Bhurava, Godhra',
    price_range: '₹340 - ₹720/plate',
    phone: '9879778926',
    description: 'Specialists in Marwadi, Rajasthani Dal Baati, Punjabi, and authentic Gujarati wedding catering.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'purohit_caterers_godhra',
  },
  {
    id: 27,
    business_name: 'Shreeji Catering & Maharaj Service',
    category: 'catering',
    location: 'Duncool, Panjarapole, Godhra',
    price_range: '₹300 - ₹650/plate',
    phone: '9428889027',
    description: 'Complete breakfast-to-dinner catering, live food stalls, mocktail counters, and hygienic kitchen team.',
    rating: 4.8,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'shreeji_catering_godhra',
  },
  {
    id: 28,
    business_name: 'Dhwanit Catering Service (Panchmahal)',
    category: 'catering',
    location: 'Kanjari Road, Halol & Godhra, Panchmahal',
    price_range: '₹400 - ₹850/plate',
    phone: '9898990128',
    description: 'Grand wedding banquet feasts with Italian, Mexican, live barbecue, and gourmet dessert counters.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'dhwanit_catering_halol',
  },
];

// Enrich seed vendors with coordinates, service radius, and multi-city coverage
export const ENRICHED_MARKETPLACE_VENDORS = INITIAL_GODHRA_VENDORS.map((v) => {
  let lat = 22.7766;
  let lng = 73.6149;
  const loc = (v.location || '').toLowerCase();
  if (loc.includes('bamroli')) { lat = 22.7680; lng = 73.6200; }
  else if (loc.includes('station')) { lat = 22.7790; lng = 73.6100; }
  else if (loc.includes('vavdi') || loc.includes('govindi')) { lat = 22.7920; lng = 73.6350; }
  else if (loc.includes('moti baug')) { lat = 22.7720; lng = 73.6110; }
  else if (loc.includes('bhuravav')) { lat = 22.7730; lng = 73.6180; }
  else if (loc.includes('daruniya') || loc.includes('gidc')) { lat = 22.7820; lng = 73.6050; }
  else if (loc.includes('kachiyawad')) { lat = 22.7750; lng = 73.6120; }
  else if (loc.includes('halol')) { lat = 22.7550; lng = 73.6050; }

  return {
    ...v,
    latitude: lat,
    longitude: lng,
    city: 'Godhra',
    district: 'Panchmahal',
    state_id: 'GJ',
    pincode: '389001',
    service_radius_km: 50,
    service_area_cities: ['Godhra', 'Halol', 'Kalol', 'Shehra', 'Lunawada'],
    service_area_pincodes: ['389001', '389340', '389330', '389230', '389232'],
    vendor_status: v.vendor_status || 'approved',
    listing_status: v.listing_status || 'approved',
    is_approved: v.is_approved !== undefined ? v.is_approved : true,
    account_status: v.account_status || 'active',
  };
}).concat([
  // Nearby Panchmahal Vendors (Halol & Kalol)
  {
    id: 29,
    business_name: 'Pavagadh Mandap & Lighting Decorators',
    category: 'mandap',
    location: 'Near Bus Station, Vadodara Road, Halol',
    price_range: '₹30,000 - ₹1,20,000',
    phone: '9825123429',
    description: 'Premier wedding setup and theme mandaps in Halol, Pavagadh foothill venues, and Kalol.',
    rating: 4.8,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'pavagadh_mandap_halol',
    latitude: 22.5024,
    longitude: 73.4716,
    city: 'Halol',
    district: 'Panchmahal',
    state_id: 'GJ',
    pincode: '389350',
    service_radius_km: 45,
    service_area_cities: ['Halol', 'Kalol', 'Godhra', 'Vadodara'],
    service_area_pincodes: ['389350', '389340', '389001'],
    vendor_status: v.vendor_status || 'approved',
    listing_status: v.listing_status || 'approved',
    is_approved: v.is_approved !== undefined ? v.is_approved : true,
    account_status: v.account_status || 'active',
  },
  {
    id: 30,
    business_name: 'Chamunda Party Plot & Banquets',
    category: 'party_plot',
    location: 'Main Highway Road, Kalol (Panchmahal)',
    price_range: '₹40,000 - ₹1,30,000/day',
    phone: '9825123430',
    description: 'Highway-touch scenic party plot in Kalol, accommodating 1,200+ guests with VIP dining halls.',
    rating: 4.7,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'chamunda_kalol_plot',
    latitude: 22.6074,
    longitude: 73.4565,
    city: 'Kalol (Panchmahal)',
    district: 'Panchmahal',
    state_id: 'GJ',
    pincode: '389330',
    service_radius_km: 40,
    service_area_cities: ['Kalol', 'Halol', 'Godhra'],
    service_area_pincodes: ['389330', '389350', '389001'],
    vendor_status: v.vendor_status || 'approved',
    listing_status: v.listing_status || 'approved',
    is_approved: v.is_approved !== undefined ? v.is_approved : true,
    account_status: v.account_status || 'active',
  },

  // Regional Hub Vendor (Vadodara ~74 km)
  {
    id: 31,
    business_name: 'Baroda Royal Palace Events',
    category: 'mandap',
    location: 'Alkapuri / Sayajigunj, Vadodara',
    price_range: '₹60,000 - ₹2,50,000',
    phone: '9825123431',
    description: 'High-end destination wedding and royal mandap setup across Central Gujarat.',
    rating: 4.9,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'baroda_royal_events',
    latitude: 22.3072,
    longitude: 73.1812,
    city: 'Vadodara',
    district: 'Vadodara',
    state_id: 'GJ',
    pincode: '390001',
    service_radius_km: 85,
    service_area_cities: ['Vadodara', 'Anand', 'Halol', 'Godhra'],
    service_area_pincodes: ['390001', '388001', '389350', '389001'],
    vendor_status: v.vendor_status || 'approved',
    listing_status: v.listing_status || 'approved',
    is_approved: v.is_approved !== undefined ? v.is_approved : true,
    account_status: v.account_status || 'active',
  },

  // Distant Gujarat Metro Vendor (Ahmedabad ~118 km)
  {
    id: 32,
    business_name: 'Karnavati Luxury Weddings & Banquets',
    category: 'mandap',
    location: 'SG Highway, Bodakdev, Ahmedabad',
    price_range: '₹1,00,000 - ₹5,00,000',
    phone: '9825123432',
    description: 'Ahmedabad premier destination wedding organizers, luxury production stages, and celebrity entries.',
    rating: 5.0,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1545232979-fbf6717a6c0c?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'karnavati_luxury_weddings',
    latitude: 23.0225,
    longitude: 72.5714,
    city: 'Ahmedabad',
    district: 'Ahmedabad',
    state_id: 'GJ',
    pincode: '380001',
    service_radius_km: 60,
    service_area_cities: ['Ahmedabad', 'Gandhinagar'],
    service_area_pincodes: ['380001', '382010'],
    vendor_status: v.vendor_status || 'approved',
    listing_status: v.listing_status || 'approved',
    is_approved: v.is_approved !== undefined ? v.is_approved : true,
    account_status: v.account_status || 'active',
  },

  // Distant Royal Destination Vendor (Jaipur, Rajasthan ~540 km)
  {
    id: 33,
    business_name: 'Rajputana Heritage Mandaps & Royal Decor',
    category: 'mandap',
    location: 'C-Scheme / Palace Road, Jaipur, Rajasthan',
    price_range: '₹1,50,000 - ₹8,00,000',
    phone: '9825123433',
    description: 'Authentic royal Rajasthani palace weddings, heritage shehnai mandaps, and imperial tent cities.',
    rating: 5.0,
    is_verified: true,
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    instagram_handle: 'rajputana_heritage_jaipur',
    latitude: 26.9124,
    longitude: 75.7873,
    city: 'Jaipur',
    district: 'Jaipur',
    state_id: 'RJ',
    pincode: '302001',
    service_radius_km: 120,
    service_area_cities: ['Jaipur', 'Udaipur', 'Jodhpur'],
    service_area_pincodes: ['302001', '313001', '342001'],
    vendor_status: v.vendor_status || 'approved',
    listing_status: v.listing_status || 'approved',
    is_approved: v.is_approved !== undefined ? v.is_approved : true,
    account_status: v.account_status || 'active',
  },

  // Unapproved Vendor Sample (Must NOT appear in public searches)
  {
    id: 34,
    business_name: 'Unverified Test Decorator Godhra',
    category: 'mandap',
    location: 'Bamroli Road, Godhra',
    price_range: '₹15,000 - ₹40,000',
    phone: '9825123434',
    description: 'Pending onboarding review.',
    rating: 3.5,
    is_verified: false,
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    latitude: 22.7766,
    longitude: 73.6149,
    city: 'Godhra',
    district: 'Panchmahal',
    state_id: 'GJ',
    pincode: '389001',
    service_radius_km: 25,
    service_area_cities: ['Godhra'],
    vendor_status: 'pending',
    listing_status: 'pending',
    is_approved: false,
    account_status: 'pending',
  },
]);

// ==============================================================================
// 4. MAIN APPLICATION COMPONENT
// ==============================================================================
function MainApp() {
  const { language, setLanguage, t, fontFamily } = useTranslation();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [vendors, setVendors] = useState(() => ENRICHED_MARKETPLACE_VENDORS.filter(isPubliclyVisibleVendor));
  const [customerLocation, setCustomerLocation] = useState(DEFAULT_CUSTOMER_LOCATION);
  const [searchRadius, setSearchRadius] = useState(25); // Default 25 km radius
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLiveDatabase, setIsLiveDatabase] = useState(isSupabaseConfigured);

  // ----------------------------------------------------------------------------
  // NAVIGATION & SHORTLIST (SAVED VENDORS) STATE
  // ----------------------------------------------------------------------------
  const [activeNavTab, setActiveNavTab] = useState('explore'); // 'explore' | 'shortlist' | 'rewards' | 'concierge'
  const [savedVendorIds, setSavedVendorIds] = useState([1, 5, 9]); // Pre-saved popular vendors (Vallabh Decor, Motibaug, Khushbu)

  const toggleSaveVendor = (vendorId) => {
    setSavedVendorIds((prev) => {
      const isAlreadySaved = prev.includes(vendorId);
      if (isAlreadySaved) {
        return prev.filter((id) => id !== vendorId);
      } else {
        return [...prev, vendorId];
      }
    });
  };

  const savedVendors = useMemo(() => {
    return vendors.filter((v) => savedVendorIds.includes(v.id));
  }, [vendors, savedVendorIds]);

  // ----------------------------------------------------------------------------
  // 5 MAJOR MARKETPLACE FEATURES STATE
  // ----------------------------------------------------------------------------
  // Feature 1: Smart Search State
  const [smartSearchVisible, setSmartSearchVisible] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    eventType: '',
    location: '',
    eventDate: '',
    guestCount: '',
    budget: '',
    requiredServices: [],
    verifiedOnly: false,
    sortBy: 'recommended',
  });

  // Feature 2: Vendor Comparison (Up to 5 vendors)
  const [comparedVendorIds, setComparedVendorIds] = useState([]);
  const [compareModalVisible, setCompareModalVisible] = useState(false);

  const toggleCompareVendor = (vendorId) => {
    setComparedVendorIds((prev) => {
      if (prev.includes(vendorId)) {
        return prev.filter((id) => id !== vendorId);
      }
      if (prev.length >= 5) {
        Alert.alert(
          'Maximum 5 Vendors',
          'You can compare up to 5 vendors simultaneously. Remove one vendor from comparison to add another.'
        );
        return prev;
      }
      return [...prev, vendorId];
    });
  };

  const removeComparedVendor = (vendorId) => {
    setComparedVendorIds((prev) => prev.filter((id) => id !== vendorId));
  };

  const comparedVendors = useMemo(() => {
    return vendors.filter((v) => comparedVendorIds.includes(v.id));
  }, [vendors, comparedVendorIds]);

  // Feature 3: Real Photos & Video Gallery Profile
  const [selectedProfileVendor, setSelectedProfileVendor] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const openVendorProfile = (vendor) => {
    setSelectedProfileVendor(vendor);
    setProfileModalVisible(true);
  };

  // Feature 4: Event Date Availability & Double-Booking Protection
  const [selectedAvailVendor, setSelectedAvailVendor] = useState(null);
  const [availModalVisible, setAvailModalVisible] = useState(false);

  const openVendorAvailability = (vendor) => {
    setSelectedAvailVendor(vendor);
    setAvailModalVisible(true);
  };

  // Feature 5: One-Click Event Requirement & Get 5 Quotes
  const [get5QuotesVisible, setGet5QuotesVisible] = useState(false);

  // Admin Panel
  const [adminPanelVisible, setAdminPanelVisible] = useState(false);

  // Pure Marketplace Direct Payment State
  const [directPayModalVisible, setDirectPayModalVisible] = useState(false);
  const [directPayBooking, setDirectPayBooking] = useState(null);

  const handleUpdateVendorVerification = (vendorId, isVerified) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, is_verified: isVerified } : v))
    );
  };

  // ----------------------------------------------------------------------------
  // SUPABASE RBAC & SECURE OTP AUTHENTICATION STATE
  // Roles: customer | vendor | admin
  // ----------------------------------------------------------------------------
  const initialStoredUser = getStoredSession();
  const [currentUser, setCurrentUser] = useState(initialStoredUser || null);
  const [currentUserRole, setCurrentUserRole] = useState(initialStoredUser?.role || null);
  const [authModalVisible, setAuthModalVisible] = useState(!initialStoredUser);
  const [unauthorizedRouteReason, setUnauthorizedRouteReason] = useState(null);

  useEffect(() => {
    if (initialStoredUser) {
      setCurrentUserInRbac(initialStoredUser);
    } else {
      setCurrentUserInRbac(null);
    }
  }, []);

  const handleRoleChanged = (newRole, newUser) => {
    setCurrentUserRole(newRole);
    setCurrentUser(newUser);
    setCurrentUserInRbac(newUser);
    saveAuthSession(newUser);
    setAuthModalVisible(false);
    setUnauthorizedRouteReason(null);
    const resolvedRoute = resolveAuthenticatedRoute(newUser);
    if (resolvedRoute === '/admin') {
      setActiveNavTab('admin_dashboard');
    } else if (resolvedRoute === '/vendor') {
      setActiveNavTab('vendor_dashboard');
    } else if (resolvedRoute === '/vendor-pending') {
      setActiveNavTab('vendor_pending');
    } else if (resolvedRoute === '/vendor-rejected') {
      setActiveNavTab('vendor_rejected');
    } else if (resolvedRoute === '/account-setup') {
      setActiveNavTab('account_setup');
    } else {
      setActiveNavTab('explore');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout_btn'),
      t('logout_confirm_msg'),
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('logout_btn') || 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logoutSession();
            logoutUserInRbac();
            setCurrentUser(null);
            setCurrentUserRole(null);
            setActiveNavTab('explore');
            setAuthModalVisible(true);
          },
        },
      ]
    );
  };

  const handleNavigateWithRoleCheck = (targetTab, requiredRole) => {
    const check = verifyRouteAccess(requiredRole);
    if (!check.allowed) {
      if (check.redirectRoute === '/vendor-pending') {
        setActiveNavTab('vendor_pending');
        return;
      }
      if (check.redirectRoute === '/vendor-rejected') {
        setActiveNavTab('vendor_rejected');
        return;
      }
      setUnauthorizedRouteReason(check.reason);
      return;
    }
    setUnauthorizedRouteReason(null);
    setActiveNavTab(targetTab);
  };

  const shareShortlistViaWhatsApp = () => {
    if (savedVendors.length === 0) return;
    const vendorListText = savedVendors
      .map(
        (v, i) =>
          `${i + 1}. *${v.business_name}* (${v.category})\n   📍 ${v.location} | 📞 +91 ${v.phone}\n   💰 ${v.price_range}`
      )
      .join('\n\n');
    const msg = `*Panchmahal Wedding Planning Shortlist* 💍\nHere are the verified vendors shortlisted for our upcoming wedding:\n\n${vendorListText}\n\nShared via *Panchmahal Events Hub*`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const shareReferralViaWhatsApp = () => {
    const msg = `👑 *પંચમહાલ વેડિંગ ધમાકા ઓફર!* 💍\n\nજો તમારા ઘરમાં, સગા-સંબંધી કે મિત્રોમાં કોઈના લગ્ન કે પ્રસંગ આવી રહ્યો હોય, તો *પંચમહાલ ઇવેન્ટ્સ હબ* પર ગોધરાના ટોપ મંડપ ડેકોરેશન, પાર્ટી પ્લોટ, કેટરિંગ, ડીજે અને વરરાજા ગાડી સીધા 0% કમિશને બુક કરાવો:\n👉 https://panchmahalevents.in\n\n💰 *ઓર્ડર અપાવો અને મેળવો ₹1,000 થી ₹10,000 રોકડ ઇનામ!* (PhonePe / Google Pay)\nકોઈપણ લગ્ન કે પ્રસંગનો રેફરન્સ આપવા મને હમણાં જ જણાવો! 🙏`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const whatsappConcierge = () => {
    const msg = `Namaste Panchmahal Events Concierge! 🙏\nI need assistance finding verified wedding vendors in Godhra/Panchmahal for an upcoming event. Please assist.`;
    Linking.openURL(`https://wa.me/919825123401?text=${encodeURIComponent(msg)}`);
  };

  // ----------------------------------------------------------------------------
  // TOP 3 SLIDER BANNERS STATE & AUTO-PLAY
  // ----------------------------------------------------------------------------
  const { width: screenWidth } = useWindowDimensions();
  const numGridColumns = screenWidth >= 1100 ? 3 : screenWidth >= 768 ? 2 : 1;
  const bannerWidth = Math.min(screenWidth - 24, 720);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const sliderRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => {
        const next = (prev + 1) % HERO_SLIDER_BANNERS.length;
        if (sliderRef.current) {
          try {
            sliderRef.current.scrollToOffset({
              offset: next * (bannerWidth + 12),
              animated: true,
            });
          } catch (e) {}
        }
        return next;
      });
    }, 3800);

    return () => clearInterval(timer);
  }, [bannerWidth]);

  const handleDotPress = (index) => {
    setActiveSlideIndex(index);
    if (sliderRef.current) {
      try {
        sliderRef.current.scrollToOffset({
          offset: index * (bannerWidth + 12),
          animated: true,
        });
      } catch (e) {}
    }
  };

  const handleSlidePress = (item) => {
    if (item.actionType === 'popup' || item.id === 'slide-2') {
      setRewardPopupVisible(true);
      return;
    }
    if (item.actionType === 'category') {
      setSelectedCategory(item.actionValue);
    } else if (item.actionType === 'tab') {
      setActiveNavTab(item.actionValue);
    } else if (item.actionType === 'whatsapp') {
      whatsappConcierge();
    }
  };

  const renderSliderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.sliderCard, { width: bannerWidth }]}
        activeOpacity={0.9}
        onPress={() => handleSlidePress(item)}
      >
        <Image source={{ uri: item.image }} style={styles.sliderCardImage} resizeMode="cover" />
        <View style={styles.sliderCardOverlay} />

        <View style={styles.sliderCardBody}>
          <View style={styles.sliderTopRow}>
            <View style={styles.sliderTagBadge}>
              <Text style={styles.sliderTagText}>{item.tag}</Text>
            </View>
            <View style={[styles.sliderFeatureBadge, { backgroundColor: item.badgeBg }]}>
              <Text style={styles.sliderFeatureBadgeText}>{item.badge}</Text>
            </View>
          </View>

          <View style={styles.sliderTextGroup}>
            <Text style={styles.sliderTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.sliderSubtitle} numberOfLines={2}>
              {item.subtitle}
            </Text>
          </View>

          <View style={styles.sliderBottomRow}>
            <View style={styles.sliderActionBtn}>
              <Text style={styles.sliderActionBtnText}>{item.btnText}</Text>
            </View>
            <Text style={styles.sliderTapHint}>100% Free Direct Contact</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Dedicated Explore Feed Header: Compact Hero Slider & Get 5 Quotes Action Banner
  const renderExploreHeader = () => {
    return (
      <View style={styles.exploreListHeader}>
        {/* Top 3 Auto-Sliding Luxury Banners (Compact & Sleek) */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={sliderRef}
            data={HERO_SLIDER_BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(event) => {
              const cardStep = bannerWidth + 10;
              const index = Math.round(event.nativeEvent.contentOffset.x / cardStep);
              if (index >= 0 && index < HERO_SLIDER_BANNERS.length) {
                setActiveSlideIndex(index);
              }
            }}
            renderItem={renderSliderItem}
            contentContainerStyle={styles.sliderContent}
          />

          {/* 3 Pagination Indicator Dots */}
          <View style={styles.sliderDotsRow}>
            {HERO_SLIDER_BANNERS.map((banner, idx) => {
              const isActive = activeSlideIndex === idx;
              return (
                <TouchableOpacity
                  key={banner.id}
                  style={[styles.sliderDot, isActive && styles.sliderDotActive]}
                  onPress={() => handleDotPress(idx)}
                  activeOpacity={0.7}
                />
              );
            })}
          </View>
        </View>

        {/* Prominent High-Conversion Hero Action Bar: GET 5 EVENT QUOTES */}
        <View style={styles.heroActionBanner}>
          <TouchableOpacity
            style={styles.getQuotesHeroBtn}
            activeOpacity={0.88}
            onPress={() => setGet5QuotesVisible(true)}
          >
            <View style={styles.getQuotesLeft}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.getQuotesTagPill}>
                  <Text style={styles.getQuotesBadge}>⚡ 1-CLICK</Text>
                </View>
                <Text style={[styles.getQuotesTitle, { fontFamily }]} numberOfLines={1}>
                  {t('get_5_quotes')}
                </Text>
              </View>
              <Text style={[styles.getQuotesSub, { fontFamily }]} numberOfLines={1}>
                {t('get_5_quotes_sub')}
              </Text>
            </View>
            <View style={styles.getQuotesArrowCircle}>
              <Text style={styles.getQuotesArrowText}>➔</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ----------------------------------------------------------------------------
  // ANIMATED SPLASH SCREEN STATE & CONTROLLERS
  // ----------------------------------------------------------------------------
  const [showSplash, setShowSplash] = useState(true);
  const splashFade = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.35)).current;
  const logoGlow = useRef(new Animated.Value(0.85)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo Spring Pop
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // 2. Pulsing Golden Glow Aura Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoGlow, {
          toValue: 0.85,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Text and Progress Slide In
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 800,
        delay: 350,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 800,
        delay: 350,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2100,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start();

    // 4. Auto Fade-Out Splash Screen after 2.5s
    const timer = setTimeout(() => {
      dismissSplash();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const dismissSplash = () => {
    Animated.timing(splashFade, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setShowSplash(false);
      // Auto-display royal Gujarati Reward Pop-up Banner ("ઓર્ડર અપાવો અને મેળવો ₹10,000")
      // Strictly ONLY after customer/user is authenticated
      setTimeout(() => {
        if (getStoredSession()) {
          setRewardPopupVisible(true);
        }
      }, 650);
    });
  };

  const replaySplash = () => {
    splashFade.setValue(1);
    logoScale.setValue(0.35);
    contentFade.setValue(0);
    contentTranslateY.setValue(30);
    progressAnim.setValue(0);
    setShowSplash(true);

    Animated.spring(logoScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
    ]).start();

    setTimeout(() => {
      dismissSplash();
    }, 2200);
  };

  // Modals Visibility
  const [bizModalVisible, setBizModalVisible] = useState(false);
  const [referModalVisible, setReferModalVisible] = useState(false);
  const [rewardPopupVisible, setRewardPopupVisible] = useState(false);

  // Vendor Registration Form State
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState('mandap');
  const [bizLocation, setBizLocation] = useState('Godhra');
  const [bizPrice, setBizPrice] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizInstagram, setBizInstagram] = useState('');
  const [bizImage, setBizImage] = useState('');
  const [bizDesc, setBizDesc] = useState('');
  const [submittingBiz, setSubmittingBiz] = useState(false);

  // Refer & Earn Form State
  const [refClientName, setRefClientName] = useState('');
  const [refClientPhone, setRefClientPhone] = useState('');
  const [refEventDetails, setRefEventDetails] = useState('');
  const [refSenderName, setRefSenderName] = useState('');
  const [refSenderPhone, setRefSenderPhone] = useState('');
  const [submittingReferral, setSubmittingReferral] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, [selectedCategory]);

  async function fetchVendors() {
    if (!supabase) {
      setIsLiveDatabase(false);
      filterLocalVendors(selectedCategory);
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from('vendors').select('*');

      // STRICT ADMIN APPROVAL: Public customer app must only query approved & active listings
      try {
        query = query.eq('listing_status', 'approved').eq('is_approved', true).eq('account_status', 'active');
      } catch (e) {
        // Fallback for legacy columns
      }

      query = query.order('id', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      let { data, error } = await query;

      // If remote Supabase table does not have listing_status column yet, fallback to select *
      if (error && error.message && error.message.includes('column')) {
        let fallbackQuery = supabase.from('vendors').select('*').order('id', { ascending: false });
        if (selectedCategory !== 'all') {
          fallbackQuery = fallbackQuery.eq('category', selectedCategory);
        }
        const fallbackRes = await fallbackQuery;
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) {
        console.warn('Supabase fetch failed, falling back to local dataset:', error.message);
        setIsLiveDatabase(false);
        filterLocalVendors(selectedCategory);
      } else if (data && data.length > 0) {
        // Enforce strict visibility filter
        const approvedOnly = data.filter(isPubliclyVisibleVendor);
        const enriched = approvedOnly.map((item) => {
          const localMatch = INITIAL_GODHRA_VENDORS.find(
            (v) => v.business_name.toLowerCase() === (item.business_name || '').toLowerCase()
          );
          return {
            ...item,
            image_url: item.image_url || localMatch?.image_url || DEFAULT_CATEGORY_IMAGES[item.category],
            instagram_handle: item.instagram_handle || localMatch?.instagram_handle || null,
          };
        });
        setVendors(enriched);
        setIsLiveDatabase(true);
      } else {
        filterLocalVendors(selectedCategory);
      }
    } catch (err) {
      console.warn('Network exception while contacting Supabase:', err);
      setIsLiveDatabase(false);
      filterLocalVendors(selectedCategory);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function filterLocalVendors(catId) {
    const visibleVendors = ENRICHED_MARKETPLACE_VENDORS.filter(isPubliclyVisibleVendor);
    if (catId === 'all') {
      setVendors(visibleVendors);
    } else {
      setVendors(visibleVendors.filter((v) => v.category === catId));
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendors();
  };

  const sanitizePhoneNumber = (raw) => {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1);
    }
    return digits;
  };

  const makeCall = async (phone, businessName) => {
    const cleanPhone = sanitizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Invalid Contact', 'No valid contact phone found for this vendor.');
      return;
    }

    const url = `tel:${cleanPhone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Linking.openURL(url).catch(() => {
          Alert.alert('Call Now', `Please call ${businessName} directly at:\n+91 ${cleanPhone}`);
        });
      }
    } catch (e) {
      Alert.alert('Calling Vendor', `Dialing +91 ${cleanPhone}`);
    }
  };

  const openWhatsApp = async (phone, businessName, categoryId) => {
    const cleanPhone = sanitizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Invalid Contact', 'No valid WhatsApp contact found for this vendor.');
      return;
    }

    const categoryObj = CATEGORIES.find((c) => c.id === categoryId);
    const categoryName = categoryObj ? categoryObj.label : 'Wedding & Event Service';

    const message = `Namaste ${businessName}! 🙏\nI found your profile on *Panchmahal Events Hub* (${categoryName}).\nI would like to inquire about your availability and pricing for an upcoming wedding/event in Panchmahal.\nPlease share packages & portfolio details.`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;

    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert(
        'WhatsApp Not Found',
        `Could not open WhatsApp automatically. You can reach out directly via Phone Call at: +91 ${cleanPhone}`
      );
    }
  };

  const openInstagram = async (rawHandle) => {
    if (!rawHandle) return;
    const cleanHandle = rawHandle.replace('@', '').trim();
    const url = `https://instagram.com/${cleanHandle}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Linking.openURL(url).catch(() => {
          Alert.alert('Instagram Profile', `Instagram username: @${cleanHandle}`);
        });
      }
    } catch (err) {
      Alert.alert('Instagram Profile', `Instagram username: @${cleanHandle}`);
    }
  };

  async function handleRegisterVendor() {
    const cleanName = bizName.trim();
    const cleanPhone = sanitizePhoneNumber(bizPhone);
    const cleanPrice = bizPrice.trim();
    const cleanLoc = bizLocation.trim();
    const cleanDesc = bizDesc.trim();
    const cleanInsta = bizInstagram.trim().replace('@', '');
    const cleanImg = bizImage.trim() || DEFAULT_CATEGORY_IMAGES[bizCategory];

    if (!cleanName || cleanName.length < 3) {
      Alert.alert('Required Field', 'Please enter a valid Business / Vendor Name (at least 3 characters).');
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian Mobile Number (starts with 6-9).');
      return;
    }

    if (!cleanPrice) {
      Alert.alert('Required Field', 'Please provide a Price Range or Starting Price (e.g., ₹25,000 - ₹50,000).');
      return;
    }

    if (!cleanLoc) {
      Alert.alert('Required Field', 'Please specify your location in Panchmahal / Godhra.');
      return;
    }

    setSubmittingBiz(true);

    try {
      const res = await submitBusinessListing({
        business_name: cleanName,
        category: bizCategory,
        location: cleanLoc,
        price_range: cleanPrice,
        phone: cleanPhone,
        description: cleanDesc || 'Local verified wedding & event service provider in Panchmahal.',
        image_url: cleanImg,
        instagram_handle: cleanInsta || null,
        owner_name: cleanName,
      });

      if (!res.success) {
        Alert.alert('Registration Notice', res.message || 'Could not submit business listing.');
        return;
      }

      // STRICT ADMIN APPROVAL: Listing remains pending and is NOT injected into public customer search
      Alert.alert(
        '⏳ Submitted for Admin Approval',
        'Your business listing is submitted and waiting for Admin approval. Our administrative team will verify your business details before activating it on the public directory.'
      );

      setBizName('');
      setBizPhone('');
      setBizPrice('');
      setBizDesc('');
      setBizInstagram('');
      setBizImage('');
      setBizModalVisible(false);
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Could not submit vendor application.');
    } finally {
      setSubmittingBiz(false);
    }
  }

  async function handleReferSubmit() {
    const clientName = refClientName.trim();
    const clientPhone = sanitizePhoneNumber(refClientPhone);
    const eventDetails = refEventDetails.trim();
    const senderName = refSenderName.trim();
    const senderPhone = sanitizePhoneNumber(refSenderPhone);

    if (!clientName || clientName.length < 2) {
      Alert.alert('Missing Details', 'Please enter the Client / Host Family Name.');
      return;
    }

    if (!clientPhone || clientPhone.length !== 10 || !/^[6-9]\d{9}$/.test(clientPhone)) {
      Alert.alert('Invalid Client Phone', 'Please enter a valid 10-digit mobile number for the client.');
      return;
    }

    if (!eventDetails || eventDetails.length < 5) {
      Alert.alert('Event Details Required', 'Please provide event requirements (e.g. Wedding date, Mandap, Catering).');
      return;
    }

    if (!senderName || senderName.length < 2) {
      Alert.alert('Missing Details', 'Please enter your name so we can credit your reward.');
      return;
    }

    if (!senderPhone || senderPhone.length !== 10 || !/^[6-9]\d{9}$/.test(senderPhone)) {
      Alert.alert('Invalid Reward Phone', 'Please enter your 10-digit mobile number for UPI reward transfer.');
      return;
    }

    setSubmittingReferral(true);

    const referralPayload = {
      client_name: clientName,
      client_phone: clientPhone,
      event_details: eventDetails,
      agent_name: senderName,
      agent_phone: senderPhone,
      status: 'Pending',
      reward_amount: 'Up to ₹10,000',
    };

    try {
      if (supabase) {
        const { error } = await supabase.from('referrals').insert([referralPayload]);
        if (error) throw error;
      }

      Alert.alert(
        '🎁 Lead Submitted Successfully!',
        `Thank you ${senderName}!\n\nYour referral lead for "${clientName}" has been registered.\n\nOur Godhra operations team will reach out to the family. Once the wedding booking confirms, your reward of up to ₹10,000 will be credited directly to ${senderPhone} (GPay/PhonePe)!`,
        [{ text: 'Great, Thank You!', onPress: () => setReferModalVisible(false) }]
      );

      setRefClientName('');
      setRefClientPhone('');
      setRefEventDetails('');
      setRefSenderName('');
      setRefSenderPhone('');
    } catch (err) {
      Alert.alert('Submission Error', err.message || 'Could not submit referral lead.');
    } finally {
      setSubmittingReferral(false);
    }
  }

  const nearbySearchResult = useMemo(() => {
    let baseList = vendors;

    // Apply smart matching if any smart criteria are set
    if (
      searchFilters.location ||
      (searchFilters.requiredServices && searchFilters.requiredServices.length > 0) ||
      searchFilters.eventDate ||
      searchFilters.verifiedOnly ||
      searchFilters.sortBy !== 'recommended'
    ) {
      baseList = smartMatchVendors(vendors, {
        category: selectedCategory,
        requiredServices: searchFilters.requiredServices,
        location: searchFilters.location,
        eventDate: searchFilters.eventDate,
        verifiedOnly: searchFilters.verifiedOnly,
        sortBy: searchFilters.sortBy,
      });
    }

    return searchNearbyVendors({
      vendors: baseList,
      customerLocation,
      radiusKm: searchRadius,
      allIndiaMode: searchRadius === 'ALL',
      category: selectedCategory,
      searchQuery,
      verifiedOnly: searchFilters.verifiedOnly,
    });
  }, [vendors, customerLocation, searchRadius, selectedCategory, searchQuery, searchFilters]);

  const filteredVendors = nearbySearchResult.vendors;

  const renderVendorCard = ({ item }) => {
    const categoryInfo = CATEGORIES.find((c) => c.id === item.category);
    const vendorImage =
      item.image_url || DEFAULT_CATEGORY_IMAGES[item.category] || DEFAULT_CATEGORY_IMAGES.mandap;
    const isSaved = savedVendorIds.includes(item.id);
    const isCompared = comparedVendorIds.includes(item.id);

    return (
      <View style={[styles.card, numGridColumns > 1 && styles.cardGridItem]}>
        {/* Top Image Banner with Floating Badges & Save Heart */}
        <TouchableOpacity
          style={styles.cardImageContainer}
          activeOpacity={0.9}
          onPress={() => openVendorProfile(item)}
        >
          <Image source={{ uri: vendorImage }} style={styles.cardBannerImage} resizeMode="cover" />
          <View style={styles.imageOverlayBadges}>
            <View style={styles.categoryBadge}>
              <Text style={[styles.categoryBadgeText, { fontFamily }]}>
                {categoryInfo?.icon || '🎪'} {getCategoryTitle(categoryInfo, language) || item.category}
              </Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {item.rating || '4.9'}</Text>
            </View>
          </View>

          {/* Top Right Action Icons: Compare + Heart */}
          <View style={styles.cardFloatingActions}>
            <TouchableOpacity
              style={[styles.saveHeartBtn, isSaved && styles.saveHeartBtnActive]}
              activeOpacity={0.8}
              onPress={() => toggleSaveVendor(item.id)}
            >
              <Text style={styles.saveHeartIcon}>{isSaved ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cardCompareBtn, isCompared && styles.cardCompareBtnActive]}
              activeOpacity={0.8}
              onPress={() => toggleCompareVendor(item.id)}
            >
              <Text
                style={[
                  styles.cardCompareBtnText,
                  isCompared && styles.cardCompareBtnTextActive,
                  { fontFamily },
                ]}
              >
                {isCompared ? `✓ ${language === 'gu' ? 'ઉમેરાયું' : language === 'hi' ? 'जोड़ा गया' : 'Added'}` : `⚖️ ${t('compare_btn')}`}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Card Content Body */}
        <View style={styles.cardBody}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => openVendorProfile(item)}>
            <Text style={styles.businessName}>{item.business_name}</Text>
          </TouchableOpacity>

          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{item.location}</Text>
            <View style={styles.verifiedTag}>
              <Text style={[styles.verifiedText, { fontFamily }]}>✓ {t('verified_badge')}</Text>
            </View>
          </View>

          {/* Dynamic Distance Badge (Calculated Haversine Distance & Proximity Tier) */}
          {item.calculated_distance_km != null && (
            <View
              style={[
                styles.distancePillBadge,
                {
                  backgroundColor: item.distance_tier?.color ? `${item.distance_tier.color}15` : '#e0f2fe',
                  borderColor: item.distance_tier?.color || '#0284c7',
                },
              ]}
            >
              <Text style={[styles.distancePillText, { color: item.distance_tier?.color || '#0284c7', fontFamily }]}>
                {item.distance_tier?.icon || '📍'} {formatLocalizedDistance(item.calculated_distance_km, language)} • {getLocalizedTierLabel(item.distance_tier?.key, language)}
              </Text>
            </View>
          )}

          {item.description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { fontFamily }]}>{language === 'gu' ? 'કિંમત / પેકેજ:' : language === 'hi' ? 'मूल्य / पैकेज:' : 'Price / Package:'}</Text>
            <Text style={styles.priceValue}>{item.price_range}</Text>
          </View>

          {/* Instagram Profile Badge Link */}
          {item.instagram_handle ? (
            <TouchableOpacity
              style={styles.instagramBadgeRow}
              activeOpacity={0.8}
              onPress={() => openInstagram(item.instagram_handle)}
            >
              <Text style={styles.instaBadgeIcon}>📸</Text>
              <Text style={styles.instaBadgeText}>@{item.instagram_handle.replace('@', '')}</Text>
              <Text style={[styles.instaBadgeArrow, { fontFamily }]}>Instagram Portfolio →</Text>
            </TouchableOpacity>
          ) : null}

          {/* Quick Date Availability & Real Gallery Action Bar */}
          <View style={styles.cardQuickRow}>
            <TouchableOpacity
              style={styles.cardQuickAvailBtn}
              activeOpacity={0.8}
              onPress={() => openVendorAvailability(item)}
            >
              <Text style={[styles.cardQuickAvailText, { fontFamily }]}>📅 {language === 'gu' ? 'તારીખ તપાસો' : language === 'hi' ? 'तारीख जांचें' : 'Check Date'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardQuickProfileBtn}
              activeOpacity={0.8}
              onPress={() => openVendorProfile(item)}
            >
              <Text style={[styles.cardQuickProfileText, { fontFamily }]}>📸 {t('photos_packages')} →</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons Row: Call Now, WhatsApp, Instagram, Free Quote */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.callButton}
              activeOpacity={0.8}
              onPress={() => makeCall(item.phone, item.business_name)}
            >
              <Text style={[styles.callButtonText, { fontFamily }]}>📞 {t('call_now')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.waButton}
              activeOpacity={0.8}
              onPress={() => openWhatsApp(item.phone, item.business_name, item.category)}
            >
              <Text style={[styles.waButtonText, { fontFamily }]}>💬 {t('whatsapp_chat')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.enquireCardBtn}
              activeOpacity={0.85}
              onPress={() => setGet5QuotesVisible(true)}
            >
              <Text style={[styles.enquireCardBtnText, { fontFamily }]}>
                ⚡ {language === 'gu' ? 'ભાવપત્રક' : language === 'hi' ? 'कोटेशन' : 'Quote'}
              </Text>
            </TouchableOpacity>

            {item.instagram_handle ? (
              <TouchableOpacity
                style={styles.instaButton}
                activeOpacity={0.8}
                onPress={() => openInstagram(item.instagram_handle)}
              >
                <Text style={styles.instaButtonText}>📸 Insta</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* ====================================================================== */}
      {/* TOP RBAC ROLE INDICATOR & ACCOUNT SWITCHER */}
      {/* ====================================================================== */}
      <View style={styles.rbacTopBar}>
        <View style={styles.rbacUserIdentity}>
          <View
            style={[
              styles.rbacRoleBadge,
              currentUserRole === ROLES.ADMIN
                ? styles.rbacBadgeAdmin
                : currentUserRole === ROLES.VENDOR && currentUser?.vendor_status === 'pending'
                ? styles.rbacBadgePending
                : currentUserRole === ROLES.VENDOR && currentUser?.vendor_status === 'rejected'
                ? styles.rbacBadgeRejected
                : currentUserRole === ROLES.VENDOR
                ? styles.rbacBadgeVendor
                : styles.rbacBadgeCustomer,
            ]}
          >
            <Text style={[styles.rbacRoleBadgeText, { fontFamily }]}>
              {currentUserRole === ROLES.ADMIN
                ? `🛡️ ${t('portal_admin')}`
                : currentUserRole === ROLES.VENDOR && currentUser?.vendor_status === 'pending'
                ? `⏳ ${t('portal_pending')}`
                : currentUserRole === ROLES.VENDOR && currentUser?.vendor_status === 'rejected'
                ? `❌ ${t('portal_rejected')}`
                : currentUserRole === ROLES.VENDOR
                ? `🏪 ${t('portal_vendor')}`
                : `👤 ${t('portal_customer')}`}
            </Text>
          </View>
          <Text style={styles.rbacUserName} numberOfLines={1}>
            {currentUser?.business_name || currentUser?.full_name || t('guest_user')}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <LanguageSwitchPill onPress={() => setLangModalVisible(true)} />
          {currentUser ? (
            <TouchableOpacity
              style={styles.rbacLogoutBtn}
              activeOpacity={0.8}
              onPress={handleLogout}
            >
              <Text style={[styles.rbacLogoutBtnText, { fontFamily }]}>{t('logout_btn')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.rbacLoginBtn}
              activeOpacity={0.8}
              onPress={() => setAuthModalVisible(true)}
            >
              <Text style={[styles.rbacLoginBtnText, { fontFamily }]}>🔑 {t('auth_login_tab')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ====================================================================== */}
      {/* 403 UNAUTHORIZED ROUTE GUARD SCREEN */}
      {/* ====================================================================== */}
      {unauthorizedRouteReason ? (
        <UnauthorizedScreen
          reason={unauthorizedRouteReason}
          onRedirectToSafeDashboard={() => {
            setUnauthorizedRouteReason(null);
            const route = resolveAuthenticatedRoute(currentUser);
            if (route === '/admin') setActiveNavTab('admin_dashboard');
            else if (route === '/vendor') setActiveNavTab('vendor_dashboard');
            else if (route === '/vendor-pending') setActiveNavTab('vendor_pending');
            else if (route === '/vendor-rejected') setActiveNavTab('vendor_rejected');
            else if (route === '/account-setup') setActiveNavTab('account_setup');
            else setActiveNavTab('explore');
          }}
          onOpenAuthModal={() => setAuthModalVisible(true)}
        />
      ) : (
        <>
      {/* ---------------------------------------------------------------------- */}
      {/* MAIN ACTIVE TAB CONTENT */}
      {/* ---------------------------------------------------------------------- */}

      {/* === TAB 1: EXPLORE & VENDOR DIRECTORY === */}
      {activeNavTab === 'explore' && (
        <View style={styles.tabContentWrapper}>
          <View style={[styles.exploreControlsWrapper, screenWidth >= 1100 && { alignSelf: 'center' }]}>
            {/* Smart Nearby Customer Location & Radius Controls (Compact) */}
            <NearbyLocationBar
              currentLocation={customerLocation}
              onLocationChange={setCustomerLocation}
              currentRadius={searchRadius}
              onRadiusChange={setSearchRadius}
            />

            {/* Compact Single-Row Search Bar + Smart Event Search Trigger */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={[styles.searchInput, { fontFamily }]}
                  placeholder={t('search_placeholder')}
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                    <Text style={styles.clearSearchText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Smart Search Trigger Button */}
              <TouchableOpacity
                style={[
                  styles.smartSearchTriggerBtn,
                  Boolean(
                    searchFilters.location ||
                      (searchFilters.requiredServices && searchFilters.requiredServices.length > 0) ||
                      searchFilters.eventDate
                  ) && styles.smartSearchTriggerBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setSmartSearchVisible(true)}
              >
                <Text style={styles.smartSearchTriggerIcon}>🎯</Text>
                <Text style={[styles.smartSearchTriggerText, { fontFamily }]}>{t('smart_search_btn')}</Text>
              </TouchableOpacity>
            </View>

            {/* Active Filter Strip (Shown when Smart Search is active) */}
            {Boolean(
              searchFilters.location ||
                (searchFilters.requiredServices && searchFilters.requiredServices.length > 0) ||
                searchFilters.eventDate ||
                searchFilters.verifiedOnly
            ) && (
              <View style={styles.activeFilterStrip}>
                <Text style={styles.activeFilterText} numberOfLines={1}>
                  🎯 Smart Search Active:{' '}
                  {searchFilters.location ? `📍 ${searchFilters.location}` : 'Panchmahal'}{' '}
                  {searchFilters.eventDate ? `• 📅 ${searchFilters.eventDate}` : ''}{' '}
                  {searchFilters.verifiedOnly ? `• 🛡️ ${t('verified_badge')}` : ''}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setSearchFilters({
                      eventType: '',
                      location: '',
                      eventDate: '',
                      guestCount: '',
                      budget: '',
                      requiredServices: [],
                      verifiedOnly: false,
                      sortBy: 'recommended',
                    })
                  }
                  style={styles.clearFiltersBtn}
                >
                  <Text style={[styles.clearFiltersText, { fontFamily }]}>✕ {t('clear_filters')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Horizontal Category Scroll Tabs (Compact Single Row) */}
            <View style={styles.tabsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollTabs}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.tab, isSelected && styles.activeTab]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tabIcon}>{cat.icon}</Text>
                      <View>
                        <Text style={[styles.tabText, isSelected && styles.activeTabText, { fontFamily }]}>
                          {getCategoryTitle(cat, language)}
                        </Text>
                        <Text style={[styles.tabSubText, isSelected && styles.activeTabSubText, { fontFamily }]}>
                          {language !== 'en' ? cat.label : cat.gujarati}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Dedicated Scrollable Area: Vendors & Services Feed with Scrolling Promotional Banners */}
          {loading && !refreshing ? (
            <View style={{ flex: 1 }}>
              {renderExploreHeader()}
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d97706" />
                <Text style={styles.loadingText}>Loading verified local vendors...</Text>
              </View>
            </View>
          ) : (
            <FlatList
              key={`vendor-grid-${numGridColumns}`}
              numColumns={numGridColumns}
              style={{ flex: 1 }}
              data={filteredVendors}
              keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
              renderItem={renderVendorCard}
              ListHeaderComponent={renderExploreHeader}
              contentContainerStyle={[
                styles.listContent,
                screenWidth >= 1100 && styles.listContentDesktop,
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#d97706']}
                  tintColor="#d97706"
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📍</Text>
                  <Text style={[styles.emptyTitle, { fontFamily }]}>
                    {searchRadius === 'ALL'
                      ? t('no_vendors_found')
                      : `${t('no_vendors_found')} (${searchRadius} km)`}
                  </Text>
                  <Text style={[styles.emptySubtitle, { fontFamily }]}>
                    {t('no_vendors_subtitle')}
                  </Text>

                  {/* Quick Radius Expansion Pills */}
                  {searchRadius !== 'ALL' && (
                    <View style={styles.emptyRadiusActionsRow}>
                      {Number(searchRadius) < 50 && (
                        <TouchableOpacity
                          style={styles.expandRadiusPillBtn}
                          onPress={() => setSearchRadius(50)}
                        >
                          <Text style={[styles.expandRadiusPillText, { fontFamily }]}>{t('expand_to_50km')}</Text>
                        </TouchableOpacity>
                      )}
                      {Number(searchRadius) < 100 && (
                        <TouchableOpacity
                          style={styles.expandRadiusPillBtn}
                          onPress={() => setSearchRadius(100)}
                        >
                          <Text style={[styles.expandRadiusPillText, { fontFamily }]}>{t('expand_to_100km')}</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.expandRadiusPillBtn, { backgroundColor: '#1e293b' }]}
                        onPress={() => setSearchRadius('ALL')}
                      >
                        <Text style={[styles.expandRadiusPillText, { fontFamily }]}>{t('search_all_india')} 🇮🇳</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.emptyActionBtn, { marginTop: 14 }]}
                    onPress={() => setBizModalVisible(true)}
                  >
                    <Text style={[styles.emptyActionBtnText, { fontFamily }]}>{t('register_as_first_vendor')}</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* === TAB 2: MY WEDDING SHORTLIST (SAVED) === */}
      {activeNavTab === 'shortlist' && (
        <View style={styles.tabContentWrapper}>
          <View style={styles.shortlistHeaderBar}>
            <View style={styles.shortlistTitleGroup}>
              <View style={styles.shortlistTitleRow}>
                <Text style={[styles.shortlistHeading, { fontFamily }]}>{t('my_shortlist_heading')}</Text>
                <View style={styles.shortlistCountPill}>
                  <Text style={[styles.shortlistCountPillText, { fontFamily }]}>{savedVendors.length} {t('saved')}</Text>
                </View>
              </View>
              <Text style={[styles.shortlistSub, { fontFamily }]}>
                {t('my_shortlist_sub')}
              </Text>
            </View>
            {savedVendors.length > 0 && (
              <TouchableOpacity
                style={styles.shareShortlistBtn}
                activeOpacity={0.85}
                onPress={shareShortlistViaWhatsApp}
              >
                <Text style={[styles.shareShortlistBtnText, { fontFamily }]}>{t('share_on_whatsapp')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {savedVendors.length === 0 ? (
            <View style={styles.emptyShortlistCard}>
              <Text style={styles.emptyShortlistIcon}>💖</Text>
              <Text style={[styles.emptyShortlistTitle, { fontFamily }]}>{t('empty_shortlist_title')}</Text>
              <Text style={[styles.emptyShortlistDesc, { fontFamily }]}>
                {t('empty_shortlist_sub')}
              </Text>
              <TouchableOpacity
                style={styles.exploreVendorsBtn}
                activeOpacity={0.85}
                onPress={() => setActiveNavTab('explore')}
              >
                <Text style={[styles.exploreVendorsBtnText, { fontFamily }]}>🎪 {t('nav_explore')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              key={`shortlist-grid-${numGridColumns}`}
              numColumns={numGridColumns}
              data={savedVendors}
              keyExtractor={(item) => (item.id ? `saved-${item.id}` : Math.random().toString())}
              renderItem={renderVendorCard}
              contentContainerStyle={[
                styles.listContent,
                screenWidth >= 1100 && styles.listContentDesktop,
              ]}
            />
          )}
        </View>
      )}

      {/* === TAB 3: REWARDS & REFERRAL HUB === */}
      {activeNavTab === 'rewards' && (
        <ScrollView
          style={styles.tabContentWrapper}
          contentContainerStyle={styles.scrollScreenContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Royal Rewards Hero Banner */}
          <View style={styles.rewardsHeroCard}>
            <View style={styles.rewardsCrownBadge}>
              <Text style={styles.rewardsCrownText}>👑 PANCHMAHAL WEDDING CLUB</Text>
            </View>
            <Text style={styles.rewardsHeroTitle}>Refer Weddings & Earn Up To ₹10,000 Cash!</Text>
            <Text style={styles.rewardsHeroSub}>
              Know someone getting married in Godhra, Halol, Kalol, or Panchmahal? Connect them with verified local vendors. When they confirm booking, you receive instant cash reward via UPI!
            </Text>

            <View style={styles.rewardStatsRow}>
              <View style={styles.rewardStatBox}>
                <Text style={styles.rewardStatNumber}>₹10,000</Text>
                <Text style={styles.rewardStatLabel}>Max Payout</Text>
              </View>
              <View style={styles.rewardStatBox}>
                <Text style={styles.rewardStatNumber}>⚡ Instant</Text>
                <Text style={styles.rewardStatLabel}>UPI / GPay</Text>
              </View>
              <View style={styles.rewardStatBox}>
                <Text style={styles.rewardStatNumber}>0% Fees</Text>
                <Text style={styles.rewardStatLabel}>100% Free</Text>
              </View>
            </View>

            <View style={styles.rewardsActionRow}>
              <TouchableOpacity
                style={styles.rewardsPrimaryBtn}
                activeOpacity={0.85}
                onPress={() => setReferModalVisible(true)}
              >
                <Text style={styles.rewardsPrimaryBtnText}>📝 Submit Wedding Lead</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rewardsWaBtn}
                activeOpacity={0.85}
                onPress={shareReferralViaWhatsApp}
              >
                <Text style={styles.rewardsWaBtnText}>💬 Invite on WhatsApp</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.rewardsOfferPillBtn}
              activeOpacity={0.85}
              onPress={() => setRewardPopupVisible(true)}
            >
              <Text style={styles.rewardsOfferPillText}>
                ✨ ઓર્ડર અપાવો અને મેળવો ₹10,000 રોકડ ઇનામ - ઓફર બેનર જુઓ →
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4-Step How It Works Guide */}
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>How Refer & Earn Works</Text>
            <View style={styles.guideStepRow}>
              <View style={styles.guideStepBadge}>
                <Text style={styles.guideStepNum}>1</Text>
              </View>
              <View style={styles.guideStepTextGroup}>
                <Text style={styles.guideStepHeading}>Find an Upcoming Wedding</Text>
                <Text style={styles.guideStepDesc}>
                  Ask friends, relatives, or neighbors planning weddings in Panchmahal district.
                </Text>
              </View>
            </View>

            <View style={styles.guideStepRow}>
              <View style={styles.guideStepBadge}>
                <Text style={styles.guideStepNum}>2</Text>
              </View>
              <View style={styles.guideStepTextGroup}>
                <Text style={styles.guideStepHeading}>Submit Lead in 1 Minute</Text>
                <Text style={styles.guideStepDesc}>
                  Provide host name, mobile number, and requirements (Mandap, Catering, Party Plot).
                </Text>
              </View>
            </View>

            <View style={styles.guideStepRow}>
              <View style={styles.guideStepBadge}>
                <Text style={styles.guideStepNum}>3</Text>
              </View>
              <View style={styles.guideStepTextGroup}>
                <Text style={styles.guideStepHeading}>Vendors Give Best Direct Rates</Text>
                <Text style={styles.guideStepDesc}>
                  Our concierge connects them directly with top verified local vendors with 0% middleman fees.
                </Text>
              </View>
            </View>

            <View style={styles.guideStepRow}>
              <View style={styles.guideStepBadge}>
                <Text style={styles.guideStepNum}>4</Text>
              </View>
              <View style={styles.guideStepTextGroup}>
                <Text style={styles.guideStepHeading}>Receive Direct Cash Reward</Text>
                <Text style={styles.guideStepDesc}>
                  Upon booking confirmation, reward of ₹1,000 to ₹10,000 is credited straight to your PhonePe/GPay!
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Community Payouts Social Proof */}
          <View style={styles.socialProofCard}>
            <Text style={styles.socialProofTitle}>Recent Community Payouts in Godhra 🎉</Text>
            <View style={styles.payoutItem}>
              <Text style={styles.payoutEmoji}>💰</Text>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutPerson}>Mahesh Patel (Bamroli Road)</Text>
                <Text style={styles.payoutDetails}>Earned ₹3,500 for Grand Mandap Booking</Text>
              </View>
              <Text style={styles.payoutBadge}>Paid ✓</Text>
            </View>
            <View style={styles.payoutItem}>
              <Text style={styles.payoutEmoji}>💰</Text>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutPerson}>Irfan Khan (Vavdi Buzarg)</Text>
                <Text style={styles.payoutDetails}>Earned ₹6,000 for Party Plot + Catering</Text>
              </View>
              <Text style={styles.payoutBadge}>Paid ✓</Text>
            </View>
            <View style={styles.payoutItem}>
              <Text style={styles.payoutEmoji}>💰</Text>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutPerson}>Prakash Solanki (Halol)</Text>
                <Text style={styles.payoutDetails}>Earned ₹2,000 for DJ Sound & Lighting</Text>
              </View>
              <Text style={styles.payoutBadge}>Paid ✓</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* === TAB 4: HELPDESK & CONCIERGE === */}
      {activeNavTab === 'concierge' && (
        <ScrollView
          style={styles.tabContentWrapper}
          contentContainerStyle={styles.scrollScreenContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Concierge Hero */}
          <View style={styles.conciergeHeroCard}>
            <View style={styles.conciergeBadge}>
              <Text style={styles.conciergeBadgeText}>🏛️ GODHRA WEDDING CONCIERGE</Text>
            </View>
            <Text style={[styles.conciergeTitle, { fontFamily }]}>{t('helpdesk_heading')}</Text>
            <Text style={[styles.conciergeSub, { fontFamily }]}>
              {t('helpdesk_sub')}
            </Text>

            <View style={styles.conciergeContactButtons}>
              <TouchableOpacity
                style={styles.conciergeCallBtn}
                activeOpacity={0.85}
                onPress={() => makeCall('9825123401', 'Panchmahal Wedding Concierge')}
              >
                <Text style={[styles.conciergeCallBtnText, { fontFamily }]}>📞 {t('call_concierge')}: 9825123401</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.conciergeWaBtn}
                activeOpacity={0.85}
                onPress={whatsappConcierge}
              >
                <Text style={[styles.conciergeWaBtnText, { fontFamily }]}>💬 {t('chat_concierge_wa')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Guarantees Grid */}
          <View style={styles.guaranteeGrid}>
            <View style={styles.guaranteeCard}>
              <Text style={styles.guaranteeIcon}>🛡️</Text>
              <Text style={styles.guaranteeHeading}>100% Verified Vendors</Text>
              <Text style={styles.guaranteeText}>
                Every decorator, party plot & caterer is physically checked in Panchmahal.
              </Text>
            </View>

            <View style={styles.guaranteeCard}>
              <Text style={styles.guaranteeIcon}>🚫</Text>
              <Text style={styles.guaranteeHeading}>Zero Commission</Text>
              <Text style={styles.guaranteeText}>
                Deal directly with the vendor. No agency markups or hidden fees.
              </Text>
            </View>

            <View style={styles.guaranteeCard}>
              <Text style={styles.guaranteeIcon}>⚡</Text>
              <Text style={styles.guaranteeHeading}>Emergency Backup</Text>
              <Text style={styles.guaranteeText}>
                If a vendor cancels, our network dispatches an instant replacement.
              </Text>
            </View>

            <View style={styles.guaranteeCard}>
              <Text style={styles.guaranteeIcon}>💍</Text>
              <Text style={styles.guaranteeHeading}>Custom Combos</Text>
              <Text style={styles.guaranteeText}>
                Get bundled package discounts on Mandap + Party Plot + Catering.
              </Text>
            </View>
          </View>

          {/* FAQ Cards */}
          <View style={styles.faqSection}>
            <Text style={styles.faqMainTitle}>Frequently Asked Questions (FAQ)</Text>

            <View style={styles.faqCard}>
              <Text style={styles.faqQuestion}>❓ Is Panchmahal Events Hub really free for families?</Text>
              <Text style={styles.faqAnswer}>
                Yes! We never charge families or event organizers. You get direct contact numbers and Instagram profiles to talk to vendors directly.
              </Text>
            </View>

            <View style={styles.faqCard}>
              <Text style={styles.faqQuestion}>❓ How do I get quotes from multiple vendors?</Text>
              <Text style={styles.faqAnswer}>
                You can tap WhatsApp on each vendor to send a pre-filled quote request, or chat with our Concierge to get 3 instant quotes for your date.
              </Text>
            </View>

            <View style={styles.faqCard}>
              <Text style={styles.faqQuestion}>❓ Which areas in Panchmahal district are covered?</Text>
              <Text style={styles.faqAnswer}>
                Godhra, Halol, Kalol, Shehra, Lunawada, Ghoghamba, Morva Hadaf, and all surrounding talukas and villages.
              </Text>
            </View>
          </View>

          {/* Superadmin Console Access */}
          <TouchableOpacity
            style={styles.adminAccessBtn}
            activeOpacity={0.85}
            onPress={() => {
              if (currentUserRole !== ROLES.ADMIN) {
                setUnauthorizedRouteReason(
                  '403 Forbidden: Superadmin Control Console requires verified administrator privileges. Customer and vendor accounts are restricted.'
                );
              } else {
                setActiveNavTab('admin_dashboard');
              }
            }}
          >
            <Text style={styles.adminAccessIcon}>🛡️</Text>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.adminAccessTitle}>Superadmin Control Panel</Text>
              <Text style={styles.adminAccessSub}>
                Moderation, vendor verification badges, customer enquiries & audit logs
              </Text>
            </View>
            <Text style={styles.adminAccessArrow}>➔</Text>
          </TouchableOpacity>

          {/* Footer note */}
          <View style={styles.conciergeFooter}>
            <Text style={styles.conciergeFooterText}>Panchmahal Events Hub • Version 1.0.0 (Release)</Text>
            <Text style={styles.conciergeFooterSub}>Proudly Serving Godhra & Panchmahal District, Gujarat 🇮🇳</Text>
          </View>
        </ScrollView>
      )}

      {/* === TAB 5: CUSTOMER DASHBOARD / MY BOOKINGS & RECEIPTS === */}
      {activeNavTab === 'customer_portal' && (
        <CustomerDashboard
          user={currentUser}
          onOpenSmartSearch={() => setSmartSearchVisible(true)}
          onOpenGet5Quotes={() => setGet5QuotesVisible(true)}
          onOpenAuthModal={() => setAuthModalVisible(true)}
          onOpenDirectPayment={(booking) => {
            setDirectPayBooking(booking);
            setDirectPayModalVisible(true);
          }}
          onLogout={handleLogout}
          onNavigateTab={(tab) => setActiveNavTab(tab)}
        />
      )}

      {/* === TAB 6: VENDOR DASHBOARD / BOOKING REQUESTS & EARNINGS === */}
      {activeNavTab === 'vendor_dashboard' && (
        <VendorDashboard
          user={currentUser}
          vendor={vendors[0] || {}}
          onOpenCalendar={() => openVendorAvailability(vendors[0] || {})}
          onOpenAuthModal={() => setAuthModalVisible(true)}
          onLogout={handleLogout}
        />
      )}

      {/* === TAB 7: SUPERADMIN CONTROL CONSOLE & FINANCIALS === */}
      {activeNavTab === 'admin_dashboard' && (
        <AdminDashboard
          user={currentUser}
          vendors={vendors}
          onUpdateVendorVerification={handleUpdateVendorVerification}
          onOpenAuthModal={() => setAuthModalVisible(true)}
          onLogout={handleLogout}
        />
      )}

      {/* === TAB 8: PENDING VENDOR SCREEN (/vendor-pending) === */}
      {activeNavTab === 'vendor_pending' && (
        <VendorPendingScreen
          user={currentUser}
          onOpenAuthModal={() => setAuthModalVisible(true)}
          onLogout={handleLogout}
          onRefreshStatus={() => {}}
        />
      )}

      {/* === TAB 9: REJECTED VENDOR SCREEN (/vendor-rejected) === */}
      {activeNavTab === 'vendor_rejected' && (
        <VendorRejectedScreen
          user={currentUser}
          onOpenAuthModal={() => setAuthModalVisible(true)}
          onLogout={handleLogout}
          onReapply={() => setBizModalVisible(true)}
        />
      )}

      {/* === TAB 10: SAFE ACCOUNT SETUP SCREEN (/account-setup) === */}
      {activeNavTab === 'account_setup' && (
        <AccountSetupScreen
          user={currentUser}
          onOpenAuthModal={() => setAuthModalVisible(true)}
          onLogout={handleLogout}
          onCompleteSetup={(profileData) => {
            handleRoleChanged(profileData.role, { ...currentUser, ...profileData });
          }}
        />
      )}
      </>
      )}

      {/* ====================================================================== */}
      {/* 6. VENDOR REGISTRATION MODAL */}
      {/* ====================================================================== */}
      {bizModalVisible && (
      <Modal visible={bizModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { fontFamily }]}>{t('register_biz_title')}</Text>
                <Text style={[styles.modalSubtitle, { fontFamily }]}>{t('register_biz_subtitle')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setBizModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.inputLabel, { fontFamily }]}>{t('biz_name_label')} *</Text>
              <TextInput
                style={[styles.input, { fontFamily }]}
                placeholder="e.g. Shree Ram Mandap Decorators"
                placeholderTextColor="#94a3b8"
                value={bizName}
                onChangeText={setBizName}
              />

              <Text style={[styles.inputLabel, { fontFamily }]}>{t('category_select_label')} *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryPickerScroll}
              >
                {SERVICE_CATEGORIES.map((cat) => {
                  const isCatSelected = bizCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.pickerChip,
                        isCatSelected && styles.pickerChipActive,
                      ]}
                      onPress={() => setBizCategory(cat.id)}
                    >
                      <Text
                        style={[
                          styles.pickerChipText,
                          isCatSelected && styles.pickerChipTextActive,
                          { fontFamily },
                        ]}
                      >
                        {cat.icon} {getCategoryTitle(cat, language)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.inputLabel, { fontFamily }]}>{t('phone_label')} *</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInputFlex]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={bizPhone}
                  onChangeText={setBizPhone}
                />
              </View>

              <Text style={[styles.inputLabel, { fontFamily }]}>{t('price_range_input_label')} *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ₹20,000 - ₹50,000 or ₹450/plate"
                placeholderTextColor="#94a3b8"
                value={bizPrice}
                onChangeText={setBizPrice}
              />

              <Text style={[styles.inputLabel, { fontFamily }]}>{t('location_address_label')} *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Station Road, Godhra"
                placeholderTextColor="#94a3b8"
                value={bizLocation}
                onChangeText={setBizLocation}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickLocScroll}>
                {POPULAR_LOCATIONS.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={styles.quickLocPill}
                    onPress={() => setBizLocation(loc)}
                  >
                    <Text style={styles.quickLocText}>+ {loc}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { fontFamily }]}>{t('instagram_label')}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. shreeji_decor_godhra"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                value={bizInstagram}
                onChangeText={setBizInstagram}
              />

              <Text style={[styles.inputLabel, { fontFamily }]}>Banner / Photo Image URL (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://... (leave empty for category default photo)"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                value={bizImage}
                onChangeText={setBizImage}
              />

              <Text style={[styles.inputLabel, { fontFamily }]}>{t('biz_description_label')}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { fontFamily }]}
                placeholder="e.g. LED Entrance, Royal Rajwadi Stage, Dry Ice Fog, Live Catering counters..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={bizDesc}
                onChangeText={setBizDesc}
              />

              <TouchableOpacity
                style={[styles.submitButton, submittingBiz && styles.disabledButton]}
                onPress={handleRegisterVendor}
                disabled={submittingBiz}
              >
                {submittingBiz ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.submitButtonText, { fontFamily }]}>{t('submit_business_btn')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      )}

      {/* ====================================================================== */}
      {/* 6. GUJARATI PROMOTIONAL POP-UP BANNER ("ઓર્ડર અપાવો અને મેળવો ₹10,000") */}
      {/* ====================================================================== */}
      {rewardPopupVisible && Boolean(currentUser) && !authModalVisible && (
      <Modal
        visible={rewardPopupVisible && Boolean(currentUser) && !authModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setRewardPopupVisible(false)}
      >
        <View style={styles.popupBackdrop}>
          <View style={styles.popupCard}>
            {/* Top Royal Festive Header */}
            <View style={styles.popupHeader}>
              <View style={styles.popupBadgeRow}>
                <View style={styles.popupOfferPill}>
                  <Text style={styles.popupOfferPillText}>🔥 ધમાકા ઓફર • પંચમહાલ</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setRewardPopupVisible(false)}
                  style={styles.popupCloseBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.popupCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.popupCrownCircle}>
                <Text style={styles.popupCrownEmoji}>👑</Text>
              </View>

              <Text style={styles.popupTitle}>ઓર્ડર અપાવો અને મેળવો</Text>
              <View style={styles.popupAmountBadge}>
                <Text style={styles.popupAmountPrefix}>રોકડ ઇનામ</Text>
                <Text style={styles.popupAmountHighlight}>₹10,000</Text>
                <Text style={styles.popupAmountSuffix}>સુધી!</Text>
              </View>
              <Text style={styles.popupSubtitle}>
                ગોધરા અને સમગ્ર પંચમહાલમાં સગા-સંબંધી કે મિત્રોના લગ્ન બુક કરાવો અને સીધા ખાતામાં મેળવો રોકડ ઇનામ!
              </Text>
            </View>

            {/* Middle Benefit Steps in Pure Gujarati */}
            <View style={styles.popupBody}>
              <View style={styles.popupStepItem}>
                <View style={styles.popupStepIconBox}>
                  <Text style={styles.popupStepIcon}>💍</Text>
                </View>
                <View style={styles.popupStepContent}>
                  <Text style={styles.popupStepTitle}>૧. લગ્નની વિગત આપો</Text>
                  <Text style={styles.popupStepDesc}>
                    તમારા સગા કે મિત્રોના લગ્ન/પ્રસંગની તારીખ અને જરૂરિયાત શેર કરો.
                  </Text>
                </View>
              </View>

              <View style={styles.popupStepItem}>
                <View style={styles.popupStepIconBox}>
                  <Text style={styles.popupStepIcon}>🎪</Text>
                </View>
                <View style={styles.popupStepContent}>
                  <Text style={styles.popupStepTitle}>૨. ગોધરાના ટોપ વેન્ડર્સ મળશે</Text>
                  <Text style={styles.popupStepDesc}>
                    મંડપ, પાર્ટી પ્લોટ, કેટરિંગ, ડીજે - 0% કમિશને બેસ્ટ રેટમાં ઉપલબ્ધ.
                  </Text>
                </View>
              </View>

              <View style={styles.popupStepItem}>
                <View style={styles.popupStepIconBox}>
                  <Text style={styles.popupStepIcon}>💰</Text>
                </View>
                <View style={styles.popupStepContent}>
                  <Text style={styles.popupStepTitle}>૩. સીધા ખાતામાં રોકડ (GPay / PhonePe)</Text>
                  <Text style={styles.popupStepDesc}>
                    ઓર્ડર કન્ફર્મ થતાં જ ₹1,000 થી ₹10,000 સીધા તમારા UPI ખાતામાં જમા!
                  </Text>
                </View>
              </View>

              {/* Trust Badges Bar */}
              <View style={styles.popupTrustBar}>
                <Text style={styles.popupTrustItem}>⚡ ઇન્સ્ટન્ટ ટ્રાન્સફર</Text>
                <Text style={styles.popupTrustDot}>•</Text>
                <Text style={styles.popupTrustItem}>🔒 100% વેરિફાઈડ</Text>
                <Text style={styles.popupTrustDot}>•</Text>
                <Text style={styles.popupTrustItem}>🤝 0% કમિશન</Text>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.popupPrimaryBtn}
                activeOpacity={0.88}
                onPress={() => {
                  setRewardPopupVisible(false);
                  setReferModalVisible(true);
                }}
              >
                <Text style={styles.popupPrimaryBtnIcon}>👉</Text>
                <Text style={styles.popupPrimaryBtnText}>હમણાં જ ઓર્ડર નોંધાવો</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.popupSecondaryBtn}
                activeOpacity={0.85}
                onPress={shareReferralViaWhatsApp}
              >
                <Text style={styles.popupSecondaryBtnIcon}>💬</Text>
                <Text style={styles.popupSecondaryBtnText}>મિત્રોને WhatsApp પર શેર કરો</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.popupDismissBtn}
                activeOpacity={0.7}
                onPress={() => setRewardPopupVisible(false)}
              >
                <Text style={styles.popupDismissBtnText}>પછી જોઈશું (બંધ કરો)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      )}

      {/* ====================================================================== */}
      {/* 7. REFER & EARN MODAL */}
      {/* ====================================================================== */}
      {referModalVisible && (
      <Modal visible={referModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <View style={styles.referRewardBadge}>
                  <Text style={styles.referRewardBadgeText}>💰 રોકડ ઇનામ ₹10,000 સુધી</Text>
                </View>
                <Text style={styles.modalTitle}>ઓર્ડર અપાવો, ઇનામ મેળવો</Text>
                <Text style={styles.modalSubtitle}>
                  ગોધરા અને પંચમહાલમાં લગ્નની વિગત આપો અને UPI/GPay દ્વારા સીધું રોકડ ઇનામ મેળવો!
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReferModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <View style={styles.stepsCard}>
                <Text style={styles.stepsTitle}>કેવી રીતે મળશે ₹10,000 સુધીનું ઇનામ?</Text>
                <Text style={styles.stepItem}>1️⃣ તમારા સગા કે મિત્રના આવનારા લગ્ન કે ઇવેન્ટની વિગત નીચે ભરો.</Text>
                <Text style={styles.stepItem}>2️⃣ અમારી ટીમ ગોધરાના બેસ્ટ વેરિફાઈડ વેન્ડર્સ સાથે 0% કમિશને બુકિંગ કરાવશે.</Text>
                <Text style={styles.stepItem}>3️⃣ ઓર્ડર ફાઇનલ થતાં જ તમારા ખાતામાં (GPay/PhonePe) રોકડ ઇનામ ટ્રાન્સફર થશે!</Text>
              </View>

              <Text style={styles.sectionHeader}>લગ્ન કે ઇવેન્ટનું આયોજન કરનારની વિગત:</Text>

              <Text style={styles.inputLabel}>પરિવાર / યજમાનનું પૂરું નામ (Client Name) *</Text>
              <TextInput
                style={styles.input}
                placeholder="દા.ત. રાજેશભાઈ પટેલ"
                placeholderTextColor="#94a3b8"
                value={refClientName}
                onChangeText={setRefClientName}
              />

              <Text style={styles.inputLabel}>મોબાઇલ નંબર (Client Mobile Number) *</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInputFlex]}
                  placeholder="10 અંકનો મોબાઇલ નંબર"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={refClientPhone}
                  onChangeText={setRefClientPhone}
                />
              </View>

              <Text style={styles.inputLabel}>લગ્નની તારીખ અને જરૂરિયાત (Mandap, Catering, Decor) *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="દા.ત. ડિસેમ્બર 20 ના રોજ વૃંદાવન પાર્ટી પ્લોટ ગોધરા. મંડપ ડેકોરેશન અને 600 માણસનું કેટરિંગ જોઈએ છે."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={refEventDetails}
                onChangeText={setRefEventDetails}
              />

              <Text style={styles.sectionHeader}>તમારી પોતાની વિગત (ઇનામ મેળવવા માટે):</Text>

              <Text style={styles.inputLabel}>તમારું પૂરું નામ (Your Name) *</Text>
              <TextInput
                style={styles.input}
                placeholder="તમારું પૂરું નામ"
                placeholderTextColor="#94a3b8"
                value={refSenderName}
                onChangeText={setRefSenderName}
              />

              <Text style={styles.inputLabel}>તમારો મોબાઇલ નંબર (GPay / PhonePe Payout) *</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInputFlex]}
                  placeholder="તમારો 10 અંકનો મોબાઇલ નંબર"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={refSenderPhone}
                  onChangeText={setRefSenderPhone}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#16a34a' }, submittingReferral && styles.disabledButton]}
                onPress={handleReferSubmit}
                disabled={submittingReferral}
              >
                {submittingReferral ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>ઓર્ડર નોંધાવો અને ઇનામ મેળવો 🎁</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      )}

      {/* ====================================================================== */}
      {/* FEATURE 1: SMART EVENT SEARCH MODAL */}
      {/* ====================================================================== */}
      <SmartSearchModal
        visible={smartSearchVisible}
        onClose={() => setSmartSearchVisible(false)}
        onApplySearch={(criteria) => setSearchFilters(criteria)}
        currentFilters={searchFilters}
        categories={CATEGORIES}
      />

      {/* ====================================================================== */}
      {/* FEATURE 2: VENDOR COMPARISON MODAL (UP TO 5 VENDORS) */}
      {/* ====================================================================== */}
      <VendorCompareModal
        visible={compareModalVisible}
        onClose={() => setCompareModalVisible(false)}
        comparedVendors={comparedVendors}
        onRemoveVendor={removeComparedVendor}
        onSendEnquiry={(vendor) => {
          setCompareModalVisible(false);
          setGet5QuotesVisible(true);
        }}
        makeCall={makeCall}
        openWhatsApp={openWhatsApp}
      />

      {/* ====================================================================== */}
      {/* FEATURE 3: VENDOR PROFILE & REAL GALLERY MODAL */}
      {/* ====================================================================== */}
      <VendorProfileModal
        visible={profileModalVisible}
        vendor={selectedProfileVendor}
        onClose={() => {
          setProfileModalVisible(false);
          setSelectedProfileVendor(null);
        }}
        makeCall={makeCall}
        openWhatsApp={openWhatsApp}
        openInstagram={openInstagram}
        onCheckAvailability={(vendor) => {
          setProfileModalVisible(false);
          openVendorAvailability(vendor);
        }}
        onBookEnquiry={(vendor, pkg) => {
          setProfileModalVisible(false);
          setGet5QuotesVisible(true);
        }}
      />

      {/* ====================================================================== */}
      {/* FEATURE 4: EVENT DATE AVAILABILITY & CALENDAR MODAL */}
      {/* ====================================================================== */}
      <VendorAvailabilityModal
        visible={availModalVisible}
        vendor={selectedAvailVendor}
        onClose={() => {
          setAvailModalVisible(false);
          setSelectedAvailVendor(null);
        }}
        onSendBookingEnquiry={(vendor, date) => {
          setAvailModalVisible(false);
          setGet5QuotesVisible(true);
        }}
      />

      {/* ====================================================================== */}
      {/* FEATURE 5: GET 5 EVENT QUOTES MODAL */}
      {/* ====================================================================== */}
      <Get5QuotesModal
        visible={get5QuotesVisible}
        onClose={() => setGet5QuotesVisible(false)}
        allVendors={vendors}
        categories={CATEGORIES}
        makeCall={makeCall}
        openWhatsApp={openWhatsApp}
      />

      {/* ====================================================================== */}
      {/* ADMIN PANEL & MODERATION MODAL */}
      {/* ====================================================================== */}
      <AdminPanelModal
        visible={adminPanelVisible}
        onClose={() => setAdminPanelVisible(false)}
        vendors={vendors}
        onUpdateVendorVerification={handleUpdateVendorVerification}
      />

      {/* ====================================================================== */}
      {/* SUPABASE RBAC AUTH & MANDATORY MOBILE OTP MODAL */}
      {/* ====================================================================== */}
      <AuthModal
        visible={authModalVisible || !currentUser}
        onClose={() => {
          if (currentUser) setAuthModalVisible(false);
        }}
        mandatory={!currentUser}
        currentRole={currentUserRole}
        currentUser={currentUser}
        onRoleChanged={handleRoleChanged}
      />

      {/* ====================================================================== */}
      {/* PURE MARKETPLACE DIRECT PAYMENT MODAL (CUSTOMER TO VENDOR) */}
      {/* ====================================================================== */}
      <CustomerDirectPaymentModal
        visible={directPayModalVisible}
        booking={directPayBooking}
        currentUser={currentUser}
        onClose={() => {
          setDirectPayModalVisible(false);
          setDirectPayBooking(null);
        }}
        onPaymentRecorded={(payment) => {
          // Direct payment recorded in memory
        }}
      />

      {/* ====================================================================== */}
      {/* FLOATING VENDOR COMPARISON BAR (Up to 5 Vendors) */}
      {/* ====================================================================== */}
      {comparedVendorIds.length > 0 && (
        <View style={styles.floatingCompareBar}>
          <View style={styles.compareBarContent}>
            <Text style={styles.compareBarIcon}>⚖️</Text>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.compareBarTitle}>
                Comparing {comparedVendorIds.length} of 5 Vendors
              </Text>
              <Text style={styles.compareBarSub}>
                Tap to compare prices, verified status & packages
              </Text>
            </View>
            <TouchableOpacity
              style={styles.compareBarViewBtn}
              activeOpacity={0.85}
              onPress={() => setCompareModalVisible(true)}
            >
              <Text style={styles.compareBarViewBtnText}>Compare Now ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ====================================================================== */}
      {/* 8. ROYAL LUXURY BOTTOM NAVIGATION BAR (ROLE-BASED SCOPED MENUS) */}
      {/* ====================================================================== */}
      <View style={styles.bottomNavContainer}>
        {currentUserRole === ROLES.ADMIN ? (
          <>
            {/* Superadmin Tab 1: Control Console */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setActiveNavTab('admin_dashboard')}
            >
              <View style={[styles.navIconBox, activeNavTab === 'admin_dashboard' && styles.navIconBoxActive]}>
                <Text style={styles.navIconText}>🛡️</Text>
              </View>
              <Text style={[styles.navLabel, activeNavTab === 'admin_dashboard' && styles.navLabelActive]}>
                Admin
              </Text>
              {activeNavTab === 'admin_dashboard' && <View style={styles.navActiveDot} />}
            </TouchableOpacity>

            {/* Superadmin Tab 2: Vendor Approvals Modal */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setAdminPanelVisible(true)}
            >
              <View style={styles.navIconBox}>
                <Text style={styles.navIconText}>🏢</Text>
              </View>
              <Text style={styles.navLabel}>Vendors</Text>
            </TouchableOpacity>

            {/* Superadmin Tab 3: Directory Preview */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setActiveNavTab('explore')}
            >
              <View style={[styles.navIconBox, activeNavTab === 'explore' && styles.navIconBoxActive]}>
                <Text style={styles.navIconText}>🎪</Text>
              </View>
              <Text style={[styles.navLabel, activeNavTab === 'explore' && styles.navLabelActive]}>
                Directory
              </Text>
              {activeNavTab === 'explore' && <View style={styles.navActiveDot} />}
            </TouchableOpacity>

            {/* Superadmin Tab 4: Quotes / Moderation */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setGet5QuotesVisible(true)}
            >
              <View style={styles.navIconBox}>
                <Text style={styles.navIconText}>📑</Text>
              </View>
              <Text style={styles.navLabel}>Quotes</Text>
            </TouchableOpacity>

            {/* Superadmin Tab 5: Logout */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={handleLogout}
            >
              <View style={styles.navIconBox}>
                <Text style={styles.navIconText}>🚪</Text>
              </View>
              <Text style={styles.navLabel}>{t('logout_btn')}</Text>
            </TouchableOpacity>
          </>
        ) : currentUserRole === ROLES.VENDOR && currentUser?.vendor_status === 'approved' ? (
          <>
            {/* Approved Vendor Tab 1: Business Dashboard */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setActiveNavTab('vendor_dashboard')}
            >
              <View style={[styles.navIconBox, activeNavTab === 'vendor_dashboard' && styles.navIconBoxActive]}>
                <Text style={styles.navIconText}>📊</Text>
              </View>
              <Text style={[styles.navLabel, activeNavTab === 'vendor_dashboard' && styles.navLabelActive]}>
                Dashboard
              </Text>
              {activeNavTab === 'vendor_dashboard' && <View style={styles.navActiveDot} />}
            </TouchableOpacity>

            {/* Approved Vendor Tab 2: Availability Calendar */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => {
                if (vendors.length > 0) openVendorAvailability(vendors[0]);
              }}
            >
              <View style={styles.navIconBox}>
                <Text style={styles.navIconText}>📅</Text>
              </View>
              <Text style={styles.navLabel}>Calendar</Text>
            </TouchableOpacity>

            {/* Approved Vendor Tab 3: Add Service / Listing */}
            <TouchableOpacity
              style={styles.navCenterItem}
              activeOpacity={0.85}
              onPress={() => setBizModalVisible(true)}
            >
              <View style={styles.navCenterFab}>
                <Text style={styles.navCenterFabIcon}>➕</Text>
              </View>
              <Text style={styles.navCenterLabel}>New Service</Text>
            </TouchableOpacity>

            {/* Approved Vendor Tab 4: Public Marketplace */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setActiveNavTab('explore')}
            >
              <View style={[styles.navIconBox, activeNavTab === 'explore' && styles.navIconBoxActive]}>
                <Text style={styles.navIconText}>🎪</Text>
              </View>
              <Text style={[styles.navLabel, activeNavTab === 'explore' && styles.navLabelActive]}>
                Directory
              </Text>
              {activeNavTab === 'explore' && <View style={styles.navActiveDot} />}
            </TouchableOpacity>

            {/* Approved Vendor Tab 5: Logout */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={handleLogout}
            >
              <View style={styles.navIconBox}>
                <Text style={styles.navIconText}>🚪</Text>
              </View>
              <Text style={styles.navLabel}>{t('logout_btn')}</Text>
            </TouchableOpacity>
          </>
        ) : currentUserRole === ROLES.VENDOR ? (
          <>
            {/* Pending or Rejected Vendor Navigation (Dashboard tools strictly hidden!) */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => {
                if (currentUser?.vendor_status === 'rejected') {
                  setActiveNavTab('vendor_rejected');
                } else {
                  setActiveNavTab('vendor_pending');
                }
              }}
            >
              <View style={[
                styles.navIconBox,
                (activeNavTab === 'vendor_pending' || activeNavTab === 'vendor_rejected') && styles.navIconBoxActive
              ]}>
                <Text style={styles.navIconText}>
                  {currentUser?.vendor_status === 'rejected' ? '❌' : '⏳'}
                </Text>
              </View>
              <Text style={[
                styles.navLabel,
                (activeNavTab === 'vendor_pending' || activeNavTab === 'vendor_rejected') && styles.navLabelActive
              ]}>
                Status
              </Text>
              {(activeNavTab === 'vendor_pending' || activeNavTab === 'vendor_rejected') && <View style={styles.navActiveDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setActiveNavTab('explore')}
            >
              <View style={[styles.navIconBox, activeNavTab === 'explore' && styles.navIconBoxActive]}>
                <Text style={styles.navIconText}>🎪</Text>
              </View>
              <Text style={[styles.navLabel, activeNavTab === 'explore' && styles.navLabelActive]}>
                Marketplace
              </Text>
              {activeNavTab === 'explore' && <View style={styles.navActiveDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCenterItem}
              activeOpacity={0.85}
              onPress={() => setBizModalVisible(true)}
            >
              <View style={styles.navCenterFab}>
                <Text style={styles.navCenterFabIcon}>📝</Text>
              </View>
              <Text style={styles.navCenterLabel}>Re-apply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setActiveNavTab('concierge')}
            >
              <View style={[styles.navIconBox, activeNavTab === 'concierge' && styles.navIconBoxActive]}>
                <Text style={styles.navIconText}>👑</Text>
              </View>
              <Text style={[styles.navLabel, activeNavTab === 'concierge' && styles.navLabelActive]}>
                Support
              </Text>
              {activeNavTab === 'concierge' && <View style={styles.navActiveDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={handleLogout}
            >
              <View style={styles.navIconBox}>
                <Text style={styles.navIconText}>🚪</Text>
              </View>
              <Text style={styles.navLabel}>{t('logout_btn')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Customer Tab 1: Explore */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setActiveNavTab('explore')}
            >
              <View style={[styles.navIconBox, activeNavTab === 'explore' && styles.navIconBoxActive]}>
                <Text style={styles.navIconText}>🎪</Text>
              </View>
              <Text style={[styles.navLabel, activeNavTab === 'explore' && styles.navLabelActive, { fontFamily }]}>
                {t('nav_explore')}
              </Text>
              {activeNavTab === 'explore' && <View style={styles.navActiveDot} />}
            </TouchableOpacity>

            {/* Customer Tab 2: Shortlist */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setActiveNavTab('shortlist')}
            >
              <View style={[styles.navIconBox, activeNavTab === 'shortlist' && styles.navIconBoxActive]}>
                <Text style={styles.navIconText}>❤️</Text>
                {savedVendorIds.length > 0 && (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>{savedVendorIds.length}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.navLabel, activeNavTab === 'shortlist' && styles.navLabelActive, { fontFamily }]}>
                {t('nav_shortlist')}
              </Text>
              {activeNavTab === 'shortlist' && <View style={styles.navActiveDot} />}
            </TouchableOpacity>

            {/* Customer Tab 3: List Biz */}
            <TouchableOpacity
              style={styles.navCenterItem}
              activeOpacity={0.85}
              onPress={() => setBizModalVisible(true)}
            >
              <View style={styles.navCenterFab}>
                <Text style={styles.navCenterFabIcon}>➕</Text>
              </View>
              <Text style={[styles.navCenterLabel, { fontFamily }]}>{t('nav_list_business')}</Text>
            </TouchableOpacity>

            {/* Customer Tab 4: My Bookings & Receipts Portal */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setActiveNavTab('customer_portal')}
            >
              <View style={[styles.navIconBox, activeNavTab === 'customer_portal' && styles.navIconBoxActive]}>
                <Text style={styles.navIconText}>📋</Text>
              </View>
              <Text style={[styles.navLabel, activeNavTab === 'customer_portal' && styles.navLabelActive, { fontFamily }]}>
                {language === 'gu' ? 'બુકિંગ્સ' : language === 'hi' ? 'बुकिंग्स' : 'Bookings'}
              </Text>
              {activeNavTab === 'customer_portal' && <View style={styles.navActiveDot} />}
            </TouchableOpacity>

            {/* Customer Tab 5: Concierge / Helpdesk */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.75}
              onPress={() => setActiveNavTab('concierge')}
            >
              <View style={[styles.navIconBox, activeNavTab === 'concierge' && styles.navIconBoxActive]}>
                <Text style={styles.navIconText}>👑</Text>
              </View>
              <Text style={[styles.navLabel, activeNavTab === 'concierge' && styles.navLabelActive, { fontFamily }]}>
                {t('nav_helpdesk')}
              </Text>
              {activeNavTab === 'concierge' && <View style={styles.navActiveDot} />}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ====================================================================== */}
      {/* 9. ANIMATED LUXURY SPLASH SCREEN OVERLAY */}
      {/* ====================================================================== */}
      {showSplash && (
        <Animated.View
          style={[styles.splashContainer, { opacity: splashFade }]}
          pointerEvents={showSplash ? 'auto' : 'none'}
        >
          <StatusBar barStyle="light-content" backgroundColor="#451a03" />

          {/* Golden Pulsing Radiant Aura */}
          <Animated.View style={[styles.splashAura, { transform: [{ scale: logoGlow }] }]} />

          {/* Majestic Royal Logo Emblem */}
          <Animated.View style={[styles.splashLogoWrapper, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.splashOuterGlowRing}>
              <View style={styles.splashEmblemRing}>
                <View style={styles.splashEmblemInnerRing}>
                  <Text style={styles.splashEmblemCrown}>👑</Text>
                  <View style={styles.splashEmblemIconsRow}>
                    <Text style={styles.splashEmblemSubIcon}>🎪</Text>
                    <Text style={styles.splashEmblemSubIconCenter}>💍</Text>
                    <Text style={styles.splashEmblemSubIcon}>🌿</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Typography & Animations */}
          <Animated.View
            style={[
              styles.splashContent,
              {
                opacity: contentFade,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <View style={styles.splashBrandPill}>
              <Text style={styles.splashBrandPillText}>✨ GUJARAT'S PREMIER WEDDING HUB ✨</Text>
            </View>

            <Text style={styles.splashMainTitle}>PANCHMAHAL</Text>
            <Text style={styles.splashSubTitle}>EVENTS HUB</Text>

            <View style={styles.splashRibbonTag}>
              <Text style={styles.splashRibbonText}>GODHRA • GUJARAT</Text>
            </View>

            {/* Category Ticker Tagline */}
            <Text style={styles.splashTicker}>
              Mandap • Party Plot • Bridal Makeup • Ghodi • DJ • Car • Palkhi • Catering
            </Text>

            {/* Animated Golden Progress Bar */}
            <View style={styles.splashProgressBarTrack}>
              <Animated.View
                style={[
                  styles.splashProgressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.splashLoadingSub}>Connecting Verified Local Vendors...</Text>
          </Animated.View>

            {/* Multilingual Selector on Welcome Screen */}
            <View style={styles.splashLangContainer}>
              <Text style={styles.splashLangHeading}>🌐 Choose Language / ભાષા પસંદ કરો / भाषा चुनें:</Text>
              <View style={styles.splashLangRow}>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <TouchableOpacity
                    key={l.code}
                    style={[
                      styles.splashLangPill,
                      language === l.code && styles.splashLangPillActive,
                    ]}
                    onPress={() => setLanguage(l.code)}
                  >
                    <Text style={styles.splashLangPillFlag}>{l.flag}</Text>
                    <Text
                      style={[
                        styles.splashLangPillText,
                        language === l.code && styles.splashLangPillTextActive,
                      ]}
                    >
                      {l.nativeName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick Enter App Button */}
            <TouchableOpacity
              style={styles.splashEnterBtn}
              activeOpacity={0.8}
              onPress={dismissSplash}
            >
              <Text style={[styles.splashEnterBtnText, { fontFamily }]}>
                {language === 'gu' ? 'એપ્લિકેશનમાં પ્રવેશ કરો →' : language === 'hi' ? 'ऐप में प्रवेश करें →' : 'Enter App Now →'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ====================================================================== */}
        {/* MULTILINGUAL LANGUAGE SELECTION MODAL */}
        {/* ====================================================================== */}
        <LanguageSelectorModal
          visible={langModalVisible}
          onClose={() => setLangModalVisible(false)}
        />
      </SafeAreaView>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}

// ==============================================================================
// 5. STYLESHEET (Tailwind-inspired Clean, Festive & Visual Layout)
// ==============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // ---------------- RBAC TOP BAR & USER IDENTITY ----------------
  rbacTopBar: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rbacUserIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  rbacRoleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginRight: 6,
  },
  rbacBadgeAdmin: {
    backgroundColor: '#ef4444',
  },
  rbacBadgePending: {
    backgroundColor: '#d97706',
  },
  rbacBadgeRejected: {
    backgroundColor: '#dc2626',
  },
  rbacBadgeVendor: {
    backgroundColor: '#2563eb',
  },
  rbacBadgeCustomer: {
    backgroundColor: '#10b981',
  },
  rbacRoleBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rbacUserName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  rbacLogoutBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  rbacLogoutBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#b91c1c',
  },
  rbacLoginBtn: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  rbacLoginBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400e',
  },

  // ---------------- HEADER WITH LOGO ----------------
  header: {
    backgroundColor: '#78350f', // Deep Royal Amber
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 28 : 8,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  headerBrandContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoEmblem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#b45309',
    borderWidth: 2,
    borderColor: '#fef08a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#fef08a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLogoEmoji: {
    fontSize: 15,
  },
  headerTextGroup: {
    flex: 1,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  hubBadge: {
    backgroundColor: '#fef08a',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    marginLeft: 5,
  },
  hubBadgeText: {
    color: '#78350f',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 5,
  },
  headerLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 3,
  },
  headerLiveText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 9.5,
    color: '#fef3c7',
    marginTop: 0.5,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  registerBtnText: {
    color: '#78350f',
    fontWeight: '800',
    fontSize: 11,
  },

  // ---------------- TOP 3 SLIDER BANNERS ----------------
  exploreListHeader: {
    marginBottom: 4,
  },
  sliderContainer: {
    marginTop: 3,
    marginBottom: 0,
  },
  sliderContent: {
    paddingHorizontal: 10,
  },
  sliderCard: {
    height: 66,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  sliderCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  sliderCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
  },
  sliderCardBody: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'space-between',
  },
  sliderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderTagBadge: {
    backgroundColor: '#d97706',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  sliderTagText: {
    color: '#ffffff',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sliderFeatureBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  sliderFeatureBadgeText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '800',
  },
  sliderTextGroup: {
    marginVertical: 0,
  },
  sliderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sliderSubtitle: {
    fontSize: 8.5,
    color: '#fef3c7',
    lineHeight: 11,
    marginTop: 1,
    fontWeight: '500',
  },
  sliderBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderActionBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  sliderActionBtnText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  sliderTapHint: {
    color: '#f1f5f9',
    fontSize: 7.5,
    fontWeight: '500',
  },
  sliderDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  sliderDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 2,
  },
  sliderDotActive: {
    width: 12,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#d97706',
  },

  // ---------------- SEARCH BAR ----------------
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 3,
    paddingBottom: 3,
    gap: 6,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    color: '#0f172a',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 3,
  },
  clearSearchText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // ---------------- CATEGORY TABS ----------------
  tabsContainer: {
    paddingVertical: 2,
  },
  scrollTabs: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 10,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeTab: {
    backgroundColor: '#d97706',
    borderColor: '#b45309',
  },
  tabIcon: {
    fontSize: 11,
    marginRight: 3,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabSubText: {
    fontSize: 7,
    color: '#64748b',
  },
  activeTabSubText: {
    color: '#fef3c7',
  },

  // ---------------- VENDOR CARDS ----------------
  exploreControlsWrapper: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 90,
  },
  listContentDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardGridItem: {
    flex: 1,
    marginHorizontal: 6,
  },
  enquireCardBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  enquireCardBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11.5,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 128,
    backgroundColor: '#e2e8f0',
  },
  cardBannerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayBadges: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryBadgeText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '800',
  },
  ratingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e293b',
  },
  cardBody: {
    padding: 10,
  },
  businessName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginRight: 8,
  },
  verifiedTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
  },
  distancePillBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 5,
  },
  distancePillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  emptyRadiusActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  expandRadiusPillBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  expandRadiusPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 10.5,
    color: '#92400e',
    fontWeight: '600',
    marginRight: 6,
  },
  priceValue: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '800',
  },
  instagramBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#fbcfe8',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  instaBadgeIcon: {
    marginRight: 6,
    fontSize: 13,
  },
  instaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#db2777',
  },
  instaBadgeArrow: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#be185d',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  callButton: {
    flex: 1.1,
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  callButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11.5,
  },
  waButton: {
    flex: 1.1,
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  waButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11.5,
  },
  instaButton: {
    backgroundColor: '#db2777',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#db2777',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  instaButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },

  // ---------------- EMPTY & LOADING STATES ----------------
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  emptyActionBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },

  // ---------------- MODALS ----------------
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  closeModalText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: 'bold',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
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
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeBadge: {
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  phoneInputFlex: {
    flex: 1,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  categoryPickerScroll: {
    marginBottom: 6,
  },
  pickerChip: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pickerChipActive: {
    backgroundColor: '#d97706',
    borderColor: '#b45309',
  },
  pickerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pickerChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  quickLocScroll: {
    marginTop: 6,
    marginBottom: 4,
  },
  quickLocPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
  },
  quickLocText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#d97706',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.65,
  },
  referRewardBadge: {
    backgroundColor: '#16a34a',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  referRewardBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  stepsCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  stepsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 6,
  },
  stepItem: {
    fontSize: 11,
    color: '#15803d',
    lineHeight: 16,
    marginBottom: 3,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
  },

  // ---------------- ANIMATED SPLASH SCREEN OVERLAY ----------------
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#451a03', // Royal Deep Maroon
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
    paddingHorizontal: 24,
  },
  splashAura: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#b45309',
    opacity: 0.35,
  },
  splashLogoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashOuterGlowRing: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.3)',
  },
  splashEmblemRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fef08a',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#78350f',
  },
  splashEmblemInnerRing: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: '#92400e',
    borderWidth: 2,
    borderColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashEmblemCrown: {
    fontSize: 28,
    marginBottom: -4,
  },
  splashEmblemIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splashEmblemSubIcon: {
    fontSize: 16,
  },
  splashEmblemSubIconCenter: {
    fontSize: 20,
    marginHorizontal: 3,
  },
  splashContent: {
    alignItems: 'center',
    width: '100%',
  },
  splashBrandPill: {
    backgroundColor: 'rgba(254, 243, 199, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.4)',
    marginBottom: 10,
  },
  splashBrandPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fef08a',
    letterSpacing: 1.5,
  },
  splashMainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  splashSubTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fde047',
    letterSpacing: 6,
    marginTop: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  splashRibbonTag: {
    backgroundColor: '#290c02',
    borderWidth: 1.5,
    borderColor: '#fef08a',
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 14,
  },
  splashRibbonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fef08a',
    letterSpacing: 2,
  },
  splashTicker: {
    fontSize: 11,
    color: '#fed7aa',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
    fontWeight: '600',
    marginBottom: 24,
  },
  splashProgressBarTrack: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  splashProgressBarFill: {
    height: '100%',
    backgroundColor: '#fef08a',
    borderRadius: 2,
  },
  splashLoadingText: {
    fontSize: 11,
    color: '#fed7aa',
    fontWeight: '600',
  },
  splashLoadingSub: {
    fontSize: 11,
    color: '#fde68a',
    fontWeight: '600',
  },
  splashSkipBtn: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.35)',
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  splashSkipText: {
    color: '#fef08a',
    fontWeight: '800',
    fontSize: 12,
  },
  splashEnterBtn: {
    position: 'absolute',
    bottom: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.4)',
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  splashEnterBtnText: {
    color: '#fef08a',
    fontWeight: '800',
    fontSize: 12,
  },
  splashLangContainer: {
    marginTop: 14,
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
  },
  splashLangHeading: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  splashLangRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  splashLangPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(254, 240, 138, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  splashLangPillActive: {
    backgroundColor: '#fef08a',
    borderColor: '#ffffff',
  },
  splashLangPillFlag: {
    fontSize: 14,
  },
  splashLangPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  splashLangPillTextActive: {
    color: '#451a03',
  },

  // ---------------- TAB CONTENT WRAPPERS ----------------
  tabContentWrapper: {
    flex: 1,
    paddingTop: 2,
  },
  scrollScreenContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 90,
  },

  // ---------------- VENDOR CARD SAVE HEART ----------------
  saveHeartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  saveHeartBtnActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
  },
  saveHeartIcon: {
    fontSize: 18,
  },

  // ---------------- SHORTLIST SCREEN ----------------
  shortlistHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 10,
  },
  shortlistTitleGroup: {
    flex: 1,
  },
  shortlistTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortlistHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#78350f',
  },
  shortlistCountPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  shortlistCountPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  shortlistSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  shareShortlistBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  shareShortlistBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyShortlistCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 40,
  },
  emptyShortlistIcon: {
    fontSize: 56,
    marginBottom: 14,
  },
  emptyShortlistTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyShortlistDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 320,
  },
  exploreVendorsBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
  },
  exploreVendorsBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  // ---------------- REWARDS SCREEN ----------------
  rewardsHeroCard: {
    backgroundColor: '#78350f',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b45309',
    elevation: 4,
    shadowColor: '#78350f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
  },
  rewardsCrownBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 10,
  },
  rewardsCrownText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rewardsHeroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 26,
  },
  rewardsHeroSub: {
    fontSize: 13,
    color: '#fef3c7',
    lineHeight: 18,
    marginBottom: 14,
  },
  rewardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rewardStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  rewardStatNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fef3c7',
    marginBottom: 2,
  },
  rewardStatLabel: {
    fontSize: 11,
    color: '#fde68a',
    fontWeight: '600',
  },
  rewardsActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardsPrimaryBtn: {
    flex: 1,
    backgroundColor: '#d97706',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  rewardsWaBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsWaBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 14,
  },
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  guideStepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  guideStepNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#b45309',
  },
  guideStepTextGroup: {
    flex: 1,
  },
  guideStepHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  guideStepDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  socialProofCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
  },
  socialProofTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  payoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  payoutEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutPerson: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  payoutDetails: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  payoutBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  // ---------------- CONCIERGE & HELPDESK SCREEN ----------------
  conciergeHeroCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 4,
  },
  conciergeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 10,
  },
  conciergeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  conciergeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 26,
  },
  conciergeSub: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 16,
  },
  conciergeContactButtons: {
    gap: 10,
  },
  conciergeCallBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  conciergeCallBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  conciergeWaBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  conciergeWaBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  guaranteeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  guaranteeCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
  },
  guaranteeIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  guaranteeHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  guaranteeText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  faqSection: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
  },
  faqMainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 14,
  },
  faqCard: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350f',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  conciergeFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  conciergeFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  conciergeFooterSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
  },

  // ---------------- BOTTOM NAVIGATION BAR ----------------
  bottomNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 3,
    paddingBottom: Platform.OS === 'ios' ? 14 : 4,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navIconBox: {
    position: 'relative',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconBoxActive: {
    backgroundColor: '#fef3c7',
  },
  navIconText: {
    fontSize: 16,
  },
  navLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  navLabelActive: {
    color: '#b45309',
    fontWeight: '800',
  },
  navActiveDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#d97706',
    marginTop: 1,
  },
  navBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2.5,
  },
  navBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
  },
  navRewardBadge: {
    position: 'absolute',
    top: -3,
    right: -7,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
  },
  navRewardBadgeText: {
    color: '#ffffff',
    fontSize: 7.5,
    fontWeight: '900',
  },
  navCenterItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
  },
  navCenterFab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    elevation: 6,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  navCenterFabIcon: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '900',
  },
  navCenterLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#b45309',
    marginTop: 1,
  },

  // ----------------------------------------------------------------------------
  // REWARDS TAB EXTRA BANNER PILL
  // ----------------------------------------------------------------------------
  rewardsOfferPillBtn: {
    marginTop: 10,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsOfferPillText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  // ----------------------------------------------------------------------------
  // GUJARATI PROMOTIONAL POP-UP BANNER STYLES ("ઓર્ડર અપાવો અને મેળવો ₹10,000")
  // ----------------------------------------------------------------------------
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  popupCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  popupHeader: {
    backgroundColor: '#78350f',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#b45309',
  },
  popupBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  popupOfferPill: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  popupOfferPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  popupCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCloseText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  popupCrownCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#f59e0b',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  popupCrownEmoji: {
    fontSize: 28,
  },
  popupTitle: {
    color: '#fef3c7',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  popupAmountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#fef3c7',
  },
  popupAmountPrefix: {
    color: '#78350f',
    fontSize: 12.5,
    fontWeight: '800',
    marginRight: 6,
  },
  popupAmountHighlight: {
    color: '#78350f',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  popupAmountSuffix: {
    color: '#78350f',
    fontSize: 12.5,
    fontWeight: '800',
    marginLeft: 4,
  },
  popupSubtitle: {
    color: '#fde68a',
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    fontWeight: '500',
  },
  popupBody: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  popupStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  popupStepIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fde047',
  },
  popupStepIcon: {
    fontSize: 16,
  },
  popupStepContent: {
    flex: 1,
  },
  popupStepTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#78350f',
    marginBottom: 2,
  },
  popupStepDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  popupTrustBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  popupTrustItem: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16a34a',
  },
  popupTrustDot: {
    fontSize: 10,
    color: '#94a3b8',
    marginHorizontal: 6,
  },
  popupPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    marginBottom: 8,
  },
  popupPrimaryBtnIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  popupPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  popupSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25d366',
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 8,
  },
  popupSecondaryBtnIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  popupSecondaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  popupDismissBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  popupDismissBtnText: {
    color: '#64748b',
    fontSize: 11.5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // ----------------------------------------------------------------------------
  // STYLES FOR 5 MAJOR MARKETPLACE FEATURES
  // ----------------------------------------------------------------------------
  cardFloatingActions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardCompareBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    elevation: 3,
  },
  cardCompareBtnActive: {
    backgroundColor: '#d97706',
    borderColor: '#b45309',
  },
  cardCompareBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#334155',
  },
  cardCompareBtnTextActive: {
    color: '#ffffff',
  },
  cardQuickRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  cardQuickAvailBtn: {
    flex: 1,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  cardQuickAvailText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  cardQuickProfileBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  cardQuickProfileText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  heroActionBanner: {
    marginHorizontal: 10,
    marginTop: 3,
    marginBottom: 3,
  },
  getQuotesHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#78350f',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    elevation: 2,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  getQuotesLeft: {
    flex: 1,
    marginRight: 6,
  },
  getQuotesTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#dc2626',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginBottom: 0,
  },
  getQuotesBadge: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  getQuotesTitle: {
    color: '#fef3c7',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  getQuotesSub: {
    color: '#fde68a',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
  },
  getQuotesArrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  getQuotesArrowText: {
    color: '#78350f',
    fontSize: 12,
    fontWeight: '900',
  },
  smartSearchTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 8,
    marginLeft: 0,
    height: 32,
  },
  smartSearchTriggerBtnActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#d97706',
  },
  smartSearchTriggerIcon: {
    fontSize: 12,
    marginRight: 3,
  },
  smartSearchTriggerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  activeFilterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  activeFilterText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  clearFiltersBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  clearFiltersText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  adminAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 14,
    marginBottom: 10,
  },
  adminAccessIcon: {
    fontSize: 24,
  },
  adminAccessTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#991b1b',
  },
  adminAccessSub: {
    fontSize: 10.5,
    color: '#b91c1c',
    marginTop: 2,
  },
  adminAccessArrow: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991b1b',
    marginLeft: 6,
  },
  floatingCompareBar: {
    position: 'absolute',
    bottom: 60,
    left: 12,
    right: 12,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 10,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  compareBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compareBarIcon: {
    fontSize: 22,
  },
  compareBarTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  compareBarSub: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  compareBarViewBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  compareBarViewBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
});
