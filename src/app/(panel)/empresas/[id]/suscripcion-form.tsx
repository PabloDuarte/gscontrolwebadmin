'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { ESTADOS_SUSCRIPCION, ETIQUETA_PERIODICIDAD, PERIODICIDADES, capitalizar } from '@/lib/dominio';
import { guardarSuscripcion, type EstadoFormulario } from '../actions';

type PlanOpcion = { id: number; nombre: string; precio: string; moneda: string };

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar suscripción'}
    </Button>
  );
}

export function SuscripcionForm({
  empresaId,
  planes,
  actual,
}: {
  empresaId: number;
  planes: PlanOpcion[];
  actual?: {
    id: number;
    planId: number;
    estado: string;
    fechaInicio: string;
    fechaFin: string;
    precio: string;
    moneda: string;
    periodicidad: string;
    renovacionAutomatica: boolean;
    notas: string | null;
  } | null;
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
      {actual ? <input type="hidden" name="id" value={actual.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plan" htmlFor="planId" error={error('planId')}>
          <Select id="planId" name="planId" defaultValue={actual?.planId ?? planes[0].id}>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Estado" htmlFor="estadoSuscripcion" error={error('estado')}>
          <Select id="estadoSuscripcion" name="estado" defaultValue={actual?.estado ?? 'activa'}>
            {ESTADOS_SUSCRIPCION.map((e) => (
              <option key={e} value={e}>
                {capitalizar(e)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Inicio" htmlFor="fechaInicio" error={error('fechaInicio')}>
          <Input
            id="fechaInicio"
            name="fechaInicio"
            type="date"
            defaultValue={actual?.fechaInicio ?? hoy}
            required
          />
        </Field>

        <Field label="Fin" htmlFor="fechaFin" error={error('fechaFin')}>
          <Input
            id="fechaFin"
            name="fechaFin"
            type="date"
            defaultValue={actual?.fechaFin ?? ''}
            required
          />
        </Field>

        <Field label="Precio pactado" htmlFor="precio" error={error('precio')}>
          <Input
            id="precio"
            name="precio"
            type="number"
            step="0.01"
            min="0"
            defaultValue={actual?.precio ?? planes[0].precio}
          />
        </Field>

        <Field label="Moneda" htmlFor="moneda" error={error('moneda')}>
          <Input id="moneda" name="moneda" maxLength={3} defaultValue={actual?.moneda ?? 'MXN'} />
        </Field>

        <Field label="Periodicidad" htmlFor="periodicidad" error={error('periodicidad')}>
          <Select
            id="periodicidad"
            name="periodicidad"
            defaultValue={actual?.periodicidad ?? 'mensual'}
          >
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
              defaultChecked={actual?.renovacionAutomatica ?? false}
              className="size-4 rounded-md border-input accent-primary"
            />
            Renovación automática
          </label>
        </div>

        <Field label="Notas" htmlFor="notasSuscripcion" className="sm:col-span-2">
          <Textarea id="notasSuscripcion" name="notas" defaultValue={actual?.notas ?? ''} />
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
