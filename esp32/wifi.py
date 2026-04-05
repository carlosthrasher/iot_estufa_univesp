import network
import time

def connect_wifi(ssid, password, timeout=20):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    if wlan.isconnected():
        print("Ja conectado!")
        print("IP:", wlan.ifconfig()[0])
        return wlan

    print("Conectando ao Wi-Fi...")
    wlan.connect(ssid, password)

    start = time.time()
    while not wlan.isconnected():
        status = wlan.status()
        print("Status:", status)

        if status == 202:
            raise Exception("Senha Wi-Fi incorreta")

        if time.time() - start > timeout:
            raise Exception("Falha ao conectar. Status final: {}".format(status))

        time.sleep(1)

    print("Conectado!")
    print("IP:", wlan.ifconfig()[0])
    return wlan