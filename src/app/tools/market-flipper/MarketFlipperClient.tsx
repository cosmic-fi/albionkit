'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Star, DollarSign, Search, Filter, ChevronDown, ChevronUp, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Preloader } from '@/components/Preloader';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { getUserPreferences, saveUserPreferences } from '@/lib/user-preferences';
import { getMarketData, searchAlbionItems } from './actions';
import MarketHistoryChart from './MarketHistoryChart';
import { InfoStrip } from '@/components/InfoStrip';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tooltip } from '@/components/ui/Tooltip';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { NumberInput } from '@/components/ui/NumberInput';
import { PageShell } from '@/components/PageShell';
import { ItemIcon } from '@/components/ItemIcon';
import { Button } from '@/components/ui/Button';
import { ITEM_CATEGORIES, CATEGORY_LABEL_IDS } from './item-categories';

interface Flip {
  itemId: string;
  name: string;
  buyCity: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  margin: number;
  volume: number;
  netProfit: number;
  roi: number;
}

export default function MarketFlipperClient() {
  const t = useTranslations('MarketFlipper');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { server: region, setServer: setRegion } = useServer();

  const [flips, setFlips] = useState<Flip[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [minProfit, setMinProfit] = useState(2500);
  const [minMargin, setMinMargin] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState('Popular');
  const [selectedTier, setSelectedTier] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Settings
  const [travelCost, setTravelCost] = useState(0);
  const [isPremiumTax, setIsPremiumTax] = useState(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [customItems, setCustomItems] = useState<string[]>([]);

  // Computed flips with tax/profit calculations
  const computedFlips = Array.isArray(flips) ? flips.map(flip => {
    const taxRate = isPremiumTax ? 0.04 : 0.08;
    const setupFee = 0.025;
    const totalTax = flip.sellPrice * (taxRate + setupFee);
    const netProfit = (flip.sellPrice - flip.buyPrice) - totalTax - travelCost;
    const roi = flip.buyPrice > 0 ? (netProfit / flip.buyPrice) * 100 : 0;
    return { ...flip, netProfit, roi };
  }) : [];

  // Filtered flips
  const filteredFlips = computedFlips.filter(flip => {
    if (showWatchlistOnly && !watchlist.includes(`${flip.itemId}-${flip.buyCity}`)) return false;
    if (flip.netProfit < minProfit) return false;
    if (flip.margin < minMargin) return false;
    if (searchTerm && !flip.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredFlips.length, minProfit, minMargin, selectedCategory, selectedTier, searchTerm, showWatchlistOnly]);

  const totalPages = Math.ceil(filteredFlips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFlips = filteredFlips.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Watchlist summary - calculated directly to avoid infinite loop
  const watchlistSummary = (() => {
    if (watchlist.length === 0 || computedFlips.length === 0) {
      return { count: watchlist.length, profitable: 0, topPick: null as any | null };
    }
    const watchedFlips = computedFlips.filter(f => watchlist.includes(`${f.itemId}-${f.buyCity}`));
    const profitable = watchedFlips.filter(f => f.netProfit > 5000 && f.roi > 10).length;
    const topPick = watchedFlips.length > 0 ? watchedFlips.sort((a, b) => b.roi - a.roi)[0] : null;
    return { count: watchlist.length, profitable, topPick };
  })();

  // Load data
  const loadData = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const baseCategoryItems = ITEM_CATEGORIES[selectedCategory as keyof typeof ITEM_CATEGORIES] || [];
      const itemsToFetch = [...new Set([...baseCategoryItems, ...customItems])];

      if (itemsToFetch.length === 0) {
        setFlips([]);
        setLoading(false);
        setLastUpdated(new Date());
        return;
      }

      const data = await getMarketData(region, [], itemsToFetch, selectedTier === 'All' ? null : selectedTier);

      console.log('[MarketFlipperClient] getMarketData returned:', data);

      // Ensure data is an array
      const flipsData = Array.isArray(data) ? data : [];
      console.log('[MarketFlipperClient] Setting flips to:', flipsData);
      setFlips(flipsData as Flip[]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load market data:', err);
      setFetchError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [region, selectedCategory, selectedTier, customItems]);

  const toggleWatchlist = (itemId: string, buyCity: string) => {
    const key = `${itemId}-${buyCity}`;
    setWatchlist(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const formatItemName = (itemId: string) => {
    let name = itemId.replace(/^T\d+_/, '');
    name = name.split('@')[0];
    name = name.replace(/_/g, ' ');
    return name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const getTierLabel = (itemId: string) => {
    const match = itemId.match(/^T(\d+)/);
    if (match) return `T${match[1]}`;
    return '';
  };

  // Calculate stats for display
  const totalFlips = filteredFlips.length;
  const avgProfit = filteredFlips.length > 0 ? Math.round(filteredFlips.reduce((sum, f) => sum + f.netProfit, 0) / filteredFlips.length) : 0;
  const bestRoi = filteredFlips.length > 0 ? filteredFlips.reduce((max, f) => f.roi > max.roi ? f : max, filteredFlips[0]) : null;

  const pageStats = [
    {
      label: t('totalFlips'),
      value: loading ? '...' : totalFlips.toString(),
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      trend: loading ? undefined : 'up' as const
    },
    {
      label: t('avgProfit'),
      value: loading ? '...' : avgProfit.toLocaleString(),
      icon: <DollarSign className="h-5 w-5 text-success" />
    },
    {
      label: t('bestROI'),
      value: loading ? '...' : bestRoi ? `+${bestRoi.roi.toFixed(1)}%` : 'N/A',
      icon: <Sparkles className="h-5 w-5 text-info" />
    },
    {
      label: t('marketStatus'),
      value: loading ? '...' : t('active'),
      icon: <AlertCircle className="h-5 w-5 text-warning" />
    }
  ];

  return (
    <PageShell
      title={t('title')}
      backgroundImage="/background/ao-market.jpg"
      description={t('description')}
      stats={pageStats}
      headerActions={
        <div className="w-full md:w-fit flex items-center justify-between gap-3 md:justify-start">
          <ServerSelector
            selectedServer={region}
            onServerChange={setRegion}
          />
          <Button
            variant="default"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{loading ? tCommon('loading') : tCommon('refresh')}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* Watchlist Summary */}
        {watchlist.length > 0 && (
          <WatchlistSummary 
            summary={watchlistSummary}
            showWatchlistOnly={showWatchlistOnly}
            onToggle={() => setShowWatchlistOnly(!showWatchlistOnly)}
          />
        )}
        
        {/* Filters */}
        <FiltersSection 
          minProfit={minProfit}
          setMinProfit={setMinProfit}
          minMargin={minMargin}
          setMinMargin={setMinMargin}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedTier={selectedTier}
          setSelectedTier={setSelectedTier}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          travelCost={travelCost}
          setTravelCost={setTravelCost}
          isPremiumTax={isPremiumTax}
          setIsPremiumTax={setIsPremiumTax}
        />
        
        {/* Results Table */}
        <ResultsTable
          flips={currentFlips}
          totalFlips={filteredFlips.length}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onNextPage={nextPage}
          onPrevPage={prevPage}
          loading={loading}
          error={fetchError}
          watchlist={watchlist}
          onToggleWatchlist={toggleWatchlist}
          formatItemName={formatItemName}
          getTierLabel={getTierLabel}
        />
      </div>
      
      <InfoStrip currentPage="market-flipper" />
    </PageShell>
  );
}

function WatchlistSummary({ summary, showWatchlistOnly, onToggle }: any) {
  const t = useTranslations('MarketFlipper');
  
  return (
    <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Star className={`h-6 w-6 ${showWatchlistOnly ? 'fill-current' : ''} text-primary`} />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground">{t('watchlistTitle')}</h3>
            <p className="text-xs text-muted-foreground">{t('itemsTracked', { count: summary.count })}</p>
          </div>
        </div>
        <Button
          variant={showWatchlistOnly ? 'default' : 'secondary'}
          size="sm"
          onClick={onToggle}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {showWatchlistOnly ? t('showAll') : t('showWatchlistOnly')}
        </Button>
      </div>

      {summary.topPick && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{t('topPick')}:</span>
          <span className="font-bold text-foreground">{summary.topPick.name}</span>
          <span className="font-black text-success">+{summary.topPick.roi.toFixed(1)}% {t('roiLabel')}</span>
          <span className="text-xs text-muted-foreground">({summary.profitable} {t('profitable')})</span>
        </div>
      )}
    </div>
  );
}

function FiltersSection({ minProfit, setMinProfit, minMargin, setMinMargin, selectedCategory, setSelectedCategory, selectedTier, setSelectedTier, searchTerm, setSearchTerm, travelCost, setTravelCost, isPremiumTax, setIsPremiumTax }: any) {
  const t = useTranslations('MarketFlipper');

  return (
    <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Filter className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground">{t('filtersTitle')}</h3>
          <p className="text-xs text-muted-foreground">{t('customizeSearchDesc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" /> {t('minProfitLabel')}
          </label>
          <NumberInput
            value={minProfit}
            onChange={setMinProfit}
            min={0}
            step={100}
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" /> {t('minMarginLabel')}
          </label>
          <NumberInput
            value={minMargin}
            onChange={setMinMargin}
            min={0}
            step={1}
            className="rounded-xl"
          />
        </div>
        <Select
          label={t('categoryLabel')}
          options={Object.keys(ITEM_CATEGORIES).map(cat => ({
            value: cat,
            label: t(`categoryLabels.${CATEGORY_LABEL_IDS[cat]}`) || cat
          }))}
          value={selectedCategory}
          onChange={setSelectedCategory}
        />
        <Select
          label={t('tierLabel')}
          options={[
            { value: 'All', label: t('allTiersLabel') },
            { value: '8', label: t('tier8') },
            { value: '7', label: t('tier7') },
            { value: '6', label: t('tier6') },
          ]}
          value={selectedTier}
          onChange={setSelectedTier}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/50">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-muted-foreground mb-2">{t('searchItemLabel')}</label>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchItemPlaceholder')}
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2">{t('travelCostLabel')}</label>
          <NumberInput
            value={travelCost}
            onChange={setTravelCost}
            min={0}
            step={100}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
        <Checkbox
          id="premium-tax"
          checked={isPremiumTax}
          onChange={(e) => setIsPremiumTax(e.target.checked)}
          label={
            <span className="text-sm font-semibold text-foreground">
              {t('premiumAccount')}
            </span>
          }
        />
      </div>
    </div>
  );
}

function ResultsTable({ flips, totalFlips, currentPage, totalPages, onPageChange, onNextPage, onPrevPage, loading, error, watchlist, onToggleWatchlist, formatItemName, getTierLabel }: any) {
  const t = useTranslations('MarketFlipper');
  const itemsPerPage = 20;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  if (loading) {
    return (
      <div className="bg-card/50 rounded-2xl border border-border/50 p-12 text-center">
        <Preloader size="lg" showText text={t('loadingMarketData')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card/50 rounded-2xl border border-border/50 p-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-lg font-bold text-foreground">{t('errorLoadingData')}</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (flips.length === 0) {
    return (
      <div className="bg-card/50 rounded-2xl border border-border/50 p-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-bold text-foreground">{t('noFlipsFound')}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('tryAdjustingFilters')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card/50 rounded-2xl border border-border/50 overflow-hidden">
      <div className="p-6 border-b border-border/50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-foreground">{t('availableFlips')}</h3>
          <p className="text-xs text-muted-foreground mt-1">{totalFlips} {t('profitableOpportunities')}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item')}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('route')}</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('buy')}</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('sell')}</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('profit')}</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {flips.map((flip: any, index: number) => (
              <FlipRow
                key={index}
                flip={flip}
                watchlist={watchlist}
                onToggleWatchlist={onToggleWatchlist}
                formatItemName={formatItemName}
                getTierLabel={getTierLabel}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-6 border-t border-border/50 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('showingResults', { start: Math.min(startIndex + 1, totalFlips), end: Math.min(endIndex, totalFlips), total: totalFlips })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onPrevPage}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
              {t('previous')}
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-10 h-10 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={onNextPage}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              {t('next')}
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FlipRow({ flip, watchlist, onToggleWatchlist, formatItemName, getTierLabel }: any) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations('MarketFlipper');
  const isWatchlisted = watchlist.includes(`${flip.itemId}-${flip.buyCity}`);

  return (
    <>
      <tr 
        className="group hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <ItemIcon itemId={flip.itemId} className="w-12 h-12 rounded" />
            <div>
              <div className="font-black text-foreground">{formatItemName(flip.itemId)}</div>
              <div className="text-xs text-muted-foreground">{getTierLabel(flip.itemId)}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-foreground">{flip.buyCity}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-primary">{t('bridgetwatch')}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="font-mono font-bold text-foreground">{flip.buyPrice.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{t('silver')}</div>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="font-mono font-bold text-foreground">{flip.sellPrice.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{t('silver')}</div>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="font-mono font-black text-success">+{flip.netProfit.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{t('silver')}</div>
        </td>
        <td className="px-6 py-4 text-center">
          <Tooltip content={isWatchlisted ? t('removeFromWatchlist') : t('addToWatchlist')}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(flip.itemId, flip.buyCity);
              }}
              className={`p-2 rounded-lg transition-all ${isWatchlisted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/10'}`}
            >
              <Star className={`h-4 w-4 ${isWatchlisted ? 'fill-current' : ''}`} />
            </button>
          </Tooltip>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={6} className="px-6 py-6 bg-muted/30">
            <div className="space-y-6">
              {/* Advanced Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AdvancedStatCard
                  label={t('marginLabel')}
                  value={`${flip.margin.toFixed(1)}%`}
                  icon={<TrendingUp className="h-4 w-4 text-primary" />}
                />
                <AdvancedStatCard
                  label={t('roiLabel')}
                  value={`${flip.roi.toFixed(1)}%`}
                  icon={<Sparkles className="h-4 w-4 text-success" />}
                  highlight={flip.roi > 30}
                />
                <AdvancedStatCard
                  label={t('dailyVolumeLabel')}
                  value={flip.dailyVolume?.toLocaleString() || 'N/A'}
                  icon={<RefreshCw className="h-4 w-4 text-info" />}
                />
                <AdvancedStatCard
                  label={t('lastUpdatedLabel')}
                  value={new Date(flip.updatedAt).toLocaleDateString()}
                  icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
                />
              </div>

              {/* Price Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-card rounded-xl border border-border/50">
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground mb-2">{t('buyDetails')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('locationLabel')}:</span>
                      <span className="font-semibold text-foreground">{flip.buyCity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('priceLabel')}:</span>
                      <span className="font-semibold text-foreground">{flip.buyPrice.toLocaleString()} {t('silver')}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground mb-2">{t('sellDetails')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('locationLabel')}:</span>
                      <span className="font-semibold text-foreground">{t('bridgetwatch')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('priceLabel')}:</span>
                      <span className="font-semibold text-foreground">{flip.sellPrice.toLocaleString()} {t('silver')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price History Chart */}
              <div className="p-4 bg-card rounded-xl border border-border/50">
                <h4 className="text-sm font-bold text-muted-foreground mb-3">{t('priceHistoryTitle')}</h4>
                <MarketHistoryChart itemId={flip.itemId} buyCity={flip.buyCity} region={flip.region} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function AdvancedStatCard({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-success/10 border-success/30' : 'bg-card border-border/50'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
      </div>
      <div className={`text-lg font-black ${highlight ? 'text-success' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}
