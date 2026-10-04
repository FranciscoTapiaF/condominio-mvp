import httpx
from datetime import datetime

from app.config import settings


def send_heartbeat():
    url = f"{settings.API_BASE_URL}/edge/heartbeat"
    payload = {
        "edge_id": settings.EDGE_ID,
        "timestamp": datetime.utcnow().isoformat(),
        "status": "online",
    }
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json=payload, headers={"Authorization": f"Bearer {settings.API_TOKEN}"})
            return response.status_code, response.text
    except Exception as exc:
        return 500, str(exc)


def send_event(event_payload: dict):
    url = f"{settings.API_BASE_URL}/edge/events"
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json=event_payload, headers={"Authorization": f"Bearer {settings.API_TOKEN}"})
            return response.status_code, response.text
    except Exception as exc:
        return 500, str(exc)
