/** Valor visual del campo de contraseña de conexión: no es la real y no se guarda. */
export const PASSWORD_ENMASCARADA = '••••••••';

export const ESTADOS_EMPRESA = ['activo', 'prueba', 'suspendido', 'cancelado'] as const;
export type EstadoEmpresa = (typeof ESTADOS_EMPRESA)[number];

export const ESTADOS_VERIFICACION_BD = ['verificada', 'no_existe'] as const;
export type EstadoVerificacionBd = (typeof ESTADOS_VERIFICACION_BD)[number];

export const ESTADOS_SUSCRIPCION = ['prueba', 'activa', 'vencida', 'cancelada'] as const;
export type EstadoSuscripcion = (typeof ESTADOS_SUSCRIPCION)[number];

export const PERIODICIDADES = ['mensual', 'trimestral', 'semestral', 'anual'] as const;
export type Periodicidad = (typeof PERIODICIDADES)[number];

type Tono = 'neutro' | 'exito' | 'aviso' | 'peligro' | 'info';

export const TONO_EMPRESA: Record<EstadoEmpresa, Tono> = {
  activo: 'exito',
  prueba: 'info',
  suspendido: 'aviso',
  cancelado: 'peligro',
};

export const TONO_SUSCRIPCION: Record<EstadoSuscripcion, Tono> = {
  prueba: 'info',
  activa: 'exito',
  vencida: 'peligro',
  cancelada: 'neutro',
};

export const ETIQUETA_PERIODICIDAD: Record<Periodicidad, string> = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

/** Primera letra en mayuscula, para mostrar los valores del enum tal cual se guardan. */
export function capitalizar(valor: string) {
  return valor.charAt(0).toUpperCase() + valor.slice(1);
}
