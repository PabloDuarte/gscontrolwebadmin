'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LayoutDashboard, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

const enlaces = [
  { href: '/', etiqueta: 'Tablero', icono: LayoutDashboard },
  { href: '/empresas', etiqueta: 'Empresas', icono: Building2 },
  { href: '/planes', etiqueta: 'Planes', icono: Tags },
];

export function Sidebar({ colapsado = false }: { colapsado?: boolean }) {
  const ruta = usePathname();

  return (
    <nav
      className={cn(
        'flex flex-row gap-1 overflow-x-auto p-0 md:flex-col',
        colapsado ? 'md:items-center md:p-2' : 'md:p-3',
      )}
    >
      {enlaces.map(({ href, etiqueta, icono: Icono }) => {
        const activo = href === '/' ? ruta === '/' : ruta.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            title={colapsado ? etiqueta : undefined}
            className={cn(
              'flex items-center rounded-full text-sm font-medium transition-all duration-200 ease-apple',
              colapsado
                ? 'justify-center p-2.5 md:w-full'
                : 'gap-3 px-3.5 py-2.5',
              activo
                ? 'bg-white text-black shadow-apple'
                : 'text-white/55 hover:bg-white/10 hover:text-white',
            )}
          >
            <Icono className="size-4 shrink-0" />
            {!colapsado ? <span className="truncate">{etiqueta}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
