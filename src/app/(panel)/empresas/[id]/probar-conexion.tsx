'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckCircle2, PlugZap, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { probarConexion, type EstadoFormulario } from '../actions';

function Boton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="outline" size="sm" type="submit" disabled={pending}>
      <PlugZap />
      {pending ? 'Probando…' : 'Probar conexión'}
    </Button>
  );
}

export function ProbarConexion({ empresaId }: { empresaId: number }) {
  const [estado, accion] = useActionState<EstadoFormulario | undefined, FormData>(
    probarConexion,
    undefined,
  );

  return (
    <form action={accion} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="empresaId" value={empresaId} />
      <Boton />
      {estado?.mensaje ? (
        <p
          className={`flex items-center gap-1.5 text-sm ${
            estado.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
          }`}
        >
          {estado.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {estado.mensaje}
        </p>
      ) : null}
    </form>
  );
}
