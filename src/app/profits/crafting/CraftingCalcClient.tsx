'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useServer } from '@/hooks/useServer';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import { ItemIcon } from '@/components/ItemIcon';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tooltip } from '@/components/ui/Tooltip';
import { ServerSelector } from '@/components/ServerSelector';
import { Preloader } from '@/components/Preloader';
import {
  Hammer, RefreshCw, Search, X, MapPin, Coins, Percent,
  TrendingUp, Package, DollarSign, CircleHelp, Settings,
  ChevronDown, ChevronUp, ArrowRight, Flame, Zap, Crown,
  Factory, Truck, ShoppingCart, Tag, Calculator
} from 'lucide-react';
import { TIERS, ENCHANTMENTS } from './constants';
import { getRecipePrices, searchItems, getItemData, resolveItemName } from './actions';
import { Recipe } from './recipes';
import { generateRecipe, createRecipeFromApi } from './recipe-generator';
import { useAuth } from '@/context/AuthContext';

const CITIES = ['Martlock', 'Bridgewatch', 'Lymhurst', 'Fort Sterling', 'Thetford', 'Caerleon', 'Brecilien', 'Black Market'];

export default function CraftingCalcClient() {
  const t = useTranslations('CraftingCalc');
  const locale = useLocale();
  const { profile } = useAuth();
  const { server: region, setServer: setRegion } = useServer();

  // State
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [ingredientNames, setIngredientNames] = useState<Record<string, string>>({});
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  // Crafting Settings
  const [returnRate, setReturnRate] = useState(47.9);
  const [quantity, setQuantity] = useState(1);
  const [hasPremium, setHasPremium] = useState(true);
  const [sellOrder, setSellOrder] = useState(true);
  const [sourceCity, setSourceCity] = useState('Martlock');
  const [targetCity, setTargetCity] = useState('Martlock');
  const [stationFee, setStationFee] = useState(0);
  const [journalProfit, setJournalProfit] = useState(0);
  const [focusCost, setFocusCost] = useState(0);

  // UI State
  const [selectedTier, setSelectedTier] = useState(8);
  const [selectedEnchant, setSelectedEnchant] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  // Initialize from preferences
  useEffect(() => {
    if (profile?.preferences) {
      if (profile.preferences.defaultMarketLocation) {
        setSourceCity(profile.preferences.defaultMarketLocation);
        setTargetCity(profile.preferences.defaultMarketLocation);
      }
    }
  }, [profile]);

  // Load prices when recipe changes
  useEffect(() => {
    if (selectedRecipe) {
      loadPrices();
      resolveNames();
    }
  }, [selectedRecipe, region, locale]);

  const resolveNames = async () => {
    if (!selectedRecipe) return;

    const ids = new Set<string>();
    
    // Collect all item IDs that need names (all tiers and enchantments)
    TIERS.forEach(tier => {
      const ings = selectedRecipe.ingredientsByTier?.[tier] || selectedRecipe.ingredients;
      ings.forEach(ing => {
        ENCHANTMENTS.forEach(ench => {
          const suffix = ench > 0 ? `_LEVEL${ench}` : '';
          let ingId = '';
          if (/^T\d+_/.test(ing.itemId)) {
            ingId = ing.isEnchantable ? `${ing.itemId}${suffix}` : ing.itemId;
          } else {
            const ingTier = tier + (ing.tierOffset || 0);
            if (ingTier >= 1) {
              ingId = ing.isEnchantable ? `T${ingTier}_${ing.itemId}${suffix}` : `T${ingTier}_${ing.itemId}`;
            }
          }
          if (ingId) ids.add(ingId);
        });
      });
    });

    // Also add product IDs for all tiers
    TIERS.forEach(tier => {
      ENCHANTMENTS.forEach(ench => {
        const suffix = ench > 0 ? `_LEVEL${ench}` : '';
        ids.add(`T${tier}_${selectedRecipe.productId}${suffix}`);
      });
    });

    // Fetch names for all IDs
    const newNames: Record<string, string> = {};
    await Promise.all(
      Array.from(ids).map(async (id) => {
        if (!id) return;
        // Skip if we already have the name
        if (ingredientNames[id] && ingredientNames[id] !== id) return;
        
        const name = await resolveItemName(id, locale);
        if (name && name !== id) {
          newNames[id] = name;
        }
      })
    );

    if (Object.keys(newNames).length > 0) {
      setIngredientNames(prev => ({ ...prev, ...newNames }));
    }
  };

  const loadPrices = async () => {
    if (!selectedRecipe) return;
    setLoading(true);
    const { data, error } = await getRecipePrices(selectedRecipe, region);
    if (data) setPrices(data);
    setLoading(false);
  };

  const selectSearchResult = async (item: any) => {
    setSearchError(null);
    setIsImporting(true);
    let recipe = generateRecipe(item.id);
    
    if (!recipe) {
      const data = await getItemData(item.id);
      if (data) {
        recipe = createRecipeFromApi(item.id, data);
      }
    }
    
    setIsImporting(false);
    
    if (recipe) {
      setSelectedRecipe(recipe);
      setSearchValue('');
      setSearchOptions([]);
      
      // Extract tier and enchantment from the selected item ID
      const tierMatch = item.id.match(/^T(\d+)_/);
      const enchantMatch = item.id.match(/_LEVEL(\d+)$/);
      
      setSelectedTier(tierMatch ? parseInt(tierMatch[1]) : 8);
      setSelectedEnchant(enchantMatch ? parseInt(enchantMatch[1]) : 0);
    } else {
      setSearchError(t('noRecipeFound', { name: item.name }));
    }
  };

  const clearSelection = () => {
    setSelectedRecipe(null);
    setSearchValue('');
    setSearchOptions([]);
    setPrices([]);
    setCustomPrices({});
    setIngredientNames({});
  };

  const getPrice = (itemId: string, city: string, type: 'sell_min' | 'buy_max') => {
    if (customPrices[itemId] !== undefined) return customPrices[itemId];
    const itemPrices = prices.filter(p => p.item_id === itemId && p.city === city);
    if (itemPrices.length === 0) return 0;
    
    if (type === 'sell_min') {
      const valid = itemPrices.filter(p => p.sell_price_min > 0);
      return valid.length > 0 ? Math.min(...valid.map(p => p.sell_price_min)) : 0;
    } else {
      const valid = itemPrices.filter(p => p.buy_price_max > 0);
      return valid.length > 0 ? Math.max(...valid.map(p => p.buy_price_max)) : 0;
    }
  };

  const calculateProfit = useCallback((tier: number, enchantment: number) => {
    if (!selectedRecipe) return null;

    const suffix = enchantment > 0 ? `_LEVEL${enchantment}` : '';
    const productId = `T${tier}_${selectedRecipe.productId}${suffix}`;
    const productPriceUnit = getPrice(productId, targetCity, sellOrder ? 'sell_min' : 'buy_max');
    const productPriceTotal = productPriceUnit * quantity;

    let materialCostUnit = 0;
    const ingredientDetails: any[] = [];

    const currentIngredients = selectedRecipe.ingredientsByTier?.[tier] || selectedRecipe.ingredients;

    currentIngredients.forEach(ing => {
      let ingId = '';
      if (/^T\d+_/.test(ing.itemId)) {
        ingId = ing.isEnchantable ? `${ing.itemId}${suffix}` : ing.itemId;
      } else {
        const ingTier = tier + (ing.tierOffset || 0);
        if (ingTier >= 1) {
          ingId = ing.isEnchantable ? `T${ingTier}_${ing.itemId}${suffix}` : `T${ingTier}_${ing.itemId}`;
        }
      }

      const price = getPrice(ingId, sourceCity, 'sell_min');
      materialCostUnit += price * ing.count;

      ingredientDetails.push({
        ...ing,
        resolvedId: ingId,
        name: ingredientNames[ingId] || formatItemName(ingId),
        unitPrice: price,
        totalCost: price * ing.count
      });
    });

    const materialCostTotal = materialCostUnit * quantity;
    const effectiveMatCost = materialCostTotal * (1 - returnRate / 100);
    const productYield = selectedRecipe.yield || 1;
    const totalRevenue = productPriceTotal * productYield;

    const taxRate = hasPremium ? 0.04 : 0.08;
    const setupFeeRate = sellOrder ? 0.025 : 0;
    const marketTaxes = totalRevenue * (taxRate + setupFeeRate);
    const totalStationFee = stationFee * quantity;
    const totalJournalProfit = journalProfit * quantity;

    const profit = totalRevenue - effectiveMatCost - marketTaxes - totalStationFee + totalJournalProfit;
    const margin = effectiveMatCost > 0 ? (profit / effectiveMatCost) * 100 : 0;
    const profitPerFocus = focusCost > 0 ? profit / (focusCost * quantity) : 0;

    return {
      productId,
      productPrice: productPriceUnit,
      materialCost: materialCostTotal,
      effectiveCost: effectiveMatCost,
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
  }, [selectedRecipe, returnRate, quantity, hasPremium, sellOrder, sourceCity, targetCity, stationFee, journalProfit, focusCost, ingredientNames, customPrices, prices]);

  const formatItemName = (itemId: string) => {
    let name = itemId.replace(/^T\d+_/, '').split('@')[0].replace(/_/g, ' ');
    return name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const currentProfit = calculateProfit(selectedTier, selectedEnchant);

  return (
    <PageShell
      title={t('title')}
      backgroundImage='/background/ao-crafting.jpg'
      description={t('description')}
      headerActions={
        <ServerSelector selectedServer={region} onServerChange={setRegion} />
      }
    >
      <div className="space-y-6">
        {/* ===== SEARCH SECTION ===== */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Search className="h-4 w-4" /> {t('searchItem')}
              </label>
              <Select
                value={searchValue}
                onChange={(value) => {
                  const option = searchOptions.find(o => o.value === value);
                  if (option) selectSearchResult({ id: option.value, name: option.label });
                }}
                options={searchOptions}
                searchable
                placeholder={isSearching ? t('searching') : t('searchPlaceholder')}
                onSearchTermChange={async (term) => {
                  if (term.length < 2) { setSearchOptions([]); return; }
                  setIsSearching(true);
                  try {
                    const results = await searchItems(term, locale);
                    setSearchOptions(results.map((it: any) => ({
                      value: it.id,
                      label: it.name,
                      icon: <ItemIcon itemId={it.id} className="w-5 h-5" />
                    })));
                  } finally {
                    setIsSearching(false);
                  }
                }}
              />
            </div>
            {selectedRecipe && (
              <Button variant="destructive" onClick={clearSelection} className="gap-2">
                <X className="h-5 w-5" /> {t('clear')}
              </Button>
            )}
          </div>
          
          {isImporting && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
              <Preloader size="lg" />
              <p className="text-sm text-muted-foreground">{t('fetchingRecipe')}</p>
            </div>
          )}
          
          {searchError && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              {searchError}
            </div>
          )}
        </div>

        {!selectedRecipe ? (
          /* ===== EMPTY STATE ===== */
          <div className="text-center py-20 bg-card/50 rounded-2xl border border-border border-dashed">
            <Hammer className="h-20 w-20 text-muted-foreground/30 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-muted-foreground mb-2">{t('readyToCraft')}</h2>
            <p className="text-muted-foreground">{t('readyToCraftDesc')}</p>
          </div>
        ) : (
          <>
            {/* ===== ITEM HEADER ===== */}
            <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl border border-border p-6 shadow-lg">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="relative group">
                  <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full group-hover:bg-orange-500/30 transition-all"></div>
                  <ItemIcon
                    itemId={`T${selectedTier}_${selectedRecipe?.productId}${selectedEnchant > 0 ? `_LEVEL${selectedEnchant}` : ''}`}
                    className="relative w-32 h-32 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-2">{t(`categories.${selectedRecipe?.category}`)}</div>
                  <h2 className="text-3xl font-black text-foreground mb-3">
                    {ingredientNames[`T${selectedTier}_${selectedRecipe.productId}${selectedEnchant > 0 ? `_LEVEL${selectedEnchant}` : ''}`] || selectedRecipe?.productName}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border text-sm">
                      <Factory className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t(`stations.${selectedRecipe?.station}`)}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('yield')}: {selectedRecipe?.yield || 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== CONTROLS GRID ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Location & Quantity */}
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">{t('locations')}</h3>
                </div>
                <div className="space-y-4">
                  <Select
                    label={t('buyMaterialsFrom')}
                    value={sourceCity}
                    onChange={setSourceCity}
                    options={CITIES.map(c => ({ label: t(`cities.${c}`), value: c }))}
                  />
                  <Select
                    label={t('sellProductTo')}
                    value={targetCity}
                    onChange={setTargetCity}
                    options={CITIES.map(c => ({ label: t(`cities.${c}`), value: c }))}
                  />
                  <div className="pt-4 border-t border-border">
                    <NumberInput
                      label={t('quantity')}
                      value={quantity}
                      onChange={setQuantity}
                      min={1}
                    />
                  </div>
                </div>
              </div>

              {/* Crafting Settings */}
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">{t('craftingSettings')}</h3>
                </div>
                <div className="space-y-4">
                  <NumberInput
                    label={t('returnRate')}
                    value={returnRate}
                    onChange={(v) => setReturnRate(Math.min(100, Math.max(0, v)))}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('premiumAccount')}</span>
                    <Checkbox
                      id="premium-toggle"
                      checked={hasPremium}
                      onChange={(e) => setHasPremium(e.target.checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('sellOrder')}</span>
                    <Checkbox
                      id="sellorder-toggle"
                      checked={sellOrder}
                      onChange={(e) => setSellOrder(e.target.checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="bg-card rounded-xl border border-border p-5">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'advanced' ? null : 'advanced')}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    <h3 className="font-bold">{t('advancedSettings')}</h3>
                  </div>
                  {expandedSection === 'advanced' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSection === 'advanced' && (
                  <div className="space-y-4">
                    <NumberInput
                      label={t('stationFee')}
                      value={stationFee}
                      onChange={setStationFee}
                    />
                    <NumberInput
                      label={t('journalProfit')}
                      value={journalProfit}
                      onChange={setJournalProfit}
                    />
                    <NumberInput
                      label={t('focusCost')}
                      value={focusCost}
                      onChange={setFocusCost}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ===== PROFIT OVERVIEW ===== */}
            {currentProfit && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">{t('profitOverview')}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={<DollarSign className="h-5 w-5 text-green-500" />}
                    label={t('profit')}
                    value={formatNumber(currentProfit.profit)}
                    valueClass={currentProfit.profit > 0 ? 'text-green-500' : 'text-red-500'}
                    trend={currentProfit.profit > 0 ? 'up' : 'down'}
                  />
                  <StatCard
                    icon={<Percent className="h-5 w-5 text-blue-500" />}
                    label={t('margin')}
                    value={`${currentProfit.margin.toFixed(1)}%`}
                    valueClass={currentProfit.margin > 20 ? 'text-green-500' : currentProfit.margin > 0 ? 'text-blue-500' : 'text-red-500'}
                  />
                  <StatCard
                    icon={<Coins className="h-5 w-5 text-amber-500" />}
                    label={t('revenue')}
                    value={formatNumber(currentProfit.revenue)}
                    valueClass="text-amber-500"
                  />
                  <StatCard
                    icon={<Package className="h-5 w-5 text-purple-500" />}
                    label={t('effectiveCost')}
                    value={formatNumber(currentProfit.effectiveCost)}
                    valueClass="text-purple-500"
                  />
                </div>
                <div className="mt-6 pt-6 border-t border-primary/20 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <DetailRow label={t('materialCost')} value={formatNumber(currentProfit.materialCost)} />
                  <DetailRow label={t('marketTaxes')} value={formatNumber(currentProfit.taxes)} />
                  <DetailRow label={t('stationFee')} value={formatNumber(currentProfit.stationFee)} />
                  <DetailRow label={t('journalProfit')} value={formatNumber(currentProfit.journalProfit)} valueClass="text-green-500" />
                  <DetailRow label={t('yield')} value={currentProfit.yield.toString()} />
                  {focusCost > 0 && <DetailRow label={t('profitPerFocus')} value={formatNumber(currentProfit.profitPerFocus)} />}
                </div>
              </div>
            )}

            {/* ===== INGREDIENTS BREAKDOWN ===== */}
            {currentProfit && currentProfit.ingredients.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-bold">{t('ingredients')}</h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('totalCost')}: <span className="font-bold text-foreground">{formatNumber(currentProfit.materialCost)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {currentProfit.ingredients.map((ing: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <ItemIcon itemId={ing.resolvedId} className="w-12 h-12 object-contain" />
                        <div>
                          <div className="font-bold">{ing.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {ing.count} x {formatNumber(ing.unitPrice)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold">
                        {formatNumber(ing.totalCost)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <InfoStrip currentPage="crafting-calc" />
    </PageShell>
  );
}

// Helper Components

function StatCard({ icon, label, value, valueClass, trend }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueClass?: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-card/50 rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-primary/10">{icon}</div>
        {trend && <span className="text-xs font-bold">{trend === 'up' ? '↑' : '↓'}</span>}
      </div>
      <div className="text-xs text-muted-foreground uppercase font-bold mb-1">{label}</div>
      <div className={`text-2xl font-black ${valueClass || 'text-foreground'}`}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value, valueClass }: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-bold ${valueClass || 'text-foreground'}`}>{value}</span>
    </div>
  );
}
