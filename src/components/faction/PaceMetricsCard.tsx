import React from 'react';
import { Target, TrendingUp, CalendarDays, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PaceMetricsCardProps {
  pointsPerDay: number;
  pointsPerWeek: number;
  daysLeft: number;
  isCompleted: boolean;
}

export const PaceMetricsCard: React.FC<PaceMetricsCardProps> = ({
  pointsPerDay,
  pointsPerWeek,
  daysLeft,
  isCompleted
}) => {
  const t = useTranslations('FactionTools.campaign');

  if (isCompleted) {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center py-12">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-primary-foreground" />
        </div>
        <h3 className="text-2xl font-bold text-primary mb-2">{t('goalReached')}</h3>
        <p className="text-muted-foreground">{t('goalReachedDesc')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        {t('requiredPacing')}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Pace */}
        <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">{t('dailyGoal')}</span>
          </div>
          <div className="text-3xl font-mono font-black text-foreground">
            {pointsPerDay.toLocaleString()}
            <span className="text-sm font-medium text-muted-foreground ml-2">{t('ptsPerDay')}</span>
          </div>
        </div>

        {/* Weekly Pace */}
        <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">{t('weeklyGoal')}</span>
          </div>
          <div className="text-3xl font-mono font-black text-foreground">
            {pointsPerWeek.toLocaleString()}
            <span className="text-sm font-medium text-muted-foreground ml-2">{t('ptsPerWeek')}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center text-xs text-muted-foreground font-medium bg-muted/50 py-3 rounded-xl">
        {t('calculationNote', { days: daysLeft })}
      </div>
    </div>
  );
};
