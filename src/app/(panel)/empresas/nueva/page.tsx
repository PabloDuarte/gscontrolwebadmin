import { PageHeader } from '@/components/page-header';
import { EmpresaForm } from '../empresa-form';

export default function NuevaEmpresaPage() {
  return (
    <>
      <PageHeader
        titulo="Nueva empresa"
        descripcion="Alta de particulares. Después, desde el listado, abre la ficha para asignar suscripción y conexión a la base de datos."
      />
      <EmpresaForm />
    </>
  );
}
