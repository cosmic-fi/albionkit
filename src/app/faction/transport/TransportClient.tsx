'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Truck, TrendingUp, Info, RefreshCw, Coins, ArrowRightLeft } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { TransportMatrix } from '@/components/faction/TransportMatrix';
import { getHeartTransportMatrix } from '@/lib/faction-service';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { NumberInput } from '@/components/ui/NumberInput';
import { Tooltip } from '@/components/ui/Tooltip';
import { toast } from 'sonner';

export default function TransportClient() {
  const t = useTranslations('FactionTools.transport');
  const { server: region, setServer: setRegion } = useServer();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await getHeartTransportMatrix(region, quantity);
      setData(results);
    } catch (error) {
      console.error('Failed to fetch transport data:', error);
      toast.error('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [region]); // Re-fetch on region change. Quantity is handled locally for efficiency or re-fetched.

  // Re-calculate or re-fetch on quantity change? 
  // Since we fetch only one heart type (best) per route, we might need to re-fetch if quantity affects best heart (it shouldn't since tax is linear).
  // But let's re-fetch to be safe or if we want to show total profit.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [quantity]);

  return (
    <PageShell
      title={t('title')}
      description={t('subtitle')}
      backgroundImage='/background/ak-factions.jpeg'
      headerActions={
        <div className="flex items-center gap-3">
          <ServerSelector
            selectedServer={region}
            onServerChange={setRegion}
          />
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 p-6 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{t('configuration')}</h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {t('quantity')}
                <Tooltip content={t('quantityTooltip')}>
                  <Info className="h-3 w-3 cursor-help" />
                </Tooltip>
              </label>
              <NumberInput
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={999}
                className="w-full"
              />
            </div>

            <div className="pt-2">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {t.rich('calcNote', {
                    strong: (chunks) => <strong>{chunks}</strong>,
                    b: (chunks) => <strong>{chunks}</strong>
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-success/5 border border-success/10 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-success/60 mb-1">{t('maxRoiRoute')}</p>
                <h4 className="text-xl font-bold text-success">
                  {data.length > 0 ? `${Math.max(...data.map(r => r.roi)).toFixed(1)}%` : '—'}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {data.length > 0 ? (
                  <>{t('best')}: <span className="text-foreground font-medium">{data.sort((a, b) => b.roi - a.roi)[0].sourceCity} → {data.sort((a, b) => b.roi - a.roi)[0].targetCity}</span></>
                ) : t('loading')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary/60 mb-1">{t('maxProfitRun')}</p>
                <h4 className="text-xl font-bold text-primary">
                  {data.length > 0 ? (Math.max(...data.map(r => r.netProfit)).toLocaleString() + ' ' + t('silver')) : '—'}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t.rich('basedOnQuantity', {
                  quantity,
                  span: (chunks) => <span className="text-foreground font-medium">{chunks}</span>
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Matrix */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-20 bg-background/50 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-3 bg-card p-6 rounded-2xl border border-border shadow-xl">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="font-medium">{t('updating')}</p>
              </div>
            </div>
          )}

          <TransportMatrix data={data} quantity={quantity} />
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border">
          <Info className="h-4 w-4 shrink-0" />
          <p>
            {t('matrixNote')}
          </p>
        </div>
      </div>
    </PageShell>
  );
}

