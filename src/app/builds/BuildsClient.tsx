'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';
import { useAuth } from '@/context/AuthContext';
import { BuildCard } from '@/components/BuildCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Build, getBuildsAll } from '@/lib/builds-service';
import { Search, Plus, Loader2, Sword, SearchX } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { LoginModal } from '@/components/auth/LoginModal';
import { useTranslations } from 'next-intl';

type SortOption = 'recent' | 'popular' | 'rating' | 'likes';
type TagFilter = 'all' | 'PvP' | 'PvE' | 'ZvZ' | 'Solo' | 'Small Scale' | 'Large Scale' | 'Group' | 'EscapeGathering' | 'Ganking' | 'Other';

interface BuildsClientProps {
  initialTag?: TagFilter;
}

export default function BuildsClient({ initialTag = 'all' }: BuildsClientProps) {
  const t = useTranslations('Builds');
  const { user, profile } = useAuth();
  const [tag, setTag] = useState<TagFilter>(initialTag);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchBuilds = async () => {
      setLoading(true);
      try {
        const result = await getBuildsAll(sort);
        setBuilds(result.builds);
        setLastDoc(result.lastDoc);
        setHasMore(!!result.lastDoc && result.builds.length >= 50);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuilds();
  }, [sort]);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getBuildsAll(sort, 50, lastDoc);
      setBuilds(prev => [...prev, ...result.builds]);
      setLastDoc(result.lastDoc);
      setHasMore(!!result.lastDoc && result.builds.length >= 50);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (tag && tag !== 'all') {
      params.set('tag', tag);
    } else {
      params.delete('tag');
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }, [tag, pathname, router]);

  useEffect(() => {
    if (user && showLoginModal) {
      setShowLoginModal(false);
      router.push('/builds/create');
    }
  }, [user, showLoginModal, router]);

  const filteredBuilds = builds.filter(b => {
    const term = search.toLowerCase();
    const matchesSearch = (
      b.title.toLowerCase().includes(term) ||
      b.authorName.toLowerCase().includes(term) ||
      b.category.toLowerCase().includes(term) ||
      b.tags?.some(tagItem => tagItem.toLowerCase().includes(term))
    );
    
    const matchesTagFilter = tag === 'all' || b.tags?.includes(tag);
    
    return matchesSearch && matchesTagFilter;
  });

  const tagTitle = tag === 'all'
    ? t('allBuilds')
    : t(`tagOptions.${tag}`);

  const handleCreateBuild = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
    } else {
      router.push('/builds/create');
    }
  };

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
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('searchPlaceholder')} 
              className="pl-9 h-9 text-sm bg-muted/50 border-border focus:border-primary w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full md:w-48">
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
              onChange={(val) => setTag(val as TagFilter)}
              className="h-9 bg-muted/50 border-border"
            />
          </div>

          <div className="w-full md:w-48">
            <Select
              options={[
                { value: 'recent', label: t('newestFirst') },
                { value: 'popular', label: t('mostPopular') },
                { value: 'rating', label: t('highestRated') },
                { value: 'likes', label: t('mostLiked') }
              ]}
              value={sort}
              onChange={(val) => setSort(val as SortOption)}
              className="h-9 bg-muted/50 border-border"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : filteredBuilds.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBuilds.map((build) => (
                <BuildCard key={build.id} build={build} compactMode={profile?.preferences?.compactMode} />
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                  {loadingMore ? t('loading') : t('loadMore')}
                </button>
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
