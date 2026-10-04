import type { EstadoSuscripcion } from './dominio';

/** Dias de anticipacion con los que se avisa un vencimiento. */
export const UMBRALES_AVISO = [7, 15, 30] as const;

export type NivelVigencia = 'cancelada' | 'vencida' | 'critica' | 'proxima' | 'vigente';

export type Vigencia = {
  nivel: NivelVigencia;
  dias: number;
  etiqueta: string;
  tono: 'neutro' | 'exito' | 'aviso' | 'peligro' | 'info';
};

/** Una suscripcion en curso no se edita: hay que cancelarla o esperar a que venza. */
export function esSuscripcionEnCurso(estado: EstadoSuscripcion | string): boolean {
  return estado === 'activa' || estado === 'prueba';
}

/** Activa o prueba con fecha_fin hoy o futura. */
export function esSuscripcionVigente(suscripcion: {
  estado: string;
  fechaFin: string;
}): boolean {
  return esSuscripcionEnCurso(suscripcion.estado) && diasParaVencer(suscripcion.fechaFin) >= 0;
}

/** Activa o prueba cuya fecha_fin ya paso; debe pasar a estado vencida. */
export function debeCerrarsePorVencimiento(suscripcion: {
  estado: string;
  fechaFin: string;
}): boolean {
  return esSuscripcionEnCurso(suscripcion.estado) && diasParaVencer(suscripcion.fechaFin) < 0;
}

/**
 * Elige la suscripcion que representa a la empresa en listados y tablero:
 * primero una vigente; si no, la mas reciente no cancelada por fechaFin.
 */
export function elegirSuscripcionActual<T extends { estado: string; fechaFin: string }>(
  filas: T[],
): T | null {
  const vigente = filas.find((s) => esSuscripcionVigente(s));
  if (vigente) return vigente;

  const noCanceladas = filas.filter((s) => s.estado !== 'cancelada');
  if (noCanceladas.length === 0) return null;

  return [...noCanceladas].sort((a, b) => b.fechaFin.localeCompare(a.fechaFin))[0] ?? null;
}

/** Dias entre hoy y la fecha de fin. Negativo si ya paso. */
export function diasParaVencer(fechaFin: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaFin);
  if (!m) return Number.NaN;
  const fin = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.round((fin.getTime() - hoy.getTime()) / 86_400_000);
}

export function calcularVigencia(fechaFin: string, estado: EstadoSuscripcion): Vigencia {
  const dias = diasParaVencer(fechaFin);

  if (estado === 'cancelada') {
    return { nivel: 'cancelada', dias, etiqueta: 'Cancelada', tono: 'neutro' };
  }
  if (estado === 'vencida' || dias < 0) {
    const hace = Math.abs(dias);
    return {
      nivel: 'vencida',
      dias,
      etiqueta: hace === 1 ? 'Venció ayer' : `Venció hace ${hace} días`,
      tono: 'peligro',
    };
  }
  if (dias === 0) {
    const critica: Vigencia = { nivel: 'critica', dias, etiqueta: 'Vence hoy', tono: 'peligro' };
    if (estado === 'prueba') return { ...critica, etiqueta: 'Prueba · Vence hoy', tono: 'info' };
    return critica;
  }

  const etiqueta = dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`;
  if (dias <= 7) {
    const critica: Vigencia = { nivel: 'critica', dias, etiqueta, tono: 'peligro' };
    if (estado === 'prueba') return { ...critica, etiqueta: `Prueba · ${etiqueta}`, tono: 'info' };
    return critica;
  }
  if (dias <= 15) return { nivel: 'proxima', dias, etiqueta, tono: 'aviso' };
  if (dias <= 30) {
    const proxima: Vigencia = { nivel: 'proxima', dias, etiqueta, tono: 'aviso' };
    if (estado === 'prueba') {
      return { ...proxima, etiqueta: `Prueba · ${etiqueta}`, tono: 'info' };
    }
    return proxima;
  }

  if (estado === 'prueba') {
    return { nivel: 'vigente', dias, etiqueta: 'Prueba', tono: 'info' };
  }

  return { nivel: 'vigente', dias, etiqueta: 'Vigente', tono: 'exito' };
}

/** Contadores del tablero: en curso (activa/prueba vigente) y buckets de aviso. */
export function resumirAlertas(
  suscripciones: Array<{ fechaFin: string; estado: EstadoSuscripcion }>,
) {
  const resumen = { enCurso: 0, vencidas: 0, en7: 0, en15: 0, en30: 0, estables: 0 };

  for (const s of suscripciones) {
    if (s.estado === 'cancelada') continue;

    if (!esSuscripcionVigente(s)) {
      if (s.estado === 'vencida' || diasParaVencer(s.fechaFin) < 0) {
        resumen.vencidas += 1;
      }
      continue;
    }

    resumen.enCurso += 1;
    const dias = diasParaVencer(s.fechaFin);
    if (dias <= 7) resumen.en7 += 1;
    else if (dias <= 15) resumen.en15 += 1;
    else if (dias <= 30) resumen.en30 += 1;
    else resumen.estables += 1;
  }

  return resumen;
}
