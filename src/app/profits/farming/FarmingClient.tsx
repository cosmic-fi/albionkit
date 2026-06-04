'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useServer } from '@/hooks/useServer';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import { ItemIcon } from '@/components/ItemIcon';
import { Preloader } from '@/components/Preloader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { ServerSelector } from '@/components/ServerSelector';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  Sprout, Leaf, Flower2, TrendingUp, TrendingDown,
  Coins, MapPin, DollarSign, Scale,
  ChevronDown, ChevronUp, ArrowRight, RefreshCw, Info, CircleHelp
} from 'lucide-react';
import { CROP_DEFINITIONS, Crop } from './constants';
import { getMarketPrices, getMarketVolume, MarketStat, LOCATIONS } from '@/lib/market-service';
import { useAuth } from '@/context/AuthContext';

interface FarmingData extends Crop {
  seedPrice: number;
  seedVolume: number;
  producePrice: number;
  produceVolume: number;
  profit: number;
  profitPerPlot: number;
  roi: number;
  warning?: string;
  isCustomSeedPrice?: boolean;
  isCustomProducePrice?: boolean;
  originalSeedPrice?: number;
  originalProducePrice?: number;
}

const CITIES = LOCATIONS.filter(l => l !== 'Black Market' && l !== 'Caerleon');

const getCropStats = (tier: number, id: string, type: 'crop' | 'herb'): Partial<Crop> => {
  const upperId = id.toUpperCase();
  const seedId = `T${tier}_FARM_${upperId}_SEED`;
  const produceId = `T${tier}_${upperId}`;
  const baseYield = 8;

  let seedReturnRate = 0;
  let seedReturnRateFocus = 0;

  if (tier === 1) {
    seedReturnRate = 0;
    seedReturnRateFocus = 200;
  } else {
    const rates: Record<number, { base: number; focus: number }> = {
      2: { base: 80, focus: 180 },
      3: { base: 86.67, focus: 186.67 },
      4: { base: 91.11, focus: 191.11 },
      5: { base: 93.33, focus: 193.33 },
      6: { base: 94.44, focus: 194.44 },
      7: { base: 95.24, focus: 195.24 },
      8: { base: 96.15, focus: 196.15 }
    };
    const rate = rates[tier];
    if (rate) {
      seedReturnRate = rate.base;
      seedReturnRateFocus = rate.focus;
    }
  }

  return { seedId, produceId, baseYield, seedReturnRate, seedReturnRateFocus };
};

export default function FarmingClient() {
  const t = useTranslations('Farming');
  const tCommon = useTranslations('Common');
  const { server: region, setServer: setRegion } = useServer();
  const { profile } = useAuth();

  const [buyCity, setBuyCity] = useState('Martlock');
  const [sellCity, setSellCity] = useState('Martlock');
  const [category, setCategory] = useState<'crop' | 'herb'>('crop');
  const [usePremium, setUsePremium] = useState(true);
  const [useFocus, setUseFocus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [data, setData] = useState<FarmingData[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof FarmingData; direction: 'asc' | 'desc' }>({
    key: 'profit',
    direction: 'desc'
  });

  useEffect(() => {
    if (profile?.preferences?.defaultMarketLocation) {
      setBuyCity(profile.preferences.defaultMarketLocation);
      setSellCity(profile.preferences.defaultMarketLocation);
    }
  }, [profile]);

  useEffect(() => {
    const generated: Crop[] = CROP_DEFINITIONS.map(def => ({
      id: def.id,
      tier: def.tier,
      type: def.type,
      ...getCropStats(def.tier, def.id, def.type)
    } as Crop));
    setCrops(generated);
  }, []);

  const handleSort = (key: keyof FarmingData) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handlePriceUpdate = (id: string, type: 'seedPrice' | 'producePrice', value: number) => {
    setData(prev => prev.map(row => {
      if (row.id === id) {
        const updated = {
          ...row,
          [type]: value,
          [type === 'seedPrice' ? 'isCustomSeedPrice' : 'isCustomProducePrice']: true
        };
        return recalculateRow(updated);
      }
      return row;
    }));
  };

  const handleResetPrice = (id: string, type: 'seedPrice' | 'producePrice') => {
    setData(prev => prev.map(row => {
      if (row.id === id) {
        const updated = {
          ...row,
          [type]: row[`original${type === 'seedPrice' ? 'SeedPrice' : 'ProducePrice'}`] || 0,
          [type === 'seedPrice' ? 'isCustomSeedPrice' : 'isCustomProducePrice']: false
        };
        return recalculateRow(updated);
      }
      return row;
    }));
  };

  const recalculateRow = (row: FarmingData): FarmingData => {
    const yieldAmount = row.baseYield * (usePremium ? 2 : 1);
    const seedReturn = useFocus ? row.seedReturnRateFocus : row.seedReturnRate;
    const revenue = (yieldAmount * row.producePrice) + ((seedReturn / 100) * row.seedPrice);
    const cost = row.seedPrice;
    const profit = revenue - cost;
    const roi = cost > 0 ? (profit / cost) * 100 : 0;

    return { ...row, profit, profitPerPlot: profit * 9, roi };
  };

  const loadData = useCallback(async () => {
    if (crops.length === 0) return;
    setLoading(true);

    try {
      const filteredCrops = crops.filter(c => c.type === category);
      const seedIds = filteredCrops.map(c => c.seedId);
      const produceIds = filteredCrops.map(c => c.produceId);
      const allItemIds = [...seedIds, ...produceIds];

      const [prices, seedVolumes, produceVolumes] = await Promise.all([
        getMarketPrices(allItemIds, region),
        getMarketVolume(seedIds, region),
        getMarketVolume(produceIds, region)
      ]);

      const calculated = filteredCrops.map(crop => {
        const seedStats = prices.filter(p => p.item_id === crop.seedId && p.city === buyCity);
        const validSeedPrices = seedStats.filter(s => s.sell_price_min > 0).map(s => s.sell_price_min);
        const seedPrice = validSeedPrices.length > 0 ? Math.min(...validSeedPrices) : 0;

        const seedVolData = seedVolumes.find(v => v.item_id === crop.seedId);
        const seedVolume = seedVolData?.data?.[seedVolData.data.length - 1]?.item_count || 0;

        const produceStats = prices.filter(p => p.item_id === crop.produceId && p.city === sellCity);
        const validProducePrices = produceStats.filter(s => s.sell_price_min > 0).map(s => s.sell_price_min);
        const producePrice = validProducePrices.length > 0 ? Math.min(...validProducePrices) : 0;

        const produceVolData = produceVolumes.find(v => v.item_id === crop.produceId);
        const produceVolume = produceVolData?.data?.[produceVolData.data.length - 1]?.item_count || 0;

        let warning = undefined;
        if (seedPrice === 0) warning = t('warningNoSeed');
        else if (producePrice === 0) warning = t('warningNoProduce');

        const yieldAmount = crop.baseYield * (usePremium ? 2 : 1);
        const seedReturn = useFocus ? crop.seedReturnRateFocus : crop.seedReturnRate;
        const revenue = (yieldAmount * producePrice) + ((seedReturn / 100) * seedPrice);
        const cost = seedPrice;
        const profit = revenue - cost;
        const roi = cost > 0 ? (profit / cost) * 100 : 0;

        return {
          ...crop,
          seedPrice,
          seedVolume,
          producePrice,
          produceVolume,
          profit,
          profitPerPlot: profit * 9,
          roi,
          warning,
          originalSeedPrice: seedPrice,
          originalProducePrice: producePrice
        };
      });

      calculated.sort((a, b) => b.profit - a.profit);
      setData(calculated);
    } catch (error) {
      console.error('Farming data error:', error);
    } finally {
      setLoading(false);
    }
  }, [region, buyCity, sellCity, category, crops, usePremium, useFocus, t]);

  useEffect(() => {
    if (crops.length > 0) loadData();
  }, [loadData]);

  const sortedData = [...data].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue: any = a[key];
    let bValue: any = b[key];
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const cityOptions = CITIES.map(city => ({ value: city, label: t(`cities.${city}`) }));
  const allCityOptions = LOCATIONS.map(city => ({ value: city, label: t(`cities.${city}`) }));

  return (
    <PageShell
      title={t('title')}
      backgroundImage='/background/ao-crafting.jpg'
      description={t('description')}
      headerActions={
        <div className="w-full md:w-fit flex items-center justify-between gap-3 md:justify-start">
          <ServerSelector selectedServer={region} onServerChange={setRegion} />
          <Button
            onClick={loadData}
            disabled={loading}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{loading ? tCommon('loading') : tCommon('refresh')}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Category Tabs */}
        <div className="flex gap-2 bg-card p-1 rounded-xl border border-border w-fit">
          <button
            onClick={() => setCategory('crop')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              category === 'crop'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Sprout className="h-4 w-4" /> {t('crops')}
          </button>
          <button
            onClick={() => setCategory('herb')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              category === 'herb'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Flower2 className="h-4 w-4" /> {t('herbs')}
          </button>
        </div>

        {/* Controls Card */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Select
                label={
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span>{t('buySeedsFrom')}</span>
                  </div>
                }
                options={cityOptions}
                value={buyCity}
                onChange={setBuyCity}
              />
            </div>
            <div className="hidden md:flex items-center pb-3">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 w-full">
              <Select
                label={
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span>{t('sellProduceTo')}</span>
                  </div>
                }
                options={allCityOptions}
                value={sellCity}
                onChange={setSellCity}
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
              <Checkbox
                id="premium-toggle"
                checked={usePremium}
                onChange={(e) => setUsePremium(e.target.checked)}
              />
              <div>
                <div className="font-bold text-sm text-green-500">{t('premium')}</div>
                <div className="text-xs text-muted-foreground">{t('premiumDesc')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <Checkbox
                id="focus-toggle"
                checked={useFocus}
                onChange={(e) => setUseFocus(e.target.checked)}
              />
              <div>
                <div className="font-bold text-sm text-blue-500">{t('focus')}</div>
                <div className="text-xs text-muted-foreground">{t('focusDesc')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-5 pl-8 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t('item')}
                  </th>
                  <th className="p-5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-2">
                      <span>{t('profitPerPlot')}</span>
                      <Tooltip content="Estimated profit per 9 squares (1 plot)">
                        <CircleHelp className="h-3.5 w-3.5 text-muted-foreground" />
                      </Tooltip>
                    </div>
                  </th>
                  <th className="p-5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-2">
                      <span>ROI</span>
                      <Tooltip content="Return on Investment (Profit / Cost × 100)">
                        <CircleHelp className="h-3.5 w-3.5 text-muted-foreground" />
                      </Tooltip>
                    </div>
                  </th>
                  <th className="p-5 text-center w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Preloader size="lg" showText text={t('loading')} />
                      </div>
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Sprout className="h-12 w-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">{t('noData')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row) => (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() => toggleRow(row.id)}
                        className={`
                          cursor-pointer transition-all
                          ${expandedRow === row.id 
                            ? 'bg-green-500/5 border-l-4 border-l-green-500' 
                            : 'hover:bg-muted/30 border-l-4 border-l-transparent'
                          }
                        `}
                      >
                        <td className="p-5 pl-8">
                          <div className="flex items-center gap-5">
                            <div className="relative group">
                              <div className="h-14 w-14 bg-muted rounded-xl border border-border flex items-center justify-center group-hover:border-green-500/50 transition-colors">
                                <ItemIcon itemId={row.seedId} className="h-11 w-11 object-contain" />
                              </div>
                              <div className="absolute -bottom-2 -right-2 h-7 w-7 bg-card rounded-full border border-border flex items-center justify-center">
                                <ItemIcon itemId={row.produceId} className="h-4 w-4 object-contain" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-foreground text-base">
                                  {t(`cropNames.${row.id}`)} Seed
                                </span>
                                <span className="text-xs font-bold text-muted-foreground px-2.5 py-1 bg-muted rounded-full border border-border">
                                  T{row.tier}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs text-muted-foreground capitalize">
                                  {t(row.type)}
                                </span>
                                {row.warning && (
                                  <span className="text-xs text-amber-500 flex items-center gap-1.5 font-medium">
                                    <Info className="h-3.5 w-3.5" /> {row.warning}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          <div className={`font-mono font-bold text-lg ${row.profitPerPlot > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {Math.round(row.profitPerPlot).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{t('per9Squares')}</div>
                        </td>
                        <td className="p-5 text-right">
                          <div className={`font-mono font-semibold ${row.roi > 20 ? 'text-green-500' : row.roi > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                            {row.roi.toFixed(1)}%
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <div className={`transition-transform ${expandedRow === row.id ? 'rotate-180' : ''}`}>
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </td>
                      </tr>

                      {expandedRow === row.id && (
                        <tr className="bg-muted/20">
                          <td colSpan={4} className="p-0 border-b border-border">
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Seed Info */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-2.5 mb-3">
                                  <div className="p-2 rounded-lg bg-green-500/10">
                                    <Leaf className="h-4 w-4 text-green-500" />
                                  </div>
                                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                                    {t('seedInfo', { city: buyCity })}
                                  </h4>
                                </div>
                                <div className="bg-card rounded-xl p-5 border border-border space-y-4">
                                  <NumberInput
                                    label={t('seedPrice')}
                                    value={row.seedPrice}
                                    onChange={(val) => handlePriceUpdate(row.id, 'seedPrice', val)}
                                    isCustom={row.isCustomSeedPrice}
                                    onReset={() => handleResetPrice(row.id, 'seedPrice')}
                                  />
                                  <div className="pt-3 border-t border-border">
                                    <div className="flex justify-between items-center mb-3">
                                      <span className="text-sm text-muted-foreground">{t('volume')}</span>
                                      <span className="font-mono font-semibold text-foreground">{row.seedVolume.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">{t('seedReturnRate')}</span>
                                      <span className="font-mono font-bold text-green-500">
                                        {useFocus ? row.seedReturnRateFocus.toFixed(2) : row.seedReturnRate.toFixed(2)}%
                                        <span className="text-xs text-muted-foreground ml-2 font-normal">
                                          ({useFocus ? t('focus') : t('noFocus')})
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Produce Info */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-2.5 mb-3">
                                  <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Flower2 className="h-4 w-4 text-blue-500" />
                                  </div>
                                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                                    {t('produceInfo', { city: sellCity })}
                                  </h4>
                                </div>
                                <div className="bg-card rounded-xl p-5 border border-border space-y-4">
                                  <NumberInput
                                    label={t('producePrice')}
                                    value={row.producePrice}
                                    onChange={(val) => handlePriceUpdate(row.id, 'producePrice', val)}
                                    isCustom={row.isCustomProducePrice}
                                    onReset={() => handleResetPrice(row.id, 'producePrice')}
                                  />
                                  <div className="pt-3 border-t border-border">
                                    <div className="flex justify-between items-center mb-3">
                                      <span className="text-sm text-muted-foreground">{t('volume')}</span>
                                      <span className="font-mono font-semibold text-foreground">{row.produceVolume.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">{t('expectedYield')}</span>
                                      <span className="font-mono font-bold text-blue-500">
                                        {row.baseYield * (usePremium ? 2 : 1)}
                                        <span className="text-xs text-muted-foreground ml-2 font-normal">
                                          ({usePremium ? t('premium') : t('standard')})
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Profit Analysis */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-2.5 mb-3">
                                  <div className="p-2 rounded-lg bg-purple-500/10">
                                    <Scale className="h-4 w-4 text-purple-500" />
                                  </div>
                                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                                    {t('profitAnalysis')}
                                  </h4>
                                </div>
                                <div className="bg-card rounded-xl p-5 border border-purple-500/20 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{t('revenuePerSeed')}</span>
                                    <span className="font-mono font-bold text-foreground">
                                      {Math.round((row.baseYield * (usePremium ? 2 : 1) * row.producePrice) + 
                                        ((useFocus ? row.seedReturnRateFocus : row.seedReturnRate) / 100 * row.seedPrice)).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{t('costPerSeed')}</span>
                                    <span className="font-mono font-bold text-red-500">-{row.seedPrice.toLocaleString()}</span>
                                  </div>
                                  <div className="h-px bg-border" />
                                  <div className="flex justify-between items-center pt-1">
                                    <span className="text-sm font-bold text-foreground">{t('netProfitPerSeed')}</span>
                                    <span className={`font-mono font-bold text-lg ${row.profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                      {Math.round(row.profit).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <InfoStrip currentPage="profits-farming" />
    </PageShell>
  );
}
