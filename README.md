# gscontrolwebadmin

Panel interno de INTECONAYC para administrar empresas clientes, planes y suscripciones.

## Requisitos

- Node.js 20 o superior
- Proyecto [Supabase](https://supabase.com) con Postgres (cadena `DATABASE_URL`)

## Arranque

1. Copia `.env.example` a `.env` y llena los valores (sobre todo `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_*`).
2. Aplica el esquema y el seed (primera vez):

```bash
npm install
npm run db:push
npm run db:seed
```

3. Arranca el panel:

```bash
npm run dev
```

Entra en [http://localhost:3000](http://localhost:3000) con el correo y contraseña definidos en `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run check-db` | Prueba de conexión a Postgres |
| `npm run db:push` | Aplica el esquema Drizzle en Supabase |
| `npm run db:seed` | Planes iniciales y usuario de INTECONAYC |
| `npm run dev` | Panel en desarrollo |

Cada empresa recibe un `empresa_id` (UUID) al darse de alta; es la llave de tenant para tablas con RLS en Supabase.

## Alcance

Datos de control en una sola base Postgres (Supabase). El detalle vive en [plan/gscontrolweb_plan.md](plan/gscontrolweb_plan.md) y las funcionalidades en [plan/features.md](plan/features.md).
