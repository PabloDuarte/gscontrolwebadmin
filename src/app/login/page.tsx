import { BrandLogo } from '@/components/brand-logo';
import { Card, CardContent } from '@/components/ui/card';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-16 size-[28rem] rounded-full bg-[#0071E3]/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 size-[22rem] rounded-full bg-black/5 blur-3xl dark:bg-white/5" />
      </div>

      <div className="relative w-full max-w-[400px] space-y-10 text-center">
        <div className="space-y-5">
          <BrandLogo className="mx-auto h-8" priority />
          <div className="space-y-2">
            <h1 className="text-5xl font-semibold tracking-tight">GsControl</h1>
            <p className="text-base text-muted-foreground">Panel de administración de clientes</p>
          </div>
        </div>

        <Card className="shadow-apple-lg">
          <CardContent className="space-y-6 p-8 text-left">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Iniciar sesión</h2>
              <p className="text-sm text-muted-foreground">
                Acceso exclusivo del personal de INTECONAYC.
              </p>
            </div>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
