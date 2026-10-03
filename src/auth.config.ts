import type { NextAuthConfig } from 'next-auth';

/**
 * Configuracion que tambien corre en el middleware (edge), por eso no toca
 * la base de datos ni bcrypt. El proveedor real vive en src/auth.ts.
 */
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const autenticado = Boolean(auth?.user);
      const enLogin = request.nextUrl.pathname.startsWith('/login');

      if (request.nextUrl.pathname.startsWith('/recuperar')) return true;

      if (enLogin) {
        const cancelado = request.nextUrl.searchParams.get('cancelado') === '1';
        if (autenticado && !cancelado) return Response.redirect(new URL('/', request.nextUrl));
        return true;
      }
      return autenticado;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = String(user.id);
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
