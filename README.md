# 🎪 Shubh Celebrations (Subharambh) 💍
### All India Event Marketplace & Enterprise Wedding Management Platform

> **Shubh Celebrations (Subharambh)** is a comprehensive, production-ready, trilingual marketplace connecting event hosts with verified vendors across **28 States and 8 Union Territories** in India. Built with **React Native (Expo Web & Android)**, **Supabase PostgreSQL (RLS)**, and a **5-tier location-based administrative hierarchy**.

---

## 🌟 Key Architecture & Features

### 1. 🌐 Pan-India Multi-Location Coverage
- Complete geographic coverage of all **28 States and 8 Union Territories**, districts, cities, and PIN codes.
- Smart Nearby Vendor Discovery with configurable radial search (5 km to 100+ km) using GPS coordinates.
- Multi-city vendor service coverage.

### 2. 🔐 Multi-Tier Administrative Hierarchy & Location-Based Access Control (LBAC)
- **Super Admin:** Full India-wide oversight across all 36 States/UTs, 20-module management console, manager delegation, and financial controls.
- **State Manager:** Strictly restricted to assigned state (e.g. Gujarat `GJ`); reviews vendor applications, approves vendors (*with permission*), and invites city managers. Cross-state requests blocked with **403 Forbidden**.
- **City Manager:** Strictly restricted to assigned municipal city (e.g. Godhra); inspects local venues, verifies KYC documents, recommends vendor approvals, and manages local bookings. Cross-city requests blocked with **403 Forbidden**.
- **Vendor:** Manages listings, services, packages, photo portfolios, quotes, and direct payment tracking.
- **Customer:** Explores verified vendors, requests 5 quotes, books event services, and rates completed events.

### 3. 💼 Transparent Business Model
- **Free Vendor Listing:** Vendors can list their business and services with zero upfront listing fees.
- **5% Marketplace Commission:** Transparent 5% platform commission on completed events.
- **Direct Customer-to-Vendor Payments:** Customer makes milestone payments directly to the vendor's verified UPI/Bank.

### 4. 🗣️ Trilingual Language System
- **Supported Languages:**
  - Gujarati (ગુજરાતી)
  - Hindi (हिन्दी)
  - English (en)
- Real-time instant language switching across the entire UI with persistent storage.
- Preserves authentic vendor names and business descriptions.

### 5. 📱 Mandatory Mobile OTP Authentication
- Secure mobile number OTP authentication with rate limiting and brute-force protection.
- Native integration with Supabase Auth and idempotent profile persistence in `public.profiles`.
- Tester & developer bypass OTP (`123456`) with direct 1-click test login.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npx expo`)

### 2. Installation
```bash
git clone https://github.com/ravalshaileshtc-creator/subharambh-.git
cd subharambh-
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Setup
Execute the following SQL migration scripts in your Supabase SQL Editor:
1. `supabase_pan_india_marketplace_migration.sql` - Core Pan-India database tables, states, cities, and initial schemas.
2. `supabase_fix_customer_registration.sql` - Profile tables, RLS policies, and customer registration function.
3. `supabase_india_wide_hierarchy_migration.sql` - Multi-level manager assignments, location-based access control, and audit logs.

### 5. Running the Application
```bash
# Start Web Development Server
npm run web

# Build for Web Production
npm run build
```

---

## 🧪 Automated Testing & Verification
The platform includes comprehensive automated test suites covering all modules:
```bash
node test_mandatory_otp_auth.js        # 18/18 OTP Auth Tests
node test_fix_customer_registration.js # 8/8 Customer Registration Tests
node test_india_wide_hierarchy.js      # 20/20 Hierarchy & LBAC Tests
node test_production_super_admin.js    # 20/20 Super Admin Modules
node test_pan_india_marketplace.js     # 15/15 Pan-India Marketplace Tests
node test_multilanguage.js             # 10/10 Multilingual Tests
node test_premium_upgrade.js           # 24/24 UI/UX & CRUD Tests
```

---

## 📄 License
Private & Proprietary - Shubh Celebrations / Panchmahal Events Hub. All rights reserved.
