'use client';

import { Calendar, TrendingUp, Flame, Swords } from 'lucide-react';
import { Preloader } from '@/components/Preloader';
import FactionDominanceChart from '../charts/FactionDominanceChart';
import BattleIntensityChart from '../charts/BattleIntensityChart';

interface TimelineEntry {
  timestamp: string;
  battles: number;
  kills: number;
  fame: number;
  participants: number;
}

interface Props {
  timelineData: TimelineEntry[];
  factionData: any[];
  intensityData: any;
  timeRange?: '24h' | '7d' | '30d';
  t: (key: string) => string;
  loading?: boolean;
}

export function AnalyticsDashboard({
  factionData,
  intensityData,
  t,
  loading = false
}: Props) {
  // Check if we have data to display
  const hasData = factionData.length > 0;

  // Show loading state
  if (loading) {
    return (
      <div className="bg-card/50 rounded-2xl border border-border/20 p-12 text-center mb-6">
        <div className="flex flex-col items-center gap-4">
          <Preloader size="lg" showText text={t('loadingAnalytics')} />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-card/50 rounded-2xl border border-border/20 p-12 text-center mb-6">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-bold text-foreground">{t('noAnalyticsData') || 'No analytics data'}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('tryAdjustingFilters') || 'Try adjusting your filters'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 mb-6 animate-fade-in">
      {/* Faction Dominance - Full Width with Details */}
      <div className="animate-fade-in-up delay-100">
        <FactionDominanceChart
          factions={factionData}
          chartType="pie"
          metric="fame"
          showDetails={true}
          t={t}
        />
      </div>

      {/* Battle Intensity - Full Width */}
      <div className="animate-fade-in-up delay-200">
        <BattleIntensityChart distribution={intensityData} t={t} />
      </div>
    </div>
  );
}
