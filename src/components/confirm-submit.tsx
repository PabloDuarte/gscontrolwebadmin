'use client';

import { Button } from '@/components/ui/button';

export function ConfirmSubmit({
  mensaje,
  children,
}: {
  mensaje: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="destructive"
      type="submit"
      onClick={(evento) => {
        if (!window.confirm(mensaje)) evento.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
