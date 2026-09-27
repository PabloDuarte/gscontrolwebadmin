import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
  {
    variants: {
      tono: {
        neutro: 'border-transparent bg-black/5 text-muted-foreground dark:bg-white/10',
        exito: 'border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        aviso: 'border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400',
        peligro: 'border-transparent bg-red-500/10 text-red-700 dark:text-red-400',
        info: 'border-transparent bg-[#0071E3]/10 text-[#0071E3]',
      },
    },
    defaultVariants: { tono: 'neutro' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tono, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tono }), className)} {...props} />;
}
