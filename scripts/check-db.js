import { withConnection, config } from '../src/db/connection.js';

const result = await withConnection(async (pool) => {
  const [[version]] = await pool.query('SELECT VERSION() AS version, NOW() AS ahora');
  const [databases] = await pool.query('SHOW DATABASES');
  return { version, databases };
});

console.log(`Tunel SSH: ${config.ssh.username}@${config.ssh.host}:${config.ssh.port}`);
console.log(`MySQL:     ${config.db.user}@${config.db.host}:${config.db.port}`);
console.log(`Version:   ${result.version.version}`);
console.log(`Hora srv:  ${result.version.ahora}`);
console.log('\nBases de datos:');
for (const row of result.databases) {
  console.log(`  - ${Object.values(row)[0]}`);
}
