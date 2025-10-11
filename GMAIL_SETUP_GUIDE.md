# Gmail Email Setup Guide

## Quick Fix for "Invalid login: 535-5.7.8" Error

This error occurs because Gmail requires proper authentication for third-party apps.

## Two Options for Gmail Setup:

### Option 1: Regular Password (2FA Optional) ⭐ EASIER

**Steps:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click "Less secure app access" (if available)
3. Turn it ON
4. Use your regular Gmail password

**Update your .env file:**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-regular-gmail-password
```

### Option 2: App Password (2FA Required) 🔒 MORE SECURE

**Steps:**
1. Enable 2-Factor Authentication
2. Generate App Password
3. Use the 16-character app password

**Update your .env file:**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## Step-by-Step Instructions:

### Method 1: Regular Password Setup

1. **Enable Less Secure Apps** (if available):
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Look for "Less secure app access"
   - Turn it ON

2. **Update .env File**:
   ```env
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASS=your-regular-password
   ```

3. **Restart Server**:
   ```bash
   cd backend
   npm run dev
   ```

### Method 2: App Password Setup (If Method 1 doesn't work)

1. **Enable 2-Factor Authentication**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click "App passwords" (under 2-Step Verification)
   - Select "Mail" and "Other (Custom name)"
   - Enter "Smart Waste Management" as the name
   - Click "Generate"
   - **Copy the 16-character password**

3. **Update .env File**:
   ```env
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

4. **Restart Server**:
   ```bash
   cd backend
   npm run dev
   ```

## Expected Output:
```
✅ Database connected successfully
✅ Tables created successfully  
✅ Database initialized successfully
✅ Email server is ready to send messages
🚀 Server running on http://localhost:3000
```

## Test Email Functionality:
1. Use the Postman collection to redeem a reward
2. Check your email for the confirmation message
3. The email should arrive within 1-2 minutes

## Troubleshooting:

**Still getting 535 error?**
- Try Method 1 first (regular password)
- If that fails, use Method 2 (app password)
- Double-check the email address is correct

**"Less secure app access" not available?**
- Google may have removed this option
- Use Method 2 (App Password) instead

**No email received?**
- Check spam/junk folder
- Verify the recipient email in the API request
- Check server logs for email sending status

## Alternative Email Providers:

### Outlook/Hotmail:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Yahoo:
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

## Note:
The reward redemption system works perfectly even without email configuration. Users will still get their rewards processed, they just won't receive email confirmations.
