'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { CuentaMenu } from '@/components/cuenta-menu';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CLAVE = 'gscontrol-sidebar-colapsado';

export function PanelShell({
  nombre,
  correo,
  children,
}: {
  nombre?: string | null;
  correo?: string | null;
  children: ReactNode;
}) {
  const [colapsado, setColapsado] = useState(false);
  const [menuMovil, setMenuMovil] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      setColapsado(localStorage.getItem(CLAVE) === '1');
    } catch {
      /* storage no disponible */
    }
    setListo(true);
  }, []);

  function alternar() {
    setColapsado((prev) => {
      const siguiente = !prev;
      try {
        localStorage.setItem(CLAVE, siguiente ? '1' : '0');
      } catch {
        /* ignore */
      }
      return siguiente;
    });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-white/10 bg-black transition-[width] duration-200 ease-apple md:flex',
          colapsado ? 'w-[4.25rem]' : 'w-64',
          !listo && 'md:w-64',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center gap-2',
            colapsado ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          {!colapsado ? <BrandLogo className="max-w-[10rem]" /> : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={alternar}
            aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
            aria-expanded={!colapsado}
          >
            {colapsado ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
          </Button>
        </div>
        <Sidebar colapsado={colapsado} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 bg-black px-5 text-white md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex items-center gap-2 md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setMenuMovil((v) => !v)}
                aria-label="Menú de navegación"
                aria-expanded={menuMovil}
              >
                <PanelLeft className="size-5" />
              </Button>
              <BrandLogo className="max-h-8 max-w-[8rem]" />
            </div>
            {colapsado ? (
              <div className="hidden md:block">
                <BrandLogo className="max-h-8 max-w-[10rem]" />
              </div>
            ) : null}
          </div>
          <CuentaMenu nombre={nombre} correo={correo} />
        </header>

        {menuMovil ? (
          <div className="border-b border-white/10 bg-black px-3 py-2 md:hidden">
            <Sidebar colapsado={false} />
          </div>
        ) : null}

        <main className="flex-1 px-5 pb-16 pt-4 md:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
