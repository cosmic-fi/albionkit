'use client';

import React from 'react';
import { BANDIT_SCHEDULES, ServerRegion } from '@/data/bandit-schedule';
import { getNextWindow } from '@/lib/bandit-service';
import { useTranslations } from 'next-intl';

interface BanditScheduleListProps {
  region: ServerRegion;
}

export const BanditScheduleList: React.FC<BanditScheduleListProps> = ({ region }) => {
  const t = useTranslations('FactionTools.bandit');
  const schedule = BANDIT_SCHEDULES[region];
  const { window: nextWindow } = getNextWindow(region);

  return (
    <div className="w-full bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="space-y-2">
          {schedule.map((window, index) => {
            const isNext = window.utcHour === nextWindow.utcHour;
            const probabilityColor = window.chance >= 0.6 
              ? 'bg-green-500/10 text-green-500' 
              : window.chance >= 0.4 
                ? 'bg-yellow-500/10 text-yellow-500' 
                : 'bg-muted/10 text-muted-foreground';

            return (
              <div 
                key={index} 
                className={`flex justify-between items-center p-3 rounded-xl border ${isNext ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'}`}
              >
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${isNext ? 'text-primary' : ''}`}>
                    {window.utcHour.toString().padStart(2, '0')}:00
                  </span>
                  {isNext && <span className="text-[10px] uppercase font-bold text-primary">{t('nextWindowLabel')}</span>}
                </div>
                
                <div className={`px-2 py-1 rounded text-xs font-bold ${probabilityColor}`}>
                  {t('chance', { chance: Math.round(window.chance * 100) })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
