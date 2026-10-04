import {
  boolean,
  char,
  date,
  index,
  integer,
  numeric,
  customType,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  ESTADOS_EMPRESA,
  ESTADOS_SUSCRIPCION,
  PERIODICIDADES,
} from '../dominio';

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
  fromDriver(value: unknown): Buffer {
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value);
    throw new Error('logo_bytes no legible');
  },
});

export const estadoEmpresaEnum = pgEnum('estado_empresa', ESTADOS_EMPRESA);
export const estadoSuscripcionEnum = pgEnum('estado_suscripcion', ESTADOS_SUSCRIPCION);
export const periodicidadEnum = pgEnum('periodicidad', PERIODICIDADES);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
};

/** Cuentas de INTECONAYC. Se crean desde el seed, no hay alta publica. */
export const usuariosAdmin = pgTable('usuarios_admin', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 190 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  activo: boolean('activo').notNull().default(true),
  ultimoAcceso: timestamp('ultimo_acceso', { withTimezone: true, mode: 'date' }),
  tokenRecuperacion: varchar('token_recuperacion', { length: 64 }),
  tokenExpira: timestamp('token_expira', { withTimezone: true, mode: 'date' }),
  ...timestamps,
});

/** Tenant raíz: la llave `id` es la que irá en `empresa_id` del producto. */
export const empresas = pgTable(
  'empresas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    codigo: varchar('codigo', { length: 40 }).notNull().unique(),
    nombreComercial: varchar('nombre_comercial', { length: 150 }).notNull(),
    razonSocial: varchar('razon_social', { length: 200 }),
    rfc: varchar('rfc', { length: 13 }).notNull().unique(),
    contactoNombre: varchar('contacto_nombre', { length: 150 }),
    contactoEmail: varchar('contacto_email', { length: 190 }),
    contactoTelefono: varchar('contacto_telefono', { length: 40 }),
    estado: estadoEmpresaEnum('estado').notNull().default('activo'),
    fechaAlta: date('fecha_alta', { mode: 'string' }).notNull(),
    logoPath: varchar('logo_path', { length: 255 }),
    logoMime: varchar('logo_mime', { length: 40 }),
    logoBytes: bytea('logo_bytes'),
    notas: text('notas'),
    ...timestamps,
  },
  (t) => [index('idx_empresas_estado').on(t.estado)],
);

export const planes = pgTable('planes', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigo: varchar('codigo', { length: 40 }).notNull().unique(),
  nombre: varchar('nombre', { length: 120 }).notNull(),
  descripcion: text('descripcion'),
  precio: numeric('precio', { precision: 10, scale: 2 }).notNull().default('0.00'),
  moneda: char('moneda', { length: 3 }).notNull().default('MXN'),
  periodicidad: periodicidadEnum('periodicidad').notNull().default('mensual'),
  maxEmpleados: integer('max_empleados'),
  maxDispositivos: integer('max_dispositivos'),
  maxUsuarios: integer('max_usuarios'),
  /** Si es true, la primera suscripción con este plan se guarda en estado prueba. */
  esPrueba: boolean('es_prueba').notNull().default(false),
  activo: boolean('activo').notNull().default(true),
  ...timestamps,
});

export const suscripciones = pgTable(
  'suscripciones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    empresaId: uuid('empresa_id')
      .notNull()
      .references(() => empresas.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => planes.id),
    planNombre: varchar('plan_nombre', { length: 120 }).notNull().default(''),
    planCodigo: varchar('plan_codigo', { length: 40 }),
    estado: estadoSuscripcionEnum('estado').notNull().default('activa'),
    fechaInicio: date('fecha_inicio', { mode: 'string' }).notNull(),
    fechaFin: date('fecha_fin', { mode: 'string' }).notNull(),
    precio: numeric('precio', { precision: 10, scale: 2 }).notNull().default('0.00'),
    moneda: char('moneda', { length: 3 }).notNull().default('MXN'),
    periodicidad: periodicidadEnum('periodicidad').notNull().default('mensual'),
    renovacionAutomatica: boolean('renovacion_automatica').notNull().default(false),
    notas: text('notas'),
    ...timestamps,
  },
  (t) => [
    index('idx_suscripciones_empresa').on(t.empresaId),
    index('idx_suscripciones_fin').on(t.fechaFin),
  ],
);

export type Empresa = typeof empresas.$inferSelect;
export type Plan = typeof planes.$inferSelect;
export type Suscripcion = typeof suscripciones.$inferSelect;
export type UsuarioAdmin = typeof usuariosAdmin.$inferSelect;
