import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { LogoEmpresa } from '@/components/brand-logo';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/field';
import { listarEmpresas } from '@/lib/consultas';
import { ESTADOS_EMPRESA, TONO_EMPRESA, capitalizar, type EstadoEmpresa } from '@/lib/dominio';
import { calcularVigencia } from '@/lib/suscripciones';
import { formatearFecha } from '@/lib/utils';

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q = '', estado = '' } = await searchParams;
  const todas = await listarEmpresas();

  const busqueda = q.trim().toLowerCase();
  const filas = todas.filter(({ empresa }) => {
    const coincideTexto =
      !busqueda ||
      empresa.nombreComercial.toLowerCase().includes(busqueda) ||
      empresa.codigo.toLowerCase().includes(busqueda) ||
      (empresa.razonSocial ?? '').toLowerCase().includes(busqueda);
    const coincideEstado = !estado || empresa.estado === estado;
    return coincideTexto && coincideEstado;
  });

  return (
    <>
      <PageHeader
        titulo="Empresas"
        descripcion="Clientes registrados, su plan y la vigencia de su suscripción."
        acciones={
          <Link href="/empresas/nueva" className={buttonVariants()}>
            <Plus />
            Nueva empresa
          </Link>
        }
      />

      <form className="flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o código…"
          className="h-11 max-w-xs rounded-full"
        />
        <Select name="estado" defaultValue={estado} className="h-11 max-w-[12rem] rounded-full">
          <option value="">Todos los estados</option>
          {ESTADOS_EMPRESA.map((e) => (
            <option key={e} value={e}>
              {capitalizar(e)}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonVariants({ variant: 'outline' })}>
          Filtrar
        </button>
      </form>

      {filas.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="mb-4 size-8 text-muted-foreground" />
          <p className="mb-5 text-sm text-muted-foreground">
            {todas.length === 0
              ? 'Todavía no hay empresas registradas.'
              : 'Ninguna empresa coincide con el filtro.'}
          </p>
          {todas.length === 0 ? (
            <Link href="/empresas/nueva" className={buttonVariants()}>
              <Plus />
              Dar de alta la primera
            </Link>
          ) : null}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filas.map(({ empresa, conexion, suscripcion, plan }) => {
            const vigencia = suscripcion
              ? calcularVigencia(suscripcion.fechaFin, suscripcion.estado)
              : null;

            return (
              <Link
                key={empresa.id}
                href={`/empresas/${empresa.id}`}
                className="group block transition-transform duration-200 ease-apple hover:scale-[1.02] active:scale-[0.98]"
              >
                <Card className="h-full p-6 transition-shadow duration-200 group-hover:shadow-apple-lg">
                  <div className="flex items-start justify-between gap-3">
                    <LogoEmpresa src={empresa.logoPath} alt={empresa.nombreComercial} tamano="md" />
                    <Badge tono={TONO_EMPRESA[empresa.estado as EstadoEmpresa]}>
                      {capitalizar(empresa.estado)}
                    </Badge>
                  </div>
                  <div className="mt-5 space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight">{empresa.nombreComercial}</h2>
                    <p className="text-sm text-muted-foreground">{empresa.codigo}</p>
                  </div>
                  <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{plan?.nombre ?? 'Sin plan'}</p>
                      {vigencia ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatearFecha(suscripcion!.fechaFin)}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">Sin suscripción</p>
                      )}
                    </div>
                    {vigencia ? <Badge tono={vigencia.tono}>{vigencia.etiqueta}</Badge> : null}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {conexion
                      ? conexion.verificadaEn
                        ? `${conexion.nombreBd} · verificada ${formatearFecha(conexion.verificadaEn)}`
                        : `${conexion.nombreBd} · sin verificar`
                      : 'Base de datos sin configurar'}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
