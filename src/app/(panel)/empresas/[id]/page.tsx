import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ConfirmSubmit } from '@/components/confirm-submit';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { obtenerEmpresa } from '@/lib/consultas';
import {
  ETIQUETA_PERIODICIDAD,
  TONO_EMPRESA,
  TONO_SUSCRIPCION,
  capitalizar,
  type EstadoEmpresa,
  type EstadoSuscripcion,
  type Periodicidad,
} from '@/lib/dominio';
import { calcularVigencia, esSuscripcionEnCurso } from '@/lib/suscripciones';
import { formatearFecha, formatearMoneda } from '@/lib/utils';
import { cancelarSuscripcion, eliminarEmpresa } from '../actions';
import { EmpresaForm } from '../empresa-form';
import { SuscripcionForm } from './suscripcion-form';

export default async function EmpresaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const empresaId = Number(id);
  if (!Number.isInteger(empresaId)) notFound();

  const datos = await obtenerEmpresa(empresaId);
  if (!datos) notFound();

  const { empresa, conexion, suscripciones, planes } = datos;
  const enCurso = suscripciones.find((s) => esSuscripcionEnCurso(s.estado)) ?? null;
  const historial = suscripciones.filter((s) => !enCurso || s.id !== enCurso.id);
  const planEnCurso = enCurso ? planes.find((p) => p.id === enCurso.planId) : null;
  const vigencia = enCurso ? calcularVigencia(enCurso.fechaFin, enCurso.estado) : null;

  return (
    <>
      <PageHeader
        titulo={empresa.nombreComercial}
        descripcion={empresa.rfc ?? ''}
        acciones={
          <Badge tono={TONO_EMPRESA[empresa.estado as EstadoEmpresa]}>
            {capitalizar(empresa.estado)}
          </Badge>
        }
      />

      <EmpresaForm
        empresa={{ ...empresa, rfc: empresa.rfc ?? '' }}
        conexion={
          conexion
            ? {
                nombreBd: conexion.nombreBd,
                host: conexion.host,
                puerto: conexion.puerto,
                usuario: conexion.usuario,
                usaTunelSsh: conexion.usaTunelSsh,
                sshHost: conexion.sshHost,
                sshPuerto: conexion.sshPuerto,
                sshUsuario: conexion.sshUsuario,
                sshKeyPath: conexion.sshKeyPath,
                verificadaEn: conexion.verificadaEn,
              }
            : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Suscripción</CardTitle>
          <CardDescription>
            {enCurso && vigencia
              ? `${vigencia.etiqueta}. Plan vigente hasta ${formatearFecha(enCurso.fechaFin)}. Para cambiar de plan, cancela esta y asigna una nueva.`
              : 'Asigna un plan y una vigencia. Solo puede haber una suscripción activa a la vez.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enCurso ? (
            <div className="space-y-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Plan
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{planEnCurso?.nombre ?? enCurso.planId}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Estado
                  </dt>
                  <dd className="mt-1">
                    <Badge tono={TONO_SUSCRIPCION[enCurso.estado as EstadoSuscripcion]}>
                      {capitalizar(enCurso.estado)}
                    </Badge>
                    {vigencia ? (
                      <Badge tono={vigencia.tono} className="ml-2">
                        {vigencia.etiqueta}
                      </Badge>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Periodo
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatearFecha(enCurso.fechaInicio)} — {formatearFecha(enCurso.fechaFin)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Precio
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatearMoneda(enCurso.precio, enCurso.moneda)} ·{' '}
                    {ETIQUETA_PERIODICIDAD[enCurso.periodicidad as Periodicidad]}
                  </dd>
                </div>
                {enCurso.notas ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Notas
                    </dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{enCurso.notas}</dd>
                  </div>
                ) : null}
              </dl>

              <form action={cancelarSuscripcion}>
                <input type="hidden" name="empresaId" value={empresa.id} />
                <input type="hidden" name="suscripcionId" value={enCurso.id} />
                <ConfirmSubmit mensaje="¿Cancelar esta suscripción? Podrás asignar un plan nuevo después. La cancelada quedará en el historial.">
                  Cancelar suscripción
                </ConfirmSubmit>
              </form>
            </div>
          ) : (
            <SuscripcionForm
              empresaId={empresa.id}
              planes={planes.map((p) => ({
                id: p.id,
                nombre: p.nombre,
                precio: p.precio,
                moneda: p.moneda,
              }))}
            />
          )}
        </CardContent>
      </Card>

      {historial.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
            <CardDescription>Suscripciones anteriores de esta empresa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Plan</TH>
                  <TH>Estado</TH>
                  <TH>Periodo</TH>
                  <TH>Precio</TH>
                  <TH>Vigencia</TH>
                </TR>
              </THead>
              <TBody>
                {historial.map((s) => {
                  const v = calcularVigencia(s.fechaFin, s.estado);
                  const plan = planes.find((p) => p.id === s.planId);
                  return (
                    <TR key={s.id}>
                      <TD>{plan?.nombre ?? s.planId}</TD>
                      <TD>
                        <Badge tono={TONO_SUSCRIPCION[s.estado as EstadoSuscripcion]}>
                          {capitalizar(s.estado)}
                        </Badge>
                      </TD>
                      <TD className="text-muted-foreground">
                        {formatearFecha(s.fechaInicio)} — {formatearFecha(s.fechaFin)}
                      </TD>
                      <TD>{formatearMoneda(s.precio, s.moneda)}</TD>
                      <TD>
                        <Badge tono={v.tono}>{v.etiqueta}</Badge>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle>Eliminar empresa</CardTitle>
          <CardDescription>
            También borra su conexión y sus suscripciones. Esta acción no se puede deshacer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={eliminarEmpresa}>
            <input type="hidden" name="id" value={empresa.id} />
            <ConfirmSubmit mensaje="¿Eliminar esta empresa y todos sus datos de control?">
              Eliminar empresa
            </ConfirmSubmit>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
