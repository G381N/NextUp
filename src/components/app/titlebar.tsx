'use client';

import { useEffect, useState } from 'react';
import { Minus, Square, X, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicLogo } from './logo';

export function TitleBar() {
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        // Check if running in Electron
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            setIsElectron(true);
        }
    }, []);

    if (!isElectron) return null;

    const handleMinimize = () => {
        (window as any).electronAPI?.minimize();
    };

    const handleMaximize = () => {
        (window as any).electronAPI?.maximize();
    };

    const handleClose = () => {
        (window as any).electronAPI?.close();
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex h-9 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 select-none app-region-drag transition-colors">
            <div className="flex items-center gap-3 app-region-no-drag">
                <PublicLogo iconClassName="h-4 w-4 text-primary" className="text-sm font-medium" />
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-medium tracking-wide text-muted-foreground/60 uppercase">
                NextUp
            </div>

            <div className="flex items-center gap-2 app-region-no-drag">
                <button
                    onClick={handleMinimize}
                    className="group inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-muted hover:text-foreground focus:outline-none transition-colors"
                    title="Minimize"
                >
                    <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={handleMaximize}
                    className="group inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-muted hover:text-foreground focus:outline-none transition-colors"
                    title="Maximize"
                >
                    <Square className="h-3 w-3" />
                </button>
                <button
                    onClick={handleClose}
                    className="group inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-red-500 hover:text-white focus:outline-none transition-colors"
                    title="Close"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            <style jsx global>{`
        .app-region-drag {
          -webkit-app-region: drag;
        }
        .app-region-no-drag {
          -webkit-app-region: no-drag;
        }
      `}</style>
        </div>
    );
}

export function TitleBarLayout({ children }: { children: React.ReactNode }) {
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            setIsElectron(true);
        }
    }, []);

    return (
        <>
            <TitleBar />
            <div
                className={cn(
                    "transition-all duration-200",
                    isElectron
                        ? "fixed top-9 left-0 right-0 bottom-0 overflow-y-auto"
                        : "min-h-screen"
                )}
            >
                {children}
            </div>
        </>
    );
}
