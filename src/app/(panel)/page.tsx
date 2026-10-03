import Link from 'next/link';
import { AlertTriangle, Building2, CalendarClock, Plus } from 'lucide-react';
import { LogoEmpresa } from '@/components/brand-logo';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listarEmpresas } from '@/lib/consultas';
import { TONO_EMPRESA, capitalizar, type EstadoEmpresa } from '@/lib/dominio';
import { calcularVigencia, resumirAlertas } from '@/lib/suscripciones';
import { cn, formatearFecha } from '@/lib/utils';

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
    { etiqueta: 'En 7 días', valor: alertas.en7, tono: 'peligro' as const },
    { etiqueta: 'En 15 días', valor: alertas.en15, tono: 'aviso' as const },
    { etiqueta: 'En 30 días', valor: alertas.en30, tono: 'aviso' as const },
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

      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-7">
          <CardHeader className="p-8 pb-4">
            <CardDescription className="flex items-center gap-2">
              <Building2 className="size-4" />
              Empresas registradas
            </CardDescription>
            <CardTitle className="text-6xl font-semibold tracking-tight tabular-nums">
              {filas.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between px-8 pb-8">
            <div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="size-4" />
                Suscripciones vigentes
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                {alertas.vigentes}
              </p>
            </div>
            <Link
              href="/empresas"
              className="text-sm font-medium text-primary transition-opacity hover:opacity-70"
            >
              Ver empresas
            </Link>
          </CardContent>
        </Card>

        <div className="grid auto-rows-fr grid-cols-2 gap-4 md:col-span-5">
          {tarjetas.map((t) => (
            <Card key={t.etiqueta} className="h-full">
              <CardHeader className="p-6">
                <CardDescription>{t.etiqueta}</CardDescription>
                <CardTitle
                  className={cn(
                    'text-4xl font-semibold tracking-tight tabular-nums',
                    t.valor > 0 && t.tono === 'peligro' && 'text-red-600 dark:text-red-400',
                    t.valor > 0 && t.tono === 'aviso' && 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  {t.valor}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Alertas de vencimiento
            </CardTitle>
            <CardDescription>
              Suscripciones vencidas o que vencen en los próximos 30 días.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {atencion.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {filas.length === 0
                  ? 'Todavía no hay empresas. Da de alta la primera para comenzar.'
                  : 'Ninguna suscripción está por vencer.'}
              </p>
              {filas.length === 0 ? (
                <Link href="/empresas/nueva" className={`${buttonVariants()} mt-5`}>
                  <Plus />
                  Dar de alta la primera
                </Link>
              ) : null}
            </div>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {atencion.map(({ empresa, suscripcion, plan }) => {
                const vigencia = calcularVigencia(suscripcion!.fechaFin, suscripcion!.estado);
                return (
                  <li key={empresa.id}>
                    <Link
                      href={`/empresas/${empresa.id}`}
                      className="flex items-center gap-4 rounded-2xl px-2 py-4 transition-all duration-200 ease-apple hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    >
                      <LogoEmpresa src={empresa.logoPath} alt={empresa.nombreComercial} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{empresa.nombreComercial}</p>
                        <p className="text-sm text-muted-foreground">
                          {suscripcion!.planNombre || plan?.nombre || 'Sin plan'}
                        </p>
                      </div>
                      <div className="hidden items-center gap-2 sm:flex">
                        <Badge tono={TONO_EMPRESA[empresa.estado as EstadoEmpresa]}>
                          {capitalizar(empresa.estado)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <Badge tono={vigencia.tono}>{vigencia.etiqueta}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatearFecha(suscripcion!.fechaFin)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
