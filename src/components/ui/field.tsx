'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const controlBase =
  'flex w-full rounded-2xl border border-black/5 bg-white/80 px-3.5 py-2 text-sm shadow-sm backdrop-blur-md transition-all duration-200 ease-apple placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlBase, 'h-11', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(controlBase, 'min-h-24 resize-y', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(controlBase, 'h-11 cursor-pointer', className)} {...props} />
));
Select.displayName = 'Select';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const;
const ISO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

function partirIso(iso: string) {
  const m = ISO_FECHA.exec(iso);
  if (!m) return null;
  return { anio: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
}

function aIso(anio: number, mes: number, dia: number) {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Formato corto de Apple en es-MX: «4 oct 2026». */
function etiquetaApple(iso: string) {
  const partes = partirIso(iso);
  if (!partes) return '';
  const fecha = new Date(partes.anio, partes.mes - 1, partes.dia);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
    .format(fecha)
    .replace(/\./g, '');
}

function celdasDelMes(anio: number, mes: number) {
  const primero = new Date(anio, mes - 1, 1).getDay();
  const total = new Date(anio, mes, 0).getDate();
  const celdas: (number | null)[] = [];
  for (let i = 0; i < primero; i++) celdas.push(null);
  for (let dia = 1; dia <= total; dia++) celdas.push(dia);
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

/** Cápsula de fecha al estilo Apple: al pulsar abre el mes, sin el calendario del navegador. */
export function DateSelect({
  id,
  name,
  value,
  defaultValue = '',
  onChange,
  required,
}: {
  id?: string;
  /** Si se omite, el padre debe enviar la fecha con un hidden ligado al mismo estado. */
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (valor: string) => void;
  required?: boolean;
}) {
  const controlado = value !== undefined;
  const [interno, setInterno] = React.useState(defaultValue);
  const iso = controlado ? (value ?? '') : interno;
  const hoy = React.useMemo(() => {
    const ahora = new Date();
    return { anio: ahora.getFullYear(), mes: ahora.getMonth() + 1, dia: ahora.getDate() };
  }, []);
  const [abierto, setAbierto] = React.useState(false);
  const [vista, setVista] = React.useState(() => {
    const partes = partirIso(iso);
    return partes ? { anio: partes.anio, mes: partes.mes } : { anio: hoy.anio, mes: hoy.mes };
  });
  const raiz = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!abierto) return;
    const cerrar = (evento: MouseEvent) => {
      if (!raiz.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const abrir = () => {
    const partes = partirIso(iso);
    setVista(partes ? { anio: partes.anio, mes: partes.mes } : { anio: hoy.anio, mes: hoy.mes });
    setAbierto(true);
  };

  const elegir = (dia: number) => {
    const siguiente = aIso(vista.anio, vista.mes, dia);
    if (!controlado) setInterno(siguiente);
    onChange?.(siguiente);
    setAbierto(false);
  };

  const moverMes = (delta: number) => {
    setVista((actual) => {
      const fecha = new Date(actual.anio, actual.mes - 1 + delta, 1);
      return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 };
    });
  };

  const celdas = celdasDelMes(vista.anio, vista.mes);
  const hoyIso = aIso(hoy.anio, hoy.mes, hoy.dia);

  return (
    <div ref={raiz} className="relative">
      {name ? <input type="hidden" name={name} value={iso} readOnly required={required} /> : null}
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        className={cn(
          'flex h-11 w-full items-center rounded-xl px-3.5 text-left text-sm transition-colors duration-200 ease-apple',
          'bg-black/[0.06] hover:bg-black/[0.09] dark:bg-white/10 dark:hover:bg-white/[0.14]',
          abierto && 'bg-[#0071E3]/12 text-[#0071E3] dark:bg-[#0071E3]/25',
          !iso && 'text-muted-foreground',
        )}
      >
        {iso ? etiquetaApple(iso) : 'Seleccionar'}
      </button>

      {abierto ? (
        <div
          role="dialog"
          aria-label="Elegir fecha"
          className="absolute left-0 z-30 mt-2 w-[17.75rem] rounded-3xl border border-black/5 bg-white/95 p-3 shadow-apple-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#161617]/95"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => moverMes(-1)}
              className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors duration-200 ease-apple hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-semibold tracking-tight">
              {MESES[vista.mes - 1]} {vista.anio}
            </p>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => moverMes(1)}
              className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors duration-200 ease-apple hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center">
            {DIAS_SEMANA.map((dia, i) => (
              <span key={`${dia}-${i}`} className="py-1 text-[11px] font-medium text-muted-foreground">
                {dia}
              </span>
            ))}
            {celdas.map((dia, i) => {
              if (!dia) return <span key={`vacio-${i}`} className="size-9" />;
              const fecha = aIso(vista.anio, vista.mes, dia);
              const seleccionado = fecha === iso;
              const esHoy = fecha === hoyIso;
              return (
                <button
                  key={fecha}
                  type="button"
                  onClick={() => elegir(dia)}
                  className={cn(
                    'mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-colors duration-200 ease-apple',
                    seleccionado && 'bg-[#0071E3] font-medium text-white',
                    !seleccionado && esHoy && 'font-semibold text-[#0071E3] ring-1 ring-[#0071E3]',
                    !seleccionado && 'hover:bg-black/5 dark:hover:bg-white/10',
                  )}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-[13px] font-medium leading-none text-foreground', className)}
      {...props}
    />
  );
}

/** Etiqueta, control y mensaje de error o ayuda, apilados en una sola columna. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
