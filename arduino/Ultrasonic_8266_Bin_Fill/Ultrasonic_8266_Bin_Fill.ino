#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// Ultrasonic Sensor Pins
#define TRIG D5
#define ECHO D6

// LED Pins
#define LED_GREEN D1
#define LED_YELLOW D2
#define LED_RED D3

// Bin height in cm (adjust for your bin)
const int BIN_HEIGHT = 40;

// Wi-Fi Credentials
const char* ssid = "STARLINK 6G";
const char* password = "ubxu2898";

// Replace with your computer’s IPv4 and server port
// Example: http://192.168.0.105:3000/api/update
const char* serverName = "http://192.168.x.x:3000/api/update";

// Timing
unsigned long previousMillis = 0;
const long interval = 5000; // send data every 5 seconds

void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  // Start Wi-Fi connection
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Connected to WiFi!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Failed to connect to WiFi. Continuing offline...");
  }
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
  distance = duration * 0.034 / 2; // convert to cm

  // Cap distances to avoid negative or overflows
  if (distance > BIN_HEIGHT) distance = BIN_HEIGHT;
  if (distance < 0) distance = 0;

  // Calculate how full the bin is
  levelPercent = ((BIN_HEIGHT - distance) * 100) / BIN_HEIGHT;

  // Print to Serial
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.print(" cm | Fill: ");
  Serial.print(levelPercent);
  Serial.println("%");

  // LED logic based on fill level
  if (levelPercent < 40) {
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_RED, LOW);
  } else if (levelPercent < 80) {
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, HIGH);
    digitalWrite(LED_RED, LOW);
  } else {
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_RED, HIGH);
  }

  // Send data every 5 seconds
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("🔄 Reconnecting to WiFi...");
      WiFi.begin(ssid, password);
      delay(2000);
    }

    if (WiFi.status() == WL_CONNECTED) {
      WiFiClient client;
      HTTPClient http;

      // Send as query parameter
      String serverPath = String(serverName) + "?fill=" + String(levelPercent);

      Serial.print("📡 Sending to server: ");
      Serial.println(serverPath);

      http.begin(client, serverPath);
      int httpResponseCode = http.GET();

      if (httpResponseCode > 0) {
        Serial.print("✅ HTTP Response code: ");
        Serial.println(httpResponseCode);
      } else {
        Serial.print("⚠️ Error sending data. Code: ");
        Serial.println(httpResponseCode);
      }

      http.end();
    } else {
      Serial.println("🚫 WiFi not connected. Data not sent.");
    }
  }

  delay(1000); // sensor refresh rate
}
