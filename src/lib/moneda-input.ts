const MONEDA_ISO = /^[A-Z]{3}$/;

function localeMoneda(moneda: string) {
  return moneda === 'USD' ? 'en-US' : 'es-MX';
}

/** Texto para el input (estilo moneda, sin forzar símbolo en edición). */
export function formatearPrecioInput(valor: string, moneda: string): string {
  const m = MONEDA_ISO.test(moneda) ? moneda : 'MXN';
  const numero = parsearPrecioInput(valor);
  if (numero === null) return '';
  return new Intl.NumberFormat(localeMoneda(m), {
    style: 'currency',
    currency: m,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
}

/**
 * Extrae el importe tal cual (sin prorratear).
 * Acepta 12000, 12000.50, $12,000.50 y 12.000,50.
 */
export function parsearPrecioInput(texto: string): number | null {
  const limpio = texto.replace(/[^\d.,]/g, '').trim();
  if (!limpio) return null;

  const ultimaComa = limpio.lastIndexOf(',');
  const ultimoPunto = limpio.lastIndexOf('.');
  let normalizado: string;

  if (ultimaComa >= 0 && ultimoPunto >= 0) {
    normalizado =
      ultimoPunto > ultimaComa
        ? limpio.replace(/,/g, '')
        : limpio.replace(/\./g, '').replace(',', '.');
  } else if (ultimaComa >= 0) {
    const grupos = limpio.split(',');
    const esMiles = grupos.slice(1).every((g) => g.length === 3);
    normalizado = esMiles ? limpio.replace(/,/g, '') : limpio.replace(',', '.');
  } else if ((limpio.match(/\./g) ?? []).length > 1) {
    normalizado = limpio.replace(/\./g, '');
  } else {
    normalizado = limpio;
  }

  const n = Number(normalizado);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Valor listo para el servidor (dos decimales). */
export function precioParaServidor(texto: string): string | null {
  const n = parsearPrecioInput(texto);
  if (n === null) return null;
  return n.toFixed(2);
}
