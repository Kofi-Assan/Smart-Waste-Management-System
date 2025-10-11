# 📧 Email API Testing with Postman

## 🚀 Quick Setup

### Step 1: Start the Server
```bash
cd backend
npm run dev
```

### Step 2: Check Email Status
**GET** `http://localhost:3000/api/email/status`

This will tell you if email is configured or in console mode.

---

## 📨 Email API Endpoints

### 1. **Check Email Service Status**
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/email/status`
- **Description**: Check if email service is configured

**Expected Response:**
```json
{
  "emailConfigured": true,
  "mode": "real_email",
  "message": "Email service ready - will send actual emails",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587
}
```

---

### 2. **Send Reward Confirmation Email**
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/email/test-reward-email`
- **Headers**: `Content-Type: application/json`

**Request Body:**
```json
{
  "userEmail": "test@example.com",
  "userName": "John Doe",
  "rewardName": "Free Coffee Voucher",
  "cost": 50,
  "newBalance": 150
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Reward confirmation email sent successfully",
  "messageId": "console-1234567890",
  "recipient": "test@example.com",
  "emailType": "reward_confirmation"
}
```

---

### 3. **Send Welcome Email**
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/email/test-welcome-email`
- **Headers**: `Content-Type: application/json`

**Request Body:**
```json
{
  "userEmail": "newuser@example.com",
  "userName": "Jane Smith"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Welcome email sent successfully",
  "messageId": "console-1234567890",
  "recipient": "newuser@example.com",
  "emailType": "welcome"
}
```

---

## 🔧 Postman Setup Steps

### Step 1: Create New Collection
1. Open Postman
2. Click "New" → "Collection"
3. Name it "Smart Waste Management - Email API"

### Step 2: Add Environment Variables
1. Click "Environments" → "Create Environment"
2. Name it "Local Development"
3. Add variables:
   - `base_url`: `http://localhost:3000`
   - `api_url`: `{{base_url}}/api/email`

### Step 3: Create Requests

#### Request 1: Check Email Status
1. **Method**: `GET`
2. **URL**: `{{api_url}}/status`
3. **Save as**: "Email Status Check"

#### Request 2: Test Reward Email
1. **Method**: `POST`
2. **URL**: `{{api_url}}/test-reward-email`
3. **Headers**: 
   - `Content-Type`: `application/json`
4. **Body** (raw JSON):
   ```json
   {
     "userEmail": "your-email@gmail.com",
     "userName": "Test User",
     "rewardName": "Free Coffee Voucher",
     "cost": 50,
     "newBalance": 150
   }
   ```
5. **Save as**: "Test Reward Email"

#### Request 3: Test Welcome Email
1. **Method**: `POST`
2. **URL**: `{{api_url}}/test-welcome-email`
3. **Headers**: 
   - `Content-Type`: `application/json`
4. **Body** (raw JSON):
   ```json
   {
     "userEmail": "your-email@gmail.com",
     "userName": "New User"
   }
   ```
5. **Save as**: "Test Welcome Email"

---

## 📧 Email Configuration

### Console Mode (Default)
- ✅ No setup required
- ✅ Emails logged to server console
- ✅ Perfect for testing

### Real Email Mode
1. **Create `.env` file** in `backend` folder:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-password
   ```

2. **Restart server**
3. **Check status** - should show `"mode": "real_email"`

---

## 🧪 Testing Workflow

### Test 1: Check Status
1. Run "Email Status Check" request
2. Verify response shows current mode

### Test 2: Send Test Emails
1. Run "Test Reward Email" request
2. Run "Test Welcome Email" request
3. Check server console for email content

### Test 3: Real Email (Optional)
1. Configure `.env` file
2. Restart server
3. Run test requests
4. Check your email inbox!

---

## 📋 Expected Server Output

### Console Mode:
```
📧 EMAIL CONTENT (Console Mode):
=====================================
To: test@example.com
Subject: 🎉 Reward Redemption Confirmed - Free Coffee Voucher

[HTML Email Content...]
=====================================
```

### Real Email Mode:
```
✅ Real email sent to test@example.com: <message-id>
```

---

## 🚨 Troubleshooting

**Server won't start?**
- Check if port 3000 is available
- Verify all dependencies are installed

**Email not configured?**
- Check `.env` file exists
- Verify `EMAIL_USER` and `EMAIL_PASS` are set
- Restart server after changes

**API returns 500 error?**
- Check server console for error details
- Verify request body format is correct

**Real emails not received?**
- Check spam/junk folder
- Verify email address is correct
- Check server logs for SMTP errors

---

## 🎯 Quick Test Commands

### Using curl (Alternative to Postman):

**Check Status:**
```bash
curl http://localhost:3000/api/email/status
```

**Send Reward Email:**
```bash
curl -X POST http://localhost:3000/api/email/test-reward-email \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "userName": "Test User",
    "rewardName": "Free Coffee",
    "cost": 50,
    "newBalance": 150
  }'
```

The email API is now ready for testing! 🚀
