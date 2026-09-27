import 'server-only';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/control';
import { conexionesBd, empresas, planes, suscripciones } from '@/lib/db/schema';

/** Empresa con su suscripcion mas reciente y el estado de su conexion. */
export async function listarEmpresas() {
  const [filasEmpresas, filasSuscripciones, filasConexiones, filasPlanes] = await Promise.all([
    db.select().from(empresas).orderBy(asc(empresas.nombreComercial)),
    db.select().from(suscripciones).orderBy(desc(suscripciones.fechaFin)),
    db.select().from(conexionesBd),
    db.select().from(planes),
  ]);

  const planPorId = new Map(filasPlanes.map((p) => [p.id, p]));
  const conexionPorEmpresa = new Map(filasConexiones.map((c) => [c.empresaId, c]));
  const suscripcionPorEmpresa = new Map<number, (typeof filasSuscripciones)[number]>();
  for (const s of filasSuscripciones) {
    // Vienen ordenadas por fecha de fin descendente, la primera es la vigente.
    if (!suscripcionPorEmpresa.has(s.empresaId)) suscripcionPorEmpresa.set(s.empresaId, s);
  }

  return filasEmpresas.map((empresa) => {
    const suscripcion = suscripcionPorEmpresa.get(empresa.id) ?? null;
    return {
      empresa,
      conexion: conexionPorEmpresa.get(empresa.id) ?? null,
      suscripcion,
      plan: suscripcion ? (planPorId.get(suscripcion.planId) ?? null) : null,
    };
  });
}

export async function obtenerEmpresa(id: number) {
  const [empresa] = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1);
  if (!empresa) return null;

  const [[conexion], historial, catalogoPlanes] = await Promise.all([
    db.select().from(conexionesBd).where(eq(conexionesBd.empresaId, id)).limit(1),
    db
      .select()
      .from(suscripciones)
      .where(eq(suscripciones.empresaId, id))
      .orderBy(desc(suscripciones.fechaFin)),
    db.select().from(planes).orderBy(asc(planes.nombre)),
  ]);

  return {
    empresa,
    conexion: conexion ?? null,
    suscripciones: historial,
    planes: catalogoPlanes,
  };
}

export function listarPlanes() {
  return db.select().from(planes).orderBy(asc(planes.nombre));
}
