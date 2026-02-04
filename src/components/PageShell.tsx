import React from 'react';
import { Hammer, Construction } from 'lucide-react';

interface PageShellProps {
  title: string;
  enableHeader?: boolean;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  headerActions?: React.ReactNode;
  isUnderConstruction?: boolean;
  backgroundImage?: string;
}

export function PageShell({ title, enableHeader = true, description, icon, children, headerActions, isUnderConstruction, backgroundImage }: PageShellProps) {
  return (
    <div className="flex flex-col min-h-full">
      {enableHeader && (
        <div className="relative border-b border-border">
          {backgroundImage && (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-center opacity-40"
                style={{ backgroundImage: `url(${backgroundImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
            </div>
          )}
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-4 pb-6 pt-10 flex flex-col gap-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {icon && <div className="p-2 bg-card/50 rounded-lg text-primary backdrop-blur-sm">{icon}</div>}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground shadow-black/50 drop-shadow-md">{title}</h1>
              </div>
              {headerActions && (
                <div className="flex items-center gap-3">
                  {headerActions}
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-lg max-w-3xl drop-shadow-sm">{description}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-4 py-6 w-full flex-1">
        {isUnderConstruction ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/30 border border-border border-dashed rounded-xl">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Construction className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md text-center">
              We're currently building this {title.toLowerCase()} tool. 
              Check back later for updates!
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
