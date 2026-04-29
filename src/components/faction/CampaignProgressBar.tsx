import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CampaignProgressBarProps {
  currentPoints: number;
  targetGoal: number;
  currentPercent: number;
  expectedPercent: number;
  isAheadOfPace: boolean;
}

export const CampaignProgressBar: React.FC<CampaignProgressBarProps> = ({
  currentPoints,
  targetGoal,
  currentPercent,
  expectedPercent,
  isAheadOfPace,
}) => {
  const t = useTranslations('FactionTools.campaign');

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-xl font-bold mb-1">{t('progress')}</h3>
          <div className="flex items-center gap-2 text-sm">
            {isAheadOfPace ? (
              <span className="text-green-500 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" /> {t('ahead')}
              </span>
            ) : (
              <span className="text-orange-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-4 h-4" /> {t('behind')}
              </span>
            )}
            <span className="text-muted-foreground">
              ({t('expected')}: {expectedPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-black tracking-tight text-primary">
            {currentPercent.toFixed(1)}%
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {currentPoints.toLocaleString()} / {targetGoal.toLocaleString()}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress-stripes {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
        .animate-stripes {
          background-image: linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent);
          background-size: 1rem 1rem;
          animation: progress-stripes 1s linear infinite;
        }
      `}</style>

      <div className="relative h-6 w-full bg-muted rounded-full overflow-hidden">
        {/* Expected Pace Marker */}
        <div
          className="absolute top-0 bottom-0 border-r-2 border-dashed border-foreground/30 z-20 transition-all duration-1000"
          style={{ left: `${expectedPercent}%` }}
        >
          <div className="absolute -top-6 -translate-x-1/2 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
            {t('today')}
          </div>
        </div>

        {/* Actual Progress */}
        <div
          className={`absolute top-0 left-0 h-full z-10 transition-all duration-1000 ease-out rounded-r-full
            ${isAheadOfPace ? 'bg-primary' : 'bg-orange-500'}`}
          style={{ width: `${currentPercent}%` }}
        >
          {/* Animated Overlay */}
          <div className="absolute inset-0 rounded-r-full animate-stripes opacity-50" />
        </div>
      </div>
    </div>
  );
};
