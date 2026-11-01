// ==============================================================================
// SHUBH CELEBRATIONS – PAN INDIA LOCATION DATABASE
// All 28 States & 8 Union Territories with Districts, Cities & PIN Code Prefixes
// Preserving Panchmahal / Godhra within Gujarat while enabling nationwide scale
// ==============================================================================

export const INDIAN_STATES_AND_UTS = [
  // 28 STATES
  { id: 'GJ', name: 'Gujarat', type: 'state', capital: 'Gandhinagar' },
  { id: 'MH', name: 'Maharashtra', type: 'state', capital: 'Mumbai' },
  { id: 'RJ', name: 'Rajasthan', type: 'state', capital: 'Jaipur' },
  { id: 'MP', name: 'Madhya Pradesh', type: 'state', capital: 'Bhopal' },
  { id: 'UP', name: 'Uttar Pradesh', type: 'state', capital: 'Lucknow' },
  { id: 'KA', name: 'Karnataka', type: 'state', capital: 'Bengaluru' },
  { id: 'TN', name: 'Tamil Nadu', type: 'state', capital: 'Chennai' },
  { id: 'TG', name: 'Telangana', type: 'state', capital: 'Hyderabad' },
  { id: 'AP', name: 'Andhra Pradesh', type: 'state', capital: 'Amaravati' },
  { id: 'KL', name: 'Kerala', type: 'state', capital: 'Thiruvananthapuram' },
  { id: 'WB', name: 'West Bengal', type: 'state', capital: 'Kolkata' },
  { id: 'PB', name: 'Punjab', type: 'state', capital: 'Chandigarh' },
  { id: 'HR', name: 'Haryana', type: 'state', capital: 'Chandigarh' },
  { id: 'BR', name: 'Bihar', type: 'state', capital: 'Patna' },
  { id: 'OR', name: 'Odisha', type: 'state', capital: 'Bhubaneswar' },
  { id: 'AS', name: 'Assam', type: 'state', capital: 'Dispur' },
  { id: 'JH', name: 'Jharkhand', type: 'state', capital: 'Ranchi' },
  { id: 'CG', name: 'Chhattisgarh', type: 'state', capital: 'Raipur' },
  { id: 'UT', name: 'Uttarakhand', type: 'state', capital: 'Dehradun' },
  { id: 'HP', name: 'Himachal Pradesh', type: 'state', capital: 'Shimla' },
  { id: 'GA', name: 'Goa', type: 'state', capital: 'Panaji' },
  { id: 'TR', name: 'Tripura', type: 'state', capital: 'Agartala' },
  { id: 'ML', name: 'Meghalaya', type: 'state', capital: 'Shillong' },
  { id: 'MN', name: 'Manipur', type: 'state', capital: 'Imphal' },
  { id: 'NL', name: 'Nagaland', type: 'state', capital: 'Kohima' },
  { id: 'MZ', name: 'Mizoram', type: 'state', capital: 'Aizawl' },
  { id: 'AR', name: 'Arunachal Pradesh', type: 'state', capital: 'Itanagar' },
  { id: 'SK', name: 'Sikkim', type: 'state', capital: 'Gangtok' },

  // 8 UNION TERRITORIES
  { id: 'DL', name: 'Delhi NCR', type: 'ut', capital: 'New Delhi' },
  { id: 'JK', name: 'Jammu and Kashmir', type: 'ut', capital: 'Srinagar / Jammu' },
  { id: 'LA', name: 'Ladakh', type: 'ut', capital: 'Leh' },
  { id: 'CH', name: 'Chandigarh', type: 'ut', capital: 'Chandigarh' },
  { id: 'PY', name: 'Puducherry', type: 'ut', capital: 'Puducherry' },
  { id: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'ut', capital: 'Daman' },
  { id: 'AN', name: 'Andaman and Nicobar Islands', type: 'ut', capital: 'Port Blair' },
  { id: 'LD', name: 'Lakshadweep', type: 'ut', capital: 'Kavaratti' },
];

export const PAN_INDIA_CITIES = [
  // GUJARAT (Includes full Panchmahal & regional hubs)
  { id: 'godhra', name: 'Godhra', district: 'Panchmahal', state_id: 'GJ', state_name: 'Gujarat', pincode_prefix: '3890', latitude: 22.7766, longitude: 73.6149, is_featured: true },
  { id: 'halol', name: 'Halol', district: 'Panchmahal', state_id: 'GJ', state_name: 'Gujarat', pincode_prefix: '3893', latitude: 22.5024, longitude: 73.4716, is_featured: true },
  { id: 'kalol_pm', name: 'Kalol (Panchmahal)', district: 'Panchmahal', state_id: 'GJ', state_name: 'Gujarat', pincode_prefix: '3893', latitude: 22.6074, longitude: 73.4565, is_featured: true },
  { id: 'shehra', name: 'Shehra', district: 'Panchmahal', state_id: 'GJ', state_name: 'Gujarat', pincode_prefix: '3892', latitude: 22.9532, longitude: 73.6334, is_featured: true },
  { id: 'lunawada', name: 'Lunawada', district: 'Mahisagar', state_id: 'GJ', state_name: 'Gujarat', pincode_prefix: '3892', latitude: 23.1333, longitude: 73.6167, is_featured: true },
  { id: 'vadodara', name: 'Vadodara', district: 'Vadodara', state_id: 'GJ', state_name: 'Gujarat', pincode_prefix: '3900', latitude: 22.3072, longitude: 73.1812, is_featured: true },
  { id: 'ahmedabad', name: 'Ahmedabad', district: 'Ahmedabad', state_id: 'GJ', state_name: 'Gujarat', pincode_prefix: '3800', latitude: 23.0225, longitude: 72.5714, is_featured: true },
  { id: 'surat', name: 'Surat', district: 'Surat', state_id: 'GJ', state_name: 'Gujarat', pincode_prefix: '3950', latitude: 21.1702, longitude: 72.8311, is_featured: true },
  { id: 'rajkot', name: 'Rajkot', district: 'Rajkot', state_id: 'GJ', state_name: 'Gujarat', pincode_prefix: '3600', latitude: 22.3039, longitude: 70.8022, is_featured: false },
  { id: 'anand', name: 'Anand', district: 'Anand', state_id: 'GJ', state_name: 'Gujarat', pincode_prefix: '3880', latitude: 22.5645, longitude: 72.9289, is_featured: false },

  // MAHARASHTRA
  { id: 'mumbai', name: 'Mumbai', district: 'Mumbai City', state_id: 'MH', state_name: 'Maharashtra', pincode_prefix: '4000', latitude: 19.0760, longitude: 72.8777, is_featured: true },
  { id: 'pune', name: 'Pune', district: 'Pune', state_id: 'MH', state_name: 'Maharashtra', pincode_prefix: '4110', latitude: 18.5204, longitude: 73.8567, is_featured: true },
  { id: 'nagpur', name: 'Nagpur', district: 'Nagpur', state_id: 'MH', state_name: 'Maharashtra', pincode_prefix: '4400', latitude: 21.1458, longitude: 79.0882, is_featured: false },
  { id: 'nashik', name: 'Nashik', district: 'Nashik', state_id: 'MH', state_name: 'Maharashtra', pincode_prefix: '4220', latitude: 19.9975, longitude: 73.7898, is_featured: false },
  { id: 'thane', name: 'Thane', district: 'Thane', state_id: 'MH', state_name: 'Maharashtra', pincode_prefix: '4006', latitude: 19.2183, longitude: 72.9781, is_featured: false },

  // RAJASTHAN
  { id: 'jaipur', name: 'Jaipur', district: 'Jaipur', state_id: 'RJ', state_name: 'Rajasthan', pincode_prefix: '3020', latitude: 26.9124, longitude: 75.7873, is_featured: true },
  { id: 'udaipur', name: 'Udaipur (Royal Weddings)', district: 'Udaipur', state_id: 'RJ', state_name: 'Rajasthan', pincode_prefix: '3130', latitude: 24.5854, longitude: 73.7125, is_featured: true },
  { id: 'jodhpur', name: 'Jodhpur', district: 'Jodhpur', state_id: 'RJ', state_name: 'Rajasthan', pincode_prefix: '3420', latitude: 26.2389, longitude: 73.0243, is_featured: true },
  { id: 'kota', name: 'Kota', district: 'Kota', state_id: 'RJ', state_name: 'Rajasthan', pincode_prefix: '3240', latitude: 25.2138, longitude: 75.8648, is_featured: false },

  // DELHI NCR
  { id: 'delhi', name: 'New Delhi', district: 'Central Delhi', state_id: 'DL', state_name: 'Delhi NCR', pincode_prefix: '1100', latitude: 28.6139, longitude: 77.2090, is_featured: true },
  { id: 'noida', name: 'Noida', district: 'Gautam Buddha Nagar', state_id: 'UP', state_name: 'Uttar Pradesh', pincode_prefix: '2013', latitude: 28.5355, longitude: 77.3910, is_featured: true },
  { id: 'gurugram', name: 'Gurugram', district: 'Gurugram', state_id: 'HR', state_name: 'Haryana', pincode_prefix: '1220', latitude: 28.4595, longitude: 77.0266, is_featured: true },

  // MADHYA PRADESH
  { id: 'indore', name: 'Indore', district: 'Indore', state_id: 'MP', state_name: 'Madhya Pradesh', pincode_prefix: '4520', latitude: 22.7196, longitude: 75.8577, is_featured: true },
  { id: 'bhopal', name: 'Bhopal', district: 'Bhopal', state_id: 'MP', state_name: 'Madhya Pradesh', pincode_prefix: '4620', latitude: 23.2599, longitude: 77.4126, is_featured: true },
  { id: 'gwalior', name: 'Gwalior', district: 'Gwalior', state_id: 'MP', state_name: 'Madhya Pradesh', pincode_prefix: '4740', latitude: 26.2183, longitude: 78.1828, is_featured: false },

  // UTTAR PRADESH
  { id: 'lucknow', name: 'Lucknow', district: 'Lucknow', state_id: 'UP', state_name: 'Uttar Pradesh', pincode_prefix: '2260', latitude: 26.8467, longitude: 80.9462, is_featured: true },
  { id: 'varanasi', name: 'Varanasi', district: 'Varanasi', state_id: 'UP', state_name: 'Uttar Pradesh', pincode_prefix: '2210', latitude: 25.3176, longitude: 82.9739, is_featured: true },
  { id: 'agra', name: 'Agra', district: 'Agra', state_id: 'UP', state_name: 'Uttar Pradesh', pincode_prefix: '2820', latitude: 27.1767, longitude: 78.0081, is_featured: false },

  // KARNATAKA
  { id: 'bengaluru', name: 'Bengaluru', district: 'Bengaluru Urban', state_id: 'KA', state_name: 'Karnataka', pincode_prefix: '5600', latitude: 12.9716, longitude: 77.5946, is_featured: true },
  { id: 'mysuru', name: 'Mysuru', district: 'Mysuru', state_id: 'KA', state_name: 'Karnataka', pincode_prefix: '5700', latitude: 12.2958, longitude: 76.6394, is_featured: false },

  // TELANGANA
  { id: 'hyderabad', name: 'Hyderabad', district: 'Hyderabad', state_id: 'TG', state_name: 'Telangana', pincode_prefix: '5000', latitude: 17.3850, longitude: 78.4867, is_featured: true },

  // TAMIL NADU
  { id: 'chennai', name: 'Chennai', district: 'Chennai', state_id: 'TN', state_name: 'Tamil Nadu', pincode_prefix: '6000', latitude: 13.0827, longitude: 80.2707, is_featured: true },
  { id: 'coimbatore', name: 'Coimbatore', district: 'Coimbatore', state_id: 'TN', state_name: 'Tamil Nadu', pincode_prefix: '6410', latitude: 11.0168, longitude: 76.9558, is_featured: false },

  // WEST BENGAL
  { id: 'kolkata', name: 'Kolkata', district: 'Kolkata', state_id: 'WB', state_name: 'West Bengal', pincode_prefix: '7000', latitude: 22.5726, longitude: 88.3639, is_featured: true },

  // GOA
  { id: 'goa_north', name: 'North Goa (Beach Weddings)', district: 'North Goa', state_id: 'GA', state_name: 'Goa', pincode_prefix: '4035', latitude: 15.5937, longitude: 73.7733, is_featured: true },
  { id: 'goa_south', name: 'South Goa', district: 'South Goa', state_id: 'GA', state_name: 'Goa', pincode_prefix: '4037', latitude: 15.2736, longitude: 73.9582, is_featured: true },

  // PUNJAB & CHANDIGARH
  { id: 'chandigarh', name: 'Chandigarh', district: 'Chandigarh', state_id: 'CH', state_name: 'Chandigarh', pincode_prefix: '1600', latitude: 30.7333, longitude: 76.7794, is_featured: true },
  { id: 'amritsar', name: 'Amritsar', district: 'Amritsar', state_id: 'PB', state_name: 'Punjab', pincode_prefix: '1430', latitude: 31.6340, longitude: 74.8723, is_featured: false },
  { id: 'ludhiana', name: 'Ludhiana', district: 'Ludhiana', state_id: 'PB', state_name: 'Punjab', pincode_prefix: '1410', latitude: 30.9010, longitude: 75.8573, is_featured: false },

  // UTTARAKHAND
  { id: 'dehradun', name: 'Dehradun', district: 'Dehradun', state_id: 'UT', state_name: 'Uttarakhand', pincode_prefix: '2480', latitude: 30.3165, longitude: 78.0322, is_featured: true },
  { id: 'rishikesh', name: 'Rishikesh / Haridwar', district: 'Dehradun', state_id: 'UT', state_name: 'Uttarakhand', pincode_prefix: '2492', latitude: 30.0869, longitude: 78.2676, is_featured: true },
];

export function getCitiesByState(stateId) {
  if (!stateId || stateId === 'ALL') return PAN_INDIA_CITIES;
  return PAN_INDIA_CITIES.filter((c) => c.state_id === stateId);
}

export function searchLocations(query) {
  if (!query || !query.trim()) return PAN_INDIA_CITIES.slice(0, 10);
  const q = query.toLowerCase().trim();
  return PAN_INDIA_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.state_name.toLowerCase().includes(q) ||
      c.pincode_prefix.includes(q)
  );
}
