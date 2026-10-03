export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const { prepararConexionAlArrancar } = await import('@/lib/destino-mysql');
  await prepararConexionAlArrancar();
}
