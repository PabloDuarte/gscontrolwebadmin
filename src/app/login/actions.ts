'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';

export async function iniciarSesion(_estadoPrevio: string | undefined, datos: FormData) {
  try {
    await signIn('credentials', {
      email: String(datos.get('email') ?? '').trim(),
      password: String(datos.get('password') ?? ''),
      redirectTo: '/',
    });
  } catch (error) {
    // signIn redirige lanzando una excepcion, hay que dejarla pasar.
    if (error instanceof AuthError) {
      return 'Correo o contraseña incorrectos.';
    }
    throw error;
  }
}
