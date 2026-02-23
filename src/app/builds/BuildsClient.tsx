'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';
import { useAuth } from '@/context/AuthContext';
import { BuildCard } from '@/components/BuildCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Build, BuildCategory, getBuilds, getBuildsAll } from '@/lib/builds-service';
import { Search, Plus, Loader2, Sword, SearchX } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { LoginModal } from '@/components/auth/LoginModal';

type SortOption = 'recent' | 'popular' | 'rating' | 'likes';
type CategoryFilter = 'all' | BuildCategory;

interface BuildsClientProps {
  initialCategory?: CategoryFilter;
}

export default function BuildsClient({ initialCategory = 'all' }: BuildsClientProps) {
  const { user, profile } = useAuth();
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
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
        const result = category === 'all'
          ? await getBuildsAll(sort)
          : await getBuilds(category, sort);
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
  }, [category, sort]);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = category === 'all'
        ? await getBuildsAll(sort, 50, lastDoc)
        : await getBuilds(category, sort, 50, lastDoc);
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
    if (category && category !== 'all') {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }, [category, pathname, router]);

  useEffect(() => {
    if (user && showLoginModal) {
      setShowLoginModal(false);
      router.push('/builds/create');
    }
  }, [user, showLoginModal, router]);

  const filteredBuilds = builds.filter(b => {
    const term = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(term) || 
      b.authorName.toLowerCase().includes(term) ||
      b.category.toLowerCase().includes(term) ||
      b.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  });

  const categoryTitle = category === 'all'
    ? 'All Builds'
    : `${category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Builds`;

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
      <span>Create Build</span>
    </button>
  );

  return (
    <PageShell 
      title="Builds Database" 
      backgroundImage="/background/ao-builds.jpg"
      description="Browse all Albion Online builds in one place and filter by content type."
      headerActions={headerActions}
    >
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        message="You need to be logged in to create and publish builds."
      />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search builds..." 
              className="pl-9 h-9 text-sm bg-muted/50 border-border focus:border-primary w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full md:w-48">
            <Select
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'solo', label: 'Solo' },
                { value: 'small-scale', label: 'Small Scale' },
                { value: 'pvp', label: 'PvP' },
                { value: 'zvz', label: 'ZvZ' },
                { value: 'large-scale', label: 'Large Scale' },
                { value: 'group', label: 'Group' },
              ]}
              value={category}
              onChange={(val) => setCategory(val as CategoryFilter)}
              className="h-9 bg-muted/50 border-border"
            />
          </div>

          <div className="w-full md:w-48">
            <Select
              options={[
                { value: 'recent', label: 'Newest First' },
                { value: 'popular', label: 'Most Popular' },
                { value: 'rating', label: 'Highest Rated' },
                { value: 'likes', label: 'Most Liked' }
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
                  {loadingMore ? 'Loading...' : 'Load More Builds'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <SearchX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No builds found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              We could not find any builds matching your search criteria. Try adjusting your filters or create a new one.
            </p>
            <div className="flex gap-3">
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              )}
              <button 
                onClick={handleCreateBuild}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Build
              </button>
            </div>
          </div>
        )}
      </div>
      <InfoStrip currentPage="builds">
        <InfoBanner icon={<Sword className="w-4 h-4" />} color="text-amber-400" title={categoryTitle}>
          <p>Filter and explore community builds for every type of Albion content.</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-xs opacity-90">
             <li>Use the category filter to focus on specific content types</li>
             <li>Sort by rating or popularity to find proven builds</li>
             <li>Search by weapon, tags, or author name</li>
          </ul>
        </InfoBanner>
      </InfoStrip>
    </PageShell>
  );
}

