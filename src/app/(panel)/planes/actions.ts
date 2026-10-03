'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db/control';
import { planes, suscripciones } from '@/lib/db/schema';
import { PERIODICIDADES } from '@/lib/dominio';

export type EstadoFormulario = {
  ok?: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
};

async function exigirSesion() {
  const sesion = await auth();
  if (!sesion?.user) throw new Error('Sesión no válida');
}

const enteroOpcional = z
  .union([z.literal(''), z.coerce.number().int().min(1)])
  .transform((v) => (v === '' ? null : v));

const esquemaPlan = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(40)
    .regex(/^[a-z0-9_-]+$/, 'Sólo minúsculas, números, guion y guion bajo'),
  nombre: z.string().trim().min(2, 'Requerido').max(120),
  descripcion: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((v) => (v ? v : null)),
  precio: z.coerce.number().min(0),
  moneda: z.string().trim().length(3),
  periodicidad: z.enum(PERIODICIDADES),
  maxEmpleados: enteroOpcional,
  maxDispositivos: enteroOpcional,
  maxUsuarios: enteroOpcional,
  activo: z.coerce.boolean(),
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

export async function guardarPlan(
  _previo: EstadoFormulario | undefined,
  datos: FormData,
): Promise<EstadoFormulario> {
  await exigirSesion();

  const crudo = leer(datos);
  const analisis = esquemaPlan.safeParse({
    ...crudo,
    activo: crudo.activo === 'on',
  });

  if (!analisis.success) {
    return { errores: aplanarErrores(analisis.error) };
  }

  const valores = {
    ...analisis.data,
    precio: analisis.data.precio.toFixed(2),
  };
  const id = crudo.id ? Number(crudo.id) : null;

  try {
    if (id) {
      const [actual] = await db
        .select({ codigo: planes.codigo })
        .from(planes)
        .where(eq(planes.id, id))
        .limit(1);
      if (!actual) return { mensaje: 'El plan no existe.' };

      await db.transaction(async (tx) => {
        await tx.update(planes).set(valores).where(eq(planes.id, id));
        if (actual.codigo !== valores.codigo) {
          await tx
            .update(suscripciones)
            .set({ planCodigo: valores.codigo })
            .where(or(eq(suscripciones.planId, id), eq(suscripciones.planCodigo, actual.codigo)));
        }
      });
    } else {
      await db.insert(planes).values(valores);
    }
  } catch (error) {
    const texto = error instanceof Error ? error.message : String(error);
    if (texto.includes('ER_DUP_ENTRY') || texto.includes('Duplicate entry')) {
      return { mensaje: 'Ya existe un plan con ese código.' };
    }
    return { mensaje: texto };
  }

  revalidatePath('/planes');
  revalidatePath('/empresas');
  revalidatePath('/');
  redirect('/planes');
}
