import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL en .env');
  process.exit(1);
}

const sql = postgres(url, {
  prepare: false,
  max: 1,
  ssl: url.includes('supabase') ? 'require' : undefined,
});

try {
  const [fila] = await sql`SELECT current_database() AS base, version() AS version`;
  console.log(`Conectado a ${fila.base}`);
  console.log(fila.version);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
