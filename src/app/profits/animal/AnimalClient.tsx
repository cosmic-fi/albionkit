'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import { PawPrint, RefreshCw, Info, Leaf, ChevronDown, ChevronUp, ArrowRight, Scale, Wheat, Beef, Egg, CircleDollarSign, AlertTriangle, RotateCcw, CircleHelp } from 'lucide-react';
import { ANIMAL_DEFINITIONS, Animal } from './constants';
import { getMarketPrices, getMarketVolume, LOCATIONS, getGameInfoItemData } from '@/lib/market-service';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { Badge } from '@/components/ui/Badge';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import { Tooltip } from '@/components/ui/Tooltip';
import { useTranslations } from 'next-intl';
import { ItemIcon } from '@/components/ItemIcon';

// Helper to generate animal stats based on Tier and Type
const getAnimalStats = (tier: number, id: string, type: 'pasture' | 'mount'): Partial<Animal> => {
  const isMount = type === 'mount';

  // Growth Time (Hours)
  let growthTime = 0;
  if (isMount) {
    // Mount growth times (approximate based on wiki)
    const mountTimes: Record<number, number> = { 3: 44, 4: 92, 5: 140, 6: 188, 7: 236, 8: 284 };
    growthTime = mountTimes[tier] || 44;
  } else {
    // Pasture animals: (Tier - 2) * 22
    growthTime = (tier - 2) * 22;
  }

  // Food Consumption
  // Pasture: 18 total? Wiki says "Diet 18". 
  // Mounts: Varies.
  let foodConsumption = 0;
  if (isMount) {
    const mountFood: Record<number, number> = { 3: 10, 4: 14, 5: 28, 6: 63, 7: 151, 8: 376 }; // Approx/Wiki values
    foodConsumption = mountFood[tier] || 10;
  } else {
    foodConsumption = 18; // Standard for livestock
  }

  // Favorite Food ID
  const favoriteFoods: Record<number, string> = {
    3: 'T3_FARM_WHEAT',
    4: 'T4_FARM_TURNIP',
    5: 'T5_FARM_CABBAGE',
    6: 'T6_FARM_POTATO',
    7: 'T7_FARM_CORN',
    8: 'T8_FARM_PUMPKIN'
  };
  const favoriteFoodId = favoriteFoods[tier];

  // Offspring Rate (Base / Focus)
  // We only store base here, or we can store both. Interface has offspringRate, offspringRateFocus.
  // Values from Wiki:
  const rates: Record<number, { base: number, focus: number }> = {
    3: { base: 60, focus: 140 },
    4: { base: 73.33, focus: 126.66 },
    5: { base: 80, focus: 120 },
    6: { base: 86.67, focus: 113.34 },
    7: { base: 91.11, focus: 108.89 },
    8: { base: 93.33, focus: 106.66 }
  };
  // Mounts have different rates
  const mountRates: Record<number, { base: number, focus: number }> = {
    3: { base: 84, focus: 104 },
    4: { base: 78.67, focus: 105.33 },
    5: { base: 78.67, focus: 105.34 },
    6: { base: 81.4, focus: 104.76 },
    7: { base: 84.2, focus: 103.95 },
    8: { base: 87.36, focus: 103.14 }
  };

  const rate = isMount ? mountRates[tier] : rates[tier];

  // Produce ID
  let produceId: string | undefined;
  let produceYield: number | undefined;

  if (!isMount) {
    if (id === 'chicken') { produceId = 'T3_EGG'; produceYield = 10; } // Hen Eggs
    else if (id === 'goat') { produceId = 'T4_MILK'; produceYield = 10; } // Goat Milk
    else if (id === 'goose') { produceId = 'T5_EGG'; produceYield = 10; } // Goose Eggs
    else if (id === 'sheep') { produceId = 'T6_MILK'; produceYield = 10; } // Sheep Milk
    else if (id === 'cow') { produceId = 'T8_MILK'; produceYield = 10; } // Cow Milk
    // Pig has no produce
  }

  // Meat ID
  let meatId: string | undefined;
  let meatYield: number | undefined;
  // All livestock produce meat. Mounts do not (they become mounts).
  if (!isMount) {
    // Meat ID usually matches Tier? T3_MEAT (Chicken), T4_MEAT (Goat), etc.
    // Check IDs: T3_MEAT (Raw Chicken), T4_MEAT (Raw Goat), T5_MEAT (Raw Goose), T6_MEAT (Raw Mutton), T7_MEAT (Raw Pork), T8_MEAT (Raw Beef).
    meatId = `T${tier}_MEAT`;
    meatYield = 20; // Standard assumption
  }

  return {
    growthTime,
    foodConsumption,
    offspringRate: rate?.base || 0,
    offspringRateFocus: rate?.focus || 0,
    favoriteFoodId,
    produceId,
    produceYield,
    meatId,
    meatYield
  };
};

interface AnimalData extends Animal {
  // Breeding
  babyPrice: number;
  babyVolume: number;
  adultPrice: number;
  adultVolume: number;

  // Food
  foodPrice: number; // Price per unit of generic food (Carrots)
  foodVolume: number;
  favoriteFoodPrice: number; // Price per unit of favorite food
  favoriteFoodVolume: number;

  // Products
  productPrice: number;
  productVolume: number;

  // Butchering
  meatPrice: number;
  meatVolume: number;

  // Calculations
  cost: number; // Total cost per unit
  profit: number; // For the current mode
  profitPerPlot: number; // For Breeding/Products
  roi: number;
  totalProfit: number; // Based on quantity

  warning?: string;

  // User override flags
  isCustomBabyPrice?: boolean;
  isCustomAdultPrice?: boolean;
  isCustomFoodPrice?: boolean;
  isCustomFavoriteFoodPrice?: boolean;
  isCustomProductPrice?: boolean;
  isCustomMeatPrice?: boolean;

  // Original fetched prices (for reset)
  originalBabyPrice?: number;
  originalAdultPrice?: number;
  originalFoodPrice?: number;
  originalFavoriteFoodPrice?: number;
  originalProductPrice?: number;
  originalMeatPrice?: number;
}

const CITIES = LOCATIONS.filter(l => l !== 'Black Market' && l !== 'Caerleon');
const ALL_CITIES = LOCATIONS;

type Tab = 'breeding' | 'products' | 'butchering';

export default function AnimalClient() {
  const t = useTranslations('Animal');
  const [activeTab, setActiveTab] = useState<Tab>('breeding');
  const { server: region, setServer: setRegion } = useServer();
  const [buyCity, setBuyCity] = useState<string>('Martlock');
  const [sellCity, setSellCity] = useState<string>('Martlock');

  const [usePremium, setUsePremium] = useState(true);
  const [useFocus, setUseFocus] = useState(false);
  const [useFavoriteFood, setUseFavoriteFood] = useState(true); // Default to using favorite food
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState<Animal[]>([]); // Dynamic animals list
  const [data, setData] = useState<AnimalData[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Generate Animals List
  useEffect(() => {
    const generated: Animal[] = [];

    // Process definitions
    for (const def of ANIMAL_DEFINITIONS) {
      if (def.type === 'mount') {
        // Generate T3-T8 for mounts
        for (let tier = 3; tier <= 8; tier++) {
          const stats = getAnimalStats(tier, def.id, 'mount');
          const babyId = `T${tier}_FARM_${def.id.toUpperCase()}_BABY`;
          const adultId = `T${tier}_FARM_${def.id.toUpperCase()}_GROWN`;
          generated.push({
            id: `${def.id}_t${tier}`,
            name: `${t(`animalNames.${def.id}`)} (T${tier})`,
            tier,
            babyId,
            adultId,
            ...stats
          } as Animal);
        }
      } else {
        // Pasture animals (single tier)
        const stats = getAnimalStats(def.tier, def.id, 'pasture');
        const babyId = `T${def.tier}_FARM_${def.id.toUpperCase()}_BABY`;
        const adultId = `T${def.tier}_FARM_${def.id.toUpperCase()}_GROWN`;
        generated.push({
          id: def.id,
          name: t(`animalNames.${def.id}`),
          tier: def.tier,
          babyId,
          adultId,
          ...stats
        } as Animal);
      }
    }
    setAnimals(generated);
  }, [t]);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof AnimalData; direction: 'asc' | 'desc' }>({
    key: 'profit',
    direction: 'desc'
  });

  const handleSort = (key: keyof AnimalData) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Global generic food price state (fetched from market)
  const [globalFoodPrice, setGlobalFoodPrice] = useState(350);
  const [globalFoodVolume, setGlobalFoodVolume] = useState(0);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const updateCalculation = (currentData: AnimalData[]) => {
    return currentData.map(row => {
      let profit = 0;
      let cost = 0;
      let revenue = 0;

      // Determine Food Cost
      // If using favorite food: Consumption / 2 * Favorite Price
      // If generic: Consumption * Generic Price
      // Multiply by number of cycles (growthTime / 22)
      // Note: growthTime is usually a multiple of 22 for pasture animals.
      // Mounts might be different, but for now we assume pasture logic or just use growthTime/22.
      const cycles = Math.max(1, Math.round(row.growthTime / 22));
      const foodPerCycle = useFavoriteFood ? (row.foodConsumption / 2) : row.foodConsumption;
      const totalFoodUnits = foodPerCycle * cycles;

      let foodCost = 0;
      if (useFavoriteFood && row.favoriteFoodId) {
        foodCost = totalFoodUnits * row.favoriteFoodPrice;
      } else {
        foodCost = totalFoodUnits * row.foodPrice;
      }

      if (activeTab === 'breeding') {
        const offspringRate = useFocus ? row.offspringRateFocus : row.offspringRate;
        // Cost = Baby + Food
        cost = row.babyPrice + foodCost;

        // Revenue = Adult + Offspring
        // Assume Offspring is sold at Baby Price (Buy City) or keep it simple
        const offspringRevenue = (offspringRate / 100) * row.babyPrice;
        revenue = row.adultPrice + offspringRevenue;
        profit = revenue - cost;

      } else if (activeTab === 'products') {
        if (!row.produceId) {
          profit = 0; cost = 1; // Avoid div by zero
        } else {
          // Cost = Food (per day/cycle)
          // For products, we usually calculate "Per Day" profit.
          // So we use 1 cycle of food cost.
          const dailyFoodCost = foodPerCycle * (useFavoriteFood && row.favoriteFoodId ? row.favoriteFoodPrice : row.foodPrice);
          cost = dailyFoodCost;

          // Revenue = Product Yield * Product Price
          // "Premium status doubles the yield of crops and animal products"
          const adjustedYield = (row.produceYield || 0) * (usePremium ? 1 : 0.5);
          revenue = adjustedYield * row.productPrice;
          profit = revenue - cost;
        }

      } else if (activeTab === 'butchering') {
        if (!row.meatId) {
          profit = 0; cost = 1;
        } else {
          // Cost = Grown Animal
          cost = row.adultPrice; // You buy the adult to butcher

          // Revenue = Meat Yield * Meat Price
          revenue = (row.meatYield || 0) * row.meatPrice;
          profit = revenue - cost;
        }
      }

      const roi = cost > 0 ? (profit / cost) * 100 : 0;

      return {
        ...row,
        cost,
        profit,
        profitPerPlot: profit * 9, // Relevant for breeding/products
        roi,
        totalProfit: profit * quantity
      };
    });
  };

  const handlePriceUpdate = (id: string, field: keyof AnimalData, value: number) => {
    setData(prev => {
      const newData = prev.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          // Mark as custom if user edits
          if (field === 'babyPrice') updatedRow.isCustomBabyPrice = true;
          if (field === 'adultPrice') updatedRow.isCustomAdultPrice = true;
          if (field === 'foodPrice') updatedRow.isCustomFoodPrice = true;
          if (field === 'favoriteFoodPrice') updatedRow.isCustomFavoriteFoodPrice = true;
          if (field === 'productPrice') updatedRow.isCustomProductPrice = true;
          if (field === 'meatPrice') updatedRow.isCustomMeatPrice = true;
          return updatedRow;
        }
        return row;
      });
      return updateCalculation(newData);
    });
  };

  const handleResetPrice = (id: string, field: keyof AnimalData) => {
    setData(prev => {
      const newData = prev.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row };

          if (field === 'babyPrice') {
            updatedRow.babyPrice = row.originalBabyPrice || 0;
            updatedRow.isCustomBabyPrice = false;
          }
          if (field === 'adultPrice') {
            updatedRow.adultPrice = row.originalAdultPrice || 0;
            updatedRow.isCustomAdultPrice = false;
          }
          if (field === 'foodPrice') {
            updatedRow.foodPrice = row.originalFoodPrice || 350;
            updatedRow.isCustomFoodPrice = false;
          }
          if (field === 'favoriteFoodPrice') {
            updatedRow.favoriteFoodPrice = row.originalFavoriteFoodPrice || 0;
            updatedRow.isCustomFavoriteFoodPrice = false;
          }
          if (field === 'productPrice') {
            updatedRow.productPrice = row.originalProductPrice || 0;
            updatedRow.isCustomProductPrice = false;
          }
          if (field === 'meatPrice') {
            updatedRow.meatPrice = row.originalMeatPrice || 0;
            updatedRow.isCustomMeatPrice = false;
          }

          return updatedRow;
        }
        return row;
      });
      return updateCalculation(newData);
    });
  };

  // Recalculate on toggle changes
  useEffect(() => {
    if (data.length > 0) {
      setData(prev => updateCalculation(prev));
    }
  }, [usePremium, useFocus, activeTab, quantity, useFavoriteFood]);

  const loadData = async () => {
    if (animals.length === 0) return; // Wait for animals to be generated

    setLoading(true);
    try {
      const itemIds = [
        'T1_CARROT', // Generic Food reference
        ...animals.map(a => a.babyId),
        ...animals.map(a => a.adultId),
        ...animals.filter(a => a.favoriteFoodId).map(a => a.favoriteFoodId!),
        ...animals.filter(a => a.produceId).map(a => a.produceId!),
        ...animals.filter(a => a.meatId).map(a => a.meatId!)
      ];

      // De-duplicate IDs
      const uniqueItemIds = Array.from(new Set(itemIds));

      const locationsToFetch = Array.from(new Set([buyCity, sellCity]));
      const prices = await getMarketPrices(uniqueItemIds, region, locationsToFetch);

      // Fetch Volumes
      let volumesBuy: any[] = [];
      let volumesSell: any[] = [];

      if (buyCity === sellCity) {
        const vols = await getMarketVolume(uniqueItemIds, region, buyCity);
        volumesBuy = vols;
        volumesSell = vols;
      } else {
        const [volsBuy, volsSell] = await Promise.all([
          getMarketVolume(uniqueItemIds, region, buyCity),
          getMarketVolume(uniqueItemIds, region, sellCity)
        ]);
        volumesBuy = volsBuy;
        volumesSell = volsSell;
      }

      // Determine Generic Food Price (T1 Carrot in Buy City)
      const foodStats = prices.filter(p => p.item_id === 'T1_CARROT' && p.city === buyCity);
      const validFoodPrices = foodStats.filter(s => s.sell_price_min > 0).map(s => s.sell_price_min);
      const fetchedFoodPrice = validFoodPrices.length > 0 ? Math.min(...validFoodPrices) : 350;

      const foodVolData = volumesBuy.find(v => v.item_id === 'T1_CARROT');
      const fetchedFoodVolume = foodVolData?.data?.[foodVolData.data.length - 1]?.item_count || 0;

      setGlobalFoodPrice(fetchedFoodPrice);
      setGlobalFoodVolume(fetchedFoodVolume);

      // Fetch Names from API for nicer display (Optional, can run in parallel)
      // For now we rely on the generated names, but we could update them here.

      const calculated = animals.map(animal => {
        const getPrice = (id: string, city: string) => {
          const stats = prices.filter(p => p.item_id === id && p.city === city);
          const valid = stats.filter(s => s.sell_price_min > 0).map(s => s.sell_price_min);
          return valid.length > 0 ? Math.min(...valid) : 0;
        };

        const getVolume = (id: string, city: string, isBuyCity: boolean) => {
          const vols = isBuyCity ? volumesBuy : volumesSell;
          const volData = vols.find(v => v.item_id === id);
          return volData?.data?.[volData.data.length - 1]?.item_count || 0;
        };

        const babyPrice = getPrice(animal.babyId, buyCity);
        const babyVolume = getVolume(animal.babyId, buyCity, true);

        const adultPrice = getPrice(animal.adultId, sellCity); // Sell adult in Sell City
        const adultVolume = getVolume(animal.adultId, sellCity, false);

        // Favorite Food (Buy City)
        const favoriteFoodPrice = animal.favoriteFoodId ? getPrice(animal.favoriteFoodId, buyCity) : 0;
        const favoriteFoodVolume = animal.favoriteFoodId ? getVolume(animal.favoriteFoodId, buyCity, true) : 0;

        // Product (Sell City)
        const productPrice = animal.produceId ? getPrice(animal.produceId, sellCity) : 0;
        const productVolume = animal.produceId ? getVolume(animal.produceId, sellCity, false) : 0;

        // Meat (Sell City)
        const meatPrice = animal.meatId ? getPrice(animal.meatId, sellCity) : 0;
        const meatVolume = animal.meatId ? getVolume(animal.meatId, sellCity, false) : 0;

        return {
          ...animal,
          babyPrice,
          babyVolume,
          adultPrice,
          adultVolume,
          foodPrice: fetchedFoodPrice,
          foodVolume: fetchedFoodVolume,
          favoriteFoodPrice,
          favoriteFoodVolume,
          productPrice,
          productVolume,
          meatPrice,
          meatVolume,
          // Store original prices for reset functionality
          originalBabyPrice: babyPrice,
          originalAdultPrice: adultPrice,
          originalFoodPrice: fetchedFoodPrice,
          originalFavoriteFoodPrice: favoriteFoodPrice,
          originalProductPrice: productPrice,
          originalMeatPrice: meatPrice,
          profit: 0,
          profitPerPlot: 0,
          roi: 0,
          totalProfit: 0,
          cost: 0
        };
      });

      const initialCalculated = updateCalculation(calculated);

      setData(initialCalculated);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (animals.length > 0) {
      loadData();
    }
  }, [region, buyCity, sellCity, animals]);

  // Re-sort when data or activeTab changes
  const sortedData = [...data]
    .filter(row => {
      if (activeTab === 'products') return !!row.produceId;
      if (activeTab === 'butchering') return !!row.meatId;
      return true;
    })
    .sort((a, b) => {
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

  const cityOptions = LOCATIONS.filter(l => l !== 'Black Market').map(city => ({
    value: city,
    label: city
  }));

  const allCityOptions = LOCATIONS.map(city => ({
    value: city,
    label: city
  }));

  const formatItemName = (id: string) => {
    // Try to get translated food name from Animal namespace
    try {
      return t(`foodNames.${id}`);
    } catch {
      // Fallback to simple formatting
      return id.replace(/^T\d+_/, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <PageShell
      title={t('title')}
      backgroundImage='/background/ao-crafting.jpg'
      description={t('description')}
      icon={<PawPrint className="h-6 w-6" />}
      headerActions={
        <div className="flex flex-wrap items-center gap-4">
          <ServerSelector selectedServer={region} onServerChange={setRegion} />
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-success hover:bg-success/90 text-success-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            { value: 'breeding', label: t('breeding') },
            { value: 'products', label: t('products') },
            { value: 'butchering', label: t('butchering') },
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as Tab)}
        />

        {/* Controls */}
        <div className="bg-card/50 p-6 rounded-xl border border-border space-y-6">

          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
              <Select
                label={activeTab === 'butchering' ? t('buyAdultFrom') : t('buyBabyFoodFrom')}
                options={cityOptions}
                value={buyCity}
                onChange={setBuyCity}
              />
            </div>

            <div className="hidden md:flex pt-6 text-muted-foreground">
              <ArrowRight className="h-5 w-5" />
            </div>

            <div className="flex-1 w-full">
              <Select
                label={activeTab === 'butchering' ? t('sellMeatTo') : (activeTab === 'products' ? t('sellProductsTo') : t('sellGrownTo'))}
                options={allCityOptions}
                value={sellCity}
                onChange={setSellCity}
              />
            </div>

            {/* Quantity Input */}
            <div className="w-full md:w-32">
              <div className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('quantity')}</div>
              <NumberInput
                value={quantity}
                onChange={setQuantity}
                min={1}
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Bottom Row: Toggles */}
          <div className="flex flex-wrap gap-8">
            <Checkbox
              label={t('premium')}
              description={activeTab === 'products' ? t('premiumDescProduct') : t('premiumDescGrowth')}
              checked={usePremium}
              onChange={(e) => setUsePremium(e.target.checked)}
            />

            {(activeTab === 'breeding' || activeTab === 'products') && (
              <Checkbox
                label={t('favoriteFood')}
                description={t('favoriteFoodDesc')}
                checked={useFavoriteFood}
                onChange={(e) => setUseFavoriteFood(e.target.checked)}
              />
            )}

            {activeTab === 'breeding' && (
              <Checkbox
                label={t('focus')}
                description={t('focusDesc')}
                checked={useFocus}
                onChange={(e) => setUseFocus(e.target.checked)}
              />
            )}
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium pl-8 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      {t('item')}
                      {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th className="p-4 font-medium text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('profit')}>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip content={t('profitUnitTooltip')}>
                        <span>{t('profitUnit')}</span>
                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                      </Tooltip>
                      {sortConfig.key === 'profit' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th className="p-4 font-medium text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('totalProfit')}>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip content={t('totalProfitTooltip')}>
                        <span>{t('totalProfit')}</span>
                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                      </Tooltip>
                      {sortConfig.key === 'totalProfit' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th className="p-4 font-medium text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('roi')}>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip content={t('roiTooltip')}>
                        <span>{t('roi')}</span>
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
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-success" />
                        <p>{t('fetchingData')}</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">{t('noDataCategory')}</td>
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
                              <img
                                src={`https://render.albiononline.com/v1/item/${activeTab === 'breeding' ? row.babyId : (activeTab === 'butchering' ? row.adultId : row.adultId)}`}
                                alt={row.name}
                                className="h-10 w-10 object-contain"
                              />
                              {activeTab === 'breeding' && (
                                <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-card rounded-full border border-border flex items-center justify-center ">
                                  <img
                                    src={`https://render.albiononline.com/v1/item/${row.adultId}`}
                                    alt="Adult"
                                    className="h-4 w-4 object-contain"
                                  />
                                </div>
                              )}
                              {activeTab === 'products' && row.produceId && (
                                <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-card rounded-full border border-border flex items-center justify-center ">
                                  <img
                                    src={`https://render.albiononline.com/v1/item/${row.produceId}`}
                                    alt="Product"
                                    className="h-4 w-4 object-contain"
                                  />
                                </div>
                              )}
                              {activeTab === 'butchering' && row.meatId && (
                                <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-card rounded-full border border-border flex items-center justify-center ">
                                  <img
                                    src={`https://render.albiononline.com/v1/item/${row.meatId}`}
                                    alt="Meat"
                                    className="h-4 w-4 object-contain"
                                  />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{row.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {activeTab === 'breeding' ? t('breeding') : activeTab === 'products' ? t('products') : t('butchering')} • T{row.tier}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`p-4 text-right font-medium ${row.profit > 0 ? 'text-success' : 'text-destructive'}`}>
                          {row.profit?.toLocaleString()}
                        </td>
                        <td className={`p-4 text-right font-medium ${row.totalProfit > 0 ? 'text-success' : 'text-destructive'}`}>
                          {row.totalProfit?.toLocaleString()}
                        </td>
                        <td className={`p-4 text-right ${row.roi > 0 ? 'text-success' : 'text-destructive'}`}>
                          {row.roi.toFixed(1)}%
                        </td>
                        <td className="p-4 text-center text-muted-foreground">
                          {expandedRow === row.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </td>
                      </tr>

                      {expandedRow === row.id && (
                        <tr className="bg-muted/30 border-b border-border">
                          <td colSpan={5} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                              {/* Input Column */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                  <CircleDollarSign className="h-4 w-4" /> {t('costsInputs')}
                                </h4>
                                <div className="bg-card/50 rounded-lg p-4 border border-border space-y-3">

                                  {/* Baby Price */}
                                  {activeTab === 'breeding' && (
                                    <div className="flex items-start gap-3">
                                      <img src={`https://render.albiononline.com/v1/item/${row.babyId}`} className="h-10 w-10 object-contain bg-muted rounded-md p-1 mt-5 border border-border" />
                                      <div className="w-full">
                                        <NumberInput
                                          label={t('babyPrice')}
                                          value={row.babyPrice}
                                          onChange={(val) => handlePriceUpdate(row.id, 'babyPrice', val)}
                                          className="h-9 text-sm bg-background"
                                          isCustom={row.isCustomBabyPrice}
                                          onReset={() => handleResetPrice(row.id, 'babyPrice')}
                                        />
                                        <div className="flex justify-end mt-1">
                                          <span className="text-xs text-muted-foreground">{t('vol24h', { val: row.babyVolume?.toLocaleString() })}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Adult Price (Butchering Input) */}
                                  {activeTab === 'butchering' && (
                                    <div className="flex items-start gap-3">
                                      <img src={`https://render.albiononline.com/v1/item/${row.adultId}`} className="h-10 w-10 object-contain bg-muted rounded-md p-1 mt-5 border border-border" />
                                      <div className="w-full">
                                        <NumberInput
                                          label={t('adultPrice')}
                                          value={row.adultPrice}
                                          onChange={(val) => handlePriceUpdate(row.id, 'adultPrice', val)}
                                          className="h-9 text-sm bg-background"
                                          isCustom={row.isCustomAdultPrice}
                                          onReset={() => handleResetPrice(row.id, 'adultPrice')}
                                        />
                                        <div className="flex justify-end mt-1">
                                          <span className="text-xs text-muted-foreground">{t('vol24h', { val: row.adultVolume?.toLocaleString() })}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Food Cost */}
                                  {(activeTab === 'breeding' || activeTab === 'products') && (
                                    <div className="flex items-start gap-3">
                                      <div className="h-10 w-10 bg-muted rounded-md p-1 mt-5 border border-border flex items-center justify-center flex-shrink-0">
                                        <ItemIcon 
                                          itemId={useFavoriteFood && row.favoriteFoodId ? row.favoriteFoodId : 'T1_CARROT'}
                                          className="h-full w-full object-contain"
                                        />
                                      </div>
                                      <div className="w-full">
                                        <NumberInput
                                          label={useFavoriteFood
                                            ? t('favFoodLabel', { name: row.favoriteFoodId ? formatItemName(row.favoriteFoodId) : t('none') })
                                            : t('genericFood')}
                                          value={useFavoriteFood ? row.favoriteFoodPrice : row.foodPrice}
                                          onChange={(val) => handlePriceUpdate(row.id, useFavoriteFood ? 'favoriteFoodPrice' : 'foodPrice', val)}
                                          className="h-9 text-sm bg-background"
                                          isCustom={useFavoriteFood ? row.isCustomFavoriteFoodPrice : row.isCustomFoodPrice}
                                          onReset={() => handleResetPrice(row.id, useFavoriteFood ? 'favoriteFoodPrice' : 'foodPrice')}
                                        />
                                        <div className="flex flex-col items-end mt-1 gap-1">
                                          <span className="text-xs text-muted-foreground">
                                            {t('vol24h', { val: useFavoriteFood ? row.favoriteFoodVolume?.toLocaleString() : row.foodVolume?.toLocaleString() })}
                                          </span>
                                          <div className="text-xs text-muted-foreground text-right">
                                            {activeTab === 'breeding' ? (
                                              <>
                                                <div>{t('cycleUnits', { val: useFavoriteFood ? row.foodConsumption / 2 : row.foodConsumption })}</div>
                                                <div>{t('totalUnits', { val: (useFavoriteFood ? row.foodConsumption / 2 : row.foodConsumption) * Math.max(1, Math.round(row.growthTime / 22)) })}</div>
                                              </>
                                            ) : (
                                              <>{t('cycleUnits', { val: useFavoriteFood ? row.foodConsumption / 2 : row.foodConsumption })}</>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Output Column */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                  <Leaf className="h-4 w-4" /> {t('outputRevenue')}
                                </h4>
                                <div className="bg-card/50 rounded-lg p-4 border border-border space-y-3">

                                  {/* Adult Price (Breeding Output) */}
                                  {activeTab === 'breeding' && (
                                    <div className="flex items-start gap-3">
                                      <img src={`https://render.albiononline.com/v1/item/${row.adultId}`} className="h-10 w-10 object-contain bg-muted rounded-md p-1 mt-5 border border-border" />
                                      <div className="w-full">
                                        <NumberInput
                                          label={t('grownAnimal')}
                                          value={row.adultPrice}
                                          onChange={(val) => handlePriceUpdate(row.id, 'adultPrice', val)}
                                          className="h-9 text-sm bg-background"
                                          isCustom={row.isCustomAdultPrice}
                                          onReset={() => handleResetPrice(row.id, 'adultPrice')}
                                        />
                                        <div className="flex justify-end mt-1">
                                          <span className="text-xs text-muted-foreground">{t('vol24h', { val: row.adultVolume?.toLocaleString() })}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Product Output */}
                                  {activeTab === 'products' && row.produceId && (
                                    <div className="flex items-start gap-3">
                                      <img src={`https://render.albiononline.com/v1/item/${row.produceId}`} className="h-10 w-10 object-contain bg-muted rounded-md p-1 mt-5 border border-border" />
                                      <div className="w-full">
                                        <NumberInput
                                          label={t('productPlaceholder')}
                                          tooltip={t('tooltips.productPrice', { city: sellCity })}
                                          value={row.productPrice}
                                          onChange={(val) => handlePriceUpdate(row.id, 'productPrice', val)}
                                          className="h-9 text-sm bg-background"
                                          isCustom={row.isCustomProductPrice}
                                          onReset={() => handleResetPrice(row.id, 'productPrice')}
                                        />
                                        <div className="flex flex-col items-end mt-1 gap-1">
                                          <span className="text-xs text-muted-foreground">{t('vol24h', { val: row.productVolume?.toLocaleString() })}</span>
                                          <div className="text-xs text-muted-foreground text-right">
                                            {t('yieldLabel', { val: ((row.produceYield || 0) * (usePremium ? 1 : 0.5)).toFixed(1) })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Meat Output */}
                                  {activeTab === 'butchering' && row.meatId && (
                                    <div className="flex items-start gap-3">
                                      <img src={`https://render.albiononline.com/v1/item/${row.meatId}`} className="h-10 w-10 object-contain bg-muted rounded-md p-1 mt-5 border border-border" />
                                      <div className="w-full">
                                        <NumberInput
                                          label={t('meatPrice')}
                                          value={row.meatPrice}
                                          onChange={(val) => handlePriceUpdate(row.id, 'meatPrice', val)}
                                          className="h-9 text-sm bg-background"
                                          isCustom={row.isCustomMeatPrice}
                                          onReset={() => handleResetPrice(row.id, 'meatPrice')}
                                        />
                                        <div className="flex flex-col items-end mt-1 gap-1">
                                          <span className="text-xs text-muted-foreground">{t('vol24h', { val: row.meatVolume?.toLocaleString() ?? '0' })}</span>
                                          <div className="text-xs text-muted-foreground text-right">
                                            {t('yieldLabel', { val: row.meatYield ?? 0 })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Stats Column */}
                              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <Info className="h-4 w-4" /> {t('statistics')}
                                </h4>

                                <div className="space-y-3 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('estCost')}</span>
                                    <span className="text-foreground">{row.cost?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('growth')}</span>
                                    <span className="text-foreground">{t('growthValue', { hours: row.growthTime, cycles: Math.max(1, Math.round(row.growthTime / 22)) })}</span>
                                  </div>

                                  {activeTab === 'breeding' && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('offspringChance')}</span>
                                        <span className="text-foreground">{useFocus ? row.offspringRateFocus : row.offspringRate}%</span>
                                      </div>
                                    </>
                                  )}

                                  <div className="h-px bg-border my-2" />

                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('totalProfit')}</span>
                                    <span className={`font-medium ${row.totalProfit > 0 ? 'text-success' : 'text-destructive'}`}>
                                      {row.totalProfit?.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('profitPlot')}</span>
                                    <span className={`font-medium ${row.profitPerPlot > 0 ? 'text-success' : 'text-destructive'}`}>
                                      {row.profitPerPlot?.toLocaleString()}
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
      <InfoStrip currentPage="profits-animal" />
    </PageShell>
  );
}
