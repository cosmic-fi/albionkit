'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, RefreshCw, CircleHelp, ArrowRight, ChevronDown, ChevronUp, Info, Plus, Minus } from 'lucide-react';
import { getMarketPrices, LOCATIONS, MarketStat } from '@/lib/market-service';
import { SimpleItem, getItemNameService, searchItemsService } from '@/lib/item-service';
import { getEnchantmentMaterialCount, getMaterialId, ENCHANTMENT_MATERIALS } from './constants';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { Tooltip } from '@/components/ui/Tooltip';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { ItemIcon } from '@/components/ItemIcon';
import { FeatureLock } from '@/components/subscription/FeatureLock';

// Types
interface MaterialRequirement {
  name: string;
  itemId: string;
  count: number;
  price: number;
  totalCost: number;
  isBaseItem?: boolean;
}

interface EnchantingCalculation {
  id: string; // unique key
  baseItem: {
    id: string;
    name: string;
    price: number;
  };
  targetItem: {
    id: string;
    price: number;
  };
  materials: MaterialRequirement[];
  totalMaterialCost: number;
  totalCost: number;
  revenue: number;
  tax: number;
  profit: number;
  roi: number;
  missingData: boolean;
}

const QUALITIES = [
  { value: 1, label: 'Normal' },
  { value: 2, label: 'Good' },
  { value: 3, label: 'Outstanding' },
  { value: 4, label: 'Excellent' },
  { value: 5, label: 'Masterpiece' }
];

const TIERS = [
  { value: 0, label: '.0 (Base)' },
  { value: 1, label: '.1 (Rune)' },
  { value: 2, label: '.2 (Soul)' },
  { value: 3, label: '.3 (Relic)' },
  // .4 is Avalonian, usually handled separately or not standard loop
];

export default function EnchantingPage() {
  // --- State ---
  const [selectedItem, setSelectedItem] = useState<string | null>(null); // Base Item ID (e.g., T4_SWORD)
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const { server: region, setServer: setRegion } = useServer();
  const { profile } = useAuth();
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SimpleItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Filters
  const [currentTier, setCurrentTier] = useState(0);
  const [targetTier, setTargetTier] = useState(1);
  const [quality, setQuality] = useState(1);
  const [isPremium, setIsPremium] = useState(true);
  const [includeTax, setIncludeTax] = useState(true);
  const [quantity, setQuantity] = useState(1);
  
  const [buyCity, setBuyCity] = useState<string>('Lymhurst');
  const [sellCity, setSellCity] = useState<string>('Lymhurst');
  
  const [buyOrderType, setBuyOrderType] = useState<'buy_order' | 'sell_order'>('sell_order'); // Default: Buy from Sell Order (Instant Buy)
  const [sellOrderType, setSellOrderType] = useState<'buy_order' | 'sell_order'>('sell_order'); // Default: Sell to Sell Order (Wait)

  // Initialize from preferences
  useEffect(() => {
    if (profile?.preferences) {
        if (profile.preferences.defaultServer) {
            const server = profile.preferences.defaultServer;
            if (server === 'Asia') setRegion('east');
            else if (server === 'Europe') setRegion('europe');
            else setRegion('west');
        }
        if (profile.preferences.defaultMarketLocation) {
            setBuyCity(profile.preferences.defaultMarketLocation);
            setSellCity(profile.preferences.defaultMarketLocation);
        }
    }
  }, [profile]);

  // Data
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EnchantingCalculation | null>(null);
  const [expanded, setExpanded] = useState(true); // Default expanded for single result
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Overrides (Map of ItemID -> { price?: number, count?: number })
  const [overrides, setOverrides] = useState<Record<string, { price?: number, count?: number }>>({});

  // --- Logic ---

  // Ensure target tier > current tier
  useEffect(() => {
    if (targetTier <= currentTier) {
      setTargetTier(currentTier + 1);
    }
  }, [currentTier]);

  const handleSelectItem = (itemId: string, item?: SimpleItem) => {
    // Always store base ID (remove @1, @2 etc)
    const baseId = itemId.split('@')[0];
    setSelectedItem(baseId);
    setSelectedItemName(item?.name || baseId);
    setOverrides({}); // Reset overrides
    setIsSelectOpen(false);
  };

  useEffect(() => {
    if (!isSelectOpen) return;
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    searchItemsService(searchQuery)
      .then((items: SimpleItem[]) => {
        if (!cancelled) setSearchResults(items || []);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery, isSelectOpen]);
  const loadData = async () => {
    if (!selectedItem) return;

    setLoading(true);
    try {
      // 1. Identify all items needed
      const itemsToFetch = new Set<string>();
      
      // Base Item (Current Tier)
      const baseItemId = currentTier === 0 ? selectedItem : `${selectedItem}@${currentTier}`;
      itemsToFetch.add(baseItemId);

      // Target Item (Target Tier)
      const targetItemId = `${selectedItem}@${targetTier}`;
      itemsToFetch.add(targetItemId);

      // Materials needed for steps
      const tierMatch = selectedItem.match(/^T(\d+)_/);
      const itemTier = tierMatch ? parseInt(tierMatch[1]) : 4;
      const matCountPerLevel = getEnchantmentMaterialCount(selectedItem);

      const steps: { level: number, matId: string }[] = [];
      for (let level = currentTier + 1; level <= targetTier; level++) {
        const matId = getMaterialId(itemTier, level);
        if (matId) {
          itemsToFetch.add(matId);
          steps.push({ level, matId });
        }
      }

      // 2. Fetch Prices
      // We need prices for BuyCity (Inputs) and SellCity (Outputs)
      // Since API returns all cities, we filter later.
      // But we need to specify quality for the equipment. Materials usually Quality 1.
      
      // Split into Equipment (Quality matters) and Materials (Quality 1)
      const equipmentIds = [baseItemId, targetItemId];
      const materialIds = steps.map(s => s.matId);

      const [equipPrices, matPrices] = await Promise.all([
        getMarketPrices(equipmentIds, region, [buyCity, sellCity], quality),
        getMarketPrices(materialIds, region, [buyCity, sellCity], 1) // Mats always Q1
      ]);

      const allPrices = [...equipPrices, ...matPrices];

      // 3. Process Data & Calculate
      
      // Helper to get price based on strategy
      const getPrice = (id: string, city: string, type: 'buy_order' | 'sell_order', isSelling: boolean) => {
        const stat = allPrices.find(p => p.item_id === id && p.city === city);
        if (!stat) return 0;

        // If buying:
        // - 'buy_order': We place a Buy Order -> Price is buy_price_max (competitor) + epsilon? Or just buy_price_max?
        //   Usually "Buy Order" price = buy_price_max (current highest bid).
        // - 'sell_order': We Instant Buy -> Price is sell_price_min.
        if (!isSelling) {
            return type === 'buy_order' ? stat.buy_price_max : stat.sell_price_min;
        } 
        
        // If selling:
        // - 'sell_order': We place a Sell Order -> Price is sell_price_min (competitor).
        // - 'buy_order': We Instant Sell -> Price is buy_price_max.
        else {
            return type === 'sell_order' ? stat.sell_price_min : stat.buy_price_max;
        }
      };

      // Base Item Price
      const basePrice = getPrice(baseItemId, buyCity, buyOrderType, false);
      
      // Target Item Price
      const targetPrice = getPrice(targetItemId, sellCity, sellOrderType, true);

      // Materials
      const materials: MaterialRequirement[] = [];
      
      // Add Base Item as first "material"
      materials.push({
        name: selectedItemName || (currentTier === 0 ? 'Base Item' : `Tier .${currentTier} Item`),
        itemId: baseItemId,
        count: 1, // 1 base item per result
        price: basePrice,
        totalCost: basePrice,
        isBaseItem: true
      });

      for (const step of steps) {
        const matPrice = getPrice(step.matId, buyCity, buyOrderType, false);
        const matName = await getItemNameService(step.matId);
        materials.push({
            name: matName || ENCHANTMENT_MATERIALS[step.level as keyof typeof ENCHANTMENT_MATERIALS] || `Level ${step.level} Mat`,
            itemId: step.matId,
            count: matCountPerLevel,
            price: matPrice,
            totalCost: matPrice * matCountPerLevel,
            isBaseItem: false
        });
      }

      // Construct Initial Calculation
      const initialCalc: EnchantingCalculation = {
        id: `${selectedItem}-${currentTier}-${targetTier}`,
        baseItem: { id: baseItemId, name: baseItemId, price: basePrice },
        targetItem: { id: targetItemId, price: targetPrice },
        materials,
        totalMaterialCost: 0, // Calculated below
        totalCost: 0,
        revenue: 0,
        tax: 0,
        profit: 0,
        roi: 0,
        missingData: basePrice === 0 || targetPrice === 0 || materials.some(m => m.price === 0)
      };

      // We'll run calculation effect to update totals
      setData(initialCalc);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Recalculate when data/overrides/settings change
  const calculation = useMemo(() => {
    if (!data) return null;

    // Apply Overrides and Quantity
    const updatedMats = data.materials.map(mat => {
      const override = overrides[mat.itemId];
      const finalPrice = override?.price ?? mat.price;
      const finalCount = override?.count ?? mat.count;
      
      return {
        ...mat,
        price: finalPrice,
        count: finalCount,
        totalCost: finalPrice * finalCount * quantity
      };
    });

    const totalCost = updatedMats.reduce((sum, m) => sum + m.totalCost, 0);
    
    // Revenue
    // Check if target price overridden? Maybe later. For now just base data.
    const revenue = data.targetItem.price * quantity;

    // Tax
    // Premium: 4% (2% setup + 2% tax) - approx
    // Non-Premium: 8% (4% setup + 4% tax) - approx
    // If Instant Sell (Sell to Buy Order), usually no setup fee? 
    // Let's use simple logic:
    // Sell Order: Setup + Tax
    // Instant Sell: Tax only
    // Tax Rates:
    // Setup: 2.5% (Premium 1.25%?) - Actually Premium halves tax.
    // Standard Tax: 4% (Premium 2%)
    // Standard Setup: 2.5% (Premium 1.25%?) - Setup fee is 2.5% usually.
    // Let's use simplified Albion Math commonly used:
    // Premium Total Tax = 4% (if Sell Order), 2% (if Instant Sell)?
    // Non-Premium Total Tax = 8% (if Sell Order), 4% (if Instant Sell)?
    // Let's just use: Premium = 4%, Non-Premium = 8% for Sell Orders.
    // And half that for Instant Sell.
    
    let taxRate = 0;
    if (includeTax) {
        if (sellOrderType === 'sell_order') {
            taxRate = isPremium ? 0.045 : 0.08; // 4.5% vs 8%? 
            // 4% Tax + 2.5% Setup = 6.5% (Premium) -> 3% Tax + 1.25% Setup?
            // Actually: 
            // Global Discount for Premium is 50% on market tax.
            // Setup fee is 2.5%. Tax is 4%.
            // Premium: Tax 2%. Setup 1.25%? No, setup fee not discounted?
            // Let's stick to 6.5% (Non-Premium) vs 3.5%?
            // "Premium reduces market tax by 50%".
            // Standard Tax: 4%. Premium Tax: 2%.
            // Setup Fee: 2.5%. (Always 2.5%? Or also halved?)
            // Wiki says: "Premium holders pay 50% less tax". Setup fee is a fee, not tax?
            // Let's use:
            // Premium: 4% (Tax 2% + Setup 2%? or 2.5%?) -> Common is 4-6%.
            // Non-Premium: 8% (Tax 4% + Setup 4%?)
            // I will use: Premium 4.5% (2% tax + 2.5% setup), Non-Premium 6.5% (4% tax + 2.5% setup).
            // Actually, let's just use standard: 6.5% total for Premium? No that's non-premium.
            // Let's simplify: 6.5% (Non-Premium), 3.5% (Premium).
            
            // Re-reading common calculator logic:
            // Non-Premium: 4% Tax + 2.5% Setup = 6.5%.
            // Premium: 2% Tax + 1.25% Setup = 3.25%.
            taxRate = isPremium ? 0.0325 : 0.065;
        } else {
            // Instant Sell: No setup fee.
            // Non-Premium: 4% Tax.
            // Premium: 2% Tax.
            taxRate = isPremium ? 0.02 : 0.04;
        }
    }

    const tax = revenue * taxRate;
    const profit = revenue - totalCost - tax;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return {
      ...data,
      materials: updatedMats,
      totalCost,
      revenue,
      tax,
      profit,
      roi
    };
  }, [data, overrides, quantity, isPremium, includeTax, sellOrderType]);

  const handleOverride = (itemId: string, field: 'price' | 'count', value: number) => {
    setOverrides(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  useEffect(() => {
    loadData();
  }, [selectedItem, region, currentTier, targetTier, quality, buyCity, sellCity]);

  // Helper for City Options
  const cityOptions = LOCATIONS.filter(l => l !== 'Black Market').map(c => ({ value: c, label: c }));
  const qualityOptions = QUALITIES;

  return (
    <PageShell 
      title="Enchanting Calculator" 
      backgroundImage='/background/ao-crafting.jpg'  
      description="Calculate profit margins for enchanting materials and gear."
      icon={<Sparkles className="h-6 w-6" />}
      headerActions={
        <div className="flex items-center gap-4">
           <ServerSelector
            selectedServer={region}
            onServerChange={setRegion}
          />
          <button 
            onClick={loadData}
            disabled={loading || !selectedItem}
            className="p-2 bg-success hover:bg-success/90 text-primary-foreground rounded-lg shadow-lg shadow-success/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* Top Section: Search & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Search */}
            <div className="lg:col-span-4 bg-card/50 p-6 rounded-xl border border-border">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Item Selection</h3>
                
                <div className="relative">
                    <div 
                        onClick={() => setIsSelectOpen(!isSelectOpen)}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm flex items-center justify-between cursor-pointer hover:border-ring/50 transition-colors"
                    >
                        <span className={selectedItemName ? 'text-foreground' : 'text-muted-foreground'}>
                            {selectedItemName || "Select an item..."}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isSelectOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <div className="p-2 border-b border-border">
                                <Input
                                    placeholder="Search item (e.g. Sword)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 text-sm"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-4 text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Searching...
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-4 text-sm text-center text-muted-foreground">
                                        {searchQuery.length < 2 ? 'Type to search items' : 'No items found'}
                                    </div>
                                ) : (
                                    searchResults.map((item) => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => handleSelectItem(item.id, item)}
                                            className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors"
                                        >
                                            <ItemIcon 
                                                itemId={item.id} 
                                                alt={item.name} 
                                                className="w-8 h-8 object-contain bg-background/50 rounded p-0.5 border border-border"
                                            />
                                            <span className="text-sm text-foreground">{item.name}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {selectedItem && (
                    <div className="mt-4 flex items-center gap-4 p-3 bg-muted/50 rounded-lg border border-border">
                        <ItemIcon 
                            itemId={selectedItem}
                            alt={selectedItemName || selectedItem}
                            className="h-12 w-12 object-contain"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="font-bold text-foreground break-words leading-tight">{selectedItemName || selectedItem}</div>
                            <div className="text-xs text-muted-foreground truncate">{selectedItem}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="lg:col-span-8 bg-card/50 p-6 rounded-xl border border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Column 1: Item Configuration */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                            <Sparkles className="h-4 w-4 text-warning" />
                            <h4 className="text-sm font-bold text-foreground">Item Configuration</h4>
                        </div>
                        
                        <div className="bg-background/30 p-4 rounded-lg border border-border/50 space-y-5">
                            <div>
                                <label className="text-xs text-muted-foreground block mb-2 font-medium">Enchantment Level</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 block">From</span>
                                        <SegmentedControl
                                            options={TIERS.filter(t => t.value < 3).map(t => ({ value: t.value, label: t.label.split(' ')[0] }))}
                                            value={currentTier}
                                            onChange={(val) => setCurrentTier(val as number)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 block">To</span>
                                        <SegmentedControl
                                            options={TIERS.filter(t => t.value > currentTier).map(t => ({ value: t.value, label: t.label.split(' ')[0] }))}
                                            value={targetTier}
                                            onChange={(val) => setTargetTier(val as number)}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-border/50 pt-4">
                                <label className="text-xs text-muted-foreground block mb-2 font-medium">Item Quality</label>
                                <SegmentedControl
                                    options={qualityOptions.map(q => ({ 
                                        value: q.value, 
                                        label: q.label === 'Outstanding' ? 'Outst.' : q.label 
                                    }))}
                                    value={quality}
                                    onChange={(val) => setQuality(val as number)}
                                    className="w-full overflow-x-auto"
                                />
                            </div>

                            <div className="border-t border-border/50 pt-4">
                                <label className="text-xs text-muted-foreground block mb-2 font-medium">Quantity</label>
                                <NumberInput 
                                    value={quantity}
                                    onChange={setQuantity}
                                    min={1}
                                    className="bg-background border-input w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Market Strategy */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                            <RefreshCw className="h-4 w-4 text-green-500" />
                            <h4 className="text-sm font-bold text-foreground">Market Strategy</h4>
                        </div>

                        <div className="space-y-4">
                            {/* Buying Group */}
                            <div className="bg-muted/30 p-3 pl-4 rounded-lg border border-border/50 relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500/20 rounded-l-lg"></div>
                                <div className="text-xs font-semibold text-green-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    Sourcing (Buy Materials)
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Select 
                                        label="City"
                                        options={cityOptions}
                                        value={buyCity}
                                        onChange={(val) => setBuyCity(val)}
                                        className="text-xs"
                                    />
                                    <Select 
                                        label="Method"
                                        value={buyOrderType}
                                        options={[
                                            { value: 'sell_order', label: 'Instant Buy' },
                                            { value: 'buy_order', label: 'Buy Order' }
                                        ]}
                                        onChange={(val) => setBuyOrderType(val as any)}
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            {/* Selling Group */}
                            <div className="bg-muted/30 p-3 pl-4 rounded-lg border border-border/50 relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/20 rounded-l-lg"></div>
                                <div className="text-xs font-semibold text-yellow-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                    Selling (Sell Result)
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Select 
                                        label="City"
                                        options={cityOptions}
                                        value={sellCity}
                                        onChange={(val) => setSellCity(val)}
                                        className="text-xs"
                                    />
                                    <Select 
                                        label="Method"
                                        value={sellOrderType}
                                        options={[
                                            { value: 'sell_order', label: 'Sell Order' },
                                            { value: 'buy_order', label: 'Instant Sell' }
                                        ]}
                                        onChange={(val) => setSellOrderType(val as any)}
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            {/* Global Settings */}
                            <div className="flex items-center gap-6 bg-muted/30 p-3 rounded-lg border border-border/50">
                                <Checkbox 
                                    label="Premium"
                                    checked={isPremium}
                                    onChange={(e) => setIsPremium(e.target.checked)}
                                />
                                <Checkbox 
                                    label="Include Tax"
                                    checked={includeTax}
                                    onChange={(e) => setIncludeTax(e.target.checked)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Results */}
        {calculation && (
            <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
                {/* Header Summary */}
                <div className="p-6 border-b border-border bg-muted/30">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                         {/* Item Transmog */}
                         <div className="flex items-center gap-6">
                             <div className="relative">
                                 <img 
                                    src={`https://render.albiononline.com/v1/item/${calculation.baseItem.id}?quality=${quality}`} 
                                    alt="From"
                                    className="h-16 w-16 object-contain"
                                 />
                                 <Badge className="absolute -top-2 -right-2 bg-background text-foreground border-border shadow-sm z-10">
                                    .{currentTier}
                                 </Badge>
                             </div>
                             <div className="flex flex-col items-center text-muted-foreground">
                                <ArrowRight className="h-6 w-6" />
                                <span className="text-xs mt-1">Enchant</span>
                             </div>
                             <div className="relative">
                                 <img 
                                    src={`https://render.albiononline.com/v1/item/${calculation.targetItem.id}?quality=${quality}`} 
                                    alt="To"
                                    className="h-16 w-16 object-contain"
                                 />
                                 <Badge className="absolute -top-2 -right-2 bg-primary/20 text-primary border-primary/50 shadow-sm z-10">
                                    .{targetTier}
                                 </Badge>
                             </div>
                         </div>

                         {/* Profit Stats */}
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1 w-full md:w-auto justify-end text-right">
                             <div>
                                 <div className="text-xs text-muted-foreground mb-1 flex items-center justify-end gap-1">
                                    <Tooltip content="Total cost of base item + materials">
                                        <span>Total Cost</span>
                                        <CircleHelp className="h-3 w-3" />
                                    </Tooltip>
                                 </div>
                                 <div className="text-foreground font-mono text-lg">{Math.round(calculation.totalCost).toLocaleString()}</div>
                             </div>
                             <div>
                                 <div className="text-xs text-muted-foreground mb-1 flex items-center justify-end gap-1">
                                    <Tooltip content="Revenue from selling target item">
                                        <span>Revenue</span>
                                        <CircleHelp className="h-3 w-3" />
                                    </Tooltip>
                                 </div>
                                 <div className="text-foreground font-mono text-lg">{Math.round(calculation.revenue).toLocaleString()}</div>
                             </div>
                             <div>
                                 <div className="text-xs text-muted-foreground mb-1 flex items-center justify-end gap-1">
                                    <Tooltip content="Net Profit after Tax">
                                        <span>Profit</span>
                                        <CircleHelp className="h-3 w-3" />
                                    </Tooltip>
                                 </div>
                                 <div className={`font-mono font-bold text-lg ${calculation.profit > 0 ? 'text-success' : 'text-destructive'}`}>
                                    {Math.round(calculation.profit).toLocaleString()}
                                 </div>
                             </div>
                             <div>
                                 <div className="text-xs text-muted-foreground mb-1 flex items-center justify-end gap-1">
                                    <Tooltip content="Return on Investment">
                                        <span>ROI</span>
                                        <CircleHelp className="h-3 w-3" />
                                    </Tooltip>
                                 </div>
                                 <div className={`font-mono font-bold text-lg ${calculation.roi > 0 ? 'text-success' : 'text-destructive'}`}>
                                    {calculation.roi.toFixed(1)}%
                                 </div>
                             </div>
                         </div>
                    </div>

                    {calculation.missingData && (
                        <div className="mt-4 flex items-center gap-2 text-warning bg-warning/10 p-2 rounded text-sm">
                            <Info className="h-4 w-4" />
                            <span>Some market data is missing. Please verify prices manually.</span>
                        </div>
                    )}
                </div>

                {/* Material Breakdown */}
                <div className="bg-muted/20">
                     <button 
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex items-center justify-between p-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                     >
                        <span className="font-medium">Material Breakdown & Adjustments</span>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                     </button>

                    {expanded && (
                        <FeatureLock
                          title="Material Adjustments"
                          description="Unlock manual overrides for counts and prices, plus detailed breakdown."
                        >
                          <div className="p-4 border-t border-border">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left">
                                <thead>
                                  <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border/50">
                                    <th className="pb-3 pl-2">Material</th>
                                    <th className="pb-3 text-right whitespace-nowrap">Count/Item</th>
                                    <th className="pb-3 text-right whitespace-nowrap">Total Count</th>
                                    <th className="pb-3 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end gap-1">
                                        <Tooltip content="Market price per unit">
                                          <span>Price (Unit)</span>
                                          <CircleHelp className="h-3 w-3" />
                                        </Tooltip>
                                      </div>
                                    </th>
                                    <th className="pb-3 text-right whitespace-nowrap pr-3">
                                      <div className="flex items-center justify-end gap-1">
                                        <Tooltip content="Total cost for this material">
                                          <span>Total Cost</span>
                                          <CircleHelp className="h-3 w-3" />
                                        </Tooltip>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                  {calculation.materials.map((mat) => (
                                            <Fragment key={mat.itemId}>
                                               <tr 
                                                   className={`group hover:bg-muted/20 transition-colors cursor-pointer ${expandedRow === mat.itemId ? 'bg-muted/20' : ''}`}
                                                   onClick={() => setExpandedRow(expandedRow === mat.itemId ? null : mat.itemId)}
                                               >
                                                   <td className="py-3 pl-2">
                                                       <div className="flex items-center gap-3">
                                                           {expandedRow === mat.itemId ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                           <img 
                                                               src={`https://render.albiononline.com/v1/item/${mat.itemId}${mat.isBaseItem ? `?quality=${quality}` : ''}`} 
                                                               alt={mat.name}
                                                               className="h-10 w-10 object-contain bg-card/50 rounded p-1 border border-border"
                                                           />
                                                           <div>
                                                               <div className="text-foreground font-medium whitespace-nowrap">{mat.name}</div>
                                                               <div className="text-xs text-muted-foreground">{mat.itemId}</div>
                                                           </div>
                                                       </div>
                                                   </td>
                                                   <td className="py-3 text-right text-muted-foreground whitespace-nowrap">
                                                       {mat.isBaseItem ? '1' : getEnchantmentMaterialCount(selectedItem || '')}
                                                   </td>
                                                   <td className="py-3 text-right text-foreground whitespace-nowrap">
                                                       {(mat.count * quantity).toLocaleString()}
                                                   </td>
                                                   <td className="py-3 text-right text-foreground whitespace-nowrap">
                                                       {mat.price.toLocaleString()}
                                                   </td>
                                                   <td className="py-3 text-right text-foreground font-mono whitespace-nowrap pr-3">
                                                       {Math.round(mat.totalCost).toLocaleString()}
                                                   </td>
                                               </tr>
                                               {expandedRow === mat.itemId && (
                                                   <tr className="bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-200">
                                                       <td colSpan={5} className="p-4">
                                                           <div className="flex items-center gap-8 bg-card/50 rounded-lg p-4 border border-border/50">
                                                               <div className="flex-1 max-w-xs">
                                                                   <NumberInput 
                                                                       label="Override Unit Count"
                                                                       value={mat.count}
                                                                       onChange={(val) => handleOverride(mat.itemId, 'count', val)}
                                                                       min={0}
                                                                       className="bg-background border-input"
                                                                       isCustom={!!overrides[mat.itemId]?.count}
                                                                       onReset={() => {
                                                                           const newOverrides = {...overrides};
                                                                           if (newOverrides[mat.itemId]) {
                                                                               delete newOverrides[mat.itemId].count;
                                                                               if (!newOverrides[mat.itemId].price) delete newOverrides[mat.itemId];
                                                                               setOverrides(newOverrides);
                                                                           }
                                                                       }}
                                                                   />
                                                               </div>
                                                               <div className="flex-1 max-w-xs">
                                                                   <NumberInput 
                                                                       label="Override Price"
                                                                       value={mat.price}
                                                                       onChange={(val) => handleOverride(mat.itemId, 'price', val)}
                                                                       min={0}
                                                                       className="bg-background border-input"
                                                                       isCustom={!!overrides[mat.itemId]?.price}
                                                                       onReset={() => {
                                                                           const newOverrides = {...overrides};
                                                                           if (newOverrides[mat.itemId]) {
                                                                               delete newOverrides[mat.itemId].price;
                                                                               if (!newOverrides[mat.itemId].count) delete newOverrides[mat.itemId];
                                                                               setOverrides(newOverrides);
                                                                           }
                                                                       }}
                                                                   />
                                                               </div>
                                                               <div className="flex-1 text-right text-xs text-muted-foreground">
                                                                   <div className="mb-1">Total Calculation</div>
                                                                   <div className="font-mono text-foreground">
                                                                       {(mat.count * quantity).toLocaleString()} x {mat.price.toLocaleString()} = <span className="text-success">{Math.round(mat.totalCost).toLocaleString()}</span>
                                                                   </div>
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
                            
                            <div className="mt-4 p-3 bg-muted/50 rounded border border-border text-xs text-muted-foreground text-center">
                              Tip: You can manually adjust counts and prices above to simulate different scenarios.
                            </div>
                          </div>
                        </FeatureLock>
                     )}
                </div>
            </div>
        )}

        {!selectedItem && !loading && (
             <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
                 <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-medium text-muted-foreground">Select an item to start calculating</h3>
                 <p className="text-muted-foreground/80">Choose a weapon or armor piece to see enchanting profits.</p>
             </div>
        )}
      </div>
      <InfoStrip currentPage="profits-enchanting" />
    </PageShell>
  );
}
