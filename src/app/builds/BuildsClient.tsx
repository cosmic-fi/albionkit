'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { PageShell } from '@/components/PageShell';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';
import { useAuth } from '@/context/AuthContext';
import { BuildCard } from '@/components/BuildCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Build, getPaginatedBuilds, PaginatedBuilds } from '@/lib/builds-service';
import { Search, Plus, Loader2, Sword, SearchX, Filter, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { LoginModal } from '@/components/auth/LoginModal';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

type SortOption = 'recent' | 'popular' | 'rating' | 'likes';

interface BuildsClientProps {
  initialTag?: string;
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Memoized filter options to prevent re-creation
const FILTER_OPTIONS = {
  zoneTags: [
    'black_zone', 'blue_zone', 'red_zone', 'yellow_zone', 'orange_zone',
    'open_world', 'mists', 'roads_avalon', 'hellgate', 'arena',
    'ava-dungeon', 'corrupted-dungeon', 'crystal_league', 'depths',
    'knightfall_abbey', 'solo-dungeon', 'static-dungeon', 'territory'
  ] as const,
  
  activityTags: [
    'crafting', 'exploration', 'faction_warfare', 'fame_silver_farm',
    'gathering', 'ganking', 'pvp', 'ratting', 'tracking', 'transporting'
  ] as const,
  
  roleTags: ['Tank', 'Healer', 'DPS', 'Assassin', 'Burst'] as const
};

export default function BuildsClient({ initialTag = 'all' }: BuildsClientProps) {
  const t = useTranslations('Builds');
  const { user, profile } = useAuth();
  
  // Filter states
  const [tag, setTag] = useState<string>(initialTag);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // UI states
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const isInitialMount = useRef(true);
  
  // Debounced search (300ms delay)
  const debouncedSearch = useDebounce(search, 300);

  // Fetch builds with pagination - optimized dependencies
  const fetchBuilds = useCallback(async (pageToFetch: number = 1, resetPagination: boolean = false) => {
    // Prevent concurrent fetches
    if (loadingMore && pageToFetch === 1 && !resetPagination) return;

    setLoading(true);
    setLoadingMore(true);

    try {
      const result: PaginatedBuilds = await getPaginatedBuilds(
        {
          sort,
          tag: tag !== 'all' ? tag : undefined,
          zone: selectedZone !== 'all' ? selectedZone : undefined,
          activity: selectedActivity !== 'all' ? selectedActivity : undefined,
          role: selectedRole !== 'all' ? selectedRole : undefined,
          search: debouncedSearch || undefined,
          limit: 24,
          page: resetPagination ? 1 : pageToFetch
        },
        // Always pass null - the service will handle cursor calculation internally
        // This prevents stale cursor issues when filters change
        null
      );

      // Reset builds array if this is a new search/filter
      setBuilds(result.builds);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setTotal(result.total || 0);
      setCurrentPage(resetPagination ? 1 : pageToFetch);
      setTotalPages(result.total ? Math.ceil(result.total / 24) : 1);
    } catch (error) {
      console.error('Error fetching builds:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort, tag, selectedZone, selectedActivity, selectedRole, debouncedSearch, loadingMore]);

  // Initial load and filter changes - reset to page 1
  useEffect(() => {
    // Skip fetch on initial mount if we're loading from URL
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Reset pagination state BEFORE fetching
    setCurrentPage(1);
    setLastDoc(null);

    // Fetch with reset
    fetchBuilds(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, tag, selectedZone, selectedActivity, selectedRole, debouncedSearch]);

  // Sync URL with filters (only after initial mount)
  useEffect(() => {
    if (isInitialMount.current) return;

    const params = new URLSearchParams();
    if (tag && tag !== 'all') params.set('tag', tag);
    if (selectedZone !== 'all') params.set('zone', selectedZone);
    if (selectedActivity !== 'all') params.set('activity', selectedActivity);
    if (selectedRole !== 'all') params.set('role', selectedRole);
    if (search) params.set('search', search);
    if (sort !== 'recent') params.set('sort', sort);
    if (currentPage > 1) params.set('page', String(currentPage));

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [tag, selectedZone, selectedActivity, selectedRole, search, sort, currentPage, pathname, router]);

  // Load from URL params on mount (once)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTag = params.get('tag') || 'all';
    const urlZone = params.get('zone') || 'all';
    const urlActivity = params.get('activity') || 'all';
    const urlRole = params.get('role') || 'all';
    const urlSearch = params.get('search') || '';
    const urlSort = (params.get('sort') as SortOption) || 'recent';
    const urlPage = parseInt(params.get('page') || '1');
    
    setTag(urlTag);
    setSelectedZone(urlZone);
    setSelectedActivity(urlActivity);
    setSelectedRole(urlRole);
    setSearch(urlSearch);
    setSort(urlSort);
    setCurrentPage(urlPage);
    
    // Fetch after setting state from URL
    setTimeout(() => {
      fetchBuilds(urlPage);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tagTitle = tag === 'all' ? t('allBuilds') : t(`tagOptions.${tag}`);

  const handleCreateBuild = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
    } else {
      router.push('/builds/create');
    }
  };

  const clearAllFilters = useCallback(() => {
    setTag('all');
    setSelectedZone('all');
    setSelectedActivity('all');
    setSelectedRole('all');
    setSearch('');
    setSort('recent');
    setCurrentPage(1);
  }, []);

  const activeFiltersCount = useMemo(() => 
    [tag, selectedZone, selectedActivity, selectedRole].filter(f => f !== 'all').length + (search ? 1 : 0)
  , [tag, selectedZone, selectedActivity, selectedRole, search]);

  const headerActions = (
    <button
      onClick={handleCreateBuild}
      className="flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors whitespace-nowrap text-sm h-9"
    >
      <Plus className="h-4 w-4" />
      <span>{t('createBuild')}</span>
    </button>
  );

  return (
    <PageShell
      title={t('title')}
      backgroundImage="/background/ao-builds.jpg"
      description={t('description')}
      headerActions={headerActions}
    >
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message={t('loginToCreate')}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Results count */}
        {!loading && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {total > 0 
                ? t('showingResults', { count: builds.length, total })
                : t('noBuilds')
              }
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" />
                {t('clearFilters')}
              </button>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              className="pl-9 h-10 text-sm bg-muted/50 border-border w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-4 sm:flex-nowrap flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-4 gap-2 whitespace-nowrap"
            >
              <Filter className="h-4 w-4" />
              {t('filters')}
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'recent', label: t('newestFirst') },
                  { value: 'popular', label: t('mostPopular') },
                  { value: 'rating', label: t('highestRated') },
                  { value: 'likes', label: t('mostLiked') }
                ]}
                value={sort}
                onChange={(val) => setSort(val as SortOption)}
                className="h-10 bg-muted/50 border-border w-full"
              />
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{t('activeFilters')}</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  {t('clearFilters')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t('filterByTags')}
                </label>
                <Select
                  options={[
                    { value: 'all', label: t('allCategories') },
                    { value: 'PvP', label: t('tagOptions.PvP') },
                    { value: 'PvE', label: t('tagOptions.PvE') },
                    { value: 'ZvZ', label: t('tagOptions.ZvZ') },
                    { value: 'Solo', label: t('tagOptions.Solo') },
                    { value: 'Small Scale', label: t('tagOptions.Small Scale') },
                    { value: 'Large Scale', label: t('tagOptions.Large Scale') },
                    { value: 'Group', label: t('tagOptions.Group') },
                    { value: 'EscapeGathering', label: t('tagOptions.EscapeGathering') },
                    { value: 'Ganking', label: t('tagOptions.Ganking') },
                    { value: 'Other', label: t('tagOptions.Other') },
                  ]}
                  value={tag}
                  onChange={(val) => setTag(val)}
                  className="h-9 bg-muted/50 border-border"
                />
              </div>

              {/* Zone Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t('filterByZone')}
                </label>
                <Select
                  options={[
                    { value: 'all', label: t('allZones') },
                    ...FILTER_OPTIONS.zoneTags.map(zone => ({
                      value: zone,
                      label: t(`tagOptions.${zone}`) || zone
                    }))
                  ]}
                  value={selectedZone}
                  onChange={(val) => setSelectedZone(val)}
                  className="h-9 bg-muted/50 border-border"
                />
              </div>

              {/* Activity Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t('filterByActivity')}
                </label>
                <Select
                  options={[
                    { value: 'all', label: t('allActivities') },
                    ...FILTER_OPTIONS.activityTags.map(activity => ({
                      value: activity,
                      label: t(`tagOptions.${activity}`) || activity
                    }))
                  ]}
                  value={selectedActivity}
                  onChange={(val) => setSelectedActivity(val)}
                  className="h-9 bg-muted/50 border-border"
                />
              </div>

              {/* Role Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t('filterByRole')}
                </label>
                <Select
                  options={[
                    { value: 'all', label: t('allRoles') },
                    ...FILTER_OPTIONS.roleTags.map(role => ({
                      value: role,
                      label: t(`tagOptions.${role}`) || role
                    }))
                  ]}
                  value={selectedRole}
                  onChange={(val) => setSelectedRole(val)}
                  className="h-9 bg-muted/50 border-border"
                />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : builds.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {builds.map((build) => (
                <BuildCard 
                  key={build.id} 
                  build={build} 
                  compactMode={profile?.preferences?.compactMode}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-8 pb-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    fetchBuilds(page);
                    // Scroll to top smoothly
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  isLoading={loadingMore}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <SearchX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t('noBuilds')}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {t('noBuildsDesc')}
            </p>
            <div className="flex gap-3">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-colors"
                >
                  {t('clearFilters')}
                </button>
              )}
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-colors"
                >
                  {t('clearSearch')}
                </button>
              )}
              <button
                onClick={handleCreateBuild}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('createBuild')}
              </button>
            </div>
          </div>
        )}
      </div>
      <InfoStrip currentPage="builds">
        <InfoBanner icon={<Sword className="w-4 h-4" />} color="text-amber-400" title={tagTitle}>
          <p>{t('infoTitle')}</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-xs opacity-90">
             <li>{t('infoPoint1')}</li>
             <li>{t('infoPoint2')}</li>
             <li>{t('infoPoint3')}</li>
          </ul>
        </InfoBanner>
      </InfoStrip>
    </PageShell>
  );
}
