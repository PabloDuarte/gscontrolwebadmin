import 'server-only';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema';

function crearPool() {
  return mysql.createPool({
    host: '127.0.0.1',
    port: Number(process.env.LOCAL_TUNNEL_PORT ?? 3307),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.CONTROL_DB_NAME ?? 'gscontrol_clientes',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
    dateStrings: ['DATE'],
  });
}

// Se guarda en globalThis para no abrir un pool nuevo en cada recarga en caliente.
const global_ = globalThis as typeof globalThis & { __poolControl?: mysql.Pool };
const pool = global_.__poolControl ?? crearPool();
if (process.env.NODE_ENV !== 'production') global_.__poolControl = pool;

export const db = drizzle(pool, { schema, mode: 'default' });
export { schema };
