import 'server-only';

const MAXIMO_BYTES = 2 * 1024 * 1024;
const MIME: Record<string, string> = {
  'image/png': 'image/png',
  'image/jpeg': 'image/jpeg',
  'image/webp': 'image/webp',
  'image/svg+xml': 'image/svg+xml',
};

export type ErrorLogo = { campo: 'logo'; mensaje: string };
export type LogoEmpresa = { mime: string; bytes: Buffer };

export function validarLogo(archivo: File | null, obligatorio: boolean): ErrorLogo | null {
  if (!archivo || archivo.size === 0) {
    return obligatorio ? { campo: 'logo', mensaje: 'El logo es obligatorio' } : null;
  }
  if (archivo.size > MAXIMO_BYTES) {
    return { campo: 'logo', mensaje: 'El archivo no puede pesar más de 2 MB' };
  }
  if (!MIME[archivo.type]) {
    return { campo: 'logo', mensaje: 'Usa PNG, JPG, WEBP o SVG' };
  }
  return null;
}

export async function leerLogoEmpresa(archivo: File): Promise<LogoEmpresa> {
  const mime = MIME[archivo.type];
  if (!mime) throw new Error('Tipo de logo no válido');
  return { mime, bytes: Buffer.from(await archivo.arrayBuffer()) };
}

export function rutaLogoEmpresa(id: string) {
  return `/api/empresas/${id}/logo?v=${Date.now()}`;
}
