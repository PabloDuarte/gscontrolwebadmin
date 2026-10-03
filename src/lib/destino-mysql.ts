import 'server-only';
import mysql from 'mysql2/promise';
import { arrancarTunelLicencia } from '@/lib/tunel-control';

export type DestinoMysql = {
  host: string;
  port: number;
  usaTunel: boolean;
};

const global_ = globalThis as typeof globalThis & {
  __destinoMysql?: DestinoMysql;
  __destinoMysqlPendiente?: Promise<DestinoMysql>;
};

function baseControl() {
  return process.env.CONTROL_DB_NAME ?? 'gscontrol_clientes';
}

function destinoDirecto(): DestinoMysql {
  return {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    usaTunel: false,
  };
}

function destinoTunel(): DestinoMysql {
  return {
    host: '127.0.0.1',
    port: Number(process.env.LOCAL_TUNNEL_PORT ?? 3307),
    usaTunel: true,
  };
}

async function baseDisponible(host: string, port: number, database: string) {
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection({
      host,
      port,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database,
      connectTimeout: 2500,
    });
    await conn.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await conn?.end().catch(() => {});
  }
}

async function decidir(): Promise<DestinoMysql> {
  if (global_.__destinoMysql) return global_.__destinoMysql;

  const directo = destinoDirecto();
  const base = baseControl();
  if (await baseDisponible(directo.host, directo.port, base)) {
    global_.__destinoMysql = directo;
    console.log(
      `gscontrol: ${base} está en ${directo.host}:${directo.port}. No se levanta el túnel.`,
    );
    return directo;
  }

  const arranque = await arrancarTunelLicencia();
  const tunel = destinoTunel();
  global_.__destinoMysql = tunel;
  console.log(
    `gscontrol: ${base} no está en ${directo.host}:${directo.port}. ${arranque.mensaje}`,
  );
  return tunel;
}

/** Decide una vez, al arrancar: directo si la base de control está en este servidor. */
export function prepararConexionAlArrancar() {
  if (global_.__destinoMysql) return Promise.resolve(global_.__destinoMysql);
  global_.__destinoMysqlPendiente ??= decidir().finally(() => {
    global_.__destinoMysqlPendiente = undefined;
  });
  return global_.__destinoMysqlPendiente;
}

export function destinoMysqlActual(): DestinoMysql {
  return global_.__destinoMysql ?? destinoTunel();
}
