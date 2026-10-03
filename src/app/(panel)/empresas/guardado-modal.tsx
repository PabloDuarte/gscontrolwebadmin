'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

export function GuardadoModal({ visible }: { visible: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(visible);

  useEffect(() => {
    if (!visible) return;
    setAbierto(true);
    const t = window.setTimeout(() => {
      setAbierto(false);
      router.replace(pathname);
    }, 2200);
    return () => window.clearTimeout(t);
  }, [visible, pathname, router]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="empresa-guardada"
    >
      <div className="w-full max-w-xs rounded-3xl border border-black/5 bg-white/90 px-7 py-8 text-center shadow-apple-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#161617]/95">
        <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
        <p id="empresa-guardada" className="mt-3 text-[17px] font-medium tracking-tight">
          Guardado con éxito
        </p>
      </div>
    </div>
  );
}
