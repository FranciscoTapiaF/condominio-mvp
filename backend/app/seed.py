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

    # 1. Crear usuarios demo
    users_data = [
        ("guardia@test.com", "Guardia Demo", "5551111111", "guardia"),
        ("admin@test.com", "Admin Demo", "5552222222", "administrador"),
        ("propietario@test.com", "Propietario Demo", "5553333333", "propietario"),
    ]

    users = {}
    for email, name, phone, role in users_data:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                id=uuid.uuid4(),
                name=name,
                email=email,
                phone=phone,
                password_hash=hash_password("123456"),
                status="active",
            )
            db.add(user)
            db.flush()
        users[role] = user

    # 2. Crear o verificar condominio demo
    condominium = db.query(Condominium).filter(Condominium.id == DEMO_CONDOMINIUM_ID).first()
    if not condominium:
        condominium = Condominium(
            id=DEMO_CONDOMINIUM_ID,
            name="Condominio Demo",
            address="Calle Principal 123, Ciudad",
            timezone="America/Santiago",
            status="active",
        )
        db.add(condominium)
        db.flush()

        # 3. Asignar roles al condominio
        for role, user in users.items():
            membership = db.query(Membership).filter(
                Membership.user_id == user.id,
                Membership.condominium_id == condominium.id,
            ).first()
            if not membership:
                db.add(Membership(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    condominium_id=condominium.id,
                    role=role,
                    status="active",
                ))
        db.flush()

        # 4. Crear unidades de prueba
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

        # 5. Crear visitas de prueba (creadas por guardia)
        now = datetime.utcnow()
        for idx, unit in enumerate(units):
            visit = Visit(
                id=uuid.uuid4(),
                condominium_id=condominium.id,
                unit_id=unit.id,
                created_by_user_id=users["guardia"].id,
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
    print("✅ Datos demo inicializados:")
    print("   Guardia: guardia@test.com / 123456")
    print("   Admin: admin@test.com / 123456")
    print("   Propietario: propietario@test.com / 123456")
    print("   Tokens QR: demo-qr-1, demo-qr-2, demo-qr-3")
