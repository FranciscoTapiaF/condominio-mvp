# Condominium MVP

Plataforma multi-condominio para Chile para control de visitas, acceso en portería y validación mediante QR y reconocimiento de patentes.

## Stack

- Backend: FastAPI + Python
- Base de datos: PostgreSQL
- App móvil: Flutter
- Panel web: React/Vue (base inicial)
- Edge: Raspberry Pi + Python + OpenCV + OCR
- Infra: Docker Compose

## Objetivo del MVP

- Gestión de condominios y unidades
- Usuarios residentes, guardias y administradores
- Invitaciones con QR temporales y revocables
- Validación de acceso en portería
- Registro de entrada/salida
- Patentes como dato auxiliar para la validación
- Historial y auditoría
- Funcionalidad local en Raspberry Pi con sincronización posterior

## Requisitos

- Python 3.12+
- Docker + Docker Compose
- PostgreSQL 16

## Inicio rápido

```bash
cp backend/.env.example backend/.env
cp edge-agent/.env.example edge-agent/.env

docker compose up -d --build
```

## API local

- Backend: http://localhost:8000
- Documentación Swagger: http://localhost:8000/docs
- PostgreSQL: localhost:5432

## Estructura inicial

```text
backend/
edge-agent/
docker-compose.yml
README.md
```

## Siguiente evolución recomendada

- roles y permisos por condominio
- panel web de portería
- sistema de auditoría robusto
- OCR con OpenCV y validación de patentes
- sincronización offline con SQLite local
- despliegue en Raspberry Pi o nube
