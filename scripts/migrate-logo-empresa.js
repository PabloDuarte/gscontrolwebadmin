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
  ALTER TABLE empresas
    ADD COLUMN IF NOT EXISTS logo_mime varchar(40),
    ADD COLUMN IF NOT EXISTS logo_bytes bytea;
`);

console.log('Migración logo_mime / logo_bytes aplicada.');
await sql.end({ timeout: 5 });
