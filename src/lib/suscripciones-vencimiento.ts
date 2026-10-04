import 'server-only';
import { and, eq, inArray, lt } from 'drizzle-orm';
import { db } from '@/lib/db/control';
import { suscripciones } from '@/lib/db/schema';

function hoyIsoLocal(): string {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Cierra suscripciones activa/prueba cuya fecha_fin ya pasó. */
export async function cerrarSuscripcionesVencidas(empresaId?: string) {
  const condiciones = [
    inArray(suscripciones.estado, ['activa', 'prueba']),
    lt(suscripciones.fechaFin, hoyIsoLocal()),
  ];
  if (empresaId) condiciones.push(eq(suscripciones.empresaId, empresaId));

  await db
    .update(suscripciones)
    .set({ estado: 'vencida' })
    .where(and(...condiciones));
}
