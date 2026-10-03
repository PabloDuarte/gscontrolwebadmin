import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { obtenerConexionLicenciamiento } from '@/lib/licenciamiento';
import { ControlesTunel } from './controles';

export default async function ConexionLicenciamientoPage() {
  const lic = await obtenerConexionLicenciamiento();

  return (
    <>
      <PageHeader
        titulo="Conexión de licenciamiento"
        descripcion="Túnel que ya está corriendo en la terminal y el MySQL al que llega. Todas las empresas entran por aquí."
        acciones={
          <Badge tono={!lic.usaTunel || lic.tunelActivo ? 'exito' : 'peligro'}>
            {!lic.usaTunel ? 'Conexión directa' : lic.tunelActivo ? 'Túnel activo' : 'Túnel sin respuesta'}
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Túnel</CardTitle>
          <CardDescription>{lic.mensajeTunel}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ControlesTunel activo={lic.tunelActivo} />
          <Field label="Host SSH" htmlFor="sshHost">
            <Input id="sshHost" defaultValue={lic.sshHost} readOnly />
          </Field>
          <Field label="Puerto SSH" htmlFor="sshPuerto">
            <Input id="sshPuerto" defaultValue={String(lic.sshPuerto)} readOnly />
          </Field>
          <Field label="Usuario SSH" htmlFor="sshUsuario">
            <Input id="sshUsuario" defaultValue={lic.sshUsuario} readOnly />
          </Field>
          <Field label="Túnel local" htmlFor="tunel">
            <Input id="tunel" defaultValue={`${lic.tunelHost}:${lic.tunelPuerto}`} readOnly />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MySQL</CardTitle>
          <CardDescription>
            {`Datos directos del servidor. Desde esta máquina se alcanzan por ${lic.tunelHost}:${lic.tunelPuerto}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Host" htmlFor="dbHost">
            <Input id="dbHost" defaultValue={lic.dbHost} readOnly />
          </Field>
          <Field label="Puerto" htmlFor="dbPuerto">
            <Input id="dbPuerto" defaultValue={String(lic.dbPuerto)} readOnly />
          </Field>
          <Field label="Usuario" htmlFor="dbUsuario">
            <Input id="dbUsuario" defaultValue={lic.dbUsuario} readOnly />
          </Field>
          <Field label="Base de control" htmlFor="baseControl">
            <Input id="baseControl" defaultValue={lic.baseControl} readOnly />
          </Field>
          <Field label="Contraseña" htmlFor="dbPassword" className="sm:col-span-2">
            <Input id="dbPassword" defaultValue={lic.dbPassword} readOnly />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bases en el servidor</CardTitle>
          <CardDescription>
            {lic.bases.length > 0
              ? 'Visibles a través del túnel de licenciamiento.'
              : 'No se pudieron listar porque el túnel no respondió.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lic.bases.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {lic.bases.map((base) => (
                <li
                  key={base}
                  className="rounded-2xl border border-black/5 px-3.5 py-2 text-sm dark:border-white/10"
                >
                  {base}
                  {base === lic.baseControl ? (
                    <span className="ml-2 text-xs text-muted-foreground">control</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
