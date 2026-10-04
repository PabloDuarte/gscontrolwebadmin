import { auth } from '@/auth';
import { PanelShell } from '@/components/panel-shell';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sesion = await auth();

  return (
    <PanelShell nombre={sesion?.user?.name} correo={sesion?.user?.email}>
      {children}
    </PanelShell>
  );
}
