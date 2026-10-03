import 'dotenv/config';
import { config, openTunnel } from '../src/db/connection.js';

const { localPort, db, ssh } = config;

console.log(
  `Tunel: 127.0.0.1:${localPort} -> ${db.host}:${db.port} (via ${ssh.username}@${ssh.host})`,
);
console.log(`Conecta tu cliente MySQL a 127.0.0.1:${localPort} con el usuario ${db.user}.`);
console.log('Ctrl+C para cerrar.');

const { ssh: client, server } = await openTunnel();

const shutdown = () => {
  client.end();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
