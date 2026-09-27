import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      tono: {
        neutro: 'border-transparent bg-muted text-muted-foreground',
        exito: 'border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        aviso: 'border-amber-600/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        peligro: 'border-red-600/20 bg-red-500/10 text-red-700 dark:text-red-400',
        info: 'border-blue-600/20 bg-blue-500/10 text-blue-700 dark:text-blue-400',
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
