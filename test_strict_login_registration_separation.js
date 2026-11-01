// ==============================================================================
// SHUBH CELEBRATIONS – STRICT LOGIN & REGISTRATION SEPARATION TEST SUITE
// Tests:
// Case 1: New number → Login → Blocked (No OTP sent; 'account_not_registered')
// Case 2: New number → Register → OTP → Account created strictly as customer
// Case 3: Registered number → Login → OTP → Successful login (no duplicate created)
// Case 4: Wrong OTP → Login blocked (counter decrements, locked after 5 fails)
// Case 5: Existing vendor/admin → Correct role-based access preserved
// Case 6: Duplicate registration → Blocked ('account_already_registered')
// ==============================================================================

import assert from 'assert';
import {
  sendMobileOtp,
  verifyMobileOtp,
  clearActiveOtpSessionsForTest,
  checkUserRegistrationStatus,
  registerTestPhone,
} from './src/services/authService.js';
import {
  ROLES,
  VENDOR_STATUS,
  resolveAuthenticatedRoute,
} from './src/services/rbacService.js';

let passedTests = 0;
let totalTests = 0;

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`Test ${totalTests}: ${name}... PASS ✓`);
  } catch (e) {
    console.error(`Test ${totalTests}: ${name}... FAIL ✗`);
    console.error(e);
    process.exit(1);
  }
}

async function main() {
  console.log('=================================================================');
  console.log('  SHUBH CELEBRATIONS – STRICT LOGIN & REGISTRATION SEPARATION   ');
  console.log('=================================================================\n');

  clearActiveOtpSessionsForTest();

  // Generate unique phone numbers for fresh testing
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const brandNewPhone1 = '9711' + randomSuffix;
  const brandNewPhone2 = '9722' + randomSuffix;
  const adminPhone = '9825123400';
  const vendorPhone = '9825123401';
  const existingCustomerPhone = '9825098765';

  // ----------------------------------------------------------------------------
  // CASE 1: NEW NUMBER → LOGIN → BLOCKED
  // Before sending WhatsApp/SMS OTP, check server-side. If unregistered, no OTP!
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 1: New number attempting Login is strictly blocked without sending OTP', async () => {
    clearActiveOtpSessionsForTest();

    // 1. Check registration status directly
    const status = await checkUserRegistrationStatus(brandNewPhone1);
    assert(status.isRegistered === false, 'New phone must not be registered');

    // 2. Attempt Login (isSignUp: false)
    const loginRes = await sendMobileOtp(brandNewPhone1, { isSignUp: false });
    assert(loginRes.success === false, 'Login must fail for unregistered number');
    assert(loginRes.error === 'account_not_registered', 'Error code must be account_not_registered');
    assert(
      loginRes.message === 'This mobile number is not registered. Please register first.',
      'Message must instruct user to register'
    );
  });

  // ----------------------------------------------------------------------------
  // CASE 2: NEW NUMBER → REGISTER → OTP → ACCOUNT CREATED
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 2: New number registration sends OTP and creates verified customer account', async () => {
    clearActiveOtpSessionsForTest();

    // 1. Send OTP for Registration (isSignUp: true)
    const sendRes = await sendMobileOtp(brandNewPhone1, {
      isSignUp: true,
      fullName: 'Aarav Sharma',
    });
    assert(sendRes.success === true, 'Registration OTP must be sent successfully');
    assert(sendRes.cooldownSeconds === 60, '60s cooldown enforced');

    // 2. Verify OTP with Master Bypass 123456
    const verifyRes = await verifyMobileOtp(brandNewPhone1, '123456', {
      isSignUp: true,
      fullName: 'Aarav Sharma',
    });

    assert(verifyRes.success === true, 'Registration OTP verification must succeed');
    assert(verifyRes.user !== null, 'Authenticated user object returned');
    assert(verifyRes.user.phone === brandNewPhone1, 'Phone matches registered number');
    assert(verifyRes.user.full_name === 'Aarav Sharma', 'Full name preserved');
    assert(verifyRes.user.role === ROLES.CUSTOMER, 'Role strictly defaults to CUSTOMER');
    assert(verifyRes.user.vendor_status === VENDOR_STATUS.NOT_APPLICABLE, 'Vendor status is not_applicable');
    assert(verifyRes.user.id && verifyRes.user.id.length === 36, 'Valid UUID assigned');

    // Confirm that the number is now recognized as registered
    const postRegStatus = await checkUserRegistrationStatus(brandNewPhone1);
    assert(postRegStatus.isRegistered === true, 'Number is now officially registered');
  });

  // ----------------------------------------------------------------------------
  // CASE 3: REGISTERED NUMBER → LOGIN → OTP → SUCCESSFUL LOGIN
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 3: Registered number login sends OTP and logs in without creating duplicate', async () => {
    clearActiveOtpSessionsForTest();

    // 1. Send OTP for Login (isSignUp: false) on the newly registered number
    const sendRes = await sendMobileOtp(brandNewPhone1, { isSignUp: false });
    assert(sendRes.success === true, 'Registered number allowed to receive Login OTP');

    // 2. Verify Login OTP
    const verifyRes = await verifyMobileOtp(brandNewPhone1, '123456', { isSignUp: false });
    assert(verifyRes.success === true, 'Login OTP verification must succeed');
    assert(verifyRes.user.phone === brandNewPhone1, 'Logged in with correct phone');
    assert(verifyRes.user.role === ROLES.CUSTOMER, 'Customer role preserved');
    assert(verifyRes.user.full_name === 'Aarav Sharma', 'Existing full name preserved');
  });

  // ----------------------------------------------------------------------------
  // CASE 4: WRONG OTP → LOGIN BLOCKED & ATTEMPTS DECREMENTED
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 4: Wrong OTP blocks login, decrements attempts, and locks session', async () => {
    clearActiveOtpSessionsForTest();

    // Initiate fresh login
    await sendMobileOtp(brandNewPhone1, { isSignUp: false });

    // Attempt 1: Wrong code
    const try1 = await verifyMobileOtp(brandNewPhone1, '000000', { isSignUp: false });
    assert(try1.success === false, 'Wrong OTP must fail');
    assert(try1.error === 'invalid_otp', 'Error code must be invalid_otp');
    assert(try1.remainingAttempts === 4, 'Remaining attempts must be 4');

    // Attempts 2, 3, 4
    await verifyMobileOtp(brandNewPhone1, '111111', { isSignUp: false });
    await verifyMobileOtp(brandNewPhone1, '222222', { isSignUp: false });
    await verifyMobileOtp(brandNewPhone1, '333333', { isSignUp: false });

    // Attempt 5: Final wrong attempt locks out
    const try5 = await verifyMobileOtp(brandNewPhone1, '444444', { isSignUp: false });
    assert(try5.success === false, '5th wrong attempt must fail');
    assert(try5.error === 'too_many_attempts', 'Session must be locked out with too_many_attempts');

    // Attempt 6: Locked session blocks even if master code is used
    const try6 = await verifyMobileOtp(brandNewPhone1, '123456', { isSignUp: false });
    assert(try6.success === false, 'Locked session blocks verification');
    assert(try6.error === 'too_many_attempts', 'Session remains locked');
  });

  // ----------------------------------------------------------------------------
  // CASE 5: EXISTING VENDOR / ADMIN → CORRECT ROLE-BASED ACCESS PRESERVED
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 5: Existing Admin & Vendor logins preserve elevated roles and dashboard routing', async () => {
    clearActiveOtpSessionsForTest();

    // 1. Admin Login
    const adminSend = await sendMobileOtp(adminPhone, { isSignUp: false });
    assert(adminSend.success === true, 'Admin phone sends OTP');
    const adminVerify = await verifyMobileOtp(adminPhone, '123456', { isSignUp: false });
    assert(adminVerify.success === true, 'Admin verified');
    assert(adminVerify.user.role === ROLES.ADMIN, 'Admin role strictly preserved (not customer)');
    const adminRoute = resolveAuthenticatedRoute(adminVerify.user);
    assert(adminRoute === '/admin', 'Admin routes to /admin dashboard');

    clearActiveOtpSessionsForTest();

    // 2. Approved Vendor Login
    const vendorSend = await sendMobileOtp(vendorPhone, { isSignUp: false });
    assert(vendorSend.success === true, 'Vendor phone sends OTP');
    const vendorVerify = await verifyMobileOtp(vendorPhone, '123456', { isSignUp: false });
    assert(vendorVerify.success === true, 'Vendor verified');
    assert(vendorVerify.user.role === ROLES.VENDOR, 'Vendor role strictly preserved');
    assert(vendorVerify.user.vendor_status === VENDOR_STATUS.APPROVED, 'Vendor status is approved');
    const vendorRoute = resolveAuthenticatedRoute(vendorVerify.user);
    assert(vendorRoute === '/vendor', 'Approved vendor routes to /vendor dashboard');
  });

  // ----------------------------------------------------------------------------
  // CASE 6: DUPLICATE REGISTRATION → PREVENTED
  // ----------------------------------------------------------------------------
  await runAsyncTest('Case 6: Duplicate registration on an already registered number is strictly rejected', async () => {
    clearActiveOtpSessionsForTest();

    // Attempt to register brandNewPhone1 again (already registered in Case 2)
    const dupSend = await sendMobileOtp(brandNewPhone1, {
      isSignUp: true,
      fullName: 'Duplicate Impersonator',
    });

    assert(dupSend.success === false, 'Duplicate registration OTP send must be blocked');
    assert(dupSend.error === 'account_already_registered', 'Error code must be account_already_registered');
    assert(
      dupSend.message === 'Account already registered with this mobile number. Please log in.',
      'Message must instruct user to log in'
    );

    // Also verify duplicate registration block on seed customer
    const seedDupSend = await sendMobileOtp(existingCustomerPhone, {
      isSignUp: true,
      fullName: 'Duplicate Test',
    });
    assert(seedDupSend.success === false, 'Seed customer duplicate registration blocked');
    assert(seedDupSend.error === 'account_already_registered', 'Error code is account_already_registered');
  });

  console.log('\n=================================================================');
  console.log(`  ALL ${passedTests} / ${totalTests} STRICT SEPARATION TESTS PASSED (100% GREEN)  `);
  console.log('=================================================================\n');
}

main();
