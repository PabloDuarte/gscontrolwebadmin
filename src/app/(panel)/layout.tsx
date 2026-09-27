import { LogOut } from 'lucide-react';
import { auth, signOut } from '@/auth';
import { Sidebar } from '@/components/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sesion = await auth();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-muted/20 md:flex">
        <div className="flex h-14 items-center border-b px-5">
          <span className="text-sm font-semibold tracking-tight">GsControl</span>
        </div>
        <Sidebar />
        <div className="mt-auto border-t p-3">
          <p className="truncate px-3 text-xs text-muted-foreground">{sesion?.user?.name}</p>
          <p className="truncate px-3 text-xs text-muted-foreground">{sesion?.user?.email}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b px-5 md:justify-end">
          <div className="md:hidden">
            <Sidebar />
          </div>
          <div className="flex items-center gap-1">
          <ThemeToggle />
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <Button variant="ghost" size="icon" type="submit" aria-label="Cerrar sesión">
              <LogOut />
            </Button>
          </form>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
