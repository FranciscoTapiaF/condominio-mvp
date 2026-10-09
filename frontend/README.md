# Condominio MVP Frontend

Panel web de portería para gestión de accesos con QR.

## Instalación

```bash
cd frontend
npm install
npm run dev
```

## Acceso

- URL: http://localhost:3000
- Email: guardia@test.com
- Contraseña: 123456

## Características

- Login de guardia
- Dashboard en tiempo real
- Escaneo de QR desde cámara
- Registro manual de entrada/salida
- Historial de eventos
- Contador de visitas activas

## Variables de Entorno

Crear `.env`:

```
VITE_API_URL=http://localhost:8000
```

## Build

```bash
npm run build
npm run preview
```
