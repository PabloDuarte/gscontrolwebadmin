import 'server-only';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/control';
import { conexionesBd, empresas, planes, suscripciones } from '@/lib/db/schema';
import { elegirSuscripcionActual } from '@/lib/suscripciones';

/** Empresa con su suscripcion actual y el estado de su conexion. */
export async function listarEmpresas() {
  const [filasEmpresas, filasSuscripciones, filasConexiones, filasPlanes] = await Promise.all([
    db.select().from(empresas).orderBy(asc(empresas.nombreComercial)),
    db.select().from(suscripciones).orderBy(desc(suscripciones.fechaFin)),
    db.select().from(conexionesBd),
    db.select().from(planes),
  ]);

  const planPorId = new Map(filasPlanes.map((p) => [p.id, p]));
  const conexionPorEmpresa = new Map(filasConexiones.map((c) => [c.empresaId, c]));
  const historialPorEmpresa = new Map<number, (typeof filasSuscripciones)[number][]>();

  for (const s of filasSuscripciones) {
    const lista = historialPorEmpresa.get(s.empresaId);
    if (lista) lista.push(s);
    else historialPorEmpresa.set(s.empresaId, [s]);
  }

  return filasEmpresas.map((empresa) => {
    const suscripcion = elegirSuscripcionActual(historialPorEmpresa.get(empresa.id) ?? []);
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
