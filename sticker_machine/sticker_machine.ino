/*
 * ============================================================
 *  מכונת הדבקת מדבקות לכרטיסי אשראי
 *  Sticker Labeling Machine — Arduino Mega 2560
 * ============================================================
 *  
 *  חומרה:
 *    - Arduino Mega 2560
 *    - TMC2209 × 3 (דרייברים למנועי צעד)
 *    - NEMA17 × 3 (מנועי צעד 24V)
 *    - חיישן אופטי חריץ × 3
 *    - ספק 24V 10A + LM2596 (24V→5V)
 *  
 *  ספריות נדרשות:
 *    - AccelStepper (התקנה: Sketch → Include Library → Manage Libraries → חפש AccelStepper)
 *  
 *  פינים:
 *    D2  = S1 (חיישן פידר)
 *    D3  = S2 (חיישן אזור הדבקה)
 *    D4  = S3 (חיישן יציאה)
 *    D6  = M1 STEP (פידר)
 *    D7  = M1 DIR
 *    D8  = M2 STEP (הובלה)
 *    D9  = M2 DIR
 *    D10 = M3 STEP (מדבקה)
 *    D11 = M3 DIR
 *    D12 = EN (משותף לכל הדרייברים)
 *    D13 = LED מצב
 * 
 * ============================================================
 */

#include <AccelStepper.h>

// =============================================
//  הגדרות פינים
// =============================================

// חיישנים (INPUT_PULLUP, active LOW — LOW = יש כרטיס)
#define S1_PIN   2    // חיישן פידר
#define S2_PIN   3    // חיישן אזור הדבקה
#define S3_PIN   4    // חיישן יציאה

// מנוע M1 — פידר (דוחף כרטיס מהמחסנית)
#define M1_STEP  6
#define M1_DIR   7

// מנוע M2 — הובלה (רולרים מובילים לאורך המסילה)
#define M2_STEP  8
#define M2_DIR   9

// מנוע M3 — מדבקה (מושך רצועת מדבקות)
#define M3_STEP  10
#define M3_DIR   11

// Enable משותף (LOW = מנועים פעילים)
#define EN_PIN   12

// LED מצב
#define LED_PIN  13

// =============================================
//  קבועים מכניים — ניתן לכוונן!
// =============================================

// מנוע צעד
#define STEPS_PER_REV      200   // NEMA17 = 200 צעדים לסיבוב
#define MICROSTEPS         16    // TMC2209 microstepping
#define TOTAL_STEPS_PER_REV (STEPS_PER_REV * MICROSTEPS)  // = 3200

// רולר הובלה (M2) — קוטר 28 מ"מ
#define ROLLER_DIAMETER_MM   28.0
#define ROLLER_CIRC_MM       (3.14159 * ROLLER_DIAMETER_MM)  // ≈ 87.96 מ"מ

// צעדים למ"מ (עבור רולר ההובלה)
#define STEPS_PER_MM   (TOTAL_STEPS_PER_REV / ROLLER_CIRC_MM)  // ≈ 36.38

// רולר מדבקה (M3) — קוטר 28 מ"מ (אותו גודל)
#define LABEL_ROLLER_CIRC_MM  (3.14159 * 28.0)
#define LABEL_STEPS_PER_MM    (TOTAL_STEPS_PER_REV / LABEL_ROLLER_CIRC_MM)

// גלגל גומי פידר (M1) — קוטר 20 מ"מ
#define FEED_WHEEL_CIRC_MM    (3.14159 * 20.0)  // ≈ 62.83 מ"מ
#define FEED_STEPS_PER_MM     (TOTAL_STEPS_PER_REV / FEED_WHEEL_CIRC_MM)

// =============================================
//  מידות כרטיס ומדבקה
// =============================================

#define CARD_LENGTH_MM       85.6   // אורך כרטיס אשראי
#define CARD_WIDTH_MM        54.0   // רוחב כרטיס
#define STICKER_LENGTH_MM    28.0   // אורך מדבקה
#define STICKER_WIDTH_MM     54.0   // רוחב מדבקה

// מיקום המדבקה על הכרטיס (מרכז)
// מרחק מקצה קדמי של הכרטיס עד תחילת המדבקה
#define STICKER_OFFSET_MM    28.8   // (85.6 - 28.0) / 2

// =============================================
//  מרחקים בין מודולים — ניתן לכוונן!
// =============================================

// כמה מ"מ הפידר צריך לדחוף כדי שהכרטיס ייתפס ע"י ההובלה
float feedDistance = 55.0;

// מרחק מ-S2 (חיישן) עד נקודת ההדבקה בפועל
// זה הערך שתכוונן כדי שהמדבקה תהיה במיקום הנכון!
float labelTriggerOffset = 30.0;

// מרחק נוסף אחרי הדבקה עד שהכרטיס מגיע ל-S3
float exitDistance = 60.0;

// =============================================
//  מהירויות — ניתן לכוונן!
// =============================================

float feedSpeedMM    = 150.0;   // מ"מ/שנייה — מהירות פידר
float transportSpeedMM = 250.0; // מ"מ/שנייה — מהירות הובלה
float labelSpeedMM   = 250.0;   // מ"מ/שנייה — מהירות משיכת מדבקה
                                 // *** חייב להיות זהה ל-transport! ***
float accelMM        = 500.0;   // מ"מ/שנייה² — תאוצה

// =============================================
//  מכונת מצבים (State Machine)
// =============================================

enum MachineState {
  STATE_IDLE,              // ממתין לכרטיס בפידר
  STATE_FEEDING,           // דוחף כרטיס מהמחסנית
  STATE_TRANSPORT,         // מוביל כרטיס לאזור הדבקה
  STATE_LABEL_OFFSET,      // ממתין שהכרטיס יתקדם למיקום הנכון
  STATE_LABELING,          // מדביק מדבקה (M2 + M3 מסונכרנים)
  STATE_EXIT,              // מוציא כרטיס
  STATE_TEST_MENU,         // תפריט בדיקה
  STATE_ERROR              // שגיאה
};

// =============================================
//  אובייקטים
// =============================================

AccelStepper motorFeed(AccelStepper::DRIVER, M1_STEP, M1_DIR);
AccelStepper motorTransport(AccelStepper::DRIVER, M2_STEP, M2_DIR);
AccelStepper motorLabel(AccelStepper::DRIVER, M3_STEP, M3_DIR);

// =============================================
//  משתנים גלובליים
// =============================================

MachineState currentState = STATE_IDLE;
unsigned long stateStartTime = 0;
unsigned long cycleCount = 0;
unsigned long lastLedToggle = 0;
bool ledState = false;

// מיקום S2 (בצעדים) כשהחיישן מופעל
long s2TriggerPosition = 0;

// דגל — האם ההדבקה כבר התחילה
bool labelStarted = false;

// Timeout — הגנה מפני תקיעות (מילישניות)
#define STATE_TIMEOUT  8000

// =============================================
//  SETUP
// =============================================

void setup() {
  Serial.begin(115200);
  Serial.println(F(""));
  Serial.println(F("========================================"));
  Serial.println(F("  Sticker Machine v1.0"));
  Serial.println(F("  Credit Card Label Applicator"));
  Serial.println(F("========================================"));

  // --- פינים ---
  pinMode(S1_PIN, INPUT_PULLUP);
  pinMode(S2_PIN, INPUT_PULLUP);
  pinMode(S3_PIN, INPUT_PULLUP);
  pinMode(EN_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  // מנועים כבויים בהתחלה
  digitalWrite(EN_PIN, HIGH);

  // --- הגדרת מנועים ---
  updateMotorSpeeds();

  // --- הדלקת מנועים ---
  digitalWrite(EN_PIN, LOW);

  Serial.println(F(""));
  Serial.println(F("System ready."));
  Serial.println(F("Insert cards into feeder magazine."));
  Serial.println(F(""));
  Serial.println(F("Type 'T' for test menu, 'S' for status"));
  Serial.println(F("========================================"));
}

// =============================================
//  LOOP ראשי
// =============================================

void loop() {
  // --- קריאת פקודות סריאל ---
  handleSerial();

  // --- מכונת מצבים ---
  switch (currentState) {
    case STATE_IDLE:             stateIdle();            break;
    case STATE_FEEDING:          stateFeeding();         break;
    case STATE_TRANSPORT:        stateTransport();       break;
    case STATE_LABEL_OFFSET:     stateLabelOffset();     break;
    case STATE_LABELING:         stateLabeling();        break;
    case STATE_EXIT:             stateExit();            break;
    case STATE_TEST_MENU:        stateTestMenu();        break;
    case STATE_ERROR:            stateError();           break;
  }

  // --- הרצת מנועים (non-blocking) ---
  motorFeed.run();
  motorTransport.run();
  motorLabel.run();

  // --- LED ---
  updateLed();
}

// =============================================
//  מצב: IDLE — ממתין לכרטיס
// =============================================

void stateIdle() {
  if (readSensor(S1_PIN)) {
    // כרטיס זוהה בפידר!
    Serial.println(F("[IDLE → FEED] Card detected in feeder"));
    
    // אפס מיקומים
    motorFeed.setCurrentPosition(0);
    motorTransport.setCurrentPosition(0);
    motorLabel.setCurrentPosition(0);
    
    // הזז פידר
    long steps = mmToStepsFeed(feedDistance);
    motorFeed.moveTo(steps);
    
    changeState(STATE_FEEDING);
  }
}

// =============================================
//  מצב: FEEDING — דוחף כרטיס
// =============================================

void stateFeeding() {
  if (checkTimeout()) return;

  // הפידר סיים לדחוף?
  if (motorFeed.distanceToGo() == 0) {
    Serial.println(F("[FEED → TRANSPORT] Card on rails"));
    
    // מתחיל הובלה — מרחק גדול, נעצור כש-S2 מופעל
    long maxSteps = mmToStepsTransport(300.0);
    motorTransport.moveTo(maxSteps);
    
    changeState(STATE_TRANSPORT);
  }
}

// =============================================
//  מצב: TRANSPORT — מוביל לאזור הדבקה
// =============================================

void stateTransport() {
  if (checkTimeout()) return;

  // S2 מופעל? (כרטיס הגיע לאזור ההדבקה)
  if (readSensor(S2_PIN)) {
    Serial.println(F("[TRANSPORT → LABEL_OFFSET] S2 triggered!"));
    
    // שמור מיקום נוכחי
    s2TriggerPosition = motorTransport.currentPosition();
    
    // חשב מיקום יעד: S2 + offset + אורך מדבקה + מרווח
    float totalMM = labelTriggerOffset + STICKER_LENGTH_MM + exitDistance;
    long targetSteps = s2TriggerPosition + mmToStepsTransport(totalMM);
    motorTransport.moveTo(targetSteps);
    
    labelStarted = false;
    changeState(STATE_LABEL_OFFSET);
  }
  
  // הובלה הגיעה למקסימום בלי S2?
  if (motorTransport.distanceToGo() == 0 && !readSensor(S2_PIN)) {
    Serial.println(F("[ERROR] Card not detected at S2!"));
    changeState(STATE_ERROR);
  }
}

// =============================================
//  מצב: LABEL_OFFSET — ממתין למיקום הנכון
// =============================================

void stateLabelOffset() {
  if (checkTimeout()) return;

  // חשב כמה מ"מ הכרטיס התקדם מאז S2
  long stepsSinceS2 = motorTransport.currentPosition() - s2TriggerPosition;
  float mmSinceS2 = stepsToMmTransport(stepsSinceS2);

  // הגענו למיקום ההדבקה?
  if (mmSinceS2 >= labelTriggerOffset) {
    Serial.print(F("[LABEL_OFFSET → LABELING] Starting label at offset "));
    Serial.print(mmSinceS2, 1);
    Serial.println(F(" mm"));
    
    // התחל מנוע מדבקה — מסונכרן עם ההובלה!
    long labelSteps = mmToStepsLabel(STICKER_LENGTH_MM * 1.05); // 5% נוסף
    motorLabel.moveTo(labelSteps);
    
    // ודא שמהירות המדבקה = מהירות ההובלה (מ"מ/שנייה!)
    float labelStepsPerSec = labelSpeedMM * LABEL_STEPS_PER_MM;
    motorLabel.setMaxSpeed(labelStepsPerSec);
    
    labelStarted = true;
    changeState(STATE_LABELING);
  }
}

// =============================================
//  מצב: LABELING — הדבקה בתנועה
// =============================================

void stateLabeling() {
  if (checkTimeout()) return;

  // S3 מופעל? (כרטיס הגיע ליציאה)
  if (readSensor(S3_PIN)) {
    Serial.println(F("[LABELING → EXIT] S3 triggered"));
    
    // עצור מדבקה
    if (motorLabel.distanceToGo() > 0) {
      motorLabel.stop();
    }
    
    // דחוף את הכרטיס עוד קצת ליציאה מלאה
    long exitSteps = mmToStepsTransport(30.0);
    long currentTarget = motorTransport.targetPosition();
    motorTransport.moveTo(currentTarget + exitSteps);
    
    changeState(STATE_EXIT);
    return;
  }

  // מנוע מדבקה סיים?
  if (labelStarted && motorLabel.distanceToGo() == 0) {
    Serial.println(F("[LABELING] Label application complete"));
  }
  
  // ההובלה סיימה את כל המרחק?
  if (motorTransport.distanceToGo() == 0) {
    Serial.println(F("[LABELING → EXIT] Transport done"));
    changeState(STATE_EXIT);
  }
}

// =============================================
//  מצב: EXIT — סיום מחזור
// =============================================

void stateExit() {
  // ממתין שההובלה תסיים
  if (motorTransport.distanceToGo() == 0) {
    cycleCount++;
    Serial.println(F(""));
    Serial.print(F("=== Cycle #"));
    Serial.print(cycleCount);
    Serial.println(F(" COMPLETE ==="));
    Serial.println(F(""));
    
    // אפס מנועים
    motorFeed.setCurrentPosition(0);
    motorTransport.setCurrentPosition(0);
    motorLabel.setCurrentPosition(0);
    
    // השהייה קצרה לפני מחזור הבא
    delay(200);
    
    changeState(STATE_IDLE);
  }
}

// =============================================
//  מצב: ERROR — שגיאה
// =============================================

void stateError() {
  // עצור הכל
  motorFeed.stop();
  motorTransport.stop();
  motorLabel.stop();

  // LED מהבהב מהיר (מטופל ב-updateLed)

  // ממתין לפקודת סריאל לאיפוס
  // (או לניקוי כל החיישנים)
  if (!readSensor(S1_PIN) && !readSensor(S2_PIN) && !readSensor(S3_PIN)) {
    // כל החיישנים פנויים — אפשר לאפס
    // (רק דרך פקודת סריאל 'R')
  }
}

// =============================================
//  תפריט בדיקה (Test Menu)
// =============================================

void stateTestMenu() {
  // נשאר כאן עד פקודת 'X' (יציאה)
  // הפקודות מטופלות ב-handleSerial()
}

// =============================================
//  פקודות סריאל
// =============================================

void handleSerial() {
  if (!Serial.available()) return;
  
  char cmd = Serial.read();
  // ניקוי באפר
  while (Serial.available()) Serial.read();
  
  switch (cmd) {
    case 'T':
    case 't':
      enterTestMenu();
      break;

    case 'X':
    case 'x':
      exitTestMenu();
      break;

    case 'S':
    case 's':
      printStatus();
      break;

    case 'R':
    case 'r':
      resetMachine();
      break;

    // --- פקודות תפריט בדיקה ---
    case '1':
      if (currentState == STATE_TEST_MENU) testMotor1();
      break;
    case '2':
      if (currentState == STATE_TEST_MENU) testMotor2();
      break;
    case '3':
      if (currentState == STATE_TEST_MENU) testMotor3();
      break;
    case '4':
      if (currentState == STATE_TEST_MENU) testSensors();
      break;
    case '5':
      if (currentState == STATE_TEST_MENU) testSingleCycle();
      break;
    case '6':
      if (currentState == STATE_TEST_MENU) adjustLabelOffset(+1.0);
      break;
    case '7':
      if (currentState == STATE_TEST_MENU) adjustLabelOffset(-1.0);
      break;
    case '8':
      if (currentState == STATE_TEST_MENU) adjustSpeed(+10.0);
      break;
    case '9':
      if (currentState == STATE_TEST_MENU) adjustSpeed(-10.0);
      break;
  }
}

void enterTestMenu() {
  // עצור מנועים
  motorFeed.stop();
  motorTransport.stop();
  motorLabel.stop();
  
  changeState(STATE_TEST_MENU);
  
  Serial.println(F(""));
  Serial.println(F("======= TEST MENU ======="));
  Serial.println(F("1 — Test M1 (Feeder)"));
  Serial.println(F("2 — Test M2 (Transport)"));
  Serial.println(F("3 — Test M3 (Label)"));
  Serial.println(F("4 — Read Sensors"));
  Serial.println(F("5 — Run Single Cycle"));
  Serial.println(F("6 — Label offset +1mm"));
  Serial.println(F("7 — Label offset -1mm"));
  Serial.println(F("8 — Speed +10mm/s"));
  Serial.println(F("9 — Speed -10mm/s"));
  Serial.println(F("S — Show Status"));
  Serial.println(F("R — Reset"));
  Serial.println(F("X — Exit test menu"));
  Serial.println(F("========================="));
}

void exitTestMenu() {
  Serial.println(F("Exiting test menu → IDLE"));
  motorFeed.setCurrentPosition(0);
  motorTransport.setCurrentPosition(0);
  motorLabel.setCurrentPosition(0);
  changeState(STATE_IDLE);
}

void testMotor1() {
  Serial.println(F("Testing M1 (Feeder) — 1 revolution forward"));
  motorFeed.setCurrentPosition(0);
  motorFeed.moveTo(TOTAL_STEPS_PER_REV);
  // יסתובב ב-loop הראשי
}

void testMotor2() {
  Serial.println(F("Testing M2 (Transport) — 1 revolution forward"));
  motorTransport.setCurrentPosition(0);
  motorTransport.moveTo(TOTAL_STEPS_PER_REV);
}

void testMotor3() {
  Serial.println(F("Testing M3 (Label) — 1 revolution forward"));
  motorLabel.setCurrentPosition(0);
  motorLabel.moveTo(TOTAL_STEPS_PER_REV);
}

void testSensors() {
  Serial.println(F("--- Sensor Status ---"));
  Serial.print(F("S1 (Feeder):  "));
  Serial.println(readSensor(S1_PIN) ? F("BLOCKED (card present)") : F("CLEAR"));
  Serial.print(F("S2 (Label):   "));
  Serial.println(readSensor(S2_PIN) ? F("BLOCKED (card present)") : F("CLEAR"));
  Serial.print(F("S3 (Exit):    "));
  Serial.println(readSensor(S3_PIN) ? F("BLOCKED (card present)") : F("CLEAR"));
  Serial.println(F("---"));
}

void testSingleCycle() {
  Serial.println(F("Starting single test cycle..."));
  motorFeed.setCurrentPosition(0);
  motorTransport.setCurrentPosition(0);
  motorLabel.setCurrentPosition(0);
  changeState(STATE_IDLE);
  // ה-loop הרגיל יתחיל מחזור כשיזהה כרטיס
}

void adjustLabelOffset(float delta) {
  labelTriggerOffset += delta;
  if (labelTriggerOffset < 0) labelTriggerOffset = 0;
  if (labelTriggerOffset > 80) labelTriggerOffset = 80;
  Serial.print(F("Label offset = "));
  Serial.print(labelTriggerOffset, 1);
  Serial.println(F(" mm"));
}

void adjustSpeed(float delta) {
  transportSpeedMM += delta;
  labelSpeedMM = transportSpeedMM;  // חייבים להיות שווים!
  if (transportSpeedMM < 50) transportSpeedMM = 50;
  if (transportSpeedMM > 400) transportSpeedMM = 400;
  labelSpeedMM = transportSpeedMM;
  updateMotorSpeeds();
  Serial.print(F("Transport speed = "));
  Serial.print(transportSpeedMM, 1);
  Serial.println(F(" mm/s"));
}

void printStatus() {
  Serial.println(F(""));
  Serial.println(F("--- Machine Status ---"));
  Serial.print(F("State: "));
  printStateName();
  Serial.print(F("Cycles completed: "));
  Serial.println(cycleCount);
  Serial.print(F("Feed distance: "));
  Serial.print(feedDistance, 1);
  Serial.println(F(" mm"));
  Serial.print(F("Label offset: "));
  Serial.print(labelTriggerOffset, 1);
  Serial.println(F(" mm"));
  Serial.print(F("Transport speed: "));
  Serial.print(transportSpeedMM, 1);
  Serial.println(F(" mm/s"));
  Serial.println(F(""));
  testSensors();
  Serial.print(F("M1 pos: "));
  Serial.print(stepsToMmFeed(motorFeed.currentPosition()), 1);
  Serial.println(F(" mm"));
  Serial.print(F("M2 pos: "));
  Serial.print(stepsToMmTransport(motorTransport.currentPosition()), 1);
  Serial.println(F(" mm"));
  Serial.print(F("M3 pos: "));
  Serial.print(stepsToMmLabel(motorLabel.currentPosition()), 1);
  Serial.println(F(" mm"));
  Serial.println(F("---"));
}

void printStateName() {
  switch (currentState) {
    case STATE_IDLE:          Serial.println(F("IDLE"));          break;
    case STATE_FEEDING:       Serial.println(F("FEEDING"));       break;
    case STATE_TRANSPORT:     Serial.println(F("TRANSPORT"));     break;
    case STATE_LABEL_OFFSET:  Serial.println(F("LABEL_OFFSET"));  break;
    case STATE_LABELING:      Serial.println(F("LABELING"));      break;
    case STATE_EXIT:          Serial.println(F("EXIT"));          break;
    case STATE_TEST_MENU:     Serial.println(F("TEST_MENU"));     break;
    case STATE_ERROR:         Serial.println(F("ERROR"));         break;
  }
}

void resetMachine() {
  Serial.println(F("Resetting machine..."));
  motorFeed.stop();
  motorTransport.stop();
  motorLabel.stop();
  delay(500);
  motorFeed.setCurrentPosition(0);
  motorTransport.setCurrentPosition(0);
  motorLabel.setCurrentPosition(0);
  cycleCount = 0;
  changeState(STATE_IDLE);
  Serial.println(F("Machine reset. Ready."));
}

// =============================================
//  פונקציות עזר
// =============================================

// קריאת חיישן (active LOW — מחזיר true כשחסום)
bool readSensor(int pin) {
  return (digitalRead(pin) == LOW);
}

// המרת מ"מ לצעדים
long mmToStepsFeed(float mm) {
  return (long)(mm * FEED_STEPS_PER_MM);
}

long mmToStepsTransport(float mm) {
  return (long)(mm * STEPS_PER_MM);
}

long mmToStepsLabel(float mm) {
  return (long)(mm * LABEL_STEPS_PER_MM);
}

// המרת צעדים למ"מ
float stepsToMmFeed(long steps) {
  return (float)steps / FEED_STEPS_PER_MM;
}

float stepsToMmTransport(long steps) {
  return (float)steps / STEPS_PER_MM;
}

float stepsToMmLabel(long steps) {
  return (float)steps / LABEL_STEPS_PER_MM;
}

// עדכון מהירויות מנועים
void updateMotorSpeeds() {
  float feedStepsPerSec = feedSpeedMM * FEED_STEPS_PER_MM;
  float transportStepsPerSec = transportSpeedMM * STEPS_PER_MM;
  float labelStepsPerSec = labelSpeedMM * LABEL_STEPS_PER_MM;
  float accelSteps = accelMM * STEPS_PER_MM;

  motorFeed.setMaxSpeed(feedStepsPerSec);
  motorFeed.setAcceleration(accelSteps);

  motorTransport.setMaxSpeed(transportStepsPerSec);
  motorTransport.setAcceleration(accelSteps);

  motorLabel.setMaxSpeed(labelStepsPerSec);
  motorLabel.setAcceleration(accelSteps);
}

// שינוי מצב
void changeState(MachineState newState) {
  currentState = newState;
  stateStartTime = millis();
}

// בדיקת timeout
bool checkTimeout() {
  if (millis() - stateStartTime > STATE_TIMEOUT) {
    Serial.print(F("[TIMEOUT] State: "));
    printStateName();
    changeState(STATE_ERROR);
    return true;
  }
  return false;
}

// LED מצב
void updateLed() {
  unsigned long interval;
  switch (currentState) {
    case STATE_IDLE:       interval = 1000; break;  // איטי
    case STATE_ERROR:      interval = 100;  break;  // מהיר
    case STATE_TEST_MENU:  interval = 500;  break;  // בינוני
    default:               interval = 250;  break;  // עבודה
  }
  
  if (millis() - lastLedToggle >= interval) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    lastLedToggle = millis();
  }
}
