import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { planes, usuariosAdmin } from '../src/lib/db/schema';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: Number(process.env.LOCAL_TUNNEL_PORT ?? 3307),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.CONTROL_DB_NAME ?? 'gscontrol_clientes',
});

const db = drizzle(pool);

const catalogo = [
  {
    codigo: 'basico',
    nombre: 'Básico',
    descripcion: 'Control de asistencia para equipos pequeños.',
    precio: '990.00',
    moneda: 'MXN' as const,
    periodicidad: 'mensual' as const,
    maxEmpleados: 50,
    maxDispositivos: 2,
    maxUsuarios: 2,
    activo: true,
  },
  {
    codigo: 'profesional',
    nombre: 'Profesional',
    descripcion: 'Incidencias, varios turnos y más dispositivos.',
    precio: '2490.00',
    moneda: 'MXN' as const,
    periodicidad: 'mensual' as const,
    maxEmpleados: 200,
    maxDispositivos: 10,
    maxUsuarios: 10,
    activo: true,
  },
  {
    codigo: 'empresarial',
    nombre: 'Empresarial',
    descripcion: 'Sin tope de empleados, pensado para operación multi-sucursal.',
    precio: '4990.00',
    moneda: 'MXN' as const,
    periodicidad: 'mensual' as const,
    maxEmpleados: null,
    maxDispositivos: null,
    maxUsuarios: null,
    activo: true,
  },
];

const email = (process.env.ADMIN_EMAIL ?? 'pablo.duarte@intecontrol.com').toLowerCase();
const nombre = process.env.ADMIN_NOMBRE ?? 'Pablo Duarte';
const password = process.env.ADMIN_PASSWORD;

if (!password) {
  throw new Error('Define ADMIN_PASSWORD en .env antes de sembrar el administrador.');
}

for (const plan of catalogo) {
  const [existe] = await db.select({ id: planes.id }).from(planes).where(eq(planes.codigo, plan.codigo));
  if (existe) {
    await db.update(planes).set(plan).where(eq(planes.id, existe.id));
    console.log(`Plan ${plan.codigo} actualizado.`);
  } else {
    await db.insert(planes).values(plan);
    console.log(`Plan ${plan.codigo} creado.`);
  }
}

const [admin] = await db
  .select({ id: usuariosAdmin.id })
  .from(usuariosAdmin)
  .where(eq(usuariosAdmin.email, email));

const passwordHash = await bcrypt.hash(password, 12);

if (admin) {
  await db
    .update(usuariosAdmin)
    .set({ nombre, passwordHash, activo: true })
    .where(eq(usuariosAdmin.id, admin.id));
  console.log(`Administrador ${email} actualizado.`);
} else {
  await db.insert(usuariosAdmin).values({ email, nombre, passwordHash, activo: true });
  console.log(`Administrador ${email} creado.`);
}

await pool.end();
