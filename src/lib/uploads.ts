import 'server-only';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MAXIMO_BYTES = 2 * 1024 * 1024;
const EXTENSIONES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

const CARPETA = path.join(process.cwd(), 'public', 'uploads', 'empresas');

export type ErrorLogo = { campo: 'logo'; mensaje: string };

export function validarLogo(archivo: File | null, obligatorio: boolean): ErrorLogo | null {
  if (!archivo || archivo.size === 0) {
    return obligatorio ? { campo: 'logo', mensaje: 'El logo es obligatorio' } : null;
  }
  if (archivo.size > MAXIMO_BYTES) {
    return { campo: 'logo', mensaje: 'El archivo no puede pesar más de 2 MB' };
  }
  if (!EXTENSIONES[archivo.type]) {
    return { campo: 'logo', mensaje: 'Usa PNG, JPG, WEBP o SVG' };
  }
  return null;
}

function rutaPublica(codigo: string, extension: string) {
  return `/uploads/empresas/${codigo}.${extension}`;
}

function rutaDisco(rutaPublicaLogo: string) {
  const relativo = rutaPublicaLogo.replace(/^\//, '');
  return path.join(process.cwd(), 'public', ...relativo.split('/'));
}

export async function guardarLogoEmpresa(codigo: string, archivo: File): Promise<string> {
  const extension = EXTENSIONES[archivo.type];
  if (!extension) throw new Error('Tipo de logo no válido');

  await mkdir(CARPETA, { recursive: true });
  const destino = path.join(CARPETA, `${codigo}.${extension}`);
  const buffer = Buffer.from(await archivo.arrayBuffer());
  await writeFile(destino, buffer);
  return rutaPublica(codigo, extension);
}

export async function borrarLogoEmpresa(rutaPublicaLogo: string | null | undefined) {
  if (!rutaPublicaLogo?.startsWith('/uploads/empresas/')) return;
  try {
    await unlink(rutaDisco(rutaPublicaLogo));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
