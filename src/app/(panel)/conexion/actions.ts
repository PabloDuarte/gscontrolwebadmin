'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { arrancarTunelLicencia, pararTunelLicencia } from '@/lib/tunel-control';

export type EstadoTunel = { ok?: boolean; mensaje?: string };

async function exigirSesion() {
  const sesion = await auth();
  if (!sesion?.user) throw new Error('Sesión no válida');
}

export async function arrancarTunel(
  _previo: EstadoTunel | undefined,
): Promise<EstadoTunel> {
  await exigirSesion();
  const resultado = await arrancarTunelLicencia();
  revalidatePath('/conexion');
  return resultado;
}

export async function pararTunel(_previo: EstadoTunel | undefined): Promise<EstadoTunel> {
  await exigirSesion();
  const resultado = await pararTunelLicencia();
  revalidatePath('/conexion');
  return resultado;
}
