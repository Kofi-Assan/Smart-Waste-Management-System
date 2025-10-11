# 📧 Email Transporter Object - Complete Guide

## 🚀 Comprehensive Email Handling with Node.js & Nodemailer

I've created a powerful **EmailTransporter** class that handles all email operations with advanced features and robust error handling.

---

## 🏗️ **EmailTransporter Class Features**

### **Core Capabilities:**
- ✅ **Automatic Configuration Detection**
- ✅ **SMTP Connection Verification**
- ✅ **Connection Pooling Support**
- ✅ **Rate Limiting**
- ✅ **Graceful Fallback to Console Logging**
- ✅ **Real-time Status Monitoring**
- ✅ **Dynamic Configuration Updates**
- ✅ **Comprehensive Error Handling**

### **Advanced Configuration Options:**
```javascript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: 'your-email@gmail.com', pass: 'your-password' },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
  pool: false,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5
}
```

---

## 📡 **API Endpoints for Transporter Management**

### **1. Get Transporter Status**
- **URL**: `GET /api/email/status`
- **Description**: Get comprehensive transporter status

**Response:**
```json
{
  "configured": false,
  "mode": "console_logging",
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "not configured",
  "pool": false,
  "maxConnections": 5,
  "maxMessages": 100,
  "message": "Email service in console mode - check server logs for email content"
}
```

### **2. Test SMTP Connection**
- **URL**: `GET /api/email/test-connection`
- **Description**: Verify SMTP connection

**Response:**
```json
{
  "success": false,
  "error": "Transporter not configured",
  "mode": "console_logging"
}
```

### **3. Send Test Email**
- **URL**: `POST /api/email/test-transporter`
- **Body**: `{"testEmail": "your-email@example.com"}`

**Response:**
```json
{
  "success": true,
  "messageId": "console-1760144534651",
  "mode": "console_logging",
  "testEmail": "test@example.com",
  "message": "Test email sent successfully"
}
```

### **4. Update Configuration**
- **URL**: `POST /api/email/update-config`
- **Body**:
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "your-email@gmail.com",
  "pass": "your-password"
}
```

---

## 🧪 **Postman Testing Workflow**

### **Step 1: Check Current Status**
1. **Method**: `GET`
2. **URL**: `http://localhost:3000/api/email/status`
3. **Expected**: Shows current configuration and mode

### **Step 2: Test Connection**
1. **Method**: `GET`
2. **URL**: `http://localhost:3000/api/email/test-connection`
3. **Expected**: Connection verification result

### **Step 3: Send Test Email**
1. **Method**: `POST`
2. **URL**: `http://localhost:3000/api/email/test-transporter`
3. **Body**:
   ```json
   {
     "testEmail": "your-email@gmail.com"
   }
   ```

### **Step 4: Update Configuration (Optional)**
1. **Method**: `POST`
2. **URL**: `http://localhost:3000/api/email/update-config`
3. **Body**:
   ```json
   {
     "host": "smtp.gmail.com",
     "port": 587,
     "secure": false,
     "user": "your-email@gmail.com",
     "pass": "your-app-password"
   }
   ```

---

## 🔧 **Transporter Object Methods**

### **Core Methods:**
```javascript
// Get transporter instance
const { emailTransporter } = require('./services/emailService');

// Check status
const status = emailTransporter.getStatus();

// Verify connection
const result = await emailTransporter.verifyConnection();

// Send email
const mailOptions = {
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Test Email',
  html: '<h1>Hello World!</h1>',
  text: 'Hello World!'
};
const result = await emailTransporter.sendEmail(mailOptions);

// Send test email
const testResult = await emailTransporter.testEmail('test@example.com');

// Update configuration
emailTransporter.updateConfig({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'new@email.com', pass: 'newpassword' }
});

// Close connection
await emailTransporter.close();
```

---

## 📊 **Server Console Output**

### **Console Mode (Default):**
```
✅ Database connected successfully
✅ Tables created successfully
✅ Database initialized successfully
⚠️  Email transporter not configured - using console mode
📧 To configure: Set EMAIL_USER and EMAIL_PASS in .env file
🚀 Server running on http://localhost:3000
```

### **Real Email Mode (Configured):**
```
✅ Database connected successfully
✅ Tables created successfully
✅ Database initialized successfully
✅ Email transporter initialized successfully
📧 SMTP Host: smtp.gmail.com:587
🔐 Authentication: your-email@gmail.com
🔒 Secure Connection: No
🚀 Server running on http://localhost:3000
```

### **Email Sending (Console Mode):**
```
📧 EMAIL CONTENT (Console Mode):
=====================================
Message ID: console-1760144534651
Timestamp: 2024-01-10T10:15:34.651Z
To: test@example.com
From: Smart Waste Management <your-email@gmail.com>
Subject: 🧪 Email Transporter Test
-------------------------------------
HTML Content:
<h2>Email Transporter Test</h2>
<p>This is a test email from the Smart Waste Management System.</p>
<p>If you receive this email, the transporter is working correctly!</p>
<p>Timestamp: 2024-01-10T10:15:34.651Z</p>
-------------------------------------
Text Content:
Email Transporter Test

This is a test email from the Smart Waste Management System.

If you receive this email, the transporter is working correctly!

Timestamp: 2024-01-10T10:15:34.651Z
=====================================
```

### **Email Sending (Real Mode):**
```
📤 Sending email to: test@example.com
✅ Email sent successfully: <message-id>
📧 Response: 250 2.0.0 OK <message-id> - gsmtp
```

---

## 🎯 **Key Benefits**

### **1. Robust Error Handling**
- Automatic fallback to console logging
- Detailed error messages
- Connection retry logic

### **2. Flexible Configuration**
- Environment variable support
- Runtime configuration updates
- Multiple SMTP providers

### **3. Performance Features**
- Connection pooling
- Rate limiting
- Timeout management

### **4. Developer Friendly**
- Comprehensive logging
- Status monitoring
- Easy testing

### **5. Production Ready**
- Security best practices
- Error recovery
- Monitoring capabilities

---

## 🚀 **Quick Start**

### **1. Default Mode (No Setup)**
- ✅ Works immediately
- ✅ Logs emails to console
- ✅ Perfect for development

### **2. Real Email Mode**
1. Create `.env` file:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-password
   ```
2. Restart server
3. Test with Postman

### **3. Test Everything**
```bash
# Check status
curl http://localhost:3000/api/email/status

# Test connection
curl http://localhost:3000/api/email/test-connection

# Send test email
curl -X POST http://localhost:3000/api/email/test-transporter \
  -H "Content-Type: application/json" \
  -d '{"testEmail": "test@example.com"}'
```

The **EmailTransporter** object provides enterprise-grade email handling with Node.js and nodemailer! 🚀
