'use client';

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Eye, EyeOff, PlugZap, XCircle } from 'lucide-react';
import { LogoEmpresa } from '@/components/brand-logo';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateSelect, Field, Input, Select, Textarea } from '@/components/ui/field';
import {
  ESTADOS_EMPRESA,
  PASSWORD_ENMASCARADA,
  capitalizar,
  type EstadoVerificacionBd,
} from '@/lib/dominio';
import { parsearTelefono } from '@/lib/empresa';
import { formatearFecha } from '@/lib/utils';
import {
  guardarEmpresa,
  probarConexionDesdeFormulario,
  type EstadoFormulario,
} from './actions';

/** Datos de conexion. La contraseña se descifra en el servidor para poder verla. */
export type ConexionVisible = {
  nombreBd: string;
  host: string;
  puerto: number;
  usuario: string;
  password?: string;
  verificadaEn?: string | Date | null;
  estadoVerificacion?: EstadoVerificacionBd | null;
  /** False cuando los datos salen de la conexión de licenciamiento y aún no se guardan en la ficha. */
  guardada?: boolean;
};

export type EmpresaVisible = {
  id: number;
  codigo: string;
  nombreComercial: string;
  razonSocial: string | null;
  rfc: string | null;
  contactoNombre: string | null;
  contactoEmail: string | null;
  contactoTelefono: string | null;
  estado: string;
  fechaAlta: string;
  logoPath: string | null;
  notas: string | null;
};

type Campos = Record<string, string>;

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar'}
    </Button>
  );
}

function camposIniciales(
  empresa: EmpresaVisible | undefined,
  conexion: ConexionVisible | null | undefined,
): Campos {
  const hoy = new Date().toISOString().slice(0, 10);
  const telefono = parsearTelefono(empresa?.contactoTelefono);
  return {
    nombreComercial: (empresa?.nombreComercial ?? '').toUpperCase(),
    rfc: (empresa?.rfc ?? '').toUpperCase(),
    razonSocial: (empresa?.razonSocial ?? '').toUpperCase(),
    estado: empresa?.estado ?? 'activo',
    fechaAlta: empresa?.fechaAlta ?? hoy,
    contactoNombre: empresa?.contactoNombre ?? '',
    contactoEmail: empresa?.contactoEmail ?? '',
    telefonoPais: telefono.pais,
    telefonoArea: telefono.area,
    telefonoNumero: telefono.numero,
    notas: empresa?.notas ?? '',
    nombreBd: (conexion?.nombreBd ?? '').toUpperCase(),
    usuario: conexion?.usuario ?? '',
    host: conexion?.host ?? '127.0.0.1',
    puerto: String(conexion?.puerto ?? 3306),
    password: conexion?.password || (conexion ? PASSWORD_ENMASCARADA : ''),
  };
}

export function EmpresaForm({
  empresa,
  conexion,
}: {
  empresa?: EmpresaVisible;
  conexion?: ConexionVisible | null;
}) {
  const logoRef = useRef<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(empresa?.logoPath ?? null);
  const [campos, setCampos] = useState<Campos>(() => camposIniciales(empresa, conexion));
  const [verPassword, setVerPassword] = useState(true);

  const [estado, accion] = useActionState<EstadoFormulario | undefined, FormData>(
    async (previo, datos) => {
      const logoEnForm = datos.get('logo');
      const logoVacio = !(logoEnForm instanceof File) || logoEnForm.size === 0;
      if (logoRef.current && logoVacio) {
        datos.set('logo', logoRef.current);
      }
      return guardarEmpresa(previo, datos);
    },
    undefined,
  );
  const [estadoPrueba, accionPrueba] = useActionState<EstadoFormulario | undefined, FormData>(
    probarConexionDesdeFormulario,
    undefined,
  );

  const error = (campo: string) => estado?.errores?.[campo] ?? estadoPrueba?.errores?.[campo];
  const esEdicion = Boolean(empresa);

  const setCampo =
    (nombre: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setCampos((prev) => ({ ...prev, [nombre]: e.target.value }));
    };
  const setCampoMayus =
    (nombre: string) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setCampos((prev) => ({ ...prev, [nombre]: e.target.value.toUpperCase() }));
    };

  useEffect(() => {
    if (!estado?.errores) return;
    const primero = Object.keys(estado.errores)[0];
    if (!primero) return;
    const el = document.getElementById(primero);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in el) (el as HTMLElement).focus();
    }
  }, [estado?.errores]);

  // Tras un error, React puede resetear inputs no controlados; rehidratar desde el servidor
  // sin tocar los campos válidos ya en memoria (solo sincroniza lo que vino en valores).
  useEffect(() => {
    if (!estado?.valores) return;
    setCampos((prev) => ({ ...prev, ...estado.valores }));
  }, [estado?.valores]);

  return (
    <form action={accion} className="space-y-6">
      {empresa ? <input type="hidden" name="id" value={empresa.id} /> : null}
      {empresa ? <input type="hidden" name="empresaId" value={empresa.id} /> : null}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Datos de la empresa</CardTitle>
            <CardDescription>
              Particulares del cliente. El RFC / ID fiscal es el identificador único.
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Guardar />
            <Link href="/empresas" className={buttonVariants({ variant: 'ghost' })}>
              Cancelar
            </Link>
          </div>
        </CardHeader>
        {estado?.mensaje && !estado.ok ? (
          <p className="mx-6 mb-4 flex items-center gap-2 rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {estado.mensaje}
          </p>
        ) : null}
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre comercial" htmlFor="nombreComercial" error={error('nombreComercial')}>
            <Input
              id="nombreComercial"
              name="nombreComercial"
              value={campos.nombreComercial}
              onChange={setCampoMayus('nombreComercial')}
              className="uppercase"
              required
            />
          </Field>

          <Field
            label="RFC / ID fiscal"
            htmlFor="rfc"
            error={error('rfc')}
            hint="Identificador único del cliente. No se puede repetir."
          >
            <Input
              id="rfc"
              name="rfc"
              value={campos.rfc}
              onChange={setCampoMayus('rfc')}
              required
              maxLength={13}
              className="uppercase"
            />
          </Field>

          <Field label="Razón social" htmlFor="razonSocial" error={error('razonSocial')}>
            <Input
              id="razonSocial"
              name="razonSocial"
              value={campos.razonSocial}
              onChange={setCampoMayus('razonSocial')}
              className="uppercase"
            />
          </Field>

          <Field label="Estado" htmlFor="estado" error={error('estado')}>
            <Select
              id="estado"
              name="estado"
              value={campos.estado}
              onChange={setCampo('estado')}
            >
              {ESTADOS_EMPRESA.map((e) => (
                <option key={e} value={e}>
                  {capitalizar(e)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Fecha de alta" htmlFor="fechaAlta" error={error('fechaAlta')}>
            <DateSelect
              id="fechaAlta"
              name="fechaAlta"
              value={campos.fechaAlta}
              onChange={(fechaAlta) => setCampos((prev) => ({ ...prev, fechaAlta }))}
              required
            />
          </Field>

          <Field label="Contacto" htmlFor="contactoNombre" error={error('contactoNombre')}>
            <Input
              id="contactoNombre"
              name="contactoNombre"
              value={campos.contactoNombre}
              onChange={setCampo('contactoNombre')}
            />
          </Field>

          <Field label="Correo de contacto" htmlFor="contactoEmail" error={error('contactoEmail')}>
            <Input
              id="contactoEmail"
              name="contactoEmail"
              type="email"
              value={campos.contactoEmail}
              onChange={setCampo('contactoEmail')}
            />
          </Field>

          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium">Teléfono</p>
            <div className="grid grid-cols-[5rem_5rem_1fr] gap-2">
              <Field label="País" htmlFor="telefonoPais" error={error('telefonoPais')}>
                <Input
                  id="telefonoPais"
                  name="telefonoPais"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="52"
                  value={campos.telefonoPais}
                  onChange={setCampo('telefonoPais')}
                />
              </Field>
              <Field label="Área" htmlFor="telefonoArea" error={error('telefonoArea')}>
                <Input
                  id="telefonoArea"
                  name="telefonoArea"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="33"
                  value={campos.telefonoArea}
                  onChange={setCampo('telefonoArea')}
                />
              </Field>
              <Field label="Número" htmlFor="telefonoNumero" error={error('telefonoNumero')}>
                <Input
                  id="telefonoNumero"
                  name="telefonoNumero"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="12345678"
                  value={campos.telefonoNumero}
                  onChange={setCampo('telefonoNumero')}
                />
              </Field>
            </div>
          </div>

          <Field
            label="Logo"
            htmlFor="logo"
            className="sm:col-span-2"
            error={error('logo')}
            hint="Wordmark rectangular, como el de Intecontrol. PNG, JPG, WEBP o SVG, máximo 2 MB."
          >
            <div className="flex items-center gap-3">
              <LogoEmpresa
                src={vistaPrevia}
                alt={campos.nombreComercial || empresa?.nombreComercial || 'Logo'}
                tamano="lg"
              />
              <Input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="h-auto py-2"
                onChange={(e) => {
                  const archivo = e.target.files?.[0] ?? null;
                  logoRef.current = archivo;
                  setVistaPrevia(
                    archivo ? URL.createObjectURL(archivo) : (empresa?.logoPath ?? null),
                  );
                }}
              />
            </div>
          </Field>

          <Field label="Notas" htmlFor="notas" className="sm:col-span-2" error={error('notas')}>
            <Textarea
              id="notas"
              name="notas"
              value={campos.notas}
              onChange={setCampo('notas')}
            />
          </Field>
        </CardContent>
      </Card>

      {esEdicion ? (
        <Card>
          <CardHeader>
            <CardTitle>Base de datos de la empresa</CardTitle>
            <CardDescription>
              {conexion?.guardada === false
                ? 'Tomados de la conexión de licenciamiento y de la base que ya existe en el servidor. La prueba usa el túnel que está corriendo en la terminal.'
                : conexion
                  ? `Guardada: ${conexion.nombreBd} · ${conexion.usuario}@${conexion.host}:${conexion.puerto}. La prueba usa el túnel de licenciamiento.`
                  : 'Conexión directa a MySQL. La prueba usa el túnel de licenciamiento que está corriendo en la terminal.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre de la base" htmlFor="nombreBd" error={error('nombreBd')}>
                  <Input
                    id="nombreBd"
                    name="nombreBd"
                    value={campos.nombreBd}
                    onChange={setCampoMayus('nombreBd')}
                    className="uppercase"
                  />
                </Field>

                <Field label="Usuario" htmlFor="usuario" error={error('usuario')}>
                  <Input
                    id="usuario"
                    name="usuario"
                    value={campos.usuario}
                    onChange={setCampo('usuario')}
                  />
                </Field>

                <Field label="Host" htmlFor="host" error={error('host')}>
                  <Input id="host" name="host" value={campos.host} onChange={setCampo('host')} />
                </Field>

                <Field label="Puerto" htmlFor="puerto" error={error('puerto')}>
                  <Input
                    id="puerto"
                    name="puerto"
                    type="number"
                    value={campos.puerto}
                    onChange={setCampo('puerto')}
                  />
                </Field>

                <Field
                  label="Contraseña"
                  htmlFor="password"
                  error={error('password')}
                  hint="Visible para revisarla. El ojo la oculta."
                  className="sm:col-span-2"
                >
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={verPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={campos.password}
                      onChange={setCampo('password')}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setVerPassword((v) => !v)}
                      aria-label={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {verPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </Field>

                <div className="flex flex-wrap items-center gap-3 border-t border-black/5 pt-4 sm:col-span-2 dark:border-white/10">
                  <Button
                    type="submit"
                    formAction={accionPrueba}
                    formNoValidate
                    variant="outline"
                    size="sm"
                  >
                    <PlugZap />
                    Probar conexión
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {conexion?.estadoVerificacion === 'verificada' && conexion.verificadaEn
                      ? `Verificada el ${formatearFecha(conexion.verificadaEn)}.`
                      : conexion?.estadoVerificacion === 'no_existe' && conexion.verificadaEn
                        ? `No existe. Última prueba el ${formatearFecha(conexion.verificadaEn)}.`
                        : 'Puedes probar los parámetros antes de guardar.'}
                  </p>
                  {estadoPrueba?.mensaje ? (
                    <p
                      className={`flex items-center gap-1.5 text-sm ${
                        estadoPrueba.ok
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-destructive'
                      }`}
                    >
                      {estadoPrueba.ok ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <XCircle className="size-4" />
                      )}
                      {estadoPrueba.mensaje}
                    </p>
                  ) : null}
                </div>
              </div>
          </CardContent>
        </Card>
      ) : null}

    </form>
  );
}
