import 'server-only';
import { execFile } from 'node:child_process';
import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

type EstadoTunel = { ok: boolean; mensaje: string };

const global_ = globalThis as typeof globalThis & { __tunelChild?: ChildProcess };

function puertoLocal() {
  return Number(process.env.LOCAL_TUNNEL_PORT ?? 3307);
}

function puertoAbierto(puerto: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port: puerto });
    const listo = (abierto: boolean) => {
      socket.destroy();
      resolve(abierto);
    };
    socket.once('connect', () => listo(true));
    socket.once('error', () => listo(false));
    socket.setTimeout(800, () => listo(false));
  });
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function esperarPuerto(puerto: number, abierto: boolean) {
  for (let i = 0; i < 40; i++) {
    if ((await puertoAbierto(puerto)) === abierto) return true;
    await esperar(250);
  }
  return false;
}

async function pidEnPuerto(puerto: number) {
  try {
    const { stdout } = await execFileAsync('lsof', [
      '-nP',
      `-iTCP:${puerto}`,
      '-sTCP:LISTEN',
      '-t',
    ]);
    const pid = Number(stdout.trim().split('\n')[0]);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

async function comandoDe(pid: number) {
  try {
    const { stdout } = await execFileAsync('ps', ['-p', String(pid), '-o', 'args=']);
    return stdout.trim();
  } catch {
    return '';
  }
}

function esProcesoDelTunel(comando: string) {
  return /tunnel\.(js|sh)/.test(comando);
}

async function cerrarPropio() {
  const child = global_.__tunelChild;
  if (!child || child.killed || child.exitCode != null) {
    global_.__tunelChild = undefined;
    return;
  }
  child.kill('SIGTERM');
  await esperarPuerto(puertoLocal(), false);
  if (await puertoAbierto(puertoLocal())) child.kill('SIGKILL');
  global_.__tunelChild = undefined;
}

/** Abre el mismo túnel que `npm run tunnel`, si el puerto local está libre. */
export async function arrancarTunelLicencia(): Promise<EstadoTunel> {
  const puerto = puertoLocal();
  if (await puertoAbierto(puerto)) {
    return { ok: true, mensaje: 'El túnel ya está en marcha.' };
  }

  const child = spawn(process.execPath, ['scripts/tunnel.js'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  global_.__tunelChild = child;

  let errorTexto = '';
  child.stdout?.on('data', () => {});
  child.stderr?.on('data', (chunk: Buffer) => {
    errorTexto += chunk.toString();
  });
  child.once('exit', () => {
    if (global_.__tunelChild === child) global_.__tunelChild = undefined;
  });

  const abierto = await esperarPuerto(puerto, true);
  if (abierto) return { ok: true, mensaje: `Túnel arrancado en 127.0.0.1:${puerto}.` };

  const detalle = errorTexto.trim() || 'No respondió el puerto local.';
  child.kill('SIGTERM');
  return { ok: false, mensaje: `No se pudo arrancar el túnel. ${detalle}` };
}

/** Cierra el túnel de este panel o el que quedó corriendo en la terminal. */
export async function pararTunelLicencia(): Promise<EstadoTunel> {
  const puerto = puertoLocal();
  if (!(await puertoAbierto(puerto))) {
    await cerrarPropio();
    return { ok: true, mensaje: 'El túnel ya estaba detenido.' };
  }

  await cerrarPropio();
  if (!(await puertoAbierto(puerto))) {
    return { ok: true, mensaje: 'Túnel detenido.' };
  }

  const pid = await pidEnPuerto(puerto);
  if (!pid) return { ok: false, mensaje: 'El puerto sigue ocupado y no encontré el proceso.' };
  if (pid === process.pid) {
    return { ok: false, mensaje: 'El túnel está dentro del panel y no se pudo cerrar.' };
  }

  const comando = await comandoDe(pid);
  if (!esProcesoDelTunel(comando)) {
    return {
      ok: false,
      mensaje: 'Hay otro programa en el puerto del túnel. No lo cerré.',
    };
  }

  try {
    process.kill(pid, 'SIGTERM');
  } catch (error) {
    const codigo = error instanceof Error && 'code' in error ? String(error.code) : '';
    if (codigo !== 'ESRCH') {
      return { ok: false, mensaje: 'No se pudo detener el túnel de la terminal.' };
    }
  }
  const cerrado = await esperarPuerto(puerto, false);
  if (!cerrado) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Ya terminó.
    }
    await esperarPuerto(puerto, false);
  }

  if (await puertoAbierto(puerto)) {
    return { ok: false, mensaje: 'No se pudo detener el túnel.' };
  }
  return { ok: true, mensaje: 'Túnel detenido.' };
}
