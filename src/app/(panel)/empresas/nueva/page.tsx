import { PageHeader } from '@/components/page-header';
import { EmpresaForm } from '../empresa-form';

export default function NuevaEmpresaPage() {
  return (
    <>
      <PageHeader
        titulo="Nueva empresa"
        descripcion="Alta de un cliente. La suscripción se asigna después de guardar."
      />
      <EmpresaForm />
    </>
  );
}
