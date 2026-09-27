import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { EmptyRow, TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
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
          className="h-9 max-w-xs"
        />
        <Select name="estado" defaultValue={estado} className="h-9 max-w-[12rem]">
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

      <Table>
        <THead>
          <TR>
            <TH>Empresa</TH>
            <TH>Estado</TH>
            <TH>Plan</TH>
            <TH>Vigencia</TH>
            <TH>Base de datos</TH>
          </TR>
        </THead>
        <TBody>
          {filas.length === 0 ? (
            <EmptyRow colSpan={5}>
              <Building2 className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">
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
            </EmptyRow>
          ) : (
            filas.map(({ empresa, conexion, suscripcion, plan }) => {
              const vigencia = suscripcion
                ? calcularVigencia(suscripcion.fechaFin, suscripcion.estado)
                : null;

              return (
                <TR key={empresa.id}>
                  <TD>
                    <Link
                      href={`/empresas/${empresa.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {empresa.nombreComercial}
                    </Link>
                    <p className="text-xs text-muted-foreground">{empresa.codigo}</p>
                  </TD>
                  <TD>
                    <Badge tono={TONO_EMPRESA[empresa.estado as EstadoEmpresa]}>
                      {capitalizar(empresa.estado)}
                    </Badge>
                  </TD>
                  <TD className="text-muted-foreground">{plan?.nombre ?? '—'}</TD>
                  <TD>
                    {vigencia ? (
                      <>
                        <Badge tono={vigencia.tono}>{vigencia.etiqueta}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatearFecha(suscripcion!.fechaFin)}
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin suscripción</span>
                    )}
                  </TD>
                  <TD>
                    {conexion ? (
                      <>
                        <span className="font-mono text-xs">{conexion.nombreBd}</span>
                        <p className="text-xs text-muted-foreground">
                          {conexion.verificadaEn
                            ? `Verificada ${formatearFecha(conexion.verificadaEn)}`
                            : 'Sin verificar'}
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin configurar</span>
                    )}
                  </TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </>
  );
}
