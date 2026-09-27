'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db/control';
import { conexionesBd, empresas, suscripciones, type ConexionBd } from '@/lib/db/schema';
import { probarConexionEmpresa } from '@/lib/db/tenant';
import { cifrar } from '@/lib/crypto';
import {
  ESTADOS_EMPRESA,
  ESTADOS_SUSCRIPCION,
  PASSWORD_ENMASCARADA,
  PERIODICIDADES,
} from '@/lib/dominio';
import {
  formatearTelefono,
  normalizarRfc,
  validarTelefonoPartes,
} from '@/lib/empresa';
import { esSuscripcionEnCurso } from '@/lib/suscripciones';
import { borrarLogoEmpresa, guardarLogoEmpresa, validarLogo } from '@/lib/uploads';

export type EstadoFormulario = {
  ok?: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
  /** Valores de texto del FormData para rehidratar el formulario tras un error. */
  valores?: Record<string, string>;
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
  nombreComercial: z.string().trim().min(2, 'Requerido').max(150),
  razonSocial: opcional(200),
  rfc: z
    .string()
    .trim()
    .min(12, 'RFC o ID fiscal requerido')
    .max(13, 'Máximo 13 caracteres')
    .transform(normalizarRfc)
    .refine((v) => /^[A-Z0-9Ñ&]{8,13}$/.test(v), 'RFC / ID fiscal no válido'),
  contactoNombre: opcional(150),
  contactoEmail: z
    .union([z.literal(''), z.email('Correo no válido')])
    .transform((v) => (v ? v : null)),
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

function conValores(
  crudo: Record<string, string>,
  parcial: Omit<EstadoFormulario, 'valores'>,
): EstadoFormulario {
  return { ...parcial, valores: crudo };
}

export async function guardarEmpresa(
  _previo: EstadoFormulario | undefined,
  datos: FormData,
): Promise<EstadoFormulario> {
  await exigirSesion();

  const crudo = leer(datos);
  const id = crudo.id ? Number(crudo.id) : null;
  const esAlta = !id;
  // Conexión solo en ficha (edición), nunca en el alta.
  const capturaConexion = !esAlta && crudo.configurarConexion === 'on';

  const empresaAnalizada = esquemaEmpresa.safeParse(crudo);
  const conexionAnalizada = capturaConexion
    ? esquemaConexion.safeParse({ ...crudo, usaTunelSsh: crudo.usaTunelSsh === 'on' })
    : null;

  const erroresTel = validarTelefonoPartes({
    pais: crudo.telefonoPais ?? '',
    area: crudo.telefonoArea ?? '',
    numero: crudo.telefonoNumero ?? '',
  });

  if (!empresaAnalizada.success || (conexionAnalizada && !conexionAnalizada.success) || erroresTel) {
    const errores: Record<string, string> = {
      ...(empresaAnalizada.success ? {} : aplanarErrores(empresaAnalizada.error)),
      ...(conexionAnalizada && !conexionAnalizada.success
        ? aplanarErrores(conexionAnalizada.error)
        : {}),
    };
    if (erroresTel) {
      if (erroresTel.pais) errores.telefonoPais = erroresTel.pais;
      if (erroresTel.area) errores.telefonoArea = erroresTel.area;
      if (erroresTel.numero) errores.telefonoNumero = erroresTel.numero;
    }
    return conValores(crudo, { errores });
  }

  const valores = empresaAnalizada.data;
  const contactoTelefono = formatearTelefono({
    pais: crudo.telefonoPais ?? '',
    area: crudo.telefonoArea ?? '',
    numero: crudo.telefonoNumero ?? '',
  });

  const archivoLogo = datos.get('logo');
  const logo = archivoLogo instanceof File ? archivoLogo : null;
  const errorLogo = validarLogo(logo, esAlta);
  if (errorLogo) {
    return conValores(crudo, { errores: { logo: errorLogo.mensaje } });
  }

  const [duplicadoRfc] = await db
    .select({ id: empresas.id })
    .from(empresas)
    .where(
      id
        ? and(eq(empresas.rfc, valores.rfc), ne(empresas.id, id))
        : eq(empresas.rfc, valores.rfc),
    )
    .limit(1);
  if (duplicadoRfc) {
    return conValores(crudo, {
      errores: { rfc: 'Ya existe una empresa con este RFC / ID fiscal' },
    });
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

    // El RFC / TAX ID es el identificador; codigo se alinea a él (columna técnica).
    const codigo = valores.rfc;

    let logoPath = logoAnterior;
    if (logo && logo.size > 0) {
      logoPath = await guardarLogoEmpresa(codigo, logo);
    }

    const ficha = {
      ...valores,
      codigo,
      contactoTelefono,
      logoPath,
    };

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

      const passwordNueva =
        c.password && c.password !== PASSWORD_ENMASCARADA ? c.password : '';

      if (!existente && !passwordNueva) {
        return conValores(crudo, { errores: { password: 'Requerida para una conexión nueva' } });
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
          .set(passwordNueva ? { ...base, passwordCifrado: cifrar(passwordNueva) } : base)
          .where(eq(conexionesBd.id, existente.id));
      } else {
        await db.insert(conexionesBd).values({ ...base, passwordCifrado: cifrar(passwordNueva) });
      }
    }
  } catch (error) {
    return conValores(crudo, { mensaje: mensajeDeError(error) });
  }

  revalidatePath('/empresas');
  revalidatePath('/');
  revalidatePath(`/empresas/${empresaId}`);
  if (esAlta) {
    redirect('/empresas');
  }
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

/** Prueba la conexión con los parámetros del formulario (alta o edición sin guardar). */
export async function probarConexionDesdeFormulario(
  _previo: EstadoFormulario | undefined,
  datos: FormData,
): Promise<EstadoFormulario> {
  await exigirSesion();

  const crudo = leer(datos);
  const analisis = esquemaConexion.safeParse({
    ...crudo,
    usaTunelSsh: crudo.usaTunelSsh === 'on',
  });

  if (!analisis.success) {
    return { ok: false, mensaje: 'Completa los datos de conexión antes de probar.', errores: aplanarErrores(analisis.error) };
  }

  const c = analisis.data;
  let passwordPlana =
    c.password && c.password !== PASSWORD_ENMASCARADA ? c.password : '';

  const empresaId = crudo.empresaId ? Number(crudo.empresaId) : null;
  if (!passwordPlana && empresaId) {
    const [guardada] = await db
      .select()
      .from(conexionesBd)
      .where(eq(conexionesBd.empresaId, empresaId))
      .limit(1);
    if (guardada) {
      const temporal: ConexionBd = {
        ...guardada,
        host: c.host,
        puerto: c.puerto,
        nombreBd: c.nombreBd,
        usuario: c.usuario,
        usaTunelSsh: c.usaTunelSsh,
        sshHost: c.sshHost,
        sshPuerto: c.sshPuerto ?? 22,
        sshUsuario: c.sshUsuario,
        sshKeyPath: c.sshKeyPath,
      };
      const resultado = await probarConexionEmpresa(temporal);
      if (resultado.ok) {
        return { ok: true, mensaje: `Conexión correcta. Servidor ${resultado.version}.` };
      }
      return { ok: false, mensaje: `No se pudo conectar: ${resultado.mensaje}` };
    }
  }

  if (!passwordPlana) {
    return { ok: false, mensaje: 'Indica la contraseña para probar la conexión.' };
  }

  const temporal = {
    id: 0,
    empresaId: 0,
    host: c.host,
    puerto: c.puerto,
    nombreBd: c.nombreBd,
    usuario: c.usuario,
    passwordCifrado: cifrar(passwordPlana),
    usaTunelSsh: c.usaTunelSsh,
    sshHost: c.sshHost,
    sshPuerto: c.sshPuerto ?? 22,
    sshUsuario: c.sshUsuario,
    sshKeyPath: c.sshKeyPath,
    verificadaEn: null,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  } satisfies ConexionBd;

  const resultado = await probarConexionEmpresa(temporal);
  if (resultado.ok) {
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

  if (valores.estado === 'cancelada') {
    return { errores: { estado: 'Crea la suscripción activa; cancélala después si hace falta' } };
  }

  try {
    if (esSuscripcionEnCurso(valores.estado)) {
      const existentes = await db
        .select({ id: suscripciones.id })
        .from(suscripciones)
        .where(
          and(
            eq(suscripciones.empresaId, valores.empresaId),
            inArray(suscripciones.estado, ['activa', 'prueba']),
          ),
        )
        .limit(1);

      if (existentes.length > 0) {
        return {
          mensaje:
            'Esta empresa ya tiene una suscripción activa. Cancélala antes de asignar un plan nuevo.',
        };
      }
    }

    await db.insert(suscripciones).values({
      ...valores,
      precio: valores.precio.toFixed(2),
    });
  } catch (error) {
    return { mensaje: mensajeDeError(error) };
  }

  revalidatePath(`/empresas/${valores.empresaId}`);
  revalidatePath('/empresas');
  revalidatePath('/');
  return {
    ok: true,
    mensaje: 'Suscripción asignada. Si había una cancelada, queda en el historial.',
  };
}

export async function cancelarSuscripcion(datos: FormData): Promise<void> {
  await exigirSesion();

  const empresaId = Number(datos.get('empresaId'));
  const suscripcionId = Number(datos.get('suscripcionId'));
  if (!Number.isInteger(empresaId) || !Number.isInteger(suscripcionId)) {
    throw new Error('Datos no válidos');
  }

  const [fila] = await db
    .select()
    .from(suscripciones)
    .where(and(eq(suscripciones.id, suscripcionId), eq(suscripciones.empresaId, empresaId)))
    .limit(1);

  if (!fila) throw new Error('Suscripción no encontrada');
  if (!esSuscripcionEnCurso(fila.estado)) {
    throw new Error('Solo se puede cancelar una suscripción activa o en prueba');
  }

  await db
    .update(suscripciones)
    .set({ estado: 'cancelada' })
    .where(eq(suscripciones.id, suscripcionId));

  revalidatePath(`/empresas/${empresaId}`);
  revalidatePath('/empresas');
  revalidatePath('/');
}

function mensajeDeError(error: unknown) {
  const texto = error instanceof Error ? error.message : String(error);
  if (texto.includes('ER_DUP_ENTRY') || texto.includes('Duplicate entry')) {
    if (texto.includes('rfc') || texto.includes('codigo')) {
      return 'Ya existe una empresa con este RFC / ID fiscal.';
    }
    return 'Ya existe un registro con esos datos.';
  }
  return texto;
}
