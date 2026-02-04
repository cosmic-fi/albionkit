'use client';
//@ts-ignore
import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Hammer, RefreshCw, ChevronDown, Filter, Search, Loader2, X, Settings, ArrowRight, Coins, Percent, Edit2, Check, CircleHelp, TrendingUp, Package, DollarSign, MapPin } from 'lucide-react';
import { TIERS, ENCHANTMENTS } from './constants';
import { getRecipePrices, searchItems, getItemData, resolveItemName } from './actions';
import { Recipe } from './recipes';
import { generateRecipe, createRecipeFromApi } from './recipe-generator';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { NumberInput } from '@/components/ui/NumberInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tooltip } from '@/components/ui/Tooltip';
import { PageShell } from '@/components/PageShell';
import { ItemIcon } from '@/components/ItemIcon';
import { useAuth } from '@/context/AuthContext';
import { InfoStrip } from '@/components/InfoStrip';

const CITIES = ['Martlock', 'Bridgewatch', 'Lymhurst', 'Fort Sterling', 'Thetford', 'Caerleon', 'Brecilien', 'Black Market'];

export default function CraftingCalcPage() {
    const { profile } = useAuth();
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [prices, setPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { server: region, setServer: setRegion } = useServer();

    // Crafting Settings
    const [returnRate, setReturnRate] = useState(47.9);
    const [quantity, setQuantity] = useState(1);
    const [hasPremium, setHasPremium] = useState(true);
    const [sellOrder, setSellOrder] = useState(true); // true = Sell Order, false = Instant Sell
    const [sourceCity, setSourceCity] = useState('Martlock');
    const [targetCity, setTargetCity] = useState('Martlock');

    // Search State
    const [searchSelectValue, setSearchSelectValue] = useState<string>('');
    const [searchOptions, setSearchOptions] = useState<{ value: string; label: string; icon?: React.ReactNode }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Additional State
    const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
    const [ingredientNames, setIngredientNames] = useState<Record<string, string>>({});
    const [customReturnRate, setCustomReturnRate] = useState<string>('');

    // Advanced Settings
    const [stationFee, setStationFee] = useState(0);
    const [journalProfit, setJournalProfit] = useState(0);
    const [focusCost, setFocusCost] = useState(0);

    // UI State
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState('');

    // Helper to format item name from ID if real name is missing
    const formatItemName = (itemId: string) => {
        // Remove T#_ prefix
        let name = itemId.replace(/^T\d+_/, '');
        // Remove @# suffix
        name = name.split('@')[0];
        // Replace underscores with spaces
        name = name.replace(/_/g, ' ');
        // Title Case
        return name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    // Initialize from preferences
    useEffect(() => {
        if (profile?.preferences) {
            if (profile.preferences.defaultMarketLocation) {
                setSourceCity(profile.preferences.defaultMarketLocation);
                setTargetCity(profile.preferences.defaultMarketLocation);
            }
        }
    }, [profile]);

    useEffect(() => {
        if (selectedRecipe) {
            loadPrices();
            resolveNames();
        }
    }, [selectedRecipe, region]);

    const resolveNames = async () => {
        if (!selectedRecipe) return;

        const ids = new Set<string>();

        // Collect IDs from all relevant tiers to pre-fetch names
        [4, 5, 6, 7, 8].forEach(tier => {
            const ings = selectedRecipe.ingredientsByTier?.[tier] || selectedRecipe.ingredients;
            ings.forEach(ing => {
                if (/^T\d+_/.test(ing.itemId)) {
                    ids.add(ing.itemId);
                } else {
                    // Resolve generic types for this tier
                    const ingTier = tier + (ing.tierOffset || 0);
                    ids.add(`T${ingTier}_${ing.itemId}`);
                }
            });
        });

        const newNames: Record<string, string> = {};
        await Promise.all(Array.from(ids).map(async (id) => {
            // If we already have a name (and it's not the ID itself), skip
            if (ingredientNames[id] && ingredientNames[id] !== id) return;

            const name = await resolveItemName(id);
            if (name) newNames[id] = name;
        }));

        if (Object.keys(newNames).length > 0) {
            setIngredientNames(prev => ({ ...prev, ...newNames }));
        }
    };

    const loadPrices = async () => {
        if (!selectedRecipe) return;
        setLoading(true);
        // getRecipePrices fetches for ALL cities now (updated in actions.ts)
        const { data, error } = await getRecipePrices(selectedRecipe, region);
        if (data) {
            setPrices(data);
        }
        setLoading(false);
    };

    const selectSearchResult = async (item: any) => {
        setSearchError(null);
        setIsImporting(true);

        // 1. Try Local Generator first (instant)
        let recipe = generateRecipe(item.id);
        let errorMsg = null;

        // 2. If not found, try to fetch from API
        if (!recipe) {
            const data = await getItemData(item.id);
            if (data) {
                recipe = createRecipeFromApi(item.id, data);
                if (!recipe) {
                    errorMsg = `No crafting recipe found for ${item.name}. This item may not be craftable.`;
                }
            } else {
                errorMsg = `Failed to fetch data for ${item.name}. Please try again.`;
            }
        }

        setIsImporting(false);

        if (recipe) {
            setSelectedRecipe(recipe);
            setSearchSelectValue('');
            setSearchOptions([]);
        } else {
            setSearchError(errorMsg || `Could not load recipe for ${item.name}.`);
        }
    };

    const clearSelection = () => {
        setSelectedRecipe(null);
        setSearchSelectValue('');
        setSearchOptions([]);
        setPrices([]);
        setCustomPrices({});
        setIngredientNames({});
    };

    const getPrice = (itemId: string, city: string, type: 'sell_min' | 'buy_max') => {
        // Check custom price first
        if (customPrices[itemId] !== undefined) return customPrices[itemId];

        // Filter by Item ID and City
        const itemPrices = prices.filter(p => p.item_id === itemId && p.city === city);
        if (itemPrices.length === 0) return 0;

        if (type === 'sell_min') {
            // Return lowest sell price (for buying materials instantly or checking competition)
            const valid = itemPrices.filter(p => p.sell_price_min > 0);
            return valid.length > 0 ? Math.min(...valid.map(p => p.sell_price_min)) : 0;
        } else {
            // Return highest buy price (for instant selling)
            const valid = itemPrices.filter(p => p.buy_price_max > 0);
            return valid.length > 0 ? Math.max(...valid.map(p => p.buy_price_max)) : 0;
        }
    };

    const calculateProfit = (tier: number, enchantment: number) => {
        if (!selectedRecipe) return {
            productId: '',
            productPrice: 0,
            materialCost: 0,
            effectiveCost: 0,
            revenue: 0,
            taxes: 0,
            stationFee: 0,
            journalProfit: 0,
            profit: 0,
            margin: 0,
            yield: 1,
            profitPerFocus: 0,
            ingredients: []
        };

        const suffix = enchantment > 0 ? `_LEVEL${enchantment}` : '';
        const productId = `T${tier}_${selectedRecipe.productId}${suffix}`;

        // Product Price logic
        // If Sell Order: Use Min Sell Price (we assume we match/undercut lowest seller)
        // If Instant Sell: Use Max Buy Price (we sell to highest bidder)
        const productPriceUnit = getPrice(productId, targetCity, sellOrder ? 'sell_min' : 'buy_max');
        const productPriceTotal = productPriceUnit * quantity;

        let materialCostUnit = 0;
        let ingredientDetails: any[] = [];

        // Select ingredients for this specific tier if available, otherwise use default
        const currentIngredients = selectedRecipe.ingredientsByTier?.[tier] || selectedRecipe.ingredients;

        currentIngredients.forEach(ing => {
            let ingId = '';

            if (/^T\d+_/.test(ing.itemId)) {
                ingId = ing.isEnchantable ? `${ing.itemId}${suffix}` : ing.itemId;
            } else {
                const ingTier = tier + (ing.tierOffset || 0);
                if (ingTier < 1) return;

                if (ing.isEnchantable) {
                    ingId = `T${ingTier}_${ing.itemId}${suffix}`;
                } else {
                    ingId = `T${ingTier}_${ing.itemId}`;
                }
            }

            // Material Cost: We assume Instant Buy (Min Sell Price) from Source City
            const price = getPrice(ingId, sourceCity, 'sell_min');
            const totalCost = price * ing.count;
            materialCostUnit += totalCost;

            // Check for sub-recipe (e.g. Metal Bar -> Ore)
            let subIngredientsDisplay: any[] = [];
            const subRecipe = generateRecipe(ingId);

            if (subRecipe) {
                const match = ingId.match(/^T(\d+)_([A-Z0-9_]+)(?:_LEVEL(\d+))?$/);
                if (match) {
                    const ingTier = parseInt(match[1]);
                    const ingEnch = match[3] ? parseInt(match[3]) : 0;
                    const suffix = ingEnch > 0 ? `_LEVEL${ingEnch}` : '';

                    const subIngs = subRecipe.ingredientsByTier?.[ingTier] || subRecipe.ingredients;

                    subIngredientsDisplay = subIngs.map(subIng => {
                        let subIngId = '';
                        if (/^T\d+_/.test(subIng.itemId)) {
                            subIngId = subIng.isEnchantable ? `${subIng.itemId}${suffix}` : subIng.itemId;
                        } else {
                            const subIngTier = ingTier + (subIng.tierOffset || 0);
                            if (subIng.isEnchantable) {
                                subIngId = `T${subIngTier}_${subIng.itemId}${suffix}`;
                            } else {
                                subIngId = `T${subIngTier}_${subIng.itemId}`;
                            }
                        }
                        return {
                            ...subIng,
                            resolvedId: subIngId,
                            name: ingredientNames[subIngId] || formatItemName(subIngId)
                        };
                    });
                }
            }

            ingredientDetails.push({
                ...ing,
                resolvedId: ingId,
                name: ingredientNames[ingId] || formatItemName(ingId),
                unitPrice: price,
                totalCost: totalCost,
                subRecipeIngredients: subIngredientsDisplay
            });
        });

        const materialCostTotal = materialCostUnit * quantity;

        // Effective Cost with Return Rate
        // RRR applies to materials.
        // Effective Mat Cost = Mat Cost * (1 - RRR)
        const effectiveMatCostTotal = materialCostTotal * (1 - returnRate / 100);

        // Revenue based on Yield
        const productYield = selectedRecipe.yield || 1;
        const totalRevenue = productPriceTotal * productYield;

        // Taxes
        // Premium Tax: 4% (Premium) vs 8% (Non-Premium)
        // Setup Fee: 2.5% (Sell Order only)
        const taxRate = (hasPremium ? 0.04 : 0.08);
        const setupFeeRate = (sellOrder ? 0.025 : 0);
        const totalTaxRate = taxRate + setupFeeRate;

        const marketTaxes = totalRevenue * totalTaxRate;
        const totalStationFee = stationFee * quantity;
        const totalJournalProfit = journalProfit * quantity;

        const profit = totalRevenue - effectiveMatCostTotal - marketTaxes - totalStationFee + totalJournalProfit;
        const margin = effectiveMatCostTotal > 0 ? (profit / effectiveMatCostTotal) * 100 : 0;

        const profitPerFocus = focusCost > 0 ? profit / (focusCost * quantity) : 0;

        return {
            productId,
            productPrice: productPriceUnit,
            materialCost: materialCostTotal,
            effectiveCost: effectiveMatCostTotal,
            revenue: totalRevenue,
            taxes: marketTaxes,
            stationFee: totalStationFee,
            journalProfit: totalJournalProfit,
            profit,
            margin,
            yield: productYield,
            profitPerFocus,
            ingredients: ingredientDetails
        };
    };

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const getDisplayIngredients = () => {
        if (!selectedRecipe) return [];
        if (selectedRecipe.ingredients.length > 0) return selectedRecipe.ingredients;
        if (selectedRecipe.ingredientsByTier) {
            const tiers = Object.keys(selectedRecipe.ingredientsByTier).map(Number).sort((a, b) => a - b);
            if (tiers.length > 0) return selectedRecipe.ingredientsByTier[tiers[0]];
        }
        return [];
    };

    return (
        <PageShell
            title="Crafting Planner"
            backgroundImage='/background/ao-crafting.jpg'
            description="Calculate profits, taxes, and material costs optimized for each city."
            icon={<Hammer className="h-6 w-6" />}
            headerActions={
                <div className="flex items-center gap-4">
                        <ServerSelector
                            selectedServer={region}
                            onServerChange={setRegion}
                        />
                </div>
            }
        >

                {/* Search Section */}
                <div className="mb-8 relative z-50">
                    <div className="flex flex-col md:flex-row gap-4 md:items-end">
                        <div className="flex-1">
                            <label className="text-xs text-muted-foreground block mb-2 font-medium flex items-center gap-1 uppercase tracking-wider">
                                <Search className="h-3 w-3" /> Search Item
                            </label>
                            <Select
                                value={searchSelectValue}
                                onChange={(value) => {
                                    const id = value;
                                    const option = searchOptions.find(o => o.value === id);
                                    if (option) {
                                        selectSearchResult({ id: option.value, name: option.label });
                                    }
                                }}
                                options={searchOptions}
                                searchable={true}
                                placeholder={isSearching ? 'Searching...' : 'Search for item to craft (e.g. Broadsword)...'}
                                onSearchTermChange={async (term) => {
                                    if (term.length < 2) {
                                        setSearchOptions([]);
                                        return;
                                    }
                                    setIsSearching(true);
                                    try {
                                        const results = await searchItems(term);
                                        setSearchOptions(results.map((it: any) => ({
                                            value: it.id,
                                            label: it.name,
                                            icon: <ItemIcon itemId={it.id} className="w-5 h-5 object-contain rounded-sm" />
                                        })));
                                    } catch (err) {
                                        console.error(err);
                                        setSearchOptions([]);
                                    } finally {
                                        setIsSearching(false);
                                    }
                                }}
                            />
                        </div>

                        {(selectedRecipe) && (
                            <button
                                onClick={clearSelection}
                                className="w-full md:w-auto px-4 py-2 bg-destructive hover:bg-destructive/90 border border-destructive rounded-xl text-destructive-foreground transition-colors font-regular flex items-center justify-center gap-2 shadow-lg whitespace-nowrap mb-[2px]"
                            >
                                <X className="h-5 w-5" />
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Importing Indicator */}
                    {isImporting && (
                        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-popover border border-border rounded-lg shadow-xl z-50 text-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                            Fetching recipe data...
                        </div>
                    )}

                    {searchError && (
                        <div className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded">
                            {searchError}
                        </div>
                    )}
                </div>

                {!selectedRecipe ? (
                    <div className="text-center py-20 bg-card/30 rounded-xl border border-border border-dashed">
                        <div className="max-w-md mx-auto">
                            <Hammer className="h-16 w-16 text-muted-foreground/50 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-muted-foreground mb-2">Ready to Craft?</h2>
                            <p className="text-muted-foreground/80">Search for an item above to calculate profits, taxes, and material costs across different cities.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Planner Controls */}
                        <div className="bg-card/50 rounded-xl border border-border p-6 mb-8">
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Item Info - Enhanced */}
                                <div className="flex-none lg:w-1/3 flex flex-col gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all"></div>
                                            <ItemIcon 
                                                itemId={`T4_${selectedRecipe?.productId}`} 
                                                className="relative w-32 h-32 object-contain drop-shadow-lg"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-primary uppercase font-bold tracking-wider mb-1">{selectedRecipe?.category}</div>
                                            <h2 className="text-3xl font-black text-foreground mb-2 leading-tight break-words">{selectedRecipe?.productName}</h2>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 py-1 px-3 rounded-full border border-border w-fit">
                                                <Hammer className="h-4 w-4 text-muted-foreground" /> {selectedRecipe?.station}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Configuration Grid */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Location & Quantity */}
                                    <div className="space-y-6">
                                        {/* Location Settings */}
                                        <div>
                                            <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 mb-3">
                                                <MapPin className="h-3 w-3" /> Location Strategy
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <Select
                                                        label={
                                                            <>
                                                                Buy Materials From
                                                                <Tooltip content="City where you will buy the raw materials (usually with Buy Orders)">
                                                                    <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                                </Tooltip>
                                                            </>
                                                        }
                                                        value={sourceCity}
                                                        onChange={(value) => setSourceCity(value)}
                                                        options={CITIES.map(c => ({ label: c, value: c }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Select
                                                        label={
                                                            <>
                                                                Sell Product To
                                                                <Tooltip content="City where you will sell the crafted items">
                                                                    <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                                </Tooltip>
                                                            </>
                                                        }
                                                        value={targetCity}
                                                        onChange={(value) => setTargetCity(value)}
                                                        options={CITIES.map(c => ({ label: c, value: c }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Craft Quantity */}
                                        <div>
                                            <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 mb-3">
                                                <Coins className="h-3 w-3" /> Market Settings
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <NumberInput
                                                        label={
                                                            <>
                                                                Craft Quantity
                                                                <Tooltip content="Number of items you plan to craft">
                                                                    <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                                </Tooltip>
                                                            </>
                                                        }
                                                        value={quantity}
                                                        onChange={(val) => setQuantity(Math.max(1, Math.floor(val) || 1))}
                                                        min={1}
                                                    />
                                                </div>
                                                
                                                <div className="pt-2">
                                                    <Checkbox
                                                        label={
                                                            <>
                                                                Sell Order
                                                                <Tooltip className="ml-2" content={sellOrder ? 'Using Min Sell Price (2.5% Setup Fee)' : 'Using Max Buy Price (Instant Sell)'}>
                                                                    <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                                </Tooltip>
                                                            </>
                                                        }
                                                        description={sellOrder ? 'Using Min Sell Price' : 'Using Max Buy Price'}
                                                        checked={sellOrder}
                                                        onChange={(e) => setSellOrder(e.target.checked)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Market & Settings */}
                                    <div className="space-y-6">
                                        <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 mb-3">
                                            <Percent className="h-3 w-3" /> Bonuses & Taxes
                                        </div>
                                        <div className="space-y-3">
                                            <Checkbox
                                                label={
                                                    <>
                                                        Premium Status
                                                        <Tooltip className="ml-2" content="Premium reduces market taxes from 8% to 4%">
                                                            <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                        </Tooltip>
                                                    </>
                                                }
                                                description={`Tax: ${hasPremium ? '4%' : '8%'}`}
                                                checked={hasPremium}
                                                onChange={(e) => setHasPremium(e.target.checked)}
                                            />

                                            {/* Return Rate - Reworked */}
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                    Return Rate
                                                    <Tooltip content="Resource Return Rate (RRR) depends on city bonuses and focus">
                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                    </Tooltip>
                                                </label>
                                                <div className="bg-muted p-1.5 rounded-xl border border-border space-y-2">
                                                    <div className="grid grid-cols-2 gap-1">
                                                        <button
                                                            onClick={() => { setReturnRate(15.2); setCustomReturnRate(''); }}
                                                            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${returnRate === 15.2 ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            City (15.2%)
                                                        </button>
                                                        <button
                                                            onClick={() => { setReturnRate(47.9); setCustomReturnRate(''); }}
                                                            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${returnRate === 47.9 ? 'bg-success/10 text-success shadow-sm border border-success/20' : 'text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            Focus (47.9%)
                                                        </button>
                                                    </div>
                                                    <div className="relative px-1 pb-1">
                                                        <input
                                                            type="number"
                                                            placeholder="Custom Rate..."
                                                            value={customReturnRate}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setCustomReturnRate(val);
                                                                setReturnRate(Number(val));
                                                            }}
                                                            className={`w-full bg-background border ${customReturnRate ? 'border-success/50 text-foreground' : 'border-border text-muted-foreground'} rounded-lg px-3 py-2 text-sm focus:border-success outline-none transition-colors`}
                                                        />
                                                        {customReturnRate && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-success font-bold">%</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Advanced Costs */}
                                            <div>
                                                <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 mb-3 mt-6">
                                                    <Settings className="h-3 w-3" /> Advanced
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <NumberInput
                                                            label={
                                                                <>
                                                                    Station Fee
                                                                    <Tooltip content="Fee per 100 nutrition (usually 400-1000)">
                                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                                    </Tooltip>
                                                                </>
                                                            }
                                                            value={stationFee || 0}
                                                            onChange={(val) => setStationFee(Math.max(0, val))}
                                                            min={0}
                                                        />
                                                    </div>
                                                    <div>
                                                        <NumberInput
                                                            label={
                                                                <>
                                                                    Journal Profit
                                                                    <Tooltip content="Estimated profit from filling laborer journals (per item)">
                                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                                    </Tooltip>
                                                                </>
                                                            }
                                                            value={journalProfit || 0}
                                                            onChange={(val) => setJournalProfit(Math.max(0, val))}
                                                            min={0}
                                                        />
                                                    </div>
                                                    <div>
                                                        <NumberInput
                                                            label={
                                                                <>
                                                                    Focus Cost
                                                                    <Tooltip content="Focus points required per item (check in-game)">
                                                                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                                                    </Tooltip>
                                                                </>
                                                            }
                                                            value={focusCost || 0}
                                                            onChange={(val) => setFocusCost(Math.max(0, val))}
                                                            min={0}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Table */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                                <RefreshCw className="h-8 w-8 animate-spin mb-4 text-success" />
                                <p>Fetching market data for {CITIES.length} cities...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                                    <div className="col-span-4 md:col-span-3 flex items-center gap-1">Item</div>
                                    <div className="col-span-2 text-right hidden md:block">
                                        <div className="flex items-center justify-end gap-1">
                                            Unit Price
                                            <Tooltip content="Estimated market price per unit">
                                                <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                            </Tooltip>
                                        </div>
                                    </div>
                                    <div className="col-span-3 md:col-span-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            Total Cost
                                            <Tooltip content="Material costs + Fees">
                                                <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                            </Tooltip>
                                        </div>
                                    </div>
                                    <div className="col-span-3 md:col-span-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            Total Profit
                                            <Tooltip content="Revenue - Costs - Taxes">
                                                <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                            </Tooltip>
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            ROI
                                            <Tooltip content="Return on Investment (Profit / Cost)">
                                                <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                            </Tooltip>
                                        </div>
                                    </div>
                                    {focusCost > 0 && (
                                        <div className="col-span-2 md:col-span-1 text-right text-success">
                                            <div className="flex items-center justify-end gap-1">
                                                / Focus
                                                <Tooltip content="Profit per Focus Point">
                                                    <CircleHelp className="h-3 w-3 text-success/50" />
                                                </Tooltip>
                                            </div>
                                        </div>
                                    )}
                                    <div className="col-span-2 hidden md:block text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            Yield
                                            <Tooltip content="Amount crafted per operation">
                                                <CircleHelp className="h-3 w-3 text-muted-foreground" />
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>

                                {TIERS.map(tier =>
                                    ENCHANTMENTS.map(ench => {
                                        const stats = calculateProfit(tier, ench);
                                        if (stats.productPrice === 0 && stats.materialCost === 0) return null;

                                        const rowId = `${tier}-${ench}`;
                                        const isExpanded = expandedRow === rowId;

                                        return (
                                            <div key={rowId} className="bg-card rounded-lg border border-border mb-2 overflow-hidden">
                                                {/* Mobile View */}
                                                <div
                                                    onClick={() => toggleRow(rowId)}
                                                    className="md:hidden p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <ItemIcon
                                                                itemId={`T${tier}_${selectedRecipe.productId}${ench > 0 ? `_LEVEL${ench}` : ''}`}
                                                                className="w-12 h-12 object-contain"
                                                            />
                                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary text-xs flex items-center justify-center border border-border text-muted-foreground font-bold">
                                                                {tier}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                                                                T{tier}.{ench}
                                                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </div>
                                                            <div className={`text-sm font-mono font-bold ${stats.profit > 0 ? 'text-success' : 'text-destructive'}`}>
                                                                {Math.round(stats.profit).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="text-right">
                                                        <div className={`text-lg font-bold ${stats.margin > 0 ? 'text-success' : 'text-destructive'}`}>
                                                            {stats.margin.toFixed(0)}%
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground uppercase">ROI</div>
                                                    </div>
                                                </div>

                                                {/* Desktop View */}
                                                <div
                                                    onClick={() => toggleRow(rowId)}
                                                    className="hidden md:grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                                                >
                                                    <div className="col-span-4 md:col-span-3 font-medium text-foreground flex items-center gap-3">
                                                        <div className="relative">
                                                            <ItemIcon
                                                                itemId={`T${tier}_${selectedRecipe.productId}${ench > 0 ? `_LEVEL${ench}` : ''}`}
                                                                className="w-10 h-10 object-contain"
                                                            />
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-[10px] flex items-center justify-center border border-border text-muted-foreground">
                                                                {tier}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-foreground group-hover:text-success transition-colors flex items-center gap-2">
                                                                Tier {tier}.{ench}
                                                                <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </div>
                                                            <div className="text-xs text-muted-foreground hidden md:block">
                                                                {selectedRecipe.productName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 text-right text-foreground font-mono hidden md:block">
                                                        {stats.productPrice.toLocaleString()}
                                                    </div>
                                                    <div className="col-span-3 md:col-span-2 text-right">
                                                        <div className="text-muted-foreground font-mono">{Math.round(stats.effectiveCost).toLocaleString()}</div>
                                                        <div className="text-[10px] text-muted-foreground hidden md:block">
                                                            Mat: {Math.round(stats.materialCost).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className={`col-span-3 md:col-span-2 text-right font-mono font-bold ${stats.profit > 0 ? 'text-success' : 'text-destructive'}`}>
                                                        {Math.round(stats.profit).toLocaleString()}
                                                        <div className="text-[10px] text-muted-foreground font-normal hidden md:block">
                                                            Tax: {Math.round(stats.taxes + stats.stationFee).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className={`col-span-2 md:col-span-1 text-right text-sm font-bold ${stats.margin > 0 ? 'text-success' : 'text-destructive'}`}>
                                                        {stats.margin.toFixed(0)}%
                                                    </div>
                                                    {focusCost > 0 && (
                                                        <div className="col-span-2 md:col-span-1 text-right text-sm font-bold text-success font-mono">
                                                            {Math.round(stats.profitPerFocus).toLocaleString()}
                                                            <div className="text-[10px] text-muted-foreground font-normal">/pt</div>
                                                        </div>
                                                    )}
                                                    <div className="col-span-2 hidden md:block text-right text-muted-foreground text-sm">
                                                        x{stats.yield}
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                {isExpanded && (
                                                    <div className="px-6 py-6 bg-muted/50 border-t border-border grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-2">
                                                        {/* Ingredients List */}
                                                        <div>
                                                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                                                                <Settings className="h-3 w-3" /> Ingredients Breakdown
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {stats.ingredients.map((ing: any, idx: number) => (
                                                                    <div key={idx} className="flex flex-col p-3 bg-card rounded border border-border hover:border-border transition-colors">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                <div className="bg-muted p-1 rounded flex-none">
                                                                                    <ItemIcon itemId={ing.resolvedId} className="w-8 h-8 object-contain" />
                                                                                </div>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="text-sm text-foreground font-medium break-words pr-2" title={ing.name || ing.resolvedId}>
                                                                                        {ing.count * quantity}x <span className="text-muted-foreground">{ing.name || formatItemName(ing.resolvedId)}</span>
                                                                                    </div>
                                                                                    <div className="text-[10px] text-muted-foreground font-mono truncate">{ing.resolvedId}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right flex-none pl-2">
                                                                                <div className="text-foreground font-mono">{Math.round(ing.totalCost * quantity).toLocaleString()}</div>
                                                                                <div className="flex items-center justify-end gap-1.5 group/price min-h-[24px]">
                                                                                    {editingPriceId === ing.resolvedId ? (
                                                                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                                                            <input
                                                                                                type="number"
                                                                                                value={tempPrice}
                                                                                                onChange={(e) => setTempPrice(e.target.value)}
                                                                                                className="w-20 bg-muted border border-success rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                                                                                                autoFocus
                                                                                                onKeyDown={(e) => {
                                                                                                    if (e.key === 'Enter') {
                                                                                                        const price = parseFloat(tempPrice);
                                                                                                        if (!isNaN(price)) {
                                                                                                            setCustomPrices(prev => ({ ...prev, [ing.resolvedId]: price }));
                                                                                                            setEditingPriceId(null);
                                                                                                        }
                                                                                                    } else if (e.key === 'Escape') {
                                                                                                        setEditingPriceId(null);
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    const price = parseFloat(tempPrice);
                                                                                                    if (!isNaN(price)) {
                                                                                                        setCustomPrices(prev => ({ ...prev, [ing.resolvedId]: price }));
                                                                                                        setEditingPriceId(null);
                                                                                                    }
                                                                                                }}
                                                                                                className="p-1 hover:bg-success/20 text-success rounded transition-colors"
                                                                                            >
                                                                                                <Check className="h-3 w-3" />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => setEditingPriceId(null)}
                                                                                                className="p-1 hover:bg-destructive/20 text-destructive rounded transition-colors"
                                                                                            >
                                                                                                <X className="h-3 w-3" />
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <div className={`text-[10px] ${customPrices[ing.resolvedId] !== undefined ? 'text-warning font-bold' : (ing.unitPrice === 0 ? 'text-destructive font-bold' : 'text-muted-foreground')}`}>
                                                                                                {ing.unitPrice > 0 ? Math.round(ing.unitPrice).toLocaleString() : 'N/A'}
                                                                                                {ing.unitPrice > 0 && <span className="text-muted-foreground font-normal ml-1 hidden sm:inline">each</span>}
                                                                                            </div>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setEditingPriceId(ing.resolvedId);
                                                                                                    setTempPrice(ing.unitPrice.toString());
                                                                                                }}
                                                                                                className={`p-1 hover:bg-secondary rounded transition-colors ${ing.unitPrice === 0 ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                                                                                                title="Edit Price"
                                                                                            >
                                                                                                <Edit2 className="h-3 w-3" />
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Sub Recipe Display */}
                                                                        {ing.subRecipeIngredients && ing.subRecipeIngredients.length > 0 && (
                                                                            <div className="mt-3 pl-12 border-t border-border pt-2">
                                                                                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-2 flex items-center gap-1">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-border"></div>
                                                                                    Crafted From (Per Unit)
                                                                                </div>
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                    {ing.subRecipeIngredients.map((sub: any, subIdx: number) => (
                                                                                        <div key={subIdx} className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5 border border-border/50 min-w-0">
                                                                                            <ItemIcon itemId={sub.resolvedId} className="w-6 h-6 object-contain flex-none" />
                                                                                            <div className="flex flex-col min-w-0">
                                                                                                <span className="text-xs text-foreground font-medium truncate" title={sub.name || sub.resolvedId}>
                                                                                                    {sub.count}x {sub.name || formatItemName(sub.itemId)}
                                                                                                </span>
                                                                                                <span className="text-[9px] text-muted-foreground font-mono truncate">{sub.resolvedId}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="mt-4 p-3 bg-muted/50 rounded border border-border text-xs text-muted-foreground">
                                                                <div className="flex justify-between mb-1">
                                                                    <span>Raw Material Cost:</span>
                                                                    <span className="font-mono">{Math.round(stats.materialCost).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between mb-1 text-success">
                                                                    <span>Return Rate Savings ({returnRate}%):</span>
                                                                    <span className="font-mono">+{Math.round(stats.materialCost - stats.effectiveCost).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between pt-2 border-t border-border font-bold text-foreground">
                                                                    <span>Effective Cost:</span>
                                                                    <span className="font-mono">{Math.round(stats.effectiveCost).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* City Prices Table */}
                                                        <div>
                                                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                                                                <Coins className="h-3 w-3" /> Market Analysis (Product)
                                                            </h4>
                                                            <div className="bg-card rounded border border-border overflow-hidden">
                                                                <table className="w-full text-sm text-left">
                                                                    <thead className="bg-muted text-muted-foreground font-medium text-xs uppercase">
                                                                        <tr>
                                                                            <th className="px-4 py-3">City</th>
                                                                            <th className="px-4 py-3 text-right">Min Sell Price</th>
                                                                            <th className="px-4 py-3 text-right">Max Buy Price</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-border text-sm">
                                                                        {CITIES.map(city => {
                                                                            const sell = getPrice(stats.productId, city, 'sell_min');
                                                                            const buy = getPrice(stats.productId, city, 'buy_max');
                                                                            const isTarget = city === targetCity;

                                                                            return (
                                                                                <tr key={city} className={`hover:bg-muted/50 transition-colors ${isTarget ? 'bg-success/10' : ''}`}>
                                                                                    <td className={`px-4 py-2 font-medium ${isTarget ? 'text-success' : 'text-muted-foreground'}`}>
                                                                                        {city} {isTarget && <span className="text-[10px] ml-1 bg-success/20 text-success px-1 rounded">TARGET</span>}
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-right font-mono text-foreground">
                                                                                        {sell > 0 ? sell.toLocaleString() : <span className="text-muted-foreground/50">-</span>}
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-right font-mono text-foreground">
                                                                                        {buy > 0 ? buy.toLocaleString() : <span className="text-muted-foreground/50">-</span>}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <div className="mt-2 text-[10px] text-muted-foreground text-center">
                                                                * Prices are based on recent market data. Actual in-game prices may vary.
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}

                                {prices.length === 0 && !loading && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No price data available. Check selected cities and region.
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            {/* </div> */}
            <InfoStrip currentPage="crafting-calc" />
        </PageShell>
    );
}
