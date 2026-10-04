import asyncio
from datetime import datetime

from app.sync import send_heartbeat, send_event


async def loop():
    while True:
        status, body = send_heartbeat()
        print(f"[heartbeat] {status} - {body}")

        event = {
            "edge_id": "edge-rpi-001",
            "event_type": "camera_snapshot",
            "occurred_at": datetime.utcnow().isoformat(),
            "plate_detected": "ABCD12",
            "plate_confidence": 0.9,
            "source": "edge",
        }

        status, body = send_event(event)
        print(f"[event] {status} - {body}")

        await asyncio.sleep(30)


if __name__ == "__main__":
    asyncio.run(loop())
