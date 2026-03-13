'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageShell } from '@/components/PageShell';
import { useAuth } from '@/context/AuthContext';
import { Fish, RefreshCw, ChevronUp, ChevronDown, AlertCircle, CircleHelp } from 'lucide-react';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { getMarketPrices, getMarketVolume, LOCATIONS } from '@/lib/market-service';
import { getItemNameService } from '@/lib/item-service';
import { FISH_DEFINITIONS, CHOPPED_FISH_PRODUCT_ID, FishType } from './constants';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tooltip } from '@/components/ui/Tooltip';
import { useTranslations, useLocale } from 'next-intl';

// Helper to generate fish stats
const getFishStats = (tier: number, isRare: boolean = false, id: string): Partial<FishType> => {
  // Yield Calculation
  let choppedYield = 0;
  
  if (id.includes('SHARK')) {
      choppedYield = 40;
  } else if (isRare) {
      const rareYields: Record<number, number> = { 3: 10, 5: 20, 7: 30, 8: 40 };
      choppedYield = rareYields[tier] || 10;
  } else {
      // Common: 3, 4, 6, 8, 10, 12
      const commonYields: Record<number, number> = { 3: 3, 4: 4, 5: 6, 6: 8, 7: 10, 8: 12 };
      choppedYield = commonYields[tier] || 0;
  }

  // Name formatting (Fallback if API doesn't provide it)
  // T3_FISH_SALTWATER_ALL_COMMON -> Flatshore Plaice (approx)
  // We'll generate a generic name based on ID if needed
  const name = id.split('_').slice(2).join(' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  return {
    choppedYield,
    name
  };
};

interface FishData extends FishType {
  fishPrice: number;
  fishVolume: number;
  choppedFishPrice: number;
  
  // Calculated
  fishCost: number; // Unit cost including fees
  fishRequired: number; // For target chopped fish amount
  revenueTotal: number; // Revenue per 1 Fish chopped
  pricePerChopped: number; // Effective cost of 1 chopped fish
  profit: number; // Total profit for the target amount
  roi: number;
  
  // UI State
  missingData: boolean;

  // Custom Price State
  isCustomFishPrice?: boolean;
  isCustomChoppedPrice?: boolean;
  originalFishPrice?: number;
  originalChoppedPrice?: number;
}

const CITY_OPTIONS = LOCATIONS.filter(l => l !== 'Black Market').map(city => ({ value: city, label: city }));

export default function ChoppedFishClient() {
  const t = useTranslations('ChoppedFish');
  const tCommon = useTranslations('CraftingCalc');
  const { profile } = useAuth();
  
  // Create translated city options
  const cityOptions = useMemo(() =>
    LOCATIONS.filter(l => l !== 'Black Market').map(city => ({
      value: city,
      label: tCommon(`cities.${city}`)
    })), [tCommon]
  );
  const [loading, setLoading] = useState(false);
  const [fishTypes, setFishTypes] = useState<FishType[]>([]);
  const [data, setData] = useState<FishData[]>([]);
  const { server: region, setServer: setRegion } = useServer();
  const locale = useLocale();
  
  // Controls
  const [buyCity, setBuyCity] = useState<string>('Lymhurst');
  const [sellCity, setSellCity] = useState<string>('Lymhurst');

  // Generate Fish List
  useEffect(() => {
    const generated: FishType[] = FISH_DEFINITIONS.map(def => {
        const stats = getFishStats(def.tier, def.isRare, def.id);
        return {
            id: def.id,
            tier: def.tier,
            isRare: def.isRare,
            ...stats
        } as FishType;
    });
    setFishTypes(generated);
  }, []);
  
  // Fetch localized fish names
  const [localizedNames, setLocalizedNames] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const loadLocalizedNames = async () => {
      const names: Record<string, string> = {};
      
      for (const fish of fishTypes) {
        try {
          const localizedName = await getItemNameService(fish.id, locale);
          const cleanName = localizedName ? localizedName.replace(/^Item/, '') : localizedName;
          names[fish.id] = cleanName || fish.name;
        } catch (error) {
          names[fish.id] = fish.name;
        }
      }
      
      setLocalizedNames(names);
    };
    
    if (fishTypes.length > 0) {
      loadLocalizedNames();
    }
  }, [fishTypes, locale]);
  
  // Controls state is initialized above
  const [choppedFishRequired, setChoppedFishRequired] = useState<number>(5000);
  const [useBuyOrder, setUseBuyOrder] = useState(false);
  const [showPrices, setShowPrices] = useState(true);

  // Initialize from preferences
  useEffect(() => {
    if (profile?.preferences) {
        if (profile.preferences.defaultMarketLocation) {
            setBuyCity(profile.preferences.defaultMarketLocation);
            setSellCity(profile.preferences.defaultMarketLocation);
        }
        if (profile.preferences.showPrices !== undefined) {
            setShowPrices(profile.preferences.showPrices);
        }
    }
  }, [profile]);
  const [includeTax, setIncludeTax] = useState(false);
  const [usePremium, setUsePremium] = useState(true); // For tax calculation (4% vs 8%)

  // Chopped Fish Stats
  const [choppedFishStats, setChoppedFishStats] = useState<{ price: number; volume: number }>({ price: 0, volume: 0 });

  // Sorting
  const [sortKey, setSortKey] = useState<keyof FishData>('profit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSort = (key: keyof FishData) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const updateCalculation = (currentData: FishData[]) => {
    return currentData.map(row => {
        // Adjust Fish Cost for Buy Order Fee (2.5%) if using Buy Order
        // Note: buy_price_max is already the price. If we place a buy order, we pay that price + 2.5% setup fee?
        // Actually setup fee is for Sell Orders. For Buy Orders, there is a setup fee too.
        // "A setup fee is paid when creating a Buy Order or Sell Order... 2.5%"
        // So yes, if useBuyOrder is true, we pay Price + 2.5%.
        const fishCost = row.fishPrice * (useBuyOrder ? 1.025 : 1);

        // Revenue from Chopped Fish
        // Tax is paid on the SALES value.
        // Setup fee (2.5%) + Premium Tax (4%) or Non-Premium (8%).
        const taxRate = includeTax ? (usePremium ? 0.04 : 0.08) + 0.025 : 0; 
        const revenuePerUnit = row.choppedFishPrice * (1 - taxRate);
        const revenueTotal = revenuePerUnit * row.choppedYield; // Revenue per 1 Fish chopped

        // Profit
        const profitPerFish = revenueTotal - fishCost;
        
        // Target Calculation
        const fishRequired = Math.ceil(choppedFishRequired / row.choppedYield);
        const totalProfit = profitPerFish * fishRequired;
        const pricePerChopped = fishCost / row.choppedYield;

        const roi = fishCost > 0 ? (profitPerFish / fishCost) * 100 : 0;

        return {
            ...row,
            fishCost,
            fishRequired,
            revenueTotal,
            pricePerChopped,
            profit: totalProfit,
            roi,
            missingData: row.fishPrice === 0 || row.choppedFishPrice === 0
        };
    });
  };

  const handlePriceUpdate = (id: string, field: 'fishPrice' | 'choppedFishPrice', value: number) => {
    setData(prev => {
        const newData = prev.map(row => {
            if (row.id === id) {
                const updatedRow = { ...row, [field]: value };
                if (field === 'fishPrice') updatedRow.isCustomFishPrice = true;
                if (field === 'choppedFishPrice') updatedRow.isCustomChoppedPrice = true;
                return updatedRow;
            }
            return row;
        });
        return updateCalculation(newData);
    });
  };

  const handleResetPrice = (id: string, field: 'fishPrice' | 'choppedFishPrice') => {
    setData(prev => {
        const newData = prev.map(row => {
            if (row.id === id) {
                const updatedRow = { ...row };
                if (field === 'fishPrice') {
                    updatedRow.fishPrice = row.originalFishPrice || 0;
                    updatedRow.isCustomFishPrice = false;
                }
                if (field === 'choppedFishPrice') {
                    updatedRow.choppedFishPrice = row.originalChoppedPrice || 0;
                    updatedRow.isCustomChoppedPrice = false;
                }
                return updatedRow;
            }
            return row;
        });
        return updateCalculation(newData);
    });
  };

  // Recalculate when controls change
  useEffect(() => {
    if (data.length > 0) {
        setData(prev => updateCalculation(prev));
    }
  }, [choppedFishRequired, useBuyOrder, includeTax, usePremium]);

  const loadData = async () => {
    if (fishTypes.length === 0) return;

    setLoading(true);
    try {
      const allItemIds = [CHOPPED_FISH_PRODUCT_ID, ...fishTypes.map(f => f.id)];
      // Fetch prices for both Buy City and Sell City
      const locations = Array.from(new Set([buyCity, sellCity]));
      const pricesPromise = getMarketPrices(allItemIds, region, locations);

      // Fetch Volumes
      const choppedVolumePromise = getMarketVolume([CHOPPED_FISH_PRODUCT_ID], region, sellCity);
      const fishIds = fishTypes.map(f => f.id);
      const fishVolumePromise = getMarketVolume(fishIds, region, buyCity);

      const [prices, choppedVolumeData, fishVolumeData] = await Promise.all([pricesPromise, choppedVolumePromise, fishVolumePromise]);

      // 1. Get Chopped Fish Stats (Sell City)
      const choppedStats = prices.filter(p => p.item_id === CHOPPED_FISH_PRODUCT_ID && p.city === sellCity);
      const cfPrice = choppedStats.length > 0 ? choppedStats[0].sell_price_min : 0;
      
      const cfVolData = choppedVolumeData.find(v => v.item_id === CHOPPED_FISH_PRODUCT_ID)?.data || [];
      const cfVolume = cfVolData.length > 0 ? cfVolData[cfVolData.length - 1].item_count : 0;

      setChoppedFishStats({
        price: cfPrice,
        volume: cfVolume
      });

      // 2. Calculate Fish Data
      const calculated = fishTypes.map(fish => {
        // Fish Price from Buy City
        const fishPriceData = prices.find(p => p.item_id === fish.id && p.city === buyCity);
        
        let fishPrice = 0;
        if (fishPriceData) {
             fishPrice = useBuyOrder ? fishPriceData.buy_price_max : fishPriceData.sell_price_min;
        }

        // Fish Volume
        const fVolData = fishVolumeData.find(v => v.item_id === fish.id)?.data || [];
        const fishVolume = fVolData.length > 0 ? fVolData[fVolData.length - 1].item_count : 0;

        return {
          ...fish,
          fishPrice,
          fishVolume,
          choppedFishPrice: cfPrice,
          originalFishPrice: fishPrice,
          originalChoppedPrice: cfPrice,
          fishCost: 0, // Placeholder, calc later
          fishRequired: 0,
          revenueTotal: 0,
          pricePerChopped: 0,
          profit: 0,
          roi: 0,
          missingData: false
        };
      });

      setData(updateCalculation(calculated));

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fishTypes.length > 0) {
        loadData();
    }
  }, [region, buyCity, sellCity, fishTypes]); // Reload only when location/region changes

  const sortedData = [...data].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA === undefined || valB === undefined) return 0;
    return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });

  return (
    <PageShell 
      title={t('title')} 
      backgroundImage='/background/ao-crafting.jpg'  
      description={t('description')}
      icon={<Fish className="h-6 w-6" />}
      headerActions={
        <div className="flex items-center gap-4">
           <ServerSelector
            selectedServer={region}
            onServerChange={setRegion}
          />
          <button
            disabled={loading}
            onClick={loadData}
            className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors   disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* Top Section: Chopped Fish Stats & Controls */}
        <div className="bg-card/50 rounded-xl border border-border p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Chopped Fish Summary */}
            <div className="space-y-6">
               <div className="flex items-start gap-4">
                  <div className="h-16 w-16 bg-muted rounded-xl flex items-center justify-center border border-border  shrink-0">
                      <img 
                        src={`https://render.albiononline.com/v1/item/${CHOPPED_FISH_PRODUCT_ID}`} 
                        className="h-12 w-12 object-contain"
                        alt={t('choppingProfit')}
                      />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-1">{t('choppingProfit')}</h3>
                      <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-2xl font-mono font-bold text-success">
                              {choppedFishStats.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">{t('silverUnit')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t('itemsSold', { val: choppedFishStats.volume.toLocaleString() })}</span>
                          {choppedFishStats.price === 0 && (
                              <span className="text-warning flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> {t('noPriceData')}
                              </span>
                          )}
                      </div>
                  </div>
               </div>
               
               {/* Target Input */}
               <div className="bg-muted/50 rounded-lg p-4 border border-border">
                   <div className="flex justify-between items-center mb-2">
                       <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('required')}</label>
                   </div>
                   <NumberInput
                       value={choppedFishRequired}
                       onChange={setChoppedFishRequired}
                       className="bg-background h-11 text-lg"
                       min={1}
                   />
               </div>
            </div>

            {/* Right: Settings & Filters */}
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                    <Select 
                        label={t('buyFishFrom')}
                        options={cityOptions}
                        value={buyCity}
                        onChange={(value) => setBuyCity(value)}
                    />
                    <Select 
                        label={t('sellChoppedTo')}
                        options={cityOptions}
                        value={sellCity}
                        onChange={(value) => setSellCity(value)}
                    />
               </div>
               
               <div className="h-px bg-border" />
               
               <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                   <Checkbox 
                       label={t('useBuyOrder')}
                       description={t('useBuyOrderDesc')}
                       checked={useBuyOrder}
                       onChange={(e) => setUseBuyOrder(e.target.checked)}
                   />
                   <Checkbox 
                       label={t('includeTax')}
                       description={t('includeTaxDesc')}
                       checked={includeTax}
                       onChange={(e) => setIncludeTax(e.target.checked)}
                   />
                   <Checkbox 
                       label={t('premiumStatus')}
                       description={t('premiumStatusDesc')}
                       checked={usePremium}
                       onChange={(e) => setUsePremium(e.target.checked)}
                       disabled={!includeTax}
                   />
               </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                  <th className="p-4 pl-6 font-medium cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('tier')}>
                      <div className="flex items-center gap-1">{t('fish')} {sortKey === 'tier' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
                  </th>
                  {showPrices && (
                    <th className="w-[1%] p-4 font-medium text-right cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('fishPrice')}>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content={t('priceTooltip')}>
                           <span>{t('price')}</span>
                           <CircleHelp className="h-3 w-3 text-muted-foreground" />
                        </Tooltip>
                        {sortKey === 'fishPrice' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                  </th>
                  )}
                  <th className="w-[1%] p-4 font-medium text-right cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('fishVolume')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>{t('volume24h')}</span>
                        {sortKey === 'fishVolume' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                  </th>
                  <th className="w-[1%] p-4 font-medium text-right cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('choppedYield')}>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content={t('choppedFishTooltip')}>
                           <span>{t('choppedFish')}</span>
                           <CircleHelp className="h-3 w-3 text-muted-foreground" />
                        </Tooltip>
                        {sortKey === 'choppedYield' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                  </th>
                  <th className="w-[1%] p-4 font-medium text-right cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('fishRequired')}>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content={t('fishReqTooltip', { val: choppedFishRequired.toLocaleString() })}>
                           <span>{t('fishReq')}</span>
                           <CircleHelp className="h-3 w-3 text-muted-foreground" />
                        </Tooltip>
                        {sortKey === 'fishRequired' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                  </th>
                  {showPrices && (
                    <th className="w-[1%] p-4 font-medium text-right cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('pricePerChopped')}>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content={t('priceChoppedTooltip')}>
                           <span>{t('priceChopped')}</span>
                           <CircleHelp className="h-3 w-3 text-muted-foreground" />
                        </Tooltip>
                        {sortKey === 'pricePerChopped' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                  </th>
                  )}
                  <th className="w-[1%] p-4 font-medium text-right cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('profit')}>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content={t('profitTooltip', { val: choppedFishRequired.toLocaleString() })}>
                           <span>{t('profit')}</span>
                           <CircleHelp className="h-3 w-3 text-muted-foreground" />
                        </Tooltip>
                        {sortKey === 'profit' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                  </th>
                  <th className="w-[1%] p-4 pr-6 font-medium text-right cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('roi')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>{t('roi')}</span>
                        {sortKey === 'roi' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedData.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center border border-border relative">
                                <img 
                                    src={`https://render.albiononline.com/v1/item/${row.id}`} 
                                    className="h-8 w-8 object-contain"
                                    alt={localizedNames[row.id] || row.name}
                                />
                                <div className="absolute -bottom-1 -right-1 bg-background text-[10px] border border-border px-1 rounded-full font-mono text-muted-foreground">
                                    T{row.tier}
                                </div>
                            </div>
                            <div>
                                <div className="font-medium text-foreground">{localizedNames[row.id] || row.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="font-mono">{row.id}</span>
                                    {row.isRare && <span className="text-amber-500 font-bold">• {t('rare')}</span>}
                                </div>
                            </div>
                        </div>
                    </td>
                    
                    {showPrices && (
                        <td className="p-4 text-right font-mono">
                            <div className="text-foreground">{row.fishPrice.toLocaleString()}</div>
                            {row.isCustomFishPrice && <span className="text-[10px] text-primary uppercase font-bold tracking-wider">{t('custom')}</span>}
                        </td>
                    )}

                    <td className="p-4 text-right font-mono text-muted-foreground">
                        {row.fishVolume.toLocaleString()}
                    </td>

                    <td className="p-4 text-right font-mono text-muted-foreground">
                        {row.choppedYield}
                    </td>

                    <td className="p-4 text-right font-mono text-foreground font-bold">
                        {row.fishRequired.toLocaleString()}
                    </td>

                    {showPrices && (
                        <td className="p-4 text-right font-mono text-muted-foreground">
                            {Math.round(row.pricePerChopped).toLocaleString()}
                        </td>
                    )}

                    <td className="p-4 text-right font-mono">
                        <div className={`font-bold ${row.profit > 0 ? 'text-success' : 'text-destructive'}`}>
                            {row.profit > 0 ? '+' : ''}{row.profit.toLocaleString()}
                        </div>
                    </td>

                    <td className="p-4 pr-6 text-right font-mono">
                        <div className={`font-bold ${row.roi > 0 ? 'text-success' : 'text-destructive'}`}>
                            {row.roi.toFixed(1)}%
                        </div>
                    </td>
                  </tr>
                ))}
                
                {sortedData.length === 0 && !loading && (
                    <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            {t('noData')}
                        </td>
                    </tr>
                )}
                
                {loading && (
                    <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                {t('loading')}
                            </div>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
