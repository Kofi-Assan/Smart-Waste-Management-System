# 🪙 Coin System Testing Guide

## Overview
The coin system awards 5 coins for every 10% increase in bin fill level. This guide shows you how to test the system using Postman.

## 🚀 Quick Start

### 1. Import Postman Collection
1. Open Postman
2. Click "Import" 
3. Select `Smart_Waste_Management_API.postman_collection.json`
4. Set environment variable `baseUrl` to `http://localhost:3000`

### 2. Start Backend
```bash
cd backend
npm start
```

## 🧪 Testing Sequence

### Step 1: Check Initial State
**Request:** `Check User Coin Balance`
- **Method:** GET
- **URL:** `{{baseUrl}}/api/users/1`
- **Expected:** Shows current coin balance (should be 0 or existing amount)

### Step 2: Test Coin Awarding
Run these requests in sequence to simulate bin filling:

#### Test 1: 0% to 20% (Should award 10 coins)
**Request:** `Test Coin System - Bin Level 0% to 20%`
- **Method:** POST
- **URL:** `{{baseUrl}}/api/bins/update`
- **Body:**
```json
{
  "binId": 1,
  "level": 20,
  "distance": 15.0,
  "deviceId": "ESP8266_BIN_001",
  "location": "Academic City University College",
  "timestamp": "2024-01-01T10:00:00Z"
}
```
- **Expected Response:** `"coinsAwarded": 10` (2 increments × 5 coins)

#### Test 2: 20% to 50% (Should award 15 coins)
**Request:** `Test Coin System - Bin Level 20% to 50%`
- **Method:** POST
- **URL:** `{{baseUrl}}/api/bins/update`
- **Body:**
```json
{
  "binId": 1,
  "level": 50,
  "distance": 10.0,
  "deviceId": "ESP8266_BIN_001",
  "location": "Academic City University College",
  "timestamp": "2024-01-01T10:05:00Z"
}
```
- **Expected Response:** `"coinsAwarded": 15` (3 increments × 5 coins)

#### Test 3: 50% to 80% (Should award 15 coins)
**Request:** `Test Coin System - Bin Level 50% to 80%`
- **Method:** POST
- **URL:** `{{baseUrl}}/api/bins/update`
- **Body:**
```json
{
  "binId": 1,
  "level": 80,
  "distance": 5.0,
  "deviceId": "ESP8266_BIN_001",
  "location": "Academic City University College",
  "timestamp": "2024-01-01T10:10:00Z"
}
```
- **Expected Response:** `"coinsAwarded": 15` (3 increments × 5 coins)

### Step 3: Verify Database Updates
**Request:** `Check User Coin Balance`
- **Method:** GET
- **URL:** `{{baseUrl}}/api/users/1`
- **Expected:** Total should be 40 coins (10 + 15 + 15)

### Step 4: Check Transactions
**Request:** `Get User Transactions`
- **Method:** GET
- **URL:** `{{baseUrl}}/api/users/1/transactions`
- **Expected:** Should show 3 transactions with coin awards

### Step 5: Test Specific User Award
**Request:** `Test Coin System - Specific User`
- **Method:** POST
- **URL:** `{{baseUrl}}/api/bins/update`
- **Body:**
```json
{
  "binId": 1,
  "level": 90,
  "distance": 3.0,
  "deviceId": "ESP8266_BIN_001",
  "location": "Academic City University College",
  "userId": 1,
  "timestamp": "2024-01-01T10:15:00Z"
}
```
- **Expected Response:** `"coinsAwarded": 5` (1 increment × 5 coins)

### Step 6: Reset for Next Test
**Request:** `Reset Bin Level to 0%`
- **Method:** POST
- **URL:** `{{baseUrl}}/api/bins/update`
- **Body:**
```json
{
  "binId": 1,
  "level": 0,
  "distance": 20.0,
  "deviceId": "ESP8266_BIN_001",
  "location": "Academic City University College",
  "timestamp": "2024-01-01T10:20:00Z"
}
```

## 🎯 Expected Results

### Coin Calculation Examples:
- **0% → 20%**: 2 increments = 10 coins
- **20% → 50%**: 3 increments = 15 coins  
- **50% → 80%**: 3 increments = 15 coins
- **80% → 90%**: 1 increment = 5 coins
- **Total**: 45 coins

### Database Updates:
- ✅ User coin_balance increases
- ✅ Transactions are logged
- ✅ Bin level updates correctly
- ✅ Response includes coinsAwarded

## 🔧 Troubleshooting

### Issue: No coins awarded
**Check:**
1. Backend is running on port 3000
2. Database connection is working
3. User exists in database
4. Bin level is actually increasing (not decreasing)

### Issue: Wrong coin amount
**Check:**
1. Previous bin level is stored correctly
2. Level increase calculation is correct
3. 10% increment calculation is working

### Issue: Database not updating
**Check:**
1. Database connection in `backend/config/database.js`
2. User table has `coin_balance` column
3. Transactions table exists
4. No database errors in console

## 📊 Monitoring

### Backend Console Logs:
Look for these messages:
```
🎉 Awarded 10 coins for bin level increase from 0% to 20%
Arduino update received: { binId: 1, level: 20, coinsAwarded: 10 }
```

### Database Queries:
```sql
-- Check user balance
SELECT coin_balance FROM users WHERE id = 1;

-- Check transactions
SELECT * FROM transactions WHERE user_id = 1 ORDER BY transaction_date DESC;

-- Check bin levels
SELECT id, level, status FROM bins WHERE id = 1;
```

## 🎮 Frontend Testing

1. Open the website in browser
2. Login to your account
3. Watch the dashboard for coin notifications
4. Check the rewards panel for updated balance
5. Verify notifications appear when bin levels increase

## 🚨 Common Issues

1. **"User not found"**: Make sure user ID 1 exists in database
2. **"Bin not found"**: Make sure bin ID 1 exists in database  
3. **No coins awarded**: Check if level is actually increasing
4. **Database errors**: Check database connection and table structure

## ✅ Success Criteria

- [ ] Bin level updates correctly
- [ ] Coins are calculated properly (5 per 10% increment)
- [ ] User coin_balance increases in database
- [ ] Transactions are logged
- [ ] Frontend shows notifications
- [ ] Coin balance updates in UI
- [ ] No errors in backend console
- [ ] No errors in database queries
