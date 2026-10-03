'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';

export type EstadoLogin = { mensaje?: string; email?: string; intento?: number };

export async function iniciarSesion(
  _estadoPrevio: EstadoLogin | undefined,
  datos: FormData,
): Promise<EstadoLogin> {
  const email = String(datos.get('email') ?? '').trim();
  try {
    await signIn('credentials', {
      email,
      password: String(datos.get('password') ?? ''),
      redirectTo: '/',
    });
    return {};
  } catch (error) {
    // signIn redirige lanzando una excepcion, hay que dejarla pasar.
    if (error instanceof AuthError) {
      return { mensaje: 'Correo o contraseña incorrectos.', email, intento: Date.now() };
    }
    throw error;
  }
}
