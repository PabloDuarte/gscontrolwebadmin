'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db/control';
import { conexionesBd, empresas, suscripciones } from '@/lib/db/schema';
import { probarConexionEmpresa } from '@/lib/db/tenant';
import { cifrar } from '@/lib/crypto';
import { ESTADOS_EMPRESA, ESTADOS_SUSCRIPCION, PERIODICIDADES } from '@/lib/dominio';
import { borrarLogoEmpresa, guardarLogoEmpresa, validarLogo } from '@/lib/uploads';

export type EstadoFormulario = {
  ok?: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
};

async function exigirSesion() {
  const sesion = await auth();
  if (!sesion?.user) throw new Error('Sesión no válida');
}

const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const esquemaEmpresa = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(40)
    .regex(/^[a-z0-9_-]+$/, 'Sólo minúsculas, números, guion y guion bajo'),
  nombreComercial: z.string().trim().min(2, 'Requerido').max(150),
  razonSocial: opcional(200),
  rfc: opcional(13),
  contactoNombre: opcional(150),
  contactoEmail: z
    .union([z.literal(''), z.email('Correo no válido')])
    .transform((v) => (v ? v : null)),
  contactoTelefono: opcional(40),
  estado: z.enum(ESTADOS_EMPRESA),
  fechaAlta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida'),
  notas: opcional(5000),
});

const esquemaConexion = z.object({
  nombreBd: z
    .string()
    .trim()
    .min(1, 'Requerido')
    .max(64)
    .regex(/^[A-Za-z0-9_]+$/, 'Sólo letras, números y guion bajo'),
  host: z.string().trim().min(1, 'Requerido').max(255),
  puerto: z.coerce.number().int().min(1).max(65535),
  usuario: z.string().trim().min(1, 'Requerido').max(100),
  password: z.string(),
  usaTunelSsh: z.coerce.boolean(),
  sshHost: opcional(255),
  sshPuerto: z.coerce.number().int().min(1).max(65535).optional(),
  sshUsuario: opcional(100),
  sshKeyPath: opcional(255),
});

function aplanarErrores(error: z.ZodError): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? 'general');
    salida[campo] ??= issue.message;
  }
  return salida;
}

function leer(datos: FormData) {
  const obj: Record<string, string> = {};
  for (const [clave, valor] of datos.entries()) {
    if (typeof valor === 'string') obj[clave] = valor;
  }
  return obj;
}

export async function guardarEmpresa(
  _previo: EstadoFormulario | undefined,
  datos: FormData,
): Promise<EstadoFormulario> {
  await exigirSesion();

  const crudo = leer(datos);
  const id = crudo.id ? Number(crudo.id) : null;
  const capturaConexion = crudo.configurarConexion === 'on';

  const empresaAnalizada = esquemaEmpresa.safeParse(crudo);
  const conexionAnalizada = capturaConexion
    ? esquemaConexion.safeParse({ ...crudo, usaTunelSsh: crudo.usaTunelSsh === 'on' })
    : null;

  if (!empresaAnalizada.success) {
    return { errores: aplanarErrores(empresaAnalizada.error) };
  }
  if (conexionAnalizada && !conexionAnalizada.success) {
    return { errores: aplanarErrores(conexionAnalizada.error) };
  }

  const valores = empresaAnalizada.data;
  const archivoLogo = datos.get('logo');
  const logo = archivoLogo instanceof File ? archivoLogo : null;
  const errorLogo = validarLogo(logo, !id);
  if (errorLogo) {
    return { errores: { logo: errorLogo.mensaje } };
  }

  let empresaId = id;
  let logoAnterior: string | null = null;

  try {
    if (empresaId) {
      const [actual] = await db
        .select({ logoPath: empresas.logoPath })
        .from(empresas)
        .where(eq(empresas.id, empresaId))
        .limit(1);
      logoAnterior = actual?.logoPath ?? null;
    }

    let logoPath = logoAnterior;
    if (logo && logo.size > 0) {
      logoPath = await guardarLogoEmpresa(valores.codigo, logo);
    }

    const ficha = { ...valores, logoPath };

    if (empresaId) {
      await db.update(empresas).set(ficha).where(eq(empresas.id, empresaId));
    } else {
      const [insertado] = await db.insert(empresas).values(ficha).$returningId();
      empresaId = insertado.id;
    }

    if (logo && logo.size > 0 && logoAnterior && logoAnterior !== logoPath) {
      await borrarLogoEmpresa(logoAnterior);
    }

    if (conexionAnalizada?.success) {
      const c = conexionAnalizada.data;
      const [existente] = await db
        .select()
        .from(conexionesBd)
        .where(eq(conexionesBd.empresaId, empresaId))
        .limit(1);

      // En edicion, dejar la contrasena en blanco significa conservar la actual.
      if (!existente && !c.password) {
        return { errores: { password: 'Requerida para una conexión nueva' } };
      }

      const base = {
        empresaId,
        nombreBd: c.nombreBd,
        host: c.host,
        puerto: c.puerto,
        usuario: c.usuario,
        usaTunelSsh: c.usaTunelSsh,
        sshHost: c.sshHost,
        sshPuerto: c.sshPuerto ?? 22,
        sshUsuario: c.sshUsuario,
        sshKeyPath: c.sshKeyPath,
      };

      if (existente) {
        await db
          .update(conexionesBd)
          .set(c.password ? { ...base, passwordCifrado: cifrar(c.password) } : base)
          .where(eq(conexionesBd.id, existente.id));
      } else {
        await db.insert(conexionesBd).values({ ...base, passwordCifrado: cifrar(c.password) });
      }
    }
  } catch (error) {
    return { mensaje: mensajeDeError(error) };
  }

  revalidatePath('/empresas');
  revalidatePath('/');
  redirect(`/empresas/${empresaId}`);
}

export async function eliminarEmpresa(datos: FormData) {
  await exigirSesion();
  const id = Number(datos.get('id'));
  if (Number.isInteger(id)) {
    const [actual] = await db
      .select({ logoPath: empresas.logoPath })
      .from(empresas)
      .where(eq(empresas.id, id))
      .limit(1);
    await db.delete(empresas).where(eq(empresas.id, id));
    await borrarLogoEmpresa(actual?.logoPath);
  }
  revalidatePath('/empresas');
  revalidatePath('/');
  redirect('/empresas');
}

export async function probarConexion(
  _previo: EstadoFormulario | undefined,
  datos: FormData,
): Promise<EstadoFormulario> {
  await exigirSesion();

  const empresaId = Number(datos.get('empresaId'));
  const [conexion] = await db
    .select()
    .from(conexionesBd)
    .where(eq(conexionesBd.empresaId, empresaId))
    .limit(1);

  if (!conexion) {
    return { ok: false, mensaje: 'Esta empresa todavía no tiene parámetros de conexión.' };
  }

  const resultado = await probarConexionEmpresa(conexion);

  if (resultado.ok) {
    await db
      .update(conexionesBd)
      .set({ verificadaEn: sql`NOW()` })
      .where(eq(conexionesBd.id, conexion.id));
    revalidatePath(`/empresas/${empresaId}`);
    return { ok: true, mensaje: `Conexión correcta. Servidor ${resultado.version}.` };
  }

  return { ok: false, mensaje: `No se pudo conectar: ${resultado.mensaje}` };
}

const esquemaSuscripcion = z.object({
  empresaId: z.coerce.number().int().positive(),
  planId: z.coerce.number().int().positive({ message: 'Elige un plan' }),
  estado: z.enum(ESTADOS_SUSCRIPCION),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida'),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida'),
  precio: z.coerce.number().min(0),
  moneda: z.string().trim().length(3),
  periodicidad: z.enum(PERIODICIDADES),
  renovacionAutomatica: z.coerce.boolean(),
  notas: opcional(5000),
});

export async function guardarSuscripcion(
  _previo: EstadoFormulario | undefined,
  datos: FormData,
): Promise<EstadoFormulario> {
  await exigirSesion();

  const crudo = leer(datos);
  const analisis = esquemaSuscripcion.safeParse({
    ...crudo,
    renovacionAutomatica: crudo.renovacionAutomatica === 'on',
  });

  if (!analisis.success) {
    return { errores: aplanarErrores(analisis.error) };
  }

  const valores = analisis.data;
  if (valores.fechaFin < valores.fechaInicio) {
    return { errores: { fechaFin: 'Debe ser posterior al inicio' } };
  }

  const id = crudo.id ? Number(crudo.id) : null;
  const fila = { ...valores, precio: valores.precio.toFixed(2) };

  try {
    if (id) {
      await db.update(suscripciones).set(fila).where(eq(suscripciones.id, id));
    } else {
      await db.insert(suscripciones).values(fila);
    }
  } catch (error) {
    return { mensaje: mensajeDeError(error) };
  }

  revalidatePath(`/empresas/${valores.empresaId}`);
  revalidatePath('/empresas');
  revalidatePath('/');
  return { ok: true, mensaje: 'Suscripción guardada.' };
}

function mensajeDeError(error: unknown) {
  const texto = error instanceof Error ? error.message : String(error);
  if (texto.includes('ER_DUP_ENTRY') || texto.includes('Duplicate entry')) {
    return 'Ya existe un registro con ese código o esa base de datos.';
  }
  return texto;
}
