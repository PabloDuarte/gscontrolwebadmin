import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL');
  process.exit(1);
}

const sql = postgres(url, {
  prepare: false,
  max: 1,
  ssl: url.includes('supabase') ? 'require' : undefined,
});

await sql.unsafe(`
  ALTER TABLE planes
  ADD COLUMN IF NOT EXISTS es_prueba boolean NOT NULL DEFAULT false;
`);

console.log('Migración es_prueba aplicada.');
await sql.end({ timeout: 5 });
