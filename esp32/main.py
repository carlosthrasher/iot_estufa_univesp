import time
from config import (
    DHT_PIN,
    SOIL_POWER_PIN,
    SOIL_ANALOG_PIN,
    LDR_ANALOG_PIN,
    WIFI_SSID,
    WIFI_PASSWORD,
    API_URL,
    DEVICE_ID,
    READ_INTERVAL_SECONDS
)
from wifi import connect_wifi
from sensors import GreenhouseSensors
from sender import send_data

connect_wifi(WIFI_SSID, WIFI_PASSWORD)

sensors = GreenhouseSensors(
    dht_pin=DHT_PIN,
    soil_power_pin=SOIL_POWER_PIN,
    soil_analog_pin=SOIL_ANALOG_PIN,
    ldr_analog_pin=LDR_ANALOG_PIN
)

while True:
    data = sensors.read_all()

    payload = {
        "device_id": DEVICE_ID,
        "temperature": data["temperature"],
        "humidity": data["humidity"],
        "soil_moisture_raw": data["soil_moisture_raw"],
        "soil_moisture_percent": data["soil_moisture_percent"],
        "luminosity_raw": data["luminosity_raw"],
        "luminosity_percent": data["luminosity_percent"]
    }

    print("Leitura atual:", payload)

    ok = send_data(API_URL, payload)
    print("Envio OK:", ok)

    time.sleep(READ_INTERVAL_SECONDS)