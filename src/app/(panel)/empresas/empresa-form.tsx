'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { ESTADOS_EMPRESA, capitalizar } from '@/lib/dominio';
import { guardarEmpresa, type EstadoFormulario } from './actions';

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
  notas: string | null;
};

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar'}
    </Button>
  );
}

export function EmpresaForm({
  empresa,
  conexion,
}: {
  empresa?: EmpresaVisible;
  conexion?: ConexionVisible | null;
}) {
  const [estado, accion] = useActionState<EstadoFormulario | undefined, FormData>(
    guardarEmpresa,
    undefined,
  );
  const [configurarConexion, setConfigurarConexion] = useState(Boolean(conexion));
  const [usaTunel, setUsaTunel] = useState(conexion?.usaTunelSsh ?? false);

  const error = (campo: string) => estado?.errores?.[campo];
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form action={accion} className="space-y-6">
      {empresa ? <input type="hidden" name="id" value={empresa.id} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Datos de la empresa</CardTitle>
          <CardDescription>Identificación y contacto del cliente.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Código"
            htmlFor="codigo"
            error={error('codigo')}
            hint="Identificador corto, por ejemplo: acme"
          >
            <Input id="codigo" name="codigo" defaultValue={empresa?.codigo} required />
          </Field>

          <Field label="Nombre comercial" htmlFor="nombreComercial" error={error('nombreComercial')}>
            <Input
              id="nombreComercial"
              name="nombreComercial"
              defaultValue={empresa?.nombreComercial}
              required
            />
          </Field>

          <Field label="Razón social" htmlFor="razonSocial" error={error('razonSocial')}>
            <Input id="razonSocial" name="razonSocial" defaultValue={empresa?.razonSocial ?? ''} />
          </Field>

          <Field label="RFC" htmlFor="rfc" error={error('rfc')}>
            <Input id="rfc" name="rfc" defaultValue={empresa?.rfc ?? ''} />
          </Field>

          <Field label="Estado" htmlFor="estado" error={error('estado')}>
            <Select id="estado" name="estado" defaultValue={empresa?.estado ?? 'prospecto'}>
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
              defaultValue={empresa?.fechaAlta ?? hoy}
              required
            />
          </Field>

          <Field label="Contacto" htmlFor="contactoNombre" error={error('contactoNombre')}>
            <Input
              id="contactoNombre"
              name="contactoNombre"
              defaultValue={empresa?.contactoNombre ?? ''}
            />
          </Field>

          <Field label="Correo de contacto" htmlFor="contactoEmail" error={error('contactoEmail')}>
            <Input
              id="contactoEmail"
              name="contactoEmail"
              type="email"
              defaultValue={empresa?.contactoEmail ?? ''}
            />
          </Field>

          <Field label="Teléfono" htmlFor="contactoTelefono" error={error('contactoTelefono')}>
            <Input
              id="contactoTelefono"
              name="contactoTelefono"
              defaultValue={empresa?.contactoTelefono ?? ''}
            />
          </Field>

          <Field label="Notas" htmlFor="notas" className="sm:col-span-2" error={error('notas')}>
            <Textarea id="notas" name="notas" defaultValue={empresa?.notas ?? ''} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Base de datos de la empresa</CardTitle>
          <CardDescription>
            Parámetros con los que el sistema se conectará a su base. La contraseña se guarda cifrada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="configurarConexion"
              className="size-4 rounded border-input accent-[hsl(var(--primary))]"
              checked={configurarConexion}
              onChange={(e) => setConfigurarConexion(e.target.checked)}
            />
            Configurar la conexión a su base de datos
          </label>

          {configurarConexion ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre de la base" htmlFor="nombreBd" error={error('nombreBd')}>
                <Input id="nombreBd" name="nombreBd" defaultValue={conexion?.nombreBd ?? ''} />
              </Field>

              <Field label="Usuario" htmlFor="usuario" error={error('usuario')}>
                <Input id="usuario" name="usuario" defaultValue={conexion?.usuario ?? ''} />
              </Field>

              <Field label="Host" htmlFor="host" error={error('host')}>
                <Input id="host" name="host" defaultValue={conexion?.host ?? '127.0.0.1'} />
              </Field>

              <Field label="Puerto" htmlFor="puerto" error={error('puerto')}>
                <Input
                  id="puerto"
                  name="puerto"
                  type="number"
                  defaultValue={conexion?.puerto ?? 3306}
                />
              </Field>

              <Field
                label="Contraseña"
                htmlFor="password"
                error={error('password')}
                hint={conexion ? 'Déjala en blanco para conservar la actual' : undefined}
                className="sm:col-span-2"
              >
                <Input id="password" name="password" type="password" autoComplete="new-password" />
              </Field>

              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="usaTunelSsh"
                  className="size-4 rounded border-input accent-[hsl(var(--primary))]"
                  checked={usaTunel}
                  onChange={(e) => setUsaTunel(e.target.checked)}
                />
                Su base vive en otro servidor y requiere túnel SSH
              </label>

              {usaTunel ? (
                <>
                  <Field label="Host SSH" htmlFor="sshHost" error={error('sshHost')}>
                    <Input id="sshHost" name="sshHost" defaultValue={conexion?.sshHost ?? ''} />
                  </Field>
                  <Field label="Puerto SSH" htmlFor="sshPuerto" error={error('sshPuerto')}>
                    <Input
                      id="sshPuerto"
                      name="sshPuerto"
                      type="number"
                      defaultValue={conexion?.sshPuerto ?? 22}
                    />
                  </Field>
                  <Field label="Usuario SSH" htmlFor="sshUsuario" error={error('sshUsuario')}>
                    <Input
                      id="sshUsuario"
                      name="sshUsuario"
                      defaultValue={conexion?.sshUsuario ?? ''}
                    />
                  </Field>
                  <Field label="Ruta de la llave" htmlFor="sshKeyPath" error={error('sshKeyPath')}>
                    <Input
                      id="sshKeyPath"
                      name="sshKeyPath"
                      defaultValue={conexion?.sshKeyPath ?? ''}
                    />
                  </Field>
                </>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Puedes capturarla después, cuando la base de la empresa esté lista.
            </p>
          )}
        </CardContent>
      </Card>

      {estado?.mensaje ? (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
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
