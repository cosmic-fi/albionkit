'use client';

import { useState, useEffect, Fragment, Suspense } from 'react';
import { RefreshCw, TrendingUp, ArrowRight, Info, ChevronDown, ChevronUp, Star, Plus, Trash2, Filter, Tag, Search as SearchIcon, Layers, DollarSign, Percent, Sparkles, CircleHelp, Lock, Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { FeatureLock } from '@/components/subscription/FeatureLock';
import { getUserPreferences, saveUserPreferences } from '@/lib/user-preferences';
import { getMarketData, triggerWatchlistAlerts, searchAlbionItems } from './actions';
import MarketHistoryChart from './MarketHistoryChart';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';

import { ITEM_CATEGORIES, CATEGORY_LABEL_IDS } from './item-categories';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ServerSelector, ServerRegion } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { Checkbox } from '@/components/ui/Checkbox';
import { NumberInput } from '@/components/ui/NumberInput';
import { PageShell } from '@/components/PageShell';
import { Tooltip } from '@/components/ui/Tooltip';
import { ItemIcon } from '@/components/ItemIcon';

function MarketFlipperContent() {
  const t = useTranslations('MarketFlipper');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [flips, setFlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Helper to get friendly Tier label
  const getTierLabel = (itemId: string) => {
    const match = itemId.match(/^T(\d+)/);
    if (match) return t('tierN', { n: match[1] });
    return '';
  };
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const { server: region, setServer: setRegion } = useServer();

  const [customItems, setCustomItems] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [travelCost, setTravelCost] = useState(0);
  const [isPremiumTax, setIsPremiumTax] = useState(true);
  const [watchlistSummary, setWatchlistSummary] = useState({ count: 0, profitable: 0, topPick: null as any | null });

  // Compute profit and ROI for all flips
  const computedFlips = flips.map(flip => {
    const taxRate = isPremiumTax ? 0.04 : 0.08;
    const setupFee = 0.025;
    const totalTax = flip.sellPrice * (taxRate + setupFee);
    const netProfit = (flip.sellPrice - flip.buyPrice) - totalTax - travelCost;
    const roi = flip.buyPrice > 0 ? (netProfit / flip.buyPrice) * 100 : 0;

    return {
      ...flip,
      netProfit,
      roi
    };
  });

  useEffect(() => {
    if (watchlist.length > 0 && computedFlips.length > 0) {
      const watchedFlips = computedFlips.filter(f => watchlist.includes(`${f.itemId}-${f.buyCity}`));
      const profitable = watchedFlips.filter(f => f.netProfit > 5000 && f.roi > 10).length;
      const topPick = watchedFlips.sort((a, b) => b.roi - a.roi)[0] || null;
      setWatchlistSummary({ count: watchlist.length, profitable, topPick });
    } else {
      setWatchlistSummary({ count: watchlist.length, profitable: 0, topPick: null });
    }
  }, [watchlist, flips, isPremiumTax, travelCost]); // Recalculate if tax or travel cost changes

  // Filters
  const [minProfit, setMinProfit] = useState(2500);
  const [minMargin, setMinMargin] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedEnchantment, setSelectedEnchantment] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('Popular');
  const [uniqueItemMode, setUniqueItemMode] = useState(false);
  const [searchSelectValue, setSearchSelectValue] = useState<string | ''>('');
  const [searchOptions, setSearchOptions] = useState<{ value: string; label: string; icon?: React.ReactNode }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Premium Access
  const { hasAccess } = usePremiumAccess();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'profit', direction: 'desc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    localStorage.setItem('albion_premium', String(isPremiumTax));
    localStorage.setItem('albion_travel_cost', String(travelCost));
  }, [isPremiumTax, travelCost]);

  // Load persisted data
  useEffect(() => {
    const loadPreferences = async () => {
      // Always check localStorage first for immediate feedback/offline support
      const savedWatchlist = localStorage.getItem('albion_watchlist');
      const savedCustomItems = localStorage.getItem('albion_custom_items');

      const savedPremium = localStorage.getItem('albion_premium');
      if (savedPremium) setIsPremiumTax(savedPremium === 'true');

      const savedTravel = localStorage.getItem('albion_travel_cost');
      if (savedTravel) setTravelCost(Number(savedTravel));

      let initialWatchlist = savedWatchlist ? JSON.parse(savedWatchlist) : [];
      let initialCustomItems = savedCustomItems ? JSON.parse(savedCustomItems) : [];

      if (user) {
        // If logged in, fetch from Firestore
        try {
          const prefs = await getUserPreferences(user.uid);
          if (prefs) {
            // Use DB data if available
            if (prefs.watchlist) initialWatchlist = prefs.watchlist;
            if (prefs.customItems) initialCustomItems = prefs.customItems;
            if (prefs.premium !== undefined) setIsPremiumTax(prefs.premium);
            if (prefs.travelCost !== undefined) setTravelCost(prefs.travelCost);
          }
        } catch (err) {
          console.error("Failed to load prefs", err);
        }
      }
      
      // Handle URL param item injection
      const itemParam = searchParams.get('item');
      if (itemParam) {
        // If item param exists, add to custom items if not present
        if (!initialCustomItems.includes(itemParam)) {
          initialCustomItems = [itemParam, ...initialCustomItems];
        }
        // Force unique item mode to focus on this item
        setUniqueItemMode(true);
        // Clean URL without reloading
        router.replace('/tools/market-flipper');
      }

      setWatchlist(initialWatchlist);
      setCustomItems(initialCustomItems);
      setPreferencesLoaded(true);
    };

    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Save persisted data
  useEffect(() => {
    if (!preferencesLoaded) return;

    localStorage.setItem('albion_watchlist', JSON.stringify(watchlist));
    if (user) {
      console.log('Attempting to save watchlist for user:', user.uid);
      setSyncStatus('saving');
      saveUserPreferences(user.uid, { watchlist })
        .then(() => setSyncStatus('saved'))
        .catch((err) => {
          console.error('Watchlist save failed:', err);
          setSyncStatus('error');
        });
    }
  }, [watchlist, user, preferencesLoaded]);

  useEffect(() => {
    if (!preferencesLoaded) return;

    localStorage.setItem('albion_custom_items', JSON.stringify(customItems));
    if (user) {
      console.log('Attempting to save custom items for user:', user.uid);
      setSyncStatus('saving');
      saveUserPreferences(user.uid, { customItems })
        .then(() => setSyncStatus('saved'))
        .catch((err) => {
          console.error('Custom items save failed:', err);
          setSyncStatus('error');
        });
    }
  }, [customItems, user, preferencesLoaded]);

  // Reset sync status after a delay
  useEffect(() => {
    if (syncStatus === 'saved' || syncStatus === 'error') {
      const timer = setTimeout(() => setSyncStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  const loadData = async () => {
    setLoading(true);
    // Get items for the selected category
    const baseCategoryItems = ITEM_CATEGORIES[selectedCategory as keyof typeof ITEM_CATEGORIES] || [];

    // Apply Enchantment suffix if needed
    const categoryItems = selectedEnchantment === 0
      ? baseCategoryItems
      : baseCategoryItems.map((id: string) => `${id}@${selectedEnchantment}`);

    const { flips, error } = await getMarketData(region, customItems, categoryItems);
    if (flips) {
      setFlips(flips);
      setLastUpdated(new Date());

      // Watchlist Alerts Check: If user has watchlist items, check if any are currently profitable
      // and trigger a notification if they haven't been notified recently.
      if (user && watchlist.length > 0) {
        const lastAlertTime = localStorage.getItem('last_watchlist_alert');
        const now = Date.now();
        
        // Only trigger alert check once every 4 hours to avoid spamming
        if (!lastAlertTime || now - Number(lastAlertTime) > 4 * 60 * 60 * 1000) {
          triggerWatchlistAlerts(user.uid, region, watchlist).then(result => {
            if (result && 'success' in result && result.success) {
              localStorage.setItem('last_watchlist_alert', String(now));
            }
          });
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [region, customItems, selectedCategory, selectedEnchantment]); // Reload when category changes

  const toggleWatchlist = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (watchlist.includes(itemId)) {
      setWatchlist(watchlist.filter(id => id !== itemId));
    } else {
      // LIMIT CHECK: Free users capped at 5 items
      if (!hasAccess && watchlist.length >= 5) {
          toast.error("Free Plan Limit Reached", {
              description: "Upgrade to Adept or Guild Master for unlimited watchlist items.",
              action: {
                  label: "Upgrade",
                  onClick: () => setShowSubscriptionModal(true)
              }
          });
          return;
      }
      setWatchlist([...watchlist, itemId]);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, minProfit, minMargin, region, selectedTier, sortConfig, showWatchlistOnly, selectedCategory, uniqueItemMode]);

  const filteredFlips = computedFlips.filter(flip => {
    const isCustom = customItems.includes(flip.itemId);
    const matchesSearch = flip.itemId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProfit = isCustom || flip.netProfit >= minProfit;
    const matchesMargin = isCustom || flip.roi >= minMargin;
    const matchesTier = selectedTier === 'All' || flip.itemId.startsWith(selectedTier);
    const matchesWatchlist = !showWatchlistOnly || watchlist.includes(`${flip.itemId}-${flip.buyCity}`);
    return matchesSearch && matchesProfit && matchesMargin && matchesTier && matchesWatchlist;
  }).sort((a, b) => {
    if (sortConfig.key === 'profit') {
      return sortConfig.direction === 'asc' ? a.netProfit - b.netProfit : b.netProfit - a.netProfit;
    }
    if (sortConfig.key === 'margin') {
      return sortConfig.direction === 'asc' ? a.roi - b.roi : b.roi - a.roi;
    }
    if (sortConfig.key === 'volume') {
      return sortConfig.direction === 'asc' ? (a.dailyVolume || 0) - (b.dailyVolume || 0) : (b.dailyVolume || 0) - (a.dailyVolume || 0);
    }
    if (sortConfig.key === 'buyPrice') {
      return sortConfig.direction === 'asc' ? a.buyPrice - b.buyPrice : b.buyPrice - a.buyPrice;
    }
    if (sortConfig.key === 'sellPrice') {
      return sortConfig.direction === 'asc' ? a.sellPrice - b.sellPrice : b.sellPrice - a.sellPrice;
    }
    return 0;
  });

  // Correct Unique Logic
  let finalFlips = filteredFlips;
  if (uniqueItemMode) {
    const seen = new Set();
    finalFlips = filteredFlips.filter(item => {
      if (seen.has(item.itemId)) return false;
      seen.add(item.itemId);
      return true;
    });
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortConfig.key !== colKey) return <div className="w-4" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Pagination logic
  const totalPages = Math.ceil(finalFlips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = finalFlips.slice(startIndex, startIndex + itemsPerPage);

  return (
    <PageShell
      title={t('title')}
      backgroundImage='/background/ao-market.jpg'
      description={t('description')}
      icon={<TrendingUp className="h-6 w-6" />}
      headerActions={
        <div className="flex flex-wrap items-center gap-4">
          <ServerSelector
            selectedServer={region}
            onServerChange={setRegion}
          />

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >

      {/* Watchlist Quick Access */}
      {watchlist.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div 
            onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
            className={`cursor-pointer group relative overflow-hidden bg-card border rounded-2xl p-4 transition-all hover: ${showWatchlistOnly ? 'border-primary ring-1 ring-primary/50 ' : 'border-border'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl ${showWatchlistOnly ? 'bg-primary text-primary-foreground' : 'bg-secondary text-amber-500'}`}>
                <Star className={`h-5 w-5 ${showWatchlistOnly ? 'fill-current' : ''}`} />
              </div>
              {watchlistSummary.profitable > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success px-2 py-0.5 rounded-full border border-success/20 animate-pulse">
                  {watchlistSummary.profitable} {t('hot')}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-foreground">{t('myWatchlist')}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t('watchlistInfo', { count: watchlist.length, filterStatus: showWatchlistOnly ? t('filterActive') : t('clickToFilter') })}
            </p>
            {showWatchlistOnly && (
              <div className="absolute top-2 right-2">
                <div className="h-2 w-2 bg-primary rounded-full animate-ping" />
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
              <TrendingUp className="h-3 w-3 text-success" /> {t('bestROI')}
            </div>
            {watchlistSummary.topPick ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <ItemIcon itemId={watchlistSummary.topPick.itemId} className="w-8 h-8 rounded-lg bg-secondary shrink-0" />
                  <div className="truncate">
                    <div className="text-sm font-bold text-foreground truncate">{watchlistSummary.topPick.name}</div>
                    <div className="text-[10px] text-muted-foreground">{watchlistSummary.topPick.buyCity} → BM</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-success">+{watchlistSummary.topPick.roi.toFixed(1)}%</div>
                  <div className="text-[10px] text-muted-foreground">{t('roi')}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium text-muted-foreground italic">{t('noData')}</div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
              <DollarSign className="h-3 w-3 text-primary" /> {t('totalPotentialProfit')}
            </div>
            {(() => {
              const totalProfit = flips
                .filter(f => watchlist.includes(`${f.itemId}-${f.buyCity}`) && f.netProfit > 0)
                .reduce((sum, f) => sum + f.netProfit, 0);
              
              return (
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-black text-foreground">{Math.round(totalProfit).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground font-bold italic">{t('silver')}</div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {/* Universal Search - Full width on mobile, 1 col on desktop */}
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs text-muted-foreground block mb-2 font-medium flex items-center gap-1 uppercase tracking-wider">
                  <SearchIcon className="h-3 w-3" /> {t('search')}
                </label>
                <Select
                  value={searchSelectValue}
                  onChange={(value) => {
                    const id = value;
                    setSearchSelectValue('');
                    if (!customItems.includes(id)) {
                      setCustomItems([...customItems, id]);
                    }
                  }}
                  options={searchOptions}
                  searchable={true}
                  placeholder={searchLoading ? t('searching') : t('searchPlaceholder')}
                  onSearchTermChange={async (term) => {
                    if (term.length < 2) {
                      setSearchOptions([]);
                      return;
                    }
                    setSearchLoading(true);
                    try {
                      const items: any[] = await searchAlbionItems(term);
                      setSearchOptions(items.map((it: any) => ({
                        value: it.id,
                        label: it.name,
                        icon: <ItemIcon itemId={it.id} className="w-5 h-5 object-contain rounded-sm" />
                      })));
                    } catch (err) {
                      setSearchOptions([]);
                    } finally {
                      setSearchLoading(false);
                    }
                  }}
                />
              </div>

              <Select
                className="col-span-2 md:col-span-1"
                label={
                  <>
                    <Tag className="h-3 w-3" /> {t('category')}
                    <Tooltip content={t('tooltips.category')}>
                      <CircleHelp className="h-3 w-3 text-muted-foreground" />
                    </Tooltip>
                  </>
                }
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value)}
                options={Object.keys(ITEM_CATEGORIES).map(cat => ({
                  label: t(`categoryLabels.${CATEGORY_LABEL_IDS[cat] as any}`),
                  value: cat
                }))}
              />

              <Select
                className="col-span-1"
                label={
                  <>
                    <Layers className="h-3 w-3" /> {t('tier')}
                    <Tooltip content={t('tooltips.tier')}>
                      <CircleHelp className="h-3 w-3 text-muted-foreground" />
                    </Tooltip>
                  </>
                }
                value={selectedTier}
                onChange={(value) => setSelectedTier(value)}
                options={[
                  { label: t('allTiers'), value: 'All' },
                  { label: t('tierN', { n: 4 }), value: 'T4' },
                  { label: t('tierN', { n: 5 }), value: 'T5' },
                  { label: t('tierN', { n: 6 }), value: 'T6' },
                  { label: t('tierN', { n: 7 }), value: 'T7' },
                  { label: t('tierN', { n: 8 }), value: 'T8' },
                ]}
              />

              <Select
                className="col-span-1"
                label={
                  <>
                    <Sparkles className="h-3 w-3" /> {t('enchant')}
                    <Tooltip content={t('tooltips.enchant')}>
                      <CircleHelp className="h-3 w-3 text-muted-foreground" />
                    </Tooltip>
                  </>
                }
                value={selectedEnchantment}
                onChange={(value) => setSelectedEnchantment(Number(value))}
                options={[
                  { label: t('flat'), value: 0 },
                  { label: '.1', value: 1 },
                  { label: '.2', value: 2 },
                  { label: '.3', value: 3 },
                  { label: '.4', value: 4 },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
               <NumberInput
                  label={
                    <>
                      <DollarSign className="h-3 w-3" /> {t('minProfit')}
                      <Tooltip content={t('tooltips.minProfit')}>
                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                      </Tooltip>
                    </>
                  }
                  value={minProfit}
                  onChange={setMinProfit}
                  min={0}
                  step={1000}
               />
               <NumberInput
                  label={
                    <>
                      <Percent className="h-3 w-3" /> {t('minMargin')}
                      <Tooltip content={t('tooltips.minMargin')}>
                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                      </Tooltip>
                    </>
                  }
                  value={minMargin}
                  onChange={setMinMargin}
                  min={0}
                  max={100}
               />
               <NumberInput
                  label={
                    <>
                      <ArrowRight className="h-3 w-3" /> {t('estTravelCost')}
                      <Tooltip content={t('tooltips.travelCost')}>
                        <CircleHelp className="h-3 w-3 text-muted-foreground" />
                      </Tooltip>
                    </>
                  }
                  value={travelCost}
                  onChange={(val) => setTravelCost(Math.max(0, val))}
                  min={0}
               />
               
               <div className="flex flex-col gap-2 pt-1">
                  <Checkbox
                    label={t('premiumTax')}
                    checked={isPremiumTax}
                    onChange={(e) => setIsPremiumTax(e.target.checked)}
                  />
                  <Checkbox
                    label={
                      <div className="flex items-center gap-1">
                        {t('uniqueOnly')}
                        {!hasAccess && <Lock className="h-3 w-3 text-amber-500" />}
                      </div>
                    }
                    checked={uniqueItemMode}
                    onChange={(e) => {
                      if (!hasAccess && e.target.checked) {
                        setShowSubscriptionModal(true);
                      } else {
                        setUniqueItemMode(e.target.checked);
                      }
                    }}
                  />
                  <Checkbox
                    label={t('watchlistOnly')}
                    checked={showWatchlistOnly}
                    onChange={(e) => setShowWatchlistOnly(e.target.checked)}
                  />
               </div>
            </div>

            {customItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('customItems')}</span>
                  <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-info/10 text-info border border-info/20 rounded text-xs font-bold">
                        {t('itemsActive', { count: customItems.length })}
                      </span>
                      <button 
                        onClick={() => setCustomItems([])} 
                        className="flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded text-xs hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> {t('clearAll')}
                      </button>
                  </div>
                </div>
            )}
        </div>

        {/* Table / Mobile Cards */}
        {loading && flips.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-warning" />
            <p>{t('scanningMarkets')}</p>
          </div>
        ) : (
            <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-border">
                  {currentItems.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      {t('noResults')}
                    </div>
                  ) : (
                    currentItems.map((flip, index) => {
                      const uniqueId = `${flip.itemId}-${flip.buyCity}`;
                      const isExpanded = expandedItem === uniqueId;

                      return (
                         <div 
                           key={`mobile-${uniqueId}-${index}`} 
                           className={`p-4 transition-colors ${isExpanded ? 'bg-muted' : 'hover:bg-muted/50'} ${flip.noData ? 'opacity-70' : ''}`}
                           onClick={() => !flip.noData && setExpandedItem(isExpanded ? null : uniqueId)}
                         >
                            {/* Header: Icon + Name + Profit */}
                            <div className="flex items-center gap-3 mb-3">
                               <button
                                  onClick={(e) => toggleWatchlist(uniqueId, e)}
                                  className="text-muted-foreground hover:text-primary transition-colors -ml-1"
                               >
                                  <Star className={`h-5 w-5 ${watchlist.includes(uniqueId) ? 'fill-primary text-primary' : ''}`} />
                               </button>
                               <div className="h-12 w-12 bg-muted/50 rounded p-0.5 relative flex-shrink-0">
                                  <ItemIcon itemId={flip.itemId} className="w-full h-full object-contain" />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <div className="font-medium text-foreground truncate text-sm">
                                     {(flip.name && !flip.name.includes('_') && !flip.name.startsWith('T')) ? flip.name : formatItemName(flip.itemId)}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                     <span>{getTierLabel(flip.itemId)}</span>
                                     {flip.itemId.includes('@') && <span className="text-primary">.{flip.itemId.split('@')[1]}</span>}
                                  </div>
                               </div>
                               <div className="text-right">
                                  <div className={`font-mono font-bold ${flip.netProfit > 0 ? 'text-success' : 'text-destructive'}`}>
                                     {flip.netProfit > 1000 ? `${(flip.netProfit/1000).toFixed(1)}k` : flip.netProfit}
                                  </div>
                                  <div className={`text-xs ${flip.roi > 20 ? 'text-success' : 'text-muted-foreground'}`}>
                                     {flip.roi.toFixed(0)}% {t('roi')}
                                  </div>
                               </div>
                            </div>
                            
                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                               <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">{t('colBuyFrom')}</span>
                                  <span className="font-medium text-right">{flip.buyCity}</span>
                               </div>
                               <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">{t('colVol')}</span>
                                  <span className="font-medium text-right">{flip.dailyVolume > 0 ? flip.dailyVolume.toLocaleString() : '-'}</span>
                               </div>
                               <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">{t('colBuyPrice')}</span>
                                  <span className="font-medium text-right">{flip.buyPrice.toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">{t('colSellPrice')}</span>
                                  <span className="font-medium text-right">{flip.sellPrice.toLocaleString()}</span>
                               </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && !flip.noData && (
                                <div className="mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            {t('marketAnalysis')}
                                        </h4>
                                        <div className="flex gap-2">
                                            <button 
                                                className="px-4 py-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors active:scale-95"
                                                onClick={() => window.open(`https://albiononline2d.com/en/item/id/${flip.itemId}`, '_blank')}
                                            >
                                                {t('viewOn2D')}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="w-full mt-2">
                                        <Suspense fallback={<div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg border border-border"><Loader2 className="animate-spin text-muted-foreground" /></div>}>
                                            <FeatureLock
                                                title={t('marketHistoryLocked')}
                                                description={t('marketHistoryLockedDesc')}
                                                lockedContent={<div className="h-[240px] sm:h-[280px] md:h-[320px] flex items-center justify-center bg-muted/50 rounded-lg text-muted-foreground text-sm sm:text-base">{t('upgradeToView')}</div>}
                                            >
                                                <MarketHistoryChart itemId={flip.itemId} buyCity={flip.buyCity} region={region} />
                                            </FeatureLock>
                                        </Suspense>
                                    </div>
                                </div>
                            )}
                         </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                                <th className="p-4 font-medium pl-6 cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('item')}>
                                    <div className="flex items-center gap-1">
                                        {t('colItem')} <SortIcon colKey="item" />
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Tooltip content={t('tooltips.colItem')}>
                                                <CircleHelp className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground" />
                                            </Tooltip>
                                        </div>
                                    </div>
                                </th>
                                <th className="p-4 font-medium whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                        {t('colBuyFrom')}
                                        <Tooltip content={t('tooltips.colBuyFrom')}>
                                            <CircleHelp className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </Tooltip>
                                    </div>
                                </th>
                                <th className="p-4 font-medium text-right cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('volume')}>
                                    <div className="flex items-center justify-end gap-1">
                                        {t('colVol')} <SortIcon colKey="volume" />
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Tooltip content={t('tooltips.colVol')}>
                                                <CircleHelp className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </Tooltip>
                                        </div>
                                    </div>
                                </th>
                                <th className="p-4 font-medium text-right cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('buyPrice')}>
                                    <div className="flex items-center justify-end gap-1">
                                        {t('colBuyPrice')} <SortIcon colKey="buyPrice" />
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Tooltip content={t('tooltips.colBuyPrice')}>
                                                <CircleHelp className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </Tooltip>
                                        </div>
                                    </div>
                                </th>
                                <th className="p-4 font-medium text-right cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('sellPrice')}>
                                    <div className="flex items-center justify-end gap-1">
                                        {t('colSellPrice')} <SortIcon colKey="sellPrice" />
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Tooltip content={t('tooltips.colSellPrice')}>
                                                <CircleHelp className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </Tooltip>
                                        </div>
                                    </div>
                                </th>
                                <th className="p-4 font-medium text-right cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => handleSort('profit')}>
                                    <div className="flex items-center justify-end gap-1">
                                        {t('colNetProfit')} <SortIcon colKey="profit" />
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Tooltip content={t('tooltips.colNetProfit')}>
                                                <CircleHelp className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </Tooltip>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm">
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        {t('noResults')}
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((flip, index) => {
                                    const uniqueId = `${flip.itemId}-${flip.buyCity}`;
                                    const isExpanded = expandedItem === uniqueId;

                                    return (
                                        <Fragment key={`${uniqueId}-${index}`}>
                                            <tr 
                                                onClick={() => !flip.noData && setExpandedItem(isExpanded ? null : uniqueId)}
                                                className={`group cursor-pointer transition-colors border-b border-border ${
                                                    isExpanded ? 'bg-muted' : 'hover:bg-muted/50'
                                                } ${flip.noData ? 'opacity-70 cursor-default' : ''}`}
                                            >
                                               <td className="p-4 pl-6">
                                                  <div className="flex items-center gap-3">
                                                      <button
                                                        onClick={(e) => toggleWatchlist(uniqueId, e)}
                                                        className="text-muted-foreground hover:text-primary transition-colors"
                                                      >
                                                        <Star className={`h-4 w-4 ${watchlist.includes(uniqueId) ? 'fill-primary text-primary' : ''}`} />
                                                      </button>
                                                      <div className="h-10 w-10 bg-muted/50 rounded p-0.5 relative">
                                                        <ItemIcon itemId={flip.itemId} className="w-full h-full object-contain" />
                                                      </div>
                                                      <div>
                                                        <div className="font-medium text-foreground">
                                                            {(flip.name && !flip.name.includes('_') && !flip.name.startsWith('T')) ? flip.name : formatItemName(flip.itemId)}
                                                            {flip.itemId.includes('@') && <span className="text-primary ml-1">.{flip.itemId.split('@')[1]}</span>}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{getTierLabel(flip.itemId)}</div>
                                                      </div>
                                                  </div>
                                               </td>
                                               <td className="p-4">
                                                  <div className="font-medium text-foreground">{flip.buyCity}</div>
                                                  <div className="text-xs text-muted-foreground">{new Date(flip.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                               </td>
                                               <td className="p-4 text-right">
                                                   <div className="font-mono text-muted-foreground">{flip.dailyVolume > 0 ? flip.dailyVolume.toLocaleString() : '-'}</div>
                                               </td>
                                               <td className="p-4 text-right">
                                                   <div className="font-mono text-foreground">{flip.buyPrice.toLocaleString()}</div>
                                               </td>
                                               <td className="p-4 text-right">
                                                   <div className="font-mono text-foreground">{flip.sellPrice.toLocaleString()}</div>
                                                   <div className="text-xs text-muted-foreground">{t('blackMarket')}</div>
                                               </td>
                                               <td className="p-4 text-right">
                                                   <div className={`font-mono font-bold ${flip.netProfit > 0 ? 'text-success' : 'text-destructive'}`}>
                                                      {flip.netProfit.toLocaleString()}
                                                   </div>
                                                   <div className={`text-xs ${flip.roi > 20 ? 'text-success' : 'text-muted-foreground'}`}>
                                                      {flip.roi.toFixed(1)}% {t('roi')}
                                                   </div>
                                               </td>
                                            </tr>
                                            {isExpanded && !flip.noData && (
                                                <tr>
                                                    <td colSpan={6} className="p-0 bg-muted/30">
                                                        <div className="p-4 border-b border-border animate-in slide-in-from-top-2 duration-200">
                                                           <div className="grid md:grid-cols-2 gap-6">
                                                              <FeatureLock
                                                                  title={t('marketHistoryLocked')}
                                                                  description={t('marketHistoryLockedDesc')}
                                                                  lockedContent={<div className="h-[240px] sm:h-[280px] md:h-[320px] flex items-center justify-center bg-muted/50 rounded-lg text-muted-foreground text-sm sm:text-base">{t('upgradeToView')}</div>}
                                                              >
                                                                  <MarketHistoryChart
                                                                    itemId={flip.itemId}
                                                                    buyCity={flip.buyCity}
                                                                    region={region}
                                                                  />
                                                              </FeatureLock>
                                                                <div className="space-y-4">
                                                                   <div>
                                                                        <h4 className="text-sm font-medium text-foreground mb-2">{t('profitBreakdown')}</h4>
                                                                        <div className="bg-muted p-4 rounded-lg border border-border space-y-2 text-sm">
                                                                           {((isPremiumTax) => {
                                                                                const taxRate = isPremiumTax ? 0.04 : 0.08;
                                                                                const setupFee = 0.025;
                                                                                const grossProfit = flip.sellPrice - flip.buyPrice;
                                                                                const totalTax = Math.round(flip.sellPrice * (taxRate + setupFee));

                                                                                return (
                                                                                  <>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-muted-foreground">{t('buyPriceAt', { city: flip.buyCity })}</span>
                                                                                        <span className="font-mono text-foreground">{flip.buyPrice.toLocaleString()}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-muted-foreground">{t('sellPriceAt', { city: t('blackMarket') })}</span>
                                                                                        <span className="font-mono text-foreground">{flip.sellPrice.toLocaleString()}</span>
                                                                                    </div>
                                                                                    <div className="border-t border-border my-2"></div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-muted-foreground">{t('grossProfit')}</span>
                                                                                        <span className="font-mono text-success/70">+{grossProfit.toLocaleString()}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between text-xs">
                                                                                        <span className="text-muted-foreground">{t('marketTaxes', { rate: Math.round((taxRate + setupFee) * 1000) / 10 })}</span>
                                                                                        <span className="font-mono text-destructive/70">-{totalTax.toLocaleString()}</span>
                                                                                    </div>                                                                                    <div className="flex justify-between text-xs">
                                                                                        <span className="text-muted-foreground">{t('estTravelCost')}</span>
                                                                                        <span className="font-mono text-destructive/70">-{Math.round(travelCost).toLocaleString()}</span>
                                                                                    </div>
                                                                                    <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                                                                                        <span className="text-foreground">{t('colNetProfit')}</span>
                                                                                        <span className={`font-mono ${flip.netProfit > 0 ? 'text-success' : 'text-destructive'}`}>
                                                                                            {flip.netProfit > 0 ? '+' : ''}{flip.netProfit.toLocaleString()}
                                                                                        </span>
                                                                                    </div>
                                                                                  </>
                                                                                );
                                                                           })(isPremiumTax)}
                                                                        </div>
                                                                   </div>
                                                                   
                                                                   <div className="text-xs text-muted-foreground">
                                                                      <p className="mb-1">{t('lastUpdated', { time: new Date(flip.updatedAt).toLocaleString() })}</p>
                                                                      <p>{t('verifyDisclaimer')}</p>
                                                                   </div>
                                                                </div>
                                                           </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            
            {/* Pagination Controls */}
            {filteredFlips.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-border bg-muted/30 gap-4">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  {t('showingResults', { start: startIndex + 1, end: Math.min(startIndex + itemsPerPage, filteredFlips.length), total: filteredFlips.length })}
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-secondary-foreground"
                  >
                    {t('previous')}
                  </button>
                  <div className="flex items-center px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground">
                    {t('pageOf', { current: currentPage, total: totalPages })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-secondary-foreground"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            )}
            </div>
        )}
      </div>
      
      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}   
      />

      <InfoStrip currentPage="market-flipper">
        <InfoBanner icon={<TrendingUp className="w-4 h-4" />} color="text-green-400" title={t('communityMarketData')}>
          <p>{t('marketDataAggregated')}</p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="bg-background/40 p-2 rounded">
              <span className="font-semibold block mb-0.5">{t('pricesMayVary')}</span>
              {t('pricesMayVaryDesc')}
            </div>
            <div className="bg-background/40 p-2 rounded">
               <span className="font-semibold block mb-0.5">{t('contribute')}</span>
               {t('contributeDesc')}
            </div>
          </div>
        </InfoBanner>
      </InfoStrip>
    </PageShell>
  );
}

export default function MarketFlipperClient() {
  const t = useTranslations('MarketFlipper');
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">{t('loadingMarketData')}</p>
      </div>
    </div>}>
      <MarketFlipperContent />
    </Suspense>
  );
}
