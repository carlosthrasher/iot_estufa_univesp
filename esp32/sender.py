try:
    import urequests as requests
except ImportError:
    import requests

try:
    import ujson as json
except ImportError:
    import json


def send_data(api_url, payload):
    response = None
    try:
        response = requests.post(
            api_url,
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"}
        )

        print("Status HTTP:", getattr(response, 'status_code', None))
        print("Resposta:", getattr(response, 'text', None))
        return getattr(response, 'status_code', None) == 200

    except Exception as e:
        print("Erro ao enviar dados:", e)
        return False

    finally:
        if response is not None:
            try:
                response.close()
            except Exception:
                pass