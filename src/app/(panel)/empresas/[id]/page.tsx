import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ConfirmSubmit } from '@/components/confirm-submit';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyRow, TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { obtenerEmpresa } from '@/lib/consultas';
import { TONO_EMPRESA, capitalizar, type EstadoEmpresa } from '@/lib/dominio';
import { calcularVigencia } from '@/lib/suscripciones';
import { formatearFecha, formatearMoneda } from '@/lib/utils';
import { eliminarEmpresa } from '../actions';
import { EmpresaForm } from '../empresa-form';
import { ProbarConexion } from './probar-conexion';
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
  const actual = suscripciones[0] ?? null;
  const vigencia = actual ? calcularVigencia(actual.fechaFin, actual.estado) : null;

  return (
    <>
      <PageHeader
        titulo={empresa.nombreComercial}
        descripcion={empresa.codigo}
        acciones={
          <Badge tono={TONO_EMPRESA[empresa.estado as EstadoEmpresa]}>
            {capitalizar(empresa.estado)}
          </Badge>
        }
      />

      <EmpresaForm
        empresa={empresa}
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
              }
            : null
        }
      />

      {conexion ? (
        <Card>
          <CardHeader>
            <CardTitle>Verificar conexión</CardTitle>
            <CardDescription>
              {conexion.verificadaEn
                ? `Última prueba exitosa: ${formatearFecha(conexion.verificadaEn)}.`
                : 'Aún no se ha comprobado que los parámetros conecten.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProbarConexion empresaId={empresa.id} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Suscripción</CardTitle>
          <CardDescription>
            {vigencia
              ? `${vigencia.etiqueta}. Plan vigente hasta ${formatearFecha(actual!.fechaFin)}.`
              : 'Asigna un plan y una vigencia. El vencimiento alimenta las alertas del tablero.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuscripcionForm
            empresaId={empresa.id}
            planes={planes.map((p) => ({
              id: p.id,
              nombre: p.nombre,
              precio: p.precio,
              moneda: p.moneda,
            }))}
            actual={actual}
          />
        </CardContent>
      </Card>

      {suscripciones.length > 1 ? (
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
                  <TH>Periodo</TH>
                  <TH>Precio</TH>
                  <TH>Vigencia</TH>
                </TR>
              </THead>
              <TBody>
                {suscripciones.slice(1).map((s) => {
                  const v = calcularVigencia(s.fechaFin, s.estado);
                  const plan = planes.find((p) => p.id === s.planId);
                  return (
                    <TR key={s.id}>
                      <TD>{plan?.nombre ?? s.planId}</TD>
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
      ) : suscripciones.length === 0 ? (
        <Table>
          <TBody>
            <EmptyRow colSpan={1}>
              <p className="text-sm text-muted-foreground">Sin historial de suscripciones.</p>
            </EmptyRow>
          </TBody>
        </Table>
      ) : null}

      <form action={eliminarEmpresa} className="border-t pt-6">
        <input type="hidden" name="id" value={empresa.id} />
        <p className="mb-3 text-sm text-muted-foreground">
          Eliminar la empresa también borra su conexión y sus suscripciones.
        </p>
        <ConfirmSubmit mensaje="¿Eliminar esta empresa y todos sus datos de control?">
          Eliminar empresa
        </ConfirmSubmit>
      </form>
    </>
  );
}
