import { PageHeader } from '@/components/page-header';
import { PlanForm } from '../plan-form';

export default function NuevoPlanPage() {
  return (
    <>
      <PageHeader titulo="Nuevo plan" descripcion="Alta de un plan del catálogo comercial." />
      <PlanForm />
    </>
  );
}
