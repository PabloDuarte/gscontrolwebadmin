'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { ESTADOS_SUSCRIPCION, ETIQUETA_PERIODICIDAD, PERIODICIDADES, capitalizar } from '@/lib/dominio';
import { guardarSuscripcion, type EstadoFormulario } from '../actions';

type PlanOpcion = { id: number; nombre: string; precio: string; moneda: string };

const ESTADOS_ALTA = ESTADOS_SUSCRIPCION.filter((e) => e !== 'cancelada');

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Guardando…' : 'Asignar suscripción'}
    </Button>
  );
}

export function SuscripcionForm({
  empresaId,
  planes,
}: {
  empresaId: number;
  planes: PlanOpcion[];
}) {
  const [estado, accion] = useActionState<EstadoFormulario | undefined, FormData>(
    guardarSuscripcion,
    undefined,
  );

  const error = (campo: string) => estado?.errores?.[campo];
  const hoy = new Date().toISOString().slice(0, 10);

  if (planes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Primero crea al menos un plan en el catálogo.
      </p>
    );
  }

  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="empresaId" value={empresaId} />
      <p className="text-sm text-muted-foreground">
        Solo puede haber una suscripción activa. Si ya había una, cancélala antes; la anterior
        queda en el historial.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plan" htmlFor="planId" error={error('planId')}>
          <Select id="planId" name="planId" defaultValue={planes[0].id}>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Estado" htmlFor="estadoSuscripcion" error={error('estado')}>
          <Select id="estadoSuscripcion" name="estado" defaultValue="activa">
            {ESTADOS_ALTA.map((e) => (
              <option key={e} value={e}>
                {capitalizar(e)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Inicio" htmlFor="fechaInicio" error={error('fechaInicio')}>
          <Input id="fechaInicio" name="fechaInicio" type="date" defaultValue={hoy} required />
        </Field>

        <Field label="Fin" htmlFor="fechaFin" error={error('fechaFin')}>
          <Input id="fechaFin" name="fechaFin" type="date" required />
        </Field>

        <Field label="Precio pactado" htmlFor="precio" error={error('precio')}>
          <Input
            id="precio"
            name="precio"
            type="number"
            step="0.01"
            min="0"
            defaultValue={planes[0].precio}
          />
        </Field>

        <Field label="Moneda" htmlFor="moneda" error={error('moneda')}>
          <Input id="moneda" name="moneda" maxLength={3} defaultValue={planes[0].moneda ?? 'MXN'} />
        </Field>

        <Field label="Periodicidad" htmlFor="periodicidad" error={error('periodicidad')}>
          <Select id="periodicidad" name="periodicidad" defaultValue="mensual">
            {PERIODICIDADES.map((p) => (
              <option key={p} value={p}>
                {ETIQUETA_PERIODICIDAD[p]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-end">
          <label className="flex items-center gap-2.5 pb-2 text-sm">
            <input
              type="checkbox"
              name="renovacionAutomatica"
              className="size-4 rounded-md border-input accent-primary"
            />
            Renovación automática
          </label>
        </div>

        <Field label="Notas" htmlFor="notasSuscripcion" className="sm:col-span-2">
          <Textarea id="notasSuscripcion" name="notas" />
        </Field>
      </div>

      {estado?.mensaje ? (
        <p
          className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm ${
            estado.ok
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {estado.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          {estado.mensaje}
        </p>
      ) : null}

      <Guardar />
    </form>
  );
}
