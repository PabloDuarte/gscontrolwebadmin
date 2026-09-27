'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { iniciarSesion } from './actions';

function BotonEnviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? 'Entrando…' : 'Entrar'}
    </Button>
  );
}

export function LoginForm() {
  const [error, accion] = useActionState(iniciarSesion, undefined);

  return (
    <form action={accion} className="space-y-5">
      <Field label="Correo" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu.correo@inteconayc.com"
        />
      </Field>

      <Field label="Contraseña" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>

      {error ? (
        <p className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <BotonEnviar />
    </form>
  );
}
