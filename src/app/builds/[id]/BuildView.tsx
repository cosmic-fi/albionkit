'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import { ItemIcon } from '@/components/ItemIcon';
import { getBuild, Build, getBuilds } from '@/lib/builds-service';
import { getMarketPrices, LOCATIONS } from '@/lib/market-service';
import { getItemNameService } from '@/lib/item-service';
import { Loader2, User, Clock, Eye, Star, Share2, ThumbsUp, Calendar, Shield, Zap, Wind, BookOpen, Check, X as XIcon, ArrowLeft, ArrowRight, Heart, Link as LinkIcon, Copy, Sparkles, Coins, EyeOff, Trash2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { BuildCard } from '@/components/BuildCard';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

const Markdown = dynamic(
    () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
    { ssr: false }
);

interface BuildViewProps {
    id: string;
}

export function BuildView({ id }: BuildViewProps) {
    const t = useTranslations('BuildView');
    const tCommon = useTranslations('Common');
    const tBuilds = useTranslations('Builds');
    const router = useRouter();
    const pathname = usePathname();
    const [build, setBuild] = useState<Build | null>(null);

    const getCategoryLabel = (cat: string) => {
        switch (cat.toLowerCase()) {
            case 'solo': return tBuilds('solo');
            case 'small-scale': return tBuilds('smallScale');
            case 'pvp': return tBuilds('pvp');
            case 'zvz': return tBuilds('zvz');
            case 'large-scale': return tBuilds('largeScale');
            case 'group': return tBuilds('group');
            default: return cat.replace('-', ' ');
        }
    };
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [similarBuilds, setSimilarBuilds] = useState<Build[]>([]);
    const [estPrice, setEstPrice] = useState<number | null>(null);




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

                if (data && data.id) {
                    // Fetch similar builds
                    const allBuilds = await getBuilds(20);
                    const similar = allBuilds.filter(b => b.category === data.category && b.id !== data.id);
                    setSimilarBuilds(similar.slice(0, 3));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchBuild();
    }, [id]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                title={t('notFound')}
                backgroundImage={`/background/ao-builds.jpg`}
                description="">
                <div className="text-center py-20 flex flex-col items-center">
                    <h2 className="text-xl text-muted-foreground">{t('notFoundDesc')}</h2>
                    <Link href="/builds" className="text-amber-500 w-fit hover:underline mt-4 block">
                        {t('browseBuilds')}
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
            description={build.description}
            headerActions={undefined}
        >
            <div className=" mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <Link href={`/builds`} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" /> {t('backToBuilds')}
                    </Link>
                </div>

                {/* Header Stats */}
                <div className="bg-card/50 border border-border rounded-xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Build Info */}
                        <div className="flex items-center gap-4 border-border md:border-r pr-8">
                            <div className="text-center">
                                {estPrice !== null ? (
                                    <div className="text-2xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                                        <Coins className="h-6 w-6" />
                                        {estPrice > 1000000
                                            ? `${(estPrice / 1000000).toFixed(1)}m`
                                            : estPrice > 1000
                                                ? `${(estPrice / 1000).toFixed(1)}k`
                                                : estPrice}
                                    </div>
                                ) : (
                                    <div className="text-2xl font-bold text-muted-foreground">--</div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">{t('estCost')}</div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 sm:gap-8 border-t md:border-t-0 border-border pt-4 md:pt-0 md:pl-8 w-full md:w-auto">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />{(build.rating || 0).toFixed(1)}
                                </div>
                                <div className="text-xs text-muted-foreground">{t('ratings', { count: build.ratingCount || 0 })}</div>
                            </div>

                            <div className="text-center">
                                <div className={`text-2xl font-bold flex items-center justify-center gap-2 ${(build.likes || 0) > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    <Heart className={`h-5 w-5 ${(build.likes || 0) > 0 ? 'fill-current' : ''}`} />
                                    {build.likes || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">{t('likes')}</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                                    <Eye className="h-5 w-5 text-muted-foreground" />{build.views || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">{t('views')}</div>
                            </div>
                        </div>

                        <button
                            onClick={handleShare}
                            className="text-center group md:border-l border-border md:pl-8 transition-transform active:scale-95 cursor-pointer col-span-3 sm:col-span-1"
                        >
                            <div className="text-2xl font-bold text-muted-foreground group-hover:text-blue-400 flex items-center justify-center gap-2 transition-colors">
                                {copied ? <Check className="h-5 w-5 text-green-500" /> : <LinkIcon className="h-5 w-5" />}
                            </div>
                            <div className={`text-xs ${copied ? 'text-green-500' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                {copied ? t('copied') : t('share')}
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
                                <Shield className="h-4 w-4" /> {t('equipment')}
                            </h3>

                            <div className="space-y-4">
                                {/* List Header */}
                                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
                                    <div>{t('recommended')}</div>
                                    <div>{t('alternatives')}</div>
                                </div>

                                {/* Equipment Rows */}
                                {[
                                    { item: build.items.MainHand, label: t('roles.main') },
                                    { item: is2H ? null : build.items.OffHand, label: t('roles.off'), hidden: is2H },
                                    { item: build.items.Head, label: t('roles.head') },
                                    { item: build.items.Armor, label: t('roles.armor') },
                                    { item: build.items.Shoes, label: t('roles.shoes') },
                                    { item: build.items.Cape, label: t('roles.cape') },
                                ].map((row, idx) => !row.hidden && (
                                    <div key={idx} className="bg-muted/30 rounded-lg p-4 border border-border/50 flex items-center justify-between group hover:border-muted transition-colors">
                                        {/* Left: Recommended */}
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20">
                                                <EquipmentSlot item={row.item} label={row.label as string} showAlternatives={false} />
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-foreground">
                                                    {row.item?.Type ? (
                                                        <LocalizedItemName itemId={row.item.Type} />
                                                    ) : (
                                                        <span className="text-muted-foreground">{row.label}</span>
                                                    )}
                                                </div>
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
                                                        <EquipmentSlot item={{ Type: alt }} label={`Alt ${i + 1}`} />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-muted-foreground italic px-2 font-medium">{t('noAlternatives')}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Consumables Section */}
                            <div className="mt-8 pt-6 border-t border-border/50">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">{t('consumables')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { item: build.items.Potion, label: t('roles.potion') },
                                        { item: build.items.Food, label: t('roles.food') },
                                        { item: build.items.Mount, label: t('roles.mount') },
                                        { item: build.items.Bag, label: t('roles.bag') }
                                    ].map((row, idx) => (
                                        <div key={idx} className="bg-muted/30 rounded-lg p-3 border border-border/50 flex items-center gap-4">
                                            <div className="w-14 h-14">
                                                <EquipmentSlot item={row.item} label={row.label as string} />
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-foreground">
                                                    {row.item?.Type ? (
                                                        <LocalizedItemName itemId={row.item.Type} />
                                                    ) : (
                                                        <span className="text-muted-foreground">{row.label}</span>
                                                    )}
                                                </div>
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
                                <Zap className="h-4 w-4" /> {t('inventory')}
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
                                            <ItemIcon item={item} size={217} className="w-full h-full object-contain" alt={item.Type || 'Item'} />
                                        ) : (
                                            <div className="w-full h-full bg-muted/20"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 text-center">
                                <div className="text-xs text-muted-foreground">{t('estMarketValue')}</div>
                                <div className="text-lg font-bold text-primary">
                                    {estPrice ? `≈ ${estPrice >= 1000000 ? (estPrice / 1000000).toFixed(2) + 'm' : Math.round(estPrice / 1000) + 'k'} ${tCommon('silver')}` : t('calculating')}
                                </div>
                            </div>
                        </div>

                        {/* Build Stats (Moved here) */}
                        <div className="bg-card/50 border border-border rounded-xl p-6">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">{t('overview')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('category')}</div>
                                    <div className="font-medium text-foreground capitalize flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                                        {getCategoryLabel(build.category)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('mobility')}</div>
                                    <div className="font-medium text-foreground capitalize flex items-center gap-2">
                                        <Wind className="h-4 w-4 text-muted-foreground" />
                                        {t(`mobilityValues.${build.mobility || 'medium'}`)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t('tags')}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {build.tags && build.tags.length > 0 ? build.tags.map(tag => (
                                            <span key={tag} className="px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-md border border-border">
                                                {t(`tagOptions.${tag === 'Escape/Gathering' ? 'EscapeGathering' : tag}`)}
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
                                                <Check className="h-3 w-3" /> {t('strengths')}
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
                                                <XIcon className="h-3 w-3" /> {t('weaknesses')}
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
                        {t('summary')}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{build.description}</p>
                </div>

                {/* Full Width Detailed Guide */}
                <div className="bg-card/50 border border-border rounded-xl p-6 mb-8">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 pb-4 border-b border-border/50 flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" /> {t('detailedGuide')}
                    </h3>
                    <div data-color-mode="dark" className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground">
                        {build.longDescription ? (
                            <Markdown source={build.longDescription} style={{ background: 'transparent', color: 'inherit' }} />
                        ) : (
                            <div className="text-center py-12 text-muted-foreground italic">
                                {t('noDetailedGuide')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Full Width Video Guide */}
                {build.youtubeLink && (
                    <div className="bg-card/50 border border-border rounded-xl p-6 mb-8">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 pb-4 border-b border-border/50 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" /> {t('videoGuide')}
                        </h3>
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
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
                            {t('similarBuilds')}
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

            {/* Confirmation Dialogs */}
        </PageShell>
    );
}

function EquipmentSlot({ item, label, disabled = false, showAlternatives = true }: { item: any, label: string, disabled?: boolean, showAlternatives?: boolean }) {
    const alternatives = item?.Alternatives || [];
    const hasItem = !!item?.Type;

    if (!hasItem) return null;

    return (
        <div className="flex flex-col items-center gap-1 w-full">
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
                <ItemIcon item={item} size={217} className="w-full h-full object-contain" alt={item.Type || label} />
                {!disabled && hasItem && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded" />}
            </div>

            {/* Alternatives */}
            {!disabled && showAlternatives && alternatives.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 w-full px-1">
                    {alternatives.map((alt: string) => (
                        <div key={alt} className="w-6 h-6 bg-muted border border-border rounded overflow-hidden">
                            <ItemIcon item={{ Type: alt }} size={24} className="w-full h-full p-0.5" alt={alt} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Component to display localized item name
function LocalizedItemName({ itemId, className = "" }: { itemId: string, className?: string }) {
    const locale = useLocale();
    const [localizedName, setLocalizedName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!itemId) return;

        let id = itemId;
        // Remove enchantment for name lookup
        if (id.includes('@')) {
            id = id.split('@')[0];
        }

        getItemNameService(id, locale).then(name => {
            if (name) {
                setLocalizedName(name);
            }
            setLoading(false);
        });
    }, [itemId, locale]);

    if (loading || !localizedName) {
        return <span className={className}>{formatItemName(itemId)}</span>;
    }

    return <span className={className}>{localizedName}</span>;
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
