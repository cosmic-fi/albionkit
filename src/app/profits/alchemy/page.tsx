'use client';

import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { PageShell } from '@/components/PageShell';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';
import { ItemIcon } from '@/components/ItemIcon';
import { FeatureLock } from '@/components/subscription/FeatureLock';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { FlaskConical, RefreshCw, Scale, ChevronDown, ChevronUp, Settings, TrendingUp, DollarSign, Package, MapPin, Calculator, ShoppingCart, Info, Loader2, CircleHelp, Lock } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { Checkbox } from '@/components/ui/Checkbox';
import { getMarketPrices, getMarketHistory, getConsumablesList, getGameInfoItemData, OpenAlbionConsumable } from '@/lib/market-service';
import { RECIPES, AlchemyRecipe, Ingredient, CITY_OPTIONS } from './constants';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import { Tooltip } from '@/components/ui/Tooltip';

// Interfaces for enhanced data structure
interface EnhancedIngredient extends Ingredient {
  price: number;
  totalCost: number;
  weightTotal: number;
  volume24h: number;
  buyCity: string;
}

interface EnhancedRecipe extends AlchemyRecipe {
  productPrice: number;
  ingredientDetails: EnhancedIngredient[];
  totalIngredientsCost: number;
  effectiveCost: number;
  revenue: number;
  profit: number;
  roi: number;
  missingData: boolean;
  totalWeightIngredients: number;
  totalWeightProduct: number;
  productVolume24h: number;
}

const MOUNT_OPTIONS = [
  { value: 'ox_t3', label: 'Transport Ox (T3)', capacity: 784 },
  { value: 'ox_t4', label: 'Transport Ox (T4)', capacity: 1358 },
  { value: 'ox_t5', label: 'Transport Ox (T5)', capacity: 1982 },
  { value: 'ox_t6', label: 'Transport Ox (T6)', capacity: 2756 },
  { value: 'ox_t7', label: 'Transport Ox (T7)', capacity: 3752 },
  { value: 'ox_t8', label: 'Transport Ox (T8)', capacity: 4946 },
  { value: 'mammoth', label: 'Transport Mammoth', capacity: 25735 }
];

export default function AlchemyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const { server: region, setServer: setRegion } = useServer();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Filter States
  const [quantity, setQuantity] = useState(50); // Default reasonable quantity for potions
  const [showEnchanted, setShowEnchanted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false); // Collapsible state
  const [isPremium, setIsPremium] = useState(true);
  
  // Market Strategy
  const [sellOrderType, setSellOrderType] = useState<'sell_order' | 'sell_price_min'>('sell_order');
  const [includeSellTax, setIncludeSellTax] = useState(true);
  const [buyOrderType, setBuyOrderType] = useState<'buy_order' | 'sell_order'>('sell_order');
  const [includeBuyTax, setIncludeBuyTax] = useState(true);
  
  // Production Bonuses
  const [usageFee, setUsageFee] = useState(400); // Standard alchemy fee
  const [dailyBonus, setDailyBonus] = useState(false);
  const [customRRR, setCustomRRR] = useState<number | null>(null);
  const [useFocus, setUseFocus] = useState(false);
  
  // City Preferences
  const [sellCity, setSellCity] = useState('Lymhurst');
  const [buyCityMap, setBuyCityMap] = useState<Record<string, string>>({}); 

  // Transport
  const [selectedMount, setSelectedMount] = useState('mammoth');

  // API Data
  const [apiRecipes, setApiRecipes] = useState<OpenAlbionConsumable[]>([]);
  const [customRecipe, setCustomRecipe] = useState<AlchemyRecipe | null>(null);
  
  const [fetchedPrices, setFetchedPrices] = useState<any[]>([]);
  const [fetchedHistory, setFetchedHistory] = useState<any[]>([]);
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});

  // Data
  const [calculation, setCalculation] = useState<EnhancedRecipe[] | null>(null);

  // Computed RRR
  const calculatedRRR = useMemo(() => {
    if (customRRR !== null) return customRRR;
    let base = 15.2; // Base city RRR
    if (dailyBonus) base += 10;
    if (useFocus) base = 43.5;
    return base;
  }, [customRRR, dailyBonus, useFocus]);

  const selectedRecipe = useMemo(() => {
    const constantRecipe = RECIPES.find(r => r.id === selectedRecipeId);
    if (constantRecipe) return constantRecipe;
    
    if (customRecipe && customRecipe.productId === selectedRecipeId) {
        return customRecipe;
    }
    
    return null;
  }, [selectedRecipeId, customRecipe]);

  // Initialize default buy cities
  useEffect(() => {
    if (selectedRecipe && Object.keys(buyCityMap).length === 0) {
        const defaults: Record<string, string> = {};
        selectedRecipe.ingredients.forEach(ing => {
            defaults[ing.itemId] = 'Lymhurst'; 
        });
        setBuyCityMap(defaults);
    }
  }, [selectedRecipe, buyCityMap]);

  // Fetch Custom Recipe Data
  useEffect(() => {
    const fetchCustomRecipe = async () => {
        setError(null);
        if (!selectedRecipeId) {
            setCustomRecipe(null);
            return;
        }

        const constantRecipe = RECIPES.find(r => r.id === selectedRecipeId);
        if (constantRecipe) {
            setCustomRecipe(null);
            return;
        }

        if (customRecipe?.productId === selectedRecipeId) return;

        setLoading(true);
        try {
            const apiItem = apiRecipes.find(r => r.identifier === selectedRecipeId);
            const gameInfoData = await getGameInfoItemData(selectedRecipeId);
            
            if (!gameInfoData || !gameInfoData.craftingRequirements) {
                setError('Recipe data not found or incomplete in game database.');
                return;
            }

            if (gameInfoData && gameInfoData.craftingRequirements) {
                 const craftReq = gameInfoData.craftingRequirements;
                 const resources = craftReq.craftingResources || [];
                 
                 let amount = craftReq.amount || 5;

                 const ingredients: Ingredient[] = resources.map(res => ({
                     itemId: res.uniqueName,
                     name: res.uniqueName.split('_').slice(1).join(' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                     count: res.count,
                     weight: 0,
                     enchantable: res.uniqueName.includes('PLANT') || res.uniqueName.includes('HERB') // Heuristic for enchantability
                 }));

                 const tierMatch = selectedRecipeId.match(/^T(\d+)/);
                 const tier = tierMatch ? parseInt(tierMatch[1]) : (apiItem?.tier ? parseInt(apiItem.tier) : 4);

                 const newRecipe: AlchemyRecipe = {
                     id: selectedRecipeId,
                     name: gameInfoData.localizedNames['EN-US'] || apiItem?.name || selectedRecipeId,
                     productId: selectedRecipeId,
                     tier: tier,
                     yield: amount,
                     ingredients: ingredients,
                     itemWeight: 0,
                     nutrition: 0
                 };
                 setCustomRecipe(newRecipe);
                 return;
            }
        } catch (err: any) {
            console.error('Failed to fetch custom recipe', err);
            setError(`Failed to fetch recipe details: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    fetchCustomRecipe();
  }, [selectedRecipeId, apiRecipes]);

  const fetchMarketData = useCallback(async () => {
    if (!selectedRecipe) return;

    setLoading(true);
    setError(null);
    try {
      const itemsToFetch = new Set<string>();
      
      // Base Product + Enchanted Variants
      const tiers = showEnchanted ? [0, 1, 2, 3] : [0];
      tiers.forEach(ench => {
          const suffix = ench > 0 ? `@${ench}` : '';
          itemsToFetch.add(`${selectedRecipe.productId}${suffix}`);
          
          // Ingredients for this enchantment level
          selectedRecipe.ingredients.forEach(ing => {
              if (ing.enchantable) {
                  itemsToFetch.add(`${ing.itemId}${suffix}`);
              } else {
                  itemsToFetch.add(ing.itemId);
              }
          });
      });

      // Fetch Prices & History
      const pricesPromise = getMarketPrices(Array.from(itemsToFetch), region);
      const historyPromise = Promise.all(Array.from(itemsToFetch).map(id => getMarketHistory(id, region)));
      
      const [prices, historyBatches] = await Promise.all([pricesPromise, historyPromise]);
      
      setFetchedPrices(prices);
      setFetchedHistory(historyBatches.flat());

    } catch (error: any) {
      console.error(error);
      setError(`Data fetch error: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [selectedRecipe, showEnchanted, region]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Calculation Logic
  useEffect(() => {
    if (!selectedRecipe || fetchedPrices.length === 0) return;

    try {
      const tiers = showEnchanted ? [0, 1, 2, 3] : [0];
      const results: EnhancedRecipe[] = [];

      const getPrice = (id: string, city: string, type: 'buy' | 'sell') => {
        // Manual override check
        if (manualPrices[id] !== undefined) return manualPrices[id];

        const stats = fetchedPrices.filter(p => p.item_id === id && p.city === city);
        if (!stats.length) return 0;
        
        if (type === 'buy') {
            const relevant = buyOrderType === 'buy_order' ? stats[0].buy_price_max : stats[0].sell_price_min;
            return relevant > 0 ? relevant : 0;
        } 
        
        if (type === 'sell') {
            const relevant = sellOrderType === 'sell_order' ? stats[0].sell_price_min : stats[0].buy_price_max;
            return relevant > 0 ? relevant : 0;
        }
        return 0;
      };

      const getVolume = (id: string, city: string) => {
          const entry = fetchedHistory.find((h: any) => h.item_id === id && h.location === city);
          if (!entry || !entry.data) return 0;
          
          const now = new Date();
          const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          
          return entry.data.reduce((sum: number, p: any) => {
              if (new Date(p.timestamp) >= cutoff) return sum + p.item_count;
              return sum;
          }, 0);
      };

      tiers.forEach(ench => {
          const suffix = ench > 0 ? `@${ench}` : '';
          const currentProductId = `${selectedRecipe.productId}${suffix}`;
          
          // Product Financials
          const productPriceUnit = getPrice(currentProductId, sellCity, 'sell');
          const productVolume = getVolume(currentProductId, sellCity);
          
          // Ingredient Financials
          const enhancedIngredients = selectedRecipe.ingredients.map(ing => {
              const currentIngId = ing.enchantable ? `${ing.itemId}${suffix}` : ing.itemId;
              const city = buyCityMap[ing.itemId] || 'Martlock'; // Use base itemId for map key
              const priceUnit = getPrice(currentIngId, city, 'buy');
              
              const costPrice = buyOrderType === 'buy_order' && includeBuyTax 
                ? priceUnit * 1.025 
                : priceUnit;

              const totalCount = ing.count * (quantity / selectedRecipe.yield);
              const totalCost = costPrice * totalCount;
              const totalWeight = (ing.weight || 0) * totalCount;
              
              return {
                  ...ing,
                  itemId: currentIngId, // Update ID to enchanted version if applicable
                  price: priceUnit,
                  totalCost,
                  weightTotal: totalWeight,
                  volume24h: getVolume(currentIngId, city),
                  buyCity: city
              };
          });

          // Step 1 Cost (Base Ingredients with RRR)
          const baseIngCostSum = enhancedIngredients.reduce((s, i) => s + i.totalCost, 0);
          const effectiveBaseCost = baseIngCostSum * (1 - (calculatedRRR / 100));
          
          // Step 2 Cost (Fees)
          const totalCost = effectiveBaseCost + (usageFee * (quantity / 100) * 5);
          
          const totalWeightIng = enhancedIngredients.reduce((s, i) => s + i.weightTotal, 0);

          const baseTax = isPremium ? 0.04 : 0.08;
          const setupFee = sellOrderType === 'sell_order' ? 0.025 : 0;
          const taxRate = includeSellTax ? (baseTax + setupFee) : 0;
          const revenueTotal = productPriceUnit * quantity * (1 - taxRate);
          
          const profit = revenueTotal - totalCost;
          const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

          results.push({
              ...selectedRecipe,
              name: ench > 0 ? `${selectedRecipe.name} (T${selectedRecipe.tier}.${ench})` : selectedRecipe.name,
              productId: currentProductId,
              productPrice: productPriceUnit,
              ingredientDetails: enhancedIngredients,
              totalIngredientsCost: totalCost,
              effectiveCost: totalCost,
              revenue: revenueTotal,
              profit,
              roi,
              missingData: productPriceUnit === 0,
              totalWeightIngredients: totalWeightIng,
              totalWeightProduct: (selectedRecipe.itemWeight || 0) * quantity,
              productVolume24h: productVolume
          });
      });

      setCalculation(results);

    } catch (error: any) {
      console.error(error);
      setError(`Calculation error: ${error.message || 'Unknown error'}`);
    }
  }, [selectedRecipe, fetchedPrices, fetchedHistory, manualPrices, quantity, showEnchanted, sellOrderType, buyOrderType, calculatedRRR, sellCity, region, includeBuyTax, includeSellTax, usageFee, buyCityMap, isPremium]);

  useEffect(() => {
    getConsumablesList().then(list => {
        setApiRecipes(list.filter(i => i.name.includes('Potion') || i.name.includes('Flask') || i.name.includes('Elixir')));
    });
  }, []);

  // Helper
  const formatSilver = (val: number) => Math.round(val).toLocaleString();
  const toggleExpand = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const recipeOptions = useMemo(() => {
    const options = RECIPES.map(r => ({ 
        value: r.id, 
        label: r.name,
        icon: <ItemIcon itemId={r.productId} className="w-5 h-5 object-contain rounded-sm" />
    }));
    
    const apiOptions = apiRecipes
        .map(ar => ({ 
            value: ar.identifier, 
            label: `${ar.name} (T${ar.tier})`,
            icon: <ItemIcon itemId={ar.identifier} className="w-5 h-5 object-contain rounded-sm" />
        }))
        .filter(opt => !options.some(o => o.value === opt.value));
        
    return [...options, ...apiOptions];
  }, [apiRecipes]);

  return (
    <PageShell
      title="Alchemy Calculator" 
      backgroundImage='/background/ao-crafting.jpg'  
      description="Potion crafting profitability analysis."
      icon={<FlaskConical className="h-6 w-6" />}
      headerActions={
        <div className="flex flex-wrap items-center gap-4">
          <ServerSelector selectedServer={region} onServerChange={setRegion} />
          <button onClick={fetchMarketData} disabled={loading} className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border transition-colors">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Main Configuration Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm transition-all duration-300">
             <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between rounded-t-xl">
                 <div className="flex items-center gap-2">
                     <Settings className="h-5 w-5 text-muted-foreground" />
                     <h3 className="font-bold text-foreground">Configuration</h3>
                 </div>
                 <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`flex items-center gap-1 text-xs font-bold transition-colors ${showAdvanced ? 'text-warning' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                    <Settings className="h-3 w-3" />
                    {showAdvanced ? 'Simple Mode' : 'Advanced Mode'}
                 </button>
             </div>

             <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-4 space-y-1">
                     <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
                         <FlaskConical className="h-3 w-3" /> Recipe
                     </label>
                    <Select 
                        value={selectedRecipeId}
                        onChange={(val) => setSelectedRecipeId(val)}
                        options={recipeOptions}
                        className="w-full"
                        searchable={true}
                    />
                </div>
                <div className="md:col-span-3 space-y-1">
                     <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
                         <MapPin className="h-3 w-3" /> Sell City
                     </label>
                     <Select 
                          value={sellCity}
                          onChange={(val) => setSellCity(val)}
                          options={CITY_OPTIONS}
                     />
                </div>
                <div className="md:col-span-2 space-y-1">
                     <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
                         <Calculator className="h-3 w-3" /> Quantity
                     </label>
                     <NumberInput value={quantity} onChange={setQuantity} min={5} step={5} />
                </div>
                <div className="md:col-span-3 pb-1">
                     <Checkbox label="Enchanted Variants" checked={showEnchanted} onChange={(e) => setShowEnchanted(e.target.checked)} />
                </div>
             </div>

             {/* Advanced Configuration (Collapsible) */}
             {showAdvanced && (
                <FeatureLock
                    title="Advanced Market Strategy"
                    description="Unlock precise control over taxes, city-specific buying, and RRR calculations."
                    className="rounded-t-none border-t border-border"
                >
                <div className="p-6 border-t border-border bg-muted/30 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-200 rounded-b-xl">
                    {/* Market Strategy */}
                    <div className="bg-card/50 p-4 rounded-lg border border-border/50 space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                            <TrendingUp className="h-4 w-4 text-success" />
                            <h4 className="text-sm font-bold text-foreground">Market Strategy</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="pb-2 border-b border-border/50">
                                <Checkbox label="Premium Status" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground font-medium block mb-1.5 uppercase tracking-wide">Buying Method</label>
                                <SegmentedControl 
                                    value={buyOrderType}
                                    onChange={(v) => setBuyOrderType(v as any)}
                                    options={[
                                        { value: 'buy_order', label: 'Buy Order' },
                                        { value: 'sell_order', label: 'Instant Buy' }
                                    ]}
                                    size="sm"
                                    className="w-fit"
                                />
                                <div className="mt-2"><Checkbox label="Include Taxes (2.5%)" checked={includeBuyTax} onChange={(e) => setIncludeBuyTax(e.target.checked)} className="text-xs" /></div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground font-medium block mb-1.5 uppercase tracking-wide">Selling Method</label>
                                <SegmentedControl 
                                    value={sellOrderType}
                                    onChange={(v) => setSellOrderType(v as any)}
                                    options={[
                                        { value: 'sell_order', label: 'Sell Order' },
                                        { value: 'sell_price_min', label: 'Instant Sell' }
                                    ]}
                                    size="sm"
                                    className="w-fit"
                                />
                                <div className="mt-2"><Checkbox label="Include Taxes (6.5% / 4%)" checked={includeSellTax} onChange={(e) => setIncludeSellTax(e.target.checked)} className="text-xs" /></div>
                            </div>
                        </div>
                    </div>

                    {/* Bonuses */}
                    <div className="bg-card/50 p-4 rounded-lg border border-border/50 space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                            <DollarSign className="h-4 w-4 text-warning" />
                            <h4 className="text-sm font-bold text-foreground">Bonuses & Fees</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <NumberInput label="Usage Fee" value={usageFee} onChange={setUsageFee} />
                            <div className="pt-6">
                               <Checkbox label="Daily Bonus" checked={dailyBonus} onChange={(e) => setDailyBonus(e.target.checked)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                             <NumberInput label="Custom RRR %" value={customRRR || 0} onChange={setCustomRRR} placeholder="Override" />
                             <div className="text-right bg-muted/50 p-2 rounded border border-border/50 w-fit">
                                 <span className="text-[10px] text-muted-foreground block uppercase font-bold">Effective RRR</span>
                                 <span className="text-lg font-mono text-success font-bold">{calculatedRRR}%</span>
                             </div>
                        </div>
                        <div className="pt-1 border-t border-border/50">
                            <Checkbox label="Use Focus (43.5% RRR)" checked={useFocus} onChange={(e) => setUseFocus(e.target.checked)} />
                        </div>
                    </div>

                    {/* Sourcing Cities */}
                    <div className="bg-card/50 p-4 rounded-lg border border-border/50 space-y-4">
                         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                            <Package className="h-4 w-4 text-blue-500" />
                            <h4 className="text-sm font-bold text-foreground">Sourcing Cities</h4>
                        </div>
                         <div className="space-y-3">
                             {selectedRecipe?.ingredients.map(ing => (
                                 <div key={ing.itemId} className="flex items-center justify-between text-sm group">
                                     <div className="flex items-center gap-2">
                                         <div className="h-6 w-6 bg-muted rounded p-0.5 border border-border">
                                            <ItemIcon itemId={ing.itemId} alt="" className="w-full h-full object-contain" />
                                         </div>
                                         <span className="text-muted-foreground truncate max-w-[100px] group-hover:text-foreground transition-colors">{ing.name}</span>
                                     </div>
                                     <div className="w-35">
                                        <Select 
                                            value={buyCityMap[ing.itemId] || 'Martlock'}
                                            onChange={(value) => setBuyCityMap({...buyCityMap, [ing.itemId]: value})}
                                            options={CITY_OPTIONS}
                                            className="h-8 text-[13px]"
                                        />
                                     </div>
                                 </div>
                             ))}
                             {selectedRecipe?.ingredients.length === 0 && (
                                 <div className="text-xs text-muted-foreground italic text-center py-4">
                                     No ingredients to configure
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
                </FeatureLock>
             )}
        </div>

        {!selectedRecipeId && (
             <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
                 <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-medium text-muted-foreground">Select a recipe to start brewing</h3>
                 <p className="text-muted-foreground">Choose a potion to calculate profits.</p>
             </div>
        )}

        {loading && (
            <div className="py-20 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-success" />
            </div>
        )}

        {!loading && selectedRecipeId && (!calculation || calculation.length === 0) && (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
                 <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-medium text-muted-foreground">
                    {error ? 'Error Occurred' : 'No data available'}
                 </h3>
                 <p className="text-muted-foreground max-w-md mx-auto">
                    {error || 'Could not calculate profits for this recipe. Try selecting another region or checking your connection.'}
                 </p>
            </div>
        )}

        {/* Results Area */}
        {!loading && calculation && calculation.length > 0 && (
            <div className="space-y-6">
                
                {/* Price Configuration */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-3 bg-muted/50 border-b border-border font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-success" />
            <span>Price Configuration (Edit to recalculate)</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Product Price */}
            <div className="bg-muted/20 p-3 rounded border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <ItemIcon itemId={calculation[0].productId} className="h-8 w-8 object-contain" alt={calculation[0].name} />
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-foreground truncate" title={calculation[0].name}>{calculation[0].name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{sellCity} (Sell)</div>
                  </div>
                </div>
                <NumberInput 
                    label="Sell Price"
                    value={manualPrices[calculation[0].productId] ?? calculation[0].productPrice} 
                    onChange={(val) => setManualPrices(prev => ({...prev, [calculation[0].productId]: val}))}
                    min={0}
                    step={100}
                    className="h-8 text-xs bg-background"
                    containerClassName="!mb-0"
                    isCustom={manualPrices[calculation[0].productId] !== undefined}
                    onReset={() => {
                        const newPrices = {...manualPrices};
                        delete newPrices[calculation[0].productId];
                        setManualPrices(newPrices);
                    }}
                />
            </div>

            {/* Ingredients */}
            {calculation[0].ingredientDetails.map((ing, idx) => (
              <div key={idx} className="bg-muted/20 p-3 rounded border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <ItemIcon itemId={ing.itemId} className="h-8 w-8 object-contain" alt={ing.name} />
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-foreground truncate" title={ing.name}>{ing.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{ing.buyCity} (Buy)</div>
                  </div>
                </div>
                <NumberInput 
                    label="Buy Price"
                    value={manualPrices[ing.itemId] ?? ing.price} 
                    onChange={(val) => setManualPrices(prev => ({...prev, [ing.itemId]: val}))}
                    min={0}
                    step={100}
                    className="h-8 text-xs bg-background"
                    containerClassName="!mb-0"
                    isCustom={manualPrices[ing.itemId] !== undefined}
                    onReset={() => {
                        const newPrices = {...manualPrices};
                        delete newPrices[ing.itemId];
                        setManualPrices(newPrices);
                    }}
                />
              </div>
            ))}
          </div>
        </div>

                {/* Summary Cards for Top Item */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card p-4 rounded-xl border border-border">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Total Revenue</span>
                        <div className="text-xl font-mono text-foreground mt-1">{formatSilver(calculation[0].revenue)}</div>
                    </div>
                    <div className="bg-card p-4 rounded-xl border border-border">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Total Cost</span>
                        <div className="text-xl font-mono text-foreground mt-1">{formatSilver(calculation[0].effectiveCost)}</div>
                    </div>
                    <div className="bg-card p-4 rounded-xl border border-border">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Net Profit</span>
                        <div className={`text-xl font-mono mt-1 ${calculation[0].profit > 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatSilver(calculation[0].profit)}
                        </div>
                    </div>
                    <div className="bg-card p-4 rounded-xl border border-border">
                        <span className="text-xs text-muted-foreground uppercase font-bold">ROI</span>
                        <div className={`text-xl font-mono mt-1 ${calculation[0].roi > 0 ? 'text-success' : 'text-destructive'}`}>
                            {calculation[0].roi.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Transport & Weight (Compact) */}
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-muted-foreground">Transport:</span>
                    </div>
                    <div className="w-48">
                        <Select 
                            value={selectedMount}
                            onChange={(value) => setSelectedMount(value)}
                            options={MOUNT_OPTIONS}
                            className="h-8 text-xs"
                        />
                    </div>
                    <div className="flex items-center gap-4 text-foreground">
                        <div>Inputs: <span className="text-foreground font-mono">{Math.round(calculation[0].totalWeightIngredients)}kg</span></div>
                        <div>Outputs: <span className="text-foreground font-mono">{Math.round(calculation[0].totalWeightProduct)}kg</span></div>
                        {(() => {
                            const cap = MOUNT_OPTIONS.find(m => m.value === selectedMount)?.capacity || 1;
                            const totalW = Math.max(calculation[0].totalWeightIngredients, calculation[0].totalWeightProduct);
                            const loadPct = (totalW / cap) * 100;
                            return (
                                <div className={`${loadPct > 100 ? 'text-destructive' : 'text-success'} font-bold`}>
                                    Load: {loadPct.toFixed(1)}%
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Main Results Table with Expandable Rows */}
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                   <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                           <thead>
                               <tr className="bg-muted/40 text-xs text-muted-foreground uppercase border-b border-border">
                                   <th className="p-4 font-bold">Potion</th>
                                   <th className="p-4 font-bold text-right">
                                       <div className="flex items-center justify-end gap-1">
                                            <Tooltip content="Total cost including ingredients, taxes, and fees.">
                                                <span>Cost</span>
                                                <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                            </Tooltip>
                                       </div>
                                   </th>
                                   <th className="p-4 font-bold text-right">
                                       <div className="flex items-center justify-end gap-1">
                                            <Tooltip content="Total revenue from selling products.">
                                                <span>Revenue</span>
                                                <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                            </Tooltip>
                                       </div>
                                   </th>
                                   <th className="p-4 font-bold text-right">
                                       <div className="flex items-center justify-end gap-1">
                                            <Tooltip content="Net profit after all costs and taxes.">
                                                <span>Profit</span>
                                                <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                            </Tooltip>
                                       </div>
                                   </th>
                                   <th className="p-4 font-bold text-right">
                                       <div className="flex items-center justify-end gap-1">
                                            <Tooltip content="Return on Investment (Profit / Cost * 100).">
                                                <span>ROI</span>
                                                <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                            </Tooltip>
                                       </div>
                                   </th>
                                   <th className="p-4 w-10"></th>
                               </tr>
                           </thead>
                           <tbody>
                               {calculation.map((row) => (
                                   <Fragment key={row.productId}>
                                       <tr 
                                           onClick={() => toggleExpand(row.productId)}
                                           className={`border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group ${expandedRow === row.productId ? 'bg-muted/30' : ''}`}
                                       >
                                           <td className="p-4">
                                               <div className="flex items-center gap-3">
                                                   <div className="h-10 w-10 bg-muted rounded-lg p-1 border border-border relative">
                                                       <ItemIcon itemId={row.productId} alt="" className="w-full h-full object-contain" />
                                                   </div>
                                                   <div>
                                                       <div className="font-bold text-foreground">{row.name}</div>
                                                       <div className="text-xs text-muted-foreground">{row.productId}</div>
                                                   </div>
                                               </div>
                                           </td>
                                           <td className="p-4 text-right font-mono text-muted-foreground">{formatSilver(row.effectiveCost)}</td>
                                           <td className="p-4 text-right font-mono text-muted-foreground">{formatSilver(row.revenue)}</td>
                                           <td className={`p-4 text-right font-mono font-bold ${row.profit > 0 ? 'text-success' : 'text-destructive'}`}>
                                               {formatSilver(row.profit)}
                                           </td>
                                           <td className={`p-4 text-right font-mono ${row.roi > 0 ? 'text-success' : 'text-destructive'}`}>
                                               {row.roi.toFixed(1)}%
                                           </td>
                                           <td className="p-4 text-center">
                                               {expandedRow === row.productId ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                           </td>
                                       </tr>
                                       {expandedRow === row.productId && (
                                           <tr className="bg-muted/20">
                                               <td colSpan={6} className="p-4">
                                                   <div className="rounded-lg border border-border/50 overflow-hidden">
                                                       <table className="w-full text-sm">
                                                           <thead>
                                                               <tr className="bg-muted/50 text-xs text-muted-foreground uppercase border-b border-border/50">
                                                                   <th className="p-2 pl-4">Ingredient</th>
                                                                   <th className="p-2 text-right">Price</th>
                                                                   <th className="p-2 text-right">Amount</th>
                                                                   <th className="p-2 text-right">Total</th>
                                                               </tr>
                                                           </thead>
                                                           <tbody>
                                                               {row.ingredientDetails.map((ing, idx) => (
                                                                   <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                                                                       <td className="p-2 pl-4">
                                                                           <div className="flex items-center gap-2">
                                                                               <div className="h-6 w-6 bg-muted rounded border border-border">
                                                                                    <ItemIcon itemId={ing.itemId} alt="" className="w-full h-full object-contain" />
                                                                               </div>
                                                                               <span className="text-foreground">{ing.name}</span>
                                                                           </div>
                                                                       </td>
                                                                       <td className="p-2 text-right font-mono text-muted-foreground">{formatSilver(ing.price)}</td>
                                                                       <td className="p-2 text-right font-mono text-muted-foreground">{ing.count * (quantity / row.yield)}</td>
                                                                       <td className="p-2 text-right font-mono text-foreground">{formatSilver(ing.totalCost)}</td>
                                                                   </tr>
                                                               ))}
                                                           </tbody>
                                                       </table>
                                                   </div>
                                               </td>
                                           </tr>
                                       )}
                                   </Fragment>
                               ))}
                           </tbody>
                       </table>
                   </div>
                </div>
            </div>
        )}
      </div>
      <InfoStrip currentPage="profits-alchemy">
        <InfoBanner icon={<FlaskConical className="w-4 h-4" />} color="text-emerald-400" title="Maximize Your Alchemy Profits">
          <p>Profits are highly sensitive to Resource Return Rates (RRR).</p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-400" />
               <span>Use Focus (47%+ RRR)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-400" />
               <span>Craft in City with Bonus</span>
            </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-400" />
               <span>Check Daily Production Bonuses</span>
            </div>
          </div>
        </InfoBanner>
      </InfoStrip>
    </PageShell>
  );
}
