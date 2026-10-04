import 'server-only';
import { asc, desc, eq, getTableColumns } from 'drizzle-orm';
import { db } from '@/lib/db/control';
import { empresas, planes, suscripciones } from '@/lib/db/schema';
import { elegirSuscripcionActual, esSuscripcionVigente } from '@/lib/suscripciones';
import { cerrarSuscripcionesVencidas } from '@/lib/suscripciones-vencimiento';
import { esUuid } from '@/lib/uuid';

export { esUuid as esUuidEmpresa };

const { logoBytes: _logoBytes, ...columnasEmpresa } = getTableColumns(empresas);

/** Empresa con su suscripcion actual. */
export async function listarEmpresas() {
  await cerrarSuscripcionesVencidas();

  const [filasEmpresas, filasSuscripciones, filasPlanes] = await Promise.all([
    db.select(columnasEmpresa).from(empresas).orderBy(asc(empresas.nombreComercial)),
    db.select().from(suscripciones).orderBy(desc(suscripciones.fechaFin)),
    db.select().from(planes),
  ]);

  const planPorId = new Map(filasPlanes.map((p) => [p.id, p]));
  const historialPorEmpresa = new Map<string, (typeof filasSuscripciones)[number][]>();

  for (const s of filasSuscripciones) {
    const lista = historialPorEmpresa.get(s.empresaId);
    if (lista) lista.push(s);
    else historialPorEmpresa.set(s.empresaId, [s]);
  }

  return filasEmpresas.map((empresa) => {
    const historial = historialPorEmpresa.get(empresa.id) ?? [];
    const suscripcion = elegirSuscripcionActual(historial);
    const vigente = suscripcion ? esSuscripcionVigente(suscripcion) : false;
    return {
      empresa,
      suscripcion,
      plan: suscripcion ? (planPorId.get(suscripcion.planId) ?? null) : null,
      requiereRenovacion: historial.length > 0 && !vigente,
    };
  });
}

export async function obtenerEmpresa(id: string) {
  if (!esUuid(id)) return null;
  await cerrarSuscripcionesVencidas(id);

  const [empresa] = await db
    .select(columnasEmpresa)
    .from(empresas)
    .where(eq(empresas.id, id))
    .limit(1);
  if (!empresa) return null;

  const [historial, catalogoPlanes] = await Promise.all([
    db
      .select()
      .from(suscripciones)
      .where(eq(suscripciones.empresaId, id))
      .orderBy(desc(suscripciones.fechaFin)),
    db.select().from(planes).orderBy(asc(planes.nombre)),
  ]);

  return {
    empresa,
    suscripciones: historial,
    planes: catalogoPlanes,
  };
}

export function listarPlanes() {
  return db.select().from(planes).orderBy(asc(planes.nombre));
}
