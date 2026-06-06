import emailjs from '@emailjs/browser';

// ============================================
// EMAILJS CONFIGURATION
// Replace these with your actual keys from EmailJS
// ============================================
const EMAILJS_PUBLIC_KEY = "PqHBn1Bi64mEz68kd";
const EMAILJS_SERVICE_ID = "service_a8tkha3";
const EMAILJS_TEMPLATE_ID = "template_x3kvbms";

let isEmailJsConfigured = true;

try {
  if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
    isEmailJsConfigured = false;
  } else {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
} catch (e) {
  isEmailJsConfigured = false;
}

/**
 * Sends a 6-digit OTP to the specified email address using EmailJS.
 * If EmailJS is not configured, it will simulate sending and return a mock success.
 * @param {string} email 
 * @param {string} otp 
 * @returns Promise<boolean> success
 */
export async function sendEmailOTP(email, otp) {
  if (!isEmailJsConfigured) {
    console.warn("EmailJS is not configured! Simulating email send. Your OTP is:", otp);
    alert(`[DEVELOPER MOCK MODE]\n\nEmailJS is not configured yet.\n\nAn email would have been sent to ${email} with the OTP: ${otp}\n\nPlease enter this OTP in the verification box.`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true; // Simulate success
  }

  try {
    const templateParams = {
      to_email: email,
      otp_code: otp,
      app_name: "FinTrack Dashboard"
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    return response.status === 200;
  } catch (error) {
    console.error("Failed to send OTP via EmailJS:", error);
    return false;
  }
}

/**
 * Generates a random 6-digit numeric string
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
