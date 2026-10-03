'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Cable, LayoutDashboard, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

const enlaces = [
  { href: '/', etiqueta: 'Tablero', icono: LayoutDashboard },
  { href: '/empresas', etiqueta: 'Empresas', icono: Building2 },
  { href: '/planes', etiqueta: 'Planes', icono: Tags },
  { href: '/conexion', etiqueta: 'Conexión', icono: Cable },
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
              'flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ease-apple',
              activo
                ? 'bg-white text-black shadow-apple'
                : 'text-white/55 hover:bg-white/10 hover:text-white',
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
