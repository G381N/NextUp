'use client';

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { PublicLogo } from './logo';

const AnimatedLandingPage = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sequence = [
      () => setStep(1), // Intro: Show logo
      () => setStep(2), // Show unsorted list
      () => setStep(3), // Prioritize button glows
      () => setStep(4), // Prioritizing animation starts
      () => setStep(5), // Outro: Show sorted list
      () => setStep(0), // Loop back to the start (logo)
    ];

    const timers = [
      100,    // Initial delay before showing logo
      2000,   // Show logo
      4000,   // Show unsorted list and "Let the AI figure out..."
      4000,   // Hold on "Let the AI figure out..."
      2500,   // Show "Prioritizing..."
      4000,   // Show sorted list
      2500,   // Reset
    ];

    let currentStep = 0;
    let timer: NodeJS.Timeout;
    
    const runSequence = () => {
      const stepIndex = currentStep % sequence.length;
      
      timer = setTimeout(() => {
        sequence[stepIndex]();
        currentStep++;
        runSequence();
      }, timers[stepIndex]);
    };

    runSequence();

    return () => clearTimeout(timer);
  }, []);

  const tasks = [
    { id: 1, title: 'Draft quarterly report', initialOrder: 1, finalOrder: 4 },
    { id: 2, title: 'Quick call with the design team', initialOrder: 2, finalOrder: 1 },
    { id: 3, title: 'Integrate new API for event', initialOrder: 3, finalOrder: 3 },
    { id: 4, title: 'Reply to support email', initialOrder: 4, finalOrder: 2 },
  ];
  
  const stepMessages = [
    "", // Step 0 (Logo)
    "", // Step 1 (Logo)
    "Here is your to-do list for the day.", // Step 2
    <span key="step3-message">Let the AI figure out what's <span className="animate-glow font-medium text-foreground">NextUp</span>...</span>, // Step 3
    "Prioritizing based on impact and effort...", // Step 4
    "Your prioritized list is ready!", // Step 5
  ];

  const showTasks = step >= 2 && step <= 5;

  return (
    <div className="relative mx-auto w-full max-w-4xl px-4 animate-fade-in-up" style={{animationDelay: '300ms'}}>
      <div
        className="relative mx-auto flex min-h-[450px] w-full max-w-2xl flex-col items-center justify-center rounded-xl border-2 border-primary/10 bg-card shadow-2xl shadow-primary/5 transition-opacity duration-500"
        data-step={step}
      >
        {/* Logo Intro/Outro */}
        <div className={cn(
            "absolute inset-0 flex items-center justify-center bg-card transition-opacity duration-500",
            showTasks ? 'opacity-0 z-0' : 'opacity-100 z-10'
        )}>
            <PublicLogo iconClassName="h-10 w-10" className="text-4xl animate-spring-in" />
        </div>

        {/* Header */}
        <div className="flex w-full items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
            <div className="h-3 w-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex-1 px-4">
            <div className="w-full rounded-md bg-secondary px-2 py-1 text-center text-sm text-muted-foreground">
              nextup.gebin.net
            </div>
          </div>
          <div className="w-12" />
        </div>

        {/* Content */}
        <div className="w-full flex-1 p-4">
          <div className="mb-4 h-6 text-center text-sm font-medium text-muted-foreground transition-opacity duration-500">
             {showTasks && <div className="animate-fade-in-down">{stepMessages[step]}</div>}
          </div>
          <div className="relative flex flex-col gap-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-all duration-1000 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)]',
                   step >= 4 ? 'order-[var(--final-order)]' : 'order-[var(--initial-order)]',
                   showTasks ? 'opacity-100' : 'opacity-0',
                   'animate-spring-in'
                )}
                style={{
                    '--initial-order': task.initialOrder,
                    '--final-order': task.finalOrder,
                    animationDelay: `${(task.initialOrder * 100)}ms`
                } as React.CSSProperties}
              >
                <div className={cn(
                    'h-5 w-5 flex-shrink-0 rounded-sm border-2 border-muted transition-all duration-500',
                     step === 5 && 'animate-check-fill'
                )}>
                </div>
                <span className="flex-1 text-sm font-medium text-card-foreground">
                  {task.title}
                </span>
                {step === 5 && (
                     <Check className="h-4 w-4 text-green-500 opacity-0 animate-fade-in" style={{animationDelay: `calc(var(--final-order) * 200ms + 1000ms)`}}/>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="w-full border-t p-3 text-center">
            <div className={cn("transition-all duration-500", (step >= 3) ? 'opacity-100' : 'opacity-0')}>
                {step < 4 ? (
                    <Button variant="outline" size="sm" className={cn(step === 3 && 'animate-glow-shadow-sm')}>
                        Prioritize with AI
                    </Button>
                ) : (
                    <span className="text-sm font-medium text-muted-foreground animate-pulse">
                        Prioritizing...
                    </span>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedLandingPage;

// Made by Gebin George. Check out my other work on gebin.net
