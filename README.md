# Semillero Digital Platform

Aplicación web complementaria a Google Classroom para Semillero Digital.

Este monorepo incluye:

- frontend/ (Next.js + NextAuth.js)
- backend/ (FastAPI + SQLAlchemy)
- docker-compose.yml (PostgreSQL)

## Requisitos

- Node.js 18+
- Python 3.10+
- Docker + Docker Compose

## Variables de Entorno

Copiar y completar los ejemplos:

- `frontend/.env.local.example` -> `frontend/.env.local`
- `backend/.env.example` -> `backend/.env`

### Frontend (NextAuth + Google)

- `GOOGLE_CLIENT_ID` = ID de OAuth 2.0 (Google Cloud)
- `GOOGLE_CLIENT_SECRET` = Secreto de OAuth 2.0
- `NEXTAUTH_SECRET` = secreto aleatorio (puedes generar con `openssl rand -base64 32`)
- `NEXTAUTH_URL` = http://localhost:3000
- `BACKEND_URL` = http://localhost:8000

Scopes Google utilizados:
- openid
- https://www.googleapis.com/auth/userinfo.email
- https://www.googleapis.com/auth/userinfo.profile
- https://www.googleapis.com/auth/classroom.courses.readonly
- https://www.googleapis.com/auth/classroom.rosters.readonly
- https://www.googleapis.com/auth/classroom.student-submissions.students.readonly

### Backend (FastAPI)

- `DATABASE_URL` = postgres+psycopg://postgres:postgres@localhost:5432/semillero
- `COORDINATOR_EMAILS` = lista separada por comas (opcional)
- `TEACHER_EMAILS` = lista separada por comas (opcional)

## Desarrollo local

1) Levantar base de datos

```
docker compose up -d db
```

2) Backend

```
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\\Scripts\\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

3) Frontend

```
cd frontend
npm install
npm run dev
```

4) Flujo esperado (Etapa 1)

- Login con Google desde `http://localhost:3000`
- Se obtiene token de Google y se guarda en la sesión
- Se consulta al backend `/api/users/me` para resolver rol por email
- Dashboard básico muestra: email, rol, y prueba de conexión a Classroom (listar cursos)

## Notas

- Asegúrate de configurar en Google Cloud Console el OAuth consent screen y las credenciales OAuth.
- Autorización: usar `Authorized redirect URI` -> `http://localhost:3000/api/auth/callback/google`.
- Considerar límites de cuotas de Google Classroom API.

## Configuración de Google Cloud

1) Crear un proyecto o usar uno existente en Google Cloud.
2) Habilitar APIs:
   - Google Classroom API
   - Google Calendar API
3) OAuth consent screen:
   - Tipo: Internal (si tu dominio lo permite) o External
   - Añadir scopes de lectura listados arriba
   - Añadir tu correo como test user si es external
4) Credentials -> Create Credentials -> OAuth Client ID:
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copiar `Client ID` y `Client Secret` al `frontend/.env.local`

## Pruebas manuales (Etapa 1)

1) Base de datos
   - `docker compose up -d db` (la primera vez tarda en inicializar)
2) Backend
   - Crear `backend/.env` desde `backend/.env.example`
   - Ejecutar:
     - `python -m venv .venv`
     - Activar venv (Windows PowerShell): `.venv/Scripts/Activate.ps1`
     - `pip install -r backend/requirements.txt`
     - `uvicorn backend.app.main:app --reload --port 8000`
   - Comprobar salud: `http://localhost:8000/health`
3) Frontend
   - Crear `frontend/.env.local` desde `frontend/.env.local.example` y completar:
     - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`
   - En `frontend/` ejecutar:
     - `npm install`
     - `npm run dev`
   - Abrir `http://localhost:3000`
4) Flujo
   - Click "Ingresar con Google" y completar el login
   - En `/` se muestra email y se resuelve el rol desde backend
   - Ir a `/dashboard` y verificar que lista cursos desde Classroom

## Troubleshooting

- No aparecen cursos en el Dashboard:
  - Verificar que el usuario de prueba tenga cursos en Google Classroom
  - Revisar en Google Cloud que los scopes estén autorizados
  - Revocar y volver a dar consentimiento (https://myaccount.google.com/permissions)
- 401 en `/api/classroom/courses`:
  - Verificar que `session.accessToken` exista (relogin)
  - Revisar errores en consola del navegador y terminal de Next.js
- Error de CORS al llamar backend:
  - Confirmar `CORS_ORIGINS` en `backend/.env`
  - Reiniciar el servidor backend
- Base de datos no conecta:
  - Confirmar que el contenedor `db` esté saludable (`docker ps`, logs)
  - Revisar `DATABASE_URL` en `backend/.env`

## Decisiones técnicas

- Monorepo con `frontend/` (Next.js, NextAuth) y `backend/` (FastAPI, SQLAlchemy)
- Roles resueltos por listas de emails configurables (coordinadores, profesores). Por defecto todos son "student" si no están listados.
- Sesión JWT en NextAuth para portar `accessToken` de Google y consumir Classroom desde el lado del servidor (`/pages/api/classroom/courses.js`).
- Persistencia mínima de usuarios para rol y auditoría básica (timestamps) en PostgreSQL.
