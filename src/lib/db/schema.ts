import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  date,
  datetime,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import {
  ESTADOS_EMPRESA,
  ESTADOS_SUSCRIPCION,
  PERIODICIDADES,
} from '../dominio';

const creadoEn = timestamp('creado_en').notNull().default(sql`CURRENT_TIMESTAMP`);
const actualizadoEn = timestamp('actualizado_en')
  .notNull()
  .default(sql`CURRENT_TIMESTAMP`)
  .onUpdateNow();

/** Cuentas de INTECONAYC. Se crean desde el seed, no hay alta publica. */
export const usuariosAdmin = mysqlTable('usuarios_admin', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 190 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  activo: boolean('activo').notNull().default(true),
  ultimoAcceso: datetime('ultimo_acceso'),
  creadoEn,
  actualizadoEn,
});

export const empresas = mysqlTable(
  'empresas',
  {
    id: int('id').autoincrement().primaryKey(),
    codigo: varchar('codigo', { length: 40 }).notNull().unique(),
    nombreComercial: varchar('nombre_comercial', { length: 150 }).notNull(),
    razonSocial: varchar('razon_social', { length: 200 }),
    rfc: varchar('rfc', { length: 13 }).notNull().unique(),
    contactoNombre: varchar('contacto_nombre', { length: 150 }),
    contactoEmail: varchar('contacto_email', { length: 190 }),
    contactoTelefono: varchar('contacto_telefono', { length: 40 }),
    estado: mysqlEnum('estado', ESTADOS_EMPRESA).notNull().default('prospecto'),
    fechaAlta: date('fecha_alta', { mode: 'string' }).notNull(),
    logoPath: varchar('logo_path', { length: 255 }),
    notas: text('notas'),
    creadoEn,
    actualizadoEn,
  },
  (t) => [index('idx_empresas_estado').on(t.estado)],
);

/** Como conectarse a la base que usa cada empresa. La contrasena va cifrada. */
export const conexionesBd = mysqlTable('conexiones_bd', {
  id: int('id').autoincrement().primaryKey(),
  empresaId: int('empresa_id')
    .notNull()
    .unique()
    .references(() => empresas.id, { onDelete: 'cascade' }),
  host: varchar('host', { length: 255 }).notNull().default('127.0.0.1'),
  puerto: int('puerto').notNull().default(3306),
  nombreBd: varchar('nombre_bd', { length: 64 }).notNull().unique(),
  usuario: varchar('usuario', { length: 100 }).notNull(),
  passwordCifrado: text('password_cifrado').notNull(),
  usaTunelSsh: boolean('usa_tunel_ssh').notNull().default(false),
  sshHost: varchar('ssh_host', { length: 255 }),
  sshPuerto: int('ssh_puerto').default(22),
  sshUsuario: varchar('ssh_usuario', { length: 100 }),
  sshKeyPath: varchar('ssh_key_path', { length: 255 }),
  verificadaEn: datetime('verificada_en'),
  creadoEn,
  actualizadoEn,
});

export const planes = mysqlTable('planes', {
  id: int('id').autoincrement().primaryKey(),
  codigo: varchar('codigo', { length: 40 }).notNull().unique(),
  nombre: varchar('nombre', { length: 120 }).notNull(),
  descripcion: text('descripcion'),
  precio: decimal('precio', { precision: 10, scale: 2 }).notNull().default('0.00'),
  moneda: char('moneda', { length: 3 }).notNull().default('MXN'),
  periodicidad: mysqlEnum('periodicidad', PERIODICIDADES).notNull().default('mensual'),
  maxEmpleados: int('max_empleados'),
  maxDispositivos: int('max_dispositivos'),
  maxUsuarios: int('max_usuarios'),
  activo: boolean('activo').notNull().default(true),
  creadoEn,
  actualizadoEn,
});

export const suscripciones = mysqlTable(
  'suscripciones',
  {
    id: int('id').autoincrement().primaryKey(),
    empresaId: int('empresa_id')
      .notNull()
      .references(() => empresas.id, { onDelete: 'cascade' }),
    planId: int('plan_id')
      .notNull()
      .references(() => planes.id),
    planNombre: varchar('plan_nombre', { length: 120 }).notNull().default(''),
    planCodigo: varchar('plan_codigo', { length: 40 }),
    estado: mysqlEnum('estado', ESTADOS_SUSCRIPCION).notNull().default('activa'),
    fechaInicio: date('fecha_inicio', { mode: 'string' }).notNull(),
    fechaFin: date('fecha_fin', { mode: 'string' }).notNull(),
    precio: decimal('precio', { precision: 10, scale: 2 }).notNull().default('0.00'),
    moneda: char('moneda', { length: 3 }).notNull().default('MXN'),
    periodicidad: mysqlEnum('periodicidad', PERIODICIDADES).notNull().default('mensual'),
    renovacionAutomatica: boolean('renovacion_automatica').notNull().default(false),
    notas: text('notas'),
    creadoEn,
    actualizadoEn,
  },
  (t) => [
    index('idx_suscripciones_empresa').on(t.empresaId),
    index('idx_suscripciones_fin').on(t.fechaFin),
  ],
);

export type Empresa = typeof empresas.$inferSelect;
export type ConexionBd = typeof conexionesBd.$inferSelect;
export type Plan = typeof planes.$inferSelect;
export type Suscripcion = typeof suscripciones.$inferSelect;
export type UsuarioAdmin = typeof usuariosAdmin.$inferSelect;
