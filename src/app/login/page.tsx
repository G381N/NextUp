'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSwitch } from '@/components/app/theme-switch';
import Link from 'next/link';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { PublicLogo } from '@/components/app/logo';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.42 1 12.5s.43 3.95 1.18 5.43l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/folders');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/folders');
    } catch (error) {
      console.error('Error signing in with Google: ', error);
    }
  };
  
  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  const features = [
    'Smart Prioritization with AI',
    'Add tasks via text, voice, or image',
    'Organize tasks into folders',
    'Clean, minimalist interface',
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="absolute top-4 left-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Landing Page</span>
                </Link>
            </Button>
        </div>
        <div className="absolute top-4 right-4">
            <ThemeSwitch />
        </div>
        <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                    <PublicLogo iconClassName="h-12 w-12" />
                </div>
                <CardTitle className="font-headline text-3xl tracking-tight">Welcome to NextUp</CardTitle>
                <CardDescription>Sign in to the smartest way to organize your tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSignIn} size="lg" className="w-full">
                    <GoogleIcon className="mr-2 h-5 w-5" />
                    Continue with Google
                </Button>
            </CardFooter>
        </Card>
    </main>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
