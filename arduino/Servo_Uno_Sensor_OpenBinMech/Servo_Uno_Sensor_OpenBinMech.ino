#include <Servo.h>

Servo servo;

const int trigPin = 9;
const int echoPin = 10;
const int ledPin = 13;  // LED pin (use 13 for onboard LED or change to your chosen pin)

long duration;
int distance;

void setup() {
  servo.attach(6);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(ledPin, OUTPUT);   // ✅ Set LED pin as output

  servo.write(210);
  delay(500); //start closed at 90 degrees
  Serial.begin(9600);
}

void loop() {
  // Send ultrasonic pulse
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Read echo time
  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;

  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  // ✅ LED + Servo control logic
  if (distance < 50) {
    digitalWrite(ledPin, HIGH);   // Turn LED ON

    for (int pos = 90; pos >= 0; pos--) {
      servo.write(pos);
      delay(15); 
    }
    delay(3000); 

    for (int pos = 0; pos <= 90; pos++) {
      servo.write(pos);
      delay(15);
    }

    delay(100);
  } else {
    digitalWrite(ledPin, LOW);    // Turn LED OFF if no object close
  }

  delay(100);
}
