'use client';

import React from 'react';

export interface Option<T extends string = string> {
  value: T;
  label: string;
  color?: 'green' | 'red' | 'amber' | 'blue' | 'slate';
}

interface OptionSelectorProps<T extends string = string> {
  options: Option<T>[];
  selected: T;
  onChange: (value: T) => void;
  className?: string;
}

const colorStyles = {
  green: 'bg-success/20 text-success border-success/20',
  red: 'bg-destructive/20 text-destructive border-destructive/20',
  amber: 'bg-warning/20 text-warning border-warning/20',
  blue: 'bg-info/20 text-info border-info/20',
  slate: 'bg-secondary text-secondary-foreground border-border',
};

export function OptionSelector<T extends string = string>({ 
  options, 
  selected, 
  onChange, 
  className = '' 
}: OptionSelectorProps<T>) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        const activeColorClass = option.color && colorStyles[option.color] 
          ? colorStyles[option.color] 
          : colorStyles.slate;
          
        const baseClass = "px-3 py-1 rounded text-sm border transition-colors";
        const stateClass = isSelected 
          ? activeColorClass 
          : "bg-muted text-muted-foreground border-border hover:bg-accent";

        return (
          <button
            key={option.value}
            className={`${baseClass} ${stateClass}`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
