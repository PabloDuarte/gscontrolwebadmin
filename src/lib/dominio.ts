export const ESTADOS_EMPRESA = ['activo', 'prueba', 'suspendido', 'cancelado'] as const;
export type EstadoEmpresa = (typeof ESTADOS_EMPRESA)[number];

export const ESTADOS_SUSCRIPCION = ['prueba', 'activa', 'vencida', 'cancelada'] as const;
export type EstadoSuscripcion = (typeof ESTADOS_SUSCRIPCION)[number];

export const PERIODICIDADES = ['mensual', 'trimestral', 'semestral', 'anual'] as const;
export type Periodicidad = (typeof PERIODICIDADES)[number];

type Tono = 'neutro' | 'exito' | 'aviso' | 'peligro' | 'info';

export const TONO_EMPRESA: Record<EstadoEmpresa, Tono> = {
  activo: 'exito',
  prueba: 'info',
  suspendido: 'aviso',
  cancelado: 'peligro',
};

export const TONO_SUSCRIPCION: Record<EstadoSuscripcion, Tono> = {
  prueba: 'info',
  activa: 'exito',
  vencida: 'peligro',
  cancelada: 'neutro',
};

export const ETIQUETA_PERIODICIDAD: Record<Periodicidad, string> = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

/** Meses que cubre cada periodicidad de pago. El precio del plan es mensual. */
export const MESES_POR_PERIODICIDAD: Record<Periodicidad, number> = {
  mensual: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

/** Precio pactado = precio del plan × meses de la periodicidad elegida. */
export function precioPorPeriodicidad(precioPlan: string | number, periodicidad: Periodicidad) {
  const base = typeof precioPlan === 'string' ? Number(precioPlan) : precioPlan;
  if (!Number.isFinite(base) || base < 0) return '0.00';
  return (base * MESES_POR_PERIODICIDAD[periodicidad]).toFixed(2);
}

/** Primera letra en mayuscula, para mostrar los valores del enum tal cual se guardan. */
export function capitalizar(valor: string) {
  return valor.charAt(0).toUpperCase() + valor.slice(1);
}
