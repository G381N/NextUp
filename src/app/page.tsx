import { Brain, Zap, ListChecks } from 'lucide-react';
import AnimatedLandingPage from '@/components/app/animated-landing-page';
import LandingHeader from '@/components/app/landing-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  const features = [
    {
      icon: <ListChecks className="mb-4 h-12 w-12 text-primary" />,
      title: 'Add Tasks, Your Way',
      description:
        'Quickly capture tasks by typing, speaking, or even snapping a photo of a handwritten list.',
    },
    {
      icon: <Brain className="mb-4 h-12 w-12 text-primary" />,
      title: 'Let AI Do the Thinking',
      description:
        'Our smart algorithm analyzes your tasks, identifying quick wins and high-impact items.',
    },
    {
      icon: <Zap className="mb-4 h-12 w-12 text-primary" />,
      title: 'Build Momentum',
      description:
        'Your new, prioritized list helps you knock out small wins first, keeping you motivated all day.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center gap-6 px-4 py-16 text-center md:py-24 lg:py-32">
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
            <Zap className="h-4 w-4 text-primary" />
            <span>Powered by AI</span>
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Focus on What's Next
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            NextUp is the smart task manager that automatically prioritizes your
            to-do list, helping you build momentum and get more done.
          </p>
        </section>

        <AnimatedLandingPage />

        <section id="features" className="py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
                A Smarter Way to Manage Your Day
              </h2>
              <p className="mt-4 text-lg text-muted-foreground md:text-xl">
                NextUp gives you the tools to conquer your to-do list with
                confidence.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col text-center">
                  <CardHeader className="items-center">
                    {feature.icon}
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 py-8 px-4 text-center sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Built by <span className="font-semibold">Gebin George</span> to help fix procrastination when we have too much to do.
          </p>
          <Button variant="outline" asChild>
            <a
              href="https://gebin.net"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Portfolio
            </a>
          </Button>
        </div>
      </footer>
    </div>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
