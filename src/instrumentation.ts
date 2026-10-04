export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const { db } = await import('@/lib/db/control');
  const { sql } = await import('drizzle-orm');
  await db.execute(sql`SELECT 1`);
}
