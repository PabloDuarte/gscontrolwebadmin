import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/field';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { listarEmpresas } from '@/lib/consultas';
import { GuardadoModal } from './guardado-modal';
import { ESTADOS_EMPRESA, TONO_EMPRESA, capitalizar, type EstadoEmpresa } from '@/lib/dominio';
import { calcularVigencia, esSuscripcionVigente } from '@/lib/suscripciones';
import { formatearFecha } from '@/lib/utils';

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; guardado?: string }>;
}) {
  const { q = '', estado = '', guardado = '' } = await searchParams;
  const todas = await listarEmpresas();

  const busqueda = q.trim().toLowerCase();
  const filas = todas.filter(({ empresa }) => {
    const coincideTexto =
      !busqueda ||
      empresa.nombreComercial.toLowerCase().includes(busqueda) ||
      (empresa.rfc ?? '').toLowerCase().includes(busqueda) ||
      (empresa.razonSocial ?? '').toLowerCase().includes(busqueda);
    const coincideEstado = !estado || empresa.estado === estado;
    return coincideTexto && coincideEstado;
  });

  return (
    <>
      <GuardadoModal visible={guardado === '1'} />
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
          placeholder="Buscar por nombre o RFC…"
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
        <Card>
          <CardContent className="p-0">
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
                {filas.map(({ empresa, conexion, suscripcion, plan, requiereRenovacion }) => {
                  const vigente = suscripcion ? esSuscripcionVigente(suscripcion) : false;
                  const vigencia =
                    suscripcion && vigente
                      ? calcularVigencia(suscripcion.fechaFin, suscripcion.estado)
                      : null;
                  const resumenBd = conexion
                    ? conexion.verificadaEn
                      ? `${conexion.nombreBd} · verificada ${formatearFecha(conexion.verificadaEn)}`
                      : `${conexion.nombreBd} · sin verificar`
                    : 'Base de datos sin configurar';

                  return (
                    <TR key={empresa.id} className="relative cursor-pointer">
                      <TD>
                        <Link
                          href={`/empresas/${empresa.id}`}
                          className="block min-w-0 after:absolute after:inset-0"
                        >
                          <p className="truncate font-medium tracking-tight">
                            {empresa.nombreComercial}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {empresa.rfc}
                          </p>
                        </Link>
                      </TD>
                      <TD className="relative">
                        <Badge tono={TONO_EMPRESA[empresa.estado as EstadoEmpresa]}>
                          {capitalizar(empresa.estado)}
                        </Badge>
                      </TD>
                      <TD className="relative font-medium">
                        {vigente
                          ? (suscripcion!.planNombre || plan?.nombre || 'Sin plan')
                          : 'Sin plan'}
                      </TD>
                      <TD className="relative">
                        {vigencia ? (
                          <div className="space-y-1">
                            <Badge tono={vigencia.tono}>{vigencia.etiqueta}</Badge>
                            <p className="text-xs text-muted-foreground">
                              {formatearFecha(suscripcion!.fechaFin)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {requiereRenovacion ? 'Sin suscripción — renovar' : 'Sin suscripción'}
                          </span>
                        )}
                      </TD>
                      <TD className="relative text-xs text-muted-foreground">{resumenBd}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
