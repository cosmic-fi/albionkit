'use client';

import { Swords } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Preloader } from '@/components/Preloader';

// Full page loading - Global style
export function ZvZTrackerLoading() {
  const t = useTranslations('ZvzTracker');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Preloader size="lg" showText text={t('loadingBattles')} />
    </div>
  );
}

// Battle card skeleton
export function BattleCardSkeleton() {
  return (
    <div className="bg-card/80 border border-border/30 rounded-2xl overflow-hidden animate-pulse">
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-muted/20 rounded-xl h-12 w-12" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-32 bg-muted/20 rounded" />
              <div className="flex items-center gap-4">
                <div className="h-4 w-20 bg-muted/20 rounded" />
                <div className="h-4 w-20 bg-muted/20 rounded" />
                <div className="h-4 w-20 bg-muted/20 rounded" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:flex-initial text-right pr-4 border-r border-border">
              <div className="h-3 w-16 bg-muted/20 rounded ml-auto mb-1" />
              <div className="h-6 w-24 bg-muted/20 rounded ml-auto" />
            </div>
            <div className="h-8 w-8 bg-muted/20 rounded-full" />
            <div className="h-5 w-5 bg-muted/20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard skeleton
export function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="bg-card/50 border border-border p-4 sm:p-5 rounded-xl sm:rounded-2xl animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-10 w-10 bg-muted/20 rounded-xl" />
              <div className="h-3 w-20 bg-muted/20 rounded" />
            </div>
            <div className="h-8 w-32 bg-muted/20 rounded mb-2" />
            <div className="h-3 w-24 bg-muted/20 rounded" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card/50 border border-border p-4 sm:p-6 rounded-2xl animate-pulse">
          <div className="h-6 w-40 bg-muted/20 rounded mb-4" />
          <div className="h-[300px] bg-muted/20 rounded-xl" />
        </div>
        <div className="bg-card/50 border border-border p-4 sm:p-6 rounded-2xl animate-pulse" style={{ animationDelay: '100ms' }}>
          <div className="h-6 w-40 bg-muted/20 rounded mb-4" />
          <div className="h-[300px] bg-muted/20 rounded-xl" />
        </div>
      </div>

      {/* Intensity Chart */}
      <div className="bg-card/50 border border-border p-4 sm:p-6 rounded-2xl animate-pulse" style={{ animationDelay: '200ms' }}>
        <div className="h-6 w-40 bg-muted/20 rounded mb-4" />
        <div className="h-[200px] bg-muted/20 rounded-xl" />
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card/50 border border-border rounded-2xl overflow-hidden">
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="h-10 flex-1 bg-muted/20 rounded-lg" />
            <div className="h-10 flex-1 bg-muted/20 rounded-lg" />
            <div className="h-10 flex-1 bg-muted/20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Tab content skeleton
export function BattleDetailsSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-pulse">
      {/* Faction comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-40 bg-muted/20 rounded-2xl" />
        <div className="h-40 bg-muted/20 rounded-2xl" />
      </div>

      {/* Dominance bar */}
      <div className="h-2 bg-muted/20 rounded-full" />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 w-28 bg-muted/20 rounded-xl shrink-0" />
        ))}
      </div>

      {/* MVP cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-muted/20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// Battle list skeleton (for main feed)
export function BattleListSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      <AnalyticsDashboardSkeleton />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <BattleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Shimmer loading effect for cards
export function ShimmerCard() {
  return (
    <div className="relative overflow-hidden bg-card/50 border border-border rounded-2xl p-6">
      <div className="absolute inset-0 animate-shimmer-gradient" />
      <div className="relative space-y-4">
        <div className="h-6 w-32 bg-muted/30 rounded" />
        <div className="h-4 w-full bg-muted/30 rounded" />
        <div className="h-4 w-2/3 bg-muted/30 rounded" />
      </div>
    </div>
  );
}
