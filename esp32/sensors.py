from machine import Pin, ADC
import dht
import time

class GreenhouseSensors:
    def __init__(self, dht_pin, soil_power_pin, soil_analog_pin, ldr_analog_pin):
        self.dht_sensor = dht.DHT11(Pin(dht_pin))

        self.soil_power = Pin(soil_power_pin, Pin.OUT)
        self.soil_power.value(0)

        self.soil_adc = ADC(Pin(soil_analog_pin))
        self.soil_adc.atten(ADC.ATTN_11DB)

        self.ldr_adc = ADC(Pin(ldr_analog_pin))
        self.ldr_adc.atten(ADC.ATTN_11DB)

        # calibração real do seu projeto
        self.soil_dry = 4025
        self.soil_wet = 2126

        self.light_dark = 3931
        self.light_bright = 0

    def clamp_percent(self, value):
        if value < 0:
            return 0.0
        if value > 100:
            return 100.0
        return round(value, 1)

    def soil_percent(self, raw_value):
        if raw_value is None:
            return None

        if self.soil_dry == self.soil_wet:
            return None

        percent = ((self.soil_dry - raw_value) / (self.soil_dry - self.soil_wet)) * 100
        return self.clamp_percent(percent)

    def light_percent(self, raw_value):
        if raw_value is None:
            return None

        if self.light_dark == self.light_bright:
            return None

        percent = ((self.light_dark - raw_value) / (self.light_dark - self.light_bright)) * 100
        return self.clamp_percent(percent)

    def read_dht(self):
        try:
            self.dht_sensor.measure()
            return {
                "temperature": self.dht_sensor.temperature(),
                "humidity": self.dht_sensor.humidity()
            }
        except Exception as e:
            print("Erro DHT:", e)
            return {
                "temperature": None,
                "humidity": None
            }

    def read_soil(self):
        try:
            self.soil_power.value(1)
            time.sleep(1)
            value = self.soil_adc.read()
            self.soil_power.value(0)
            return value
        except Exception as e:
            self.soil_power.value(0)
            print("Erro solo:", e)
            return None

    def read_ldr(self):
        try:
            return self.ldr_adc.read()
        except Exception as e:
            print("Erro LDR:", e)
            return None

    def read_all(self):
        dht_data = self.read_dht()
        soil_raw = self.read_soil()
        light_raw = self.read_ldr()

        soil_percent = self.soil_percent(soil_raw)
        light_percent = self.light_percent(light_raw)

        return {
            "temperature": dht_data["temperature"],
            "humidity": dht_data["humidity"],
            "soil_moisture_raw": soil_raw,
            "soil_moisture_percent": soil_percent,
            "luminosity_raw": light_raw,
            "luminosity_percent": light_percent
        }