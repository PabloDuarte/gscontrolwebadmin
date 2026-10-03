'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { solicitarRecuperacion, type EstadoContrasena } from '@/app/(panel)/cuenta/actions';
import { iniciarSesion, type EstadoLogin } from './actions';

const CLAVE_ESPERA = 'gscontrol-recuperacion-espera';

function leerEspera(): { correo: string; segundos: number } | null {
  try {
    const crudo = localStorage.getItem(CLAVE_ESPERA);
    if (!crudo) return null;
    const marca = JSON.parse(crudo) as { correo?: string; hasta?: number };
    const segundos = Math.ceil((Number(marca.hasta) - Date.now()) / 1000);
    if (!marca.correo || segundos <= 0) {
      localStorage.removeItem(CLAVE_ESPERA);
      return null;
    }
    return { correo: marca.correo, segundos };
  } catch {
    return null;
  }
}

function guardarEspera(correo: string, segundos: number) {
  localStorage.setItem(
    CLAVE_ESPERA,
    JSON.stringify({ correo, hasta: Date.now() + segundos * 1000 }),
  );
}

function BotonEnviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? 'Entrando…' : 'Entrar'}
    </Button>
  );
}

export function LoginForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [estado, accion] = useActionState<EstadoLogin | undefined, FormData>(iniciarSesion, undefined);
  const [aviso, setAviso] = useState<EstadoContrasena | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(0);
  const [correoEspera, setCorreoEspera] = useState('');

  useEffect(() => {
    const marca = leerEspera();
    if (!marca) return;
    setCorreoEspera(marca.correo);
    setEspera(marca.segundos);
  }, []);

  useEffect(() => {
    if (espera <= 0) return;
    const id = window.setTimeout(() => {
      setEspera((segundos) => {
        const siguiente = segundos - 1;
        if (siguiente <= 0) localStorage.removeItem(CLAVE_ESPERA);
        return Math.max(siguiente, 0);
      });
    }, 1000);
    return () => window.clearTimeout(id);
  }, [espera]);

  return (
    <form ref={formRef} action={accion} className="space-y-5">
      <Field label="Correo" htmlFor="email">
        <Input
          key={estado?.intento ?? (correoEspera || 'correo')}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="correo@intecontrol.com"
          defaultValue={estado?.email || correoEspera}
        />
      </Field>

      <Field label="Contraseña" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>

      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
          disabled={enviando || espera > 0}
          onClick={async () => {
            if (enviando || espera > 0) return;
            const escrito = String(new FormData(formRef.current ?? undefined).get('email') ?? '');
            setEnviando(true);
            try {
              const resultado = await solicitarRecuperacion(escrito);
              setAviso(resultado);
              const segundos = resultado.ok ? 60 : resultado.espera;
              if (segundos) {
                const normalizado = escrito.trim().toLowerCase();
                guardarEspera(normalizado, segundos);
                setCorreoEspera(normalizado);
                setEspera(segundos);
              }
            } finally {
              setEnviando(false);
            }
          }}
        >
          {enviando ? 'Enviando…' : espera > 0 ? `Espera ${espera} s` : 'No recuerdo mi contraseña'}
        </button>
      </div>

      {estado?.mensaje ? (
        <p className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {estado.mensaje}
        </p>
      ) : null}

      {aviso?.mensaje ? (
        <p
          className={`rounded-2xl px-3.5 py-2.5 text-sm ${
            aviso.ok
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {aviso.mensaje}
        </p>
      ) : null}

      <BotonEnviar />
    </form>
  );
}
