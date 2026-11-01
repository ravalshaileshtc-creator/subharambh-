// ==============================================================================
// SHUBH CELEBRATIONS – PAN INDIA RBAC SERVICE 3.0
// Pure Vendor Marketplace Multi-Tier Role & Regional Security
// Roles: customer | vendor | city_manager | state_manager | admin | super_admin
// Vendor Statuses: not_applicable | pending | approved | rejected | suspended
// ==============================================================================

export const ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  CITY_MANAGER: 'city_manager',
  STATE_MANAGER: 'state_manager',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export const VENDOR_STATUS = {
  NOT_APPLICABLE: 'not_applicable',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

export const MANAGER_STATUS = {
  ACTIVE: 'active',
  PENDING_INVITATION: 'pending_invitation',
  DEACTIVATED: 'deactivated',
};

// Initial Seed Users for Testing Each Role & Regional Scope
export const SEED_USERS = {
  customer: {
    id: 'usr-cust-101',
    full_name: 'Rajeshbhai Patel',
    email: 'rajesh.patel@gmail.com',
    phone: '9825098765',
    role: ROLES.CUSTOMER,
    vendor_status: VENDOR_STATUS.NOT_APPLICABLE,
    city_name: 'Godhra',
    state_id: 'GJ',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    created_at: '2026-08-15T10:00:00Z',
  },
  vendor: {
    id: 'usr-vend-approved-201',
    full_name: 'Vallabh Decor Team',
    email: 'vallabh@godhraevents.in',
    phone: '9825123401',
    role: ROLES.VENDOR,
    vendor_status: VENDOR_STATUS.APPROVED,
    vendor_id: 1,
    business_name: 'Vallabh Decoration & Event Management',
    city_name: 'Godhra',
    state_id: 'GJ',
    service_cities: ['Godhra', 'Halol', 'Vadodara', 'Kalol (Panchmahal)'],
    avatar: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200',
    created_at: '2026-06-01T12:00:00Z',
  },
  vendor_pending: {
    id: 'usr-vend-pending-202',
    full_name: 'Rameshbhai Prajapati',
    email: 'shreeram@godhraevents.in',
    phone: '9825445566',
    role: ROLES.VENDOR,
    vendor_status: VENDOR_STATUS.PENDING,
    business_name: 'Shree Ram Mandap & Sound System',
    category: 'mandap',
    city_name: 'Godhra',
    state_id: 'GJ',
    application_id: 'APP-2026-9041',
    submitted_at: '2026-10-30T10:15:00Z',
    notes: 'Godhra city decorator with 12 years experience, requesting free partner listing.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    created_at: '2026-10-30T10:15:00Z',
  },
  vendor_rejected: {
    id: 'usr-vend-rejected-203',
    full_name: 'Kiritbhai Baria',
    email: 'royalcaterers@godhraevents.in',
    phone: '9825998877',
    role: ROLES.VENDOR,
    vendor_status: VENDOR_STATUS.REJECTED,
    business_name: 'Royal Caterers & Banquet Services',
    category: 'catering',
    city_name: 'Halol',
    state_id: 'GJ',
    application_id: 'APP-2026-8812',
    submitted_at: '2026-10-24T14:20:00Z',
    reviewed_at: '2026-10-26T11:00:00Z',
    rejection_reason: 'Verification phone number could not be reached after 3 attempts, and local business address proof was missing.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    created_at: '2026-10-24T14:20:00Z',
  },
  vendor_suspended: {
    id: 'usr-vend-suspended-204',
    full_name: 'Vikram Rajput',
    email: 'rajputdj@godhraevents.in',
    phone: '9825332211',
    role: ROLES.VENDOR,
    vendor_status: VENDOR_STATUS.SUSPENDED,
    business_name: 'Rajput Royal DJ & Sound',
    category: 'dj',
    city_name: 'Godhra',
    state_id: 'GJ',
    suspension_reason: 'Unresolved direct payment dispute and outstanding 5% platform commission overdue beyond 45 days.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    created_at: '2026-05-10T10:00:00Z',
  },
  city_manager: {
    id: 'usr-mgr-city-01',
    full_name: 'Panchmahal District City Manager',
    email: 'godhra.manager@shubhcelebrations.in',
    phone: '9825123405',
    role: ROLES.CITY_MANAGER,
    vendor_status: VENDOR_STATUS.NOT_APPLICABLE,
    assigned_city: 'Godhra',
    assigned_state: 'GJ',
    can_approve_vendors: false,
    can_manage_city_managers: false,
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    created_at: '2026-03-01T08:00:00Z',
  },
  state_manager: {
    id: 'usr-mgr-state-01',
    full_name: 'Gujarat Regional State Manager',
    email: 'gujarat.head@shubhcelebrations.in',
    phone: '9825123406',
    role: ROLES.STATE_MANAGER,
    vendor_status: VENDOR_STATUS.NOT_APPLICABLE,
    assigned_state: 'GJ',
    can_approve_vendors: true,
    can_manage_city_managers: true,
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200',
    created_at: '2026-02-01T08:00:00Z',
  },
  admin: {
    id: 'usr-admin-001',
    full_name: 'Shubh Celebrations Operations Admin',
    email: 'admin@shubhcelebrations.in',
    phone: '9825123400',
    role: ROLES.ADMIN,
    vendor_status: VENDOR_STATUS.NOT_APPLICABLE,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    created_at: '2026-01-01T08:00:00Z',
  },
  super_admin: {
    id: 'usr-super-001',
    full_name: 'Shubh Celebrations Pan-India Super Admin',
    email: 'superadmin@shubhcelebrations.in',
    phone: '9825111111',
    role: ROLES.SUPER_ADMIN,
    vendor_status: VENDOR_STATUS.NOT_APPLICABLE,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    created_at: '2026-01-01T00:00:00Z',
  },
};

// Active Session in memory
let currentUser = { ...SEED_USERS.customer };

// In-Memory Applications Store
let mockVendorApplications = [
  {
    id: 1,
    application_id: 'APP-2026-9041',
    user_id: 'usr-vend-pending-202',
    business_name: 'Shree Ram Mandap & Sound System',
    category: 'mandap',
    phone: '9825445566',
    city: 'Godhra',
    state_id: 'GJ',
    notes: 'Godhra city decorator with 12 years experience, requesting free partner listing.',
    status: 'pending',
    rejection_reason: null,
    submitted_at: '2026-10-30T10:15:00Z',
    reviewed_by: null,
    reviewed_at: null,
  },
  {
    id: 2,
    application_id: 'APP-2026-8812',
    user_id: 'usr-vend-rejected-203',
    business_name: 'Royal Caterers & Banquet Services',
    category: 'catering',
    phone: '9825998877',
    city: 'Halol',
    state_id: 'GJ',
    notes: 'Looking to expand catering bookings across Halol and Kalol.',
    status: 'rejected',
    rejection_reason: 'Verification phone number could not be reached after 3 attempts, and local business address proof was missing.',
    submitted_at: '2026-10-24T14:20:00Z',
    reviewed_by: 'usr-admin-001',
    reviewed_at: '2026-10-26T11:00:00Z',
  },
  {
    id: 3,
    application_id: 'APP-2026-7734',
    user_id: 'usr-vend-approved-201',
    business_name: 'Vallabh Decoration & Event Management',
    category: 'mandap',
    phone: '9825123401',
    city: 'Godhra',
    state_id: 'GJ',
    notes: 'Experienced wedding setup and royal mandap decorator.',
    status: 'approved',
    rejection_reason: null,
    submitted_at: '2026-06-01T12:00:00Z',
    reviewed_by: 'usr-admin-001',
    reviewed_at: '2026-06-02T09:30:00Z',
  },
];

// Sample Bookings for RBAC (Multi-tenant)
let mockBookings = [
  {
    id: 101,
    booking_code: 'BK-2026-7841',
    customer_id: 'usr-cust-101',
    customer_name: 'Rajeshbhai Patel',
    customer_phone: '9825098765',
    vendor_id: 1,
    vendor_name: 'Vallabh Decoration & Event Management',
    category: 'mandap',
    event_type: 'Wedding',
    event_date: '2026-12-15',
    city_name: 'Godhra',
    state_id: 'GJ',
    venue_address: 'Vrindavan Party Plot, Halol Road, Godhra',
    guest_count: '600 Guests',
    total_amount: 85000,
    paid_amount: 85000,
    status: 'Confirmed',
    payment_status: 'Paid in Full',
    total_booking_amount: 85000,
    non_commissionable_amount: 0,
    eligible_booking_amount: 85000,
    direct_payments_received: 85000,
    booking_status: 'Completed',
    direct_payment_status: 'vendor_confirmed',
    commission_due_5_pct: 4250,
    created_at: '2026-10-25T14:30:00Z',
  },
  {
    id: 102,
    booking_code: 'BK-2026-8912',
    customer_id: 'usr-cust-101',
    customer_name: 'Rajeshbhai Patel',
    customer_phone: '9825098765',
    vendor_id: 5,
    vendor_name: 'Motibaug Party Plot',
    category: 'party_plot',
    event_type: 'Reception',
    event_date: '2026-12-25',
    city_name: 'Godhra',
    state_id: 'GJ',
    venue_address: 'Motibaug Open Lawn, Godhra',
    guest_count: '1,000 Guests',
    total_booking_amount: 110000,
    non_commissionable_amount: 0,
    eligible_booking_amount: 110000,
    direct_payments_received: 50000,
    booking_status: 'Confirmed',
    direct_payment_status: 'customer_confirmed',
    commission_due_5_pct: 5500,
    created_at: '2026-10-29T11:15:00Z',
  },
  {
    id: 103,
    booking_code: 'BK-2026-9204',
    customer_id: 'usr-cust-999',
    customer_name: 'Jigneshbhai Shah',
    customer_phone: '9909012345',
    vendor_id: 1,
    vendor_name: 'Vallabh Decoration & Event Management',
    category: 'mandap',
    event_type: 'Engagement',
    event_date: '2027-01-18',
    city_name: 'Godhra',
    state_id: 'GJ',
    venue_address: 'Bamroli Road, Godhra',
    guest_count: '300 Guests',
    total_booking_amount: 45000,
    non_commissionable_amount: 0,
    eligible_booking_amount: 45000,
    direct_payments_received: 45000,
    booking_status: 'Completed',
    direct_payment_status: 'vendor_confirmed',
    commission_due_5_pct: 2250,
    created_at: '2026-10-30T16:45:00Z',
  },
];

// ==============================================================================
// 1. AUTH & ROLE MANAGEMENT
// ==============================================================================

export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUser(user) {
  currentUser = user ? { ...user } : null;
  return currentUser;
}

export function getCurrentRole() {
  return currentUser ? (currentUser.role || ROLES.CUSTOMER) : ROLES.CUSTOMER;
}

export function getCurrentVendorStatus() {
  return currentUser ? (currentUser.vendor_status || VENDOR_STATUS.NOT_APPLICABLE) : VENDOR_STATUS.NOT_APPLICABLE;
}

export function isApprovedVendor() {
  return !!currentUser && currentUser.role === ROLES.VENDOR && currentUser.vendor_status === VENDOR_STATUS.APPROVED;
}

export function isPendingVendor() {
  return !!currentUser && currentUser.role === ROLES.VENDOR && currentUser.vendor_status === VENDOR_STATUS.PENDING;
}

export function isRejectedVendor() {
  return !!currentUser && currentUser.role === ROLES.VENDOR && currentUser.vendor_status === VENDOR_STATUS.REJECTED;
}

export function isSuspendedVendor() {
  return !!currentUser && currentUser.role === ROLES.VENDOR && currentUser.vendor_status === VENDOR_STATUS.SUSPENDED;
}

export function isAdminOrSuperAdmin() {
  return !!currentUser && (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.SUPER_ADMIN);
}

export function isCityManager() {
  return !!currentUser && currentUser.role === ROLES.CITY_MANAGER;
}

export function isStateManager() {
  return !!currentUser && currentUser.role === ROLES.STATE_MANAGER;
}

export function switchUserRole(userKey) {
  if (SEED_USERS[userKey]) {
    currentUser = { ...SEED_USERS[userKey] };
    return { success: true, user: currentUser };
  }
  return { success: false, message: 'Invalid role key' };
}

export function loginUser(email, password, requestedRole = ROLES.CUSTOMER) {
  if (requestedRole === ROLES.SUPER_ADMIN || email.includes('superadmin')) {
    currentUser = { ...SEED_USERS.super_admin };
  } else if (requestedRole === ROLES.ADMIN || email.includes('admin')) {
    currentUser = { ...SEED_USERS.admin };
  } else if (requestedRole === ROLES.STATE_MANAGER || email.includes('state')) {
    currentUser = { ...SEED_USERS.state_manager };
  } else if (requestedRole === ROLES.CITY_MANAGER || email.includes('city')) {
    currentUser = { ...SEED_USERS.city_manager };
  } else if (requestedRole === 'vendor_pending' || email.includes('pending')) {
    currentUser = { ...SEED_USERS.vendor_pending };
  } else if (requestedRole === 'vendor_rejected' || email.includes('reject')) {
    currentUser = { ...SEED_USERS.vendor_rejected };
  } else if (requestedRole === 'vendor_suspended' || email.includes('suspend')) {
    currentUser = { ...SEED_USERS.vendor_suspended };
  } else if (requestedRole === ROLES.VENDOR || email.includes('vendor')) {
    currentUser = { ...SEED_USERS.vendor };
  } else {
    currentUser = {
      ...SEED_USERS.customer,
      email: email || SEED_USERS.customer.email,
    };
  }
  return { success: true, user: currentUser };
}

export function logoutUser() {
  currentUser = null;
  return { success: true };
}

// Check if user is authorized to perform action
export function isAuthorized(requiredRole) {
  if (!requiredRole) return true;
  if (isAdminOrSuperAdmin()) return true;
  return currentUser.role === requiredRole;
}

// Regional Cross-Boundary Access Guard
export function verifyRegionalAccess(targetStateId, targetCityName) {
  if (!currentUser) return false;
  if (currentUser.status === 'deactivated' || currentUser.status === MANAGER_STATUS.DEACTIVATED) return false;
  if (isAdminOrSuperAdmin()) return true; // Pan-India full access

  if (isStateManager()) {
    return currentUser.assigned_state === targetStateId;
  }

  if (isCityManager()) {
    return currentUser.assigned_city === targetCityName;
  }

  return false;
}

// Location-Based Access Control Guard (Strict Multi-level Isolation)
export function checkLocationAccess(user = currentUser, location = {}) {
  if (!user) {
    return { allowed: false, status: 401, reason: '401 Unauthorized: Not logged in.' };
  }

  if (user.status === 'deactivated' || user.status === MANAGER_STATUS.DEACTIVATED) {
    return { allowed: false, status: 403, reason: '403 Forbidden: Manager account has been deactivated.' };
  }

  // 1. Super Admin has full All-India access
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) {
    return { allowed: true };
  }

  const targetState = location.state_code || location.state_id || location.state;
  const targetCity = location.city_name || location.city;

  // 2. State Manager can access only records in assigned state
  if (user.role === ROLES.STATE_MANAGER) {
    const myState = user.assigned_state || user.assigned_state_code;
    if (targetState && targetState !== myState) {
      return {
        allowed: false,
        status: 403,
        reason: `403 Forbidden: Cross-state access violation. State Manager (${myState}) cannot access records in ${targetState}.`,
      };
    }
    return { allowed: true };
  }

  // 3. City Manager can access only records in assigned city
  if (user.role === ROLES.CITY_MANAGER) {
    const myCity = user.assigned_city || user.assigned_city_name || '';
    const myState = user.assigned_state || user.assigned_state_code;

    if (targetCity && targetCity.toLowerCase() !== myCity.toLowerCase()) {
      return {
        allowed: false,
        status: 403,
        reason: `403 Forbidden: Cross-city access violation. City Manager (${myCity}) cannot access records in ${targetCity}.`,
      };
    }
    if (targetState && targetState !== myState) {
      return {
        allowed: false,
        status: 403,
        reason: `403 Forbidden: Cross-state access violation. City Manager cannot access records in ${targetState}.`,
      };
    }
    return { allowed: true };
  }

  return { allowed: false, status: 403, reason: '403 Forbidden: Insufficient role permissions.' };
}

// Secure Manager Creation & Invitation Workflow
export function createManagerInvitation(creatorUser = currentUser, managerData) {
  if (!creatorUser) {
    return { success: false, status: 401, message: '401 Unauthorized.' };
  }

  // Self-assignment or public assignment blocked
  if (
    creatorUser.role !== ROLES.SUPER_ADMIN &&
    creatorUser.role !== ROLES.ADMIN &&
    creatorUser.role !== ROLES.STATE_MANAGER
  ) {
    return {
      success: false,
      status: 403,
      message: '403 Forbidden: Only authorized Super Admin or permitted State Manager can invite managers.',
    };
  }

  const targetRole = managerData.role;

  // Super Admin can invite State Managers and City Managers
  if (creatorUser.role === ROLES.SUPER_ADMIN || creatorUser.role === ROLES.ADMIN) {
    if (targetRole !== ROLES.STATE_MANAGER && targetRole !== ROLES.CITY_MANAGER) {
      return { success: false, status: 400, message: 'Invalid role requested.' };
    }
  }

  // State Manager restrictions
  if (creatorUser.role === ROLES.STATE_MANAGER) {
    if (!creatorUser.can_manage_city_managers) {
      return {
        success: false,
        status: 403,
        message: '403 Forbidden: Super Admin has not granted permission to manage City Managers.',
      };
    }
    if (targetRole !== ROLES.CITY_MANAGER) {
      return {
        success: false,
        status: 403,
        message: '403 Forbidden: State Manager can only create City Managers, not Super Admin or State Managers.',
      };
    }
    // Must be in their own assigned state
    const assignedState = creatorUser.assigned_state || creatorUser.assigned_state_code;
    const targetState = managerData.assigned_state_code || managerData.state_id || managerData.state;
    if (targetState && targetState !== assignedState) {
      return {
        success: false,
        status: 403,
        message: `403 Forbidden: Cannot create City Manager for state ${targetState}. You are assigned strictly to ${assignedState}.`,
      };
    }
  }

  const newManager = {
    id: `usr-mgr-${Date.now().toString().slice(-6)}`,
    full_name: managerData.name || managerData.full_name,
    phone: managerData.phone,
    email: managerData.email || '',
    role: targetRole,
    assigned_state: managerData.assigned_state_code || managerData.state_id || managerData.state || creatorUser.assigned_state,
    assigned_state_code: managerData.assigned_state_code || managerData.state_id || managerData.state || creatorUser.assigned_state,
    assigned_city: targetRole === ROLES.CITY_MANAGER ? (managerData.assigned_city_name || managerData.city) : null,
    can_approve_vendors: Boolean(managerData.can_approve_vendors),
    can_manage_city_managers: Boolean(managerData.can_manage_city_managers),
    status: MANAGER_STATUS.PENDING_INVITATION,
    created_by: creatorUser.id,
    created_at: new Date().toISOString(),
  };

  return {
    success: true,
    manager: newManager,
    message: `Secure invitation created for ${newManager.full_name} (${targetRole.toUpperCase()}). OTP verification required upon activation.`,
  };
}

// Manager Deactivation & Session Revocation
export function deactivateManager(actorUser = currentUser, managerId, reason) {
  if (!actorUser) {
    return { success: false, status: 401, message: '401 Unauthorized.' };
  }

  if (actorUser.role !== ROLES.SUPER_ADMIN && actorUser.role !== ROLES.ADMIN && actorUser.role !== ROLES.STATE_MANAGER) {
    return { success: false, status: 403, message: '403 Forbidden: Only Admin or Super Admin can deactivate managers.' };
  }

  return {
    success: true,
    manager_id: managerId,
    status: MANAGER_STATUS.DEACTIVATED,
    reason: reason || 'Administrative deactivation.',
    message: `Manager ${managerId} has been deactivated. Active session revoked.`,
  };
}

// Location Responsibility Transfer (Super Admin Only)
export function transferManagerResponsibility(superAdminUser = currentUser, managerId, newLocation = {}) {
  if (!superAdminUser || (superAdminUser.role !== ROLES.SUPER_ADMIN && superAdminUser.role !== ROLES.ADMIN)) {
    return {
      success: false,
      status: 403,
      message: '403 Forbidden: Only Super Admin can transfer manager responsibilities and locations.',
    };
  }

  return {
    success: true,
    manager_id: managerId,
    new_location: newLocation,
    message: `Manager ${managerId} transferred to ${newLocation.state || newLocation.city}.`,
  };
}

// Strict Routing Resolver according to Phase 8
export function resolveAuthenticatedRoute(user = currentUser) {
  if (!user || !user.role) {
    return '/account-setup';
  }

  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN || user.role === ROLES.STATE_MANAGER || user.role === ROLES.CITY_MANAGER) {
    return '/admin';
  }

  if (user.role === ROLES.VENDOR) {
    if (user.vendor_status === VENDOR_STATUS.APPROVED) {
      return '/vendor';
    }
    if (user.vendor_status === VENDOR_STATUS.PENDING) {
      return '/vendor-pending';
    }
    if (user.vendor_status === VENDOR_STATUS.REJECTED) {
      return '/vendor-rejected';
    }
    if (user.vendor_status === VENDOR_STATUS.SUSPENDED) {
      return '/vendor-suspended';
    }
    return '/vendor-pending';
  }

  return '/customer';
}

// Role & Status verification guard for routes
export function verifyRouteAccess(requiredRoute) {
  if (!currentUser) {
    return {
      allowed: false,
      reason: '401 Unauthorized: Please log in with your verified mobile number to access this section.',
      redirectRoute: '/login',
    };
  }

  // Deactivated Manager Check
  if (currentUser.status === 'deactivated' || currentUser.status === MANAGER_STATUS.DEACTIVATED) {
    return {
      allowed: false,
      status: 403,
      reason: '403 Forbidden: Manager account has been deactivated. Please contact Super Admin.',
      redirectRoute: '/login',
    };
  }

  const cleanRoute = (requiredRoute || '').replace(/^\//, '');

  if (isAdminOrSuperAdmin()) {
    return { allowed: true };
  }

  if (cleanRoute === 'admin') {
    if (isCityManager() || isStateManager()) {
      return { allowed: true }; // Regional managers can view regional admin console
    }
    return {
      allowed: false,
      reason: `403 Forbidden: Administrative console requires verified administrator privileges. Current role "${currentUser.role.toUpperCase()}" is restricted.`,
    };
  }

  if (cleanRoute === 'vendor') {
    if (currentUser.role !== ROLES.VENDOR) {
      return {
        allowed: false,
        reason: '403 Forbidden: Vendor Dashboard is strictly restricted to verified event vendor partners.',
      };
    }
    if (currentUser.vendor_status !== VENDOR_STATUS.APPROVED) {
      return {
        allowed: false,
        reason: `403 Forbidden: Vendor Dashboard requires an APPROVED status. Your status is "${(currentUser.vendor_status || 'PENDING').toUpperCase()}".`,
        redirectRoute:
          currentUser.vendor_status === VENDOR_STATUS.REJECTED
            ? '/vendor-rejected'
            : currentUser.vendor_status === VENDOR_STATUS.SUSPENDED
            ? '/vendor-suspended'
            : '/vendor-pending',
      };
    }
    return { allowed: true };
  }

  if (cleanRoute === 'vendor-pending') {
    if (currentUser.role === ROLES.VENDOR && currentUser.vendor_status === VENDOR_STATUS.PENDING) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Only vendors with pending applications can view this page.' };
  }

  if (cleanRoute === 'vendor-rejected') {
    if (currentUser.role === ROLES.VENDOR && currentUser.vendor_status === VENDOR_STATUS.REJECTED) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Only vendors with rejected applications can view this page.' };
  }

  if (cleanRoute === 'vendor-suspended') {
    if (currentUser.role === ROLES.VENDOR && currentUser.vendor_status === VENDOR_STATUS.SUSPENDED) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Only suspended vendors can view this page.' };
  }

  return { allowed: true };
}

// Self-role tampering prevention
export function updateUserRole(targetUserId, newRole, newStatus) {
  if (!isAdminOrSuperAdmin()) {
    return {
      success: false,
      message: 'Unauthorized: Only Admin or Super Admin can assign or change user roles or approval statuses.',
    };
  }

  return {
    success: true,
    message: `User ${targetUserId} role updated to ${newRole}${newStatus ? ` with status ${newStatus}` : ''}.`,
  };
}

// Suspend vendor
export function suspendVendor(vendorId, reason) {
  if (!isAdminOrSuperAdmin()) {
    return { success: false, message: '403 Forbidden: Only Admin can suspend vendor accounts.' };
  }
  return { success: true, message: `Vendor #${vendorId} suspended. Reason: ${reason}` };
}

// Vendor applications workflow
export function getVendorApplications() {
  if (isAdminOrSuperAdmin()) {
    return mockVendorApplications;
  }
  if (isStateManager()) {
    return mockVendorApplications.filter((a) => a.state_id === currentUser.assigned_state);
  }
  if (isCityManager()) {
    return mockVendorApplications.filter((a) => a.city === currentUser.assigned_city);
  }
  return mockVendorApplications.filter((app) => app.user_id === currentUser.id);
}

export function submitVendorApplication(appData) {
  const newApp = {
    id: mockVendorApplications.length + 1,
    application_id: `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    user_id: currentUser.id,
    business_name: appData.business_name,
    category: appData.category,
    phone: appData.phone,
    city: appData.city || 'Godhra',
    state_id: appData.state_id || 'GJ',
    notes: appData.notes || '',
    status: VENDOR_STATUS.PENDING,
    rejection_reason: null,
    submitted_at: new Date().toISOString(),
    reviewed_by: null,
    reviewed_at: null,
  };

  mockVendorApplications.unshift(newApp);

  if (currentUser.id === newApp.user_id) {
    currentUser.role = ROLES.VENDOR;
    currentUser.vendor_status = VENDOR_STATUS.PENDING;
    currentUser.business_name = newApp.business_name;
    currentUser.application_id = newApp.application_id;
  }

  return { success: true, application: newApp };
}

export function reviewVendorApplication(applicationId, newStatus, rejectionReason = null) {
  if (!isAdminOrSuperAdmin() && !isStateManager()) {
    return {
      success: false,
      message: '403 Forbidden: Only Admin or State Manager can approve or reject vendor applications.',
    };
  }

  const app = mockVendorApplications.find((a) => a.id === applicationId || a.application_id === applicationId);
  if (!app) return { success: false, message: 'Application not found.' };

  app.status = newStatus;
  app.reviewed_by = currentUser.id;
  app.reviewed_at = new Date().toISOString();
  if (newStatus === VENDOR_STATUS.REJECTED) {
    app.rejection_reason = rejectionReason || 'Application details did not satisfy verification criteria.';
  }

  return { success: true, application: app, message: `Application ${app.application_id} marked as ${newStatus.toUpperCase()}.` };
}

// Multi-tenant Bookings Access
export function getCustomerBookings() {
  if (isAdminOrSuperAdmin()) {
    return mockBookings;
  }
  if (isStateManager()) {
    return mockBookings.filter((b) => b.state_id === currentUser.assigned_state);
  }
  if (isCityManager()) {
    return mockBookings.filter((b) => b.city_name === currentUser.assigned_city);
  }
  return mockBookings.filter((b) => b.customer_id === currentUser.id);
}

export function getVendorBookings() {
  if (isAdminOrSuperAdmin()) {
    return mockBookings;
  }
  if (currentUser.role !== ROLES.VENDOR || currentUser.vendor_status !== VENDOR_STATUS.APPROVED) {
    return [];
  }
  const myVendorId = currentUser.vendor_id || 1;
  return mockBookings.filter((b) => b.vendor_id === myVendorId);
}

export function updateBookingStatusByVendor(bookingId, newStatus) {
  if (!isAdminOrSuperAdmin() && (currentUser.role !== ROLES.VENDOR || currentUser.vendor_status !== VENDOR_STATUS.APPROVED)) {
    return {
      success: false,
      message: '403 Forbidden: Only approved vendors can accept or reject bookings.',
    };
  }

  const myVendorId = currentUser.vendor_id || 1;
  const booking = mockBookings.find((b) => b.id === bookingId);
  if (!booking) {
    return { success: false, message: 'Booking not found.' };
  }

  if (!isAdminOrSuperAdmin() && booking.vendor_id !== myVendorId) {
    return {
      success: false,
      message: '403 Forbidden: You can only accept or reject bookings assigned to your vendor profile.',
    };
  }

  booking.status = newStatus;
  return {
    success: true,
    booking,
    message: `Booking ${booking.booking_code} marked as ${newStatus}.`,
  };
}

export function updateVendorApproval(vendorId, newStatus) {
  if (!isAdminOrSuperAdmin()) {
    return {
      success: false,
      message: '403 Forbidden: Only Admin can approve or reject vendor registrations.',
    };
  }

  return {
    success: true,
    message: `Vendor #${vendorId} status set to ${newStatus}.`,
  };
}

// Company Financials (Superadmin / Admin Only!)
const companyFinancials = {
  financial_year: '2026-2027',
  total_turnover: 1845000,
  vendor_payouts: 1485000,
  platform_commission: 360000,
  operational_costs: 85000,
  net_company_profit: 275000,
  active_bookings: 34,
  completed_events: 18,
  pending_vendor_approvals: 1,
};

export function getCompanyFinancials() {
  if (!isAdminOrSuperAdmin()) {
    return {
      success: false,
      authorized: false,
      error: '403 Forbidden',
      message: '403 Forbidden: Internal financial records and company profits are strictly restricted to Superadmin.',
    };
  }

  return {
    success: true,
    authorized: true,
    financials: companyFinancials,
  };
}
