'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { ETIQUETA_PERIODICIDAD, PERIODICIDADES } from '@/lib/dominio';
import { guardarPlan, type EstadoFormulario } from './actions';

export type PlanVisible = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  moneda: string;
  periodicidad: string;
  maxEmpleados: number | null;
  maxDispositivos: number | null;
  maxUsuarios: number | null;
  activo: boolean;
};

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar'}
    </Button>
  );
}

export function PlanForm({ plan }: { plan?: PlanVisible }) {
  const [estado, accion] = useActionState<EstadoFormulario | undefined, FormData>(
    guardarPlan,
    undefined,
  );
  const error = (campo: string) => estado?.errores?.[campo];

  return (
    <form action={accion} className="space-y-6">
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Datos del plan</CardTitle>
          <CardDescription>Precio, periodicidad y límites que se ofrecen al cliente.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Código" htmlFor="codigo" error={error('codigo')}>
            <Input id="codigo" name="codigo" defaultValue={plan?.codigo} required />
          </Field>

          <Field label="Nombre" htmlFor="nombre" error={error('nombre')}>
            <Input id="nombre" name="nombre" defaultValue={plan?.nombre} required />
          </Field>

          <Field
            label="Descripción"
            htmlFor="descripcion"
            className="sm:col-span-2"
            error={error('descripcion')}
          >
            <Textarea id="descripcion" name="descripcion" defaultValue={plan?.descripcion ?? ''} />
          </Field>

          <Field label="Precio" htmlFor="precio" error={error('precio')}>
            <Input
              id="precio"
              name="precio"
              type="number"
              step="0.01"
              min="0"
              defaultValue={plan?.precio ?? '0.00'}
            />
          </Field>

          <Field label="Moneda" htmlFor="moneda" error={error('moneda')}>
            <Input id="moneda" name="moneda" maxLength={3} defaultValue={plan?.moneda ?? 'MXN'} />
          </Field>

          <Field label="Periodicidad" htmlFor="periodicidad" error={error('periodicidad')}>
            <Select id="periodicidad" name="periodicidad" defaultValue={plan?.periodicidad ?? 'mensual'}>
              {PERIODICIDADES.map((p) => (
                <option key={p} value={p}>
                  {ETIQUETA_PERIODICIDAD[p]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Máx. empleados" htmlFor="maxEmpleados" hint="Vacío = sin límite">
            <Input
              id="maxEmpleados"
              name="maxEmpleados"
              type="number"
              min="1"
              defaultValue={plan?.maxEmpleados ?? ''}
            />
          </Field>

          <Field label="Máx. dispositivos" htmlFor="maxDispositivos" hint="Vacío = sin límite">
            <Input
              id="maxDispositivos"
              name="maxDispositivos"
              type="number"
              min="1"
              defaultValue={plan?.maxDispositivos ?? ''}
            />
          </Field>

          <Field label="Máx. usuarios" htmlFor="maxUsuarios" hint="Vacío = sin límite">
            <Input
              id="maxUsuarios"
              name="maxUsuarios"
              type="number"
              min="1"
              defaultValue={plan?.maxUsuarios ?? ''}
            />
          </Field>

          <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={plan?.activo ?? true}
              className="size-4 rounded-md border-input accent-primary"
            />
            Plan activo y disponible para asignar
          </label>
        </CardContent>
      </Card>

      {estado?.mensaje ? (
        <p className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {estado.mensaje}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Guardar />
        <Link href="/planes" className={buttonVariants({ variant: 'ghost' })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
