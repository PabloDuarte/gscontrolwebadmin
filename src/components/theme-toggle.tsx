'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  // El tema resuelto solo existe en el cliente. Hasta montar, el botón queda igual que en el HTML del servidor.
  useEffect(() => setMontado(true), []);

  const oscuro = montado && resolvedTheme === 'dark';

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
