'use client';
//@ts-ignore
import { useState, useEffect, Fragment, useMemo } from 'react';
import { PageShell } from '@/components/PageShell';
import { useAuth } from '@/context/AuthContext';
import { ItemIcon } from '@/components/ItemIcon';
import { Users, RefreshCw, TrendingUp, ChevronDown, ChevronUp, CircleHelp, Info } from 'lucide-react';
import { getMarketPrices, getMarketVolume, LOCATIONS } from '@/lib/market-service';
import { 
  LABOURER_DEFINITIONS, 
  JOURNAL_TIERS, 
  getJournalId, 
  getResourceId,
  getYield,
  BASE_RETURNS_CRAFTING,
  BASE_RETURNS_GATHERING
} from './constants';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { NumberInput } from '@/components/ui/NumberInput';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { Tooltip } from '@/components/ui/Tooltip';
import { useTranslations, useLocale } from 'next-intl';
import { getItemNameService } from '@/lib/item-service';

interface MaterialReturn {
  id: string;
  name: string;
  tier: number;
  enchantment: number;
  quantity: number;
  price: number;
  totalValue: number;
  missingData: boolean;
  volume?: number;
}

interface LabourerTierResult {
  tier: number;
  journalId: string;
  journalName: string;
  happiness: number;
  yieldPercent: number;
  
  // Costs
  fullJournalPrice: number;
  fullJournalVolume?: number;
  totalCost: number;
  
  // Revenue
  emptyJournalId: string;
  emptyJournalPrice: number;
  emptyJournalRevenue: number;
  emptyJournalVolume?: number;
  
  materials: MaterialReturn[];
  materialRevenue: number;
  
  // Totals
  totalRevenue: number;
  profit: number;
  roi: number;
  missingData: boolean;
}

export default function LabourClient() {
  const t = useTranslations('Labour');
  const tCommon = useTranslations('Alchemy');
  const locale = useLocale();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LabourerTierResult[]>([]);
  const [localizedItemNames, setLocalizedItemNames] = useState<Record<string, string>>({});
  const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set([8, 7, 6])); // Default expand high tiers
  
  // Filters
  const { server: region, setServer: setRegion } = useServer();
  const [selectedTypeId, setSelectedTypeId] = useState<string>('blacksmith');
  const [journalCount, setJournalCount] = useState<number>(1);
  const [houseTier, setHouseTier] = useState<number>(8);
  const [sortByTierDesc, setSortByTierDesc] = useState<boolean>(true);
  const [isPremium, setIsPremium] = useState<boolean>(true); // Default true usually
  const [useSellOrder, setUseSellOrder] = useState<boolean>(false); // Sell Order for Returns
  const [useBuyOrder, setUseBuyOrder] = useState<boolean>(true); // Buy Order for Journals (User default: Buy Order +2.5%)
  const [showVolume, setShowVolume] = useState<boolean>(false);
  const [simulateEnchantment, setSimulateEnchantment] = useState<boolean>(false);
  
  // Cities
  const [buyCity, setBuyCity] = useState<string>('Martlock');
  const [sellJournalCity, setSellJournalCity] = useState<string>('Martlock');
  const [sellMaterialCity, setSellMaterialCity] = useState<string>('Martlock');

  // Initialize from preferences
  useEffect(() => {
    if (profile?.preferences) {
        if (profile.preferences.defaultMarketLocation) {
            setBuyCity(profile.preferences.defaultMarketLocation);
            setSellJournalCity(profile.preferences.defaultMarketLocation);
            setSellMaterialCity(profile.preferences.defaultMarketLocation);
        }
    }
  }, [profile]);

  // Load localized item names
  useEffect(() => {
    const loadLocalizedNames = async () => {
      if (!data.length) return;
      
      // Collect all unique item IDs from materials
      const itemIds = new Set<string>();
      data.forEach(tier => {
        tier.materials.forEach(mat => {
          itemIds.add(mat.id);
        });
      });
      
      if (itemIds.size === 0) return;
      
      // Fetch localized names for each item
      const names: Record<string, string> = {};
      const itemArray = Array.from(itemIds);
      
      for (const itemId of itemArray) {
        try {
          const localizedName = await getItemNameService(itemId, locale);
          names[itemId] = localizedName || '';
        } catch (error) {
          // Fallback to empty string if fetch fails, will use original name
          names[itemId] = '';
        }
      }
      
      setLocalizedItemNames(names);
    };
    
    loadLocalizedNames();
  }, [data, locale]);

  // Helper to format resource name
  const formatResourceName = (id: string) => {
    const parts = id.split('_');
    const tier = parts[0];
    const rest = parts.slice(1).join(' ').toLowerCase();
    return `${tier} ${rest.replace(/@\d+/, '')}`;
  };

  const toggleExpand = (tier: number) => {
    const next = new Set(expandedTiers);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);
    setExpandedTiers(next);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const selectedType = LABOURER_DEFINITIONS.find(l => l.id === selectedTypeId);
      if (!selectedType) return;

      const locations = Array.from(new Set([buyCity, sellJournalCity, sellMaterialCity]));
      
      // 1. Build Item List
      const itemIds: string[] = [];
      JOURNAL_TIERS.forEach(tier => {
        itemIds.push(getJournalId(tier, selectedType, 'FULL'));
        itemIds.push(getJournalId(tier, selectedType, 'EMPTY'));
        
        // Resources
        const resId = getResourceId(tier, selectedType, 0);
        if (resId) {
          [0, 1, 2, 3, 4].forEach(ench => {
            const enchResId = getResourceId(tier, selectedType, ench);
            if (enchResId) itemIds.push(enchResId);
          });
        }
      });

      const [prices, volumeData] = await Promise.all([
        getMarketPrices(itemIds, region, locations),
        showVolume ? getMarketVolume(itemIds, region, buyCity) : Promise.resolve([])
      ]);

      const volumeMap = new Map<string, number>();
      if (showVolume) {
        volumeData.forEach(v => {
          if (v.data && v.data.length > 0) {
            volumeMap.set(v.item_id, v.data[v.data.length - 1].item_count);
          }
        });
      }

      const getPrice = (itemId: string, city: string, type: 'buy' | 'sell') => {
        const entry = prices.find(p => p.item_id === itemId && p.city === city);
        if (!entry) return 0;
        if (type === 'buy') {
          return useBuyOrder ? entry.buy_price_max : entry.sell_price_min;
        } else {
          return useSellOrder ? entry.sell_price_max : entry.sell_price_min;
        }
      };

      // 2. Calculate Results
      const results: LabourerTierResult[] = JOURNAL_TIERS.map(tier => {
        const fullJournalId = getJournalId(tier, selectedType, 'FULL');
        const emptyJournalId = getJournalId(tier, selectedType, 'EMPTY');
        
        const fullJournalPrice = getPrice(fullJournalId, buyCity, 'buy');
        const emptyJournalPrice = getPrice(emptyJournalId, sellJournalCity, 'sell');
        
        const fullJournalVolume = volumeMap.get(fullJournalId);
        const emptyJournalVolume = volumeMap.get(emptyJournalId);

        const yieldPercent = getYield(tier, houseTier);
        
        // Materials Return
        const materials: MaterialReturn[] = [];
        let materialRevenue = 0;
        let hasMissingData = fullJournalPrice === 0 || emptyJournalPrice === 0;

        // Base returns for the type
        const returns = selectedType.category === 'gathering' ? BASE_RETURNS_GATHERING : BASE_RETURNS_CRAFTING;
        const taxRate = isPremium ? 0.04 : 0.08;
        const sellFee = useSellOrder ? 0.025 : 0;
        const effectiveTax = 1 - (taxRate + sellFee);

        const emptyJournalRevenue = emptyJournalPrice * effectiveTax;

        // Resource calculation
        const baseResId = getResourceId(tier, selectedType, 0);
        if (baseResId) {
          const ench = simulateEnchantment ? 0 : 0; // Simple for now
          const resId = getResourceId(tier, selectedType, ench);
          if (resId) {
            const unitPrice = getPrice(resId, sellMaterialCity, 'sell');
            
            if (unitPrice === 0) hasMissingData = true;

            const baseQty = returns[tier as keyof typeof returns] || 0;
            const quantity = baseQty * yieldPercent * journalCount;
            const totalValue = unitPrice * quantity * effectiveTax;
            
            materialRevenue += totalValue;

            materials.push({
              id: resId,
              name: formatResourceName(resId),
              tier,
              enchantment: ench,
              quantity,
              price: unitPrice,
              totalValue,
              missingData: unitPrice === 0,
              volume: volumeMap.get(resId)
            });
          }
        }

        const totalCost = fullJournalPrice * journalCount;
        const totalRev = (emptyJournalRevenue * journalCount) + materialRevenue;
        const profit = totalRev - totalCost;
        const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

        const typeName = t.has(`types.${selectedType.id}`) ? t(`types.${selectedType.id}`) : selectedType.name;

        return {
          tier,
          journalId: fullJournalId,
          journalName: `${typeName} ${t('journal')}`,
          happiness: yieldPercent * 100 / 1.5,
          yieldPercent: yieldPercent * 100,
          
          fullJournalPrice,
          fullJournalVolume,
          totalCost,
          
          emptyJournalId,
          emptyJournalPrice,
          emptyJournalRevenue: emptyJournalRevenue * journalCount,
          emptyJournalVolume,
          
          materials,
          materialRevenue,
          
          totalRevenue: totalRev,
          profit,
          roi,
          missingData: hasMissingData
        };
      });

      if (sortByTierDesc) {
        results.sort((a, b) => b.tier - a.tier);
      } else {
        results.sort((a, b) => a.tier - b.tier);
      }

      setData(results);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [region, selectedTypeId, journalCount, houseTier, sortByTierDesc, isPremium, useSellOrder, useBuyOrder, buyCity, sellJournalCity, sellMaterialCity, showVolume, simulateEnchantment]);

  // Find Best Tiers
  const validData = data.filter(d => !d.missingData && d.totalCost > 0);
  const bestProfit = validData.length > 0 ? [...validData].sort((a, b) => b.profit - a.profit)[0] : null;
  const bestRoi = validData.length > 0 ? [...validData].sort((a, b) => b.roi - a.roi)[0] : null;

  const cityOptions = LOCATIONS.filter(l => l !== 'Black Market').map(city => ({
    value: city,
    label: city
  }));

  const labourerOptions = useMemo(() => 
    LABOURER_DEFINITIONS.map(tDef => ({
      value: tDef.id,
      label: t.has(`types.${tDef.id}`) ? t(`types.${tDef.id}`) : tDef.name
    }))
  , [t]);

  return (
    <PageShell 
      title={t('title')} 
      backgroundImage='/background/ao-crafting.jpg'  
      description={t('description')}
      icon={<Users className="h-6 w-6" />}
      headerActions={
        <div className="flex items-center gap-4">
          <ServerSelector
            selectedServer={region}
            onServerChange={setRegion}
          />
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg border border-border transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        {validData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bestProfit && (
              <div className="bg-card/50 p-4 rounded-xl border border-border flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('highestProfit')}</div>
                  <div className="text-xl font-bold text-foreground">T{bestProfit.tier} {bestProfit.journalName}</div>
                  <div className="text-sm text-success">+{bestProfit.profit.toLocaleString()} silver</div>
                </div>
              </div>
            )}
            
            {bestRoi && (
              <div className="bg-card/50 p-4 rounded-xl border border-border flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center text-info">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('bestRoi')}</div>
                  <div className="text-xl font-bold text-foreground">T{bestRoi.tier} {bestRoi.journalName}</div>
                  <div className="text-sm text-info">{bestRoi.roi.toFixed(1)}% ROI</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-card/50 p-6 rounded-xl border border-border space-y-6">
          {/* Top Row: Core Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label={t('labourerType')}
              options={labourerOptions}
              value={selectedTypeId}
              onChange={(value) => setSelectedTypeId(value)}
            />
            
            <NumberInput
              label={t('journalCount')}
              value={journalCount}
              onChange={setJournalCount}
              min={1}
            />
            
            <Select
              label={t('houseTier')}
              options={[2,3,4,5,6,7,8].map(tier => ({ value: tier, label: `${tCommon('tier')} ${tier}` }))}
              value={houseTier}
              onChange={(value) => setHouseTier(Number(value))}
            />
          </div>

          {/* Middle Row: Global Toggles */}
          <div className="flex flex-wrap gap-6 p-4 bg-muted/50 rounded-lg border border-border/50">
             <Checkbox 
               label={tCommon('premiumTax')} 
               checked={isPremium} 
               onChange={(e) => setIsPremium(e.target.checked)} 
             />
             <Checkbox 
               label={t('sortByTier')} 
               checked={sortByTierDesc} 
               onChange={(e) => setSortByTierDesc(e.target.checked)} 
             />
             <Checkbox 
               label={t('showVolume')} 
               checked={showVolume} 
               onChange={(e) => setShowVolume(e.target.checked)} 
             />
             <Checkbox 
               label={t('simulateEnchanted')} 
               description={t('simulateEnchantedDesc')}
               checked={simulateEnchantment} 
               onChange={(e) => setSimulateEnchantment(e.target.checked)} 
             />
          </div>
          
          <div className="h-px bg-border/50" />
          
          {/* Bottom Row: Market Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Buy Journals */}
            <div className="space-y-3">
               <h4 className="font-medium text-muted-foreground text-sm">{t('buyFullJournal')}</h4>
               <Select
                 value={buyCity}
                 onChange={(value) => setBuyCity(value)}
                 options={cityOptions}
               />
               <Checkbox 
                 label={tCommon('buyOrder') + " (+2.5%)"} 
                 checked={useBuyOrder} 
                 onChange={(e) => setUseBuyOrder(e.target.checked)}
                 className="text-xs text-muted-foreground"
               />
            </div>
            
            {/* Sell Journals */}
            <div className="space-y-3">
               <h4 className="font-medium text-muted-foreground text-sm">{t('sellEmptyJournal')}</h4>
               <Select
                 value={sellJournalCity}
                 onChange={(value) => setSellJournalCity(value)}
                 options={cityOptions}
               />
               <Checkbox 
                 label={tCommon('sellOrder') + " (+6.5%)"} 
                 checked={useSellOrder} 
                 onChange={(e) => setUseSellOrder(e.target.checked)}
                 className="text-xs text-muted-foreground"
               />
            </div>
            
            {/* Sell Materials */}
            <div className="space-y-3">
               <div className="flex justify-between items-baseline">
                   <h4 className="font-medium text-muted-foreground text-sm">{t('sellMaterialsTo')}</h4>
                   <Tooltip content={t('tooltips.materialPrice')}>
                       <CircleHelp className="h-3 w-3 text-muted-foreground" />
                   </Tooltip>
               </div>
               <Select
                 value={sellMaterialCity}
                 onChange={(value) => setSellMaterialCity(value)}
                 options={cityOptions}
               />
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {data.map((tierData) => (
            <div key={tierData.tier} className="bg-card/50 border border-border rounded-xl overflow-hidden transition-all hover:border-primary/30">
              {/* Header Row */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 select-none"
                onClick={() => toggleExpand(tierData.tier)}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg border ${
                    tierData.tier >= 7 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                    tierData.tier >= 5 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }`}>
                    T{tierData.tier}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{tierData.journalName}</div>
                    <div className="text-xs text-muted-foreground flex gap-2">
                       <span>{t('yield')}: {tierData.yieldPercent.toFixed(0)}%</span>
                       {tierData.missingData && (
                         <span className="text-warning flex items-center gap-1">
                           <Info className="h-3 w-3" /> {tCommon('missingData')}
                         </span>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{tCommon('revenue')}</div>
                    <div className="font-mono">{tierData.totalRevenue.toLocaleString()}</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{tCommon('cost')}</div>
                    <div className="font-mono">{tierData.totalCost.toLocaleString()}</div>
                  </div>
                  <div className="text-right w-24">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{tCommon('profit')}</div>
                    <div className={`font-mono font-bold ${tierData.profit > 0 ? 'text-success' : 'text-destructive'}`}>
                      {tierData.profit > 0 ? '+' : ''}{tierData.profit.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right w-16">
                     <div className={`font-bold ${tierData.roi > 0 ? 'text-success' : 'text-destructive'}`}>
                        {tierData.roi.toFixed(0)}%
                     </div>
                  </div>
                  {expandedTiers.has(tierData.tier) ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedTiers.has(tierData.tier) && (
                <div className="border-t border-border bg-muted/10 p-4 animate-in slide-in-from-top-2">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left: Breakdown */}
                      <div className="space-y-4">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('transactionBreakdown')}</h4>
                          
                          {/* Cost */}
                          <div className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted/20">
                              <div className="flex items-center gap-2">
                                  <ItemIcon itemId={tierData.journalId} className="h-8 w-8" />
                                  <span>{t('fullJournalCost')}</span>
                              </div>
                              <div className="text-right">
                                  <div className="font-mono text-destructive">-{tierData.totalCost.toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">
                                      {tierData.fullJournalPrice.toLocaleString()} x {journalCount}
                                      {tierData.fullJournalVolume !== undefined && <span className="ml-2 opacity-70">Vol: {tierData.fullJournalVolume}</span>}
                                  </div>
                              </div>
                          </div>

                          {/* Empty Return */}
                          <div className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted/20">
                              <div className="flex items-center gap-2">
                                  <ItemIcon itemId={tierData.emptyJournalId} className="h-8 w-8" />
                                  <span>{t('emptyJournalReturn')}</span>
                              </div>
                              <div className="text-right">
                                  <div className="font-mono text-success">+{tierData.emptyJournalRevenue.toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">
                                      {tierData.emptyJournalPrice.toLocaleString()} x {journalCount}
                                      {tierData.emptyJournalVolume !== undefined && <span className="ml-2 opacity-70">Vol: {tierData.emptyJournalVolume}</span>}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="h-px bg-border/50 my-2" />
                          
                          {/* Materials Return */}
                          <div className="flex justify-between items-center text-sm p-2 rounded font-medium">
                              <span>{t('totalMaterialValue')}</span>
                              <span className="font-mono text-success">+{tierData.materialRevenue.toLocaleString()}</span>
                          </div>
                      </div>

                      {/* Right: Material Details */}
                      <div>
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('materialReturns')}</h4>
                          <div className="space-y-1">
                              {tierData.materials.map(mat => (
                                  <div key={mat.id} className={`flex justify-between items-center text-sm p-2 rounded ${mat.quantity > 0 ? 'hover:bg-muted/20' : 'opacity-50'}`}>
                                      <div className="flex items-center gap-2">
                                          <ItemIcon itemId={mat.id} className="h-8 w-8" />
                                          <div className="flex flex-col">
                                              <span>{localizedItemNames[mat.id] || mat.name}</span>
                                              <span className="text-xs text-muted-foreground">
                                                  {t('quantity')}: {mat.quantity.toFixed(1)} 
                                                  {mat.volume !== undefined && <span className="ml-2">Vol: {mat.volume}</span>}
                                              </span>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <div className="font-mono">{mat.totalValue.toLocaleString()}</div>
                                          <div className="text-xs text-muted-foreground">{mat.price.toLocaleString()} / {t('perUnit')}</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                   </div>
                </div>
              )}
            </div>
          ))}

          {data.length === 0 && !loading && (
             <div className="text-center py-12 text-muted-foreground">
                 {tCommon('noDataAvailable')}
             </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
