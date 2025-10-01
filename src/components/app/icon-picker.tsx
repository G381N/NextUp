import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { iconNames, getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { LucideProps } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const SelectedIcon = getIcon(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('h-12 w-12 rounded-full p-0', className)}
        >
          <SelectedIcon className="h-6 w-6 text-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-5 gap-2">
          {iconNames.map((name) => {
            const Icon = getIcon(name);
            return (
              <Button
                key={name}
                variant={value === name ? 'default' : 'ghost'}
                size="icon"
                onClick={() => onChange(name)}
                className="h-10 w-10 rounded-md"
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Made by Gebin George. Check out my other work on gebin.net
