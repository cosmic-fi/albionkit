'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import { ItemIcon } from '@/components/ItemIcon';
import { getBuild, Build, toggleBuildLike, getBuildLikeStatus, rateBuild, getBuildUserRating, incrementBuildView, getBuilds } from '@/lib/builds-service';
import { getUserProfile, UserProfile } from '@/lib/user-profile';
import { getMarketPrices, LOCATIONS } from '@/lib/market-service';
import { Loader2, User, Clock, Eye, Star, Share2, ThumbsUp, Calendar, Shield, Zap, Wind, BookOpen, Check, X as XIcon, ArrowLeft, ArrowRight, Heart, Link as LinkIcon, Copy, Sparkles, Coins } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { BuildCard } from '@/components/BuildCard';
import { Tooltip } from '@/components/ui/Tooltip';

const Markdown = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
);

interface BuildViewProps {
    id: string;
    category: string;
}

export function BuildView({ id, category }: BuildViewProps) {
  const { user } = useAuth();
  const [build, setBuild] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [similarBuilds, setSimilarBuilds] = useState<Build[]>([]);
  const [estPrice, setEstPrice] = useState<number | null>(null);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (build?.authorId) {
        getUserProfile(build.authorId).then(setAuthorProfile);
    }
  }, [build?.authorId]);

  useEffect(() => {
    const fetchPrice = async () => {
      if (!build) return;
      
      const itemsToFetch: string[] = [];
      // Collect all item Types
      const { MainHand, OffHand, Head, Armor, Shoes, Cape, Potion, Food, Mount } = build.items;
      [MainHand, OffHand, Head, Armor, Shoes, Cape, Potion, Food, Mount].forEach(item => {
        if (item?.Type) itemsToFetch.push(item.Type);
      });

      if (itemsToFetch.length === 0) return;

      try {
        const prices = await getMarketPrices(itemsToFetch);
        
        // Calculate total minimum price across royal cities
        let total = 0;
        const royalCities = ['Bridgewatch', 'Fort Sterling', 'Lymhurst', 'Martlock', 'Thetford'];
        
        itemsToFetch.forEach(itemId => {
          // Find cheapest sell price for this item in any royal city
          const itemPrices = prices.filter(p => p.item_id === itemId && royalCities.includes(p.city) && p.sell_price_min > 0);
          
          if (itemPrices.length > 0) {
            // Find min price among valid records
            const minPrice = Math.min(...itemPrices.map(p => p.sell_price_min));
            total += minPrice;
          }
        });
        
        setEstPrice(total > 0 ? total : null);
      } catch (e) {
        console.error("Failed to fetch prices", e);
      }
    };

    if (build) {
      fetchPrice();
    }
  }, [build]);

  useEffect(() => {
    const fetchBuild = async () => {
      setLoading(true);
      try {
        const data = await getBuild(id);
        setBuild(data);
        setLikeCount(data?.likes || 0);

        // Handle view count with local storage to prevent duplicate views
        if (data && data.id) {
          const viewedBuildsKey = 'viewed_builds';
          const viewedBuilds = JSON.parse(localStorage.getItem(viewedBuildsKey) || '[]');
          
          if (!viewedBuilds.includes(data.id)) {
             incrementBuildView(data.id);
             localStorage.setItem(viewedBuildsKey, JSON.stringify([...viewedBuilds, data.id]));
             // Optimistically update local view count
             setBuild(prev => prev ? ({ ...prev, views: prev.views + 1 }) : null);
          }

          // Fetch similar builds
          const { builds: similar } = await getBuilds(data.category, 'recent', 4);
          setSimilarBuilds(similar.filter(b => b.id !== data.id).slice(0, 3));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBuild();
  }, [id]);

  useEffect(() => {
    if (user && build?.id) {
      getBuildLikeStatus(build.id, user.uid).then(setIsLiked);
      getBuildUserRating(build.id, user.uid).then(setUserRating);
    }
  }, [user, build?.id]);

  const handleRate = async (rating: number) => {
    if (!user) {
        toast.error("Please sign in to rate builds");
        return;
    }
    if (isRatingLoading || !build?.id) return;

    setIsRatingLoading(true);
    try {
        await rateBuild(build.id, user.uid, rating);
        setUserRating(rating);
        
        // Refresh build to get updated average
        const updatedBuild = await getBuild(build.id);
        if (updatedBuild) setBuild(updatedBuild);
        
        toast.success("Rating submitted!");
    } catch (error) {
        console.error(error);
        toast.error("Failed to submit rating");
    } finally {
        setIsRatingLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = async () => {
    if (!user) {
        toast.error("Please sign in to like builds");
        return;
    }
    if (isLikeLoading || !build?.id) return;

    setIsLikeLoading(true);
    // Optimistic update
    const previousIsLiked = isLiked;
    const previousCount = likeCount;
    
    setIsLiked(!previousIsLiked);
    setLikeCount(prev => previousIsLiked ? prev - 1 : prev + 1);

    const success = await toggleBuildLike(build.id, user.uid);
    if (!success) {
        // Revert
        setIsLiked(previousIsLiked);
        setLikeCount(previousCount);
    }
    setIsLikeLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
      </div>
    );
  }

  if (!build) {
    return (
      <PageShell 
        title="Build Not Found" 
        backgroundImage={`/background/ao-builds.jpg`}
        description="">
        <div className="text-center py-20">
          <h2 className="text-xl text-muted-foreground">This build does not exist or has been removed.</h2>
          <Link href="/builds/solo" className="text-amber-500 hover:underline mt-4 block">
            Browse Builds
          </Link>
        </div>
      </PageShell>
    );
  }

  const is2H = build.items.MainHand?.Type?.includes('_2H_');

  return (
    <PageShell 
        title={build.title} 
        backgroundImage={`/background/ao-builds.jpg`}
        description={`By ${build.authorName}`}>
      <div className=" mx-auto">
        <div className="mb-6 flex items-center justify-between">
            <Link href={`/builds/${build.category}`} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to {build.category} Builds
            </Link>
        </div>

        {/* Header Stats */}
        <div className="bg-card/50 border border-border rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center text-muted-foreground shrink-0">
                    <User className="h-7 w-7" />
                </div>
                <div>
                    <div className="text-sm text-muted-foreground">Created by</div>
                    <Link href={`/user/${build.authorId}`} className="text-lg font-bold text-amber-500 hover:underline">
                        {build.authorName}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>Updated {build.updatedAt?.toDate ? build.updatedAt.toDate().toLocaleDateString() : 'Recently'}</span>
                    </div>
                </div>
             </div>

             <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 sm:gap-8 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-8 w-full md:w-auto">
                {estPrice !== null && (
                    <div className="text-center">
                        <div className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                            <Coins className="h-5 w-5" />
                            {estPrice > 1000000 
                                ? `${(estPrice / 1000000).toFixed(1)}m` 
                                : estPrice > 1000 
                                    ? `${(estPrice / 1000).toFixed(1)}k` 
                                    : estPrice}
                        </div>
                        <div className="text-xs text-muted-foreground">Est. Cost</div>
                    </div>
                )}

                <div className="text-center group relative">
                    <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-2 cursor-help">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />{build.rating.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">{build.ratingCount} ratings</div>
                    
                    {/* Rating Popup */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover border border-border rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
                        <div className="text-xs text-muted-foreground mb-2 font-medium">Rate this build</div>
                        <div className="flex items-center justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => handleRate(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    disabled={isRatingLoading}
                                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star 
                                        className={`h-5 w-5 ${
                                            (hoverRating || userRating || 0) >= star 
                                            ? 'text-amber-500 fill-amber-500' 
                                            : 'text-muted-foreground'
                                        }`} 
                                    />
                                </button>
                            ))}
                        </div>
                        {userRating && <div className="text-[10px] text-muted-foreground mt-2">Your rating: {userRating}</div>}
                    </div>
                </div>

                <button 
                    onClick={handleLike}
                    disabled={isLikeLoading}
                    className="text-center group transition-transform active:scale-95 cursor-pointer"
                >
                    <div className={`text-2xl font-bold flex items-center justify-center gap-2 transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground group-hover:text-red-400'}`}>
                        <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                        {likeCount}
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-foreground">Likes</div>
                </button>

                <div className="text-center">
                    <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                    <Eye className="h-5 w-5 text-muted-foreground" />{build.views}
                    </div>
                    <div className="text-xs text-muted-foreground">Views</div>
                </div>

                <button 
                    onClick={handleShare}
                    className="text-center group md:border-l border-border md:pl-8 transition-transform active:scale-95 cursor-pointer col-span-3 sm:col-span-1"
                >
                    <div className="text-2xl font-bold text-muted-foreground group-hover:text-blue-400 flex items-center justify-center gap-2 transition-colors">
                        {copied ? <Check className="h-5 w-5 text-green-500" /> : <LinkIcon className="h-5 w-5" />}
                    </div>
                    <div className={`text-xs ${copied ? 'text-green-500' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        {copied ? 'Copied!' : 'Share'}
                    </div>
                </button>
             </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left Column: Equipment List (Expanded) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card/50 border border-border rounded-xl p-6 h-full">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 pb-4 border-b border-border/50 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Equipment
                </h3>

                <div className="space-y-4">
                    {/* List Header */}
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
                        <div>Recommended</div>
                        <div>Alternatives</div>
                    </div>

                    {/* Equipment Rows */}
                    {[
                        { item: build.items.MainHand, label: "Main Hand" },
                        { item: is2H ? null : build.items.OffHand, label: "Off Hand", hidden: is2H },
                        { item: build.items.Head, label: "Head" },
                        { item: build.items.Armor, label: "Armor" },
                        { item: build.items.Shoes, label: "Shoes" },
                        { item: build.items.Cape, label: "Cape" },
                    ].map((row, idx) => !row.hidden && (
                        <div key={idx} className="bg-muted/30 rounded-lg p-4 border border-border/50 flex items-center justify-between group hover:border-muted transition-colors">
                            {/* Left: Recommended */}
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20">
                                    <EquipmentSlot item={row.item} label={row.label} showAlternatives={false} />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-foreground">{row.item?.Type ? formatItemName(row.item.Type) : <span className="text-muted-foreground">{row.label}</span>}</div>
                                    <div className="text-sm text-muted-foreground font-medium">{row.label}</div>
                                </div>
                            </div>

                            {/* Middle: Arrow */}
                            <div className="hidden md:block">
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-muted-foreground/80 transition-colors" />
                            </div>

                            {/* Right: Alternatives */}
                            <div className="flex items-center gap-3">
                                {row.item?.Alternatives && row.item.Alternatives.length > 0 ? (
                                    row.item.Alternatives.map((alt: string, i: number) => (
                                        <div key={i} className="w-14 h-14">
                                            <EquipmentSlot item={{ Type: alt }} label={`Alt ${i+1}`} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-muted-foreground italic px-2 font-medium">No alternatives</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Consumables Section */}
                <div className="mt-8 pt-6 border-t border-border/50">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Consumables & Mounts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { item: build.items.Potion, label: "Potion" },
                            { item: build.items.Food, label: "Food" },
                            { item: build.items.Mount, label: "Mount" },
                            { item: build.items.Bag, label: "Bag" }
                        ].map((row, idx) => (
                            <div key={idx} className="bg-muted/30 rounded-lg p-3 border border-border/50 flex items-center gap-4">
                                <div className="w-14 h-14">
                                    <EquipmentSlot item={row.item} label={row.label} />
                                </div>
                                <div>
                                    <div className="text-base font-bold text-foreground">{row.item?.Type ? formatItemName(row.item.Type) : <span className="text-muted-foreground">{row.label}</span>}</div>
                                    <div className="text-xs text-muted-foreground font-medium">{row.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column: Inventory & Stats */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Inventory Grid Card */}
            <div className="bg-card/50 border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 pb-4 border-b border-border/50 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Inventory
                </h3>
                
                {/* 3x3 Grid mimicking Albion Inventory */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        build.items.Bag, build.items.Head, build.items.Cape,
                        build.items.MainHand, build.items.Armor, is2H ? null : build.items.OffHand,
                        build.items.Potion, build.items.Shoes, build.items.Food
                    ].map((item, i) => (
                        <div key={i} className="aspect-square bg-muted/50 rounded border border-border flex items-center justify-center p-1">
                            {item ? (
                                <ItemIcon item={item} size={217} className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full bg-muted/20"></div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-center">
                    <div className="text-xs text-muted-foreground">Estimated Market Value</div>
                    <div className="text-lg font-bold text-primary">
                        {estPrice ? `≈ ${estPrice >= 1000000 ? (estPrice / 1000000).toFixed(2) + 'm' : Math.round(estPrice / 1000) + 'k'} Silver` : 'Calculating...'}
                    </div>
                </div>
            </div>

            {/* Build Stats (Moved here) */}
            <div className="bg-card/50 border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Overview</h3>
                <div className="space-y-4">
                    <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</div>
                        <div className="font-medium text-foreground capitalize flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-primary"></span>
                             {build.category.replace('-', ' ')}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mobility</div>
                        <div className="font-medium text-foreground capitalize flex items-center gap-2">
                            <Wind className="h-4 w-4 text-muted-foreground" />
                            {build.mobility || 'Medium'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Tags</div>
                        <div className="flex flex-wrap gap-2">
                            {build.tags && build.tags.length > 0 ? build.tags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-md border border-border">
                                    {tag}
                                </span>
                            )) : <span className="text-muted-foreground text-sm">-</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pros/Cons (Compact) */}
            {(build.strengths && build.strengths.length > 0 || build.weaknesses && build.weaknesses.length > 0) && (
                <div className="bg-card/50 border border-border rounded-xl p-6">
                    <div className="space-y-6">
                        {build.strengths && build.strengths.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Check className="h-3 w-3" /> Strengths
                                </h4>
                                <ul className="space-y-1">
                                    {build.strengths.map((s, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="w-1 h-1 rounded-full bg-green-500 mt-2 shrink-0"></span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {build.weaknesses && build.weaknesses.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <XIcon className="h-3 w-3" /> Weaknesses
                                </h4>
                                <ul className="space-y-1">
                                    {build.weaknesses.map((w, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="w-1 h-1 rounded-full bg-red-500 mt-2 shrink-0"></span>
                                            {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Description Section (Full Width) */}
        <div className="bg-card/50 border border-border rounded-xl p-6 mb-8">
             <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 pb-4 border-b border-border/50 flex items-center gap-2">
                  Build Summary
             </h3>
             <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{build.description}</p>
        </div>

        {/* Full Width Detailed Guide */}
        <div className="bg-card/50 border border-border rounded-xl p-6 mb-8">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 pb-4 border-b border-border/50 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" /> Detailed Guide
              </h3>
             <div data-color-mode="dark" className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground">
                 {build.longDescription ? (
                    <Markdown source={build.longDescription} style={{ background: 'transparent', color: 'inherit' }} />
                 ) : (
                    <div className="text-center py-12 text-muted-foreground italic">
                        No detailed guide provided for this build.
                    </div>
                 )}
             </div>
        </div>

        {/* Full Width Video Guide */}
        {build.youtubeLink && (
            <div className="bg-card/50 border border-border rounded-xl p-6 mb-8">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 pb-4 border-b border-border/50 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" /> Video Guide
            </h3>
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-lg">
                <iframe 
                    width="100%" 
                    height="100%" 
                    src={build.youtubeLink.replace('watch?v=', 'embed/')} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                ></iframe>
            </div>
            </div>
        )}

        {/* Similar Builds Section */}
        {similarBuilds.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Similar Builds
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {similarBuilds.map(similarBuild => (
                        <div key={similarBuild.id} className="h-full">
                            <BuildCard build={similarBuild} />
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
      <InfoStrip currentPage="builds" />
    </PageShell>
  );
}

function EquipmentSlot({ item, label, disabled = false, showAlternatives = true }: { item: any, label: string, disabled?: boolean, showAlternatives?: boolean }) {
    const alternatives = item?.Alternatives || [];
    const hasItem = !!item?.Type;

    if (!hasItem) return null;

    return (
        <div className="flex flex-col items-center gap-1 w-full">
            <Tooltip content={hasItem ? formatItemName(item.Type) : label}>
                <div className={`
                    w-full aspect-square rounded border border-border p-1 flex items-center justify-center relative group
                    ${hasItem 
                        ? 'bg-muted' 
                        : 'bg-muted/50 opacity-50'
                    }
                    ${disabled 
                        ? 'opacity-50 grayscale cursor-not-allowed' 
                        : hasItem ? 'hover:border-primary/50 transition-colors' : ''
                    }
                `}>
                    <ItemIcon item={item} size={217} className="w-full h-full object-contain" />
                    {!disabled && hasItem && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded" />}
                </div>
            </Tooltip>

            {/* Alternatives */}
            {!disabled && showAlternatives && alternatives.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 w-full px-1">
                    {alternatives.map((alt: string) => (
                        <Tooltip key={alt} content={formatItemName(alt)}>
                            <div className="w-6 h-6 bg-muted border border-border rounded overflow-hidden">
                                <ItemIcon item={{ Type: alt }} size={24} className="w-full h-full p-0.5" />
                            </div>
                        </Tooltip>
                    ))}
                </div>
            )}
        </div>
    );
}

const formatItemName = (type: string) => {
    if (!type) return 'Unknown Item';
    const parts = type.split('_');
    let tier = '';
    let name = type;
    let enchant = '';

    if (parts[0].match(/^T\d+$/)) {
        tier = parts[0] + ' ';
        name = parts.slice(1).join(' ');
    }

    if (name.includes('@')) {
        const [baseName, enchantLevel] = name.split('@');
        name = baseName;
        enchant = `.${enchantLevel}`;
    }

    // Capitalize and clean up
    name = name.replace(/_/g, ' ').split(/\s+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');

    return `${tier}${name}${enchant}`;
};

function getEmbedUrl(url: string) {
    try {
        if (url.includes('youtube.com/watch?v=')) {
            return url.replace('watch?v=', 'embed/');
        }
        if (url.includes('youtu.be/')) {
            const id = url.split('youtu.be/')[1];
            return `https://www.youtube.com/embed/${id}`;
        }
        return url;
    } catch {
        return url;
    }
}
