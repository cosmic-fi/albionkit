'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '@/components/PageShell';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';
import { ItemIcon } from '@/components/ItemIcon';
import { Sprout, RefreshCw, Calculator, TrendingUp, TrendingDown, Info, Leaf, Flower2, ChevronDown, ChevronUp, ArrowRight, DollarSign, Scale, Percent, Edit2, CircleHelp } from 'lucide-react';
import { CROP_DEFINITIONS, Crop } from './constants';
import { getMarketPrices, getMarketVolume, MarketStat, LOCATIONS } from '@/lib/market-service';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import { Tooltip } from '@/components/ui/Tooltip';

// Helper to generate crop stats
const getCropStats = (tier: number, id: string, type: 'crop' | 'herb'): Partial<Crop> => {
  const upperId = id.toUpperCase();
  const seedId = `T${tier}_FARM_${upperId}_SEED`;
  // Produce ID usually matches T{tier}_{UPPERID} but let's verify exceptions if any
  // T1_CARROT, T2_BEAN, etc. seems consistent.
  const produceId = `T${tier}_${upperId}`;

  const name = id.charAt(0).toUpperCase() + id.slice(1);

  const baseYield = 8; // Standard for most crops/herbs

  // Seed Return Rates (approximate based on wiki)
  // T1: 0 (Shop only? Carrots often 0 return without focus?) Actually T1 carrots have 0 seed yield? 
  // Wiki says Carrots: 0% base, ? focus. Actually usually you buy carrot seeds.
  // Let's use the values from the old constant for consistency.
  let seedReturnRate = 0;
  let seedReturnRateFocus = 0;
  let focusCost = 500;

  if (tier === 1) {
    seedReturnRate = 0;
    seedReturnRateFocus = 200; // Is it?
    focusCost = 1000;
  } else {
    // T2-T8
    const rates: Record<number, { base: number, focus: number }> = {
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

  return {
    name,
    seedId,
    produceId,
    baseYield,
    seedReturnRate,
    seedReturnRateFocus,
    focusCost
  };
};

interface FarmingData extends Crop {
  seedPrice: number;
  seedVolume: number;
  producePrice: number;
  produceVolume: number;
  profit: number;
  profitPerPlot: number;
  roi: number;
  warning?: string;
  // User override flags
  isCustomSeedPrice?: boolean;
  isCustomProducePrice?: boolean;

  // Original fetched prices (for reset)
  originalSeedPrice?: number;
  originalProducePrice?: number;
}

const CITIES = LOCATIONS.filter(l => l !== 'Black Market' && l !== 'Caerleon'); // Royal cities usually used for farming
// Add Caerleon if needed, but farming islands can be in Caerleon too.

export default function FarmingPage() {
  const { server: region, setServer: setRegion } = useServer();
  const [buyCity, setBuyCity] = useState<string>('Martlock');
  const [sellCity, setSellCity] = useState<string>('Martlock');
  const [category, setCategory] = useState<'crop' | 'herb'>('crop');
  
  const [usePremium, setUsePremium] = useState(true);
  const [useFocus, setUseFocus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [data, setData] = useState<FarmingData[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Generate Crops List
  useEffect(() => {
    const generated: Crop[] = CROP_DEFINITIONS.map(def => {
        const stats = getCropStats(def.tier, def.id, def.type);
        return {
            id: def.id,
            tier: def.tier,
            type: def.type,
            ...stats
        } as Crop;
    });
    setCrops(generated);
  }, []);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof FarmingData; direction: 'asc' | 'desc' }>({
    key: 'profit',
    direction: 'desc'
  });

  const handleSort = (key: keyof FarmingData) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const updateCalculation = (currentData: FarmingData[]) => {
    return currentData.map(row => {
      // Re-calculate derived values based on current prices (which might be user-edited)
      const yieldAmount = row.baseYield * (usePremium ? 2 : 1); 
      const seedReturn = useFocus ? row.seedReturnRateFocus : row.seedReturnRate;
      
      const revenue = (yieldAmount * row.producePrice) + ((seedReturn / 100) * row.seedPrice);
      const cost = row.seedPrice;
      const profit = revenue - cost;
      const roi = cost > 0 ? (profit / cost) * 100 : 0;
      
      return {
        ...row,
        profit,
        profitPerPlot: profit * 9,
        roi
      };
    });
  };

  const handlePriceUpdate = (id: string, field: 'seedPrice' | 'producePrice', value: number) => {
    setData(prev => {
      const newData = prev.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          // Mark as custom if user edits
          if (field === 'seedPrice') updatedRow.isCustomSeedPrice = true;
          if (field === 'producePrice') updatedRow.isCustomProducePrice = true;
          return updatedRow;
        }
        return row;
      });
      return updateCalculation(newData);
    });
  };

  const handleResetPrice = (id: string, field: 'seedPrice' | 'producePrice') => {
    setData(prev => {
        const newData = prev.map(row => {
            if (row.id === id) {
                const updatedRow = { ...row };
                
                if (field === 'seedPrice') {
                    updatedRow.seedPrice = row.originalSeedPrice || 0;
                    updatedRow.isCustomSeedPrice = false;
                }
                if (field === 'producePrice') {
                    updatedRow.producePrice = row.originalProducePrice || 0;
                    updatedRow.isCustomProducePrice = false;
                }
                return updatedRow;
            }
            return row;
        });
        return updateCalculation(newData);
    });
  };

  // Effect to re-run calculations when toggles change, without losing custom prices
  useEffect(() => {
    if (data.length > 0) {
      setData(prev => updateCalculation(prev));
    }
  }, [usePremium, useFocus]);

  const loadData = async () => {
    if (crops.length === 0) return;

    setLoading(true);
    try {
      const filteredCrops = crops.filter(c => c.type === category);
      
      const itemIds = [
        ...filteredCrops.map(c => c.seedId),
        ...filteredCrops.map(c => c.produceId)
      ];

      // Fetch prices for Buy City (Seeds) and Sell City (Produce)
      // If cities are same, we can optimize, but for simplicity let's just fetch what we need.
      // We need Seed Prices from Buy City
      // We need Produce Prices from Sell City
      // We need Volume for Produce from Sell City (to see if we can sell)
      // We need Volume for Seeds from Buy City (to see if we can buy)

      // Let's fetch prices for both cities for all items to be safe/flexible
      const locationsToFetch = Array.from(new Set([buyCity, sellCity]));
      const prices = await getMarketPrices(itemIds, region, locationsToFetch);
      
      // Fetch volumes for both (history api)
      // Note: History API is heavier. Let's fetch for sell city produce and buy city seeds.
      // Actually getMarketVolume is designed to return volume for a specific location.
      
      // We need 2 volume calls if cities are different
      let seedVolumes: any[] = [];
      let produceVolumes: any[] = [];
      
      if (buyCity === sellCity) {
          const vols = await getMarketVolume(itemIds, region, buyCity);
          seedVolumes = vols;
          produceVolumes = vols;
      } else {
          const [volsBuy, volsSell] = await Promise.all([
              getMarketVolume(filteredCrops.map(c => c.seedId), region, buyCity),
              getMarketVolume(filteredCrops.map(c => c.produceId), region, sellCity)
          ]);
          seedVolumes = volsBuy;
          produceVolumes = volsSell;
      }
      
      const calculated = filteredCrops.map(crop => {
        // 1. Seed Cost (Buy City)
        const seedStats = prices.filter(p => p.item_id === crop.seedId && p.city === buyCity);
        const validSeedPrices = seedStats.filter(s => s.sell_price_min > 0).map(s => s.sell_price_min);
        const seedPrice = validSeedPrices.length > 0 ? Math.min(...validSeedPrices) : 0;
        
        // Seed Volume (Last 24h)
        const seedVolData = seedVolumes.find(v => v.item_id === crop.seedId);
        const seedVolume = seedVolData?.data?.[seedVolData.data.length - 1]?.item_count || 0;

        // 2. Produce Revenue (Sell City)
        const produceStats = prices.filter(p => p.item_id === crop.produceId && p.city === sellCity);
        const validProducePrices = produceStats.filter(s => s.sell_price_min > 0).map(s => s.sell_price_min);
        const producePrice = validProducePrices.length > 0 ? Math.min(...validProducePrices) : 0;
        
        // Produce Volume (Last 24h)
        const produceVolData = produceVolumes.find(v => v.item_id === crop.produceId);
        const produceVolume = produceVolData?.data?.[produceVolData.data.length - 1]?.item_count || 0;

        let warning = undefined;
        if (seedPrice === 0) warning = "No Seed Data";
        else if (producePrice === 0) warning = "No Produce Data";

        // Calculations
        // Yield: Base usually around 6-9 depending on RNG
        // Premium doubles yield for crops/herbs
        const yieldAmount = crop.baseYield * (usePremium ? 2 : 1); 
        
        const seedReturn = useFocus ? crop.seedReturnRateFocus : crop.seedReturnRate;
        // Expected Seed Value = (seedReturn / 100) * seedPrice
        
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

      // Sort by profit
      calculated.sort((a, b) => b.profit - a.profit);
      
      setData(calculated);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (crops.length > 0) {
        loadData();
    }
  }, [region, buyCity, sellCity, category, crops]); // Removed usePremium/useFocus from here to prevent overwrite

  // Trigger initial calc or re-calc when premium/focus change is handled by separate effect now, 
  // BUT we need to make sure initial load happens. 
  // actually, loadData fetches prices. If we just toggle premium, we shouldn't re-fetch prices, just re-calc.
  // The separate effect above handles re-calc. 
  // So we only re-fetch when location/category changes.

  const cityOptions = LOCATIONS.filter(l => l !== 'Black Market').map(city => ({
    value: city,
    label: city
  }));

  const allCityOptions = LOCATIONS.map(city => ({
    value: city,
    label: city
  }));

  // Re-sort when data changes
  const sortedData = [...data].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue: any = a[key];
    let bValue: any = b[key];

    // Handle string comparison
    if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <PageShell 
      title="Farming Calculator" 
      backgroundImage='/background/ao-crafting.jpg'  
      description="Calculate profits for crops and herbs with real-time market data."
      icon={<Sprout className="h-6 w-6" />}
      headerActions={
        <div className="flex flex-wrap items-center gap-4">
           <ServerSelector selectedServer={region} onServerChange={setRegion} />
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-success hover:bg-success/90 text-primary-foreground rounded-lg transition-colors shadow-lg shadow-success/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Category Tabs */}
        <CategoryTabs
            options={[
                { label: 'Crops', value: 'crop' },
                { label: 'Herbs', value: 'herb' },
            ]}
            value={category}
            onChange={(val) => setCategory(val as any)}
        />

        {/* Controls */}
        <div className="bg-card/50 p-6 rounded-xl border border-border space-y-6">
          
          {/* Top Row: Cities */}
          <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex-1">
                 <Select 
                   label="Buy Seeds From"
                   options={cityOptions}
                   value={buyCity}
                   onChange={(val) => setBuyCity(val)}
                 />
               </div>
               
               <div className="hidden sm:flex items-center justify-center pt-6 text-muted-foreground">
                  <ArrowRight className="h-5 w-5" />
               </div>

               <div className="flex-1">
                 <Select 
                   label="Sell Produce To"
                   options={allCityOptions}
                   value={sellCity}
                   onChange={(val) => setSellCity(val)}
                 />
               </div>
          </div>
          
          <div className="h-px bg-border" />

          {/* Bottom Row: Toggles */}
          <div className="flex flex-wrap gap-8">
            <Checkbox 
               label="Premium Status" 
               description="Double yield (+100%)"
               checked={usePremium}
               onChange={(e) => setUsePremium(e.target.checked)}
            />
            
            <Checkbox 
               label="Use Focus" 
               description="Higher seed return rate"
               checked={useFocus}
               onChange={(e) => setUseFocus(e.target.checked)}
            />
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                    <th className="p-4 font-medium pl-8 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">
                            Crop
                            {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                    </th>
                    <th className="p-4 font-medium text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('profit')}>
                        <div className="flex items-center justify-end gap-1">
                            <Tooltip content="Estimated profit per 9 squares (1 plot).">
                                <span>Profit / Plot</span>
                                <CircleHelp className="h-3 w-3 text-muted-foreground" />
                            </Tooltip>
                            {sortConfig.key === 'profit' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                    </th>
                    <th className="p-4 font-medium text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('roi')}>
                        <div className="flex items-center justify-end gap-1">
                            <Tooltip content="Return on Investment. (Profit / Total Cost) * 100.">
                                <span>ROI</span>
                                <CircleHelp className="h-3 w-3 text-muted-foreground" />
                            </Tooltip>
                            {sortConfig.key === 'roi' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                    </th>
                    <th className="p-4 font-medium text-center w-16"></th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-border text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-success" />
                        <p>Fetching market prices & volume...</p>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">No data available</td>
                  </tr>
                ) : (
                  sortedData.map((row) => (
                    <React.Fragment key={row.id}>
                      <tr 
                        onClick={() => toggleRow(row.id)}
                        className={`
                          cursor-pointer transition-colors border-l-2
                          ${expandedRow === row.id ? 'bg-muted/50 border-l-success' : 'hover:bg-muted/30 border-l-transparent'}
                        `}
                      >
                        <td className="p-4 pl-8">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 border border-border relative group">
                               <ItemIcon itemId={row.seedId} alt={`${row.name} Seed`} className="h-10 w-10 object-contain" />
                               <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-card rounded-full border border-border flex items-center justify-center shadow-sm">
                                 <ItemIcon itemId={row.produceId} alt={row.name} className="h-4 w-4 object-contain" />
                               </div>
                             </div>
                             <div>
                               <div className="font-bold text-foreground text-lg flex items-center gap-2">
                                 {row.name} Seed
                                 <span className="text-xs font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded-full">T{row.tier}</span>
                               </div>
                               <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                 <span className="capitalize">{row.type}</span>
                                 {row.warning && (
                                   <span className="text-warning flex items-center gap-1">
                                     • <Info className="h-3 w-3" /> {row.warning}
                                   </span>
                                 )}
                               </div>
                             </div>
                          </div>
                        </td>
                        
                        <td className="p-4 text-right">
                          <div className={`font-mono font-bold text-lg ${row.profitPerPlot > 0 ? 'text-success' : 'text-destructive'}`}>
                            {Math.round(row.profitPerPlot).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">per 9 squares</div>
                        </td>

                        <td className="p-4 text-right">
                          <div className={`font-mono font-medium ${row.roi > 0 ? 'text-success' : 'text-destructive'}`}>
                            {row.roi.toFixed(1)}%
                          </div>
                        </td>

                        <td className="p-4 text-center text-muted-foreground">
                          {expandedRow === row.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </td>
                      </tr>
                      
                      {/* Expanded Detail Row */}
                      {expandedRow === row.id && (
                        <tr className="bg-muted/30 border-b border-border">
                          <td colSpan={4} className="p-0">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                              
                              {/* Seed Stats */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                  <Leaf className="h-3 w-3" /> Seed Info ({buyCity})
                                </h4>
                                <div className="bg-card/50 rounded-lg p-4 border border-border space-y-3">
                                  <div>
                                    <NumberInput 
                                      label="Buy Price"
                                      value={row.seedPrice}
                                      onChange={(val) => handlePriceUpdate(row.id, 'seedPrice', val)}
                                      className="bg-card"
                                      isCustom={row.isCustomSeedPrice}
                                      onReset={() => handleResetPrice(row.id, 'seedPrice')}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-sm">24h Volume</span>
                                    <span className="font-mono text-foreground">{row.seedVolume.toLocaleString()}</span>
                                  </div>
                                  <div className="h-px bg-border" />
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-sm">Return Rate</span>
                                    <span className="font-mono text-success">
                                      {useFocus ? row.seedReturnRateFocus : row.seedReturnRate}%
                                      <span className="text-xs text-muted-foreground ml-1">({useFocus ? 'Focus' : 'No Focus'})</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Produce Stats */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                  <Flower2 className="h-3 w-3" /> Produce Info ({sellCity})
                                </h4>
                                <div className="bg-card/50 rounded-lg p-4 border border-border space-y-3">
                                  <div>
                                    <NumberInput 
                                      label="Sell Price"
                                      value={row.producePrice}
                                      onChange={(val) => handlePriceUpdate(row.id, 'producePrice', val)}
                                      className="bg-card"
                                      isCustom={row.isCustomProducePrice}
                                      onReset={() => handleResetPrice(row.id, 'producePrice')}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-sm">24h Volume</span>
                                    <span className="font-mono text-foreground">{row.produceVolume.toLocaleString()}</span>
                                  </div>
                                  <div className="h-px bg-border" />
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-sm">Est. Yield</span>
                                    <span className="font-mono text-success">
                                      {row.baseYield * (usePremium ? 2 : 1)}
                                      <span className="text-xs text-muted-foreground ml-1">({usePremium ? 'Premium' : 'Standard'})</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Profit Breakdown */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                  <Scale className="h-3 w-3" /> Profit Analysis
                                </h4>
                                <div className="bg-card/50 rounded-lg p-4 border border-border space-y-3">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Revenue / Seed</span>
                                    <span className="font-mono text-foreground">
                                      {Math.round((row.baseYield * (usePremium ? 2 : 1) * row.producePrice) + ((useFocus ? row.seedReturnRateFocus : row.seedReturnRate) / 100 * row.seedPrice)).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Cost / Seed</span>
                                    <span className="font-mono text-destructive">-{row.seedPrice.toLocaleString()}</span>
                                  </div>
                                  <div className="h-px bg-border" />
                                  <div className="flex justify-between items-center font-bold">
                                    <span className="text-foreground">Net Profit / Seed</span>
                                    <span className={`font-mono ${row.profit > 0 ? 'text-success' : 'text-destructive'}`}>
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
      <InfoStrip currentPage="profits-farming">
        <InfoBanner icon={<Sprout className="w-4 h-4" />} color="text-green-400" title="Farming Profit Guide">
          <p>Profit calculations assume maximum yield from Premium status.</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-xs opacity-90">
             <li><strong>Premium:</strong> Doubles your crop yield (+100%)</li>
             <li><strong>Focus:</strong> Increases seed return rate, essential for sustainability</li>
             <li><strong>Location:</strong> Island bonuses do not affect farming yield</li>
          </ul>
        </InfoBanner>
      </InfoStrip>
    </PageShell>
  );
}
