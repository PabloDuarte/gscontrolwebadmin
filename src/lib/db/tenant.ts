import 'server-only';
import mysql from 'mysql2/promise';
import { descifrar } from '@/lib/crypto';
import { prepararConexionAlArrancar } from '@/lib/destino-mysql';
import type { ConexionBd } from './schema';

const TIEMPO_LIMITE_MS = 10_000;

/** Conecta a la base de una empresa. Siempre hay que llamar a cerrar(). */
export async function conectarEmpresa(conexion: ConexionBd) {
  const destino = await prepararConexionAlArrancar();
  const cliente = await mysql.createConnection({
    host: destino.host,
    port: destino.port,
    user: conexion.usuario,
    password: descifrar(conexion.passwordCifrado),
    database: conexion.nombreBd,
    connectTimeout: TIEMPO_LIMITE_MS,
  });

  return {
    cliente,
    cerrar: async () => {
      await cliente.end().catch(() => {});
    },
  };
}

export type ResultadoPrueba =
  | { ok: true; version: string }
  | { ok: false; noExiste: boolean; mensaje: string };

function baseNoExiste(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const fallo = error as { code?: string; errno?: number };
  return fallo.code === 'ER_BAD_DB_ERROR' || fallo.errno === 1049;
}

/** Intenta conectarse a la base de la empresa y reporta el resultado. */
export async function probarConexionEmpresa(conexion: ConexionBd): Promise<ResultadoPrueba> {
  let cerrar: (() => Promise<void>) | null = null;
  try {
    const { cliente, cerrar: cerrarConexion } = await conectarEmpresa(conexion);
    cerrar = cerrarConexion;
    const [filas] = await cliente.query<mysql.RowDataPacket[]>('SELECT VERSION() AS version');
    return { ok: true, version: String(filas[0].version) };
  } catch (error) {
    const noExiste = baseNoExiste(error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return {
      ok: false,
      noExiste,
      mensaje: noExiste ? `La base ${conexion.nombreBd} no existe.` : mensaje,
    };
  } finally {
    await cerrar?.();
  }
}
