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
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { getMarketPrices, getMarketHistory, getConsumablesList, getConsumableDetails, getGameInfoItemData, MarketStat, MarketHistory, OpenAlbionConsumable, GameInfoItem } from '@/lib/market-service';
import { getItemNameService } from '@/lib/item-service';
import { RECIPES, FoodRecipe, Ingredient, FISH_SAUCES } from './constants';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import { FeatureLock } from '@/components/subscription/FeatureLock';
import { useAuth } from '@/context/AuthContext';

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

const CITY_ORDER = ['Bridgewatch', 'Fort Sterling', 'Lymhurst', 'Martlock', 'Thetford', 'Caerleon', 'Black Market'];

export default function CookingClient() {
    const t = useTranslations('Cooking');
    const tAlchemy = useTranslations('Alchemy');
    const tCrafting = useTranslations('CraftingCalc');
    const locale = useLocale();
    const { profile } = useAuth();
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
    const [marketData, setMarketData] = useState<MarketStat[]>([]);
    const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
    const [localizedIngredientNames, setLocalizedIngredientNames] = useState<Record<string, string>>({});
    const [localizedApiRecipeNames, setLocalizedApiRecipeNames] = useState<Record<string, string>>({});

    // Computed Recipe
    const selectedRecipe = useMemo(() => {
        const base = RECIPES.find(r => r.id === selectedRecipeId);
        if (base) return base;
        
        const api = apiRecipes.find(ar => ar.identifier === selectedRecipeId);
        if (api) {
            return {
                id: api.identifier,
                name: api.name,
                tier: parseInt(api.tier) || 0,
                productId: api.identifier,
                yield: 10, // API doesn't provide yield, standard is 10 for meals
                nutrition: 0,
                itemWeight: 0.1,
                ingredients: [] // Would need more API data or hardcoded mapping
            } as FoodRecipe;
        }
        return null;
    }, [selectedRecipeId, apiRecipes]);

    // Computed RRR
    const calculatedRRR = useMemo(() => {
        if (customRRR !== null && customRRR > 0) return customRRR;
        let base = 15.2; // Base city RRR
        if (dailyBonus) base += 10;
        if (useFocus) base = 43.5; // Average focus RRR for meals
        return base;
    }, [dailyBonus, useFocus, customRRR]);

    const mountOptions = useMemo(() => [
        { value: 'ox_t3', label: tAlchemy('mounts.ox_t3'), capacity: 784 },
        { value: 'ox_t4', label: tAlchemy('mounts.ox_t4'), capacity: 1358 },
        { value: 'ox_t5', label: tAlchemy('mounts.ox_t5'), capacity: 1982 },
        { value: 'ox_t6', label: tAlchemy('mounts.ox_t6'), capacity: 2756 },
        { value: 'ox_t7', label: tAlchemy('mounts.ox_t7'), capacity: 3752 },
        { value: 'ox_t8', label: tAlchemy('mounts.ox_t8'), capacity: 4946 },
        { value: 'mammoth', label: tAlchemy('mounts.mammoth'), capacity: 25735 }
    ], [tAlchemy]);

    const cityOptions = useMemo(() => 
        CITY_ORDER.map(city => ({
            value: city,
            label: tCrafting(`cities.${city}`)
        })), 
    [tCrafting]);

    const fetchData = useCallback(async () => {
        if (!selectedRecipeId) return;
        setLoading(true);
        setError(null);

        try {
            const recipe = selectedRecipe;
            if (!recipe) throw new Error(t('errors.recipeNotFound'));

            const ingredientIds = recipe.ingredients.map(i => i.itemId);
            const sauceIds = FISH_SAUCES.map(s => s.id);
            const productIds = [recipe.productId, `${recipe.productId}@1`, `${recipe.productId}@2`, `${recipe.productId}@3` ];
            
            const allItemIds = Array.from(new Set([...ingredientIds, ...productIds, ...sauceIds]));
            
            // Unique Cities to fetch from
            const cities = Array.from(new Set([sellCity, ...Object.values(buyCityMap), 'Martlock', 'Lymhurst', 'Caerleon', 'Bridgewatch', 'Fort Sterling', 'Thetford']));
            
            const prices = await getMarketPrices(allItemIds, region, cities);
            setMarketData(prices);

        } catch (err: any) {
            setError(err.message || t('errors.unknown'));
        } finally {
            setLoading(false);
        }
    }, [selectedRecipeId, selectedRecipe, region, sellCity, buyCityMap, t]);

    const [calculation, setCalculation] = useState<EnhancedRecipe[] | null>(null);

    const calculate = useCallback(() => {
        if (!selectedRecipe || marketData.length === 0) return;

        const recipe = selectedRecipe;

        const getPrice = (itemId: string, city: string, type: 'buy' | 'sell') => {
            if (manualPrices[itemId]) return manualPrices[itemId];
            const entry = marketData.find(m => m.item_id === itemId && m.city === city);
            if (!entry) return 0;
            
            if (type === 'buy') {
                return buyOrderType === 'buy_order' ? entry.buy_price_max : entry.sell_price_min;
            } else {
                return sellOrderType === 'sell_order' ? entry.sell_price_max : entry.sell_price_min;
            }
        };

        const getVolume = (itemId: string, city: string) => {
            const entry = marketData.find(m => m.item_id === itemId && m.city === city);
            // This would normally come from history API, but for MVP we use price entry volume if available or 0
            // Actually getMarketPrices doesn't return volume. We'd need a separate call.
            // Placeholder:
            return 0; 
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

            const localizedRecipeName = t.has(`meals.${recipe.id}`) ? t(`meals.${recipe.id}`) : recipe.name;

            results.push({
                ...recipe,
                name: ench > 0 ? `${localizedRecipeName} (T${recipe.tier}.${ench})` : localizedRecipeName,
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

    }, [marketData, manualPrices, selectedRecipe, quantity, showEnchanted, sellOrderType, buyOrderType, calculatedRRR, sellCity, includeBuyTax, includeSellTax, usageFee, buyCityMap, t, tAlchemy]);

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

    // Fetch localized names for API recipes
    useEffect(() => {
        if (!apiRecipes.length) return;

        const loadApiRecipeNames = async () => {
            const names: Record<string, string> = {};
            
            for (const recipe of apiRecipes) {
                try {
                    const localizedName = await getItemNameService(recipe.identifier, locale);
                    // Remove "Item" prefix if present
                    const cleanName = localizedName?.startsWith('Item') ? localizedName.substring(4) : localizedName;
                    names[recipe.identifier] = cleanName || recipe.name;
                } catch (error) {
                    names[recipe.identifier] = recipe.name;
                }
            }
            
            setLocalizedApiRecipeNames(names);
        };

        loadApiRecipeNames();
    }, [apiRecipes, locale]);

    useEffect(() => {
        if (!selectedRecipe?.ingredients.length) return;

        const loadNames = async () => {
            const names: Record<string, string> = {};
    
            // Load ingredient names from Albion's localized game data
            for (const ing of selectedRecipe.ingredients) {
                try {
                    const localizedName = await getItemNameService(ing.itemId, locale);
                    // Remove "Item" prefix if present
                    const cleanName = localizedName?.startsWith('Item') ? localizedName.substring(4) : localizedName;
                    names[ing.itemId] = cleanName || ing.name;
                } catch (error) {
                    names[ing.itemId] = ing.name;
                }
            }
            
            // Load sauce names from Albion's localized game data
            for (const sauce of FISH_SAUCES) {
                try {
                    const localizedName = await getItemNameService(sauce.id, locale);
                    // Remove "Item" prefix if present
                    const cleanName = localizedName?.startsWith('Item') ? localizedName.substring(4) : localizedName;
                    names[sauce.id] = cleanName || sauce.name;
                } catch (error) {
                    names[sauce.id] = sauce.name;
                }
            }
            
            setLocalizedIngredientNames(names);
        };

        loadNames();
    }, [selectedRecipe, locale]);

    // Helper
    const formatSilver = (val: number) => Math.round(val).toLocaleString();
    const toggleExpand = (id: string) => setExpandedRow(expandedRow === id ? null : id);

    const recipeOptions = useMemo(() => {
        const options = RECIPES.map(r => ({
            value: r.id,
            label: t.has(`meals.${r.id}`) ? t(`meals.${r.id}`) : r.name,
            icon: <ItemIcon itemId={r.productId} className="w-5 h-5 object-contain rounded-sm" alt={t.has(`meals.${r.id}`) ? t(`meals.${r.id}`) : r.name} />
        }));

        const apiOptions = apiRecipes
            .map(ar => ({
                value: ar.identifier,
                label: `${localizedApiRecipeNames[ar.identifier] || ar.name} (T${ar.tier})`,
                icon: <ItemIcon itemId={ar.identifier} className="w-5 h-5 object-contain rounded-sm" alt={localizedApiRecipeNames[ar.identifier] || ar.name} />
            }))
            .filter(opt => !options.some(o => o.value === opt.value));

        return [...options, ...apiOptions];
    }, [apiRecipes, t, localizedApiRecipeNames]);

    return (
        <PageShell
            title={t('title')}
            backgroundImage='/background/ao-crafting.jpg'
            description={t('description')}
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
                <div className="bg-card rounded-xl border border-border transition-all duration-300">
                    <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between rounded-t-xl">
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-bold text-foreground">{tAlchemy('configuration')}</h3>
                        </div>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={`flex items-center gap-1 text-xs font-bold transition-colors ${showAdvanced ? 'text-warning' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Settings className="h-3 w-3" />
                            {showAdvanced ? tAlchemy('simpleMode') : tAlchemy('advancedMode')}
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-4 space-y-1">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
                                <Utensils className="h-3 w-3" /> {t('recipe')}
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
                                <MapPin className="h-3 w-3" /> {tAlchemy('sellCity')}
                            </label>
                            <Select
                                value={sellCity}
                                onChange={(val) => setSellCity(val)}
                                options={cityOptions}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
                                <Calculator className="h-3 w-3" /> {t('quantity')}
                            </label>
                            <NumberInput value={quantity} onChange={setQuantity} min={10} step={10} />
                        </div>
                        <div className="md:col-span-3 pb-1">
                            <Checkbox label={t('enchantedVariants')} checked={showEnchanted} onChange={(e) => setShowEnchanted(e.target.checked)} />
                        </div>
                    </div>

                    {/* Advanced Configuration (Collapsible) */}
                    {showAdvanced && (
                        <FeatureLock
                            title={tAlchemy('advancedLockTitle')}
                            description={tAlchemy('advancedLockDesc')}
                        >
                            <div className="p-6 border-t border-border bg-muted/30 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-200 rounded-b-xl">
                                {/* Market Strategy */}
                                <div className="bg-card/50 p-4 rounded-lg border border-border/50 space-y-4">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                                        <TrendingUp className="h-4 w-4 text-success" />
                                        <h4 className="text-sm font-bold text-foreground">{tAlchemy('marketStrategy')}</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground font-medium block mb-1.5 uppercase tracking-wide">{tAlchemy('buyMethod')}</label>
                                            <SegmentedControl
                                                value={buyOrderType}
                                                onChange={(v) => setBuyOrderType(v as any)}
                                                options={[
                                                    { value: 'buy_order', label: tAlchemy('buyOrder') },
                                                    { value: 'sell_order', label: tAlchemy('instantBuy') }
                                                ]}
                                                size="sm"
                                                className="w-fit"
                                            />
                                            <div className="mt-2"><Checkbox label={tAlchemy('includeBuyTax')} checked={includeBuyTax} onChange={(e) => setIncludeBuyTax(e.target.checked)} className="text-xs" /></div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground font-medium block mb-1.5 uppercase tracking-wide">{tAlchemy('sellMethod')}</label>
                                            <SegmentedControl
                                                value={sellOrderType}
                                                onChange={(v) => setSellOrderType(v as any)}
                                                options={[
                                                    { value: 'sell_order', label: tAlchemy('sellOrder') },
                                                    { value: 'sell_price_min', label: tAlchemy('instantSell') }
                                                ]}
                                                size="sm"
                                                className="w-fit"
                                            />
                                            <div className="mt-2"><Checkbox label={tAlchemy('includeSellTax')} checked={includeSellTax} onChange={(e) => setIncludeSellTax(e.target.checked)} className="text-xs" /></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bonuses */}
                                <div className="bg-card/50 p-4 rounded-lg border border-border/50  space-y-4">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                                        <DollarSign className="h-4 w-4 text-warning" />
                                        <h4 className="text-sm font-bold text-foreground">{tAlchemy('bonusesAndFees')}</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <NumberInput label={tAlchemy('usageFee')} value={usageFee} onChange={setUsageFee} />
                                        <div className="pt-6">
                                            <Checkbox label={tAlchemy('dailyBonus')} checked={dailyBonus} onChange={(e) => setDailyBonus(e.target.checked)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <NumberInput label={tAlchemy('customRRR')} value={customRRR || 0} onChange={setCustomRRR} placeholder={tAlchemy('override')} />
                                        <div className="text-right bg-muted/50 p-2 rounded border border-border/50 w-fit" >
                                            <span className="text-[10px] text-muted-foreground block uppercase font-bold">{tAlchemy('effectiveRRR')}</span>
                                            <span className="text-lg font-mono text-success font-bold">{calculatedRRR}%</span>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-border/50">
                                        <Checkbox label={tAlchemy('useFocusRRR')} checked={useFocus} onChange={(e) => setUseFocus(e.target.checked)} />
                                    </div>
                                </div>

                                {/* Sourcing Cities */}
                                <div className="bg-card/50 p-4 rounded-lg border border-border/50 space-y-4">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                                        <Package className="h-4 w-4 text-primary" />
                                        <h4 className="text-sm font-bold text-foreground">{tAlchemy('sourcingCities')}</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedRecipe?.ingredients.map(ing => (
                                            <div key={ing.itemId} className="flex items-center justify-between text-sm group">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 bg-muted rounded p-0.5 border border-border">
                                                        <ItemIcon itemId={ing.itemId} alt={localizedIngredientNames[ing.itemId] || ing.name} className="w-full h-full object-contain" />
                                                    </div>
                                                    <span className="text-muted-foreground truncate max-w-[100px] group-hover:text-foreground transition-colors">{localizedIngredientNames[ing.itemId] || ing.name}</span>
                                                </div>
                                                <div className="w-35">
                                                    <Select
                                                        value={buyCityMap[ing.itemId] || 'Martlock'}
                                                        onChange={(value) => setBuyCityMap({ ...buyCityMap, [ing.itemId]: value })}
                                                        options={cityOptions}
                                                        className="h-8 text-[13px]"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {selectedRecipe?.ingredients.length === 0 && (
                                            <div className="text-xs text-muted-foreground italic text-center py-4">
                                                {tAlchemy('noIngredients')}
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
                        <h3 className="text-lg font-medium text-muted-foreground">{t('selectRecipePrompt')}</h3>
                        <p className="text-muted-foreground">{t('chooseFood')}</p>
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
                            {error ? t('errorOccurred') : t('noDataAvailable')}
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {error || t('calculationErrorMessage')}
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
                                <span>{tAlchemy('priceConfigTitle')}</span>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Product Price */}
                                <div className="bg-muted/20 p-3 rounded border border-border/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ItemIcon itemId={calculation[0].productId} className="h-8 w-8 object-contain" alt={calculation[0].name} />
                                        <div className="overflow-hidden">
                                            <div className="text-xs font-bold text-foreground truncate" title={calculation[0].name}>{calculation[0].name}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase">{sellCity} ({tAlchemy('instantSell')})</div>
                                        </div>
                                    </div>
                                    <NumberInput
                                        label={tAlchemy('sellPrice')}
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
                                            <ItemIcon itemId={ing.itemId} className="h-8 w-8 object-contain" alt={localizedIngredientNames[ing.itemId] || ing.name} />
                                            <div className="overflow-hidden">
                                                <div className="text-xs font-bold text-foreground truncate" title={localizedIngredientNames[ing.itemId] || ing.name}>{localizedIngredientNames[ing.itemId] || ing.name}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase">{ing.buyCity} ({tAlchemy('instantBuy')})</div>
                                            </div>
                                        </div>
                                        <NumberInput
                                            label={tAlchemy('buyPrice')}
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
                                <span className="text-xs text-muted-foreground uppercase font-bold">{tAlchemy('totalRevenue')}</span>
                                <div className="text-xl font-mono text-foreground mt-1">{formatSilver(calculation[0].revenue)}</div>
                            </div>
                            <div className="bg-card p-4 rounded-xl border border-border">
                                <span className="text-xs text-muted-foreground uppercase font-bold">{tAlchemy('totalCost')}</span>
                                <div className="text-xl font-mono text-foreground mt-1">{formatSilver(calculation[0].effectiveCost)}</div>
                            </div>
                            <div className="bg-card p-4 rounded-xl border border-border">
                                <span className="text-xs text-muted-foreground uppercase font-bold">{tAlchemy('netProfit')}</span>
                                <div className={`text-xl font-mono mt-1 ${calculation[0].profit > 0 ? 'text-success' : 'text-destructive'}`}>
                                    {formatSilver(calculation[0].profit)}
                                </div>
                            </div>
                            <div className="bg-card p-4 rounded-xl border border-border">
                                <span className="text-xs text-muted-foreground uppercase font-bold">{tAlchemy('roi')}</span>
                                <div className={`text-xl font-mono mt-1 ${calculation[0].roi > 0 ? 'text-success' : 'text-destructive'}`}>
                                    {calculation[0].roi.toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        {/* Transport & Weight (Compact) */}
                        <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Scale className="h-4 w-4 text-muted-foreground" />
                                <span className="font-bold text-muted-foreground">{tAlchemy('transport')}</span>
                            </div>
                            <div className="w-48">
                                <Select
                                    value={selectedMount}
                                    onChange={(value) => setSelectedMount(value)}
                                    options={mountOptions}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="flex items-center gap-4 text-foreground">
                                <div>{tAlchemy('inputs')} <span className="text-foreground font-mono">{Math.round(calculation[0].totalWeightIngredients)}kg</span></div>
                                <div>{tAlchemy('outputs')} <span className="text-foreground font-mono">{Math.round(calculation[0].totalWeightProduct)}kg</span></div>
                                {(() => {
                                    const cap = mountOptions.find(m => m.value === selectedMount)?.capacity || 1;
                                    const totalW = Math.max(calculation[0].totalWeightIngredients, calculation[0].totalWeightProduct);
                                    const loadPct = (totalW / cap) * 100;
                                    return (
                                        <div className={`${loadPct > 100 ? 'text-destructive' : 'text-success'} font-bold`}>
                                            {tAlchemy('load')} {loadPct.toFixed(1)}%
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Main Results Table with Expandable Rows */}
                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 border-b border-border">
                                            <th className="p-4 pl-6">{t('product')}</th>
                                            <th className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip content={t('tooltips.sellPrice')}>
                                                        <span>{tAlchemy('sellPrice')}</span>
                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                    </Tooltip>
                                                </div>
                                            </th>
                                            <th className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip content={t('tooltips.vol24h')}>
                                                        <span>{t('vol24h')}</span>
                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                    </Tooltip>
                                                </div>
                                            </th>
                                            <th className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip content={t('tooltips.totalCost')}>
                                                        <span>{tAlchemy('totalCost')}</span>
                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                    </Tooltip>
                                                </div>
                                            </th>
                                            <th className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip content={t('tooltips.profit')}>
                                                        <span>{tAlchemy('profit')}</span>
                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                    </Tooltip>
                                                </div>
                                            </th>
                                            <th className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip content={t('tooltips.roi')}>
                                                        <span>{tAlchemy('roi')}</span>
                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                    </Tooltip>
                                                </div>
                                            </th>
                                            <th className="p-4 text-right">{t('silverFocus')}</th>
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
                                                                    <div className="text-xs text-muted-foreground">{t('yield')} {selectedRecipe?.yield}</div>
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
                                                    <tr className="bg-muted/30 ">
                                                        <td colSpan={7} className="p-0">
                                                            <div className="p-6 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                                                                <div className="space-y-8">
                                                                    {/* Ingredients Table */}
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground pl-1">
                                                                            <Package className="h-3 w-3" /> {t('ingredientsBreakdown')}
                                                                        </div>
                                                                        <div className="rounded-lg border border-border overflow-hidden bg-card/40">
                                                                            <table className="w-full text-sm">
                                                                                <thead className="bg-card/60 text-xs text-muted-foreground border-b border-border/50">
                                                                                    <tr>
                                                                                        <th className="p-2 pl-3 font-medium">{t('material')}</th>
                                                                                        <th className="p-2 text-right font-medium">{t('source')}</th>
                                                                                        <th className="p-2 text-right font-medium">{t('unitCost')}</th>
                                                                                        <th className="p-2 text-right font-medium">{tAlchemy('total')}</th>
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
                                                                                                    <span className="text-xs font-medium">{localizedIngredientNames[ing.itemId] || ing.name}</span>
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
                                                                                <Info className="h-3 w-3" /> {t('fishSauces')}
                                                                            </div>
                                                                            <div className="rounded-lg border border-border overflow-hidden bg-card/40">
                                                                                <table className="w-full text-sm">
                                                                                    <thead className="bg-card/60 text-xs text-muted-foreground border-b border-border/50">
                                                                                        <tr>
                                                                                            <th className="p-2 pl-3 font-medium">{t('sauce')}</th>
                                                                                            <th className="p-2 text-right font-medium">{t('unitCost')}</th>
                                                                                            <th className="p-2 text-right font-medium">{tAlchemy('total')}</th>
                                                                                        </tr>
                                                                                    </thead>                                                                                    <tbody className="divide-y divide-border/30">
                                                                                        {row.sauceDetails.map(ing => (
                                                                                            <tr key={ing.itemId} className="hover:bg-secondary/20 transition-colors">
                                                                                                <td className="p-2 pl-3 text-foreground">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <div className="h-8 w-8 bg-secondary rounded border border-border p-0.5 flex-shrink-0 relative">
                                                                                                            <ItemIcon itemId={ing.itemId} alt={localizedIngredientNames[ing.itemId] || ing.name} className="h-full w-full object-contain" />
                                                                                                            <div className="absolute -bottom-1 -right-1 bg-background text-[8px] px-1 rounded border border-border text-muted-foreground font-mono">x{ing.count}</div>
                                                                                                        </div>
                                                                                                        <span className="font-medium text-xs">{localizedIngredientNames[ing.itemId] || ing.name}</span>
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
