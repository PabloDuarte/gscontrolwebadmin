import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ConfirmSubmit } from '@/components/confirm-submit';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { descifrar } from '@/lib/crypto';
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
import { obtenerConexionLicenciamiento, sugerirBase } from '@/lib/licenciamiento';
import { calcularVigencia, esSuscripcionVigente } from '@/lib/suscripciones';
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
  const enCurso = suscripciones.find((s) => esSuscripcionVigente(s)) ?? null;
  const historial = suscripciones.filter((s) => !enCurso || s.id !== enCurso.id);
  const ultima = enCurso ? null : (suscripciones[0] ?? null);
  const nombrePlan = (s: (typeof suscripciones)[number]) =>
    s.planNombre || planes.find((p) => p.id === s.planId)?.nombre || String(s.planId);
  const vigencia = enCurso ? calcularVigencia(enCurso.fechaFin, enCurso.estado) : null;
  let passwordConexion = '';
  if (conexion) {
    try {
      passwordConexion = descifrar(conexion.passwordCifrado);
    } catch {
      passwordConexion = '';
    }
  }

  const lic = conexion ? null : await obtenerConexionLicenciamiento();
  const conexionVisible = conexion
    ? {
        nombreBd: conexion.nombreBd,
        host: conexion.host,
        puerto: conexion.puerto,
        usuario: conexion.usuario,
        password: passwordConexion,
        verificadaEn: conexion.verificadaEn,
        guardada: true,
      }
    : {
        nombreBd: sugerirBase(empresa.nombreComercial, lic?.bases ?? []),
        host: lic?.dbHost ?? '127.0.0.1',
        puerto: lic?.dbPuerto ?? 3306,
        usuario: lic?.dbUsuario ?? '',
        password: lic?.dbPassword ?? '',
        verificadaEn: null,
        guardada: false,
      };

  return (
    <>
      <PageHeader
        titulo={empresa.nombreComercial}
        descripcion={[
          empresa.rfc,
          enCurso ? `Plan ${nombrePlan(enCurso)} hasta ${formatearFecha(enCurso.fechaFin)}` : null,
          conexionVisible.nombreBd
            ? `Base ${conexionVisible.nombreBd} · ${conexionVisible.usuario}@${conexionVisible.host}:${conexionVisible.puerto}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        acciones={
          <Badge tono={TONO_EMPRESA[empresa.estado as EstadoEmpresa]}>
            {capitalizar(empresa.estado)}
          </Badge>
        }
      />

      <EmpresaForm
        empresa={{ ...empresa, rfc: empresa.rfc ?? '' }}
        conexion={conexionVisible}
      />

      <Card>
        <CardHeader>
          <CardTitle>Suscripción</CardTitle>
          <CardDescription>
            {enCurso && vigencia
              ? `${vigencia.etiqueta}. Vigente hasta ${formatearFecha(enCurso.fechaFin)}. No se edita; al vencer se cierra y podrás crear el siguiente ciclo.`
              : ultima
                ? 'La suscripción anterior ya no está vigente. Elige un plan y captura el precio del siguiente ciclo.'
                : 'Primera suscripción de esta empresa. La prueba solo está disponible en este alta.'}
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
                <ConfirmSubmit mensaje="¿Cancelar esta suscripción vigente? Quedará en el historial y podrás crear un ciclo nuevo.">
                  Cancelar suscripción
                </ConfirmSubmit>
              </form>
            </div>
          ) : (
            <SuscripcionForm
              key={empresa.id}
              empresaId={empresa.id}
              permitePrueba={suscripciones.length === 0}
              planes={planes.map((p) => ({
                id: p.id,
                nombre: p.nombre,
                precio: p.precio,
                moneda: p.moneda,
                periodicidad: p.periodicidad as Periodicidad,
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
