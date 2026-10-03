'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle({ enMenu = false }: { enMenu?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  // El tema resuelto solo existe en el cliente. Hasta montar, el botón queda igual que en el HTML del servidor.
  useEffect(() => setMontado(true), []);

  const oscuro = montado && resolvedTheme === 'dark';
  const etiqueta = oscuro ? 'Tema claro' : 'Tema oscuro';

  if (enMenu) {
    return (
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/10"
        onClick={() => setTheme(oscuro ? 'light' : 'dark')}
      >
        {oscuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
        {etiqueta}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      onClick={() => setTheme(oscuro ? 'light' : 'dark')}
    >
      {oscuro ? <Sun /> : <Moon />}
    </Button>
  );
}
