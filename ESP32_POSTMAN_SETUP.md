# 📡 ESP32 WiFi Communication - Postman Setup Guide

## 🚀 ESP32 API Endpoint Created Successfully!

### **✅ Endpoint Details:**
- **URL**: `POST http://localhost:3000/api/update`
- **Content-Type**: `application/json`
- **Status**: ✅ Working and tested

---

## 📋 **Postman Setup Steps**

### **Step 1: Create New Request**
1. Open Postman
2. Click **"New"** → **"HTTP Request"**
3. Name it: **"ESP32 WiFi Communication"**

### **Step 2: Configure Request**
1. **Method**: `POST`
2. **URL**: `http://localhost:3000/api/update`
3. **Headers**: 
   - `Content-Type`: `application/json`

### **Step 3: Request Body Examples**

#### **Basic ESP32 Data (Minimum Required):**
```json
{
  "fill": 72
}
```

#### **Complete ESP32 Data (Recommended):**
```json
{
  "fill": 85,
  "binId": "BIN001",
  "location": "Building A",
  "timestamp": "2024-01-10T10:30:00Z"
}
```

#### **Different Fill Levels:**
```json
{
  "fill": 0,
  "binId": "BIN002",
  "location": "Building B"
}
```

```json
{
  "fill": 50,
  "binId": "BIN003",
  "location": "Building C"
}
```

```json
{
  "fill": 100,
  "binId": "BIN004",
  "location": "Building D"
}
```

---

## 📊 **Expected Responses**

### **✅ Success Response:**
```json
{
  "success": true,
  "message": "ESP32 data received successfully",
  "data": {
    "fill": 72,
    "binId": "default",
    "location": "unknown",
    "timestamp": "2024-01-10T10:30:00.000Z",
    "status": "Half Full"
  }
}
```

### **❌ Error Responses:**

#### **Missing Fill Data:**
```json
{
  "success": false,
  "error": "Missing required field: fill",
  "message": "Fill percentage is required"
}
```

#### **Invalid Fill Percentage:**
```json
{
  "success": false,
  "error": "Invalid fill percentage",
  "message": "Fill must be between 0 and 100"
}
```

---

## 🔧 **ESP32 Arduino Code Example**

Here's how your ESP32 should send data:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://YOUR_PC_IP:3000/api/update";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    sendBinData();
    delay(30000); // Send data every 30 seconds
  }
}

void sendBinData() {
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["fill"] = getFillPercentage(); // Your sensor reading
  doc["binId"] = "BIN001";
  doc["location"] = "Building A";
  doc["timestamp"] = getCurrentTime();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error sending data: " + String(httpResponseCode));
  }
  
  http.end();
}

int getFillPercentage() {
  // Your ultrasonic sensor or weight sensor code here
  // Return percentage (0-100)
  return random(0, 101); // Example: random value
}

String getCurrentTime() {
  // Return current timestamp
  return "2024-01-10T10:30:00Z";
}
```

---

## 🌐 **Network Configuration**

### **For ESP32 to Connect:**

1. **Find Your PC's IP Address:**
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. **Update ESP32 Code:**
   - Replace `YOUR_PC_IP` with your actual IP address
   - Example: `http://192.168.1.100:3000/api/update`

3. **WiFi Credentials:**
   - Update `ssid` and `password` in ESP32 code
   - Make sure ESP32 and PC are on same network

---

## 🧪 **Testing Workflow**

### **Step 1: Test with Postman**
1. Send basic request: `{"fill": 72}`
2. Verify response: `"success": true`
3. Check server console for logs

### **Step 2: Test Different Scenarios**
1. **Empty Bin**: `{"fill": 0}`
2. **Half Full**: `{"fill": 50}`
3. **Full Bin**: `{"fill": 100}`
4. **Invalid Data**: `{"fill": 150}` (should error)

### **Step 3: Test ESP32 Connection**
1. Upload code to ESP32
2. Monitor Serial output
3. Check server logs for incoming data

---

## 📊 **Server Console Output**

When ESP32 sends data, you'll see:
```
📡 ESP32 Data Received: {
  fill: 72,
  binId: 'BIN001',
  location: 'Building A',
  timestamp: '2024-01-10T10:30:00Z'
}
✅ ESP32 Response: {
  success: true,
  message: 'ESP32 data received successfully',
  data: { ... }
}
```

---

## 🎯 **Next Steps**

1. **Test Postman requests** with different fill values
2. **Upload ESP32 code** with your network settings
3. **Monitor server logs** for incoming data
4. **Add database storage** (optional enhancement)

The ESP32 WiFi communication is now ready! 🚀📡
