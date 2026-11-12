/*
 * ============================================================
 * SmartSchoolIoT – Government School Water Quality & Kitchen Station
 * ESP32 Hardware Firmware (Real Physical Sensor Reader)
 * ============================================================
 * Sensors Connected:
 * 1. DHT22 Temperature & Humidity on GPIO 4
 * 2. Turbidity Sensor on GPIO 34 (with auto-pin detection across ADC1)
 * ============================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <DHT.h>
#include "config.h"

// Initialize DHT Sensor (DHT22 on GPIO 4)
DHT dht(PIN_DHT, DHT_TYPE);

// On-board web server for local dashboard
WebServer server(80);

// Sensor values
float temperature = NAN;
float humidity = NAN;
float turbidityVoltage = 0.0;
float turbidityNtu = 0.0;
int turbidityRaw = 0;
int activeTurbidityPin = PIN_TURBIDITY;

unsigned long previousRead = 0;
const unsigned long interval = SAMPLING_INTERVAL_MS;

// Candidate ADC1 pins for auto-pin scan (only ADC1 pins work with WiFi on ESP32)
const int adc1CandidatePins[] = {34, 35, 32, 33, 36, 39};
const int numCandidatePins = 6;

// ------------------------------------------------------------
// Helper: Calculate NTU from calibrated sensor voltage
// ------------------------------------------------------------
float calculateRealNTU(float volt, int rawVal) {
  // If sensor is in Digital mode ('D') or completely grounded (< 0.35V)
  if (volt < 0.35 || rawVal < 40) {
    return 0.0; // Sensor not providing analog signal (switch is on 'D' or disconnected)
  }

  // Clear drinking water: optical sensor outputs ~3.8V - 4.2V
  if (volt >= TURBIDITY_CLEAR_WATER_VOLTS) {
    // Crystal clear drinking water (WHO standard is < 5.0 NTU; pristine water is 0.2 - 0.8 NTU)
    float ntu = 0.5 - (volt - TURBIDITY_CLEAR_WATER_VOLTS) * 0.5;
    if (ntu < 0.2) ntu = 0.2;
    return ntu;
  } else if (volt <= TURBIDITY_DIRTY_WATER_VOLTS) {
    // Highly turbid / contaminated water
    float ntu = 100.0 + ((TURBIDITY_DIRTY_WATER_VOLTS - volt) / TURBIDITY_DIRTY_WATER_VOLTS) * 50.0;
    if (ntu > 150.0) ntu = 150.0;
    return ntu;
  } else {
    // Proportional curve between clear (0.5 NTU) and muddy (100 NTU)
    float span = TURBIDITY_CLEAR_WATER_VOLTS - TURBIDITY_DIRTY_WATER_VOLTS;
    float ntu = 0.5 + ((TURBIDITY_CLEAR_WATER_VOLTS - volt) / span) * 100.0;
    if (ntu < 0.5) ntu = 0.5;
    return ntu;
  }
}

// ------------------------------------------------------------
// Check if sensor is plugged into another ADC1 pin
// ------------------------------------------------------------
void autoScanTurbidityPin() {
  for (int i = 0; i < numCandidatePins; i++) {
    int pin = adc1CandidatePins[i];
    int mv = analogReadMilliVolts(pin);
    if (mv > 500) { // Found significant signal on this pin!
      if (pin != activeTurbidityPin) {
        Serial.printf(">> [Auto-Pin Scan] Found live sensor voltage (%.2fV) on GPIO %d! Switching to GPIO %d.\n", mv / 1000.0, pin, pin);
        activeTurbidityPin = pin;
        pinMode(activeTurbidityPin, INPUT);
      }
      return;
    }
  }
}

// ------------------------------------------------------------
// Read Sensors
// ------------------------------------------------------------
void readSensors() {
  // Read DHT22
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();

  // Retry once if DHT failed (DHT22 needs 2s between reads)
  if (isnan(humidity) || isnan(temperature)) {
    delay(250);
    humidity = dht.readHumidity();
    temperature = dht.readTemperature();
  }

  // Read Turbidity Sensor
  long totalRaw = 0;
  long totalMv = 0;
  const int samples = 20;

  for (int i = 0; i < samples; i++) {
    totalRaw += analogRead(activeTurbidityPin);
    totalMv += analogReadMilliVolts(activeTurbidityPin);
    delay(4);
  }

  turbidityRaw = totalRaw / samples;
  float adcVoltage = (totalMv / (float)samples) / 1000.0;

  // If analogRead returned 0 due to core attenuation glitch, derive from eFuse mV:
  if (turbidityRaw == 0 && adcVoltage > 0.05) {
    turbidityRaw = (int)((adcVoltage / 3.3) * 4095.0);
  }

  // If active pin has no signal, scan other ADC1 pins:
  if (adcVoltage < 0.25 && turbidityRaw < 60) {
    autoScanTurbidityPin();
  }

  // Determine actual sensor voltage (handles both with and without 2:1 divider):
  if (adcVoltage >= 2.50) {
    // Sensor connected directly without divider (pin sees full 3.3V+)
    turbidityVoltage = adcVoltage;
  } else {
    // With 2:1 resistor divider
    turbidityVoltage = adcVoltage * VOLTAGE_DIVIDER_FACTOR;
  }

  // Calculate NTU
  turbidityNtu = calculateRealNTU(turbidityVoltage, turbidityRaw);

  // Diagnostic Console Output
  Serial.println("=======================================================");
  Serial.println(">> SMART SCHOOL IOT SENSOR DIAGNOSTICS");

  // Turbidity
  Serial.printf("[Turbidity (GPIO %d)] Raw ADC: %d | Pin: %.2fV | Sensor: %.2fV\n",
                activeTurbidityPin, turbidityRaw, adcVoltage, turbidityVoltage);

  if (turbidityVoltage < 0.35) {
    Serial.println("   --> STATUS: SIGNAL NEAR 0V! Slide switch on turbidity board MUST be set to 'A' (Analog), NOT 'D'!");
    Serial.println("   --> Ensure VCC is on 5V (VIN) and probe cable is plugged into adapter.");
  } else {
    Serial.printf("   --> Water Purity: %.2f NTU (%s)\n",
                  turbidityNtu, turbidityNtu <= 5.0 ? "SAFE DRINKING WATER" : "CONTAMINATION ALERT");
  }

  // Kitchen DHT22
  Serial.print("[Kitchen DHT22]   ");
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT Read Error - Check wire on GPIO 4 and 3.3V power");
  } else {
    Serial.printf("Temperature: %.1f °C | Humidity: %.1f %%\n", temperature, humidity);
  }
  Serial.println("=======================================================");
}

// ------------------------------------------------------------
// Send Telemetry to SmartSchoolIoT Server
// ------------------------------------------------------------
void sendTelemetryToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.printf("[WiFi DISCONNECTED] Unable to push to server. Waiting for WiFi (%s)...\n", WIFI_SSID);
    return;
  }

  HTTPClient http;
  String endpoint = String(SERVER_HOST) + String(TELEMETRY_URL);
  http.begin(endpoint);
  http.setTimeout(3000);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"api_key\":\"" + String(HARDWARE_API_KEY) + "\",";
  jsonPayload += "\"school_id\":" + String(SCHOOL_ID) + ",";
  jsonPayload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonPayload += "\"turbidity_ntu\":" + String(turbidityNtu, 2) + ",";
  jsonPayload += "\"turbidity_voltage\":" + String(turbidityVoltage, 3);

  if (!isnan(humidity)) {
    jsonPayload += ",\"humidity_pct\":" + String(humidity, 1);
  }
  if (!isnan(temperature)) {
    jsonPayload += ",\"temperature_c\":" + String(temperature, 1);
  }
  jsonPayload += "}";

  int httpCode = http.POST(jsonPayload);
  if (httpCode > 0) {
    Serial.printf("[HTTP %d] Telemetry successfully pushed to %s\n", httpCode, endpoint.c_str());
  } else {
    Serial.printf("[HTTP ERROR %d] %s (Target: %s)\n", httpCode, http.errorToString(httpCode).c_str(), endpoint.c_str());
  }
  http.end();
}

// ------------------------------------------------------------
// Local ESP32 Web Dashboard Handler (http://<ESP32_IP>/)
// ------------------------------------------------------------
void handleRoot() {
  String html = R"rawliteral(
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="3">
    <title>SmartSchoolIoT - Station Dashboard</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #0b1120;
        color: #e2e8f0;
        text-align: center;
        padding: 20px;
        margin: 0;
      }
      h2 { color: #38bdf8; margin-bottom: 4px; }
      p.sub { color: #94a3b8; font-size: 13px; margin-top: 0; }
      .grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 15px;
        max-width: 700px;
        margin: 20px auto;
      }
      .card {
        background: #1e293b;
        border: 1px solid #334155;
        padding: 20px;
        flex: 1 1 280px;
        border-radius: 14px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
      }
      .label { font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
      .value { font-size: 32px; color: #14b8a6; font-weight: bold; margin: 10px 0 4px; }
      .footer { font-size: 11px; color: #64748b; margin-top: 25px; }
      .status { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
      .status-safe { background: #064e3b; color: #34d399; }
      .status-alert { background: #881337; color: #fb7185; }
      .status-warn { background: #78350f; color: #fcd34d; }
    </style>
  </head>
  <body>
    <h2>SmartSchoolIoT Node</h2>
    <p class="sub">ZPHS Penamaluru - Drinking Water Quality & Kitchen Station</p>
    <div class="grid">
  )rawliteral";

  // Turbidity Card
  html += "<div class='card'><div class='label'>Drinking Water Purity</div><div class='value'>";
  if (turbidityVoltage < 0.35) {
    html += "-- NTU</div><span class='status status-warn'>CHECK SWITCH 'A' / WIRING</span>";
  } else {
    html += String(turbidityNtu, 2) + " NTU</div><span class='status " + (turbidityNtu <= 5.0 ? "status-safe" : "status-alert") + "'>";
    html += (turbidityNtu <= 5.0 ? "WHO SAFE DRINKING WATER" : "CONTAMINATION ALERT");
    html += "</span>";
  }
  html += "<p style='color:#64748b;font-size:11px;margin-top:8px;'>Sensor: " + String(turbidityVoltage, 2) + " V | ADC: " + String(turbidityRaw) + " | GPIO " + String(activeTurbidityPin) + "</p></div>";

  // Temperature Card
  html += "<div class='card'><div class='label'>Kitchen Temperature</div><div class='value' style='color:#f87171;'>";
  if (isnan(temperature)) html += "Reading...</div>";
  else html += String(temperature, 1) + " &deg;C</div><span class='status status-safe'>DHT22 ACTIVE</span>";
  html += "<p style='color:#64748b;font-size:11px;'>Kitchen Ambient Temperature</p></div>";

  // Humidity Card
  html += "<div class='card'><div class='label'>Kitchen Humidity</div><div class='value' style='color:#fbbf24;'>";
  if (isnan(humidity)) html += "Reading...</div>";
  else html += String(humidity, 1) + " %</div><span class='status status-safe'>HYGIENIC RANGE</span>";
  html += "<p style='color:#64748b;font-size:11px;'>Food Storage Humidity</p></div>";

  html += "</div><p class='footer'>SmartSchoolIoT Project Server: " + String(SERVER_HOST) + "<br>ESP32 Node IP: " + WiFi.localIP().toString() + "</p></body></html>";

  server.send(200, "text/html", html);
}

// ------------------------------------------------------------
// Setup
// ------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize DHT22
  dht.begin();

  // Configure ADC for GPIO (global 11dB attenuation up to ~3.3V)
  pinMode(activeTurbidityPin, INPUT);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  Serial.println("\n=======================================================");
  Serial.println("  SmartSchoolIoT - Starting Node Monitoring System     ");
  Serial.println("  Hardware: DHT22 (GPIO 4) | Turbidity (GPIO 34)       ");
  Serial.println("=======================================================");

  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi (" + String(WIFI_SSID) + ")");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected successfully!");
    Serial.print("Local Dashboard URL: http://");
    Serial.println(WiFi.localIP());
    Serial.printf("Pushing telemetry to: %s%s\n", SERVER_HOST, TELEMETRY_URL);
  } else {
    Serial.println("WiFi connection failed or still connecting. Will retry in loop.");
  }

  // Setup local web server
  server.on("/", handleRoot);
  server.begin();

  // Initial read
  readSensors();
}

// ------------------------------------------------------------
// Main Loop
// ------------------------------------------------------------
unsigned long lastWifiRetry = 0;

void loop() {
  server.handleClient();

  // Auto-reconnect WiFi if connection drops (retries every 8 seconds non-blocking)
  if (WiFi.status() != WL_CONNECTED && (millis() - lastWifiRetry >= 8000)) {
    lastWifiRetry = millis();
    Serial.printf(">> [WiFi] Reconnecting to %s...\n", WIFI_SSID);
    WiFi.disconnect();
    WiFi.reconnect();
  }

  if (millis() - previousRead >= interval) {
    previousRead = millis();
    readSensors();
    sendTelemetryToServer();
  }
}
