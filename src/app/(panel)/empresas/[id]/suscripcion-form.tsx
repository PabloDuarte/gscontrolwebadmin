'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateSelect, Field, Input, Select, Textarea } from '@/components/ui/field';
import {
  ETIQUETA_PERIODICIDAD,
  PERIODICIDADES,
  capitalizar,
  type Periodicidad,
} from '@/lib/dominio';
import { guardarSuscripcion, type EstadoFormulario } from '../actions';

type PlanOpcion = {
  id: number;
  nombre: string;
  precio: string;
  moneda: string;
  periodicidad: Periodicidad;
};

const MESES: Record<Periodicidad, number> = {
  mensual: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

function isoHoy() {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sumarMeses(fecha: string, meses: number) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const date = new Date(Date.UTC(anio, mes - 1 + meses, dia));
  return date.toISOString().slice(0, 10);
}

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Guardando…' : 'Crear suscripción'}
    </Button>
  );
}

export function SuscripcionForm({
  empresaId,
  planes,
  permitePrueba,
}: {
  empresaId: number;
  planes: PlanOpcion[];
  permitePrueba: boolean;
}) {
  const [estado, accion] = useActionState<EstadoFormulario | undefined, FormData>(
    guardarSuscripcion,
    undefined,
  );
  const [planId, setPlanId] = useState('');
  const [precio, setPrecio] = useState('');
  const [moneda, setMoneda] = useState('MXN');
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>('mensual');
  const [fechaInicio, setFechaInicio] = useState(isoHoy);
  const [fechaFin, setFechaFin] = useState('');

  function aplicarPlan(id: string) {
    setPlanId(id);
    const elegido = planes.find((p) => String(p.id) === id);
    if (!elegido) return;
    setMoneda(elegido.moneda);
    setPeriodicidad(elegido.periodicidad);
    if (fechaInicio) setFechaFin(sumarMeses(fechaInicio, MESES[elegido.periodicidad]));
    if (Number(elegido.precio) === 0) setPrecio('0');
  }

  const error = (campo: string) => estado?.errores?.[campo];

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
        Elige el plan y captura el precio de este ciclo. No se copian las condiciones de la
        suscripción anterior.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plan" htmlFor="planId" error={error('planId')}>
          <Select
            id="planId"
            name="planId"
            required
            value={planId}
            onChange={(e) => aplicarPlan(e.target.value)}
          >
            <option value="" disabled>
              Selecciona un plan
            </option>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Estado" htmlFor="estadoSuscripcion" error={error('estado')}>
          <Select id="estadoSuscripcion" name="estado" defaultValue={permitePrueba ? 'prueba' : 'activa'}>
            {permitePrueba ? <option value="prueba">{capitalizar('prueba')}</option> : null}
            <option value="activa">{capitalizar('activa')}</option>
          </Select>
        </Field>

        <Field label="Inicio" htmlFor="fechaInicio" error={error('fechaInicio')}>
          <DateSelect
            id="fechaInicio"
            name="fechaInicio"
            value={fechaInicio}
            onChange={(fecha) => {
              setFechaInicio(fecha);
              if (fecha) setFechaFin(sumarMeses(fecha, MESES[periodicidad]));
            }}
            required
          />
        </Field>

        <Field label="Fin" htmlFor="fechaFin" error={error('fechaFin')}>
          <DateSelect
            id="fechaFin"
            name="fechaFin"
            value={fechaFin}
            onChange={setFechaFin}
            required
          />
        </Field>

        <Field
          label="Precio pactado"
          htmlFor="precio"
          error={error('precio')}
          hint="Escríbelo para este ciclo. No se toma de la suscripción anterior."
        >
          <Input
            id="precio"
            name="precio"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </Field>

        <Field label="Moneda" htmlFor="moneda" error={error('moneda')}>
          <Input
            id="moneda"
            name="moneda"
            maxLength={3}
            value={moneda}
            onChange={(e) => setMoneda(e.target.value.toUpperCase())}
          />
        </Field>

        <Field label="Periodicidad" htmlFor="periodicidad" error={error('periodicidad')}>
          <Select
            id="periodicidad"
            name="periodicidad"
            value={periodicidad}
            onChange={(e) => {
              const siguiente = e.target.value as Periodicidad;
              setPeriodicidad(siguiente);
              if (fechaInicio) setFechaFin(sumarMeses(fechaInicio, MESES[siguiente]));
            }}
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
