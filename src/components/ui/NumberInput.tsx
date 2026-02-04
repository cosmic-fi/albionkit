import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

interface NumberInputProps {
  label?: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  containerClassName?: string;
  className?: string;
  disabled?: boolean;
  isCustom?: boolean;
  onReset?: () => void;
  placeholder?: string;
}

export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  containerClassName = '',
  className = '',
  disabled = false,
  isCustom = false,
  onReset,
  placeholder,
}: NumberInputProps) {
  
  const handleDecrement = () => {
    if (disabled) return;
    const newValue = value - step;
    if (min !== undefined && newValue < min) return;
    onChange(newValue);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = value + step;
    if (max !== undefined && newValue > max) return;
    onChange(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (isNaN(newValue)) return;
    onChange(newValue);
  };

  return (
    <div className={containerClassName}>
      {label && (
        <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-2">
            {label}
            {isCustom && <span className="text-primary text-[10px] uppercase font-bold">(Custom)</span>}
            </label>
            {isCustom && onReset && (
                <button 
                    onClick={onReset}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Reset to market price"
                    type="button"
                >
                    <RotateCcw className="h-3 w-3" />
                </button>
            )}
        </div>
      )}
      <div className="flex items-center">
        <div className={`
          relative flex items-center w-full bg-input/50 border border-input rounded-lg overflow-hidden transition-colors focus-within:border-primary
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-input/80'}
          ${className}
        `}>
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || (min !== undefined && value <= min)}
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-r border-border/50"
          >
            <Minus className="h-4 w-4" />
          </button>
          
          <input
            type="number"
            value={value}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full bg-transparent text-center text-foreground text-sm font-medium focus:outline-none appearance-none px-2 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || (max !== undefined && value >= max)}
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-l border-border/50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
