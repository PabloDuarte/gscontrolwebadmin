'use client';

import * as React from 'react';
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

function diasDelMes(anio: number, mes: number) {
  return new Date(anio, mes, 0).getDate();
}

function partirFecha(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? { anio: m[1], mes: m[2], dia: m[3] } : { anio: '', mes: '', dia: '' };
}

function unirFecha(anio: string, mes: string, dia: string) {
  if (!anio || !mes || !dia) return '';
  const max = diasDelMes(Number(anio), Number(mes));
  const d = Math.min(Number(dia), max);
  return `${anio}-${mes}-${String(d).padStart(2, '0')}`;
}

/** Día, mes y año como selects, alineados al resto del formulario. */
export function DateSelect({
  id,
  name,
  value,
  defaultValue = '',
  onChange,
  required,
}: {
  id?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (valor: string) => void;
  required?: boolean;
}) {
  const controlado = value !== undefined;
  const [suelto, setSuelto] = React.useState(() => partirFecha(defaultValue));
  const partes = controlado ? partirFecha(value ?? '') : suelto;
  const extra = partes.anio ? Number(partes.anio) : null;
  const anios = React.useMemo(() => {
    const set = new Set<number>();
    for (let a = 2040; a >= 2010; a--) set.add(a);
    if (extra && !Number.isNaN(extra)) set.add(extra);
    return [...set].sort((a, b) => b - a);
  }, [extra]);
  const maxDia =
    partes.anio && partes.mes ? diasDelMes(Number(partes.anio), Number(partes.mes)) : 31;

  const cambiar = (campo: 'anio' | 'mes' | 'dia', val: string) => {
    const next = { ...partes, [campo]: val };
    const iso = unirFecha(next.anio, next.mes, next.dia);
    if (!controlado) setSuelto(iso ? partirFecha(iso) : next);
    onChange?.(iso);
  };

  return (
    <div className="grid grid-cols-[5.25rem_minmax(0,1fr)_6.25rem] gap-2">
      <input type="hidden" name={name} value={unirFecha(partes.anio, partes.mes, partes.dia)} />
      <Select
        id={id}
        value={partes.dia}
        required={required}
        onChange={(e) => cambiar('dia', e.target.value)}
        aria-label="Día"
      >
        <option value="" disabled>
          Día
        </option>
        {Array.from({ length: maxDia }, (_, i) => {
          const d = String(i + 1).padStart(2, '0');
          return (
            <option key={d} value={d}>
              {d}
            </option>
          );
        })}
      </Select>
      <Select
        value={partes.mes}
        required={required}
        onChange={(e) => cambiar('mes', e.target.value)}
        aria-label="Mes"
      >
        <option value="" disabled>
          Mes
        </option>
        {MESES.map((mes, i) => {
          const m = String(i + 1).padStart(2, '0');
          return (
            <option key={m} value={m}>
              {mes}
            </option>
          );
        })}
      </Select>
      <Select
        value={partes.anio}
        required={required}
        onChange={(e) => cambiar('anio', e.target.value)}
        aria-label="Año"
      >
        <option value="" disabled>
          Año
        </option>
        {anios.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </Select>
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
