import Link from 'next/link';
import { Plus, Tags } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { EmptyRow, TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { listarPlanes } from '@/lib/consultas';
import { ETIQUETA_PERIODICIDAD, type Periodicidad } from '@/lib/dominio';
import { formatearMoneda } from '@/lib/utils';

function limite(valor: number | null) {
  return valor ?? 'Sin límite';
}

export default async function PlanesPage() {
  const catalogo = await listarPlanes();

  return (
    <>
      <PageHeader
        titulo="Planes"
        descripcion="Catálogo comercial que se asigna a las empresas clientes."
        acciones={
          <Link href="/planes/nuevo" className={buttonVariants()}>
            <Plus />
            Nuevo plan
          </Link>
        }
      />

      <Table>
        <THead>
          <TR>
            <TH>Plan</TH>
            <TH>Precio</TH>
            <TH>Límites</TH>
            <TH>Estado</TH>
          </TR>
        </THead>
        <TBody>
          {catalogo.length === 0 ? (
            <EmptyRow colSpan={4}>
              <Tags className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">Todavía no hay planes.</p>
              <Link href="/planes/nuevo" className={buttonVariants()}>
                <Plus />
                Crear el primero
              </Link>
            </EmptyRow>
          ) : (
            catalogo.map((plan) => (
              <TR key={plan.id}>
                <TD>
                  <Link
                    href={`/planes/${plan.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {plan.nombre}
                  </Link>
                  <p className="text-xs text-muted-foreground">{plan.codigo}</p>
                </TD>
                <TD>
                  {formatearMoneda(plan.precio, plan.moneda)}
                  <p className="text-xs text-muted-foreground">
                    {ETIQUETA_PERIODICIDAD[plan.periodicidad as Periodicidad]}
                  </p>
                </TD>
                <TD className="text-xs text-muted-foreground">
                  {limite(plan.maxEmpleados)} empleados · {limite(plan.maxDispositivos)} dispositivos ·{' '}
                  {limite(plan.maxUsuarios)} usuarios
                </TD>
                <TD>
                  <Badge tono={plan.activo ? 'exito' : 'neutro'}>
                    {plan.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </>
  );
}
