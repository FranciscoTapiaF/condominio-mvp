import hashlib
import uuid
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import AccessEvent, Visit, VisitToken


def normalize_plate(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    cleaned = "".join(ch for ch in value.upper() if ch.isalnum())
    return cleaned[:20] if cleaned else None


def create_visit_token_hash(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def validate_visit_token(db: Session, raw_token: str) -> Visit:
    token_hash = create_visit_token_hash(raw_token)
    visit_token = db.query(VisitToken).filter(VisitToken.token_hash == token_hash).first()
    if not visit_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    if visit_token.revoked_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revocado")

    visit = db.query(Visit).filter(Visit.id == visit_token.visit_id).first()
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visita no encontrada")

    now = datetime.utcnow()
    if visit.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visita no activa")
    if now < visit.valid_from or now > visit.valid_until:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visita fuera de vigencia")
    if visit.uses_count >= visit.max_uses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visita agotada")

    return visit


def register_access(db: Session, visit: Visit, event_type: str, license_plate: Optional[str] = None):
    event = AccessEvent(
        id=uuid.uuid4(),
        condominium_id=visit.condominium_id,
        visit_id=visit.id,
        unit_id=visit.unit_id,
        event_type=event_type,
        license_plate_detected=normalize_plate(license_plate),
        source="qr",
        occurred_at=datetime.utcnow(),
    )
    db.add(event)
    db.flush()

    if event_type == "entry":
        visit.uses_count += 1

    db.commit()
    db.refresh(event)
    return event
