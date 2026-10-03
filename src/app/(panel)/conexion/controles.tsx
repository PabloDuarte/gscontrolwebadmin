'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { arrancarTunel, pararTunel, type EstadoTunel } from './actions';

function BotonArrancar({ activo }: { activo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending || activo}>
      <Play />
      {pending ? 'Arrancando…' : 'Arrancar túnel'}
    </Button>
  );
}

function BotonParar({ activo }: { activo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="sm"
      variant="destructive"
      disabled={pending || !activo}
      onClick={(evento) => {
        if (!window.confirm('¿Parar el túnel? Las consultas a MySQL se cortan hasta que lo arranques de nuevo.')) {
          evento.preventDefault();
        }
      }}
    >
      <Square />
      {pending ? 'Parando…' : 'Parar túnel'}
    </Button>
  );
}

export function ControlesTunel({ activo }: { activo: boolean }) {
  const router = useRouter();
  const [arranque, accionArrancar] = useActionState<EstadoTunel | undefined, FormData>(
    arrancarTunel,
    undefined,
  );
  const [parada, accionParar] = useActionState<EstadoTunel | undefined, FormData>(
    pararTunel,
    undefined,
  );
  const aviso = parada ?? arranque;

  useEffect(() => {
    if (aviso?.mensaje) router.refresh();
  }, [aviso, router]);

  return (
    <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
      <form action={accionArrancar}>
        <BotonArrancar activo={activo} />
      </form>
      <form action={accionParar}>
        <BotonParar activo={activo} />
      </form>
      <p className="text-sm text-muted-foreground">
        {activo
          ? 'Está escuchando. Parar cierra también el túnel que hayas dejado en la terminal.'
          : 'Está detenido. Arrancar usa el mismo túnel que npm run tunnel.'}
      </p>
      {arranque?.mensaje ? (
        <p
          className={`w-full text-sm ${arranque.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}
        >
          {arranque.mensaje}
        </p>
      ) : null}
      {parada?.mensaje ? (
        <p
          className={`w-full text-sm ${parada.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}
        >
          {parada.mensaje}
        </p>
      ) : null}
    </div>
  );
}
