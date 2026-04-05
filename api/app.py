from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional
from bson import ObjectId
from database import readings_collection, alerts_collection

app = FastAPI(title="API Estufa IoT")


class ReadingIn(BaseModel):
    device_id: str
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    soil_moisture_raw: Optional[int] = None
    soil_moisture_percent: Optional[float] = None
    luminosity_raw: Optional[int] = None
    luminosity_percent: Optional[float] = None


def now_utc():
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return now_utc().isoformat()


def parse_iso(dt_str: str) -> datetime:
    return datetime.fromisoformat(dt_str)


def serialize_doc(doc):
    if not doc:
        return None

    doc["_id"] = str(doc["_id"])
    return doc


def should_create_alert(device_id: str, alert_type: str, cooldown_minutes: int = 120) -> bool:
    last_alert = alerts_collection.find_one(
        {
            "device_id": device_id,
            "type": alert_type
        },
        sort=[("timestamp", -1)]
    )

    if not last_alert:
        return True

    last_time = parse_iso(last_alert["timestamp"])
    now = now_utc()

    return (now - last_time) >= timedelta(minutes=cooldown_minutes)


def build_alert(device_id: str, alert_type: str, message: str, severity: str):
    return {
        "device_id": device_id,
        "type": alert_type,
        "message": message,
        "severity": severity,
        "is_read": False,
        "is_active": True,
        "timestamp": now_iso()
    }


def classify_greenhouse_status(latest_reading, latest_alert) -> str:
    if latest_alert and latest_alert.get("severity") == "critica":
        return "critico"

    if latest_alert and latest_alert.get("severity") in ["alta", "media"]:
        return "alerta"

    if not latest_reading:
        return "sem_dados"

    return "normal"


@app.get("/")
def home():
    return {
        "status": "API online",
        "service": "estufa-iot"
    }


@app.get("/api/health")
def health():
    mongo_ok = True
    mongo_error = None

    try:
        readings_collection.database.client.admin.command("ping")
    except Exception as e:
        mongo_ok = False
        mongo_error = str(e)

    latest_reading = readings_collection.find_one(sort=[("timestamp", -1)])
    latest_alert = alerts_collection.find_one(sort=[("timestamp", -1)])

    latest_reading = serialize_doc(latest_reading)
    latest_alert = serialize_doc(latest_alert)

    api_status = "ok" if mongo_ok else "degradado"

    return {
        "status": api_status,
        "api": "online",
        "mongodb": "online" if mongo_ok else "offline",
        "mongodb_error": mongo_error,
        "latest_reading": latest_reading,
        "latest_alert": latest_alert,
        "checked_at": now_iso()
    }


@app.post("/api/leituras")
def create_reading(data: ReadingIn):
    document = data.model_dump()
    document["timestamp"] = now_iso()

    result = readings_collection.insert_one(document)

    generated_alerts = []

    # ALERTA: SOLO SECO
    if data.soil_moisture_percent is not None:
        if data.soil_moisture_percent <= 15:
            if should_create_alert(data.device_id, "solo_seco"):
                alert = build_alert(
                    device_id=data.device_id,
                    alert_type="solo_seco",
                    message="Umidade do solo crítica. Necessário irrigar com urgência.",
                    severity="critica"
                )
                alerts_collection.insert_one(alert)
                generated_alerts.append(alert)

        elif data.soil_moisture_percent <= 30:
            if should_create_alert(data.device_id, "solo_seco"):
                alert = build_alert(
                    device_id=data.device_id,
                    alert_type="solo_seco",
                    message="Umidade do solo baixa. Verificar necessidade de irrigação.",
                    severity="alta"
                )
                alerts_collection.insert_one(alert)
                generated_alerts.append(alert)

    # ALERTA: TEMPERATURA ALTA
    if data.temperature is not None:
        if data.temperature >= 40:
            if should_create_alert(data.device_id, "temperatura_alta"):
                alert = build_alert(
                    device_id=data.device_id,
                    alert_type="temperatura_alta",
                    message="Temperatura crítica na estufa.",
                    severity="critica"
                )
                alerts_collection.insert_one(alert)
                generated_alerts.append(alert)

        elif data.temperature >= 35:
            if should_create_alert(data.device_id, "temperatura_alta"):
                alert = build_alert(
                    device_id=data.device_id,
                    alert_type="temperatura_alta",
                    message="Temperatura acima do limite recomendado.",
                    severity="alta"
                )
                alerts_collection.insert_one(alert)
                generated_alerts.append(alert)

    # ALERTA: BAIXA LUMINOSIDADE
    if data.luminosity_percent is not None:
        if data.luminosity_percent <= 10:
            if should_create_alert(data.device_id, "baixa_luminosidade"):
                alert = build_alert(
                    device_id=data.device_id,
                    alert_type="baixa_luminosidade",
                    message="Luminosidade crítica. Ambiente muito escuro.",
                    severity="critica"
                )
                alerts_collection.insert_one(alert)
                generated_alerts.append(alert)

        elif data.luminosity_percent <= 20:
            if should_create_alert(data.device_id, "baixa_luminosidade"):
                alert = build_alert(
                    device_id=data.device_id,
                    alert_type="baixa_luminosidade",
                    message="Luminosidade abaixo do ideal.",
                    severity="media"
                )
                alerts_collection.insert_one(alert)
                generated_alerts.append(alert)

    return {
        "message": "Leitura salva com sucesso",
        "id": str(result.inserted_id),
        "alerts_generated": generated_alerts
    }


@app.get("/api/leituras/ultimas")
def get_latest_reading():
    doc = readings_collection.find_one(sort=[("timestamp", -1)])

    if not doc:
        return {"message": "Nenhuma leitura recebida ainda"}

    return serialize_doc(doc)


@app.get("/api/leituras/historico")
def get_reading_history(limit: int = Query(default=20, ge=1, le=500)):
    cursor = readings_collection.find().sort("timestamp", -1).limit(limit)

    items = []
    for doc in cursor:
        items.append(serialize_doc(doc))

    return {
        "total": len(items),
        "items": items
    }


@app.get("/api/alertas")
def get_alerts(limit: int = Query(default=20, ge=1, le=500)):
    cursor = alerts_collection.find().sort("timestamp", -1).limit(limit)

    items = []
    for doc in cursor:
        items.append(serialize_doc(doc))

    return {
        "total": len(items),
        "items": items
    }


@app.get("/api/alertas/ativos")
def get_active_alerts(limit: int = Query(default=20, ge=1, le=500)):
    cursor = alerts_collection.find(
        {
            "is_active": True,
            "is_read": False
        }
    ).sort("timestamp", -1).limit(limit)

    items = []
    for doc in cursor:
        items.append(serialize_doc(doc))

    return {
        "total": len(items),
        "items": items
    }


@app.patch("/api/alertas/{alert_id}/lido")
def mark_alert_as_read(alert_id: str):
    try:
        object_id = ObjectId(alert_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de alerta inválido")

    result = alerts_collection.update_one(
        {"_id": object_id},
        {
            "$set": {
                "is_read": True,
                "is_active": False,
                "read_at": now_iso()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")

    updated_alert = alerts_collection.find_one({"_id": object_id})
    return {
        "message": "Alerta marcado como lido",
        "alert": serialize_doc(updated_alert)
    }


@app.get("/api/dashboard")
def get_dashboard():
    latest_reading = readings_collection.find_one(sort=[("timestamp", -1)])
    latest_alert = alerts_collection.find_one(sort=[("timestamp", -1)])

    latest_reading = serialize_doc(latest_reading)
    latest_alert = serialize_doc(latest_alert)

    status = classify_greenhouse_status(latest_reading, latest_alert)

    return {
        "status": status,
        "latest_reading": latest_reading,
        "latest_alert": latest_alert
    }