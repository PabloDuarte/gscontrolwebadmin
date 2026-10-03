import 'server-only';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { destinoMysqlActual } from '@/lib/destino-mysql';
import * as schema from './schema';

type DbControl = ReturnType<typeof drizzle<typeof schema>>;

function crearPool(host: string, port: number) {
  return mysql.createPool({
    host,
    port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.CONTROL_DB_NAME ?? 'gscontrol_clientes',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
    dateStrings: ['DATE'],
  });
}

const global_ = globalThis as typeof globalThis & {
  __poolControl?: mysql.Pool;
  __poolFirma?: string;
  __dbControl?: DbControl;
};

function dbActual() {
  const destino = destinoMysqlActual();
  const firma = `${destino.host}:${destino.port}`;
  if (!global_.__poolControl || global_.__poolFirma !== firma) {
    const anterior = global_.__poolControl;
    global_.__poolControl = crearPool(destino.host, destino.port);
    global_.__poolFirma = firma;
    global_.__dbControl = undefined;
    if (anterior) void anterior.end().catch(() => {});
  }
  global_.__dbControl ??= drizzle(global_.__poolControl, { schema, mode: 'default' });
  return global_.__dbControl;
}

// El destino (directo o túnel) se decide al arrancar. El pool se abre en la primera consulta.
export const db = new Proxy({} as DbControl, {
  get(_objetivo, propiedad, receptor) {
    const real = dbActual();
    const valor = Reflect.get(real, propiedad, receptor);
    return typeof valor === 'function' ? valor.bind(real) : valor;
  },
});

export { schema };
