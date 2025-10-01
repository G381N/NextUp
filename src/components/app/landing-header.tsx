import Link from 'next/link';
import { Button } from '../ui/button';
import { PublicLogo } from './logo';
import { ThemeSwitch } from './theme-switch';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-headline font-bold tracking-tight text-foreground">
            <PublicLogo iconClassName="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitch />
          <Button asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
