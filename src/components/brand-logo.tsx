import { cn } from '@/lib/utils';

export function BrandLogo({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    // El wordmark es un PNG fijo de Intecontrol; no hace falta next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo.png"
      alt="Intecontrol"
      width={339}
      height={41}
      className={cn('h-7 w-auto max-w-full object-contain object-left', className)}
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  );
}

export function BrandIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/icon.png"
      alt=""
      width={192}
      height={192}
      className={cn('size-8 rounded-full object-cover', className)}
    />
  );
}

const TAMANO_EMPRESA = {
  sm: 'h-8 w-36',
  md: 'h-10 w-44',
  lg: 'h-12 w-52',
} as const;

export function LogoEmpresa({
  src,
  alt,
  className,
  tamano = 'sm',
}: {
  src?: string | null;
  alt: string;
  className?: string;
  tamano?: keyof typeof TAMANO_EMPRESA;
}) {
  const contenedor = cn(
    'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm dark:bg-white',
    TAMANO_EMPRESA[tamano],
    className,
  );

  if (!src) {
    return (
      <span className={cn(contenedor, 'text-xs font-medium text-muted-foreground')} aria-hidden>
        {alt.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <span className={contenedor}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-contain p-1.5" />
    </span>
  );
}
