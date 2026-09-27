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

/** Una suscripcion en curso no se edita: hay que cancelarla para cambiar de plan. */
export function esSuscripcionEnCurso(estado: EstadoSuscripcion | string): boolean {
  return estado === 'activa' || estado === 'prueba';
}

/**
 * Elige la suscripcion que representa a la empresa en listados y tablero:
 * primero una en curso; si no, la mas reciente no cancelada por fechaFin.
 */
export function elegirSuscripcionActual<T extends { estado: string; fechaFin: string }>(
  filas: T[],
): T | null {
  const enCurso = filas.find((s) => esSuscripcionEnCurso(s.estado));
  if (enCurso) return enCurso;

  const noCanceladas = filas.filter((s) => s.estado !== 'cancelada');
  if (noCanceladas.length === 0) return null;

  return [...noCanceladas].sort((a, b) => b.fechaFin.localeCompare(a.fechaFin))[0] ?? null;
}

/** Dias entre hoy y la fecha de fin. Negativo si ya paso. */
export function diasParaVencer(fechaFin: string): number {
  const [anio, mes, dia] = fechaFin.split('-').map(Number);
  const fin = Date.UTC(anio, mes - 1, dia);
  const ahora = new Date();
  const hoy = Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.round((fin - hoy) / 86_400_000);
}

export function calcularVigencia(fechaFin: string, estado: EstadoSuscripcion): Vigencia {
  const dias = diasParaVencer(fechaFin);

  if (estado === 'cancelada') {
    return { nivel: 'cancelada', dias, etiqueta: 'Cancelada', tono: 'neutro' };
  }
  if (dias < 0) {
    const hace = Math.abs(dias);
    return {
      nivel: 'vencida',
      dias,
      etiqueta: hace === 1 ? 'Venció ayer' : `Venció hace ${hace} días`,
      tono: 'peligro',
    };
  }
  if (dias === 0) {
    return { nivel: 'critica', dias, etiqueta: 'Vence hoy', tono: 'peligro' };
  }

  const etiqueta = dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`;
  if (dias <= 7) return { nivel: 'critica', dias, etiqueta, tono: 'peligro' };
  if (dias <= 15) return { nivel: 'proxima', dias, etiqueta, tono: 'aviso' };
  if (dias <= 30) return { nivel: 'proxima', dias, etiqueta, tono: 'aviso' };

  return { nivel: 'vigente', dias, etiqueta: 'Vigente', tono: 'exito' };
}

/** Cuenta cuantas suscripciones caen en cada bucket de aviso, para el tablero. */
export function resumirAlertas(
  suscripciones: Array<{ fechaFin: string; estado: EstadoSuscripcion }>,
) {
  const resumen = { vencidas: 0, en7: 0, en15: 0, en30: 0, vigentes: 0 };

  for (const s of suscripciones) {
    if (s.estado === 'cancelada') continue;
    const dias = diasParaVencer(s.fechaFin);
    if (dias < 0) resumen.vencidas += 1;
    else if (dias <= 7) resumen.en7 += 1;
    else if (dias <= 15) resumen.en15 += 1;
    else if (dias <= 30) resumen.en30 += 1;
    else resumen.vigentes += 1;
  }

  return resumen;
}
