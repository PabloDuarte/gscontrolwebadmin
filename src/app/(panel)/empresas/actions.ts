'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db/control';
import { empresas, planes, suscripciones } from '@/lib/db/schema';
import { esUuidEmpresa } from '@/lib/consultas';
import { ESTADOS_EMPRESA, PERIODICIDADES } from '@/lib/dominio';
import {
  formatearTelefono,
  normalizarRfc,
  validarTelefonoPartes,
} from '@/lib/empresa';
import { esSuscripcionVigente } from '@/lib/suscripciones';
import { cerrarSuscripcionesVencidas } from '@/lib/suscripciones-vencimiento';
import { leerLogoEmpresa, rutaLogoEmpresa, validarLogo } from '@/lib/uploads';

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

const uuid = z.string().uuid('Identificador no válido');

const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const esquemaEmpresa = z.object({
  nombreComercial: z
    .string()
    .trim()
    .min(2, 'Requerido')
    .max(150)
    .transform((v) => v.toUpperCase()),
  razonSocial: opcional(200).transform((v) => (v ? v.toUpperCase() : null)),
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
  const idCrudo = crudo.id?.trim();
  const id = idCrudo && esUuidEmpresa(idCrudo) ? idCrudo : null;
  const esAlta = !id;

  const empresaAnalizada = esquemaEmpresa.safeParse(crudo);

  const erroresTel = validarTelefonoPartes({
    pais: crudo.telefonoPais ?? '',
    area: crudo.telefonoArea ?? '',
    numero: crudo.telefonoNumero ?? '',
  });

  if (!empresaAnalizada.success || erroresTel) {
    const errores: Record<string, string> = {
      ...(empresaAnalizada.success ? {} : aplanarErrores(empresaAnalizada.error)),
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

  try {
    const codigo = valores.rfc;
    const logoLeido = logo && logo.size > 0 ? await leerLogoEmpresa(logo) : null;

    const ficha = {
      ...valores,
      codigo,
      contactoTelefono,
      ...(logoLeido ? { logoMime: logoLeido.mime, logoBytes: logoLeido.bytes } : {}),
    };

    if (empresaId) {
      await db
        .update(empresas)
        .set({
          ...ficha,
          ...(logoLeido ? { logoPath: rutaLogoEmpresa(empresaId) } : {}),
        })
        .where(eq(empresas.id, empresaId));
    } else {
      empresaId = crypto.randomUUID();
      await db.insert(empresas).values({
        ...ficha,
        id: empresaId,
        ...(logoLeido ? { logoPath: rutaLogoEmpresa(empresaId) } : {}),
      });
    }
  } catch (error) {
    return conValores(crudo, { mensaje: mensajeDeError(error) });
  }

  revalidatePath('/empresas');
  revalidatePath('/');
  revalidatePath(`/empresas/${empresaId}`);
  redirect('/empresas');
}

export async function eliminarEmpresa(datos: FormData) {
  await exigirSesion();
  const id = String(datos.get('id') ?? '');
  if (esUuidEmpresa(id)) {
    await db.delete(empresas).where(eq(empresas.id, id));
  }
  revalidatePath('/empresas');
  revalidatePath('/');
  redirect('/empresas');
}

const esquemaSuscripcion = z.object({
  empresaId: uuid,
  planId: uuid,
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
    fechaInicio: crudo.fechaInicio?.trim(),
    fechaFin: crudo.fechaFin?.trim(),
    renovacionAutomatica: false,
  });

  if (!analisis.success) {
    return { errores: aplanarErrores(analisis.error) };
  }

  const valores = analisis.data;
  if (valores.fechaFin < valores.fechaInicio) {
    return { errores: { fechaFin: 'Debe ser posterior al inicio' } };
  }

  try {
    await cerrarSuscripcionesVencidas(valores.empresaId);

    const [empresa] = await db
      .select({ id: empresas.id })
      .from(empresas)
      .where(eq(empresas.id, valores.empresaId))
      .limit(1);
    if (!empresa) return { mensaje: 'La empresa no existe.' };

    const filas = await db
      .select()
      .from(suscripciones)
      .where(eq(suscripciones.empresaId, valores.empresaId));

    if (filas.some((s) => esSuscripcionVigente(s))) {
      return {
        mensaje:
          'Hay una suscripción vigente; no se puede dar de alta otra hasta que venza o la canceles.',
      };
    }

    const [plan] = await db
      .select({
        nombre: planes.nombre,
        codigo: planes.codigo,
        esPrueba: planes.esPrueba,
      })
      .from(planes)
      .where(eq(planes.id, valores.planId))
      .limit(1);
    if (!plan) return { errores: { planId: 'El plan no existe' } };

    const esPrimera = filas.length === 0;
    const estado = plan.esPrueba && esPrimera ? ('prueba' as const) : ('activa' as const);

    await db.insert(suscripciones).values({
      ...valores,
      estado,
      precio: valores.precio.toFixed(2),
      planNombre: plan.nombre,
      planCodigo: plan.codigo,
    });
  } catch (error) {
    return { mensaje: mensajeDeError(error) };
  }

  revalidatePath(`/empresas/${valores.empresaId}`);
  revalidatePath('/empresas');
  revalidatePath('/');
  return {
    ok: true,
    mensaje: 'Suscripción creada. El ciclo anterior, si lo había, queda en el historial.',
  };
}

export async function cancelarSuscripcion(datos: FormData): Promise<void> {
  await exigirSesion();

  const empresaId = String(datos.get('empresaId') ?? '');
  const suscripcionId = String(datos.get('suscripcionId') ?? '');
  if (!esUuidEmpresa(empresaId) || !uuid.safeParse(suscripcionId).success) {
    throw new Error('Datos no válidos');
  }

  await cerrarSuscripcionesVencidas(empresaId);

  const [fila] = await db
    .select()
    .from(suscripciones)
    .where(and(eq(suscripciones.id, suscripcionId), eq(suscripciones.empresaId, empresaId)))
    .limit(1);

  if (!fila) throw new Error('Suscripción no encontrada');
  if (!esSuscripcionVigente(fila)) {
    throw new Error('Solo se puede cancelar una suscripción vigente');
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
  if (
    texto.includes('23505') ||
    texto.includes('unique constraint') ||
    texto.includes('Duplicate entry')
  ) {
    if (texto.includes('rfc') || texto.includes('codigo')) {
      return 'Ya existe una empresa con este RFC / ID fiscal.';
    }
    return 'Ya existe un registro con esos datos.';
  }
  return texto;
}
