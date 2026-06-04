'use client';

import { PawPrint } from 'lucide-react';
import { Preloader } from '@/components/Preloader';

interface Props {
  message?: string;
  showIcon?: boolean;
}

export function AnimalTableSkeleton() {
  return (
    <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              <th className="p-4 font-medium pl-8">
                <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
              </th>
              <th className="p-4 font-medium text-right">
                <div className="h-4 w-20 bg-muted/50 rounded ml-auto animate-pulse" />
              </th>
              <th className="p-4 font-medium text-right">
                <div className="h-4 w-24 bg-muted/50 rounded ml-auto animate-pulse" />
              </th>
              <th className="p-4 font-medium text-right">
                <div className="h-4 w-16 bg-muted/50 rounded ml-auto animate-pulse" />
              </th>
              <th className="p-4 font-medium text-center w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-l-2 border-l-transparent">
                <td className="p-4 pl-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-muted/50 rounded-lg border border-border animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-muted/50 rounded animate-pulse" />
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="h-4 w-16 bg-muted/50 rounded ml-auto animate-pulse" />
                </td>
                <td className="p-4 text-right">
                  <div className="h-4 w-20 bg-muted/50 rounded ml-auto animate-pulse" />
                </td>
                <td className="p-4 text-right">
                  <div className="h-4 w-12 bg-muted/50 rounded ml-auto animate-pulse" />
                </td>
                <td className="p-4 text-center">
                  <div className="h-4 w-4 bg-muted/50 rounded ml-auto animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AnimalLoadingState({ message = 'Fetching market data...', showIcon = true }: Props) {
  return (
    <div className="bg-card/50 rounded-xl border border-border p-12">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative">
          {/* Animated ring effect */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
          <div className="relative bg-primary/10 p-4 rounded-full">
            <Preloader size="lg" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-foreground font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">
            Fetching real-time market prices from Albion Online API
          </p>
        </div>

        {/* Progress indicator */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden mt-4">
          <div className="h-full bg-primary animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function AnimalEmptyState({ category }: { category?: string }) {
  return (
    <div className="bg-card/50 rounded-xl border border-border p-12">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="bg-muted/50 p-4 rounded-full">
          <PawPrint className="h-8 w-8 text-muted-foreground/50" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">No animals found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {category 
              ? `No animals available for ${category} mode. Try switching to a different tab.`
              : 'No animals match your current filters. Try adjusting your criteria.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AnimalErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="bg-destructive/10 rounded-xl border border-destructive/20 p-12">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="bg-destructive/20 p-4 rounded-full">
          <PawPrint className="h-8 w-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-destructive">Error loading data</h3>
          <p className="text-sm text-destructive/80 max-w-md">{error}</p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-6 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium text-sm"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
