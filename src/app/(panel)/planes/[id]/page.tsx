import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { PageHeader } from '@/components/page-header';
import { esUuid } from '@/lib/uuid';
import { db } from '@/lib/db/control';
import { planes } from '@/lib/db/schema';
import { PlanForm } from '../plan-form';

export default async function EditarPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  if (!esUuid(id)) notFound();

  const [plan] = await db.select().from(planes).where(eq(planes.id, id)).limit(1);
  if (!plan) notFound();

  return (
    <>
      <PageHeader titulo={plan.nombre} descripcion={`Código ${plan.codigo}`} />
      <PlanForm plan={plan} />
    </>
  );
}
