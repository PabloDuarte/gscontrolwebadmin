'use server';

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth, signOut } from '@/auth';
import { enviarCorreo } from '@/lib/correo';
import { db } from '@/lib/db/control';
import { usuariosAdmin } from '@/lib/db/schema';

export type EstadoContrasena = {
  ok?: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
  espera?: number;
};

const esquema = z
  .object({
    nueva: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmacion: z.string().min(1, 'Requerida'),
  })
  .refine((v) => v.nueva === v.confirmacion, {
    message: 'No coincide con la nueva',
    path: ['confirmacion'],
  });

export async function cambiarContrasena(
  _previo: EstadoContrasena | undefined,
  datos: FormData,
): Promise<EstadoContrasena> {
  const sesion = await auth();
  const id = sesion?.user?.id;
  if (!sesion?.user || !id) return { mensaje: 'Sesión no válida' };

  const analisis = esquema.safeParse({
    nueva: datos.get('nueva'),
    confirmacion: datos.get('confirmacion'),
  });
  if (!analisis.success) {
    const errores: Record<string, string> = {};
    for (const issue of analisis.error.issues) {
      const campo = String(issue.path[0] ?? 'general');
      errores[campo] ??= issue.message;
    }
    return { errores };
  }

  const [usuario] = await db
    .select()
    .from(usuariosAdmin)
    .where(eq(usuariosAdmin.id, id))
    .limit(1);
  if (!usuario || !usuario.activo) return { mensaje: 'Sesión no válida' };

  await db
    .update(usuariosAdmin)
    .set({ passwordHash: await bcrypt.hash(analisis.data.nueva, 12) })
    .where(eq(usuariosAdmin.id, id));

  return { ok: true, mensaje: 'Contraseña actualizada.' };
}

export async function cerrarSesion() {
  await signOut({ redirectTo: '/login' });
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

const ASUNTO_RECUPERACION = 'GS Control Panel de Administración de Clientes';
const ESPERA_RECUPERACION_MS = 60_000;
const VIGENCIA_TOKEN_MS = 60 * 60 * 1000;

/** El enlace vence a la hora; la espera de reenvío es el primer minuto de esa vigencia. */
function segundosDeEspera(tokenExpira: Date | string | null | undefined): number {
  if (!tokenExpira) return 0;
  const expira = new Date(tokenExpira).getTime();
  if (Number.isNaN(expira)) return 0;
  const falta = ESPERA_RECUPERACION_MS - (Date.now() - (expira - VIGENCIA_TOKEN_MS));
  if (falta <= 0 || falta > ESPERA_RECUPERACION_MS) return 0;
  return Math.ceil(falta / 1000);
}

export async function solicitarRecuperacion(correoIngresado?: string): Promise<EstadoContrasena> {
  const correo = (correoIngresado ?? '').trim().toLowerCase();
  if (!correo) return { mensaje: 'Escribe tu correo.' };

  const [usuario] = await db
    .select()
    .from(usuariosAdmin)
    .where(eq(usuariosAdmin.email, correo))
    .limit(1);
  if (!usuario || !usuario.activo) return { mensaje: 'Ese correo no está registrado.' };

  const segundos = segundosDeEspera(usuario.tokenExpira);
  if (segundos > 0) {
    return { mensaje: `Espera ${segundos} s para pedir otro enlace.`, espera: segundos };
  }

  const tokenPrevio = usuario.tokenRecuperacion;
  const expiraPrevia = usuario.tokenExpira;
  const token = randomBytes(32).toString('hex');
  const expira = new Date(Date.now() + VIGENCIA_TOKEN_MS);
  await db
    .update(usuariosAdmin)
    .set({ tokenRecuperacion: hashToken(token), tokenExpira: expira })
    .where(eq(usuariosAdmin.id, usuario.id));

  const base = (process.env.AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const enlace = `${base}/recuperar?token=${token}`;

  try {
    await enviarCorreo(
      correo,
      ASUNTO_RECUPERACION,
      [
        `Hola ${usuario.nombre},`,
        '',
        'Para elegir una contraseña nueva del GS Control Panel de Administración de Clientes abre este enlace (vence en 1 hora):',
        enlace,
        '',
        'Si no pediste este correo, puedes ignorarlo.',
      ].join('\n'),
    );
  } catch {
    await db
      .update(usuariosAdmin)
      .set({ tokenRecuperacion: tokenPrevio, tokenExpira: expiraPrevia })
      .where(eq(usuariosAdmin.id, usuario.id));
    return { mensaje: 'No se pudo enviar el correo. Revisa la cuenta de envío.' };
  }

  return { ok: true, mensaje: `Enviamos el enlace a ${correo}.` };
}

const esquemaNueva = z
  .object({
    token: z.string().min(32),
    nueva: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmacion: z.string().min(1, 'Requerida'),
  })
  .refine((v) => v.nueva === v.confirmacion, {
    message: 'No coincide con la nueva',
    path: ['confirmacion'],
  });

export async function restablecerContrasena(
  _previo: EstadoContrasena | undefined,
  datos: FormData,
): Promise<EstadoContrasena> {
  const analisis = esquemaNueva.safeParse({
    token: datos.get('token'),
    nueva: datos.get('nueva'),
    confirmacion: datos.get('confirmacion'),
  });
  if (!analisis.success) {
    const errores: Record<string, string> = {};
    for (const issue of analisis.error.issues) {
      const campo = String(issue.path[0] ?? 'general');
      errores[campo] ??= issue.message;
    }
    return { errores, mensaje: errores.token ? 'El enlace no es válido.' : undefined };
  }

  const hash = hashToken(analisis.data.token);
  const [usuario] = await db
    .select()
    .from(usuariosAdmin)
    .where(eq(usuariosAdmin.tokenRecuperacion, hash))
    .limit(1);

  const guardado = usuario?.tokenRecuperacion ?? '';
  const coincide =
    guardado.length === hash.length &&
    timingSafeEqual(Buffer.from(guardado), Buffer.from(hash));
  const expira = usuario?.tokenExpira ? new Date(usuario.tokenExpira).getTime() : 0;
  if (!usuario || !usuario.activo || !coincide || expira < Date.now()) {
    return { mensaje: 'El enlace venció o ya se usó. Pide otro desde tu cuenta.' };
  }

  await db
    .update(usuariosAdmin)
    .set({
      passwordHash: await bcrypt.hash(analisis.data.nueva, 12),
      tokenRecuperacion: null,
      tokenExpira: null,
    })
    .where(eq(usuariosAdmin.id, usuario.id));

  return { ok: true, mensaje: 'Contraseña actualizada. Ya puedes entrar.' };
}
