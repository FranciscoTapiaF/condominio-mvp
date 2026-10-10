import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models import Condominium, Unit, User, Membership, Visit, VisitToken
from app.services import create_visit_token_hash

# Debe coincidir con condominiumId en frontend/src/pages/Dashboard.jsx
DEMO_CONDOMINIUM_ID = uuid.UUID("bed6c8c8-2e2c-48a0-9acd-a7b7b9f31e79")


def init_demo_data(db: Session):
    """Inicializa datos demo (idempotente)."""

    guard_user = db.query(User).filter(User.email == "guardia@test.com").first()
    if not guard_user:
        guard_user = User(
            id=uuid.uuid4(),
            name="Guardia Demo",
            email="guardia@test.com",
            phone="5555555555",
            password_hash=hash_password("123456"),
            status="active",
        )
        db.add(guard_user)
        db.flush()

    condominium = db.query(Condominium).filter(Condominium.id == DEMO_CONDOMINIUM_ID).first()
    if condominium:
        db.commit()
        return

    condominium = Condominium(
        id=DEMO_CONDOMINIUM_ID,
        name="Condominio Demo",
        address="Calle Principal 123, Ciudad",
        timezone="America/Santiago",
        status="active",
    )
    db.add(condominium)
    db.flush()

    db.add(Membership(
        id=uuid.uuid4(),
        user_id=guard_user.id,
        condominium_id=condominium.id,
        role="guardia",
        status="active",
    ))

    units = []
    for i in range(1, 4):
        unit = Unit(
            id=uuid.uuid4(),
            condominium_id=condominium.id,
            code=f"Apt-{i:03d}",
            block="A",
            status="active",
        )
        db.add(unit)
        units.append(unit)
    db.flush()

    now = datetime.utcnow()
    for idx, unit in enumerate(units):
        visit = Visit(
            id=uuid.uuid4(),
            condominium_id=condominium.id,
            unit_id=unit.id,
            created_by_user_id=guard_user.id,
            visitor_alias=f"Visitante {idx + 1}",
            license_plate=f"ABC-{1234 + idx}",
            valid_from=now,
            valid_until=now + timedelta(days=7),
            max_uses=5,
            uses_count=0,
            status="active",
            notes="Visita de prueba",
        )
        db.add(visit)
        db.flush()

        # Token fijo y predecible para poder probar la validación de QR
        raw_token = f"demo-qr-{idx + 1}"
        db.add(VisitToken(
            id=uuid.uuid4(),
            visit_id=visit.id,
            token_hash=create_visit_token_hash(raw_token),
            expires_at=visit.valid_until,
        ))

    db.commit()
    print("Datos demo inicializados. Tokens QR: demo-qr-1, demo-qr-2, demo-qr-3")
