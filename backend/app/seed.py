import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models import Condominium, Unit, User, Membership, Visit, VisitToken
from app.services import create_visit_token_hash


def init_demo_data(db: Session):
    """Inicializa datos demo para la aplicación."""
    
    # 1. Crear usuario guardia de prueba si no existe
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
    
    # 2. Crear condominio de prueba si no existe
    condominium = db.query(Condominium).filter(Condominium.name == "Condominio Demo").first()
    if not condominium:
        condominium = Condominium(
            id=uuid.uuid4(),
            name="Condominio Demo",
            address="Calle Principal 123, Ciudad",
            timezone="America/Santiago",
            status="active",
        )
        db.add(condominium)
        db.flush()
        
        # 3. Asignar guardia al condominio
        membership = Membership(
            id=uuid.uuid4(),
            user_id=guard_user.id,
            condominium_id=condominium.id,
            role="guardia",
            status="active",
        )
        db.add(membership)
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
        
        # 5. Crear visitas de prueba
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
            
            # Crear token QR para la visita
            raw_token = uuid.uuid4().hex
            token_hash = create_visit_token_hash(raw_token)
            visit_token = VisitToken(
                id=uuid.uuid4(),
                visit_id=visit.id,
                token_hash=token_hash,
                expires_at=visit.valid_until,
            )
            db.add(visit_token)
    
    db.commit()
    print("✅ Datos demo inicializados correctamente")
