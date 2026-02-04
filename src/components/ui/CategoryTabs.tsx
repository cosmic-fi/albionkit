import React from 'react';

export interface CategoryTabOption<T extends string = string> {
  value: T;
  label: string;
}

interface CategoryTabsProps<T extends string = string> {
  options: CategoryTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function CategoryTabs<T extends string = string>({ 
  options, 
  value, 
  onChange, 
  className = '' 
}: CategoryTabsProps<T>) {
  return (
    <div className={`flex p-1 bg-muted/50 rounded-lg border border-border w-full md:w-fit ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all
            ${value === option.value 
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
