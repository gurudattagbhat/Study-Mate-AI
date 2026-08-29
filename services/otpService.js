const nodemailer = require('nodemailer');

// In-memory fallback OTP store
const activeOtps = new Map();

/**
 * Get Nodemailer Transporter dynamically with current process.env variables.
 * Explicitly configured for cloud hosts (Render, Vercel, Heroku) by forcing IPv4 (family: 4)
 * and adding socket timeouts to prevent hanging connection requests.
 */
function getTransporter() {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!user || !pass) {
    console.warn('⚠️ [Nodemailer Warning] EMAIL_USER or EMAIL_PASS is not set in environment variables!');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL/TLS
    auth: {
      user: user,
      pass: pass
    },
    family: 4,                  // Force IPv4 to prevent IPv6 DNS/routing connection timeouts on Render
    connectionTimeout: 10000,  // 10s socket connection timeout
    greetingTimeout: 10000,    // 10s SMTP greeting timeout
    socketTimeout: 15000,      // 15s socket activity timeout
    dnsTimeout: 5000           // 5s DNS resolution timeout
  });
}

/**
 * Verify SMTP Transporter connection for diagnostic checks
 */
async function verifySmtpConnection() {
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    return { 
      success: false, 
      message: 'EMAIL_USER or EMAIL_PASS environment variables are not configured in Render Dashboard.' 
    };
  }

  const transporter = getTransporter();
  try {
    const verifyPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP connection verification timed out after 8 seconds.')), 8000)
    );
    await Promise.race([verifyPromise, timeoutPromise]);
    return { success: true, message: 'Gmail SMTP connection verified successfully!' };
  } catch (err) {
    return { success: false, message: `SMTP Verification Failed: ${err.message}` };
  }
}

/**
 * Send real 6-Digit OTP Email via Gmail SMTP
 */
async function sendOtpEmail(email, otpCode) {
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    console.error('❌ [Nodemailer Error] Cannot send email: EMAIL_USER or EMAIL_PASS environment variables are missing on Render.');
    return { 
      success: false, 
      error: 'SMTP credentials missing on server. Please set EMAIL_USER and EMAIL_PASS environment variables in Render Dashboard.' 
    };
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `"Study Mate AI" <${emailUser}>`,
    to: email,
    subject: `🔐 Your Study Mate AI Verification Code: ${otpCode}`,
    html: `
      <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #059669, #D97706); border-radius: 12px; line-height: 48px; font-size: 24px; color: white; margin-bottom: 8px;">🧠</div>
          <h2 style="margin: 0; color: #0F172A; font-size: 22px;">Study Mate <span style="color: #059669;">AI</span></h2>
          <p style="margin: 4px 0 0 0; color: #64748B; font-size: 14px;">Academic Verification System</p>
        </div>

        <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 28px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h3 style="margin-top: 0; color: #0F172A; font-size: 18px;">Account Verification OTP Code</h3>
          <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
            Use the 6-digit verification code below to complete your Study Mate AI registration or password reset:
          </p>

          <div style="background-color: #ECFDF5; border: 2px dashed #059669; border-radius: 10px; padding: 16px; margin: 20px 0; display: inline-block;">
            <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #059669;">${otpCode}</span>
          </div>

          <p style="color: #94A3B8; font-size: 13px; margin-top: 20px;">
            ⏰ This verification code is valid for <strong>15 minutes</strong>. If you did not request this code, please ignore this email.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94A3B8;">
          <p>© 2026 Study Mate AI — Intelligent Academic Assistant System</p>
        </div>
      </div>
    `
  };

  try {
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gmail SMTP dispatch timed out (10s limit). Verify EMAIL_PASS App Password & Render environment variables.')), 10000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`📧 [Nodemailer Gmail] OTP Email sent to ${email} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Nodemailer Error] Failed to send email via Gmail:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate 6-digit OTP code and send via email
 */
async function sendOtp(email) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  const normalizedEmail = email.toLowerCase().trim();

  activeOtps.set(normalizedEmail, {
    code: otpCode,
    expiresAt
  });

  // Trigger real email dispatch
  const emailResult = await sendOtpEmail(normalizedEmail, otpCode);

  return {
    success: true,
    email: normalizedEmail,
    otpCode,
    emailSent: emailResult.success,
    message: emailResult.success 
      ? `Verification OTP sent to ${normalizedEmail} via Gmail!` 
      : `OTP code generated for ${normalizedEmail}. (Demo OTP Code: ${otpCode})`
  };
}

/**
 * Verify OTP code for given email
 */
function verifyOtp(email, inputCode) {
  const normalizedEmail = email.toLowerCase().trim();
  const record = activeOtps.get(normalizedEmail);
  if (!record) {
    return { success: false, message: 'No active OTP request found for this email address.' };
  }

  if (Date.now() > record.expiresAt) {
    activeOtps.delete(normalizedEmail);
    return { success: false, message: 'OTP verification code has expired. Please request a new one.' };
  }

  if (record.code !== inputCode.trim()) {
    return { success: false, message: 'Invalid OTP verification code entered.' };
  }

  // Clear OTP on successful verification
  activeOtps.delete(normalizedEmail);
  return { success: true, message: 'OTP verified successfully!' };
}

module.exports = {
  sendOtp,
  verifyOtp,
  sendOtpEmail,
  verifySmtpConnection
};

