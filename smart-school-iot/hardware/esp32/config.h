#ifndef CONFIG_H
#define CONFIG_H

// ==========================================
// WIFI CONFIGURATION
// Configure for your local WiFi / Hotspot:
// ==========================================
#define WIFI_SSID "iqooz9"
#define WIFI_PASSWORD "987654321"

// ==========================================
// SENSOR 1: KITCHEN TEMPERATURE & HUMIDITY
// ==========================================
// The diagnostic showed Temperature: -1.5 °C | Humidity: 1.3 % when using DHT11,
// which is the exact mathematical signature of a DHT22 (AM2302 white casing).
// Setting to DHT22 restores the real, accurate room temperature and humidity:
#define PIN_DHT 4
#define DHT_TYPE DHT22

// ==========================================
// SENSOR 2: OPTICAL TURBIDITY SENSOR
// ==========================================
// Default ADC pin (GPIO 34)
#define PIN_TURBIDITY 34

// Resistor divider factor:
// If using 2x 10k divider: 2.0
// If connected directly to ESP32: 1.0 (firmware also auto-detects)
#define VOLTAGE_DIVIDER_FACTOR 2.0

// Sensor calibration thresholds for clean drinking water vs turbid water:
#define TURBIDITY_CLEAR_WATER_VOLTS 3.85
#define TURBIDITY_DIRTY_WATER_VOLTS 2.40

// ==========================================
// SENSOR TIMING SETTINGS
// ==========================================
#define SAMPLING_INTERVAL_MS 2500

// ==========================================
// BACKEND SERVER CONFIGURATION
// PC's IPv4 on the same WiFi network / hotspot:
// ==========================================
#define SERVER_HOST "http://172.19.211.43:8000"
#define TELEMETRY_URL "/api/hardware/telemetry"

// ==========================================
// DEVICE AUTHENTICATION CONFIGURATION
// Configured School: ZPHS Penamaluru (ID: 1)
// ==========================================
#define HARDWARE_API_KEY "esp32_penamaluru_hw_key_2026"
#define SCHOOL_ID 1
#define DEVICE_ID "ESP32-PENAMALURU-01"

#endif
