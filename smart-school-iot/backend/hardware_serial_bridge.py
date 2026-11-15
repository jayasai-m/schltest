"""
Hardware Serial Telemetry Bridge — SmartSchoolIoT
==================================================
Reads live sensor diagnostics directly from the ESP32/Arduino USB Serial Console (COM port)
and streams real physical telemetry into the SmartSchoolIoT platform in real time.

Sensors monitored:
- Optical Turbidity (GPIO 34): NTU & Sensor Voltage
- Kitchen DHT22 (GPIO 4): Temperature (°C) & Humidity (%)

Target School:
- ZPHS Penamaluru (School ID: 1, API Key: esp32_penamaluru_hw_key_2026)
"""

import sys
import time
import re
import json
import logging
import requests
import serial
import serial.tools.list_ports

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("serial_bridge")

import os

LOCAL_SERVER = os.getenv("HARDWARE_SERVER_URL", "http://127.0.0.1:8000/api/hardware/telemetry")
CLOUD_SERVER = os.getenv("CLOUD_SERVER_URL", "https://smart-school-iot.vercel.app/api/hardware/telemetry")
TARGET_URLS = list(dict.fromkeys([u for u in [LOCAL_SERVER, CLOUD_SERVER] if u]))
SCHOOL_ID = 1
API_KEY = "esp32_penamaluru_hw_key_2026"
DEVICE_ID = "ESP32-PENAMALURU-01"
DEFAULT_BAUD = 115200

# Regex patterns for Arduino serial diagnostics
RE_TURBIDITY_ADC = re.compile(r"Raw ADC:\s*(\d+)\s*\|\s*Pin:\s*([\d.]+)V\s*\|\s*Sensor:\s*([\d.]+)V", re.IGNORECASE)
RE_TURBIDITY_NTU = re.compile(r"Water Purity:\s*([\d.]+)\s*NTU", re.IGNORECASE)
RE_DHT = re.compile(r"Temperature:\s*([-\d.]+)\s*.*C\s*\|\s*Humidity:\s*([\d.]+)\s*%", re.IGNORECASE)


def find_esp32_port() -> str:
    """Auto-detect the COM port for the ESP32 / Arduino board."""
    ports = list(serial.tools.list_ports.comports())
    # 1. Prefer known hardware signatures (CP210x, CH340, FTDI, Arduino)
    for p in ports:
        desc = (p.description or "").lower()
        mfg = (p.manufacturer or "").lower()
        hwid = (p.hwid or "").lower()
        if any(sig in desc or sig in mfg or sig in hwid for sig in ["cp210", "ch340", "ftdi", "uart", "arduino", "10c4:ea60"]):
            return p.device

    # 2. Prefer COM5 if present
    for p in ports:
        if p.device.upper() == "COM5":
            return p.device

    # 3. Fallback to first available COM port
    if ports:
        return ports[0].device
    return "COM5"


def main():
    logger.info("==================================================================")
    logger.info("   SmartSchoolIoT - Arduino Serial Telemetry Bridge Started       ")
    logger.info("   Target School: ZPHS Penamaluru (ID: 1)                         ")
    logger.info("==================================================================")

    current_readings = {
        "turbidity_ntu": None,
        "turbidity_voltage": None,
        "temperature_c": None,
        "humidity_pct": None,
        "last_post_time": 0
    }

    while True:
        port = find_esp32_port()
        logger.info(f"Connecting to hardware on {port} @ {DEFAULT_BAUD} baud...")

        try:
            ser = serial.Serial(port, DEFAULT_BAUD, timeout=1)
            ser.setDTR(False)
            ser.setRTS(False)
            logger.info(f"Connected to {port}! Streaming live console telemetry...")

            while True:
                line = ser.readline().decode("utf-8", errors="replace").strip()
                if not line:
                    continue

                logger.debug(f"[RAW SERIAL] {line}")

                # 1. Match Turbidity ADC & Voltage
                m_adc = RE_TURBIDITY_ADC.search(line)
                if m_adc:
                    raw_adc = int(m_adc.group(1))
                    pin_v = float(m_adc.group(2))
                    sensor_v = float(m_adc.group(3))
                    current_readings["turbidity_voltage"] = sensor_v

                # 2. Match Turbidity NTU
                m_ntu = RE_TURBIDITY_NTU.search(line)
                if m_ntu:
                    ntu = float(m_ntu.group(1))
                    current_readings["turbidity_ntu"] = ntu

                # 3. Match DHT22 Temperature & Humidity
                m_dht = RE_DHT.search(line)
                if m_dht:
                    temp = float(m_dht.group(1))
                    hum = float(m_dht.group(2))
                    current_readings["temperature_c"] = temp
                    current_readings["humidity_pct"] = hum

                # 4. Also match JSON payloads if emitted directly
                if line.startswith("{") and line.endswith("}"):
                    try:
                        data = json.loads(line)
                        if "turbidity_ntu" in data:
                            current_readings["turbidity_ntu"] = float(data["turbidity_ntu"])
                        if "turbidity_voltage" in data:
                            current_readings["turbidity_voltage"] = float(data["turbidity_voltage"])
                        if "humidity_pct" in data:
                            current_readings["humidity_pct"] = float(data["humidity_pct"])
                        if "temperature_c" in data:
                            current_readings["temperature_c"] = float(data["temperature_c"])
                    except Exception:
                        pass

                # Post telemetry when we have updated readings (throttled to at least 2.0s interval)
                now = time.time()
                has_turbidity = current_readings["turbidity_ntu"] is not None
                has_humidity = current_readings["humidity_pct"] is not None

                if (has_turbidity or has_humidity) and (now - current_readings["last_post_time"] >= 2.0):
                    payload = {
                        "api_key": API_KEY,
                        "school_id": SCHOOL_ID,
                        "device_id": DEVICE_ID,
                        "turbidity_ntu": current_readings["turbidity_ntu"] if has_turbidity else 0.5,
                        "turbidity_voltage": current_readings["turbidity_voltage"],
                        "humidity_pct": current_readings["humidity_pct"],
                        "temperature_c": current_readings["temperature_c"]
                    }

                    for target_url in TARGET_URLS:
                        try:
                            resp = requests.post(target_url, json=payload, timeout=3)
                            if resp.status_code == 200:
                                current_readings["last_post_time"] = now
                                label = "Local" if "127.0.0.1" in target_url else "Cloud"
                                logger.info(
                                    f"[{label} POST] Turbidity: {payload['turbidity_ntu']} NTU ({payload['turbidity_voltage']}V) | "
                                    f"Temp: {payload['temperature_c']} C | Humidity: {payload['humidity_pct']}% -> Status 200 OK"
                                )
                        except Exception:
                            pass

        except serial.SerialException as se:
            logger.warning(f"Serial port {port} error or locked: {se}. Retrying in 3 seconds...")
            time.sleep(3)
        except Exception as e:
            logger.error(f"Unexpected error in serial bridge: {e}. Retrying in 3 seconds...")
            time.sleep(3)


if __name__ == "__main__":
    main()
