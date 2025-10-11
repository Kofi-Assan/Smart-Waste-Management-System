# Real Email Setup Guide

## 📧 Send Actual Emails to User Addresses

The system now sends **real emails** to users' actual email addresses when they redeem rewards.

## Two Modes:

### Mode 1: Console Logging (Default)
- **No setup required**
- Emails are logged to server console
- Perfect for development and testing

### Mode 2: Real Email Sending
- **Configure email credentials**
- Sends actual emails to users
- Professional HTML email templates

## Quick Setup for Real Emails:

### Step 1: Create .env File
Create a `.env` file in the `backend` folder:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password
```

### Step 2: Gmail Setup (Easiest)

**Option A: Regular Password**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "Less secure app access" (if available)
3. Use your regular Gmail password

**Option B: App Password (Recommended)**
1. Enable 2-Factor Authentication
2. Generate App Password
3. Use the 16-character app password

### Step 3: Test
1. Start server: `npm run dev`
2. Look for: `✅ Email server ready - will send actual emails`
3. Redeem a reward via Postman
4. Check the user's email inbox!

## Expected Server Output:

**With Email Configured:**
```
✅ Database connected successfully
✅ Tables created successfully
✅ Database initialized successfully
✅ Email server ready - will send actual emails
🚀 Server running on http://localhost:3000
```

**Without Email Configured:**
```
✅ Database connected successfully
✅ Tables created successfully
✅ Database initialized successfully
⚠️  Email not configured - using console logging
📧 To send real emails, set EMAIL_USER and EMAIL_PASS in .env
💡 Check console logs for email content
🚀 Server running on http://localhost:3000
```

## Email Features:

- ✅ **Professional HTML templates**
- ✅ **Responsive design**
- ✅ **Reward details and account info**
- ✅ **Clear next steps**
- ✅ **Branded with Smart Waste Management**

## Test with Postman:

1. **Register a user** with a real email address
2. **Add coins** to their account
3. **Redeem a reward**
4. **Check their email** for the confirmation!

## Troubleshooting:

**Still getting console mode?**
- Check `.env` file exists in `backend` folder
- Verify `EMAIL_USER` and `EMAIL_PASS` are set
- Restart the server after changes

**Email not received?**
- Check spam/junk folder
- Verify email address is correct
- Check server logs for errors

The system now sends beautiful, professional emails to users' actual email addresses!
