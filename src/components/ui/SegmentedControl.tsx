import React from 'react';

interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string | number>({ options, value, onChange, className = '', size = 'sm' }: SegmentedControlProps<T>) {
  return (
    <div className={`flex items-center bg-muted border border-border rounded-lg p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          onClick={() => onChange(option.value)}
          className={`rounded-md font-medium transition-all ${value === option.value
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:text-foreground'
            } ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
