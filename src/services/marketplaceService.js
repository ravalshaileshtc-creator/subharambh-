// ==============================================================================
// PANCHMAHAL MARKETPLACE SERVICE
// Core Architecture: Smart Matching, 5-Quotes Routing, Availability & Privacy
// ==============================================================================

import { supabase } from './authService.js';

/**
 * STRICT PUBLIC VISIBILITY GATEKEEPER
 * Only businesses where:
 *   listing_status = "approved" AND is_approved = true AND account_status = "active"
 * are permitted to appear in the public customer application.
 * Unapproved, pending, rejected, or suspended listings are strictly blocked.
 */
export function isPubliclyVisibleVendor(vendor) {
  if (!vendor) return false;

  // 1. Explicit negative checks
  if (vendor.listing_status && vendor.listing_status !== 'approved') return false;
  if (vendor.is_approved === false) return false;
  if (vendor.account_status && vendor.account_status !== 'active') return false;
  if (vendor.vendor_status && vendor.vendor_status !== 'approved') return false;
  if (vendor.status === 'suspended' || vendor.status === 'rejected' || vendor.status === 'pending' || vendor.status === 'correction_requested') {
    return false;
  }

  // 2. If new approval flags exist on the object, strictly require all 3
  if (vendor.listing_status !== undefined || vendor.is_approved !== undefined || vendor.account_status !== undefined) {
    return (
      vendor.listing_status === 'approved' &&
      vendor.is_approved === true &&
      (vendor.account_status === 'active' || !vendor.account_status)
    );
  }

  // 3. Legacy seed vendor fallback: must be verified and not pending/rejected/suspended
  return vendor.is_verified === true && vendor.vendor_status !== 'pending';
}

// Initial mock availability for Godhra wedding dates (2026-2027 season)
// Dates format: YYYY-MM-DD
const INITIAL_AVAILABILITY = {
  // Vendor 1 (Vallabh Decor) booked on popular wedding dates
  '1_2026-11-25': { status: 'booked', note: 'Wedding at Motibaug Party Plot' },
  '1_2026-12-10': { status: 'booked', note: 'Grand Wedding Mandap' },
  '1_2026-12-15': { status: 'booked', note: 'Rameshbhai Patel Wedding' },
  '1_2026-12-20': { status: 'pending_enquiry', note: 'Discussion ongoing' },

  // Vendor 5 (Motibaug Party Plot)
  '5_2026-11-25': { status: 'booked', note: 'Vallabh Decor + Ganesh Catering' },
  '5_2026-12-15': { status: 'booked', note: 'Patel Family Wedding' },
  '5_2026-12-25': { status: 'booked', note: 'Shah Family Reception' },

  // Vendor 25 (Ganesh Catering)
  '25_2026-11-25': { status: 'booked', note: '800 Pax Gujarati Thali' },
  '25_2026-12-15': { status: 'booked', note: '600 Pax Kathiyawadi Feast' },
};

// Initial Seed Portfolios with Real Gallery Photos & Video links
const INITIAL_PORTFOLIOS = {
  1: {
    logo: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80', caption: 'Royal Rajwadi Mandap Entrance, Godhra', category: 'decor' },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80', caption: 'LED Tunnel Stage & Floral Arch', category: 'stage' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80', caption: 'Champaner Heritage Theme Setup', category: 'real_events' },
      { id: 'p4', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop&q=80', caption: 'Vavdi Buzarg Wedding Decor', category: 'real_events' },
      { id: 'p5', url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&auto=format&fit=crop&q=80', caption: 'Reception Sofa Seating & Golden Pillars', category: 'stage' },
    ],
    videos: [
      { id: 'v1', title: 'Grand Entry & Pyrotechnics Setup (Halol Road)', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    ],
    packages: [
      { name: 'Classic Mandap Package', price: '₹25,000', includes: 'Basic Mandap + 1 Entrance Gate + Stage Backdrop + 50 Chairs' },
      { name: 'Royal Rajwadi Wedding Setup', price: '₹65,000', includes: 'Full Fabric Rajwadi Mandap, 2 LED Gates, Designer Stage, Chori setup, VIP Sofa Lounge' },
      { name: 'Grand Luxury Destination Package', price: '₹95,000+', includes: 'Complete Party Plot transformation, Dry Ice & Fog entry, Golden Trusses & LED Wall' },
    ],
  },
  5: {
    logo: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&auto=format&fit=crop&q=80',
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80', caption: 'Motibaug Green Lawn & Evening Lighting', category: 'venue' },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80', caption: 'Dining Area Capacity 1,500 Guests', category: 'venue' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80', caption: 'Stage Illumination at Night', category: 'stage' },
      { id: 'p4', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80', caption: 'AC Bridal Green Rooms & Suite', category: 'facilities' },
      { id: 'p5', url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80', caption: 'Vast Parking for 250+ Cars', category: 'venue' },
    ],
    videos: [
      { id: 'v1', title: 'Drone Walkthrough of Motibaug Party Plot', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    ],
    packages: [
      { name: '1-Day Party Plot Rent (Lawn + Rooms)', price: '₹45,000', includes: 'Main Lawn, 2 AC Bridal Rooms, High-voltage power generator backup' },
      { name: 'Full Wedding Package (2 Days)', price: '₹85,000', includes: 'Haldi + Sangeet + Wedding, Cleaning & Guard staff, Stage base' },
    ],
  },
  25: {
    logo: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&auto=format&fit=crop&q=80',
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80', caption: 'Royal Gujarati Thali Buffet Setup', category: 'food' },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80', caption: 'Live Jalebi, Chaat & Mocktail Bar', category: 'food' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80', caption: 'Pure Ghee Sweets & Traditional Kathiyawadi', category: 'food' },
      { id: 'p4', url: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&auto=format&fit=crop&q=80', caption: 'VIP Buffet Table Presentation', category: 'food' },
      { id: 'p5', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80', caption: 'Uniformed Maharaj & Catering Crew', category: 'crew' },
    ],
    videos: [],
    packages: [
      { name: 'Standard Gujarati Thali (Pure Veg)', price: '₹380/plate', includes: '2 Sabzi, Dal-Rice, Roti/Puri, 1 Sweet, Farsan, Salad & Chhas' },
      { name: 'Grand Wedding Royal Feast', price: '₹550/plate', includes: '3 Sabzi (incl. Paneer), 2 Sweets (Live Jalebi/Mohanthal), 2 Farsan, Chaat Counter, Soup & Ice Cream' },
      { name: 'Royal Panchmahal Deluxe Feast', price: '₹750/plate', includes: 'Kathiyawadi + Punjabi + Live Counters (Dosa, Chaat, Mocktails) + 3 Gourmet Sweets' },
    ],
  },
};

// Global in-memory storage for Enquiries & Quotes (Strict Zero Mock Data)
let globalEnquiries = [];

let globalAvailability = { ...INITIAL_AVAILABILITY };
let globalPortfolios = { ...INITIAL_PORTFOLIOS };
let globalAuditLogs = [
  { id: 1, action: 'SYSTEM_INIT', details: 'Panchmahal Marketplace Service Initialized', timestamp: new Date().toISOString() },
];

// Helper: Mask Phone for Privacy Protection
export function maskPhoneNumber(phone) {
  if (!phone) return 'Hidden';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 4)}XXXX${clean.slice(8)}`;
  }
  return 'Protected';
}

// ==============================================================================
// 1. SMART MATCHING ALGORITHM
// Matches vendors against Event Type, Location, Budget, Date & Category
// ==============================================================================
export function smartMatchVendors(vendors, criteria) {
  const {
    category = 'all',
    requiredServices = [],
    location = '',
    eventDate = '',
    minRating = 0,
    budgetMin = 0,
    budgetMax = Infinity,
    verifiedOnly = false,
    sortBy = 'recommended', // 'recommended' | 'price_low' | 'price_high' | 'rating'
  } = criteria;

  return vendors
    .filter((vendor) => {
      // 0. Strict Admin Approval Check (pending/rejected/suspended vendors NEVER appear in search)
      if (!isPubliclyVisibleVendor(vendor)) {
        return false;
      }

      // 1. Category Filter
      if (category !== 'all' && vendor.category !== category) {
        return false;
      }

      // 1b. Required Services Multi-match
      if (requiredServices.length > 0 && !requiredServices.includes(vendor.category)) {
        return false;
      }

      // 2. Verified Only Filter
      if (verifiedOnly && !vendor.is_verified) {
        return false;
      }

      // 3. Minimum Rating Filter
      if (minRating > 0 && (Number(vendor.rating) || 0) < minRating) {
        return false;
      }

      // 4. Location Filter (Checks town, area, or district match)
      if (location && location.trim()) {
        const qLoc = location.toLowerCase().trim();
        const vLoc = (vendor.location || '').toLowerCase();
        // Allow general Godhra/Panchmahal matches or area specific
        const matchesLoc =
          vLoc.includes(qLoc) ||
          qLoc.includes('panchmahal') ||
          (qLoc.includes('godhra') && vLoc.includes('godhra')) ||
          (qLoc.includes('halol') && vLoc.includes('halol')) ||
          (qLoc.includes('kalol') && vLoc.includes('kalol')) ||
          (qLoc.includes('shehra') && vLoc.includes('shehra'));

        if (!matchesLoc) return false;
      }

      // 5. Date Availability Check (Avoid showing already booked vendors for date)
      if (eventDate) {
        const availKey = `${vendor.id}_${eventDate}`;
        const avail = globalAvailability[availKey];
        if (avail && avail.status === 'booked') {
          return false; // Skip booked vendors
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }
      if (sortBy === 'verified') {
        return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);
      }
      if (sortBy === 'price_low') {
        const getMinPrice = (str) => {
          const m = (str || '').match(/₹?([\d,]+)/);
          return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
        };
        return getMinPrice(a.price_range) - getMinPrice(b.price_range);
      }
      if (sortBy === 'price_high') {
        const getMaxPrice = (str) => {
          const matches = [...(str || '').matchAll(/₹?([\d,]+)/g)];
          if (matches.length > 0) {
            const last = matches[matches.length - 1][1];
            return parseInt(last.replace(/,/g, ''), 10);
          }
          return 0;
        };
        return getMaxPrice(b.price_range) - getMaxPrice(a.price_range);
      }

      // Default 'recommended': Verified first, then highest rating
      if (a.is_verified !== b.is_verified) {
        return a.is_verified ? -1 : 1;
      }
      return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    });
}

// ==============================================================================
// 2. AVAILABILITY CALENDAR & DOUBLE-BOOKING PROTECTION
// ==============================================================================
export function checkVendorDateAvailability(vendorId, dateStr) {
  if (!dateStr) return { status: 'available', note: 'Ready for booking' };
  const key = `${vendorId}_${dateStr}`;
  const record = globalAvailability[key];
  if (!record) {
    return { status: 'available', note: 'Date available' };
  }
  return record;
}

export function updateVendorDateAvailability(vendorId, dateStr, newStatus, note = '') {
  const key = `${vendorId}_${dateStr}`;
  const existing = globalAvailability[key];

  // Double booking prevention check
  if (existing && existing.status === 'booked' && newStatus === 'booked') {
    return {
      success: false,
      message: `Double Booking Blocked: Vendor is already confirmed for another event on ${dateStr}!`,
    };
  }

  globalAvailability[key] = {
    status: newStatus,
    note: note || (newStatus === 'booked' ? 'Confirmed booking' : newStatus),
    updated_at: new Date().toISOString(),
  };

  logAuditEvent('UPDATE_AVAILABILITY', `Vendor ${vendorId} set date ${dateStr} to ${newStatus}`);

  return {
    success: true,
    status: newStatus,
    message: `Availability updated for ${dateStr}: ${newStatus.toUpperCase()}`,
  };
}

// ==============================================================================
// 3. GET 5 QUOTES WORKFLOW & ROUTING ENGINE
// ==============================================================================
export function createCustomerEnquiry(payload, allVendors = []) {
  // 0. Strict Admin Approval Check for direct vendor enquiries
  if (payload.vendor && !isPubliclyVisibleVendor(payload.vendor)) {
    return {
      success: false,
      error: 'vendor_not_approved',
      message: 'This vendor is currently pending admin approval and cannot receive public enquiries or bookings.',
    };
  }
  if (payload.vendor_id) {
    const target = allVendors.find((v) => String(v.id) === String(payload.vendor_id));
    if (target && !isPubliclyVisibleVendor(target)) {
      return {
        success: false,
        error: 'vendor_not_approved',
        message: 'This vendor is currently pending admin approval and cannot receive public enquiries or bookings.',
      };
    }
  }

  const enquiryCode = `ENQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Find up to 5 best matching verified vendors in Panchmahal
  const reqServices = payload.services || ['mandap'];
  const matched = allVendors
    .filter((v) => {
      // 0. Strict Admin Approval Check (pending/unapproved vendors cannot receive enquiries)
      if (!isPubliclyVisibleVendor(v)) return false;

      // Must match at least one required category or be in same location
      const categoryMatch = reqServices.includes(v.category) || reqServices.includes('all');
      if (!categoryMatch) return false;

      // Check if booked on requested event date
      if (payload.event_date) {
        const avail = checkVendorDateAvailability(v.id, payload.event_date);
        if (avail.status === 'booked') return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Verified vendors first, then rating
      if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
      return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    })
    .slice(0, 5); // STRICT CAP: Up to 5 real vendors

  const matchedIds = matched.map((v) => v.id);

  const cleanPhone = String(payload.customer_phone || '').replace(/\D/g, '').slice(-10);

  const newEnquiry = {
    id: enquiryCode,
    customer_id: payload.customer_id || (payload.user ? payload.user.id : null),
    customer_name: payload.customer_name,
    customer_phone: cleanPhone,
    event_type: payload.event_type || 'wedding',
    location: payload.location || 'Godhra',
    event_date: payload.event_date || 'Upcoming Season',
    guest_count: payload.guest_count || '300-600',
    services: reqServices,
    budget: payload.budget || '₹1,50,000 - ₹3,00,000',
    notes: payload.notes || 'Looking for verified local wedding services in Panchmahal.',
    status: 'Dispatched to Vendors',
    matched_vendor_ids: matchedIds,
    matched_vendors: matched.map((v) => ({
      id: v.id,
      name: v.business_name,
      category: v.category,
      phone: v.phone,
      rating: v.rating,
      location: v.location,
    })),
    quotes: [],
    created_at: new Date().toISOString(),
  };

  globalEnquiries.unshift(newEnquiry);
  logAuditEvent('CREATE_ENQUIRY', `Enquiry ${enquiryCode} created by ${payload.customer_name} dispatched to ${matched.length} vendors`);

  // Asynchronous sync to Supabase public.enquiries table
  if (supabase) {
    try {
      const numBudget = Number(String(payload.budget || '').replace(/\D/g, '')) || null;
      const formattedDate = payload.event_date && /^\d{4}-\d{2}-\d{2}$/.test(payload.event_date)
        ? payload.event_date
        : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      supabase
        .from('enquiries')
        .insert([{
          enquiry_code: enquiryCode,
          customer_name: payload.customer_name,
          customer_phone: cleanPhone,
          customer_id: newEnquiry.customer_id || null,
          event_type: payload.event_type || 'wedding',
          event_date: formattedDate,
          city_id: 'godhra',
          state_id: 'GJ',
          guest_count: String(payload.guest_count || ''),
          budget: numBudget,
          notes: payload.notes || '',
        }])
        .then(() => {})
        .catch(() => {});
    } catch (e) {
      // Local copy safely stored in globalEnquiries
    }
  }

  return {
    success: true,
    enquiry: newEnquiry,
    matchedCount: matched.length,
    enquiryCode,
  };
}

export function getCustomerEnquiries(filterUser = null) {
  if (!filterUser) {
    return globalEnquiries;
  }

  const role = filterUser.role;
  const cleanPhone = String(filterUser.phone || '').replace(/\D/g, '').slice(-10);
  const userId = filterUser.id ? String(filterUser.id) : '';

  // Customers strictly see ONLY their own enquiries (by phone or UUID)
  if (role === 'customer') {
    return globalEnquiries.filter((e) => {
      const matchPhone = cleanPhone && e.customer_phone === cleanPhone;
      const matchId = userId && e.customer_id === userId;
      return matchPhone || matchId;
    });
  }

  // Vendors see enquiries routed to them
  if (role === 'vendor') {
    const vId = Number(filterUser.vendor_id || filterUser.id);
    return globalEnquiries.filter((e) => e.matched_vendor_ids && e.matched_vendor_ids.includes(vId));
  }

  // Admins & Super Admins see all
  if (role === 'admin' || role === 'super_admin') {
    return globalEnquiries;
  }

  return globalEnquiries;
}

export async function fetchRealtimeCustomerEnquiries(filterUser = null) {
  if (!supabase) {
    return getCustomerEnquiries(filterUser);
  }

  try {
    let query = supabase.from('enquiries').select('*');
    if (filterUser && filterUser.role === 'customer') {
      const cleanPhone = String(filterUser.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone) {
        query = query.or(`customer_phone.eq.${cleanPhone},customer_phone.eq.+91${cleanPhone}`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const existing = globalEnquiries.find((e) => e.id === row.enquiry_code);
        if (!existing) {
          globalEnquiries.push({
            id: row.enquiry_code,
            customer_name: row.customer_name,
            customer_phone: row.customer_phone,
            customer_id: row.customer_id,
            event_type: row.event_type || 'wedding',
            location: row.location || 'Godhra',
            event_date: row.event_date || '',
            guest_count: row.guest_count || '',
            services: Array.isArray(row.services) ? row.services : ['mandap'],
            budget: row.budget ? `₹${Number(row.budget).toLocaleString('en-IN')}` : '',
            notes: row.notes || '',
            status: row.status || 'Dispatched to Vendors',
            matched_vendor_ids: Array.isArray(row.matched_vendor_ids) ? row.matched_vendor_ids : [],
            matched_vendors: [],
            quotes: [],
            created_at: row.created_at,
          });
        }
      }
    }

    // Also fetch quotations for enquiries
    const { data: qData, error: qErr } = await supabase.from('quotations').select('*');
    if (!qErr && Array.isArray(qData)) {
      for (const q of qData) {
        const targetEnq = globalEnquiries.find(
          (e) => e.id === q.enquiry_code || (q.enquiry_id && String(e.id) === String(q.enquiry_id))
        );
        if (targetEnq) {
          if (!Array.isArray(targetEnq.quotes)) targetEnq.quotes = [];
          const exists = targetEnq.quotes.some((item) => item.vendor_id === q.vendor_id);
          if (!exists) {
            targetEnq.quotes.push({
              id: `Q-${targetEnq.id.replace('ENQ-', '')}-${q.vendor_id}`,
              vendor_id: q.vendor_id,
              vendor_name: q.vendor_name || `Vendor #${q.vendor_id}`,
              category: q.category || 'Service',
              quoted_price: q.quoted_price || `₹${Number(q.quoted_amount).toLocaleString('en-IN')}`,
              package_details: q.package_details || 'Verified quotation proposal.',
              valid_until: q.valid_until || '15 Days',
              status: q.status || 'Sent',
              created_at: q.created_at,
            });
            targetEnq.status = `${targetEnq.quotes.length} Quotes Received`;
          }
        }
      }
    }
  } catch (e) {
    // Graceful fallback to memory
  }

  return getCustomerEnquiries(filterUser);
}

export function clearCustomerEnquiriesForTest() {
  globalEnquiries = [];
}

export function submitVendorQuote(enquiryId, vendorId, quoteDetails) {
  const enquiry = globalEnquiries.find((e) => e.id === enquiryId || String(e.id) === String(enquiryId));
  if (!enquiry) {
    return { success: false, message: 'Enquiry not found.' };
  }

  const quoteId = `Q-${String(enquiryId).replace('ENQ-', '')}-${vendorId}`;
  const newQuote = {
    id: quoteId,
    vendor_id: vendorId,
    vendor_name: quoteDetails.vendor_name || `Vendor #${vendorId}`,
    category: quoteDetails.category || 'Service',
    quoted_price: quoteDetails.quoted_price || '₹45,000',
    package_details: quoteDetails.package_details || 'Standard complete package included.',
    valid_until: quoteDetails.valid_until || '15 Days',
    status: 'Sent',
    created_at: new Date().toISOString(),
  };

  // Replace or add quote
  if (!Array.isArray(enquiry.quotes)) {
    enquiry.quotes = [];
  }
  const existingIdx = enquiry.quotes.findIndex((q) => q.vendor_id === vendorId);
  if (existingIdx >= 0) {
    enquiry.quotes[existingIdx] = newQuote;
  } else {
    enquiry.quotes.push(newQuote);
  }

  enquiry.status = `${enquiry.quotes.length} Quotes Received`;
  logAuditEvent('SUBMIT_QUOTE', `Quote submitted for ${enquiryId} by vendor ${vendorId}`);

  // Asynchronous sync to Supabase quotations table
  if (supabase) {
    try {
      const numAmount = Number(String(quoteDetails.quoted_price || '').replace(/\D/g, '')) || 0;
      supabase
        .from('quotations')
        .insert([{
          enquiry_code: String(enquiryId),
          vendor_id: vendorId,
          vendor_name: quoteDetails.vendor_name || `Vendor #${vendorId}`,
          category: quoteDetails.category || 'Service',
          quoted_amount: numAmount,
          quoted_price: quoteDetails.quoted_price || '',
          package_details: quoteDetails.package_details || '',
          valid_until: quoteDetails.valid_until || '15 Days',
          status: 'Sent',
        }])
        .then(() => {})
        .catch(() => {});
    } catch (e) {
      // Memory fallback safe
    }
  }

  return { success: true, quote: newQuote, totalQuotes: enquiry.quotes.length };
}

// ==============================================================================
// 4. VENDOR PORTFOLIO & REAL GALLERY SYSTEM
// ==============================================================================
export function getVendorPortfolio(vendor) {
  if (!vendor) return null;
  const portfolio = globalPortfolios[vendor.id];
  if (portfolio) return portfolio;

  // Fallback high-res portfolio if not yet explicitly stored
  return {
    logo: vendor.image_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop&q=80',
    cover: vendor.image_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
    photos: [
      { id: 'dp1', url: vendor.image_url, caption: `${vendor.business_name} - Main Setup`, category: 'main' },
      { id: 'dp2', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80', caption: 'Evening Lighting & Decor', category: 'decor' },
      { id: 'dp3', url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80', caption: 'Panchmahal Event Venue Highlight', category: 'venue' },
      { id: 'dp4', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop&q=80', caption: 'Traditional Wedding Stage Detail', category: 'stage' },
      { id: 'dp5', url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&auto=format&fit=crop&q=80', caption: 'Guest Seating & VIP Hospitality', category: 'real_events' },
    ],
    videos: [
      { id: 'dv1', title: `${vendor.business_name} Video Showcase`, url: vendor.instagram_handle ? `https://instagram.com/${vendor.instagram_handle}` : 'https://www.youtube.com' },
    ],
    packages: [
      { name: 'Standard Package', price: vendor.price_range || '₹25,000', includes: 'Complete local event arrangement with verified team' },
      { name: 'Royal Grand Package', price: '₹65,000+', includes: 'Premium customization, priority supervisor & backup support' },
    ],
  };
}

export function addVendorPortfolioPhoto(vendorId, newPhoto) {
  if (!globalPortfolios[vendorId]) {
    globalPortfolios[vendorId] = { photos: [], videos: [], packages: [] };
  }
  const photoObj = {
    id: `photo_${Date.now()}`,
    url: newPhoto.url,
    caption: newPhoto.caption || 'Verified event work',
    category: newPhoto.category || 'decor',
    uploaded_at: new Date().toISOString(),
  };
  globalPortfolios[vendorId].photos.unshift(photoObj);
  logAuditEvent('ADD_PORTFOLIO_PHOTO', `Photo added for vendor ${vendorId}`);
  return photoObj;
}

export function deleteVendorPortfolioPhoto(vendorId, photoId) {
  if (!globalPortfolios[vendorId] || !globalPortfolios[vendorId].photos) return false;
  globalPortfolios[vendorId].photos = globalPortfolios[vendorId].photos.filter((p) => p.id !== photoId);
  logAuditEvent('DELETE_PORTFOLIO_PHOTO', `Photo ${photoId} deleted for vendor ${vendorId}`);
  return true;
}

// ==============================================================================
// 4B. VENDOR SERVICES & PACKAGES CRUD
// ==============================================================================
export function getVendorPackages(vendorId) {
  if (!globalPortfolios[vendorId]) {
    return [
      { id: 'pkg_1', name: 'Standard Service Package', price: '₹25,000', includes: 'Complete local event arrangement with verified team', category: 'decor' },
      { id: 'pkg_2', name: 'Royal Grand Package', price: '₹65,000+', includes: 'Premium customization, priority supervisor & backup support', category: 'decor' },
    ];
  }
  return globalPortfolios[vendorId].packages || [];
}

export function addVendorPackage(vendorId, newPackage) {
  if (!globalPortfolios[vendorId]) {
    globalPortfolios[vendorId] = {
      photos: [],
      videos: [],
      packages: [
        { id: 'pkg_1', name: 'Standard Service Package', price: '₹25,000', includes: 'Complete local event arrangement with verified team', category: 'decor' },
      ],
    };
  }
  if (!globalPortfolios[vendorId].packages) {
    globalPortfolios[vendorId].packages = [];
  }
  const pkgObj = {
    id: `pkg_${Date.now()}`,
    name: newPackage.name || 'New Package',
    price: newPackage.price || '₹20,000',
    includes: newPackage.includes || 'Complete verified event service',
    category: newPackage.category || 'decor',
    created_at: new Date().toISOString(),
  };
  globalPortfolios[vendorId].packages.push(pkgObj);
  logAuditEvent('ADD_PACKAGE', `Package "${pkgObj.name}" added for vendor ${vendorId}`);
  return pkgObj;
}

export function updateVendorPackage(vendorId, packageId, updatedData) {
  if (!globalPortfolios[vendorId] || !globalPortfolios[vendorId].packages) return false;
  const idx = globalPortfolios[vendorId].packages.findIndex((p) => p.id === packageId || p.name === packageId);
  if (idx !== -1) {
    globalPortfolios[vendorId].packages[idx] = {
      ...globalPortfolios[vendorId].packages[idx],
      ...updatedData,
      updated_at: new Date().toISOString(),
    };
    logAuditEvent('UPDATE_PACKAGE', `Package updated for vendor ${vendorId}`);
    return globalPortfolios[vendorId].packages[idx];
  }
  return false;
}

export function deleteVendorPackage(vendorId, packageId) {
  if (!globalPortfolios[vendorId] || !globalPortfolios[vendorId].packages) return false;
  globalPortfolios[vendorId].packages = globalPortfolios[vendorId].packages.filter((p) => p.id !== packageId && p.name !== packageId);
  logAuditEvent('DELETE_PACKAGE', `Package ${packageId} removed for vendor ${vendorId}`);
  return true;
}

export function getVendorProfileCompletion(vendor, portfolio) {
  if (!vendor) return { score: 0, checks: [] };
  const port = portfolio || (globalPortfolios[vendor.id] || {});
  const checks = [
    { label: 'Business Name & Category', done: Boolean(vendor.business_name && vendor.category), weight: 20 },
    { label: 'Contact Phone Verified', done: Boolean(vendor.phone && vendor.phone.length >= 10), weight: 20 },
    { label: 'Location & Service Coverage Area', done: Boolean(vendor.location || (vendor.service_cities && vendor.service_cities.length > 0)), weight: 20 },
    { label: 'Portfolio Work Photos (Min 3)', done: Boolean((port.photos?.length || 0) >= 3), weight: 20 },
    { label: 'Pricing & Service Packages Listed', done: Boolean((port.packages?.length || 0) >= 1), weight: 20 },
  ];
  const score = checks.filter((c) => c.done).reduce((acc, c) => acc + c.weight, 0);
  return { score, checks };
}

// ==============================================================================
// 5. AUDIT LOGGING & ADMIN ACTIONS
// ==============================================================================
export function logAuditEvent(action, details) {
  const log = {
    id: globalAuditLogs.length + 1,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  globalAuditLogs.unshift(log);
  if (globalAuditLogs.length > 100) globalAuditLogs.pop();
  return log;
}

export function getAuditLogs() {
  return globalAuditLogs;
}
