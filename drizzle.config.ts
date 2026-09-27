import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'mysql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: '127.0.0.1',
    port: Number(process.env.LOCAL_TUNNEL_PORT ?? 3307),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.CONTROL_DB_NAME ?? 'gscontrol_clientes',
  },
});
