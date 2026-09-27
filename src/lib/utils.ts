import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatearFecha(valor: Date | string | null | undefined) {
  if (!valor) return '—';
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [anio, mes, dia] = valor.split('-').map(Number);
    return formatoFecha.format(new Date(anio, mes - 1, dia));
  }
  const fecha = typeof valor === 'string' ? new Date(valor) : valor;
  if (Number.isNaN(fecha.getTime())) return '—';
  return formatoFecha.format(fecha);
}

export function formatearMoneda(valor: number | string | null | undefined, moneda = 'MXN') {
  if (valor === null || valor === undefined || valor === '') return '—';
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (Number.isNaN(numero)) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(numero);
}
