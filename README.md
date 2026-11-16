# Un Kilo Más · plataforma

App del cliente y panel del entrenador. La landing (Astro) es otro proyecto; las dos comparten el mismo Supabase. **Este repo es el dueño del esquema.**

```bash
npm install
cp .env.example .env.local
npm test
npm run dev
```

## Cómo aplicar el esquema

En el SQL Editor de Supabase (el mismo proyecto que la landing), corre el archivo
`supabase/migrations/20261116000000_plataforma.sql`. Conserva `leads` y reemplaza el trackeo viejo.

## Qué hay que poner en Supabase

1. Corre las migraciones de `supabase/migrations/` en el proyecto compartido con la landing.
2. Auth: correo y contraseña, magia (OTP) y recuperación. URLs de redirección:
   - `http://localhost:3000/bienvenida`
   - `http://localhost:3000/crear-contrasena`
   - `http://localhost:3000/entrar`
   - las mismas con la URL de Vercel
3. SMTP propio (Resend u otro) cuando el volumen de correos lo pida. El de Supabase no alcanza para el registro desde la landing.
4. CAPTCHA (Turnstile) queda preparado; no está activo.

```bash
npm run semilla-entrenadores
npm run semilla-programas
```

Las semillas son idempotentes. Las fases de Ruta +1 con ejercicios `revisar` quedan sin publicar.

## Cómo se prueba

- `npm test` — fórmulas de 1RM, kilos objetivo, cobertura de pagos, avance, retención.
- El registro desde la landing llama `signInWithOtp` con la clave pública. El disparador crea siempre un cliente en prueba e ignora `rol` y `plan` de los metadatos.
- Un cliente no ve a otro: lo comprueba RLS, no solo la interfaz.
- Playwright: `npm run capturas` (panel a 1280 px, cliente a 390 px).

## Qué no está aquí

Pasarela de pago, chat, push, app de tienda, nutrición, rankings, rachas, ni un panel para crear entrenadores.
