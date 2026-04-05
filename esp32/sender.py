import requests
import ujson

def send_data(api_url, payload):
    response = None
    try:
        response = requests.post(
            api_url,
            data=ujson.dumps(payload),
            headers={"Content-Type": "application/json"}
        )

        print("Status HTTP:", response.status_code)
        print("Resposta:", response.text)
        return response.status_code == 200

    except Exception as e:
        print("Erro ao enviar dados:", e)
        return False

    finally:
        if response:
            response.close()