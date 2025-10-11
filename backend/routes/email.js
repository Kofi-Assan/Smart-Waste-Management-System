const express = require('express');
const { sendRewardConfirmationEmail, sendWelcomeEmail, emailTransporter } = require('../services/emailService');

const router = express.Router();

// Test email endpoint - send reward confirmation
router.post('/test-reward-email', async (req, res) => {
  try {
    const { userEmail, userName, rewardName, cost, newBalance } = req.body;
    
    // Validate required fields
    if (!userEmail || !userName || !rewardName || !cost || !newBalance) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userEmail', 'userName', 'rewardName', 'cost', 'newBalance']
      });
    }
    
    // Send the email
    const result = await sendRewardConfirmationEmail(userEmail, userName, rewardName, cost, newBalance);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Reward confirmation email sent successfully',
        messageId: result.messageId,
        recipient: userEmail,
        emailType: 'reward_confirmation'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Test email endpoint - send welcome email
router.post('/test-welcome-email', async (req, res) => {
  try {
    const { userEmail, userName } = req.body;
    
    // Validate required fields
    if (!userEmail || !userName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userEmail', 'userName']
      });
    }
    
    // Send the email
    const result = await sendWelcomeEmail(userEmail, userName);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: result.messageId,
        recipient: userEmail,
        emailType: 'welcome'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('Welcome email test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get email service status
router.get('/status', async (req, res) => {
  try {
    const status = emailTransporter.getStatus();
    
    res.json({
      ...status,
      message: status.configured ? 
        'Email service ready - will send actual emails' : 
        'Email service in console mode - check server logs for email content'
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get email status',
      details: error.message 
    });
  }
});

// Test transporter connection
router.get('/test-connection', async (req, res) => {
  try {
    const result = await emailTransporter.verifyConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to test connection',
      details: error.message 
    });
  }
});

// Send test email using transporter
router.post('/test-transporter', async (req, res) => {
  try {
    const { testEmail } = req.body;
    const email = testEmail || 'test@example.com';
    
    const result = await emailTransporter.testEmail(email);
    res.json({
      ...result,
      testEmail: email,
      message: result.success ? 
        'Test email sent successfully' : 
        'Failed to send test email'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to send test email',
      details: error.message 
    });
  }
});

// Update email configuration
router.post('/update-config', async (req, res) => {
  try {
    const { host, port, secure, user, pass } = req.body;
    
    if (!user || !pass) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['user', 'pass']
      });
    }
    
    const newConfig = {
      host: host || 'smtp.gmail.com',
      port: port || 587,
      secure: secure || false,
      auth: { user, pass }
    };
    
    emailTransporter.updateConfig(newConfig);
    
    // Get status after update
    const status = emailTransporter.getStatus();
    
    // Test the new configuration
    const verifyResult = await emailTransporter.verifyConnection();
    
    res.json({
      success: true,
      message: 'Email configuration updated',
      verification: verifyResult,
      status: status
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to update configuration',
      details: error.message 
    });
  }
});


module.exports = router;
