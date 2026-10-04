import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { esUuid } from '@/lib/uuid';
import { db } from '@/lib/db/control';
import { empresas } from '@/lib/db/schema';

const MIME_PERMITIDO = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);

export async function GET(_request: Request, contexto: { params: Promise<{ id: string }> }) {
  const sesion = await auth();
  if (!sesion?.user) return new Response('No autorizado', { status: 401 });

  const { id } = await contexto.params;
  if (!esUuid(id)) return new Response('No encontrado', { status: 404 });

  const [fila] = await db
    .select({ mime: empresas.logoMime, bytes: empresas.logoBytes })
    .from(empresas)
    .where(eq(empresas.id, id))
    .limit(1);

  if (!fila?.bytes || !fila.mime || !MIME_PERMITIDO.has(fila.mime)) {
    return new Response('No encontrado', { status: 404 });
  }

  return new Response(new Uint8Array(fila.bytes), {
    headers: {
      'Content-Type': fila.mime,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
