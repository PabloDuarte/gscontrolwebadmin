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

export function Sidebar() {
  const ruta = usePathname();

  return (
    <nav className="flex flex-row gap-1 overflow-x-auto p-0 md:flex-col md:p-3">
      {enlaces.map(({ href, etiqueta, icono: Icono }) => {
        const activo = href === '/' ? ruta === '/' : ruta.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activo
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icono className="size-4" />
            {etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
