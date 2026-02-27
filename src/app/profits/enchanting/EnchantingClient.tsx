'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { PageShell } from '@/components/PageShell';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, RefreshCw, CircleHelp, ChevronDown, ChevronUp, Plus, Minus, Info, Settings } from 'lucide-react';
import { getMarketPrices, LOCATIONS } from '@/lib/market-service';
import { SimpleItem, getItemNameService, searchItemsService } from '@/lib/item-service';
import { getEnchantmentMaterialCount, getMaterialId, ENCHANTMENT_MATERIALS } from './constants';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { Tooltip } from '@/components/ui/Tooltip';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { ItemIcon } from '@/components/ItemIcon';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';

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
];

export default function EnchantingClient() {
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

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFormDetails, setShowFormDetails] = useState(false);
  const [showTableDetails, setShowTableDetails] = useState(false);

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
  const [targetPriceOverride, setTargetPriceOverride] = useState<number | null>(null);

  // --- Logic ---

  const fromTierOptions = TIERS.filter(t => t.value < 3);
  const toTierOptions = TIERS.filter(t => t.value > 0);

  const baseVisualId = selectedItem ? (currentTier === 0 ? selectedItem : `${selectedItem}@${currentTier}`) : null;
  const targetVisualId = selectedItem ? `${selectedItem}@${targetTier}` : null;

  const getTierLabel = (tier: number) => {
    const found = TIERS.find(t => t.value === tier);
    return found ? found.label : `. ${tier}`;
  };

  const enchantSteps = [0, 1, 2, 3].map(level => {
    const found = TIERS.find(t => t.value === level);
    return {
      level,
      label: found ? found.label : `. ${level}`
    };
  });

  const getQualityLabel = (value: number) => {
    const found = QUALITIES.find(q => q.value === value);
    return found ? found.label : `Q${value}`;
  };

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
    if (targetTier <= currentTier) return;

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
      setTargetPriceOverride(null);

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
    const targetUnitPrice = targetPriceOverride ?? data.targetItem.price;
    const revenue = targetUnitPrice * quantity;

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
  }, [data, overrides, quantity, isPremium, includeTax, sellOrderType, targetPriceOverride]);

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
            className="p-2 bg-success hover:bg-success/90 text-primary-foreground rounded-lg   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg  z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
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
                    <div className="mt-4 flex items-center gap-4 p-4 bg-muted/60 rounded-xl border border-border/80">
                        <div className="h-16 w-16 md:h-20 md:w-20 bg-background/70 rounded-xl border border-border/70  flex items-center justify-center">
                            <ItemIcon 
                                itemId={baseVisualId || selectedItem}
                                alt={selectedItemName || selectedItem}
                                className="h-14 w-14 md:h-16 md:w-16 object-contain"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-bold text-foreground break-words leading-tight">{selectedItemName || selectedItem}</div>
                            <div className="text-xs text-muted-foreground truncate">{selectedItem}</div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              <span>{getTierLabel(currentTier)} → {getTierLabel(targetTier)}</span>
                              <span className="mx-1">·</span>
                              <span>{getQualityLabel(quality)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="lg:col-span-8 bg-card/50 p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-bold text-foreground text-sm">Configuration</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Column 1: Item Configuration */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                            <Sparkles className="h-4 w-4 text-warning" />
                            <h4 className="text-sm font-bold text-foreground">Item Configuration</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Select 
                                label="From Tier"
                                options={fromTierOptions}
                                value={currentTier}
                                onChange={(val) => {
                                  const nextFrom = Number(val);
                                  setCurrentTier(nextFrom);
                                  setTargetTier(prev => {
                                    const minTarget = nextFrom + 1;
                                    if (prev <= nextFrom || prev == null) {
                                      const candidate = toTierOptions.find(t => t.value >= minTarget);
                                      return candidate ? candidate.value : minTarget;
                                    }
                                    return prev;
                                  });
                                }}
                            />
                            <Select 
                                label="To Tier"
                                options={toTierOptions.filter(t => t.value > currentTier)}
                                value={targetTier}
                                onChange={(val) => {
                                  const nextTo = Number(val);
                                  if (nextTo <= currentTier) {
                                    const adjustedFrom = Math.max(0, nextTo - 1);
                                    setCurrentTier(adjustedFrom);
                                    setTargetTier(nextTo);
                                  } else {
                                    setTargetTier(nextTo);
                                  }
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select 
                                label="Quality"
                                options={qualityOptions}
                                value={quality}
                                onChange={(val) => setQuality(Number(val))}
                            />
                            <NumberInput 
                                label="Quantity"
                                value={quantity}
                                onChange={setQuantity}
                                min={1}
                            />
                        </div>
                    </div>

                    {/* Column 2: Market Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                            <RefreshCw className="h-4 w-4 text-primary" />
                            <h4 className="text-sm font-bold text-foreground">Market Settings</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <Select 
                                label="Buy Materials At"
                                options={cityOptions}
                                value={buyCity}
                                onChange={setBuyCity}
                            />
                             <Select 
                                label="Sell Enchanted At"
                                options={cityOptions}
                                value={sellCity}
                                onChange={setSellCity}
                            />
                        </div>
                        
                         <div className="grid grid-cols-2 gap-4 text-xs">
                             <Checkbox 
                                label="Premium Tax"
                                checked={isPremium}
                                onChange={(e) => setIsPremium(e.target.checked)}
                             />
                             <Checkbox 
                                label="Include Tax"
                                checked={includeTax}
                                onChange={(e) => setIncludeTax(e.target.checked)}
                             />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <Select 
                                label="Buy Strategy"
                                options={[
                                    { value: 'sell_order', label: 'Instant Buy' },
                                    { value: 'buy_order', label: 'Buy Order' }
                                ]}
                                value={buyOrderType}
                                onChange={(v) => setBuyOrderType(v as any)}
                            />
                             <Select 
                                label="Sell Strategy"
                                options={[
                                    { value: 'sell_order', label: 'Sell Order' },
                                    { value: 'buy_order', label: 'Instant Sell' }
                                ]}
                                value={sellOrderType}
                                onChange={(v) => setSellOrderType(v as any)}
                            />
                        </div>
                    </div>
                </div>

                {selectedItem && (
                  <div className="mt-4 border-t border-border pt-4 space-y-3">
                    <button
                      onClick={() => setShowFormDetails(!showFormDetails)}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <CircleHelp className="h-3 w-3" />
                      {showFormDetails ? 'Hide path & tax details' : 'Show path & tax details'}
                    </button>
                    {showFormDetails && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="bg-muted/30 rounded-lg border border-border/60 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">Enchant Path</span>
                            <span className="text-muted-foreground">{getTierLabel(currentTier)} → {getTierLabel(targetTier)}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {enchantSteps.map(step => {
                              const active = step.level >= currentTier && step.level <= targetTier;
                              return (
                                <Badge
                                  key={step.level}
                                  variant={active ? 'default' : 'outline'}
                                  className={active ? 'bg-primary/80 text-primary-foreground border-none' : 'border-border text-muted-foreground'}
                                >
                                  {step.label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        <div className="bg-muted/30 rounded-lg border border-border/60 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">Market Strategy</span>
                            <span className="text-muted-foreground">{buyCity} → {sellCity}</span>
                          </div>
                          <div className="space-y-1 mt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Buy</span>
                              <span className="font-mono">
                                {buyOrderType === 'buy_order' ? 'Buy Order' : 'Instant Buy'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Sell</span>
                              <span className="font-mono">
                                {sellOrderType === 'sell_order' ? 'Sell Order' : 'Instant Sell'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-muted/30 rounded-lg border border-border/60 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">Taxes</span>
                            <span className="text-muted-foreground">{includeTax ? 'Included' : 'Ignored'}</span>
                          </div>
                          <div className="space-y-1 mt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Premium</span>
                              <span className="font-mono">{isPremium ? 'On' : 'Off'}</span>
                            </div>
                            <p className="text-muted-foreground mt-1">
                              Sell Orders use market tax and setup fee; Instant Sell only uses market tax.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
        </div>
        
        {/* Results */}
        {calculation && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-card/60 border border-border rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    {baseVisualId && (
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 md:h-20 md:w-20 bg-background/80 rounded-xl border border-border/80  flex items-center justify-center">
                          <ItemIcon itemId={baseVisualId} className="h-14 w-14 md:h-16 md:w-16 object-contain" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-muted-foreground uppercase">From</div>
                          <div className="text-sm font-bold text-foreground truncate max-w-[160px]">
                            {selectedItemName || selectedItem}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {getTierLabel(currentTier)}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-center px-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    {targetVisualId && (
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 md:h-20 md:w-20 bg-primary/5 rounded-xl border border-primary/30  flex items-center justify-center">
                          <ItemIcon itemId={targetVisualId} quality={quality} className="h-14 w-14 md:h-16 md:w-16 object-contain" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-muted-foreground uppercase">To</div>
                          <div className="text-sm font-bold text-foreground truncate max-w-[160px]">
                            {selectedItemName || selectedItem}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {getTierLabel(targetTier)} · {getQualityLabel(quality)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 justify-end w-full md:w-auto text-[11px] text-muted-foreground">
                    <span>Qty {quantity}</span>
                    <span>Quality {getQualityLabel(quality)}</span>
                    <span>{buyCity} → {sellCity}</span>
                  </div>
                </div>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card p-4 rounded-xl border border-border">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Cost</div>
                        <div className="text-xl font-mono font-bold text-foreground">
                            {Math.round(calculation.totalCost).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-card p-4 rounded-xl border border-border">
                         <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Revenue (Est.)</div>
                         <div className="text-xl font-mono font-bold text-success">
                            {Math.round(calculation.revenue).toLocaleString()}
                         </div>
                    </div>
                     <div className="bg-card p-4 rounded-xl border border-border">
                         <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Net Profit</div>
                         <div className={`text-xl font-mono font-bold ${calculation.profit > 0 ? 'text-success' : 'text-destructive'}`}>
                            {Math.round(calculation.profit).toLocaleString()}
                         </div>
                    </div>
                     <div className="bg-card p-4 rounded-xl border border-border">
                         <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ROI</div>
                         <div className={`text-xl font-mono font-bold ${calculation.roi > 0 ? 'text-success' : 'text-destructive'}`}>
                            {calculation.roi.toFixed(1)}%
                         </div>
                    </div>
                </div>

                {/* Details Table */}
                <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground">Calculation Details</h3>
                          <Tooltip content="See how each component contributes to your total cost and profit.">
                            <button className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground">
                              <CircleHelp className="h-3.5 w-3.5" />
                            </button>
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setShowTableDetails(prev => !prev)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-border/80 bg-background/60 hover:bg-background/90 transition-colors"
                          >
                            <span>{showTableDetails ? 'Hide advanced metrics' : 'Show advanced metrics'}</span>
                            <ChevronDown className={`h-3 w-3 transition-transform ${showTableDetails ? 'rotate-180' : ''}`} />
                          </button>
                          {calculation.missingData && (
                            <Badge variant="warning" className="gap-1">
                              <Info className="h-3 w-3" />
                              Missing some price data
                            </Badge>
                          )}
                        </div>
                    </div>

                    {showTableDetails && (
                      <div className="px-4 pt-4 pb-3 border-b border-border bg-muted/20 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Cost per item</div>
                          <div className="font-mono font-semibold text-foreground">
                            {Math.round(calculation.totalCost / quantity).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Tax per item</div>
                          <div className="font-mono font-semibold text-destructive">
                            -{Math.round(calculation.tax / quantity).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Profit per item</div>
                          <div className={`font-mono font-semibold ${calculation.profit > 0 ? 'text-success' : 'text-destructive'}`}>
                            {Math.round(calculation.profit / quantity).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Break-even price</div>
                          <div className="font-mono font-semibold text-foreground">
                            {Math.round((calculation.totalCost + calculation.tax) / quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                                    <th className="p-4 pl-6">Item / Material</th>
                                    <th className="p-4 text-right">Count</th>
                                    <th className="p-4 text-right">Unit Price</th>
                                    <th className="p-4 text-right">Total</th>
                                    <th className="p-4 text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {(() => {
                                  const baseMat = calculation.materials[0];
                                  const baseRowId = 'base';
                                  const baseExpanded = expandedRow === baseRowId;
                                  const baseShare = calculation.totalCost > 0 ? (baseMat.totalCost / calculation.totalCost) * 100 : 0;
                                  return (
                                    <Fragment>
                                      <tr className="hover:bg-muted/30">
                                        <td className="p-4 pl-6">
                                          <div className="flex items-center gap-3">
                                            <ItemIcon itemId={calculation.baseItem.id} className="h-8 w-8" />
                                            <div>
                                              <div className="font-medium">{baseMat.name}</div>
                                              <div className="text-xs text-muted-foreground">Base Item</div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-4 text-right font-mono">{baseMat.count * quantity}</td>
                                        <td className="p-4 text-right font-mono text-muted-foreground">{baseMat.price.toLocaleString()}</td>
                                        <td className="p-4 text-right font-mono font-medium">{baseMat.totalCost.toLocaleString()}</td>
                                        <td className="p-4 text-center">
                                          <button
                                            onClick={() => setExpandedRow(prev => (prev === baseRowId ? null : baseRowId))}
                                            className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/60 hover:bg-background px-1.5 py-1"
                                          >
                                            {baseExpanded ? (
                                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                                            ) : (
                                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                            )}
                                          </button>
                                        </td>
                                      </tr>
                                      {baseExpanded && (
                                        <tr className="bg-muted/15">
                                          <td colSpan={5} className="p-4 pl-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                              <div>
                                                <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Role</div>
                                                <div className="text-foreground font-medium">Base item cost</div>
                                              </div>
                                              <div>
                                                <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Cost per result</div>
                                                <div className="font-mono text-foreground">
                                                  {Math.round(baseMat.totalCost / quantity).toLocaleString()}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Share of total</div>
                                                <div className="font-mono text-foreground">
                                                  {baseShare.toFixed(1)}%
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </Fragment>
                                  );
                                })()}
                                
                                {calculation.materials.slice(1).map((mat) => {
                                  const rowId = mat.itemId;
                                  const isExpanded = expandedRow === rowId;
                                  const share = calculation.totalCost > 0 ? (mat.totalCost / calculation.totalCost) * 100 : 0;
                                  return (
                                    <Fragment key={mat.itemId}>
                                      <tr className="hover:bg-muted/30">
                                        <td className="p-4 pl-6">
                                          <div className="flex items-center gap-3">
                                            <ItemIcon itemId={mat.itemId} className="h-8 w-8" />
                                            <div>
                                              <div className="font-medium">{mat.name}</div>
                                              <div className="text-xs text-muted-foreground">Enchantment Material</div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-4 text-right font-mono">{mat.count * quantity}</td>
                                        <td className="p-4 text-right font-mono text-muted-foreground">{mat.price.toLocaleString()}</td>
                                        <td className="p-4 text-right font-mono font-medium">{mat.totalCost.toLocaleString()}</td>
                                        <td className="p-4 text-center">
                                          <button
                                            onClick={() => setExpandedRow(prev => (prev === rowId ? null : rowId))}
                                            className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/60 hover:bg-background px-1.5 py-1"
                                          >
                                            {isExpanded ? (
                                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                                            ) : (
                                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                            )}
                                          </button>
                                        </td>
                                      </tr>
                                      {isExpanded && (
                                        <tr className="bg-muted/10">
                                          <td colSpan={5} className="p-4 pl-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                              <div>
                                                <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Role</div>
                                                <div className="text-foreground font-medium">Enchantment material cost</div>
                                              </div>
                                              <div>
                                                <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Cost per result</div>
                                                <div className="font-mono text-foreground">
                                                  {Math.round(mat.totalCost / quantity).toLocaleString()}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Share of total</div>
                                                <div className="font-mono text-foreground">
                                                  {share.toFixed(1)}%
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </Fragment>
                                  );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-border bg-muted/10 px-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-muted-foreground uppercase tracking-wider mb-1">Total Material Cost</div>
                          <div className="font-mono text-sm font-bold text-foreground">
                            {Math.round(calculation.totalCost).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground uppercase tracking-wider mb-1">Estimated Revenue</div>
                          <div className="font-mono text-sm font-bold text-success">
                            {Math.round(calculation.revenue).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground uppercase tracking-wider mb-1">Estimated Tax & Fees</div>
                          <div className="font-mono text-sm font-bold text-destructive">
                            -{Math.round(calculation.tax).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground uppercase tracking-wider mb-1">Net Profit (Batch)</div>
                          <div className={`font-mono text-sm font-bold ${calculation.profit > 0 ? 'text-success' : 'text-destructive'}`}>
                            {Math.round(calculation.profit).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
            </div>
        )}

        {!selectedItem && !loading && (
            <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-xl border border-border border-dashed">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">Select an Item to Start</h3>
                <p className="text-sm">Search for a weapon or armor piece to calculate enchanting profits.</p>
            </div>
        )}
      </div>
      <InfoStrip currentPage="profits-enchanting">
        <InfoBanner
          icon={<Sparkles className="w-4 h-4" />}
          color="text-purple-400"
          title="Tips for Enchanting Profits"
        >
          <p>Profitable enchanting often comes from underpriced base items and cheap runes or souls in off-meta cities.</p>
          <p className="mt-1">Pay attention to your buy and sell cities, tax settings, and enchantment tiers to mirror how enchanting really works in-game.</p>
        </InfoBanner>
      </InfoStrip>
    </PageShell>
  );
}
