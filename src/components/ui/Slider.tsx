import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  valueDisplay?: React.ReactNode;
  containerClassName?: string;
}

export function Slider({ label, valueDisplay, containerClassName = '', className = '', ...props }: SliderProps) {
  return (
    <div className={containerClassName}>
      {(label || valueDisplay) && (
        <label className="text-xs text-muted-foreground block mb-2 font-medium flex justify-between items-center">
          <span className="flex items-center gap-1">{label}</span>
          {valueDisplay && <span className="text-primary">{valueDisplay}</span>}
        </label>
      )}
      <div className="relative h-[38px] w-full bg-muted/50 border border-input rounded-lg flex items-center px-3 hover:border-input/80 transition-colors">
        <input
          type="range"
          className={`w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer focus:outline-none ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}
