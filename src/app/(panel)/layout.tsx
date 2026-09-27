import { LogOut } from 'lucide-react';
import { auth, signOut } from '@/auth';
import { BrandIcon, BrandLogo } from '@/components/brand-logo';
import { Sidebar } from '@/components/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sesion = await auth();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/5 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] md:flex">
        <div className="flex h-16 items-center px-6">
          <BrandLogo className="max-w-[12rem]" />
        </div>
        <Sidebar />
        <div className="mt-auto mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-black/5 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
          <BrandIcon className="size-9 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{sesion?.user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{sesion?.user?.email}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 px-5 md:justify-end md:px-8">
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

        <main className="flex-1 px-5 pb-16 pt-4 md:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
