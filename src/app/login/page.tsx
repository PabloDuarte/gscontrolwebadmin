import { BrandLogo } from '@/components/brand-logo';
import { Card, CardContent } from '@/components/ui/card';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/brand/login-bg.jpg')" }}
      />
      <div aria-hidden className="absolute inset-0 bg-black/45" />

      <div className="relative w-full max-w-[400px] space-y-8 text-center">
        <div className="space-y-4">
          <BrandLogo className="mx-auto h-9" priority />
          <p className="text-base text-white/90">Panel de administración de clientes</p>
        </div>

        <Card className="border-white/10 bg-white/95 shadow-apple-lg backdrop-blur-md dark:bg-black/80">
          <CardContent className="space-y-6 p-8 text-left">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
