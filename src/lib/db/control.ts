import 'server-only';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

type DbControl = ReturnType<typeof drizzle<typeof schema>>;

const global_ = globalThis as typeof globalThis & {
  __sqlControl?: postgres.Sql;
  __dbControl?: DbControl;
};

function urlBaseDatos() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Falta DATABASE_URL en .env (cadena Postgres de Supabase).');
  }
  return url;
}

function clienteActual() {
  const url = urlBaseDatos();
  global_.__sqlControl ??= postgres(url, {
    prepare: false,
    max: 10,
    ssl: url.includes('supabase') ? 'require' : undefined,
  });
  global_.__dbControl ??= drizzle(global_.__sqlControl, { schema });
  return global_.__dbControl;
}

export const db = new Proxy({} as DbControl, {
  get(_objetivo, propiedad, receptor) {
    const real = clienteActual();
    const valor = Reflect.get(real, propiedad, receptor);
    return typeof valor === 'function' ? valor.bind(real) : valor;
  },
});

export { schema };
