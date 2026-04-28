'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { TrendingUp, ArrowRight, Info, Truck } from 'lucide-react';
import { FACTION_CITIES } from '@/data/faction-data';
import { Tooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';

interface TransportRoute {
  sourceCity: string;
  targetCity: string;
  heartId: string;
  heartName: string;
  sourcePrice: number;
  targetPrice: number;
  netProfit: number;
  roi: number;
}

interface TransportMatrixProps {
  data: TransportRoute[];
  quantity: number;
}

export function TransportMatrix({ data, quantity }: TransportMatrixProps) {
  const t = useTranslations('FactionTools.transport');
  const t_cities = useTranslations('Settings.cities');
  const t_items = useTranslations('items');

  const getRoute = (source: string, target: string) => {
    return data.find(r => r.sourceCity === source && r.targetCity === target);
  };

  const formatSilver = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 100).toFixed(1)}k`;
    return value.toLocaleString();
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-4 text-left border-b border-border bg-muted/50 font-bold sticky left-0 z-10 backdrop-blur-md">
              {t('source')} \ {t('destination')}
            </th>
            {FACTION_CITIES.map(city => (
              <th key={city} className="p-4 text-center border-b border-border bg-muted/30 font-bold min-w-[140px]">
                {t_cities(city as any)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FACTION_CITIES.map(sourceCity => (
            <tr key={sourceCity} className="hover:bg-primary/5 transition-colors group">
              <td className="p-4 font-bold border-b border-border bg-muted/20 sticky left-0 z-10 backdrop-blur-md group-hover:bg-primary/10">
                {t_cities(sourceCity as any)}
              </td>
              {FACTION_CITIES.map(targetCity => {
                if (sourceCity === targetCity) {
                  return (
                    <td key={targetCity} className="p-4 border-b border-border bg-background/50 text-center text-muted-foreground/30 italic">
                      —
                    </td>
                  );
                }

                const route = getRoute(sourceCity, targetCity);
                if (!route) {
                  return (
                    <td key={targetCity} className="p-4 border-b border-border text-center text-muted-foreground italic">
                      N/A
                    </td>
                  );
                }

                const isProfitable = route.roi > 0;
                const isHighlyProfitable = route.roi > 10;

                return (
                  <td key={targetCity} className="p-2 border-b border-border text-center relative">
                    <Tooltip content={
                      <div className="space-y-1">
                        <p className="font-bold">{t_items(route.heartId as any)}</p>
                        <p className="text-xs text-muted-foreground">{t('source')}: {route.sourcePrice.toLocaleString()} {t('silver')}</p>
                        <p className="text-xs text-muted-foreground">{t('destination')}: {route.targetPrice.toLocaleString()} {t('silver')}</p>
                        <p className="text-xs text-success font-medium">{t('profit')}: +{route.netProfit.toLocaleString()} {t('silver')}</p>
                      </div>
                    }>
                      <div className={`p-2 rounded-xl transition-all ${
                        isHighlyProfitable ? 'bg-success/15 border border-success/30 scale-[1.02]' :
                        isProfitable ? 'bg-success/5 border border-success/10' :
                        'bg-destructive/5 border border-destructive/10'
                      }`}>
                        <div className={`font-bold ${isProfitable ? 'text-success' : 'text-destructive'}`}>
                          {route.roi.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {formatSilver(route.netProfit)}
                        </div>
                      </div>
                    </Tooltip>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
