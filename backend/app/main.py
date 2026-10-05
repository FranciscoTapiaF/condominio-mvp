from datetime import datetime
import uuid

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.auth import create_access_token, decode_access_token, hash_password, verify_password
from app.db import Base, engine, get_db
from app.models import AccessEvent, Condominium, Unit, User, Visit, VisitToken
from app.schemas import (
    AccessEventCreate,
    AccessValidationRequest,
    AccessValidationResponse,
    CondominiumCreate,
    LoginRequest,
    TokenResponse,
    UnitCreate,
    UserCreate,
    VisitCreate,
)
from app.services import create_visit_token_hash, validate_visit_token

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Condominio MVP")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_access_token(token)
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    return user


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/register")
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Usuario ya existe")

    user = User(
        id=uuid.uuid4(),
        name=payload.name,
        email=str(payload.email),
        phone=payload.phone,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": str(user.id), "email": user.email}


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == str(payload.email)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token(user.email)
    return TokenResponse(access_token=token)


@app.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": str(current_user.id), "name": current_user.name, "email": current_user.email}


@app.post("/condominiums")
def create_condominium(payload: CondominiumCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    condominium = Condominium(
        id=uuid.uuid4(),
        name=payload.name,
        address=payload.address,
        timezone=payload.timezone,
    )
    db.add(condominium)
    db.commit()
    db.refresh(condominium)
    return {"id": str(condominium.id), "name": condominium.name}


@app.post("/condominiums/{condominium_id}/units")
def create_unit(condominium_id: str, payload: UnitCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    unit = Unit(
        id=uuid.uuid4(),
        condominium_id=uuid.UUID(condominium_id),
        code=payload.code,
        block=payload.block,
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return {"id": str(unit.id), "code": unit.code}


@app.post("/condominiums/{condominium_id}/visits")
def create_visit(condominium_id: str, payload: VisitCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    visit = Visit(
        id=uuid.uuid4(),
        condominium_id=uuid.UUID(condominium_id),
        unit_id=uuid.UUID(payload.unit_id),
        created_by_user_id=user.id,
        visitor_alias=payload.visitor_alias,
        license_plate=payload.license_plate,
        valid_from=payload.valid_from,
        valid_until=payload.valid_until,
        max_uses=payload.max_uses,
        notes=payload.notes,
        status="active",
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)

    raw_token = uuid.uuid4().hex
    token_hash = create_visit_token_hash(raw_token)
    visit_token = VisitToken(
        id=uuid.uuid4(),
        visit_id=visit.id,
        token_hash=token_hash,
        expires_at=payload.valid_until,
    )
    db.add(visit_token)
    db.commit()

    return {"id": str(visit.id), "qr_token": raw_token, "valid_until": visit.valid_until}


@app.post("/access/validate-qr", response_model=AccessValidationResponse)
def validate_qr(payload: AccessValidationRequest, db: Session = Depends(get_db)):
    try:
        visit = validate_visit_token(db, payload.token)
        return AccessValidationResponse(valid=True, visit_id=str(visit.id), message="Visita válida")
    except HTTPException as exc:
        return AccessValidationResponse(valid=False, message=exc.detail)


@app.post("/access/events")
def create_access_event(payload: AccessEventCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    visit = None
    if payload.visit_id:
        visit = db.query(Visit).filter(Visit.id == uuid.UUID(payload.visit_id)).first()
        if not visit:
            raise HTTPException(status_code=404, detail="Visita no encontrada")

    event = AccessEvent(
        id=uuid.uuid4(),
        condominium_id=uuid.UUID(payload.condominium_id),
        visit_id=uuid.UUID(payload.visit_id) if payload.visit_id else None,
        event_type=payload.event_type,
        license_plate_detected=payload.license_plate_detected,
        license_plate_confidence=payload.license_plate_confidence,
        source=payload.source,
        occurred_at=payload.occurred_at or datetime.utcnow(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return {"id": str(event.id), "status": "created"}


@app.get("/visits")
def list_visits(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    visits = db.query(Visit).all()
    return [
        {
            "id": str(v.id),
            "condominium_id": str(v.condominium_id),
            "unit_id": str(v.unit_id),
            "status": v.status,
            "valid_from": v.valid_from,
            "valid_until": v.valid_until,
            "uses_count": v.uses_count,
            "max_uses": v.max_uses,
        }
        for v in visits
    ]
