import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITMO = 'aes-256-gcm';
const LARGO_IV = 12;
const LARGO_TAG = 16;

function llave() {
  const base64 = process.env.APP_ENCRYPTION_KEY;
  if (!base64) {
    throw new Error('Falta APP_ENCRYPTION_KEY en .env');
  }
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length !== 32) {
    throw new Error(`APP_ENCRYPTION_KEY debe ser de 32 bytes, llegaron ${bytes.length}`);
  }
  return bytes;
}

/** Devuelve iv + tag + texto cifrado, todo junto en base64. */
export function cifrar(texto: string): string {
  const iv = randomBytes(LARGO_IV);
  const cipher = createCipheriv(ALGORITMO, llave(), iv);
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), cifrado]).toString('base64');
}

export function descifrar(payload: string): string {
  const bytes = Buffer.from(payload, 'base64');
  if (bytes.length < LARGO_IV + LARGO_TAG) {
    throw new Error('El valor cifrado esta incompleto o corrupto');
  }
  const iv = bytes.subarray(0, LARGO_IV);
  const tag = bytes.subarray(LARGO_IV, LARGO_IV + LARGO_TAG);
  const decipher = createDecipheriv(ALGORITMO, llave(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(bytes.subarray(LARGO_IV + LARGO_TAG)),
    decipher.final(),
  ]).toString('utf8');
}
