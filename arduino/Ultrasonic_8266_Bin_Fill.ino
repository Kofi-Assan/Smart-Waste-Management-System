#define TRIG D5
#define ECHO D6

#define LED_GREEN D1
#define LED_YELLOW D2
#define LED_RED D3

const int BIN_HEIGHT = 40; // cm, adjust to your bin depth

void setup() {
  Serial.begin(115200);

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
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

  delay(1000);
}