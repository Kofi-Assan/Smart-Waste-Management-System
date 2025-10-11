# Arduino ESP8266 Setup Guide

## Prerequisites
- ESP8266 NodeMCU or similar WiFi-enabled Arduino board
- Ultrasonic sensor (HC-SR04)
- 3 LEDs (Green, Yellow, Red)
- Jumper wires
- Arduino IDE with ESP8266 board support

## Hardware Connections

### ESP8266 Pin Connections:
```
Ultrasonic Sensor:
- VCC → 3.3V
- GND → GND
- TRIG → D5
- ECHO → D6

LEDs:
- Green LED → D1 (with 220Ω resistor)
- Yellow LED → D2 (with 220Ω resistor)
- Red LED → D3 (with 220Ω resistor)
- All LED cathodes → GND
```

## Software Setup

### 1. Install Required Libraries
In Arduino IDE, install these libraries:
- ESP8266WiFi (usually included)
- ESP8266HTTPClient (usually included)
- ArduinoJson (install from Library Manager)

### 2. Configure WiFi and Server Settings
Edit the following variables in `ESP8266.ino`:

```cpp
// WiFi credentials - UPDATE THESE
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend server details - UPDATE THESE
const char* serverURL = "http://YOUR_SERVER_IP:3000/api/bins/update";
```

### 3. Server Configuration
Replace `YOUR_SERVER_IP` with your computer's IP address:
- Windows: Run `ipconfig` in Command Prompt
- Mac/Linux: Run `ifconfig` in Terminal
- Use the IP address of your computer (not localhost/127.0.0.1)

### 4. Upload Code
1. Select your ESP8266 board in Arduino IDE
2. Set the correct COM port
3. Upload the code to your ESP8266

## Testing

### 1. Serial Monitor
Open Serial Monitor (115200 baud) to see:
- WiFi connection status
- Distance measurements
- Fill level percentages
- HTTP requests to backend

### 2. Backend Testing
Use the provided Postman collection to test the API endpoints:
1. Import `Smart_Waste_Management_API.postman_collection.json` into Postman
2. Test the "Arduino Sensor Data Update" endpoint
3. Verify data appears in your web dashboard

### 3. Web Dashboard
1. Start your backend server: `npm start` in the backend directory
2. Open your web application
3. Login to see real-time bin data updates

## Troubleshooting

### WiFi Connection Issues
- Verify WiFi credentials are correct
- Check if your network allows IoT devices
- Ensure ESP8266 is within WiFi range

### Backend Connection Issues
- Verify server IP address is correct
- Ensure backend server is running on port 3000
- Check firewall settings allow connections on port 3000

### Sensor Issues
- Verify ultrasonic sensor connections
- Check if sensor is working with Serial Monitor
- Adjust `BIN_HEIGHT` constant if measurements are incorrect

### LED Issues
- Verify LED connections and resistor values
- Check if LEDs are working by testing individual pins

## Data Flow

1. **ESP8266** reads ultrasonic sensor every second
2. **Calculates** fill level percentage based on distance
3. **Updates** LED indicators based on fill level
4. **Sends** data to backend every 30 seconds via HTTP POST
5. **Backend** updates database with new bin status
6. **Web dashboard** refreshes every 30 seconds to show latest data

## API Endpoint

The ESP8266 sends data to: `POST /api/bins/update`

Request body:
```json
{
  "binId": 1,
  "level": 75,
  "distance": 8.3,
  "deviceId": "ESP8266_BIN_001",
  "location": "Academic City University College",
  "timestamp": 1696789123456
}
```

Response:
```json
{
  "message": "Bin data updated successfully",
  "binId": 1,
  "level": 75,
  "status": "Almost Full",
  "timestamp": "2025-10-09T19:09:31.146Z"
}
```

## Customization

### Update Interval
Change `UPDATE_INTERVAL` constant to modify how often data is sent:
```cpp
const unsigned long UPDATE_INTERVAL = 30000; // 30 seconds
```

### Bin Height
Adjust `BIN_HEIGHT` constant to match your actual bin depth:
```cpp
const int BIN_HEIGHT = 33.3; // cm, adjust to your bin depth
```

### LED Thresholds
Modify the LED control logic to change when LEDs turn on:
```cpp
if (levelPercent < 40) {        // Green: <40% full
  // Green LED logic
} else if (levelPercent < 80) { // Yellow: 40–79% full
  // Yellow LED logic
} else {                        // Red: ≥80% full
  // Red LED logic
}
```
