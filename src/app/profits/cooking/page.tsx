'use client';

import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import { ItemIcon } from '@/components/ItemIcon';
import { Utensils, RefreshCw, Scale, ChevronDown, ChevronUp, Settings, TrendingUp, DollarSign, Package, MapPin, Calculator, ShoppingCart, Info, Loader2, CircleHelp } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tooltip } from '@/components/ui/Tooltip';
import { getMarketPrices, getMarketHistory, getConsumablesList, getConsumableDetails, getGameInfoItemData, MarketStat, MarketHistory, OpenAlbionConsumable, GameInfoItem } from '@/lib/market-service';
import { RECIPES, FoodRecipe, Ingredient, FISH_SAUCES } from './constants';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import { FeatureLock } from '@/components/subscription/FeatureLock';

// Interfaces for enhanced data structure
interface EnhancedIngredient extends Ingredient {
    price: number;
    totalCost: number;
    weightTotal: number;
    volume24h: number;
    buyCity: string;
    sellOrderCount?: number;
    baseFocusCost?: number;
}

interface EnhancedRecipe extends FoodRecipe {
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
    sellOrderCount?: number;
    buyOrderCount?: number;
    sauceDetails?: EnhancedIngredient[]; // For enchanted recipes
    baseFocusCost?: number;
}

const CITY_OPTIONS = [
    { value: 'Bridgewatch', label: 'Bridgewatch' },
    { value: 'Fort Sterling', label: 'Fort Sterling' },
    { value: 'Lymhurst', label: 'Lymhurst' },
    { value: 'Martlock', label: 'Martlock' },
    { value: 'Thetford', label: 'Thetford' },
    { value: 'Caerleon', label: 'Caerleon' },
    { value: 'Black Market', label: 'Black Market' }
];

const MOUNT_OPTIONS = [
    { value: 'ox_t3', label: 'Transport Ox (T3)', capacity: 784 },
    { value: 'ox_t4', label: 'Transport Ox (T4)', capacity: 1358 },
    { value: 'ox_t5', label: 'Transport Ox (T5)', capacity: 1982 },
    { value: 'ox_t6', label: 'Transport Ox (T6)', capacity: 2756 },
    { value: 'ox_t7', label: 'Transport Ox (T7)', capacity: 3752 },
    { value: 'ox_t8', label: 'Transport Ox (T8)', capacity: 4946 },
    { value: 'mammoth', label: 'Transport Mammoth', capacity: 25735 }
];

export default function CookingPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
    const { server: region, setServer: setRegion } = useServer();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Filter States
    const [quantity, setQuantity] = useState(150);
    const [showEnchanted, setShowEnchanted] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false); // Collapsible state

    // Market Strategy
    const [sellOrderType, setSellOrderType] = useState<'sell_order' | 'sell_price_min'>('sell_order');
    const [includeSellTax, setIncludeSellTax] = useState(true);
    const [buyOrderType, setBuyOrderType] = useState<'buy_order' | 'sell_order'>('sell_order');
    const [includeBuyTax, setIncludeBuyTax] = useState(true);

    // Production Bonuses
    const [usageFee, setUsageFee] = useState(680);
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
    const [customRecipe, setCustomRecipe] = useState<FoodRecipe | null>(null);

    // Data
    const [marketData, setMarketData] = useState<{ prices: MarketStat[], histories: MarketHistory[] }>({ prices: [], histories: [] });
    const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
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

            // Check local constants first (now deprecated/empty)
            const constantRecipe = RECIPES.find(r => r.id === selectedRecipeId);
            if (constantRecipe) {
                setCustomRecipe(null);
                return;
            }

            if (customRecipe?.productId === selectedRecipeId) return;

            setLoading(true);
            try {
                // Find in API list for basic info
                const apiItem = apiRecipes.find(r => r.identifier === selectedRecipeId);

                // Try GameInfo (Direct Albion Data)
                const gameInfoData = await getGameInfoItemData(selectedRecipeId);

                if (!gameInfoData || !gameInfoData.craftingRequirements) {
                    setError('Recipe data not found or incomplete in game database.');
                    return;
                }

                if (gameInfoData && gameInfoData.craftingRequirements) {
                    const craftReq = gameInfoData.craftingRequirements;
                    const resources = craftReq.craftingResources || [];

                    // Determine Yield
                    let amount = craftReq.amount;
                    if (!amount || amount === 1) {
                        // Try to parse from OpenAlbion info
                        if (apiItem?.info) {
                            const match = apiItem.info.match(/per craft:\s*(\d+)/i);
                            if (match) amount = parseInt(match[1]);
                            else if (selectedRecipeId.includes('_MEAL_')) amount = 10; // Default for meals
                        } else if (selectedRecipeId.includes('_MEAL_')) {
                            amount = 10;
                        }
                    }
                    amount = amount || 1;

                    const ingredients: Ingredient[] = resources.map(res => ({
                        itemId: res.uniqueName,
                        name: res.uniqueName.split('_').slice(1).join(' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                        count: res.count,
                        weight: 0
                    }));

                    const tierMatch = selectedRecipeId.match(/^T(\d+)/);
                    const tier = tierMatch ? parseInt(tierMatch[1]) : (apiItem?.tier ? parseInt(apiItem.tier) : 4);

                    const newRecipe: FoodRecipe = {
                        id: selectedRecipeId,
                        name: gameInfoData.localizedNames['EN-US'] || apiItem?.name || selectedRecipeId,
                        productId: selectedRecipeId,
                        tier: tier,
                        yield: amount,
                        ingredients: ingredients,
                        itemWeight: 0,
                        nutrition: apiItem?.item_power || 0 // Proxy using IP or 0
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

    const fetchData = useCallback(async () => {
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
            });

            // Ingredients
            selectedRecipe.ingredients.forEach(ing => itemsToFetch.add(ing.itemId));

            // Fish Sauces
            if (showEnchanted) {
                FISH_SAUCES.forEach(sauce => itemsToFetch.add(sauce.id));
            }

            // Fetch Prices & History
            const pricesPromise = getMarketPrices(Array.from(itemsToFetch), region);
            const historyPromise = Promise.all(Array.from(itemsToFetch).map(id => getMarketHistory(id, region)));

            const [prices, historyBatches] = await Promise.all([pricesPromise, historyPromise]);
            const allHistories = historyBatches.flat();

            setMarketData({ prices, histories: allHistories });
        } catch (error: any) {
            console.error(error);
            setError(`Failed to fetch market data: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    }, [selectedRecipe, showEnchanted, region]);

    // Separate calculation logic to allow instant recalculation on price edits
    const calculate = useCallback(() => {
        const recipe = selectedRecipe;
        if (!recipe || (marketData.prices.length === 0 && !loading)) return;
        if (loading) return;

        const { prices, histories } = marketData;

        const getPrice = (id: string, city: string, type: 'buy' | 'sell') => {
            // Check manual override first
            if (manualPrices[id] !== undefined) return manualPrices[id];

            const stats = prices.filter(p => p.item_id === id && p.city === city);
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
            const entry = histories.find(h => h.item_id === id && h.location === city);
            if (!entry || !entry.data) return 0;

            const now = new Date();
            const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            return entry.data.reduce((sum, p) => {
                if (new Date(p.timestamp) >= cutoff) return sum + p.item_count;
                return sum;
            }, 0);
        };

        const results: EnhancedRecipe[] = [];
        const tiers = showEnchanted ? [0, 1, 2, 3] : [0];

        tiers.forEach(ench => {
            const suffix = ench > 0 ? `@${ench}` : '';
            const currentProductId = `${recipe.productId}${suffix}`;

            // Product Financials
            const productPriceUnit = getPrice(currentProductId, sellCity, 'sell');
            const productVolume = getVolume(currentProductId, sellCity);

            // Ingredient Financials
            let totalIngCost = 0;
            let totalWeightIng = 0;

            const enhancedIngredients = recipe.ingredients.map(ing => {
                const city = buyCityMap[ing.itemId] || 'Martlock';
                const priceUnit = getPrice(ing.itemId, city, 'buy');

                const costPrice = (buyOrderType === 'buy_order' && includeBuyTax && manualPrices[ing.itemId] === undefined)
                    ? priceUnit * 1.025
                    : priceUnit;

                const totalCount = ing.count * (quantity / recipe.yield);
                const totalCost = costPrice * totalCount;
                const totalWeight = (ing.weight || 0) * totalCount;

                return {
                    ...ing,
                    price: priceUnit,
                    totalCost,
                    weightTotal: totalWeight,
                    volume24h: getVolume(ing.itemId, city),
                    buyCity: city
                };
            });

            // Sauce Financials
            let sauceCost = 0;
            let enhancedSauces: EnhancedIngredient[] | undefined;

            if (ench > 0) {
                const sauceDef = FISH_SAUCES[ench - 1];
                const sauceCountPerCraft = recipe.yield * 1;

                if (sauceDef) {
                    const sauceCity = 'Lymhurst';
                    const saucePrice = getPrice(sauceDef.id, sauceCity, 'buy');
                    const costPrice = (buyOrderType === 'buy_order' && includeBuyTax && manualPrices[sauceDef.id] === undefined)
                        ? saucePrice * 1.025
                        : saucePrice;

                    const totalSauceCount = quantity;
                    const totalSauceCost = costPrice * totalSauceCount;
                    const totalSauceWeight = 0.1 * totalSauceCount;

                    enhancedSauces = [{
                        itemId: sauceDef.id,
                        name: sauceDef.name,
                        count: sauceCountPerCraft,
                        weight: 0.1,
                        price: saucePrice,
                        totalCost: totalSauceCost,
                        weightTotal: totalSauceWeight,
                        volume24h: getVolume(sauceDef.id, sauceCity),
                        buyCity: sauceCity
                    }];

                    sauceCost = totalSauceCost;
                    totalWeightIng += totalSauceWeight;
                }
            }

            // Step 1 Cost (Base Ingredients with RRR)
            const baseIngCostSum = enhancedIngredients.reduce((s, i) => s + i.totalCost, 0);
            const effectiveBaseCost = baseIngCostSum * (1 - (calculatedRRR / 100));

            // Step 2 Cost (Sauce + Fees)
            const totalCost = effectiveBaseCost + sauceCost + (usageFee * (quantity / 100) * 5);

            totalWeightIng += enhancedIngredients.reduce((s, i) => s + i.weightTotal, 0);

            const taxRate = includeSellTax ? (0.04 + (sellOrderType === 'sell_order' ? 0.025 : 0)) : 0;
            const revenueTotal = productPriceUnit * quantity * (1 - taxRate);

            const profit = revenueTotal - totalCost;
            const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

            results.push({
                ...recipe,
                name: ench > 0 ? `${recipe.name} (T${recipe.tier}.${ench})` : recipe.name,
                productId: currentProductId,
                productPrice: productPriceUnit,
                ingredientDetails: enhancedIngredients,
                sauceDetails: enhancedSauces,
                totalIngredientsCost: totalCost,
                effectiveCost: totalCost,
                revenue: revenueTotal,
                profit,
                roi,
                missingData: productPriceUnit === 0,
                totalWeightIngredients: totalWeightIng,
                totalWeightProduct: (recipe.itemWeight || 0) * quantity,
                productVolume24h: productVolume
            });
        });

        setCalculation(results);

    }, [marketData, manualPrices, selectedRecipe, quantity, showEnchanted, sellOrderType, buyOrderType, calculatedRRR, sellCity, includeBuyTax, includeSellTax, usageFee, buyCityMap, loading]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        calculate();
    }, [calculate]);

    useEffect(() => {
        getConsumablesList().then(list => {
            setApiRecipes(list);
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
            title="Cooking Calculator"
            backgroundImage='/background/ao-crafting.jpg'
            description="Advanced food crafting profitability analysis."
            icon={<Utensils className="h-6 w-6" />}
            headerActions={
                <div className="flex flex-wrap items-center gap-4">
                    <ServerSelector selectedServer={region} onServerChange={setRegion} />
                    <button onClick={fetchData} disabled={loading} className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border transition-colors">
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
                                <Utensils className="h-3 w-3" /> Recipe
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
                            <NumberInput value={quantity} onChange={setQuantity} min={10} step={10} />
                        </div>
                        <div className="md:col-span-3 pb-1">
                            <Checkbox label="Enchanted Variants" checked={showEnchanted} onChange={(e) => setShowEnchanted(e.target.checked)} />
                        </div>
                    </div>

                    {/* Advanced Configuration (Collapsible) */}
                    {showAdvanced && (
                        <FeatureLock
                            title="Advanced Profit Strategy"
                            description="Unlock advanced market strategy, RRR tuning, and sourcing city optimizations."
                        >
                            <div className="p-6 border-t border-border bg-muted/30 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-200 rounded-b-xl">
                                {/* Market Strategy */}
                                <div className="bg-card/50 p-4 rounded-lg border border-border/50 space-y-4">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                                        <TrendingUp className="h-4 w-4 text-success" />
                                        <h4 className="text-sm font-bold text-foreground">Market Strategy</h4>
                                    </div>
                                    <div className="space-y-4">
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
                                <div className="bg-card/50 p-4 rounded-lg border border-border/50  space-y-4">
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
                                        <div className="text-right bg-muted/50 p-2 rounded border border-border/50 w-fit" >
                                            <span className="text-[10px] text-muted-foreground block uppercase font-bold">Effective RRR</span>
                                            <span className="text-lg font-mono text-success font-bold">{calculatedRRR}%</span>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-border/50">
                                        <Checkbox label="Use Focus (43.5% RRR)" checked={useFocus} onChange={(e) => setUseFocus(e.target.checked)} />
                                    </div>
                                </div>

                                {/* Sourcing Cities */}
                                <div className="bg-card/50 p-4 rounded-lg border border-border/50 space-y-4">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                                        <Package className="h-4 w-4 text-primary" />
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
                                                        onChange={(value) => setBuyCityMap({ ...buyCityMap, [ing.itemId]: value })}
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
                        <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground">Select a recipe to start cooking</h3>
                        <p className="text-muted-foreground">Choose a food item to calculate profits.</p>
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
                                        onChange={(val) => setManualPrices(prev => ({ ...prev, [calculation[0].productId]: val }))}
                                        min={0}
                                        step={100}
                                        className="h-8 text-xs bg-background"
                                        containerClassName="!mb-0"
                                        isCustom={manualPrices[calculation[0].productId] !== undefined}
                                        onReset={() => {
                                            const newPrices = { ...manualPrices };
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
                                            onChange={(val) => setManualPrices(prev => ({ ...prev, [ing.itemId]: val }))}
                                            min={0}
                                            step={100}
                                            className="h-8 text-xs bg-background"
                                            containerClassName="!mb-0"
                                            isCustom={manualPrices[ing.itemId] !== undefined}
                                            onReset={() => {
                                                const newPrices = { ...manualPrices };
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
                                        <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 border-b border-border">
                                            <th className="p-4 pl-6">Product</th>
                                            <th className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip content="Market sell price per unit">
                                                        <span>Sell Price</span>
                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                    </Tooltip>
                                                </div>
                                            </th>
                                            <th className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip content="Total volume sold in the last 24 hours">
                                                        <span>24h Vol</span>
                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                    </Tooltip>
                                                </div>
                                            </th>
                                            <th className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip content="Total cost including ingredients, taxes, and fees">
                                                        <span>Total Cost</span>
                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                    </Tooltip>
                                                </div>
                                            </th>
                                            <th className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip content="Net profit after all costs and taxes">
                                                        <span>Profit</span>
                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                    </Tooltip>
                                                </div>
                                            </th>
                                            <th className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip content="Return on Investment (Profit / Cost * 100)">
                                                        <span>ROI</span>
                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                    </Tooltip>
                                                </div>
                                            </th>
                                            <th className="p-4 text-right">Silver/Focus</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50 text-sm">
                                        {calculation.map((row) => (
                                            <Fragment key={row.productId}>
                                                <tr
                                                    onClick={() => toggleExpand(row.productId)}
                                                    className={`cursor-pointer transition-all hover:bg-secondary/40 group ${expandedRow === row.productId ? 'bg-secondary/40' : ''}`}
                                                >
                                                    <td className="p-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-secondary">
                                                                {expandedRow === row.productId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                            </button>
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative h-10 w-10 bg-secondary rounded-lg border border-border p-1 flex-shrink-0 group-hover:border-muted-foreground transition-colors">
                                                                    <ItemIcon itemId={row.productId} alt={row.name} className="h-full w-full object-contain" />
                                                                    <div className="absolute -bottom-1 -right-1 bg-background text-[9px] px-1 rounded border border-border text-muted-foreground">T{row.tier}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-foreground group-hover:text-foreground transition-colors">{row.name}</div>
                                                                    <div className="text-xs text-muted-foreground">Yield: {selectedRecipe?.yield}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-foreground">{formatSilver(row.productPrice)}</td>
                                                    <td className="p-4 text-right font-mono text-muted-foreground">{row.productVolume24h.toLocaleString()}</td>
                                                    <td className="p-4 text-right font-mono text-foreground">{formatSilver(row.effectiveCost)}</td>
                                                    <td className="p-4 text-right">
                                                        <div className={`font-mono font-bold ${row.profit > 0 ? 'text-success' : 'text-destructive'}`}>
                                                            {formatSilver(row.profit)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${row.roi >= 50 ? 'bg-success/10 text-success border border-success/20' :
                                                                row.roi > 0 ? 'bg-success/5 text-success/80' :
                                                                    'bg-destructive/10 text-destructive border border-destructive/20'
                                                            }`}>
                                                            {row.roi.toFixed(1)}%
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-muted-foreground">
                                                        {row.baseFocusCost ? (
                                                            <span className="text-success/80">{formatSilver(row.profit / row.baseFocusCost)}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {/* Expanded Ingredient Details */}
                                                {expandedRow === row.productId && (
                                                    <tr className="bg-muted/30 shadow-inner">
                                                        <td colSpan={7} className="p-0">
                                                            <div className="p-6 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                                                                <div className="space-y-8">
                                                                    {/* Ingredients Table */}
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground pl-1">
                                                                            <Package className="h-3 w-3" /> Ingredients Breakdown
                                                                        </div>
                                                                        <div className="rounded-lg border border-border overflow-hidden bg-card/40">
                                                                            <table className="w-full text-sm">
                                                                                <thead className="bg-card/60 text-xs text-muted-foreground border-b border-border/50">
                                                                                    <tr>
                                                                                        <th className="p-2 pl-3 font-medium">Material</th>
                                                                                        <th className="p-2 text-right font-medium">Source</th>
                                                                                        <th className="p-2 text-right font-medium">Unit Cost</th>
                                                                                        <th className="p-2 text-right font-medium">Total</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-border/30">
                                                                                    {row.ingredientDetails.map(ing => (
                                                                                        <tr key={ing.itemId} className="hover:bg-secondary/20 transition-colors">
                                                                                            <td className="p-2 pl-3 text-foreground">
                                                                                                <div className="flex items-center gap-3">
                                                                                                    <div className="h-8 w-8 bg-secondary rounded border border-border p-0.5 flex-shrink-0 relative">
                                                                                                        <ItemIcon itemId={ing.itemId} alt="" className="w-full h-full object-contain" />
                                                                                                        <div className="absolute -bottom-1 -right-1 bg-background text-[9px] px-1 rounded border border-border text-muted-foreground font-mono">
                                                                                                            {ing.count * (quantity / (selectedRecipe?.yield || 1))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <span className="text-xs font-medium">{ing.name}</span>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="p-2 text-right text-muted-foreground text-xs">{ing.buyCity}</td>
                                                                                            <td className="p-2 text-right text-foreground font-mono text-xs">
                                                                                                {formatSilver(manualPrices[ing.itemId] ?? ing.price)}
                                                                                            </td>
                                                                                            <td className="p-2 text-right text-foreground font-mono text-xs">{formatSilver(ing.totalCost)}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>

                                                                    {/* Sauces Table (if any) */}
                                                                    {row.sauceDetails && (
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground pl-1">
                                                                                <Info className="h-3 w-3" /> Fish Sauces (Enchantment)
                                                                            </div>
                                                                            <div className="rounded-lg border border-border overflow-hidden bg-card/40">
                                                                                <table className="w-full text-sm">
                                                                                    <thead className="bg-card/60 text-xs text-muted-foreground border-b border-border/50">
                                                                                        <tr>
                                                                                            <th className="p-2 pl-3 font-medium">Sauce</th>
                                                                                            <th className="p-2 text-right font-medium">Unit Cost</th>
                                                                                            <th className="p-2 text-right font-medium">Total</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-border/30">
                                                                                        {row.sauceDetails.map(ing => (
                                                                                            <tr key={ing.itemId} className="hover:bg-secondary/20 transition-colors">
                                                                                                <td className="p-2 pl-3 text-foreground">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <div className="h-8 w-8 bg-secondary rounded border border-border p-0.5 flex-shrink-0 relative">
                                                                                                            <ItemIcon itemId={ing.itemId} alt={ing.name} className="h-full w-full object-contain" />
                                                                                                            <div className="absolute -bottom-1 -right-1 bg-background text-[8px] px-1 rounded border border-border text-muted-foreground font-mono">x{ing.count}</div>
                                                                                                        </div>
                                                                                                        <span className="font-medium text-xs">{ing.name}</span>
                                                                                                    </div>
                                                                                                </td>
                                                                                                <td className="p-2 text-right font-mono text-xs text-muted-foreground">{formatSilver(ing.price)}</td>
                                                                                                <td className="p-2 text-right font-mono text-xs text-foreground font-medium">{formatSilver(ing.totalCost)}</td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
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
            <InfoStrip currentPage="profits-cooking" />
        </PageShell>
    );
}
