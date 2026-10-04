import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ConfirmSubmit } from '@/components/confirm-submit';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { esUuidEmpresa, obtenerEmpresa } from '@/lib/consultas';
import {
  ETIQUETA_PERIODICIDAD,
  TONO_EMPRESA,
  TONO_SUSCRIPCION,
  capitalizar,
  type EstadoEmpresa,
  type EstadoSuscripcion,
  type Periodicidad,
} from '@/lib/dominio';
import { calcularVigencia, esSuscripcionVigente } from '@/lib/suscripciones';
import { formatearFecha, formatearMoneda } from '@/lib/utils';
import { cancelarSuscripcion, eliminarEmpresa } from '../actions';
import { EmpresaForm } from '../empresa-form';
import { SuscripcionForm } from './suscripcion-form';

export const dynamic = 'force-dynamic';

export default async function EmpresaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  if (!esUuidEmpresa(id)) notFound();

  const datos = await obtenerEmpresa(id);
  if (!datos) notFound();

  const { empresa, suscripciones, planes } = datos;
  const enCurso = suscripciones.find((s) => esSuscripcionVigente(s)) ?? null;
  const historial = suscripciones.filter((s) => !enCurso || s.id !== enCurso.id);
  const ultima = enCurso ? null : (suscripciones[0] ?? null);
  const nombrePlan = (s: (typeof suscripciones)[number]) =>
    s.planNombre || planes.find((p) => p.id === s.planId)?.nombre || String(s.planId);
  const vigencia = enCurso ? calcularVigencia(enCurso.fechaFin, enCurso.estado) : null;

  return (
    <>
      <PageHeader
        titulo={empresa.nombreComercial}
        descripcion={[
          empresa.rfc,
          `empresa_id ${empresa.id}`,
          enCurso ? `Plan ${nombrePlan(enCurso)} hasta ${formatearFecha(enCurso.fechaFin)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        acciones={
          <Badge tono={TONO_EMPRESA[empresa.estado as EstadoEmpresa]}>
            {capitalizar(empresa.estado)}
          </Badge>
        }
      />

      <EmpresaForm key={empresa.id} empresa={{ ...empresa, rfc: empresa.rfc ?? '' }} />

      <Card>
        {enCurso ? (
          <CardHeader className="sticky top-4 z-20 flex-row items-start justify-between gap-4 space-y-0 rounded-3xl bg-white/95 shadow-apple backdrop-blur-xl dark:bg-[#161617]/95">
            <div className="space-y-1.5">
              <CardTitle>Suscripción / Licenciamiento</CardTitle>
              <CardDescription>
                {vigencia
                  ? `${vigencia.etiqueta}. Vigente hasta ${formatearFecha(enCurso.fechaFin)}. El periodo lo marcan inicio y fin.`
                  : null}
              </CardDescription>
            </div>
            <form action={cancelarSuscripcion} className="shrink-0">
              <input type="hidden" name="empresaId" value={empresa.id} />
              <input type="hidden" name="suscripcionId" value={enCurso.id} />
              <ConfirmSubmit mensaje="¿Cancelar esta suscripción vigente? Quedará en el historial y podrás crear un ciclo nuevo.">
                Cancelar suscripción
              </ConfirmSubmit>
            </form>
          </CardHeader>
        ) : null}
        <CardContent>
          {enCurso ? (
            <div className="space-y-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Plan
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{nombrePlan(enCurso)}</dd>
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
                    Referencia de cobro
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
            </div>
          ) : (
            <SuscripcionForm
              key={empresa.id}
              empresaId={empresa.id}
              esPrimeraSuscripcion={suscripciones.length === 0}
              descripcion={
                ultima
                  ? 'La suscripción anterior ya no está vigente. Define inicio y fin. El precio pactado es el precio del plan por los meses de la periodicidad.'
                  : 'Primera suscripción del licenciamiento. Define inicio y fin. Si el plan es de prueba, el estado inicial se marca automáticamente.'
              }
              planes={planes.map((p) => ({
                id: p.id,
                nombre: p.nombre,
                precio: p.precio,
                moneda: p.moneda,
                periodicidad: p.periodicidad as Periodicidad,
                esPrueba: p.esPrueba,
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
                  <TH>Referencia</TH>
                  <TH>Vigencia</TH>
                </TR>
              </THead>
              <TBody>
                {historial.map((s) => {
                  const v = calcularVigencia(s.fechaFin, s.estado);
                  return (
                    <TR key={s.id}>
                      <TD>{nombrePlan(s)}</TD>
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
            También borra sus suscripciones. Esta acción no se puede deshacer.
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
