import React from 'react';

interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed: boolean;
  activeClass?: string;
  inactiveClass?: string;
}

export function Toggle({ pressed, className = '', children, activeClass, inactiveClass, ...props }: ToggleProps) {
  const defaultActive = 'bg-primary/20 border-primary text-primary';
  const defaultInactive = 'bg-secondary border-input text-muted-foreground hover:text-foreground hover:border-border';

  return (
    <button
      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 ${pressed
          ? (activeClass || defaultActive)
          : (inactiveClass || defaultInactive)
        } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
