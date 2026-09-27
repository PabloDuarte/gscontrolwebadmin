import net from 'node:net';
import mysql from 'mysql2/promise';
import 'dotenv/config';
import { withConnection } from '../src/db/connection.js';

const name = process.env.CONTROL_DB_NAME ?? 'gscontrol_clientes';
const localPort = Number(process.env.LOCAL_TUNNEL_PORT ?? 3307);

if (!/^[a-z0-9_]+$/.test(name)) {
  throw new Error(`Nombre de base invalido: ${name}`);
}

function puertoAbierto(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

async function crear(pool) {
  const [existentes] = await pool.query(
    'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
    [name],
  );

  if (existentes.length) {
    console.log(`La base ${name} ya existe, no se hace nada.`);
  } else {
    await pool.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Base ${name} creada.`);
  }

  const [[info]] = await pool.query(
    'SELECT DEFAULT_CHARACTER_SET_NAME cs, DEFAULT_COLLATION_NAME col FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
    [name],
  );
  console.log(`Charset: ${info.cs} / ${info.col}`);
}

if (await puertoAbierto(localPort)) {
  console.log(`Usando tunel ya abierto en 127.0.0.1:${localPort}`);
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: localPort,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  try {
    await crear(pool);
  } finally {
    await pool.end();
  }
} else {
  await withConnection(crear);
}
