'use client';

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, PlugZap, XCircle } from 'lucide-react';
import { LogoEmpresa } from '@/components/brand-logo';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { ESTADOS_EMPRESA, PASSWORD_ENMASCARADA, capitalizar } from '@/lib/dominio';
import { parsearTelefono } from '@/lib/empresa';
import { formatearFecha } from '@/lib/utils';
import {
  guardarEmpresa,
  probarConexionDesdeFormulario,
  type EstadoFormulario,
} from './actions';

/** Datos de conexion sin la contrasena, que nunca sale del servidor. */
export type ConexionVisible = {
  nombreBd: string;
  host: string;
  puerto: number;
  usuario: string;
  usaTunelSsh: boolean;
  sshHost: string | null;
  sshPuerto: number | null;
  sshUsuario: string | null;
  sshKeyPath: string | null;
  verificadaEn?: string | Date | null;
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
    nombreComercial: empresa?.nombreComercial ?? '',
    rfc: empresa?.rfc ?? '',
    razonSocial: empresa?.razonSocial ?? '',
    estado: empresa?.estado ?? 'prospecto',
    fechaAlta: empresa?.fechaAlta ?? hoy,
    contactoNombre: empresa?.contactoNombre ?? '',
    contactoEmail: empresa?.contactoEmail ?? '',
    telefonoPais: telefono.pais,
    telefonoArea: telefono.area,
    telefonoNumero: telefono.numero,
    notas: empresa?.notas ?? '',
    nombreBd: conexion?.nombreBd ?? '',
    usuario: conexion?.usuario ?? '',
    host: conexion?.host ?? '127.0.0.1',
    puerto: String(conexion?.puerto ?? 3306),
    password: conexion ? PASSWORD_ENMASCARADA : '',
    sshHost: conexion?.sshHost ?? '',
    sshPuerto: String(conexion?.sshPuerto ?? 22),
    sshUsuario: conexion?.sshUsuario ?? '',
    sshKeyPath: conexion?.sshKeyPath ?? '',
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
  const [configurarConexion, setConfigurarConexion] = useState(() => Boolean(conexion));
  const [usaTunel, setUsaTunel] = useState(() => conexion?.usaTunelSsh ?? false);

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
    setConfigurarConexion(estado.valores.configurarConexion === 'on');
    setUsaTunel(estado.valores.usaTunelSsh === 'on');
  }, [estado?.valores]);

  return (
    <form action={accion} className="space-y-6">
      {empresa ? <input type="hidden" name="id" value={empresa.id} /> : null}
      {empresa ? <input type="hidden" name="empresaId" value={empresa.id} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Datos de la empresa</CardTitle>
          <CardDescription>
            Particulares del cliente. El RFC / ID fiscal es el identificador único.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre comercial" htmlFor="nombreComercial" error={error('nombreComercial')}>
            <Input
              id="nombreComercial"
              name="nombreComercial"
              value={campos.nombreComercial}
              onChange={setCampo('nombreComercial')}
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
              onChange={setCampo('rfc')}
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
              onChange={setCampo('razonSocial')}
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
            <Input
              id="fechaAlta"
              name="fechaAlta"
              type="date"
              value={campos.fechaAlta}
              onChange={setCampo('fechaAlta')}
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
              Parámetros con los que el sistema se conectará a su base. La contraseña se guarda
              cifrada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                name="configurarConexion"
                className="size-4 rounded-md border-input accent-primary"
                checked={configurarConexion}
                onChange={(e) => setConfigurarConexion(e.target.checked)}
                value="on"
              />
              Configurar la conexión a su base de datos
            </label>

            {configurarConexion ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre de la base" htmlFor="nombreBd" error={error('nombreBd')}>
                  <Input
                    id="nombreBd"
                    name="nombreBd"
                    value={campos.nombreBd}
                    onChange={setCampo('nombreBd')}
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
                  hint={
                    conexion
                      ? 'Los puntos son la contraseña guardada. Cámbiala sólo si quieres reemplazarla.'
                      : undefined
                  }
                  className="sm:col-span-2"
                >
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={campos.password}
                    onChange={setCampo('password')}
                  />
                </Field>

                <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    name="usaTunelSsh"
                    className="size-4 rounded-md border-input accent-primary"
                    checked={usaTunel}
                    onChange={(e) => setUsaTunel(e.target.checked)}
                    value="on"
                  />
                  Su base vive en otro servidor y requiere túnel SSH
                </label>

                {usaTunel ? (
                  <>
                    <Field label="Host SSH" htmlFor="sshHost" error={error('sshHost')}>
                      <Input
                        id="sshHost"
                        name="sshHost"
                        value={campos.sshHost}
                        onChange={setCampo('sshHost')}
                      />
                    </Field>
                    <Field label="Puerto SSH" htmlFor="sshPuerto" error={error('sshPuerto')}>
                      <Input
                        id="sshPuerto"
                        name="sshPuerto"
                        type="number"
                        value={campos.sshPuerto}
                        onChange={setCampo('sshPuerto')}
                      />
                    </Field>
                    <Field label="Usuario SSH" htmlFor="sshUsuario" error={error('sshUsuario')}>
                      <Input
                        id="sshUsuario"
                        name="sshUsuario"
                        value={campos.sshUsuario}
                        onChange={setCampo('sshUsuario')}
                      />
                    </Field>
                    <Field label="Ruta de la llave" htmlFor="sshKeyPath" error={error('sshKeyPath')}>
                      <Input
                        id="sshKeyPath"
                        name="sshKeyPath"
                        value={campos.sshKeyPath}
                        onChange={setCampo('sshKeyPath')}
                      />
                    </Field>
                  </>
                ) : null}

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
                    {conexion?.verificadaEn
                      ? `Última prueba exitosa: ${formatearFecha(conexion.verificadaEn)}.`
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
            ) : (
              <p className="text-sm text-muted-foreground">
                Puedes capturarla después, cuando la base de la empresa esté lista.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {estado?.mensaje ? (
        <p
          className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm ${
            estado.ok
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {estado.ok ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          {estado.mensaje}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Guardar />
        <Link href="/empresas" className={buttonVariants({ variant: 'ghost' })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
