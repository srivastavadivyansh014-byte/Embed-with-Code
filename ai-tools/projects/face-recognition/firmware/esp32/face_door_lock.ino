#include <Servo.h>

Servo doorServo;

// Pins
#define SERVO_PIN 4
#define RED_LED 2
#define GREEN_LED 5

void setup() {

  Serial.begin(115200);

  doorServo.attach(SERVO_PIN);

  pinMode(RED_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);

  // Initial state = CLOSED
  doorServo.write(0);

  digitalWrite(RED_LED, HIGH);
  digitalWrite(GREEN_LED, LOW);

  Serial.println("DOOR LOCK READY");
}

void loop() {

  if (Serial.available()) {

    String command = Serial.readStringUntil('\n');
    command.trim();

    // =========================
    // OPEN
    // =========================

    if (command == "OPEN") {

      doorServo.write(90);

      digitalWrite(RED_LED, LOW);
      digitalWrite(GREEN_LED, HIGH);

      Serial.println("DOOR OPEN");

    }

    // =========================
    // CLOSE
    // =========================

    else if (command == "CLOSE") {

      doorServo.write(0);

      digitalWrite(RED_LED, HIGH);
      digitalWrite(GREEN_LED, LOW);

      Serial.println("DOOR CLOSED");
    }
  }
}