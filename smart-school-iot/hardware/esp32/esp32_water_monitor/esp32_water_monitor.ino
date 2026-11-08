/*
 * ============================================================
 * SmartSchoolIoT – Government School Water Quality & Kitchen Station
 * ESP32 Hardware Firmware (Configured from verified hardware code)
 * ============================================================
 * Sensors Connected:
 * 1. DHT22 Temperature & Humidity on GPIO 4
 * 2. Turbidity Sensor on GPIO 34 (with 2x 10k resistor voltage divider)
 * 
 * Features:
 * - Local WiFi Web Dashboard (http://<ESP32_IP>/)
 * - Automatic Telemetry POST to SmartSchoolIoT Server (http://10.0.73.115:8000)
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

unsigned long previousRead = 0;
const unsigned long interval = SAMPLING_INTERVAL_MS;

// ------------------------------------------------------------
// Helper: Calculate NTU from calibrated sensor voltage
// ------------------------------------------------------------
float calculateNTU(float volt) {
  // Turbidity sensor (with 5V VCC and 2:1 resistor divider):
  // When in clear drinking water, sensor outputs ~3.8V - 4.3V actual voltage
  // As water gets cloudier / muddier, optical blockage drops voltage below 3.0V
  if (volt >= 3.80) {
    return 0.5; // Crystal clear drinking water (< 1.0 NTU)
  } else if (volt <= 2.20) {
    return 150.0; // Muddy water
  } else {
    // Proportional turbidity curve between 3.8V (0.5 NTU) and 2.2V (100 NTU)
    float ntu = 0.5 + ((3.80 - volt) / (3.80 - 2.20)) * 100.0;
    if (ntu < 0.0) ntu = 0.0;
    return ntu;
  }
}

// ------------------------------------------------------------
// Read Sensors (matching friend's verified hardware configuration)
// ------------------------------------------------------------
void readSensors() {
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();

  // Average 20 ADC readings
  long total = 0;
  long mvTotal = 0;
  for (int i = 0; i < 20; i++) {
    total += analogRead(PIN_TURBIDITY);
    mvTotal += analogReadMilliVolts(PIN_TURBIDITY);
    delay(5);
  }

  turbidityRaw = total / 20;

  // ADC voltage at GPIO34 (using factory calibrated eFuse curve)
  float adcVoltage = (mvTotal / 20.0) / 1000.0;
  if (adcVoltage <= 0.05 && turbidityRaw > 50) {
    adcVoltage = (turbidityRaw / 4095.0) * 3.3;
  }

  // Two equal 10k resistors:
  // Actual sensor voltage = ADC voltage x 2
  turbidityVoltage = adcVoltage * VOLTAGE_DIVIDER_FACTOR;

  // Calculate NTU
  turbidityNtu = calculateNTU(turbidityVoltage);

  // Serial Diagnostic Output
  Serial.println("-------------------------------------------------------");
  Serial.print("Temperature:       ");
  if (isnan(temperature)) Serial.println("DHT Read Error");
  else { Serial.print(temperature, 1); Serial.println(" °C"); }

  Serial.print("Humidity:          ");
  if (isnan(humidity)) Serial.println("DHT Read Error");
  else { Serial.print(humidity, 1); Serial.println(" %"); }

  Serial.print("Turbidity Raw ADC: ");
  Serial.println(turbidityRaw);

  Serial.print("Turbidity Voltage: ");
  Serial.print(turbidityVoltage, 3);
  Serial.println(" V");

  Serial.print("Turbidity Purity:  ");
  Serial.print(turbidityNtu, 2);
  Serial.println(" NTU");
}

// ------------------------------------------------------------
// Send Telemetry to SmartSchoolIoT Server
// ------------------------------------------------------------
void sendTelemetryToServer() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String endpoint = String(SERVER_HOST) + String(TELEMETRY_URL);
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"api_key\":\"" + String(HARDWARE_API_KEY) + "\",";
  jsonPayload += "\"school_id\":" + String(SCHOOL_ID) + ",";
  jsonPayload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonPayload += "\"turbidity_ntu\":" + String(turbidityNtu, 2) + ",";
  jsonPayload += "\"turbidity_voltage\":" + String(turbidityVoltage, 3) + ",";
  jsonPayload += "\"humidity_pct\":" + (isnan(humidity) ? "0.0" : String(humidity, 1));

  if (!isnan(temperature)) {
    jsonPayload += ",\"temperature_c\":" + String(temperature, 1);
  }
  jsonPayload += "}";

  int httpCode = http.POST(jsonPayload);
  if (httpCode > 0) {
    Serial.printf("[HTTP %d] Telemetry pushed to SmartSchoolIoT server\n", httpCode);
  } else {
    Serial.printf("[HTTP ERROR %d] %s\n", httpCode, http.errorToString(httpCode).c_str());
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
      .status { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #064e3b; color: #34d399; }
    </style>
  </head>
  <body>
    <h2>SmartSchoolIoT Node</h2>
    <p class="sub">ZPHS Penamaluru - Drinking Water Quality & Kitchen Station</p>
    <div class="grid">
  )rawliteral";

  // Turbidity Card
  html += "<div class='card'><div class='label'>Drinking Water Purity</div><div class='value'>";
  html += String(turbidityNtu, 2) + " NTU";
  html += "</div><span class='status'>";
  html += (turbidityNtu <= 5.0 ? "WHO SAFE DRINKING WATER" : "CONTAMINATION ALERT");
  html += "</span><p style='color:#64748b;font-size:11px;margin-top:8px;'>Voltage: " + String(turbidityVoltage, 3) + " V | ADC: " + String(turbidityRaw) + "</p></div>";

  // Temperature Card
  html += "<div class='card'><div class='label'>Kitchen Temperature</div><div class='value' style='color:#f87171;'>";
  if (isnan(temperature)) html += "Reading...";
  else html += String(temperature, 1) + " &deg;C";
  html += "</div><p style='color:#64748b;font-size:11px;'>DHT22 Environmental</p></div>";

  // Humidity Card
  html += "<div class='card'><div class='label'>Kitchen Humidity</div><div class='value' style='color:#fbbf24;'>";
  if (isnan(humidity)) html += "Reading...";
  else html += String(humidity, 1) + " %";
  html += "</div><p style='color:#64748b;font-size:11px;'>Hygienic Storage Range</p></div>";

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

  // Configure ADC for GPIO 34 (12-bit, 11dB attenuation)
  analogReadResolution(12);
  analogSetPinAttenuation(PIN_TURBIDITY, ADC_11db);

  Serial.println("\n=======================================================");
  Serial.println("  SmartSchoolIoT - Starting Node Monitoring System     ");
  Serial.println("  Sensors: DHT22 (GPIO 4) | Turbidity (GPIO 34, 2x Div)");
  Serial.println("=======================================================");

  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi (" + String(WIFI_SSID) + ")");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected successfully!");
    Serial.print("Local Dashboard URL: http://");
    Serial.println(WiFi.localIP());
    Serial.printf("Pusing telemetry to: %s%s\n", SERVER_HOST, TELEMETRY_URL);
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
void loop() {
  server.handleClient();

  if (millis() - previousRead >= interval) {
    previousRead = millis();
    readSensors();
    sendTelemetryToServer();
  }
}
