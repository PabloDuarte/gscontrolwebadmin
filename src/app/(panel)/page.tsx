import Link from 'next/link';
import { AlertTriangle, Building2, CalendarClock, Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyRow, TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { listarEmpresas } from '@/lib/consultas';
import { TONO_EMPRESA, capitalizar, type EstadoEmpresa } from '@/lib/dominio';
import { calcularVigencia, resumirAlertas } from '@/lib/suscripciones';
import { formatearFecha } from '@/lib/utils';

export default async function TableroPage() {
  const filas = await listarEmpresas();
  const alertas = resumirAlertas(
    filas
      .filter((f) => f.suscripcion)
      .map((f) => ({ fechaFin: f.suscripcion!.fechaFin, estado: f.suscripcion!.estado })),
  );

  const atencion = filas
    .filter((f) => {
      if (!f.suscripcion || f.suscripcion.estado === 'cancelada') return false;
      const v = calcularVigencia(f.suscripcion.fechaFin, f.suscripcion.estado);
      return v.nivel === 'vencida' || v.nivel === 'critica' || v.nivel === 'proxima';
    })
    .sort((a, b) => a.suscripcion!.fechaFin.localeCompare(b.suscripcion!.fechaFin));

  const tarjetas = [
    { etiqueta: 'Vencidas', valor: alertas.vencidas, tono: 'peligro' as const },
    { etiqueta: 'Vencen en 7 días', valor: alertas.en7, tono: 'peligro' as const },
    { etiqueta: 'Vencen en 15 días', valor: alertas.en15, tono: 'aviso' as const },
    { etiqueta: 'Vencen en 30 días', valor: alertas.en30, tono: 'aviso' as const },
  ];

  return (
    <>
      <PageHeader
        titulo="Tablero"
        descripcion="Resumen de clientes y suscripciones que requieren atención."
        acciones={
          <Link href="/empresas/nueva" className={buttonVariants()}>
            <Plus />
            Nueva empresa
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <Card key={t.etiqueta}>
            <CardHeader>
              <CardDescription>{t.etiqueta}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{t.valor}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Building2 className="size-4" />
              Empresas registradas
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{filas.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <CalendarClock className="size-4" />
              Suscripciones vigentes
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{alertas.vigentes}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Alertas de vencimiento
          </CardTitle>
          <CardDescription>
            Suscripciones vencidas o que vencen en los próximos 30 días.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Empresa</TH>
                <TH>Estado</TH>
                <TH>Plan</TH>
                <TH>Vigencia</TH>
              </TR>
            </THead>
            <TBody>
              {atencion.length === 0 ? (
                <EmptyRow colSpan={4}>
                  <p className="text-sm text-muted-foreground">
                    {filas.length === 0
                      ? 'Todavía no hay empresas. Da de alta la primera para comenzar.'
                      : 'Ninguna suscripción está por vencer.'}
                  </p>
                  {filas.length === 0 ? (
                    <Link href="/empresas/nueva" className={`${buttonVariants()} mt-4`}>
                      <Plus />
                      Dar de alta la primera
                    </Link>
                  ) : null}
                </EmptyRow>
              ) : (
                atencion.map(({ empresa, suscripcion, plan }) => {
                  const vigencia = calcularVigencia(suscripcion!.fechaFin, suscripcion!.estado);
                  return (
                    <TR key={empresa.id}>
                      <TD>
                        <Link
                          href={`/empresas/${empresa.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {empresa.nombreComercial}
                        </Link>
                      </TD>
                      <TD>
                        <Badge tono={TONO_EMPRESA[empresa.estado as EstadoEmpresa]}>
                          {capitalizar(empresa.estado)}
                        </Badge>
                      </TD>
                      <TD className="text-muted-foreground">{plan?.nombre ?? '—'}</TD>
                      <TD>
                        <Badge tono={vigencia.tono}>{vigencia.etiqueta}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatearFecha(suscripcion!.fechaFin)}
                        </p>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
