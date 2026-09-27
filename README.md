# gscontrolwebadmin

Panel interno de INTECONAYC para administrar empresas clientes, planes y suscripciones.

## Requisitos

- Node.js 20 o superior
- Túnel SSH hacia el MariaDB de DigitalOcean

## Arranque

1. Copia `.env.example` a `.env` y llena los valores. La llave SSH se referencia por ruta; no va en el repo.
2. Abre el túnel (déjalo corriendo):

```bash
npm run tunnel
```

3. Crea la base de control, las tablas y el usuario inicial (sólo la primera vez):

```bash
npm run db:create
npm run db:push
npm run db:seed
```

4. Arranca el panel:

```bash
npm run dev
```

Entra en [http://localhost:3000](http://localhost:3000) con el correo y contraseña definidos en `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run tunnel` | Túnel SSH a `127.0.0.1:3307` |
| `npm run check-db` | Prueba de conexión al servidor |
| `npm run db:create` | Crea `gscontrol_clientes` si no existe |
| `npm run db:push` | Aplica el esquema Drizzle |
| `npm run db:seed` | Planes iniciales y usuario de INTECONAYC |
| `npm run dev` | Panel en desarrollo |

## Alcance de esta etapa

Sólo se crea y usa la base `gscontrol_clientes`. No se leen ni se modifican otras bases del servidor. El detalle vive en [plan/gscontrolweb_plan.md](plan/gscontrolweb_plan.md) y las funcionalidades en [plan/features.md](plan/features.md).
