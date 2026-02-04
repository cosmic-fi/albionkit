'use client';

import { useState, useEffect, use } from 'react';
import { PageShell } from '@/components/PageShell';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';
import { useAuth } from '@/context/AuthContext';
import { BuildCard } from '@/components/BuildCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getBuilds, Build, BuildCategory } from '@/lib/builds-service';
import { Search, Plus, Loader2, Sword, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginModal } from '@/components/auth/LoginModal';

export default function BuildsPage({ params }: { params: Promise<{ category: string }> }) {
  const { user, profile } = useAuth();
  const resolvedParams = use(params);
  const category = resolvedParams.category as BuildCategory;
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'popular' | 'rating' | 'likes'>('recent');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBuilds = async () => {
      setLoading(true);
      try {
        const { builds: data, lastDoc: last } = await getBuilds(category, sort);
        setBuilds(data);
        setLastDoc(last);
        setHasMore(!!last && data.length >= 50);
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
      const { builds: newBuilds, lastDoc: newLast } = await getBuilds(category, sort, 50, lastDoc);
      setBuilds(prev => [...prev, ...newBuilds]);
      setLastDoc(newLast);
      setHasMore(!!newLast && newBuilds.length >= 50);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Auto-redirect to create page if user logs in while modal is open
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

  const categoryTitle = category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

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
      title={`${categoryTitle} Builds`} 
      backgroundImage={`/background/ao-builds.jpg`}
      description={`Find and share the best ${categoryTitle} builds for Albion Online.`}
      headerActions={headerActions}
    >
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        message="You need to be logged in to create and publish builds."
      />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Filters & Search */}
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
                { value: 'recent', label: 'Newest First' },
                { value: 'popular', label: 'Most Popular' },
                { value: 'rating', label: 'Highest Rated' },
                { value: 'likes', label: 'Most Liked' }
              ]}
              value={sort}
              onChange={(val) => setSort(val as any)}
              className="h-9 bg-muted/50 border-border"
            />
          </div>
        </div>

        {/* Content */}
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
              We couldn't find any builds matching your search criteria. Try adjusting your filters or create a new one!
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
        <InfoBanner icon={<Sword className="w-4 h-4" />} color="text-amber-400" title={`${categoryTitle} Strategy Guide`}>
          <p>Finding the right build for {categoryTitle.toLowerCase()} content is key to success.</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-xs opacity-90">
             <li>Sort by <strong>Rating</strong> to see community favorites</li>
             <li>Check the <strong>Date</strong> to ensure the build is still meta</li>
             <li>Use the search bar to find builds for specific weapons</li>
          </ul>
        </InfoBanner>
      </InfoStrip>
    </PageShell>
  );
}
