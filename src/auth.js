import { auth } from './firebase.js';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { sendEmailOTP, generateOTP } from './email.js';

// Elements
const authModal = document.getElementById('auth-modal');
const logoutBtn = document.getElementById('logout-btn');

// Views
const viewMain = document.getElementById('auth-view-main');
const viewOtp = document.getElementById('auth-view-otp');
const viewForgotEmail = document.getElementById('auth-view-forgot-email');
const viewForgotReset = document.getElementById('auth-view-forgot-reset');

// View 1 Elements
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authConfirmGroup = document.getElementById('auth-confirm-group');
const authConfirmPassword = document.getElementById('auth-confirm-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authForgotLink = document.getElementById('auth-forgot-link');
const authForgotWrap = document.getElementById('auth-forgot-wrap');

// View 2 Elements
const otpForm = document.getElementById('otp-form');
const otpInput = document.getElementById('otp-input');
const otpEmailDisplay = document.getElementById('otp-email-display');
const otpVerifyBtn = document.getElementById('otp-verify-btn');
const otpBackLink = document.getElementById('otp-back-link');

// View 3 Elements
const forgotEmailForm = document.getElementById('forgot-email-form');
const forgotEmailInput = document.getElementById('forgot-email-input');
const forgotSendBtn = document.getElementById('forgot-send-btn');
const forgotBackLink = document.getElementById('forgot-back-link');

// View 4 Elements
const forgotResetForm = document.getElementById('forgot-reset-form');
const resetPasswordInput = document.getElementById('reset-password-input');
const resetConfirmInput = document.getElementById('reset-confirm-input');
const resetSubmitBtn = document.getElementById('reset-submit-btn');

// State
let isLoginMode = true;
let currentUser = null;

// OTP Flow State
let currentOTP = null;
let pendingEmail = null;
let pendingPassword = null;
let otpPurpose = null; // 'register' | 'forgot'

// Check Firebase Config
let isFirebaseConfigured = true;
try {
  if (!auth.app.options.apiKey || auth.app.options.apiKey === "YOUR_API_KEY") {
    isFirebaseConfigured = false;
  }
} catch (e) {
  isFirebaseConfigured = false;
}

export function initAuth(onUserChangeCallback) {
  if (!isFirebaseConfigured) {
    console.warn("Firebase is not configured! Mock Auth Mode active.");
    setupMockEventListeners(onUserChangeCallback);
    
    // Check if we have a persisted session
    const savedSession = localStorage.getItem('mock-user-session');
    if (savedSession) {
      try {
        currentUser = JSON.parse(savedSession);
        hideAuthModal();
        onUserChangeCallback(currentUser);
      } catch (e) {
        switchView('main');
        showAuthModal();
        onUserChangeCallback(null);
      }
    } else {
      // Show modal on load for mock
      switchView('main');
      showAuthModal();
      onUserChangeCallback(null);
    }
    return;
  }

  // Real Firebase
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
      hideAuthModal();
    } else {
      switchView('main');
      showAuthModal();
    }
    onUserChangeCallback(user);
  });

  setupRealEventListeners();
}

export function getCurrentUser() {
  return currentUser;
}

// ------------------------------
// UI HELPERS
// ------------------------------

function showAuthModal() {
  authModal.classList.add('active');
}

function hideAuthModal() {
  authModal.classList.remove('active');
  resetAllForms();
}

function switchView(viewName) {
  viewMain.style.display = 'none';
  viewOtp.style.display = 'none';
  viewForgotEmail.style.display = 'none';
  viewForgotReset.style.display = 'none';

  if (viewName === 'main') viewMain.style.display = 'block';
  if (viewName === 'otp') viewOtp.style.display = 'block';
  if (viewName === 'forgot-email') viewForgotEmail.style.display = 'block';
  if (viewName === 'forgot-reset') viewForgotReset.style.display = 'block';
}

function resetAllForms() {
  authForm.reset();
  otpForm.reset();
  forgotEmailForm.reset();
  forgotResetForm.reset();

  authSubmitBtn.disabled = false;
  otpVerifyBtn.disabled = false;
  forgotSendBtn.disabled = false;
  resetSubmitBtn.disabled = false;
  
  authSubmitBtn.textContent = isLoginMode ? 'Login' : 'Register';
  otpVerifyBtn.textContent = 'Verify OTP';
  forgotSendBtn.textContent = 'Send Reset Mail';
  resetSubmitBtn.textContent = 'Reset Password';

  currentOTP = null;
  pendingEmail = null;
  pendingPassword = null;
  otpPurpose = null;
}

function setLoginMode(isLogin) {
  isLoginMode = isLogin;
  if (isLogin) {
    tabLogin.style.background = 'var(--primary-color)';
    tabLogin.style.color = 'white';
    tabRegister.style.background = 'var(--bg-hover)';
    tabRegister.style.color = 'var(--text)';
    authConfirmGroup.style.display = 'none';
    authConfirmPassword.removeAttribute('required');
    authForgotWrap.style.display = 'block';
    authSubmitBtn.textContent = 'Login';
  } else {
    tabRegister.style.background = 'var(--primary-color)';
    tabRegister.style.color = 'white';
    tabLogin.style.background = 'var(--bg-hover)';
    tabLogin.style.color = 'var(--text)';
    authConfirmGroup.style.display = 'block';
    authConfirmPassword.setAttribute('required', 'true');
    authForgotWrap.style.display = 'none';
    authSubmitBtn.textContent = 'Register';
  }
}

// ------------------------------
// MOCK AUTHENTICATION LOGIC
// ------------------------------

function setupMockEventListeners(callback) {
  // Navigation
  tabLogin.addEventListener('click', () => setLoginMode(true));
  tabRegister.addEventListener('click', () => setLoginMode(false));
  
  authForgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('forgot-email');
  });

  otpBackLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('main');
  });

  forgotBackLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('main');
  });

  // MAIN FORM SUBMIT (Mock)
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;

    if (isLoginMode) {
      // MOCK LOGIN: Check mock database
      const mockDb = JSON.parse(localStorage.getItem('mock-user-db')) || {};
      if (!mockDb[email]) {
        alert("Account not found. Please register first.");
        return;
      }
      if (mockDb[email] !== password) {
        alert("Incorrect password!");
        return;
      }

      const mockUid = 'mock-' + btoa(email).replace(/=/g, '');
      currentUser = { uid: mockUid, email: email };
      localStorage.setItem('mock-user-session', JSON.stringify(currentUser));
      hideAuthModal();
      callback(currentUser);
    } else {
      // MOCK REGISTER
      const confirmPass = authConfirmPassword.value;
      if (password !== confirmPass) {
        alert("Passwords do not match!");
        return;
      }

      if (password.length < 6) {
        alert("Password must contain at least 6 characters.");
        return;
      }
      
      const mockDb = JSON.parse(localStorage.getItem('mock-user-db')) || {};
      if (mockDb[email]) {
        alert("This email is already registered! Please login instead.");
        return;
      }
      
      authSubmitBtn.disabled = true;
      authSubmitBtn.textContent = 'Sending OTP...';

      pendingEmail = email;
      pendingPassword = password;
      otpPurpose = 'register';
      currentOTP = generateOTP();

      const success = await sendEmailOTP(email, currentOTP);
      if (success) {
        otpEmailDisplay.textContent = email;
        switchView('otp');
      } else {
        alert("Failed to send OTP.");
      }
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = 'Register';
    }
  });

  // OTP VERIFY (Mock)
  otpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputOTP = otpInput.value;

    if (inputOTP !== currentOTP) {
      alert("Invalid OTP! Try again.");
      return;
    }

    if (otpPurpose === 'register') {
      // Complete mock registration
      const mockDb = JSON.parse(localStorage.getItem('mock-user-db')) || {};
      mockDb[pendingEmail] = pendingPassword;
      localStorage.setItem('mock-user-db', JSON.stringify(mockDb));

      const mockUid = 'mock-' + btoa(pendingEmail).replace(/=/g, '');
      currentUser = { uid: mockUid, email: pendingEmail };
      localStorage.setItem('mock-user-session', JSON.stringify(currentUser));
      hideAuthModal();
      callback(currentUser);
    } else if (otpPurpose === 'forgot') {
      // Move to reset password screen
      switchView('forgot-reset');
    }
  });

  // FORGOT EMAIL REQUEST (Mock)
  forgotEmailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    pendingEmail = forgotEmailInput.value;
    otpPurpose = 'forgot';
    currentOTP = generateOTP();

    forgotSendBtn.disabled = true;
    forgotSendBtn.textContent = 'Sending...';

    const success = await sendEmailOTP(pendingEmail, currentOTP);
    if (success) {
      otpEmailDisplay.textContent = pendingEmail;
      switchView('otp');
    } else {
      alert("Failed to send OTP.");
    }

    forgotSendBtn.disabled = false;
    forgotSendBtn.textContent = 'Send Reset Mail';
  });

  // FORGOT RESET PASSWORD (Mock)
  forgotResetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPass = resetPasswordInput.value;
    const confirmPass = resetConfirmInput.value;

    if (newPass !== confirmPass) {
      alert("Passwords do not match!");
      return;
    }

    // Update mock database password
    const mockDb = JSON.parse(localStorage.getItem('mock-user-db')) || {};
    mockDb[pendingEmail] = newPass;
    localStorage.setItem('mock-user-db', JSON.stringify(mockDb));

    // Go back to login page
    alert("Password reset successfully! Please login with your new password.");
    switchView('main');
    setLoginMode(true);
  });

  // LOGOUT
  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('mock-user-session');
    switchView('main');
    showAuthModal();
    callback(currentUser);
  });
}

// ------------------------------
// REAL FIREBASE LOGIC
// ------------------------------

function setupRealEventListeners() {
  // Navigation
  tabLogin.addEventListener('click', () => setLoginMode(true));
  tabRegister.addEventListener('click', () => setLoginMode(false));
  
  authForgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('forgot-email');
  });

  otpBackLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('main');
  });

  forgotBackLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('main');
  });

  // MAIN FORM SUBMIT
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;

    try {
      if (isLoginMode) {
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = 'Logging in...';
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const confirmPass = authConfirmPassword.value;
        if (password !== confirmPass) {
          alert("Passwords do not match!");
          return;
        }

        if (password.length < 6) {
          alert("Password must contain at least 6 characters.");
          return;
        }

        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = 'Checking...';

        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.length > 0) {
            alert("email already in use");
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = 'Register';
            return;
          }
        } catch (error) {
          // If Email Enumeration Protection is enabled, fetchSignInMethodsForEmail might throw or just return empty.
          // We will proceed and let the final createUserWithEmailAndPassword catch it if necessary.
          if (error.code !== 'auth/operation-not-allowed') {
             console.warn("Could not pre-check email existence:", error);
          }
        }

        authSubmitBtn.textContent = 'Sending OTP...';

        pendingEmail = email;
        pendingPassword = password;
        otpPurpose = 'register';
        currentOTP = generateOTP();

        const success = await sendEmailOTP(email, currentOTP);
        if (success) {
          otpEmailDisplay.textContent = email;
          switchView('otp');
        } else {
          alert("Failed to send OTP.");
        }
      }
    } catch (error) {
      alert(error.message);
    } finally {
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = isLoginMode ? 'Login' : 'Register';
    }
  });

  // OTP VERIFY
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputOTP = otpInput.value;

    if (inputOTP !== currentOTP) {
      alert("Invalid OTP! Try again.");
      return;
    }

    if (otpPurpose === 'register') {
      try {
        otpVerifyBtn.disabled = true;
        otpVerifyBtn.textContent = 'Creating Account...';
        await createUserWithEmailAndPassword(auth, pendingEmail, pendingPassword);
        // Firebase handles the rest (onAuthStateChanged will fire and hide modal)
      } catch (error) {
        alert(error.message);
        otpVerifyBtn.disabled = false;
        otpVerifyBtn.textContent = 'Verify OTP';
      }
    } else if (otpPurpose === 'forgot') {
      switchView('forgot-reset');
    }
  });

  // FORGOT EMAIL REQUEST (Firebase Native)
  forgotEmailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    pendingEmail = forgotEmailInput.value;

    try {
      forgotSendBtn.disabled = true;
      forgotSendBtn.textContent = 'Sending Link...';

      await sendPasswordResetEmail(auth, pendingEmail);
      
      alert("A password reset link has been securely sent to your email! Please check your inbox, click the link to reset your password, and then log in here.");
      switchView('main');
      setLoginMode(true);
      
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      forgotSendBtn.disabled = false;
      forgotSendBtn.textContent = 'Send Reset Mail';
    }
  });

  // FORGOT RESET PASSWORD
  forgotResetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = resetPasswordInput.value;
    const confirmPass = resetConfirmInput.value;

    if (newPass !== confirmPass) {
      alert("Passwords do not match!");
      return;
    }

    try {
      resetSubmitBtn.disabled = true;
      resetSubmitBtn.textContent = 'Updating...';
      
      // In a real app, this MUST be done with a Cloud Function or sendPasswordResetEmail().
      // For demonstration, we will alert the user if they use Real Firebase.
      
      alert("Password updated (Simulated). Real Firebase requires a backend to forcefully reset passwords without a login. Please login with your new password.");
      
      resetSubmitBtn.disabled = false;
      resetSubmitBtn.textContent = 'Reset Password';
      switchView('main');
      setLoginMode(true);
    } catch (error) {
      alert(error.message);
      resetSubmitBtn.disabled = false;
      resetSubmitBtn.textContent = 'Reset Password';
    }
  });

  // LOGOUT
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert("Error logging out: " + error.message);
    }
  });
}
