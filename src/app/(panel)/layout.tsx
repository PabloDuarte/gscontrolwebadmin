import { auth } from '@/auth';
import { BrandLogo } from '@/components/brand-logo';
import { CuentaMenu } from '@/components/cuenta-menu';
import { Sidebar } from '@/components/sidebar';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sesion = await auth();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-black md:flex">
        <div className="flex h-16 items-center px-6">
          <BrandLogo className="max-w-[12rem]" />
        </div>
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 bg-black px-5 text-white md:justify-end md:px-8">
          <div className="min-w-0 rounded-full bg-black px-1 py-1 md:hidden">
            <Sidebar />
          </div>
          <CuentaMenu nombre={sesion?.user?.name} correo={sesion?.user?.email} />
        </header>

        <main className="flex-1 px-5 pb-16 pt-4 md:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
