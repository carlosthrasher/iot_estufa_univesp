import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "estufa")

print("ENV PATH:", env_path)
print("MONGO_URL:", MONGO_URL)

client = MongoClient(MONGO_URL)
client.admin.command("ping")
print("✅ MongoDB conectado com sucesso")

db = client[DB_NAME]

readings_collection = db["leituras"]
alerts_collection = db["alertas"]