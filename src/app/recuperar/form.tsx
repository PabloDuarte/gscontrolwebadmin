'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { restablecerContrasena, type EstadoContrasena } from '@/app/(panel)/cuenta/actions';

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar contraseña'}
    </Button>
  );
}

export function RecuperarForm({ token }: { token: string }) {
  const [estado, accion] = useActionState<EstadoContrasena | undefined, FormData>(
    restablecerContrasena,
    undefined,
  );
  const error = (campo: string) => estado?.errores?.[campo];

  if (estado?.ok) {
    return (
      <div className="space-y-4">
        <p className="text-sm">{estado.mensaje}</p>
        <Link href="/login" className="text-sm font-medium text-primary">
          Ir a entrar
        </Link>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {estado?.mensaje ? (
        <p className="rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {estado.mensaje}
        </p>
      ) : null}
      <Field label="Nueva contraseña" htmlFor="nueva" error={error('nueva')}>
        <Input id="nueva" name="nueva" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Field label="Confirmar contraseña" htmlFor="confirmacion" error={error('confirmacion')}>
        <Input id="confirmacion" name="confirmacion" type="password" autoComplete="new-password" required />
      </Field>
      <Guardar />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => window.location.assign('/login?cancelado=1')}
      >
        Cancelar
      </Button>
    </form>
  );
}
