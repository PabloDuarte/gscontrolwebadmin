'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import { TR } from '@/components/ui/table';

/** La fila abre su propia ficha. En Safari `position: relative` no aplica a `<tr>`, así que un enlace estirado con `absolute` tapa toda la tabla y manda a otra empresa. */
export function FilaEmpresa({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();

  function abrir(e: MouseEvent<HTMLTableRowElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('a, button')) return;
    router.push(href);
  }

  return (
    <TR className="cursor-pointer" onClick={abrir}>
      {children}
    </TR>
  );
}
