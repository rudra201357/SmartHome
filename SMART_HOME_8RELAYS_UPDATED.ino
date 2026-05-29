#include "RMaker.h"
#include "WiFi.h"
#include "WiFiProv.h"
#include <IRremote.h>
#include <Preferences.h>

// ------------------- SERVICE DETAILS -------------------
const char *service_name = "RudraHome";
const char *pop = "12345678";

char nodeName[] = "ESP32_Home";

// ------------------- DEVICE NAMES -------------------
char deviceName_1[] = "LED";
char deviceName_2[] = "Small LED";
char deviceName_3[] = "Night Lamp";
char deviceName_4[] = "Smart Light";
char deviceName_5[] = "Charging Port";
char deviceName_6[] = "Shelf Light";
char deviceName_7[] = "Relay7";
char deviceName_8[] = "Home Theatre";

// ------------------- RELAY PINS -------------------
uint8_t RelayPin[] = {23, 22, 21, 19, 18, 5, 25, 26};

// ------------------- IR REMOTE SETUP -------------------
uint8_t IR_RECV_PIN = 4;  // IR receiver pin
IRrecv irrecv(IR_RECV_PIN);
decode_results results;

// IR Remote Button Codes (Update these based on your remote)
uint32_t IR_BUTTON_1 = 0xFF30CF;   // Remote Button 1
uint32_t IR_BUTTON_2 = 0xFF18E7;   // Remote Button 2
uint32_t IR_BUTTON_3 = 0xFF7A85;   // Remote Button 3
uint32_t IR_BUTTON_4 = 0xFF10EF;   // Remote Button 4
uint32_t IR_BUTTON_5 = 0xFF38C7;   // Remote Button 5
uint32_t IR_BUTTON_6 = 0xFF5AA5;   // Remote Button 6
uint32_t IR_BUTTON_7 = 0xFF42BD;   // Remote Button 7
uint32_t IR_BUTTON_8 = 0xFF4AB5;   // Remote Button 8

// ------------------- STATUS LED -------------------
uint8_t wifiLed = 2;

// ------------------- RESET BUTTON -------------------
uint8_t gpio_reset = 0;

// ------------------- STATES -------------------
bool toggleState[8] = {0};
Preferences relayStore;

// ------------------- RAINMAKER SWITCHES -------------------
Switch my_switch1(deviceName_1, &RelayPin[0]);
Switch my_switch2(deviceName_2, &RelayPin[1]);
Switch my_switch3(deviceName_3, &RelayPin[2]);
Switch my_switch4(deviceName_4, &RelayPin[3]);
Switch my_switch5(deviceName_5, &RelayPin[4]);
Switch my_switch6(deviceName_6, &RelayPin[5]);
Switch my_switch7(deviceName_7, &RelayPin[6]);
Switch my_switch8(deviceName_8, &RelayPin[7]);

Switch *switchArray[] = {
  &my_switch1,
  &my_switch2,
  &my_switch3,
  &my_switch4,
  &my_switch5,
  &my_switch6,
  &my_switch7,
  &my_switch8
};

// =====================================================
// PRINT AVAILABLE IR CODES
// =====================================================
void print_ir_codes()
{
  Serial.println("\n========================================");
  Serial.println("IR BUTTON CODES CONFIGURED:");
  Serial.println("========================================");
  Serial.println("Button 1 (LED):              0x" + String(IR_BUTTON_1, HEX));
  Serial.println("Button 2 (Small LED):       0x" + String(IR_BUTTON_2, HEX));
  Serial.println("Button 3 (Night Lamp):      0x" + String(IR_BUTTON_3, HEX));
  Serial.println("Button 4 (Smart Light):     0x" + String(IR_BUTTON_4, HEX));
  Serial.println("Button 5 (Charging Port):   0x" + String(IR_BUTTON_5, HEX));
  Serial.println("Button 6 (Shelf Light):     0x" + String(IR_BUTTON_6, HEX));
  Serial.println("Button 7 (Relay7):          0x" + String(IR_BUTTON_7, HEX));
  Serial.println("Button 8 (Home Theatre):    0x" + String(IR_BUTTON_8, HEX));
  Serial.println("========================================\n");
}

// =====================================================
// SERIAL COMMAND PROCESSING
// =====================================================
void process_serial_commands()
{
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    if (command.startsWith("ON ")) {
      int relay = command.substring(3).toInt() - 1;
      if (relay >= 0 && relay < 8) {
        if (!toggleState[relay]) {
          control_relay(relay);
        }
      } else {
        Serial.println("Invalid relay number. Use: ON 1-8");
      }
    }
    else if (command.startsWith("OFF ")) {
      int relay = command.substring(4).toInt() - 1;
      if (relay >= 0 && relay < 8) {
        if (toggleState[relay]) {
          control_relay(relay);
        }
      } else {
        Serial.println("Invalid relay number. Use: OFF 1-8");
      }
    }
    else if (command == "STATUS") {
      Serial.println("\nRelay Status:");
      for (int i = 0; i < 8; i++) {
        Serial.print("Relay ");
        Serial.print(i + 1);
        Serial.print(" (");
        Serial.print(switchArray[i]->getDeviceName());
        Serial.print("): ");
        Serial.println(toggleState[i] ? "ON" : "OFF");
      }
      Serial.println();
    }
    else if (command == "HELP") {
      Serial.println("\n========== COMMAND HELP ==========");
      Serial.println("ON <1-8>     - Turn ON relay 1-8");
      Serial.println("OFF <1-8>    - Turn OFF relay 1-8");
      Serial.println("STATUS       - Show all relay status");
      Serial.println("CODES        - Show IR button codes");
      Serial.println("HELP         - Show this help menu");
      Serial.println("==================================\n");
    }
    else if (command == "CODES") {
      print_ir_codes();
    }
    else {
      Serial.println("Unknown command. Type 'HELP' for available commands.");
    }
  }
}

// =====================================================
// WRITE CALLBACK
// =====================================================
void write_callback(Device *device,
                    Param *param,
                    const param_val_t val,
                    void *priv_data,
                    write_ctx_t *ctx)
{

  for (int i = 0; i < 8; i++) {

    if (strcmp(device->getDeviceName(),
               switchArray[i]->getDeviceName()) == 0) {

      toggleState[i] = val.val.b;

      digitalWrite(RelayPin[i],
                   toggleState[i] ? LOW : HIGH);

      save_relay_state(i);
      param->updateAndReport(val);
    }
  }
}

// =====================================================
// IR REMOTE CONTROL
// =====================================================
void ir_remote_control()
{
  if (irrecv.decode(&results)) {
    uint32_t value = results.value;
    
    Serial.print("IR Code Received: 0x");
    Serial.println(value, HEX);
    
    // Map IR buttons to relays
    if (value == IR_BUTTON_1) {
      control_relay(0);
      Serial.println("Button 1 - LED Toggled");
    }
    else if (value == IR_BUTTON_2) {
      control_relay(1);
      Serial.println("Button 2 - Small LED Toggled");
    }
    else if (value == IR_BUTTON_3) {
      control_relay(2);
      Serial.println("Button 3 - Night Lamp Toggled");
    }
    else if (value == IR_BUTTON_4) {
      control_relay(3);
      Serial.println("Button 4 - Smart Light Toggled");
    }
    else if (value == IR_BUTTON_5) {
      control_relay(4);
      Serial.println("Button 5 - Charging Port Toggled");
    }
    else if (value == IR_BUTTON_6) {
      control_relay(5);
      Serial.println("Button 6 - Shelf Light Toggled");
    }
    else if (value == IR_BUTTON_7) {
      control_relay(6);
      Serial.println("Button 7 - Relay7 Toggled");
    }
    else if (value == IR_BUTTON_8) {
      control_relay(7);
      Serial.println("Button 8 - Home Theatre Toggled");
    }
    
    irrecv.resume(); // Ready for next code
  }
}

// =====================================================
// CONTROL RELAY AND UPDATE RAINMAKER
// =====================================================
void control_relay(int relay_index)
{
  if (relay_index >= 0 && relay_index < 8) {
    // Toggle state
    toggleState[relay_index] = !toggleState[relay_index];
    
    // Control relay
    digitalWrite(RelayPin[relay_index], toggleState[relay_index] ? LOW : HIGH);

    save_relay_state(relay_index);
    
    // Update RainMaker
    switchArray[relay_index]->updateAndReportParam(
      ESP_RMAKER_DEF_POWER_NAME,
      toggleState[relay_index]
    );
    
    Serial.print("Relay ");
    Serial.print(relay_index + 1);
    Serial.print(" - State: ");
    Serial.println(toggleState[relay_index] ? "ON" : "OFF");
  }
}

// =====================================================
// WIFI EVENT
// =====================================================
void sysProvEvent(arduino_event_t *sys_event)
{
  switch (sys_event->event_id) {

    case ARDUINO_EVENT_WIFI_STA_CONNECTED:
      Serial.println("WiFi Connected");
      digitalWrite(wifiLed, HIGH);
      break;

    case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
      Serial.println("WiFi Disconnected");
      digitalWrite(wifiLed, LOW);
      break;

    default:
      break;
  }
}

// =====================================================
// SETUP
// =====================================================
void setup()
{
  Serial.begin(115200);
  relayStore.begin("relay-state", false);
  
  delay(1000);
  Serial.println("\n\nStarting Smart Home System...");

  // RELAY SETUP
  for (int i = 0; i < 8; i++) {

    pinMode(RelayPin[i], OUTPUT);

    toggleState[i] = relayStore.getBool(("r" + String(i)).c_str(), false);
    digitalWrite(RelayPin[i], toggleState[i] ? LOW : HIGH);
  }

  // LED
  pinMode(wifiLed, OUTPUT);

  // RESET BUTTON
  pinMode(gpio_reset, INPUT_PULLUP);

  // IR RECEIVER SETUP
  irrecv.enableIRIn();
  irrecv.blink13(false);
  Serial.println("IR Receiver initialized on pin " + String(IR_RECV_PIN));

  // =====================================================
  // NODE INITIALIZATION
  // =====================================================
  Node my_node = RMaker.initNode(nodeName);
  RMaker.enableOTA(OTA_USING_PARAMS);
  RMaker.enableTZService();
  RMaker.enableSchedule();
  Serial.println("RainMaker Schedule enabled");
  
  // ADD DEVICES
  for (int i = 0; i < 8; i++) {

    switchArray[i]->addCb(write_callback);

    my_node.addDevice(*switchArray[i]);
  }
RMaker.setTimeZone("Asia/Kolkata");
  // START RAINMAKER
  RMaker.start();

  // WIFI EVENT
  WiFi.onEvent(sysProvEvent);

  // =====================================================
  // START PROVISIONING
  // =====================================================
  WiFiProv.beginProvision(
    WIFI_PROV_SCHEME_BLE,
    WIFI_PROV_SCHEME_HANDLER_NONE,
    WIFI_PROV_SECURITY_1,
    pop,
    service_name
  );

  Serial.println("BLE Provisioning Started");
  WiFiProv.printQR(service_name, pop, "ble");
  
  // INITIAL STATE UPDATE
  for (int i = 0; i < 8; i++) {

    switchArray[i]->updateAndReportParam(
      ESP_RMAKER_DEF_POWER_NAME,
      toggleState[i]
    );
  }
  
  Serial.println("Setup completed. Waiting for IR commands...");
  print_ir_codes();
}

// =====================================================
// LOOP
// =====================================================
void loop()
{
  // =====================================================
  // RESET BUTTON
  // =====================================================
  if (digitalRead(gpio_reset) == LOW) {

    delay(100);

    int startTime = millis();

    while (digitalRead(gpio_reset) == LOW) {
      delay(50);
    }

    int endTime = millis();

    // FACTORY RESET
    if ((endTime - startTime) > 10000) {

      Serial.println("Factory Reset");

      RMakerFactoryReset(2);
    }

    // WIFI RESET
    else if ((endTime - startTime) > 3000) {

      Serial.println("WiFi Reset");

      RMakerWiFiReset(2);
    }
  }

  // WIFI LED STATUS
  if (WiFi.status() == WL_CONNECTED)
    digitalWrite(wifiLed, HIGH);
  else
    digitalWrite(wifiLed, LOW);

  // IR REMOTE CONTROL
  ir_remote_control();
  
  // SERIAL COMMAND PROCESSING
  process_serial_commands();
}

void save_relay_state(int relay_index)
{
  if (relay_index >= 0 && relay_index < 8) {
    relayStore.putBool(("r" + String(relay_index)).c_str(), toggleState[relay_index]);
  }
}
