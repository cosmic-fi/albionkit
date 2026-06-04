'use client';

import { useState, useMemo } from 'react';
import { Swords, RefreshCw, BarChart3, List, Search } from 'lucide-react';
import { Preloader } from '@/components/Preloader';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { ServerSelector } from '@/components/ServerSelector';
import { InfoStrip } from '@/components/InfoStrip';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import LiveBattleIndicator from './components/LiveBattleIndicator';
import BattleUpdateNotification from './components/BattleUpdateNotification';
import { ZvZStatsCards } from './components/ZvZStatsCards';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { FiltersSection } from './components/FiltersSection';
import { BattleTable } from './components/BattleTable';
import { LeaderboardSection } from './components/LeaderboardSection';
import { ApiError, NoBattlesFound, NoSearchResults } from './components/ErrorStates';
import { useBattleData } from './hooks/useBattleData';
import { useBattleExpansion } from './hooks/useBattleExpansion';
import { useSearch } from './hooks/useSearch';
import { useFilters } from './hooks/useFilters';
import { useBattleAnalytics } from './hooks/useBattleAnalytics';
import { useRealTimeBattleUpdates } from './hooks/useRealTimeBattleUpdates';
import { useZvZTracker } from './hooks/useZvZTracker';
import { useServer } from '@/hooks/useServer';
import { transformBattleTimelineData, transformFactionDominanceData, transformIntensityData } from './lib/chart-data';
import type { Battle } from './types';

export default function ZvzTrackerClient() {
  const t = useTranslations('ZvzTracker');
  const tCommon = useTranslations('Common');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { server: region, setServer: setRegion } = useServer();

  // Battle data
  const { battles, loading, error: fetchError, loadBattles } = useBattleData(region);

  // Filters
  const { filters, applyFiltersToBattles, updateFilter, resetFilters } = useFilters({
    onFiltersChange: () => setBattlesPage(1),
    onReset: () => setBattlesPage(1)
  });

  // Analytics
  const { analytics, stats, filteredBattles, liveBattles } = useBattleAnalytics(battles, filters);

  // Real-time updates
  const { lastRefresh, hasLiveBattles, refreshNow } = useRealTimeBattleUpdates(region, battles, () => {}, {
    enabled: true,
    interval: 30000,
    onRefresh: (newBattles) => {
      const count = newBattles.filter(b => !battles.find(existing => existing.id === b.id)).length;
      if (count > 0) {
        setNewBattleCount(count);
        setTimeout(() => setNewBattleCount(0), 5000);
      }
    },
    onError: (error) => {
      setRefreshError(error);
      setTimeout(() => setRefreshError(undefined), 5000);
    }
  });

  // Search
  const { searchQuery, searchResults, isSearching, selectedEntity, setSearchQuery, clearSelectedEntity } = useSearch(region);

  // Battle expansion
  const { expandedBattleId, detailsLoading, expandBattle } = useBattleExpansion(region);

  // UI state
  const [activeTab, setActiveTab] = useState<'analytics' | 'battles'>('analytics');
  const [battlesPage, setBattlesPage] = useState(1);
  const battlesPerPage = 15;
  const [newBattleCount, setNewBattleCount] = useState(0);
  const [refreshError, setRefreshError] = useState<string | undefined>();

  const { isLiveBattle, formatTimeAgo, copyBattleLink, topKills } = useZvZTracker(liveBattles, { battlesPerPage });

  // Transform data for charts (use filtered battles)
  const timelineData = useMemo(() => {
    return transformBattleTimelineData(filteredBattles, filters.timeRange === 'all' ? '30d' : filters.timeRange);
  }, [filteredBattles, filters.timeRange]);

  const factionData = useMemo(() => {
    return transformFactionDominanceData(filteredBattles);
  }, [filteredBattles]);

  const intensityData = useMemo(() => {
    return transformIntensityData(filteredBattles);
  }, [filteredBattles]);

  // Filtered and paginated battles
  const filteredAndPaginatedBattles = useMemo(() => {
    const past = filteredBattles.filter(b => !isLiveBattle(b));
    const start = (battlesPage - 1) * battlesPerPage;
    return { past: past.slice(start, start + battlesPerPage), total: past.length };
  }, [filteredBattles, battlesPage, isLiveBattle, battlesPerPage]);

  const handleCopyLink = (battleId: number) => {
    copyBattleLink(battleId, searchParams, pathname);
  };

  const handleFiltersChange = (newFilters: any) => {
    Object.entries(newFilters).forEach(([key, value]) => {
      updateFilter(key as any, value);
    });
    setBattlesPage(1);
  };

  return (
    <>
      <PageShell
        title={t('title')}
        backgroundImage='/background/ao-zvz.jpg'
        description={liveBattles.length > 0 ? t('liveDescription', { count: liveBattles.length, region, kills: topKills }) : t('description')}
        stats={[]}
        headerActions={
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="w-full md:w-fit flex items-center justify-between gap-3 md:justify-start">
              <ServerSelector selectedServer={region} onServerChange={setRegion} />
              <LiveBattleIndicator lastRefresh={lastRefresh} hasLiveBattles={hasLiveBattles} onRefresh={refreshNow} />
              <Button
                variant="default"
                size="sm"
                onClick={() => loadBattles(false)}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{loading ? tCommon('loading') : tCommon('refresh')}</span>
              </Button>
            </div>
          </div>
        }
      >
        {/* Error States */}
        {fetchError && <ApiError message={fetchError} onRetry={() => loadBattles(false)} t={t} />}
        {refreshError && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-xl text-warning animate-fade-in">
            <p className="font-bold">Real-time update failed</p>
            <p className="text-sm">{refreshError}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="animate-fade-in-up">
          <ZvZStatsCards battles={battles} liveBattles={liveBattles} loading={loading} t={t} />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6 animate-fade-in-up">
          <CategoryTabs
            options={[
              { value: 'analytics', label: t('analyticsTab') },
              { value: 'battles', label: t('battlesTab') }
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            timelineData={timelineData}
            factionData={factionData}
            intensityData={intensityData}
            timeRange={filters.timeRange === 'all' ? '30d' : filters.timeRange}
            t={t}
            loading={loading}
          />
        )}

        {/* Battles Tab Content */}
        {activeTab === 'battles' && (
          <>
            {/* Leaderboard */}
            <LeaderboardSection
              topGuilds={analytics.topGuilds}
              topAlliances={analytics.topAlliances}
              t={t}
            />

            {/* Filters Section */}
            <div className="animate-fade-in-up delay-100">
              <FiltersSection
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={resetFilters}
              />
            </div>
          </>
        )}

        {/* Battle Table - Only show in Battles tab */}
        {activeTab === 'battles' && (
          <div className="animate-fade-in-up delay-150">
            {loading && !expandedBattleId && !filters.searchQuery ? (
              <div className="bg-card/50 rounded-2xl border border-border/50 p-12 text-center">
                <Preloader size="lg" showText text={t('loadingBattles')} />
              </div>
            ) : fetchError ? (
              <ApiError message={fetchError} onRetry={() => loadBattles(false)} t={t} />
            ) : filteredAndPaginatedBattles.past.length === 0 && !filters.searchQuery ? (
              <NoBattlesFound t={t} />
            ) : filteredAndPaginatedBattles.past.length === 0 && filters.searchQuery ? (
              <div className="bg-card/50 rounded-2xl border border-border/50 p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-bold text-foreground">{t('noBattlesFound')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('noBattlesMatchSearch')} "{filters.searchQuery}"</p>
                <button
                  onClick={() => updateFilter('searchQuery', '')}
                  className="mt-4 text-primary font-medium hover:underline"
                >
                  {t('clearSearch')}
                </button>
              </div>
            ) : (
              <BattleTable
                battles={filteredAndPaginatedBattles.past}
                liveBattles={liveBattles}
                expandedBattleId={expandedBattleId}
                onExpandBattle={expandBattle}
                onCopyLink={handleCopyLink}
                isLive={isLiveBattle}
                formatTimeAgo={formatTimeAgo}
                loading={loading}
                currentPage={battlesPage}
                totalPages={Math.ceil(filteredAndPaginatedBattles.total / battlesPerPage)}
                onPageChange={setBattlesPage}
                t={t}
              />
            )}
          </div>
        )}

        <InfoStrip />
        <BattleUpdateNotification newBattleCount={newBattleCount} onRefresh={refreshNow} />
      </PageShell>
    </>
  );
}
