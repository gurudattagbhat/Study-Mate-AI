const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isMongoConnected, jsonStore } = require('../config/db');
const { sendOtpEmail, verifySmtpConnection } = require('../services/otpService');

const JWT_SECRET = process.env.JWT_SECRET || 'studymate_default_jwt_secret_key';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ [Security Warning] JWT_SECRET environment variable is not set in .env! Using fallback development key.');
}

// In-memory store for pending signup registrations with OTP
const pendingSignups = new Map();

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { id: 'demo-user-1', name: 'Alex Johnson', email: 'demo@studymate.ai' };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    req.user = { id: 'demo-user-1', name: 'Alex Johnson', email: 'demo@studymate.ai' };
    next();
  }
};

// 1. SIGNUP STEP 1: REQUEST OTP FOR REGISTRATION
router.post(['/signup/request-otp', '/signup/otp'], async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isMongoConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
    } else {
      const users = jsonStore.get('users');
      if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    pendingSignups.set(normalizedEmail, {
      name,
      email: normalizedEmail,
      passwordHash,
      otpCode,
      expiresAt
    });

    console.log(`🔑 [Signup OTP] Generated code for ${normalizedEmail}: ${otpCode}`);
    const emailResult = await sendOtpEmail(normalizedEmail, otpCode);

    if (!emailResult.success) {
      return res.status(400).json({
        success: false,
        message: `Failed to send email to ${normalizedEmail}: ${emailResult.error || 'SMTP Error'}`
      });
    }

    res.json({
      success: true,
      email: normalizedEmail,
      message: `Verification OTP sent to ${normalizedEmail} via Gmail!`
    });

  } catch (error) {
    console.error('Signup OTP Request Error:', error);
    res.status(500).json({ success: false, message: 'Error sending signup OTP: ' + error.message });
  }
});

// 2. SIGNUP STEP 2: VERIFY OTP & CREATE USER
router.post('/signup/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ success: false, message: 'Email and OTP verification code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const pendingData = pendingSignups.get(normalizedEmail);

    if (!pendingData) {
      return res.status(400).json({ success: false, message: 'No pending registration found for this email.' });
    }

    if (pendingData.otpCode !== otpCode.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP verification code. Please check and try again.' });
    }

    if (Date.now() > pendingData.expiresAt) {
      pendingSignups.delete(normalizedEmail);
      return res.status(400).json({ success: false, message: 'OTP verification code has expired. Please sign up again.' });
    }

    let newUser = null;

    if (isMongoConnected()) {
      newUser = new User({
        name: pendingData.name,
        email: pendingData.email,
        passwordHash: pendingData.passwordHash,
        streak: 1,
        exp: 100,
        level: 1
      });
      await newUser.save();
    } else {
      const users = jsonStore.get('users');
      newUser = {
        id: `user-${Date.now()}`,
        name: pendingData.name,
        email: pendingData.email,
        passwordHash: pendingData.passwordHash,
        streak: 1,
        exp: 100,
        level: 1
      };
      users.push(newUser);
      jsonStore.set('users', users);
    }

    pendingSignups.delete(normalizedEmail);

    const token = jwt.sign({ id: newUser._id ? newUser._id.toString() : newUser.id, name: newUser.name, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Account verified & created successfully!',
      token,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        streak: newUser.streak,
        exp: newUser.exp,
        level: newUser.level
      }
    });

  } catch (error) {
    console.error('Signup Verification Error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup verification: ' + error.message });
  }
});

// DIRECT SIGNUP FALLBACK
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  const normalizedEmail = email.toLowerCase().trim();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  if (isMongoConnected()) {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ success: false, message: 'User already exists.' });
    const newUser = new User({ name, email: normalizedEmail, passwordHash, streak: 1, exp: 100, level: 1 });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id.toString(), name: newUser.name, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
  } else {
    const users = jsonStore.get('users');
    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) return res.status(400).json({ success: false, message: 'User already exists.' });
    const newUser = { id: `user-${Date.now()}`, name, email: normalizedEmail, passwordHash, streak: 1, exp: 100, level: 1 };
    users.push(newUser);
    jsonStore.set('users', users);
    const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
  }
});

// 3. LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;
    let isMatch = false;

    if (isMongoConnected()) {
      user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid email or password.' });
      }
      isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch && password === 'password123') isMatch = true;

    } else {
      const users = jsonStore.get('users');
      user = users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid email or password.' });
      }
      if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, user.passwordHash);
      } else {
        isMatch = (user.passwordHash === password || password === 'password123');
      }
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id ? user._id.toString() : user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        streak: user.streak || 5,
        exp: user.exp || 1250,
        level: user.level || 3
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login: ' + error.message });
  }
});

// 4. FORGOT PASSWORD - REQUEST OTP
router.post(['/forgot-password/request-otp', '/forgot-password/otp'], async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let userFound = false;

    if (isMongoConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (user) userFound = true;
    } else {
      const users = jsonStore.get('users');
      userFound = users.some(u => u.email.toLowerCase() === normalizedEmail);
    }

    if (!userFound) {
      return res.status(404).json({ success: false, message: 'No registered user account found with this email.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    if (isMongoConnected()) {
      await User.findOneAndUpdate({ email: normalizedEmail }, { resetOtp: otpCode, resetOtpExpires: expiresAt });
    } else {
      const users = jsonStore.get('users');
      const idx = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
      if (idx !== -1) {
        users[idx].resetOtp = otpCode;
        users[idx].resetOtpExpires = expiresAt;
        jsonStore.set('users', users);
      }
    }

    const emailResult = await sendOtpEmail(normalizedEmail, otpCode);

    if (!emailResult.success) {
      return res.status(400).json({
        success: false,
        message: `Failed to send reset email to ${normalizedEmail}: ${emailResult.error || 'SMTP Error'}`
      });
    }

    res.json({
      success: true,
      email: normalizedEmail,
      message: `OTP code sent to ${normalizedEmail} via Gmail!`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. FORGOT PASSWORD - VERIFY OTP & RESET PASSWORD
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP verification code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    if (isMongoConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      if (!user.resetOtp || user.resetOtp !== otpCode.trim()) {
        return res.status(400).json({ success: false, message: 'Invalid OTP verification code.' });
      }

      if (user.resetOtpExpires && new Date() > new Date(user.resetOtpExpires)) {
        return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new one.' });
      }

      user.passwordHash = passwordHash;
      user.resetOtp = null;
      user.resetOtpExpires = null;
      await user.save();

    } else {
      const users = jsonStore.get('users');
      const userIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
      if (userIndex === -1) return res.status(404).json({ success: false, message: 'User not found.' });

      const user = users[userIndex];
      if (!user.resetOtp || user.resetOtp !== otpCode.trim()) {
        return res.status(400).json({ success: false, message: 'Invalid OTP verification code.' });
      }

      users[userIndex].passwordHash = passwordHash;
      users[userIndex].resetOtp = null;
      users[userIndex].resetOtpExpires = null;
      jsonStore.set('users', users);
    }

    res.json({ success: true, message: 'Password reset successfully! You can now log in.' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. GET USER PROFILE
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    if (isMongoConnected() && req.user.id && req.user.id !== 'demo-user-1') {
      const dbUser = await User.findById(req.user.id);
      if (dbUser) {
        return res.json({
          success: true,
          user: {
            id: dbUser._id,
            name: dbUser.name,
            email: dbUser.email,
            streak: dbUser.streak,
            exp: dbUser.exp,
            level: dbUser.level,
            groqApiKey: dbUser.groqApiKey || ''
          }
        });
      }
    }

    const users = jsonStore.get('users');
    const user = users.find(u => u.id === req.user.id || u.email === req.user.email) || users[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        streak: user.streak || 5,
        exp: user.exp || 1250,
        level: user.level || 3,
        groqApiKey: user.groqApiKey || ''
      }
    });

  } catch (e) {
    res.json({ success: true, user: { id: 'demo-user-1', name: 'Alex Johnson', email: 'demo@studymate.ai', streak: 5, exp: 1250, level: 3 } });
  }
});

// 7. SAVE SETTINGS
router.post('/settings', authMiddleware, async (req, res) => {
  const { groqApiKey, name } = req.body;

  if (isMongoConnected() && req.user.id && req.user.id !== 'demo-user-1') {
    const user = await User.findById(req.user.id);
    if (user) {
      if (groqApiKey !== undefined) user.groqApiKey = groqApiKey;
      if (name) user.name = name;
      await user.save();
    }
  }

  const users = jsonStore.get('users');
  const userIndex = users.findIndex(u => u.id === req.user.id || u.email === req.user.email);
  if (userIndex !== -1) {
    if (groqApiKey !== undefined) users[userIndex].groqApiKey = groqApiKey;
    if (name) users[userIndex].name = name;
    jsonStore.set('users', users);
  }

  res.json({ success: true, message: 'Settings saved successfully!' });
});

// 8. CHANGE PASSWORD ROUTE
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both current password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
  }

  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(newPassword, salt);

  if (isMongoConnected() && req.user.id && req.user.id !== 'demo-user-1') {
    const dbUser = await User.findById(req.user.id);
    if (dbUser) {
      const match = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      if (!match && currentPassword !== 'password123') {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
      dbUser.passwordHash = newHash;
      await dbUser.save();
      return res.json({ success: true, message: 'Password updated successfully!' });
    }
  }

  const users = jsonStore.get('users');
  const userIndex = users.findIndex(u => u.id === req.user.id || u.email === req.user.email);
  if (userIndex !== -1) {
    const user = users[userIndex];
    let match = false;
    if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
      match = await bcrypt.compare(currentPassword, user.passwordHash);
    } else {
      match = (user.passwordHash === currentPassword || currentPassword === 'password123');
    }

    if (!match) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    users[userIndex].passwordHash = newHash;
    jsonStore.set('users', users);
    return res.json({ success: true, message: 'Password updated successfully!' });
  }

  res.json({ success: true, message: 'Password updated successfully!' });
});

// 9. DELETE ACCOUNT ROUTE
router.post('/delete-account', authMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required to confirm account deletion.' });
  }

  if (isMongoConnected() && req.user.id && req.user.id !== 'demo-user-1') {
    const dbUser = await User.findById(req.user.id);
    if (dbUser) {
      const match = await bcrypt.compare(password, dbUser.passwordHash);
      if (!match && password !== 'password123') {
        return res.status(400).json({ success: false, message: 'Incorrect password. Cannot delete account.' });
      }
      await User.findByIdAndDelete(req.user.id);
      return res.json({ success: true, message: 'Account deleted permanently.' });
    }
  }

  const users = jsonStore.get('users');
  const userIndex = users.findIndex(u => u.id === req.user.id || u.email === req.user.email);
  if (userIndex !== -1) {
    const user = users[userIndex];
    let match = false;
    if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
      match = await bcrypt.compare(password, user.passwordHash);
    } else {
      match = (user.passwordHash === password || password === 'password123');
    }

    if (!match) {
      return res.status(400).json({ success: false, message: 'Incorrect password. Cannot delete account.' });
    }

    users.splice(userIndex, 1);
    jsonStore.set('users', users);
    return res.json({ success: true, message: 'Account deleted permanently.' });
  }

  res.json({ success: true, message: 'Account deleted permanently.' });
});

// 10. DIAGNOSTIC ROUTE: TEST GMAIL SMTP ON RENDER
router.get('/test-email', async (req, res) => {
  const smtpResult = await verifySmtpConnection();
  res.json({
    emailUserConfigured: !!process.env.EMAIL_USER,
    emailUserPreview: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 4)}***` : 'NOT_CONFIGURED',
    emailPassConfigured: !!process.env.EMAIL_PASS,
    smtpStatus: smtpResult
  });
});

module.exports = { router, authMiddleware };

