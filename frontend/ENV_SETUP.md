# Frontend Environment Setup (NextAuth + Google)

Sigue estos pasos para configurar el login con Google en desarrollo local.

## 1) Crear `frontend/.env.local`

Crea un archivo `frontend/.env.local` (no se versiona) con estas variables:

```
GOOGLE_CLIENT_ID=TU_CLIENT_ID_WEB
GOOGLE_CLIENT_SECRET=TU_CLIENT_SECRET_WEB
NEXTAUTH_SECRET=una_cadena_aleatoria_segura
NEXTAUTH_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

- Puedes generar `NEXTAUTH_SECRET` con: `openssl rand -base64 32` (o cualquier generador de random seguro).
- `NEXTAUTH_URL` debe coincidir EXACTAMENTE con la URL donde corre Next.js.

## 2) Configurar credenciales OAuth en Google Cloud Console

1. Ir a Google Cloud Console -> APIs & Services.
2. Habilitar APIs necesarias:
   - Google Classroom API
   - Google Calendar API
3. OAuth consent screen:
   - Tipo: External (si no tienes dominio de Google Workspace) o Internal si tu dominio lo permite.
   - Añade los scopes de solo lectura usados por la app (Classroom y Calendar).
   - Si el modo es Testing, añade tu cuenta como Test user.
4. Credentials -> Create Credentials -> OAuth client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Copia el `Client ID` y `Client Secret` y colócalos en `.env.local`.

## 3) Reiniciar el servidor de Next.js

Después de crear o modificar `.env.local`, reinicia el servidor de desarrollo:

```
cd frontend
npm run dev
```

## 4) Errores comunes y cómo diagnosticarlos

- "Acceso bloqueado: La solicitud de <app> no es válida" normalmente indica:
  - redirect_uri mismatch: Verifica que el valor en Google Cloud coincida exactamente con `http://localhost:3000/api/auth/callback/google` y que `NEXTAUTH_URL=http://localhost:3000`.
  - origin mismatch: Agrega `http://localhost:3000` a Authorized JavaScript origins.
  - Consent screen en modo Testing sin añadir tu cuenta como Test user.
  - Usar un Client ID de tipo incorrecto (Android/iOS/TV en lugar de Web application).
  - Scopes sensibles no aprobados: En Testing funciona para Test users; si es Production, puede requerir verificación.

- Para aislar problemas de scopes, temporalmente reduce los scopes en `frontend/pages/api/auth/[...nextauth].js` a solo `openid email profile` y prueba de nuevo.

## 5) Dónde está la configuración de NextAuth

Archivo: `frontend/pages/api/auth/[...nextauth].js`

Puntos clave:
- Proveedor Google usa `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
- `authorization.params.scope` incluye `openid email profile` + scopes de Classroom/Calendar.
- Asegúrate de tener `NEXTAUTH_SECRET` y `NEXTAUTH_URL` en el entorno.

## 6) Recolectar información si falla

Cuando veas la pantalla de error de Google, copia el mensaje exacto y (si aparece) el parámetro de error en la URL (`error=redirect_uri_mismatch`, `origin_mismatch`, `access_denied`, etc.). Comparte ese detalle para acelerar el diagnóstico.
