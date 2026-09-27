/** Normaliza RFC / ID fiscal: mayúsculas, sin espacios ni guiones. */
export function normalizarRfc(valor: string): string {
  return valor.trim().toUpperCase().replace(/[\s-]/g, '');
}

export type TelefonoPartes = {
  pais: string;
  area: string;
  numero: string;
};

/** Separa `+52 33 12345678` (o texto libre) en país, área y número. */
export function parsearTelefono(valor: string | null | undefined): TelefonoPartes {
  if (!valor?.trim()) return { pais: '52', area: '', numero: '' };

  const limpio = valor.trim();
  const conPrefijo = limpio.match(/^\+(\d{1,3})\s+(\d{1,4})\s+(\d{4,12})$/);
  if (conPrefijo) {
    return { pais: conPrefijo[1], area: conPrefijo[2], numero: conPrefijo[3] };
  }

  const digitos = limpio.replace(/\D/g, '');
  if (digitos.length >= 10) {
    // Heurística MX: últimos 10 = área(2/3) + número
    const local = digitos.slice(-10);
    return {
      pais: digitos.slice(0, -10) || '52',
      area: local.slice(0, 2),
      numero: local.slice(2),
    };
  }

  return { pais: '52', area: '', numero: digitos };
}

/** Une país, área y número en el formato guardado en BD. */
export function formatearTelefono(partes: TelefonoPartes): string | null {
  const pais = partes.pais.replace(/\D/g, '');
  const area = partes.area.replace(/\D/g, '');
  const numero = partes.numero.replace(/\D/g, '');
  if (!pais && !area && !numero) return null;
  return `+${pais} ${area} ${numero}`;
}

/** Valida las tres partes del teléfono. Devuelve errores por campo o null si OK / vacío. */
export function validarTelefonoPartes(partes: TelefonoPartes): Partial<Record<keyof TelefonoPartes, string>> | null {
  const pais = partes.pais.replace(/\D/g, '');
  const area = partes.area.replace(/\D/g, '');
  const numero = partes.numero.replace(/\D/g, '');

  if (!pais && !area && !numero) return null;

  const errores: Partial<Record<keyof TelefonoPartes, string>> = {};
  if (!/^\d{1,3}$/.test(pais)) errores.pais = 'País: 1 a 3 dígitos';
  if (!/^\d{1,4}$/.test(area)) errores.area = 'Área: 1 a 4 dígitos';
  if (!/^\d{4,12}$/.test(numero)) errores.numero = 'Número: 4 a 12 dígitos';
  return Object.keys(errores).length ? errores : null;
}
