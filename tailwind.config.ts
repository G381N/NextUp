import type { Config } from 'tailwindcss';
const { fontFamily } = require('tailwindcss/defaultTheme');

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-geist-sans)', ...fontFamily.sans],
        headline: ['var(--font-geist-sans)', ...fontFamily.sans],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in-up': {
            '0%': {
                opacity: '0',
                transform: 'translateY(10px)'
            },
            '100%': {
                opacity: '1',
                transform: 'translateY(0)'
            },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        'check-fill': {
            '0%, 50%': { 'background-color': 'transparent' },
            '100%': { 'background-color': 'hsl(var(--primary))', 'border-color': 'hsl(var(--primary))' },
        },
        'glow-shadow-sm': {
            '0%, 100%': { 'box-shadow': '0 0 4px hsl(var(--primary))' },
            '50%': { 'box-shadow': '0 0 8px hsl(var(--primary))' },
        },
        'glow': {
          '0%, 100%': { 'text-shadow': '0 0 4px hsl(var(--foreground)), 0 0 8px hsl(var(--foreground))' },
          '50%': { 'text-shadow': '0 0 8px hsl(var(--foreground)), 0 0 16px hsl(var(--foreground))' },
        },
        'spring-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.8) translateY(20px)',
          },
          '70%': {
            opacity: '1',
            transform: 'scale(1.05) translateY(0)',
          },
          '100%': {
            transform: 'scale(1) translateY(0)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-in-out forwards',
        'fade-in-down': 'fade-in-down 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'typing': 'typing 1.5s steps(30, end) forwards',
        'check-fill': 'check-fill 0.4s ease-in-out forwards 1s',
        'glow-shadow-sm': 'glow-shadow-sm 1.5s ease-in-out infinite',
        'spring-in': 'spring-in 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'glow': 'glow 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;

// Made by Gebin George. Check out my other work on gebin.net
