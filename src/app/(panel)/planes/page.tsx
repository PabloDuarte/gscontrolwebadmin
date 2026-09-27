import Link from 'next/link';
import { Plus, Tags } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

      {catalogo.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <Tags className="mb-4 size-8 text-muted-foreground" />
          <p className="mb-5 text-sm text-muted-foreground">Todavía no hay planes.</p>
          <Link href="/planes/nuevo" className={buttonVariants()}>
            <Plus />
            Crear el primero
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {catalogo.map((plan) => (
            <Link
              key={plan.id}
              href={`/planes/${plan.id}`}
              className="group block transition-transform duration-200 ease-apple hover:scale-[1.02] active:scale-[0.98]"
            >
              <Card className="flex h-full flex-col p-8 transition-shadow duration-200 group-hover:shadow-apple-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {plan.codigo}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">{plan.nombre}</h2>
                  </div>
                  <Badge tono={plan.activo ? 'exito' : 'neutro'}>
                    {plan.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <p className="mt-8 text-4xl font-semibold tracking-tight">
                  {formatearMoneda(plan.precio, plan.moneda)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ETIQUETA_PERIODICIDAD[plan.periodicidad as Periodicidad]}
                </p>

                {plan.descripcion ? (
                  <p className="mt-5 line-clamp-2 text-sm text-muted-foreground">{plan.descripcion}</p>
                ) : null}

                <ul className="mt-auto space-y-2 pt-8 text-sm text-muted-foreground">
                  <li>{limite(plan.maxEmpleados)} empleados</li>
                  <li>{limite(plan.maxDispositivos)} dispositivos</li>
                  <li>{limite(plan.maxUsuarios)} usuarios</li>
                </ul>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
