'use client';

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { LogoEmpresa } from '@/components/brand-logo';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateSelect, Field, Input, Select, Textarea } from '@/components/ui/field';
import { ESTADOS_EMPRESA, capitalizar } from '@/lib/dominio';
import { parsearTelefono } from '@/lib/empresa';
import { guardarEmpresa, type EstadoFormulario } from './actions';

export type EmpresaVisible = {
  id: string;
  codigo: string;
  nombreComercial: string;
  razonSocial: string | null;
  rfc: string | null;
  contactoNombre: string | null;
  contactoEmail: string | null;
  contactoTelefono: string | null;
  estado: string;
  fechaAlta: string;
  logoPath: string | null;
  notas: string | null;
};

type Campos = Record<string, string>;

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar'}
    </Button>
  );
}

function camposIniciales(empresa: EmpresaVisible | undefined): Campos {
  const hoy = new Date().toISOString().slice(0, 10);
  const telefono = parsearTelefono(empresa?.contactoTelefono);
  return {
    nombreComercial: (empresa?.nombreComercial ?? '').toUpperCase(),
    rfc: (empresa?.rfc ?? '').toUpperCase(),
    razonSocial: (empresa?.razonSocial ?? '').toUpperCase(),
    estado: empresa?.estado ?? 'activo',
    fechaAlta: empresa?.fechaAlta ?? hoy,
    contactoNombre: empresa?.contactoNombre ?? '',
    contactoEmail: empresa?.contactoEmail ?? '',
    telefonoPais: telefono.pais,
    telefonoArea: telefono.area,
    telefonoNumero: telefono.numero,
    notas: empresa?.notas ?? '',
  };
}

export function EmpresaForm({ empresa }: { empresa?: EmpresaVisible }) {
  const logoRef = useRef<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(empresa?.logoPath ?? null);
  const [campos, setCampos] = useState<Campos>(() => camposIniciales(empresa));

  const [estado, accion] = useActionState<EstadoFormulario | undefined, FormData>(
    async (previo, datos) => {
      const logoEnForm = datos.get('logo');
      const logoVacio = !(logoEnForm instanceof File) || logoEnForm.size === 0;
      if (logoRef.current && logoVacio) {
        datos.set('logo', logoRef.current);
      }
      return guardarEmpresa(previo, datos);
    },
    undefined,
  );

  const error = (campo: string) => estado?.errores?.[campo];

  const setCampo =
    (nombre: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setCampos((prev) => ({ ...prev, [nombre]: e.target.value }));
    };
  const setCampoMayus =
    (nombre: string) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setCampos((prev) => ({ ...prev, [nombre]: e.target.value.toUpperCase() }));
    };

  useEffect(() => {
    if (!estado?.errores) return;
    const primero = Object.keys(estado.errores)[0];
    if (!primero) return;
    const el = document.getElementById(primero);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in el) (el as HTMLElement).focus();
    }
  }, [estado?.errores]);

  useEffect(() => {
    if (!estado?.valores) return;
    setCampos((prev) => ({ ...prev, ...estado.valores }));
  }, [estado?.valores]);

  return (
    <form action={accion} className="space-y-6">
      {empresa ? <input type="hidden" name="id" value={empresa.id} /> : null}

      {empresa ? (
        <Card>
          <CardHeader>
            <CardTitle>Llave de tenant (Supabase)</CardTitle>
            <CardDescription>
              Usa este UUID como <code className="text-xs">empresa_id</code> en tablas con RLS. El
              código es legible para operación interna.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="empresa_id" htmlFor="empresaId">
              <Input id="empresaId" name="empresaIdDisplay" value={empresa.id} readOnly />
            </Field>
            <Field label="Código" htmlFor="codigoDisplay">
              <Input id="codigoDisplay" value={empresa.codigo} readOnly />
            </Field>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="sticky top-4 z-20 flex-row items-start justify-between gap-4 space-y-0 rounded-3xl bg-white/95 shadow-apple backdrop-blur-xl dark:bg-[#161617]/95">
          <div className="space-y-1.5">
            <CardTitle>Datos de la empresa</CardTitle>
            <CardDescription>
              Particulares del cliente. El RFC / ID fiscal es el identificador único.
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Guardar />
            <Link href="/empresas" className={buttonVariants({ variant: 'ghost' })}>
              Cancelar
            </Link>
          </div>
        </CardHeader>
        {estado?.mensaje && !estado.ok ? (
          <p className="mx-6 mb-4 flex items-center gap-2 rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {estado.mensaje}
          </p>
        ) : null}
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre comercial" htmlFor="nombreComercial" error={error('nombreComercial')}>
            <Input
              id="nombreComercial"
              name="nombreComercial"
              value={campos.nombreComercial}
              onChange={setCampoMayus('nombreComercial')}
              className="uppercase"
              required
            />
          </Field>

          <Field
            label="RFC / ID fiscal"
            htmlFor="rfc"
            error={error('rfc')}
            hint="Identificador único del cliente. No se puede repetir."
          >
            <Input
              id="rfc"
              name="rfc"
              value={campos.rfc}
              onChange={setCampoMayus('rfc')}
              required
              maxLength={13}
              className="uppercase"
            />
          </Field>

          <Field label="Razón social" htmlFor="razonSocial" error={error('razonSocial')}>
            <Input
              id="razonSocial"
              name="razonSocial"
              value={campos.razonSocial}
              onChange={setCampoMayus('razonSocial')}
              className="uppercase"
            />
          </Field>

          <Field label="Estado" htmlFor="estado" error={error('estado')}>
            <Select
              id="estado"
              name="estado"
              value={campos.estado}
              onChange={setCampo('estado')}
            >
              {ESTADOS_EMPRESA.map((e) => (
                <option key={e} value={e}>
                  {capitalizar(e)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Fecha de alta" htmlFor="fechaAlta" error={error('fechaAlta')}>
            <DateSelect
              id="fechaAlta"
              name="fechaAlta"
              value={campos.fechaAlta}
              onChange={(fechaAlta) => setCampos((prev) => ({ ...prev, fechaAlta }))}
              required
            />
          </Field>

          <Field label="Contacto" htmlFor="contactoNombre" error={error('contactoNombre')}>
            <Input
              id="contactoNombre"
              name="contactoNombre"
              value={campos.contactoNombre}
              onChange={setCampo('contactoNombre')}
            />
          </Field>

          <Field label="Correo de contacto" htmlFor="contactoEmail" error={error('contactoEmail')}>
            <Input
              id="contactoEmail"
              name="contactoEmail"
              type="email"
              value={campos.contactoEmail}
              onChange={setCampo('contactoEmail')}
            />
          </Field>

          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium">Teléfono</p>
            <div className="grid grid-cols-[5rem_5rem_1fr] gap-2">
              <Field label="País" htmlFor="telefonoPais" error={error('telefonoPais')}>
                <Input
                  id="telefonoPais"
                  name="telefonoPais"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="52"
                  value={campos.telefonoPais}
                  onChange={setCampo('telefonoPais')}
                />
              </Field>
              <Field label="Área" htmlFor="telefonoArea" error={error('telefonoArea')}>
                <Input
                  id="telefonoArea"
                  name="telefonoArea"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="33"
                  value={campos.telefonoArea}
                  onChange={setCampo('telefonoArea')}
                />
              </Field>
              <Field label="Número" htmlFor="telefonoNumero" error={error('telefonoNumero')}>
                <Input
                  id="telefonoNumero"
                  name="telefonoNumero"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="12345678"
                  value={campos.telefonoNumero}
                  onChange={setCampo('telefonoNumero')}
                />
              </Field>
            </div>
          </div>

          <Field
            label="Logo"
            htmlFor="logo"
            className="sm:col-span-2"
            error={error('logo')}
            hint="Wordmark rectangular, como el de Intecontrol. PNG, JPG, WEBP o SVG, máximo 2 MB."
          >
            <div className="flex items-center gap-3">
              <LogoEmpresa
                src={vistaPrevia}
                alt={campos.nombreComercial || empresa?.nombreComercial || 'Logo'}
                tamano="lg"
              />
              <Input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="h-auto py-2"
                onChange={(e) => {
                  const archivo = e.target.files?.[0] ?? null;
                  logoRef.current = archivo;
                  setVistaPrevia(
                    archivo ? URL.createObjectURL(archivo) : (empresa?.logoPath ?? null),
                  );
                }}
              />
            </div>
          </Field>

          <Field label="Notas" htmlFor="notas" className="sm:col-span-2" error={error('notas')}>
            <Textarea
              id="notas"
              name="notas"
              value={campos.notas}
              onChange={setCampo('notas')}
            />
          </Field>
        </CardContent>
      </Card>
    </form>
  );
}
