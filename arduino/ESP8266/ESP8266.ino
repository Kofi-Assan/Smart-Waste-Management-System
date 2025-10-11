#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

#define TRIG D5
#define ECHO D6

#define LED_GREEN D1
#define LED_YELLOW D2
#define LED_RED D3

const int BIN_HEIGHT = 33.3; // cm, adjust to your bin depth

// WiFi credentials - UPDATE THESE
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend server details - UPDATE THESE
const char* serverURL = "http://YOUR_SERVER_IP:3000/api/bins/update";
const char* deviceId = "ESP8266_BIN_001";

// Update interval (milliseconds)
const unsigned long UPDATE_INTERVAL = 30000; // 30 seconds
unsigned long lastUpdate = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  long duration;
  int distance, levelPercent;

  // Send ultrasonic pulse
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  duration = pulseIn(ECHO, HIGH);
  distance = duration * 0.034 / 2; // cm

  // Calculate fill level
  if (distance > BIN_HEIGHT) distance = BIN_HEIGHT;
  if (distance < 0) distance = 0;

  levelPercent = ((BIN_HEIGHT - distance) * 100) / BIN_HEIGHT;

  // Show in Serial
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.print(" cm | Fill: ");
  Serial.print(levelPercent);
  Serial.println("%");

  // LED indicators
  if (levelPercent < 40) {        // Green: <40% full
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_RED, LOW);
  } else if (levelPercent < 80) { // Yellow: 40–79% full
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, HIGH);
    digitalWrite(LED_RED, LOW);
  } else {                        // Red: ≥80% full
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_RED, HIGH);
  }

  // Send data to backend every UPDATE_INTERVAL
  if (millis() - lastUpdate >= UPDATE_INTERVAL) {
    sendDataToBackend(levelPercent, distance);
    lastUpdate = millis();
  }

  delay(1000);
}

void connectToWiFi() {
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Server URL: ");
  Serial.println(serverURL);
}

void sendDataToBackend(int level, int distance) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, attempting to reconnect...");
    connectToWiFi();
    return;
  }

  WiFiClient client;
  HTTPClient http;

  // Prepare JSON data
  DynamicJsonDocument doc(1024);
  doc["binId"] = 1; // Default bin ID
  doc["level"] = level;
  doc["distance"] = distance;
  doc["deviceId"] = deviceId;
  doc["location"] = "Academic City University College";
  doc["timestamp"] = millis(); // You can use a proper timestamp if needed
  // doc["userId"] = 1; // Uncomment and set to specific user ID if needed

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.println("Sending data to backend:");
  Serial.println(jsonString);

  http.begin(client, serverURL);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response Code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.print("Error on HTTP request: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}