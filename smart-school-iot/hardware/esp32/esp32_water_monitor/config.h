#ifndef CONFIG_H
#define CONFIG_H

// ==========================================
// WIFI CONFIGURATION
// Configured for your hotspot:
// ==========================================
#define WIFI_SSID "iqooz9"
#define WIFI_PASSWORD "987654321"

// ==========================================
// SENSOR PIN CONFIGURATION
// ==========================================
// 1. Kitchen Temperature & Humidity (DHT22 on GPIO 4)
#define PIN_DHT 4
#define DHT_TYPE DHT22

// 2. Turbidity Sensor (Analog Optical Sensor on GPIO 34)
// Two equal 10k resistors (voltage divider 2:1):
// Actual sensor voltage = ADC voltage * 2.0
#define PIN_TURBIDITY 34
#define VOLTAGE_DIVIDER_FACTOR 2.0

// ==========================================
// SENSOR TIMING SETTINGS
// ==========================================
#define SAMPLING_INTERVAL_MS 2500

// ==========================================
// BACKEND SERVER CONFIGURATION
// Your PC's updated IPv4 on the iqooz9 hotspot:
// ==========================================
#define SERVER_HOST "http://172.19.211.43:8000"
#define TELEMETRY_URL "/api/hardware/telemetry"

// ==========================================
// DEVICE AUTHENTICATION CONFIGURATION
// Configured School: ZPHS Poranki / Penamaluru (ID: 1)
// ==========================================
#define HARDWARE_API_KEY "esp32_poranki_hw_key_2026"
#define SCHOOL_ID 1
#define DEVICE_ID "ESP32-PENAMALURU-01"

#endif
