'use client';

import {
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useSidebar } from '../ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';

export function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const { setTheme } = useTheme()
  const { state: sidebarState } = useSidebar();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!user) return null;

  const fallbackInitials = user.displayName
    ? user.displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
    : user.email?.[0].toUpperCase() ?? 'U';

  const triggerButton = (
    <Button
      variant="ghost"
      className={cn(
        "relative h-12 w-full justify-start gap-3 rounded-lg px-2 hover:bg-secondary",
        sidebarState === 'collapsed' && 'h-10 w-10 justify-center p-0'
      )}
    >
      <Avatar className="h-8 w-8 ring-1 ring-border/50">
        <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? ''} />
        <AvatarFallback className="bg-secondary text-xs font-medium">
          {fallbackInitials}
        </AvatarFallback>
      </Avatar>
      {sidebarState === 'expanded' && (
        <div className="flex flex-col items-start text-left min-w-0">
          <p className="w-full truncate text-sm font-medium text-foreground">
            {user.displayName}
          </p>
          <p className="w-full truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
      )}
    </Button>
  );

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              {triggerButton}
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {sidebarState === 'collapsed' && (
            <TooltipContent side="right" className="font-medium">
              <p>{user.displayName}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span>Toggle theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
