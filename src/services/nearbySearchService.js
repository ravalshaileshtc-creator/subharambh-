// ==============================================================================
// SHUBH CELEBRATIONS – SMART NEARBY VENDOR SEARCH & GEOSPATIAL ENGINE
// Features:
// 1. Haversine distance calculation in kilometers with decimal precision
// 2. Configurable Distance Tiers (0-10 km, 10-25 km, 25-50 km, 50-100 km, 100+ km)
// 3. Customer Location Resolution: GPS, Manual State/City, PIN Code, Saved Home
// 4. Vendor Service Area & Radius Coverage Validation
// 5. Default Godhra & Panchmahal Prioritization without mixing distant vendors
// 6. All-India mode with distance awareness
// ==============================================================================

import { PAN_INDIA_CITIES } from '../constants/panIndiaLocations.js';

export const DEFAULT_CUSTOMER_LOCATION = {
  city: 'Godhra',
  district: 'Panchmahal',
  state_id: 'GJ',
  state_name: 'Gujarat',
  pincode: '389001',
  latitude: 22.7766,
  longitude: 73.6149,
  is_gps: false,
  label: 'Godhra, Panchmahal, Gujarat',
};

// Configurable Distance Ranges
export const DISTANCE_TIERS = {
  VERY_NEARBY: { key: 'very_nearby', min: 0, max: 10, label: '0–10 km: Very Nearby', shortLabel: 'Very Nearby', color: '#15803d', icon: '⚡' },
  NEARBY: { key: 'nearby', min: 10, max: 25, label: '10–25 km: Nearby', shortLabel: 'Nearby', color: '#0284c7', icon: '🚗' },
  EXTENDED: { key: 'extended', min: 25, max: 50, label: '25–50 km: Extended Nearby', shortLabel: 'Extended', color: '#d97706', icon: '📍' },
  WIDER: { key: 'wider', min: 50, max: 100, label: '50–100 km: Wider Area', shortLabel: 'Wider Area', color: '#9333ea', icon: '🌐' },
  BEYOND: { key: 'beyond', min: 100, max: 99999, label: 'Beyond 100 km: Other Locations', shortLabel: 'Other Locations', color: '#64748b', icon: '✈️' },
};

export const QUICK_RADIUS_OPTIONS = [
  { label: '10 km', value: 10, hint: 'Very Nearby' },
  { label: '25 km', value: 25, hint: 'City & Talukas' },
  { label: '50 km', value: 50, hint: 'District & Surrounds' },
  { label: '100 km', value: 100, hint: 'Regional Area' },
  { label: 'All India', value: 'ALL', hint: 'Nationwide' },
];

/**
 * Haversine formula: Calculates great-circle distance between two GPS coordinates in kilometers.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 9999.0;
  }
  const toRad = (angle) => (angle * Math.PI) / 180;
  const R = 6371; // Earth radius in kilometers

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal point e.g. 2.4 km
}

/**
 * Returns human-readable tier and badge info based on distance.
 */
export function getDistanceTier(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) return DISTANCE_TIERS.BEYOND;
  if (distanceKm <= 10) return DISTANCE_TIERS.VERY_NEARBY;
  if (distanceKm <= 25) return DISTANCE_TIERS.NEARBY;
  if (distanceKm <= 50) return DISTANCE_TIERS.EXTENDED;
  if (distanceKm <= 100) return DISTANCE_TIERS.WIDER;
  return DISTANCE_TIERS.BEYOND;
}

/**
 * Returns localized distance tier label in Gujarati, Hindi or English
 */
export function getLocalizedTierLabel(tierKey, lang = 'en') {
  if (lang === 'gu') {
    switch (tierKey) {
      case 'very_nearby': return 'ખૂબ નજીક (૦–૧૦ કિ.મી.)';
      case 'nearby': return 'નજીક (૧૦–૨૫ કિ.મી.)';
      case 'extended': return 'વિસ્તૃત નજીક (૨૫–૫૦ કિ.મી.)';
      case 'wider': return 'મોટો વિસ્તાર (૫૦–૧૦૦ કિ.મી.)';
      default: return 'અન્ય સ્થળો (>૧૦૦ કિ.મી.)';
    }
  }
  if (lang === 'hi') {
    switch (tierKey) {
      case 'very_nearby': return 'बहुत नज़दीक (0–10 कि.मी.)';
      case 'nearby': return 'नज़दीक (10–25 कि.मी.)';
      case 'extended': return 'विस्तारित नज़दीक (25–50 कि.मी.)';
      case 'wider': return 'व्यापक क्षेत्र (50–100 कि.मी.)';
      default: return 'अन्य स्थान (>100 कि.मी.)';
    }
  }
  switch (tierKey) {
    case 'very_nearby': return 'Very Nearby (0–10 km)';
    case 'nearby': return 'Nearby (10–25 km)';
    case 'extended': return 'Extended (25–50 km)';
    case 'wider': return 'Wider Area (50–100 km)';
    default: return 'Other Locations (>100 km)';
  }
}

/**
 * Returns localized distance formatted string
 */
export function formatLocalizedDistance(distanceKm, lang = 'en') {
  if (distanceKm == null) return '';
  if (lang === 'gu') return `${distanceKm} કિ.મી. દૂર`;
  if (lang === 'hi') return `${distanceKm} कि.मी. दूर`;
  return `${distanceKm} km away`;
}

/**
 * Maps a PIN Code prefix or full PIN to known city coordinates in Pan India database.
 */
export function resolveLocationByPincode(pincode) {
  if (!pincode) return null;
  const pinStr = String(pincode).trim();
  const prefix = pinStr.slice(0, 4);

  // Exact match on city pincode_prefix
  const found = PAN_INDIA_CITIES.find(
    (c) => c.pincode_prefix === prefix || pinStr.startsWith(c.pincode_prefix)
  );

  if (found) {
    return {
      city: found.name,
      district: found.district,
      state_id: found.state_id,
      state_name: found.state_name,
      pincode: pinStr,
      latitude: found.latitude,
      longitude: found.longitude,
      label: `${found.name}, ${found.district}, ${found.state_name} (${pinStr})`,
    };
  }

  return null;
}

/**
 * Resolves location by City ID or name.
 */
export function resolveLocationByCityName(cityName) {
  if (!cityName) return DEFAULT_CUSTOMER_LOCATION;
  const q = cityName.toLowerCase().trim();
  const found = PAN_INDIA_CITIES.find(
    (c) => c.name.toLowerCase() === q || c.id === q
  );

  if (found) {
    return {
      city: found.name,
      district: found.district,
      state_id: found.state_id,
      state_name: found.state_name,
      pincode: `${found.pincode_prefix}01`,
      latitude: found.latitude,
      longitude: found.longitude,
      label: `${found.name}, ${found.district}, ${found.state_name}`,
    };
  }

  return { ...DEFAULT_CUSTOMER_LOCATION, city: cityName, label: `${cityName}, Gujarat` };
}

/**
 * Checks if a customer's location falls within a vendor's configured service coverage:
 * 1. Physical Distance <= vendor.service_radius_km
 * 2. OR customer city is in vendor.service_area_cities
 * 3. OR customer pincode is in vendor.service_area_pincodes
 * 4. OR customer district is in vendor.service_area_districts
 */
export function isVendorServingCustomer(vendor, customerLoc, distanceKm) {
  // If vendor has an explicit service radius, check distance
  const maxRadius = Number(vendor.service_radius_km) || 50; // default 50 km coverage
  if (distanceKm <= maxRadius) {
    return true;
  }

  // Check multi-city service areas
  const serviceCities = Array.isArray(vendor.service_area_cities)
    ? vendor.service_area_cities.map((c) => c.toLowerCase())
    : [];
  if (customerLoc.city && serviceCities.includes(customerLoc.city.toLowerCase())) {
    return true;
  }

  // Check PIN code coverage
  const servicePins = Array.isArray(vendor.service_area_pincodes)
    ? vendor.service_area_pincodes.map((p) => String(p).trim())
    : [];
  if (customerLoc.pincode && servicePins.includes(String(customerLoc.pincode).trim())) {
    return true;
  }

  // Check district coverage
  const serviceDistricts = Array.isArray(vendor.service_area_districts)
    ? vendor.service_area_districts.map((d) => d.toLowerCase())
    : [];
  if (customerLoc.district && serviceDistricts.includes(customerLoc.district.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Smart Vendor Nearby Search & Ranking
 * 
 * Rules:
 * 1. Default customer in Godhra: Godhra vendors first, then nearby (Halol/Kalol/Shehra), never distant vendors.
 * 2. Unapproved vendors are strictly filtered out.
 * 3. Accurate sorting by real geographical distance in km.
 * 4. Vendor service area restrictions enforced.
 * 5. Returns matched vendors with annotated distance & tier information.
 */
export function searchNearbyVendors({
  vendors = [],
  customerLocation = DEFAULT_CUSTOMER_LOCATION,
  radiusKm = 25, // default 25 km radius
  allIndiaMode = false,
  category = 'all',
  minRating = 0,
  verifiedOnly = false,
  searchQuery = '',
}) {
  const custLat = customerLocation.latitude || DEFAULT_CUSTOMER_LOCATION.latitude;
  const custLng = customerLocation.longitude || DEFAULT_CUSTOMER_LOCATION.longitude;

  // 1. Filter out unapproved, rejected, or suspended vendors
  const eligibleVendors = vendors.filter((v) => {
    if (v.vendor_status && v.vendor_status !== 'approved') return false;
    if (v.status && v.status === 'suspended') return false;
    return true;
  });

  // 2. Annotate each vendor with accurate geographical distance and service status
  const annotated = eligibleVendors.map((vendor) => {
    // Default vendor coordinates fallback to Godhra center if missing
    const vLat = vendor.latitude != null ? vendor.latitude : 22.7766;
    const vLng = vendor.longitude != null ? vendor.longitude : 73.6149;

    const distance = calculateHaversineDistance(custLat, custLng, vLat, vLng);
    const tier = getDistanceTier(distance);
    const isServing = isVendorServingCustomer(vendor, customerLocation, distance);

    return {
      ...vendor,
      calculated_distance_km: distance,
      distance_tier: tier,
      is_serving_location: isServing,
    };
  });

  // 3. Filter by category, rating, verification, and text query
  let filtered = annotated.filter((v) => {
    if (category && category !== 'all' && v.category !== category) {
      return false;
    }
    if (verifiedOnly && !v.is_verified) {
      return false;
    }
    if (minRating > 0 && (v.rating || 0) < minRating) {
      return false;
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (v.business_name || '').toLowerCase().includes(q);
      const matchLoc = (v.location || '').toLowerCase().includes(q);
      const matchCity = (v.city_name || '').toLowerCase().includes(q);
      const matchDistrict = (v.district || '').toLowerCase().includes(q);
      const matchCat = (v.category || '').toLowerCase().includes(q);
      const matchDesc = (v.description || '').toLowerCase().includes(q);
      const matchPrice = (v.price_range || '').toLowerCase().includes(q);
      const matchServiceCities = Array.isArray(v.service_area_cities) && v.service_area_cities.some((c) => (c || '').toLowerCase().includes(q));
      const matchPackages = Array.isArray(v.packages) && v.packages.some((p) => 
        (p.name || '').toLowerCase().includes(q) || (p.includes || '').toLowerCase().includes(q)
      );

      if (!matchName && !matchLoc && !matchCity && !matchDistrict && !matchCat && !matchDesc && !matchPrice && !matchServiceCities && !matchPackages) {
        return false;
      }
    }
    return true;
  });

  // 4. Apply Location / Distance Radius Filter
  let results = [];
  if (allIndiaMode || radiusKm === 'ALL') {
    // All India Mode: Show all vendors nationwide, sorted primarily by distance to customer
    results = [...filtered].sort((a, b) => a.calculated_distance_km - b.calculated_distance_km);
  } else {
    const numRadius = Number(radiusKm) || 25;
    // Strict Nearby Mode:
    // Only vendors within the radius AND who serve this location
    results = filtered
      .filter((v) => v.calculated_distance_km <= numRadius && v.is_serving_location)
      .sort((a, b) => a.calculated_distance_km - b.calculated_distance_km);
  }

  // 5. Calculate suggestions if empty
  let suggestedRadius = null;
  if (results.length === 0 && !allIndiaMode && radiusKm !== 'ALL') {
    const currentR = Number(radiusKm) || 25;
    if (currentR <= 10) suggestedRadius = 25;
    else if (currentR <= 25) suggestedRadius = 50;
    else if (currentR <= 50) suggestedRadius = 100;
    else suggestedRadius = 'ALL';
  }

  return {
    vendors: results,
    totalCount: results.length,
    customerLocation,
    radiusKm,
    allIndiaMode,
    suggestedRadius,
  };
}

/**
 * Safe Browser / Device GPS Detection
 * Resolves coordinates with customer permission, never blocks if denied.
 */
export async function detectCustomerGPSLocation() {
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          resolve({
            success: true,
            latitude: Math.round(lat * 10000) / 10000,
            longitude: Math.round(lng * 10000) / 10000,
            is_gps: true,
            label: `GPS Detected (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          });
        },
        (error) => {
          // Graceful fallback on permission denial
          resolve({
            success: false,
            error: error.message || 'GPS permission denied',
            ...DEFAULT_CUSTOMER_LOCATION,
          });
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      resolve({
        success: false,
        error: 'Geolocation API not supported on this device',
        ...DEFAULT_CUSTOMER_LOCATION,
      });
    }
  });
}
