/*
Dinge die ich machen möchte für den ESP32
- Pins für ESP32 Status (Wlan Verbindung, Mqtt Verbindung, Esp32 an oder aus) ✅
- Wlan Verbindung herstellen / Reconnect falls Verbindung Verloren ✅
- MQTT Verbindung herstellen / Reconnect falls Verbindung Verloren ✅
- ESP32 sendet Lebenszeichen an den Web Server über MQTT
- 


Routen:
- /track/device/<deviceId>/trigger
- /track/device/<deviceId>/status
- /track/device/<deviceId>/ack
- /track/device/<deviceId>/error

Daten die ich mitsenden möchte:
{
  
}

Status:
{
  "device_id": "ECE334B3AB68",
  "ip_address": "192.168.2.121",
  "version": "1.3.4",
  "status": "running"
}

*/


// Information used:
// https://www.youtube.com/watch?v=OAoM5IV393o
// https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/storage/nvs_flash.html
// https://randomnerdtutorials.com/get-change-esp32-esp8266-mac-address-arduino/#esp32-get-mac-address

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

Preferences prefs;

unsigned long lastStatusSend = 0;
const unsigned long statusInterval = 15000;

// Einstellungen - Start
// Wlan Informationen - INFO: Der ESP32 kann nur 2,4GH Unterstützen
const char ssid[] = "";
const char pass[] = "";

// MQTT Server Informationen
const char* mqtt_server = "";
const uint16_t mqtt_port = 1883;
// Only if you have used Authenthication in the Mosquitto Setup
const char* mqtt_user = "myuser";
const char* mqtt_pass = "myuser";


// Hier die Device ID ändern. Am besten den ESP32 makieren um diesen nicht zu verwecheln.
// Die ID muss später in der Web Anwendung auch eingetragen werden um die Pins zu belegen.
String deviceId; // Wurde ersetzt!!! Wird später ersetzt siehe https://github.com/Gohst101/IoT-Railstation/issues/2

// Debug Pins - Nutzung nicht zwingend nötig, aber cool für 3D Prints als Anzeige des Moduls
// Müssen ausgänge auf dem Esp32 sein. Je nach dem werden dann auf den Pins ein HIGH oder LOW Signal gesendet.
// Ich empfehle eine Grüne LED oder ähnliches, da das Script als erkennung Aus, Blinken und An nutzt und es einfach schöner ist.
// Aus = Funktioniert nicht
// Blinken = Verbindet sich..
// An = Funktioniert einwandfrei
#define status_pin 27
#define wlan_pin 26
#define mqtt_pin 12
bool use_status_led = true; // 1 oder 0 - An oder Aus, ob diese Pins genutzt werden sollen oder nicht. Standart aus.
int status_led_blink_time = 500; // Schnelligkiet der LED Blink abstände. Standart 500ms - Passt ganz gut
// Einstellungen - Ende

// Wifi
WiFiClient espClient;
PubSubClient client(espClient);

// Topics für MQTT
String topic_trigger;
String topic_status;
String topic_ack;
String topic_error;

// Funktion für Topics Setup
void setupTopics() {
  Serial.println("Setting up Topics..");
  topic_trigger = "track/device/" + deviceId + "/trigger";
  topic_status  = "track/device/" + deviceId + "/status";
  topic_ack     = "track/device/" + deviceId + "/ack";
  topic_error   = "track/device/" + deviceId + "/error";
  Serial.println("Done Setting up Topics"); // Später auflistung der Topics mit erweiterbarem Auflister
}


// Pins werden in der Finalen Version nicht gehardcoded um flexibilität zu erhalten - Pin via. JSON Format übertragen
/*
#define Weiche_1_R 32
#define Weiche_1_L 33
#define Weiche_2_R 25
#define Weiche_2_L 14
*/

void setup() {
  Serial.begin(115200);

  pinMode(status_pin, OUTPUT);
  pinMode(wlan_pin, OUTPUT);
  pinMode(mqtt_pin, OUTPUT);

  Serial.println("");
  Serial.println("");
  Serial.println("====================");
  Serial.println("   Starting ESP32   ");
  Serial.println("====================");
  Serial.println("");
  // Status
  if(use_status_led) {
    Serial.println("");
    Serial.println("====================");
    Serial.println("       Status       ");
    Serial.println("====================");
    Serial.println("");
    Serial.println("Checking Status..");
    delay(1000);
    Serial.println("ESP32 Status");
    digitalWrite(status_pin, HIGH);
    Serial.println("Wlan Status");
    digitalWrite(wlan_pin, HIGH);
    Serial.println("MQTT Status");
    digitalWrite(mqtt_pin, HIGH);
    delay(1000);
    digitalWrite(status_pin, LOW);
    digitalWrite(wlan_pin, LOW);      
    digitalWrite(mqtt_pin, LOW);
    Serial.println("");
    Serial.println("Done Checking Status");
  } else {
    Serial.println("Skip Status Check");
  }

  if(use_status_led) {
    delay(500);
    digitalWrite(status_pin, HIGH);
    delay(500);
  }

  // MQTT Client
  client.setServer(mqtt_server, mqtt_port); // Niemals werde ich diese drecks Zeile wieder vergessen.. 3 Stunden Lebenszeit
  client.setCallback(callback); // Sorgt dafür das die funktion Callback bei neuen Daten eines Abonierten Paths ausgeführt wird

  // Wifi
  wifi_connection(); // Baue das Blinken der LED während der Verbindung ein

  // Generate Custom Device ID
  deviceId = getDeviceId();


  // Topics
  setupTopics();

  // MQTT
  mqtt_connection(); // Bearbeite das Verbindungsskript von MQTT, damit die Richtigen Topics Abonniert werden etc. Einmal nachprüfen


  // Gehe zu loop();
}


void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    wifi_connection();
  }

  if (!client.connected()) {
    mqtt_connection();
  }

  // Code - Start

  // Status
  if (millis() - lastStatusSend >= statusInterval) {
    lastStatusSend = millis();
    sendStatus();
  }


  // Code - Ende

  client.loop();
}


// Neues Wissen: Callback wird bei MQTT immer ausgeführt sobald eines der Abonierten Themen angesprochen wird. 
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.println("=== New MQTT Data ===");

  StaticJsonDocument<256> doc;

  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.println("JSON Parse Error");
    return;
  }

  const char* model = doc["model"];

  if (model == nullptr) {
    Serial.println("No model field");
    return;
  }

  Serial.print("Model: ");
  Serial.println(model);

  // If abfrage nach den Verschiedenen Modulen
  if (strcmp(model, "switch_2") == 0) {
    track_switch(doc);
  }

  Serial.println("=====================");
}

// Switch (2 Tracks)
void track_switch(StaticJsonDocument<256>& doc) {
  Serial.println("Executing switch_2 logic");

  const char* action = doc["action"];
  const char* direction = doc["direction"];
  int pin_left = doc["pin_left"];
  int pin_right = doc["pin_right"];

  // Code für Weichenstellung (Den einen Pin kurz auf an und dann direkt wieder aus um das Relay anzusteuern)
  Serial.println("Richtung: ");
  Serial.println(direction);
  Serial.println("Pin Left: ");
  Serial.println(pin_left);
  Serial.println("Pin Right: ");
  Serial.println(pin_right);


  Serial.println("Switch executed");
}


// Status Senden
void sendStatus() {
  StaticJsonDocument<256> doc;

  doc["device_id"] = deviceId;
  doc["ip_address"] = WiFi.localIP().toString();
  doc["version"] = "None";
  doc["online"] = true;

  doc["uptime_seconds"] = millis() / 1000;
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["free_heap"] = ESP.getFreeHeap();

  doc["status"] = "ready";

  char buffer[256];
  serializeJson(doc, buffer);

  client.publish(topic_status.c_str(), buffer);

  Serial.println("Status sent");
}


// WLAN Verbindung
void wifi_connection() {
  Serial.println("");
  Serial.println("====================");
  Serial.println("        Wlan        ");
  Serial.println("====================");
  Serial.println("");
  Serial.println("Attempting to connect to WPA network...");
  Serial.print("SSID: ");
  Serial.println(ssid);

  if (use_status_led) digitalWrite(wlan_pin, LOW); // Immer aus am Anfang
  WiFi.begin(ssid, pass);

  bool ledState = false;
  unsigned long lastToggle = millis();

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");

    if (use_status_led && millis() - lastToggle >= status_led_blink_time) {
      ledState = !ledState;
      digitalWrite(wlan_pin, ledState);
      lastToggle = millis();
    }

    delay(50);
  }

  Serial.println();
  Serial.println("Connected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.println("");


  if (use_status_led) {
    digitalWrite(wlan_pin, HIGH);
  }
}

void mqtt_connection() {
  Serial.println("");
  Serial.println("====================");
  Serial.println("        MQTT        ");
  Serial.println("====================");
  Serial.println("");
  Serial.println("\nAttempting MQTT connection...");
  
  if (use_status_led) digitalWrite(mqtt_pin, LOW); // Immer am anfang aus

  bool ledState = false;
  unsigned long lastToggle = millis();

  while (!client.connected()) {
    Serial.print("Connecting as ");
    Serial.println(deviceId);

    if (use_status_led && millis() - lastToggle >= status_led_blink_time) {
      ledState = !ledState;
      digitalWrite(mqtt_pin, ledState);
      lastToggle = millis();
    }

    if (client.connect(deviceId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("Connected to MQTT!");
      if (use_status_led) {
        digitalWrite(mqtt_pin, HIGH);
      }
      client.subscribe(topic_trigger.c_str());
      Serial.print("Subscribed to: ");
      Serial.println(topic_trigger);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
    delay(50);
  }
}

// Generate Custom Device ID
String getDeviceId() {
  prefs.begin("device", false);

  String id = prefs.getString("id", "");

  if (id == "") {
    uint8_t mac[6];
    WiFi.macAddress(mac);

    char buf[13];
    sprintf(buf, "%02X%02X%02X%02X%02X%02X",
            mac[0], mac[1], mac[2],
            mac[3], mac[4], mac[5]);

    id = String(buf);
    prefs.putString("id", id);

    Serial.println("Generated new Device ID");
    Serial.print("Device ID: ");
    Serial.println(id);
    Serial.println("");
  } else {
    Serial.println("Loaded Device ID from NVS");
    Serial.print("Device ID: ");
    Serial.println(id);
    Serial.println("");
  }

  prefs.end();
  return id;
}