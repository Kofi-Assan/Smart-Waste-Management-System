const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { pool } = require('../config/database');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Generate unique QR code
    const qrData = `GEGE_USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const qrCode = await QRCode.toDataURL(qrData);
    
    // Insert user into database
    const [result] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, qr_code) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, email, passwordHash, qrData]
    );
    
    const userId = result.insertId;
    
    // Generate JWT token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        firstName,
        lastName,
        email,
        coinBalance: 0,
        qrCode
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const [users] = await pool.execute(
      'SELECT id, first_name, last_name, email, password_hash, coin_balance, qr_code FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        coinBalance: user.coin_balance,
        qrCode: user.qr_code
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, first_name, last_name, email, coin_balance, qr_code FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        coinBalance: user.coin_balance,
        qrCode: user.qr_code
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Forgot password - generate reset token and store hash + expiry
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email = ?'
      , [email]
    );

    // Always respond success to avoid user enumeration
    if (users.length === 0) {
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
    }

    const user = users[0];

    // Generate token and hash it for storage
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    await pool.execute(
      'UPDATE users SET reset_token_hash = ?, reset_token_expires = ? WHERE id = ?'
      , [tokenHash, expiresAt, user.id]
    );

    // In production, email a link. For dev, return token directly.
    // The frontend can open a reset dialog and submit token + new password.
    return res.json({ message: 'Reset token generated', resetToken: token });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to initiate password reset' });
  }
});

// Reset password - verify token and set new password
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and newPassword are required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [users] = await pool.execute(
      'SELECT id FROM users WHERE reset_token_hash = ? AND reset_token_expires > NOW()'
      , [tokenHash]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = users[0];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      'UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = ?'
      , [passwordHash, user.id]
    );

    return res.json({ message: 'Password has been reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
