import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authConfig } from './auth.config';
import { db } from '@/lib/db/control';
import { usuariosAdmin } from '@/lib/db/schema';

const credenciales = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(entrada) {
        const analisis = credenciales.safeParse(entrada);
        if (!analisis.success) return null;

        const { email, password } = analisis.data;
        const [usuario] = await db
          .select()
          .from(usuariosAdmin)
          .where(eq(usuariosAdmin.email, email.toLowerCase()))
          .limit(1);

        if (!usuario || !usuario.activo) return null;
        if (!(await bcrypt.compare(password, usuario.passwordHash))) return null;

        await db
          .update(usuariosAdmin)
          .set({ ultimoAcceso: sql`NOW()` })
          .where(eq(usuariosAdmin.id, usuario.id));

        return { id: String(usuario.id), name: usuario.nombre, email: usuario.email };
      },
    }),
  ],
});
