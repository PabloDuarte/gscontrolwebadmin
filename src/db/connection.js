import fs from 'node:fs';
import net from 'node:net';
import { Client } from 'ssh2';
import mysql from 'mysql2/promise';
import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable ${name} en .env (copia .env.example como base)`);
  }
  return value;
}

const config = {
  ssh: {
    host: required('SSH_HOST'),
    port: Number(process.env.SSH_PORT ?? 22),
    username: required('SSH_USER'),
    keyPath: required('SSH_KEY_PATH'),
    passphrase: process.env.SSH_KEY_PASSPHRASE || undefined,
  },
  localPort: Number(process.env.LOCAL_TUNNEL_PORT ?? 3307),
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: process.env.DB_NAME || undefined,
  },
};

async function openTunnel() {
  const ssh = new Client();

  await new Promise((resolve, reject) => {
    const onError = (err) => reject(new Error(`No se pudo conectar por SSH a ${config.ssh.host}: ${err.message}`));
    ssh
      .once('ready', () => {
        ssh.removeListener('error', onError);
        resolve();
      })
      .once('error', onError)
      .connect({
        host: config.ssh.host,
        port: config.ssh.port,
        username: config.ssh.username,
        privateKey: fs.readFileSync(config.ssh.keyPath),
        passphrase: config.ssh.passphrase,
        keepaliveInterval: 20_000,
      });
  });

  const server = net.createServer((socket) => {
    socket.on('error', () => socket.destroy());
    ssh.forwardOut('127.0.0.1', socket.remotePort, config.db.host, config.db.port, (err, stream) => {
      if (err) {
        socket.destroy();
        return;
      }
      stream.on('error', () => socket.destroy());
      socket.pipe(stream).pipe(socket);
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.localPort, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });

  return { ssh, server };
}

let active = null;

/**
 * Abre el tunel SSH (si no esta abierto) y devuelve un pool mysql2 apuntando a el.
 * Llamadas sucesivas reutilizan la misma conexion.
 */
export async function getConnection() {
  if (active) return active;

  const { ssh, server } = await openTunnel();

  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: config.localPort,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    multipleStatements: false,
  });

  const close = async () => {
    active = null;
    await pool.end().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
    ssh.end();
  };

  active = { pool, close };
  return active;
}

/** Ejecuta una funcion con el pool abierto y cierra todo al terminar. */
export async function withConnection(fn) {
  const { pool, close } = await getConnection();
  try {
    return await fn(pool);
  } finally {
    await close();
  }
}

export { config, openTunnel };
