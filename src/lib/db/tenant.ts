import 'server-only';
import fs from 'node:fs';
import net from 'node:net';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';
import { descifrar } from '@/lib/crypto';
import type { ConexionBd } from './schema';

const TIEMPO_LIMITE_MS = 10_000;

type Tunel = { cerrar: () => void; puertoLocal: number };

/** Abre un reenvio local efimero hacia la base de la empresa por SSH. */
async function abrirTunel(conexion: ConexionBd): Promise<Tunel> {
  if (!conexion.sshHost || !conexion.sshUsuario || !conexion.sshKeyPath) {
    throw new Error('Faltan datos del tunel SSH: host, usuario o ruta de la llave');
  }

  const ssh = new Client();
  await new Promise<void>((resolve, reject) => {
    const alFallar = (err: Error) => reject(new Error(`SSH: ${err.message}`));
    ssh
      .once('ready', () => {
        ssh.removeListener('error', alFallar);
        resolve();
      })
      .once('error', alFallar)
      .connect({
        host: conexion.sshHost!,
        port: conexion.sshPuerto ?? 22,
        username: conexion.sshUsuario!,
        privateKey: fs.readFileSync(conexion.sshKeyPath!),
        passphrase: process.env.SSH_KEY_PASSPHRASE || undefined,
        readyTimeout: TIEMPO_LIMITE_MS,
      });
  });

  const server = net.createServer((socket) => {
    socket.on('error', () => socket.destroy());
    ssh.forwardOut('127.0.0.1', socket.remotePort!, conexion.host, conexion.puerto, (err, stream) => {
      if (err) return socket.destroy();
      stream.on('error', () => socket.destroy());
      socket.pipe(stream).pipe(socket);
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });

  return {
    puertoLocal: (server.address() as net.AddressInfo).port,
    cerrar: () => {
      server.close();
      ssh.end();
    },
  };
}

/**
 * Conecta a la base de una empresa descifrando su contrasena y, si aplica,
 * levantando un tunel SSH propio. Siempre hay que llamar a cerrar().
 */
export async function conectarEmpresa(conexion: ConexionBd) {
  const tunel = conexion.usaTunelSsh ? await abrirTunel(conexion) : null;

  try {
    const cliente = await mysql.createConnection({
      host: tunel ? '127.0.0.1' : conexion.host,
      port: tunel ? tunel.puertoLocal : conexion.puerto,
      user: conexion.usuario,
      password: descifrar(conexion.passwordCifrado),
      database: conexion.nombreBd,
      connectTimeout: TIEMPO_LIMITE_MS,
    });

    return {
      cliente,
      cerrar: async () => {
        await cliente.end().catch(() => {});
        tunel?.cerrar();
      },
    };
  } catch (error) {
    tunel?.cerrar();
    throw error;
  }
}

export type ResultadoPrueba =
  | { ok: true; version: string }
  | { ok: false; mensaje: string };

/** Intenta conectarse a la base de la empresa y reporta el resultado. */
export async function probarConexionEmpresa(conexion: ConexionBd): Promise<ResultadoPrueba> {
  let cerrar: (() => Promise<void>) | null = null;
  try {
    const { cliente, cerrar: cerrarConexion } = await conectarEmpresa(conexion);
    cerrar = cerrarConexion;
    const [filas] = await cliente.query<mysql.RowDataPacket[]>('SELECT VERSION() AS version');
    return { ok: true, version: String(filas[0].version) };
  } catch (error) {
    return { ok: false, mensaje: error instanceof Error ? error.message : 'Error desconocido' };
  } finally {
    await cerrar?.();
  }
}
