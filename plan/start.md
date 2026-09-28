# Cómo ejecutar gscontrolwebadmin

`npm run dev` solo arranca Next.js. El panel se conecta a MariaDB a través del túnel SSH, así que
hay que dejarlo abierto en otra terminal antes de levantar el panel.

## Requisitos

- Node.js 20 o superior
- `.env` copiado desde `.env.example` y lleno (la llave SSH se referencia por ruta; no va en el repo)
- Llave SSH en la ruta de `SSH_KEY_PATH` (en macOS suele bastar con tenerla en el llavero)

Si un valor de `.env` tiene espacios o caracteres especiales (`!`, `+`, etc.), va entre comillas
simples. Si no, `npm run tunnel` hace `source` del archivo y falla (por ejemplo `ADMIN_NOMBRE=Pablo Duarte`
se interpreta como el comando `Duarte`).

## Día a día (dos terminales)

Desde la raíz del repo.

**Terminal 1 — túnel (déjala abierta):**

```bash
npm run tunnel
```

Tiene que verse algo como:

```text
Tunel: 127.0.0.1:3307 -> 127.0.0.1:3306 (via usuario@host)
```

Ctrl+C cierra el túnel.

**Terminal 2 — panel:**

```bash
npm run dev
```

Entra en [http://localhost:3000](http://localhost:3000) con el correo y la contraseña de
`ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env`.

## Primera vez en una máquina

Con el túnel ya corriendo, una sola vez:

```bash
npm run db:create
npm run db:push
npm run db:seed
```

Después, `npm run dev` como arriba.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run tunnel` | Túnel SSH a `127.0.0.1:3307` |
| `npm run check-db` | Prueba de conexión (abre su propio túnel; no lo corras si `npm run tunnel` ya está en 3307) |
| `npm run db:create` | Crea `gscontrol_clientes` si no existe |
| `npm run db:push` | Aplica el esquema Drizzle |
| `npm run db:seed` | Planes iniciales y usuario de INTECONAYC |
| `npm run dev` | Panel en desarrollo |

El detalle de alcance y diseño está en [gscontrolweb_plan.md](gscontrolweb_plan.md).
Las funcionalidades, en [features.md](features.md).
