import 'server-only';
import mysql from 'mysql2/promise';
import { prepararConexionAlArrancar } from '@/lib/destino-mysql';

const SISTEMA = new Set(['information_schema', 'mysql', 'performance_schema', 'sys', 'test']);

export type ConexionLicenciamiento = {
  sshHost: string;
  sshPuerto: number;
  sshUsuario: string;
  tunelHost: string;
  tunelPuerto: number;
  dbHost: string;
  dbPuerto: number;
  dbUsuario: string;
  dbPassword: string;
  baseControl: string;
  usaTunel: boolean;
  tunelActivo: boolean;
  mensajeTunel: string;
  bases: string[];
};

/** Conexión compartida: el túnel que ya corre en la terminal y el MySQL del servidor. */
export async function obtenerConexionLicenciamiento(): Promise<ConexionLicenciamiento> {
  const destino = await prepararConexionAlArrancar();
  const tunelPuerto = Number(process.env.LOCAL_TUNNEL_PORT ?? 3307);
  const info: ConexionLicenciamiento = {
    sshHost: process.env.SSH_HOST ?? '',
    sshPuerto: Number(process.env.SSH_PORT ?? 22),
    sshUsuario: process.env.SSH_USER ?? '',
    tunelHost: '127.0.0.1',
    tunelPuerto,
    dbHost: process.env.DB_HOST ?? '127.0.0.1',
    dbPuerto: Number(process.env.DB_PORT ?? 3306),
    dbUsuario: process.env.DB_USER ?? '',
    dbPassword: process.env.DB_PASSWORD ?? '',
    baseControl: process.env.CONTROL_DB_NAME ?? 'gscontrol_clientes',
    usaTunel: destino.usaTunel,
    tunelActivo: false,
    mensajeTunel: destino.usaTunel
      ? ''
      : `${process.env.CONTROL_DB_NAME ?? 'gscontrol_clientes'} está en ${destino.host}:${destino.port}. El túnel no se levantó.`,
    bases: [],
  };

  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection({
      host: destino.host,
      port: destino.port,
      user: info.dbUsuario,
      password: info.dbPassword,
      connectTimeout: 4000,
    });
    const [filas] = await conn.query<mysql.RowDataPacket[]>('SHOW DATABASES');
    info.bases = filas.map((f) => String(f.Database)).filter((nombre) => !SISTEMA.has(nombre));
    if (destino.usaTunel) {
      info.tunelActivo = true;
      info.mensajeTunel = `Túnel activo en ${info.tunelHost}:${info.tunelPuerto}.`;
    }
  } catch (error) {
    info.mensajeTunel = destino.usaTunel
      ? error instanceof Error
        ? error.message
        : 'El túnel no responde.'
      : `No se pudo leer ${info.baseControl} en ${destino.host}:${destino.port}.`;
  } finally {
    await conn?.end().catch(() => {});
  }

  return info;
}

/** Busca la base de la empresa entre las que ya existen detrás del túnel. */
export function sugerirBase(nombreComercial: string, bases: string[]) {
  const token = nombreComercial.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!token) return '';
  return (
    bases.find((b) => b.toUpperCase() === `GS${token}`) ??
    bases.find((b) => b.toUpperCase().endsWith(token)) ??
    bases.find((b) => b.toUpperCase().includes(token)) ??
    ''
  );
}
