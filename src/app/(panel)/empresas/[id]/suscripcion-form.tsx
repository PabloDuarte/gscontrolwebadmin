'use client';

import { useMemo, useRef, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { DateSelect, Field, Input, Select, Textarea } from '@/components/ui/field';
import {
  ETIQUETA_PERIODICIDAD,
  MESES_POR_PERIODICIDAD,
  PERIODICIDADES,
  precioPorPeriodicidad,
  type Periodicidad,
} from '@/lib/dominio';
import { fechaLocalHoy } from '@/lib/fechas';
import {
  formatearPrecioInput,
  parsearPrecioInput,
  precioParaServidor,
} from '@/lib/moneda-input';
import { formatearFecha, formatearMoneda } from '@/lib/utils';
import { guardarSuscripcion, type EstadoFormulario } from '../actions';

type PlanOpcion = {
  id: string;
  nombre: string;
  precio: string;
  moneda: string;
  periodicidad: Periodicidad;
  esPrueba: boolean;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function Guardar({ deshabilitado }: { deshabilitado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending || deshabilitado}>
      {pending ? 'Guardando…' : 'Crear suscripción'}
    </Button>
  );
}

export function SuscripcionForm({
  empresaId,
  planes,
  esPrimeraSuscripcion,
  descripcion,
}: {
  empresaId: string;
  planes: PlanOpcion[];
  esPrimeraSuscripcion: boolean;
  descripcion: string;
}) {
  const inicioInicial = fechaLocalHoy();
  const [planId, setPlanId] = useState('');
  const [precioTexto, setPrecioTexto] = useState('');
  const [moneda, setMoneda] = useState('MXN');
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>('mensual');
  const [fechaInicio, setFechaInicio] = useState(inicioInicial);
  const [fechaFin, setFechaFin] = useState('');

  const planElegido = useMemo(
    () => planes.find((p) => p.id === planId) ?? null,
    [planId, planes],
  );

  const envioRef = useRef({
    inicio: fechaInicio,
    fin: fechaFin,
    precio: '',
    moneda,
    periodicidad,
  });
  const precioServidor =
    precioParaServidor(precioTexto) ??
    (planElegido?.esPrueba && precioTexto.trim() === '' ? '0.00' : null);

  envioRef.current = {
    inicio: fechaInicio,
    fin: fechaFin,
    precio: precioServidor ?? '',
    moneda,
    periodicidad,
  };

  const [estado, accionBase] = useActionState<EstadoFormulario | undefined, FormData>(
    guardarSuscripcion,
    undefined,
  );

  const accion = async (datos: FormData) => {
    datos.set('fechaInicio', envioRef.current.inicio);
    datos.set('fechaFin', envioRef.current.fin);
    datos.set('precio', envioRef.current.precio);
    datos.set('moneda', envioRef.current.moneda);
    datos.set('periodicidad', envioRef.current.periodicidad);
    return accionBase(datos);
  };

  const error = (campo: string) => estado?.errores?.[campo];

  if (planes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Primero crea al menos un plan en el catálogo.
      </p>
    );
  }

  const avisoEstado =
    planElegido?.esPrueba && esPrimeraSuscripcion
      ? 'Este plan es de prueba: la suscripción quedará en periodo de prueba.'
      : 'La suscripción se creará activa. La vigencia la defines solo con las fechas de inicio y fin.';

  const fechasValidas = ISO.test(fechaInicio) && ISO.test(fechaFin);
  const rangoValido = fechasValidas && fechaFin >= fechaInicio;
  const precioNum = parsearPrecioInput(precioTexto);
  const precioValido =
    precioNum !== null ||
    Boolean(planElegido?.esPrueba && precioTexto.trim() === '');

  function onBlurPrecio() {
    if (planElegido?.esPrueba && precioTexto.trim() === '') {
      setPrecioTexto(formatearPrecioInput('0', moneda));
      return;
    }
    const fmt = formatearPrecioInput(precioTexto, moneda);
    if (fmt) setPrecioTexto(fmt);
  }

  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="empresaId" value={empresaId} />
      <div className="sticky top-4 z-20 -mx-6 flex items-start justify-between gap-4 rounded-3xl bg-white/95 px-6 py-4 shadow-apple backdrop-blur-xl dark:bg-[#161617]/95">
        <div className="min-w-0 space-y-1.5">
          <CardTitle>Suscripción / Licenciamiento</CardTitle>
          <CardDescription>{descripcion}</CardDescription>
        </div>
        <div className="shrink-0">
          <Guardar deshabilitado={!planId || !rangoValido || !precioValido} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Tú defines inicio y fin del licenciamiento. El precio pactado es el precio del plan por los
        meses de la periodicidad del pago (1, 3, 6 o 12). Las fechas no se recalculan.
      </p>
      <p className="text-sm text-muted-foreground">{avisoEstado}</p>

      {fechasValidas ? (
        <p className="rounded-2xl bg-black/[0.03] px-3.5 py-2.5 text-sm dark:bg-white/[0.04]">
          Periodo a guardar:{' '}
          <span className="font-medium">
            {formatearFecha(fechaInicio)} — {formatearFecha(fechaFin)}
          </span>
          {!rangoValido ? (
            <span className="ml-2 text-destructive">(la fecha fin debe ser posterior al inicio)</span>
          ) : null}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plan" htmlFor="planId" error={error('planId')}>
          <Select
            id="planId"
            name="planId"
            required
            value={planId}
            onChange={(e) => {
              const id = e.target.value;
              setPlanId(id);
              const plan = planes.find((p) => p.id === id);
              if (!plan) return;
              setPrecioTexto(formatearPrecioInput(precioPorPeriodicidad(plan.precio, periodicidad), moneda));
            }}
          >
            <option value="" disabled>
              Selecciona un plan
            </option>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
                {p.esPrueba ? ' (prueba)' : ''}
              </option>
            ))}
          </Select>
        </Field>

        {planElegido ? (
          <div className="rounded-2xl border border-black/5 bg-black/[0.02] px-3.5 py-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Referencia del catálogo
            </p>
            <p className="mt-1 font-medium">
              {formatearMoneda(planElegido.precio, planElegido.moneda)} ·{' '}
              {ETIQUETA_PERIODICIDAD[planElegido.periodicidad]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Precio mensual del plan. El pactado lo multiplica por la periodicidad del pago.
            </p>
          </div>
        ) : null}

        <Field label="Inicio" htmlFor="fechaInicio" error={error('fechaInicio')}>
          <DateSelect id="fechaInicio" value={fechaInicio} onChange={setFechaInicio} required />
        </Field>

        <Field label="Fin" htmlFor="fechaFin" error={error('fechaFin')}>
          <DateSelect id="fechaFin" value={fechaFin} onChange={setFechaFin} required />
        </Field>

        <Field
          label="Precio pactado"
          htmlFor="precio"
          error={error('precio')}
          hint={
            planElegido
              ? `Plan × ${MESES_POR_PERIODICIDAD[periodicidad]} ${MESES_POR_PERIODICIDAD[periodicidad] === 1 ? 'mes' : 'meses'}. No cambia las fechas.`
              : 'Se calcula al elegir plan y periodicidad.'
          }
        >
          <Input
            id="precio"
            inputMode="decimal"
            required={!planElegido?.esPrueba}
            placeholder={formatearPrecioInput('0', moneda)}
            value={precioTexto}
            onChange={(e) => setPrecioTexto(e.target.value)}
            onBlur={onBlurPrecio}
          />
        </Field>

        <Field
          label="Moneda del pago"
          htmlFor="moneda"
          error={error('moneda')}
          hint="Referencial — cómo cobras; no afecta vigencia."
        >
          <Input
            id="moneda"
            maxLength={3}
            value={moneda}
            onChange={(e) => setMoneda(e.target.value.toUpperCase())}
          />
        </Field>

        <Field
          label="Periodicidad del pago"
          htmlFor="periodicidad"
          error={error('periodicidad')}
          hint="Al elegirla, el precio pactado pasa a ser el precio del plan por esos meses."
        >
          <Select
            id="periodicidad"
            value={periodicidad}
            onChange={(e) => {
              const periodo = e.target.value as Periodicidad;
              setPeriodicidad(periodo);
              if (!planElegido) return;
              setPrecioTexto(
                formatearPrecioInput(precioPorPeriodicidad(planElegido.precio, periodo), moneda),
              );
            }}
          >
            {PERIODICIDADES.map((p) => (
              <option key={p} value={p}>
                {ETIQUETA_PERIODICIDAD[p]}
              </option>
            ))}
          </Select>
        </Field>

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
    </form>
  );
}
