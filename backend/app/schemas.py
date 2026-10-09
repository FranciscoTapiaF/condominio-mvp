from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CondominiumCreate(BaseModel):
    name: str
    address: str
    timezone: str = "America/Santiago"


class UnitCreate(BaseModel):
    code: str
    block: Optional[str] = None


class VisitCreate(BaseModel):
    condominium_id: str
    unit_id: str
    visitor_alias: Optional[str] = None
    license_plate: Optional[str] = None
    valid_from: datetime
    valid_until: datetime
    max_uses: int = 1
    notes: Optional[str] = None


class AccessValidationRequest(BaseModel):
    token: str


class AccessValidationResponse(BaseModel):
    valid: bool
    visit_id: Optional[str] = None
    message: Optional[str] = None


class AccessEventCreate(BaseModel):
    condominium_id: str
    visit_id: Optional[str] = None
    event_type: str
    license_plate_detected: Optional[str] = None
    license_plate_confidence: Optional[float] = None
    source: str = "qr"
    occurred_at: Optional[datetime] = None
    token: Optional[str] = None


class AssignRoleRequest(BaseModel):
    user_email: EmailStr
    role: str
