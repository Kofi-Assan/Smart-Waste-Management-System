const nodemailer = require('nodemailer');
require('dotenv').config();

// Email Transporter Class - Comprehensive email handling
class EmailTransporter {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.config = this.getEmailConfig();
    this.initializeTransporter();
  }

  // Get email configuration from environment variables
  getEmailConfig() {
    return {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-password'
      },
      tls: {
        rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false'
      },
      connectionTimeout: parseInt(process.env.EMAIL_TIMEOUT) || 60000,
      greetingTimeout: parseInt(process.env.EMAIL_GREETING_TIMEOUT) || 30000,
      socketTimeout: parseInt(process.env.EMAIL_SOCKET_TIMEOUT) || 60000,
      pool: process.env.EMAIL_POOL === 'true' || false,
      maxConnections: parseInt(process.env.EMAIL_MAX_CONNECTIONS) || 5,
      maxMessages: parseInt(process.env.EMAIL_MAX_MESSAGES) || 100,
      rateDelta: parseInt(process.env.EMAIL_RATE_DELTA) || 1000,
      rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT) || 5
    };
  }

  // Initialize the transporter
  initializeTransporter() {
    try {
      // Check if email credentials are properly configured
      const hasValidUser = this.config.auth.user && this.config.auth.user !== 'your-email@gmail.com';
      const hasValidPass = this.config.auth.pass && this.config.auth.pass !== 'your-password';
      
      // Debug logging (can be removed in production)
      // console.log('🔍 Config check:', {
      //   user: this.config.auth.user,
      //   hasValidUser,
      //   hasValidPass,
      //   passLength: this.config.auth.pass ? this.config.auth.pass.length : 0
      // });
      
      this.isConfigured = !!(hasValidUser && hasValidPass);

      if (this.isConfigured) {
        // Create transporter with comprehensive configuration
        this.transporter = nodemailer.createTransport(this.config);
        console.log('✅ Email transporter initialized successfully');
        console.log(`📧 SMTP Host: ${this.config.host}:${this.config.port}`);
        console.log(`🔐 Authentication: ${this.config.auth.user}`);
        console.log(`🔒 Secure Connection: ${this.config.secure ? 'Yes' : 'No'}`);
        console.log(`🔧 Pool: ${this.config.pool ? 'Enabled' : 'Disabled'}`);
      } else {
        console.log('⚠️  Email transporter not configured - using console mode');
        console.log('📧 To configure: Set EMAIL_USER and EMAIL_PASS in .env file');
        this.transporter = null;
      }
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error.message);
      this.isConfigured = false;
      this.transporter = null;
    }
  }

  // Verify transporter connection
  async verifyConnection() {
    if (!this.isConfigured || !this.transporter) {
      return { 
        success: false, 
        error: 'Transporter not configured',
        mode: 'console_logging'
      };
    }

    try {
      console.log('🔍 Verifying SMTP connection...');
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return { 
        success: true, 
        message: 'SMTP connection verified successfully',
        mode: 'real_email'
      };
    } catch (error) {
      console.error('❌ SMTP verification failed:', error.message);
      console.log('💡 Check your email credentials and network connection');
      return { 
        success: false, 
        error: error.message,
        mode: 'console_logging'
      };
    }
  }

  // Send email using the transporter
  async sendEmail(mailOptions) {
    if (!this.isConfigured || !this.transporter) {
      // Fallback to console logging
      return this.logEmailToConsole(mailOptions);
    }

    try {
      console.log(`📤 Sending email to: ${mailOptions.to}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully:`, info.messageId);
      console.log(`📧 Response: ${info.response}`);
      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        mode: 'real_email'
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      console.log('🔄 Falling back to console logging...');
      // Fallback to console logging on error
      return this.logEmailToConsole(mailOptions, error.message);
    }
  }

  // Log email content to console (fallback mode)
  logEmailToConsole(mailOptions, errorMessage = null) {
    const timestamp = new Date().toISOString();
    const messageId = `console-${Date.now()}`;
    
    console.log('\n📧 EMAIL CONTENT (Console Mode):');
    console.log('=====================================');
    console.log(`Message ID: ${messageId}`);
    console.log(`Timestamp: ${timestamp}`);
    if (errorMessage) {
      console.log(`Error: ${errorMessage}`);
    }
    console.log(`To: ${mailOptions.to}`);
    console.log(`From: ${mailOptions.from}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log('-------------------------------------');
    console.log('HTML Content:');
    console.log(mailOptions.html || 'N/A');
    console.log('-------------------------------------');
    console.log('Text Content:');
    console.log(mailOptions.text || 'N/A');
    console.log('=====================================\n');

    return {
      success: true,
      messageId: messageId,
      mode: 'console_logging',
      error: errorMessage
    };
  }

  // Get transporter status
  getStatus() {
    return {
      configured: this.isConfigured,
      mode: this.isConfigured ? 'real_email' : 'console_logging',
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      user: this.config.auth.user && this.config.auth.user !== 'your-email@gmail.com' ? 
            this.config.auth.user : 'not configured',
      pool: this.config.pool,
      maxConnections: this.config.maxConnections,
      maxMessages: this.config.maxMessages,
      hasPassword: this.config.auth.pass && this.config.auth.pass !== 'your-password'
    };
  }

  // Update configuration and reinitialize
  updateConfig(newConfig) {
    console.log('🔄 Updating email configuration...');
    
    // Close existing transporter if it exists
    if (this.transporter) {
      this.transporter.close().catch(err => {
        console.log('⚠️  Error closing existing transporter:', err.message);
      });
    }
    
    // Update configuration with proper auth merge
    if (newConfig.auth) {
      this.config.auth = { ...this.config.auth, ...newConfig.auth };
    }
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize transporter with new config
    this.initializeTransporter();
    
    console.log('✅ Email configuration updated successfully');
  }

  // Close transporter connection
  async close() {
    if (this.transporter) {
      try {
        await this.transporter.close();
        console.log('✅ Email transporter connection closed');
      } catch (error) {
        console.error('❌ Error closing transporter:', error.message);
      }
    }
  }

  // Test email sending
  async testEmail(testEmail = 'test@example.com') {
    const testMailOptions = {
      from: `"Smart Waste Management Test" <${this.config.auth.user}>`,
      to: testEmail,
      subject: '🧪 Email Transporter Test',
      html: `
        <h2>Email Transporter Test</h2>
        <p>This is a test email from the Smart Waste Management System.</p>
        <p>If you receive this email, the transporter is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      text: `Email Transporter Test\n\nThis is a test email from the Smart Waste Management System.\n\nIf you receive this email, the transporter is working correctly!\n\nTimestamp: ${new Date().toISOString()}`
    };

    return await this.sendEmail(testMailOptions);
  }
}

// Create global transporter instance
const emailTransporter = new EmailTransporter();

// Verify email configuration (legacy function for compatibility)
async function verifyEmailConfig() {
  const result = await emailTransporter.verifyConnection();
  return result.success;
}

// Send reward redemption confirmation email
async function sendRewardConfirmationEmail(userEmail, userName, rewardName, cost, newBalance) {
  const mailOptions = {
    from: `"Smart Waste Management" <${emailTransporter.config.auth.user}>`,
    to: userEmail,
    subject: `🎉 Reward Redemption Confirmed - ${rewardName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reward-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .coin-icon { font-size: 24px; }
          .success-message { color: #10b981; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
            <p>Your reward has been successfully redeemed</p>
          </div>
          
          <div class="content">
            <p>Dear ${userName},</p>
            
            <p class="success-message">Your reward redemption has been confirmed!</p>
            
            <div class="reward-card">
              <h3>📦 Reward Details</h3>
              <p><strong>Reward:</strong> ${rewardName}</p>
              <p><strong>Cost:</strong> <span class="coin-icon">🪙</span> ${cost.toLocaleString()} coins</p>
              <p><strong>Status:</strong> <span style="color: #10b981;">✅ Confirmed</span></p>
            </div>
            
            <div class="reward-card">
              <h3>💰 Your Account</h3>
              <p><strong>Remaining Balance:</strong> <span class="coin-icon">🪙</span> ${newBalance.toLocaleString()} coins</p>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Your reward will be processed within 2-3 business days</li>
              <li>You will receive a separate email with delivery details</li>
              <li>If you have any questions, please contact our support team</li>
            </ul>
            
            <p>Thank you for using the Smart Waste Management System!</p>
            
            <div class="footer">
              <p>This is an automated message from Smart Waste Management System</p>
              <p>Keep earning coins by recycling and managing waste responsibly! 🌱</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Congratulations ${userName}!
      
      Your reward redemption has been confirmed!
      
      Reward: ${rewardName}
      Cost: ${cost.toLocaleString()} coins
      Remaining Balance: ${newBalance.toLocaleString()} coins
      
      Your reward will be processed within 2-3 business days.
      
      Thank you for using the Smart Waste Management System!
    `
  };

  return await emailTransporter.sendEmail(mailOptions);
}

// Send welcome email
async function sendWelcomeEmail(userEmail, userName) {
  const mailOptions = {
    from: `"Smart Waste Management" <${emailTransporter.config.auth.user}>`,
    to: userEmail,
    subject: '🌱 Welcome to Smart Waste Management System!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 Welcome to Smart Waste Management!</h1>
            <p>Start earning coins by recycling responsibly</p>
          </div>
          
          <div class="content">
            <p>Dear ${userName},</p>
            
            <p>Welcome to the Smart Waste Management System! We're excited to have you join our community of environmentally conscious users.</p>
            
            <h3>🚀 Getting Started</h3>
            <div class="feature">
              <strong>📱 Scan QR Codes:</strong> Scan waste management QR codes to earn coins
            </div>
            <div class="feature">
              <strong>🪙 Earn Rewards:</strong> Redeem your coins for amazing rewards
            </div>
            <div class="feature">
              <strong>📊 Track Progress:</strong> Monitor your environmental impact
            </div>
            
            <p>Start earning coins today by scanning QR codes at waste collection points!</p>
            
            <p>Best regards,<br>The Smart Waste Management Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome ${userName}!
      
      Welcome to the Smart Waste Management System!
      
      Getting Started:
      • Scan QR codes to earn coins
      • Redeem coins for amazing rewards
      • Track your environmental impact
      
      Start earning coins today!
      
      Best regards,
      The Smart Waste Management Team
    `
  };

  return await emailTransporter.sendEmail(mailOptions);
}

// Export both the transporter instance and legacy functions
module.exports = {
  emailTransporter,
  verifyEmailConfig,
  sendRewardConfirmationEmail,
  sendWelcomeEmail
};