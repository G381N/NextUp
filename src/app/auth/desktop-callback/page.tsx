'use client';

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, LogIn } from 'lucide-react';

export default function DesktopCallbackPage() {
    const [status, setStatus] = useState<'initial' | 'loading' | 'success' | 'error'>('initial');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        try {
            setLoading(true);
            setStatus('loading');
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const idToken = credential?.idToken;
            const accessToken = credential?.accessToken;

            if (!idToken) {
                throw new Error('No Google ID Token found.');
            }

            setStatus('success');
            window.location.href = `nextup://auth?idToken=${idToken}&accessToken=${accessToken || ''}`;

        } catch (error: any) {
            console.error('Auth error:', error);
            setStatus('error');
            if (error.code === 'auth/popup-blocked' || error.message.includes('popup')) {
                setError('Popup blocked! Please check your address bar and allow popups for this site.');
            } else {
                setError(error.message || 'Authentication failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            {status === 'initial' && (
                <div className="flex flex-col items-center gap-6 max-w-sm border p-8 rounded-xl shadow-lg bg-card">
                    <LogIn className="h-10 w-10 text-primary" />
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">Sign In to NextUp</h1>
                        <p className="text-muted-foreground text-sm">Click the button below to continue with Google Sign In.</p>
                    </div>
                    <Button
                        onClick={handleSignIn}
                        size="lg"
                        className="w-full"
                        disabled={loading}
                    >
                        continue with Google
                    </Button>
                </div>
            )}

            {status === 'loading' && (
                <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium">Connecting to Google...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">Success!</h1>
                        <p className="text-muted-foreground">Redirecting back to NextUp...</p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => window.location.href = `nextup://auth`}
                        className="mt-2"
                    >
                        Open App Manually
                    </Button>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center gap-6 max-w-sm animate-in fade-in zoom-in-95 duration-300">
                    <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
                        <XCircle className="h-12 w-12 text-red-600 dark:text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">Sign In Failed</h1>
                        <p className="text-sm text-muted-foreground text-balance">{error}</p>
                    </div>
                    <Button onClick={handleSignIn} size="lg" className="mt-2">
                        Try Again
                    </Button>
                </div>
            )}
        </div>
    );
}
