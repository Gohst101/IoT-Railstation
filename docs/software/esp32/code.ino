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

*/


// https://www.youtube.com/watch?v=OAoM5IV393o

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Einstellungen - Start
// Wlan Informationen - INFO: Der ESP32 kann nur 2,4GH Unterstützen
const char ssid[] = "WlanName";
const char pass[] = "WlanPassword";

// MQTT Server Informationen
const char* mqtt_server = "BrokerIP";
const uint16_t mqtt_port = BrokerPort;
// Only if you have used Authenthication in the Mosquitto Setup
const char* mqtt_user = "myuser";
const char* mqtt_pass = "myuserpassword";


// Hier die Device ID ändern. Am besten den ESP32 makieren um diesen nicht zu verwecheln.
// Die ID muss später in der Web Anwendung auch eingetragen werden um die Pins zu belegen.
String device_id = ""; // Wird später ersetzt siehe https://github.com/Gohst101/IoT-Railstation/issues/2

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
  topic_trigger = "track/device/" + device_id + "/trigger";
  topic_status  = "track/device/" + device_id + "/status";
  topic_ack     = "track/device/" + device_id + "/ack";
  topic_error   = "track/device/" + device_id + "/error";
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

  // Topics
  setupTopics();

  // MQTT Client
  client.setServer(mqtt_server, mqtt_port); // Niemals werde ich diese drecks Zeile wieder vergessen.. 3 Stunden Lebenszeit
  client.setCallback(callback); // Sorgt dafür das die funktion Callback bei neuen Daten eines Abonierten Paths ausgeführt wird

  // Wifi
  wifi_connection(); // Baue das Blinken der LED während der Verbindung ein

  // MQTT
  mqtt_connection(); // Bearbeite das Verbindungsskript von MQTT, damit die Richtigen Topics Abonniert werden etc. Einmal nachprüfen


  // Gehe zu loop();
}

/*
void loop() {
  Serial.println("An");
  digitalWrite(Weiche_1_R, HIGH);
  digitalWrite(Weiche_1_L, HIGH);
  digitalWrite(Weiche_2_R, HIGH);
  digitalWrite(Weiche_2_L, HIGH);
  delay(1000);
  Serial.println("Aus");
  digitalWrite(Weiche_1_R, LOW);
  digitalWrite(Weiche_1_L, LOW);
  digitalWrite(Weiche_2_R, LOW);
  digitalWrite(Weiche_2_L, LOW);
  delay(1000);
}
*/

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    wifi_connection();
  }

  if (!client.connected()) {
    mqtt_connection();
  }

  // Code - Start




  // Code - Ende

  client.loop();
}

// Neues Wissen: Callback wird bei MQTT immer ausgeführt sobald eines der Abonierten Themen angesprochen wird. 
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.println("=== New MQTT Data ===");

  Serial.print("Topic: ");
  Serial.println(topic);

  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Length: ");
  Serial.println(length);

  Serial.print("Payload: ");
  Serial.println(message);

  Serial.println("=====================");
  Serial.println();
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
    Serial.println(device_id);

    if (use_status_led && millis() - lastToggle >= status_led_blink_time) {
      ledState = !ledState;
      digitalWrite(mqtt_pin, ledState);
      lastToggle = millis();
    }

    if (client.connect(device_id.c_str(), mqtt_user, mqtt_pass)) {
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