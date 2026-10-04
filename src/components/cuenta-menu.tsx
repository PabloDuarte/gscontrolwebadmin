'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { KeyRound, LogOut } from 'lucide-react';
import { BrandIcon } from '@/components/brand-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { cambiarContrasena, cerrarSesion, type EstadoContrasena } from '@/app/(panel)/cuenta/actions';

function GuardarContrasena() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Guardando…' : 'Actualizar'}
    </Button>
  );
}

export function CuentaMenu({
  nombre,
  correo,
}: {
  nombre?: string | null;
  correo?: string | null;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [contrasena, setContrasena] = useState(false);
  const [salir, setSalir] = useState(false);
  const [ocultarOk, setOcultarOk] = useState(false);
  const [estado, accion] = useActionState<EstadoContrasena | undefined, FormData>(
    async (previo, datos) => {
      setOcultarOk(false);
      return cambiarContrasena(previo, datos);
    },
    undefined,
  );

  useEffect(() => {
    if (!abierto && !contrasena && !salir) return;
    function cerrar(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setAbierto(false);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (salir) setSalir(false);
      else if (contrasena) setContrasena(false);
      else setAbierto(false);
    }
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto, contrasena, salir]);

  const error = (campo: string) => estado?.errores?.[campo];
  const actualizada = Boolean(estado?.ok) && !ocultarOk;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex max-w-[16rem] items-center gap-2 rounded-full py-1 pl-1 pr-3 text-left text-white transition-colors duration-200 ease-apple hover:bg-white/10"
        aria-expanded={abierto}
        aria-haspopup="menu"
        onClick={() => setAbierto((v) => !v)}
      >
        <BrandIcon className="size-8 shrink-0" />
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-[13px] font-medium">{nombre}</span>
          <span className="block truncate text-xs text-white/50">{correo}</span>
        </span>
      </button>

      {abierto ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-white/10 bg-black p-2 text-white shadow-apple-lg"
        >
          <div className="px-3 py-2 sm:hidden">
            <p className="truncate text-[13px] font-medium">{nombre}</p>
            <p className="truncate text-xs text-white/50">{correo}</p>
          </div>
          <ThemeToggle enMenu />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/10"
            onClick={() => {
              setAbierto(false);
              setOcultarOk(true);
              setContrasena(true);
            }}
          >
            <KeyRound className="size-4" />
            Cambiar contraseña
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/10"
            onClick={() => {
              setAbierto(false);
              setSalir(true);
            }}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      ) : null}

      {salir ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setSalir(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-salida"
            className="w-full max-w-sm space-y-5 rounded-3xl border border-black/5 bg-white/95 p-6 shadow-apple-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#161617]/95"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p id="confirmar-salida" className="text-[17px] font-medium tracking-tight">
              ¿Estás seguro de cerrar la sesión?
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSalir(false)}>
                No
              </Button>
              <form action={cerrarSesion}>
                <Button type="submit" size="sm">
                  Sí
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {contrasena ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setContrasena(false)}
        >
          <form
            action={accion}
            className="w-full max-w-sm space-y-4 rounded-3xl border border-black/5 bg-white/95 p-6 shadow-apple-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#161617]/95"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[17px] font-medium tracking-tight">Cambiar contraseña</p>
                <p className="mt-1 text-sm text-muted-foreground">{correo}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setContrasena(false)}>
                  Cancelar
                </Button>
                <GuardarContrasena />
              </div>
            </div>
            {actualizada ? (
              <p className="rounded-2xl bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
                {estado?.mensaje}
              </p>
            ) : null}
            {estado?.mensaje && !estado.ok ? (
              <p className="rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {estado.mensaje}
              </p>
            ) : null}
            <Field label="Nueva contraseña" htmlFor="nueva" error={error('nueva')}>
              <Input id="nueva" name="nueva" type="password" autoComplete="new-password" required minLength={8} />
            </Field>
            <Field label="Confirmar contraseña" htmlFor="confirmacion" error={error('confirmacion')}>
              <Input
                id="confirmacion"
                name="confirmacion"
                type="password"
                autoComplete="new-password"
                required
              />
            </Field>
          </form>
        </div>
      ) : null}
    </div>
  );
}
