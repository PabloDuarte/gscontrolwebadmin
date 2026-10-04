/** Fecha local YYYY-MM-DD (sin zona horaria). */
export function fechaLocalHoy(): string {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Suma meses calendario a una fecha ISO; no usa UTC para no correr el día. */
export function sumarMesesIso(fecha: string, meses: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) return '';
  let anio = Number(m[1]);
  let mes = Number(m[2]) - 1 + meses;
  const dia = Number(m[3]);

  while (mes > 11) {
    mes -= 12;
    anio += 1;
  }
  while (mes < 0) {
    mes += 12;
    anio -= 1;
  }

  const maxDia = new Date(anio, mes + 1, 0).getDate();
  const d = Math.min(dia, maxDia);
  return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
