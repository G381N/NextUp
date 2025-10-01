'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { CheckSquare } from 'lucide-react';
import { useSidebar } from '../ui/sidebar';

export function Logo({ className, iconClassName }: { className?: string, iconClassName?: string }) {
  const { state } = useSidebar();
  const showText = state === 'expanded';

  return (
    <div className={cn('flex items-center gap-2 text-lg font-bold tracking-tight text-foreground', className)}>
      <CheckSquare className={cn("h-6 w-6 text-primary", iconClassName)} />
      {showText && <span className="text-xl font-headline">NextUp</span>}
    </div>
  );
}

export function PublicLogo({ className, iconClassName }: { className?: string, iconClassName?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-lg font-bold tracking-tight text-foreground', className)}>
      <CheckSquare className={cn("h-6 w-6 text-primary", iconClassName)} />
      <span className="text-xl font-headline">NextUp</span>
    </div>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
