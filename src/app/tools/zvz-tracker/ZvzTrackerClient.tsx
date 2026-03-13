'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { Swords, Users, Skull, Trophy, Clock, RefreshCw, ChevronDown, ChevronUp, Shield, Crown, ChevronLeft, ChevronRight, Search, X, BarChart3, Share2, Info } from 'lucide-react';
import { getBattles, getBattleDetails, searchEntities, getEntityDetails, getBattleEvents } from './actions';
import { getItems } from '@/lib/item-service';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { PageShell } from '@/components/PageShell';
import { ItemIcon } from '@/components/ItemIcon';
import { Tooltip } from '@/components/ui/Tooltip';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { InfoStrip } from '@/components/InfoStrip';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/context/AuthContext';

const formatNumber = (num: number | undefined | null) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'b';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
};

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

const BattleDetailsSkeleton = () => (
    <div className="p-4 md:p-6 space-y-6 animate-pulse">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-muted/10 h-32">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                            <div className="h-3 w-16 bg-muted/20 rounded"></div>
                            <div className="h-6 w-32 bg-muted/20 rounded"></div>
                        </div>
                        <div className="space-y-2 text-right">
                             <div className="h-8 w-16 bg-muted/20 rounded ml-auto"></div>
                             <div className="h-3 w-12 bg-muted/20 rounded ml-auto"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {[1, 2, 3, 4].map(j => (
                             <div key={j} className="h-10 bg-muted/20 rounded"></div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        
        {/* Dominance Bar */}
        <div className="h-2 w-full bg-muted/20 rounded-full"></div>
        
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-9 w-24 bg-muted/20 rounded-lg shrink-0"></div>
            ))}
        </div>
        
        {/* MVP Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-muted/10 border border-border rounded-xl"></div>
            ))}
        </div>
    </div>
);

const BattleRowSkeleton = () => (
    <div className="bg-card/80 border border-border/30 rounded-xl overflow-hidden animate-pulse">
        <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-muted/20 rounded-lg h-12 w-12"></div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-32 bg-muted/20 rounded"></div>
                            <div className="h-5 w-12 bg-muted/20 rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-4 w-20 bg-muted/20 rounded"></div>
                            <div className="h-4 w-20 bg-muted/20 rounded"></div>
                            <div className="h-4 w-20 bg-muted/20 rounded"></div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex-1 md:flex-initial text-right pr-4 border-r border-border">
                        <div className="h-3 w-16 bg-muted/20 rounded ml-auto mb-1"></div>
                        <div className="h-6 w-24 bg-muted/20 rounded ml-auto"></div>
                    </div>
                    <div className="h-8 w-8 bg-muted/20 rounded-full"></div>
                    <div className="h-5 w-5 bg-muted/20 rounded"></div>
                </div>
            </div>
        </div>
    </div>
);

export default function ZvzTrackerClient() {
    const t = useTranslations('ZvzTracker');
    const tKill = useTranslations('KillFeed');
    const tk = useTranslations('KillFeed');
    const { profile } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [battles, setBattles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { server: region, setServer: setRegion } = useServer();

    const [searchQuery, setSearchQuery] = useState('');
    const [entityResults, setEntityResults] = useState<any>(null);
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Detailed View State
    const [expandedBattleId, setExpandedBattleId] = useState<number | null>(null);
    const [battleDetails, setBattleDetails] = useState<any | null>(null);
    const [battleEvents, setBattleEvents] = useState<any[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailTab, setDetailTab] = useState<'analysis' | 'players' | 'guilds' | 'alliances' | 'feed'>('analysis');
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
    const [feedLoading, setFeedLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemMap, setItemMap] = useState<Record<string, string>>({});
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        getItems().then(items => {
            const map: Record<string, string> = {};
            items.forEach(i => map[i.id] = i.name);
            setItemMap(map);
        });
    }, []);



    const ITEMS_PER_PAGE = 10;

    // Feed Pagination Effect
    useEffect(() => {
        if (expandedBattleId && detailTab === 'feed') {
            const loadEvents = async () => {
                setFeedLoading(true);
                const offset = (currentPage - 1) * ITEMS_PER_PAGE;
                const { events } = await getBattleEvents(expandedBattleId.toString(), offset, ITEMS_PER_PAGE, region);
                if (events) {
                    setBattleEvents(events);
                }
                setFeedLoading(false);
            };
            loadEvents();
        }
    }, [expandedBattleId, detailTab, currentPage, region]);

    // Main List Pagination
    const [battlesPage, setBattlesPage] = useState(1);
    const BATTLES_PER_PAGE = 10;

    const loadBattles = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        // Fetch more battles to allow for local pagination
        const { battles, error } = await getBattles(region, 50);
        if (battles) {
            // Sort by time descending (newest first)
            const sortedBattles = battles.sort((a: any, b: any) =>
                new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            );
            setBattles(sortedBattles);
        }
        if (!isBackground) setLoading(false);
    };

    useEffect(() => {
        loadBattles();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            loadBattles(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [region]);

    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setIsSearching(true);
                const { results } = await searchEntities(searchQuery, region);
                setEntityResults(results);
                setIsSearching(false);
            } else {
                setEntityResults(null);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(delaySearch);
    }, [searchQuery, region]);

    // Check for shared battle in URL
    useEffect(() => {
        const sharedBattleId = searchParams.get('battleId');
        if (sharedBattleId && !expandedBattleId && !loading) {
            const id = parseInt(sharedBattleId);
            if (!isNaN(id)) {
                const existingBattle = battles.find(b => b.id === id);
                
                if (existingBattle) {
                    handleExpandBattle(id);
                    setTimeout(() => {
                        document.getElementById(`battle-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 500);
                } else {
                    // Fetch missing battle
                    getBattleDetails(id.toString(), region).then((res) => {
                        if (res.battle) {
                            setBattles(prev => {
                                if (prev.find(b => b.id === id)) return prev;
                                const newBattles = [...prev, res.battle];
                                return newBattles.sort((a: any, b: any) =>
                                    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                                );
                            });
                        }
                    });
                }
            }
        }
    }, [battles, searchParams, expandedBattleId, loading, region]);

    // Leaderboard Logic
    const leaderboard = useMemo(() => {
        const stats: Record<string, { name: string, type: 'guild' | 'alliance', kills: number, deaths: number, fame: number, count: number }> = {};

        battles.forEach(battle => {
            // Process Guilds
            Object.values(battle.guilds || {}).forEach((guild: any) => {
                if (!stats[guild.name]) {
                    stats[guild.name] = { name: guild.name, type: 'guild', kills: 0, deaths: 0, fame: 0, count: 0 };
                }
                stats[guild.name].kills += guild.kills;
                stats[guild.name].deaths += guild.deaths;
                stats[guild.name].fame += guild.killFame;
                stats[guild.name].count++;
            });

            // Process Alliances
            Object.values(battle.alliances || {}).forEach((alliance: any) => {
                 if (!stats[alliance.name]) {
                    stats[alliance.name] = { name: alliance.name, type: 'alliance', kills: 0, deaths: 0, fame: 0, count: 0 };
                }
                stats[alliance.name].kills += alliance.kills;
                stats[alliance.name].deaths += alliance.deaths;
                stats[alliance.name].fame += alliance.killFame;
                stats[alliance.name].count++;
            });
        });

        return Object.values(stats)
            .sort((a, b) => b.fame - a.fame)
            .slice(0, 5); // Top 5
    }, [battles]);

    const handleEntityClick = async (type: 'guilds' | 'players' | 'alliances', id: string) => {
        setIsSearching(true);
        const { data } = await getEntityDetails(type, id, region);
        if (data) {
            setSelectedEntity({ ...data, type });
            // Keep search query to maintain context
        }
        setIsSearching(false);
    };

    const handleExpandBattle = async (battleId: number) => {
        if (expandedBattleId === battleId) {
            setExpandedBattleId(null);
            setBattleDetails(null);
            return;
        }

        setExpandedBattleId(battleId);
        setBattleDetails(null); // Clear previous data
        setCurrentPage(1);
        setBattleEvents([]); // Reset events

        // Scroll to battle
        setTimeout(() => {
            const element = document.getElementById(`battle-${battleId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);

        setDetailsLoading(true);

        // Fetch details and events in parallel
        const [detailsRes, eventsRes] = await Promise.all([
            getBattleDetails(battleId.toString(), region),
            getBattleEvents(battleId.toString(), 0, 50, region)
        ]);

        if (detailsRes.battle) {
            setBattleDetails(detailsRes.battle);
        }
        if (eventsRes.events) {
            setBattleEvents(eventsRes.events);
        }
        setDetailsLoading(false);
    };



    const copyBattleLink = (e: React.MouseEvent, battleId: number) => {
        e.stopPropagation();
        const params = new URLSearchParams(searchParams.toString());
        params.set('battleId', battleId.toString());
        const url = `${window.location.origin}${pathname}?${params.toString()}`;
        navigator.clipboard.writeText(url);
        // Simple feedback since we don't have a toast component
        const btn = e.currentTarget as HTMLButtonElement;
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<span class="text-success">${t('copied')}</span>`;
        setTimeout(() => {
            btn.innerHTML = originalContent;
        }, 2000);
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return tKill('secondsAgo', { n: diffInSeconds });
        if (diffInSeconds < 3600) {
            const m = Math.floor(diffInSeconds / 60);
            return m === 1 ? tKill('minuteAgo') : tKill('minutesAgo', { n: m });
        }
        if (diffInSeconds < 86400) {
            const h = Math.floor(diffInSeconds / 3600);
            return h === 1 ? tKill('hourAgo') : tKill('hoursAgo', { n: h });
        }
        const d = Math.floor(diffInSeconds / 86400);
        return d === 1 ? tKill('dayAgo') : tKill('daysAgo', { n: d });
    };

    const getBattleSides = (details: any) => {
        const alliances = details.alliances || {};
        const guilds = details.guilds || {};
        const players = details.players || {};
        const factions: any[] = [];

        // Add alliances
        Object.values(alliances).forEach((alliance: any) => {
            factions.push({
                id: alliance.id,
                name: alliance.name,
                tag: alliance.tag,
                type: 'alliance',
                kills: alliance.kills,
                deaths: alliance.deaths,
                killFame: alliance.killFame,
                participants: [] as string[],
                playerCount: 0,
                totalIp: 0,
                averageIp: 0
            });
        });

        // Process Guilds
        Object.values(guilds).forEach((guild: any) => {
            if (guild.allianceId && alliances[guild.allianceId]) {
                const faction = factions.find(f => f.id === guild.allianceId);
                if (faction) faction.participants.push(guild.name);
            } else {
                factions.push({
                    id: guild.id,
                    name: guild.name,
                    type: 'guild',
                    kills: guild.kills,
                    deaths: guild.deaths,
                    killFame: guild.killFame,
                    participants: [guild.name],
                    playerCount: 0,
                    totalIp: 0,
                    averageIp: 0
                });
            }
        });

        // Count Players per Faction & IP
        Object.values(players).forEach((player: any) => {
            const guild = guilds[player.guildId];
            if (guild) {
                let faction;
                // Check if guild belongs to an alliance faction
                if (guild.allianceId && alliances[guild.allianceId]) {
                    faction = factions.find(f => f.id === guild.allianceId);
                } else {
                    // Guild faction
                    faction = factions.find(f => f.id === guild.id);
                }
                
                if (faction) {
                    faction.playerCount++;
                    faction.totalIp += (player.averageItemPower || 0);
                }
            }
        });

        // Finalize averages
        factions.forEach(f => {
            if (f.playerCount > 0) {
                f.averageIp = Math.round(f.totalIp / f.playerCount);
            }
        });

        return factions.sort((a, b) => b.killFame - a.killFame);
    };

    const isLiveBattle = (startTime: string) => {
        return new Date(startTime).getTime() > Date.now() - 20 * 60 * 1000;
    };

    const filteredBattles = battles.filter(battle => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();

        // Search by ID
        if (battle.id.toString().includes(query)) return true;

        // Search by Guilds
        if (Object.values(battle.guilds || {}).some((g: any) => g.name.toLowerCase().includes(query))) return true;

        // Search by Alliances
        if (Object.values(battle.alliances || {}).some((a: any) => a.name.toLowerCase().includes(query))) return true;

        return false;
    });

    const liveBattles = filteredBattles.filter(b => isLiveBattle(b.startTime));
    const pastBattles = filteredBattles.filter(b => !isLiveBattle(b.startTime));

    const topKills = useMemo(() => {
        if (liveBattles.length === 0) return 0;
        return Math.max(...liveBattles.map(b => b.totalKills));
    }, [liveBattles]);

    return (
        <PageShell
            title={t('title')}
            backgroundImage='/background/ao-zvz.jpg'
            description={liveBattles.length > 0 ? t('liveDescription', { count: liveBattles.length, region: region, kills: topKills }) : t('description')}
            icon={<Swords className="h-6 w-6" />}
            headerActions={
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative group">
                        <Input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64"
                            icon={<Search className="h-4 w-4 text-muted-foreground" />}
                        />
                    </div>

                    <div className="flex gap-2">
                        <ServerSelector
                            selectedServer={region}
                            onServerChange={setRegion}
                        />
                        <button
                            onClick={() => loadBattles(false)}
                            disabled={loading}
                            className="p-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors   disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            }
        >

                {/* Leaderboard Section */}
                {!searchQuery && leaderboard.length > 0 && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-2">
                        <h2 className="text-lg font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-warning" /> {t('recentTopPerformers')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {leaderboard.map((entry, idx) => (
                                <div key={idx} className="bg-card/50 border border-border p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group hover:border-ring/50 transition-colors">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 font-black text-4xl group-hover:opacity-20 transition-opacity">
                                        #{idx + 1}
                                    </div>
                                    <div className="flex items-center gap-2 z-10">
                                        {entry.type === 'guild' ? <Shield className="h-4 w-4 text-success" /> : <Crown className="h-4 w-4 text-primary" />}
                                        <span className="font-bold text-foreground truncate" title={entry.name}>{entry.name}</span>
                                    </div>
                                    <div className="z-10 space-y-1">
                                         <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{t('fame')}</span>
                                    <Tooltip content={`${entry.fame.toLocaleString()} Fame`}>
                                        <span className="text-warning font-mono cursor-help">{formatNumber(entry.fame)}</span>
                                    </Tooltip>
                                </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">{t('kd')}</span>
                                            <span className="text-foreground font-mono">{entry.deaths > 0 ? (entry.kills / entry.deaths).toFixed(1) : '∞'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Entity Profile Modal */}
                {selectedEntity && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto  relative">
                            <button
                                onClick={() => setSelectedEntity(null)}
                                className="absolute top-4 right-4 p-2 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`p-4 rounded-xl border ${selectedEntity.type === 'guilds' ? 'bg-success/10 border-success/20 text-success' : selectedEntity.type === 'alliances' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-warning/10 border-warning/20 text-warning'}`}>
                                        {selectedEntity.type === 'guilds' ? <Shield className="h-8 w-8" /> : selectedEntity.type === 'alliances' ? <Crown className="h-8 w-8" /> : <Users className="h-8 w-8" />}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                                            {selectedEntity.Name || selectedEntity.name}
                                            {selectedEntity.Tag && <span className="text-muted-foreground text-xl">[{selectedEntity.Tag}]</span>}
                                        </h2>
                                        <div className="text-muted-foreground capitalize flex items-center gap-2">
                                            {selectedEntity.type === 'guilds' ? t('guildProfile') : selectedEntity.type === 'alliances' ? t('allianceProfile') : t('playerProfile')}
                                            {selectedEntity.AllianceId && <span className="text-muted-foreground/80">• {t('alliance')}: {selectedEntity.AllianceTag}</span>}
                                            {selectedEntity.GuildName && <span className="text-muted-foreground/80">• {t('guild')}: {selectedEntity.GuildName}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{t('totalFame')}</div>
                                        <Tooltip content={`${selectedEntity.KillFame?.toLocaleString() || 0} Fame`}>
                                            <div className="text-lg font-mono font-bold text-warning">{formatNumber(selectedEntity.KillFame)}</div>
                                        </Tooltip>
                                    </div>
                                     <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{t('kdRatio')}</div>
                                        <div className="text-lg font-mono font-bold text-foreground">
                                            {selectedEntity.DeathFame > 0 ? (selectedEntity.KillFame / selectedEntity.DeathFame).toFixed(2) : '∞'}
                                        </div>
                                    </div>
                                     <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{t('members')}</div>
                                        <div className="text-lg font-mono font-bold text-foreground">
                                            {selectedEntity.MemberCount || 'N/A'}
                                        </div>
                                    </div>
                                     <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{t('region')}</div>
                                        <div className="text-lg font-mono font-bold text-foreground uppercase">
                                            {region}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            
            <div className="space-y-4">
                {/* Live Battles */}
                {isMounted && loading && (
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="relative flex h-3 w-3">
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-muted"></span>
                            </span>
                            <div className="h-6 w-32 bg-muted/20 rounded animate-pulse"></div>
                        </div>
                        {[1, 2, 3].map(i => (
                            <BattleRowSkeleton key={i} />
                        ))}
                    </div>
                )}

                {liveBattles.length > 0 && (
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                            </span>
                            <h2 className="text-lg font-bold text-destructive uppercase tracking-wider">{t('liveBattles')}</h2>
                        </div>
                        {liveBattles.map(battle => (
                             <div key={battle.id} id={`battle-${battle.id}`} className={`bg-card/80 border ${expandedBattleId === battle.id ? 'border-destructive ring-1 ring-destructive' : 'border-destructive/30'} rounded-xl overflow-hidden transition-all duration-300 hover:border-destructive/50`}>
                                {/* Battle Header */}
                                <div 
                                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleExpandBattle(battle.id)}
                                >
                                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="p-3 bg-destructive/10 rounded-lg text-destructive">
                                                <Swords className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-foreground text-lg">{t('battle')} #{battle.id}</span>
                                                    <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full animate-pulse">{t('live')}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTimeAgo(battle.startTime)}</span>
                                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {Object.keys(battle.players || {}).length} {t('players')}</span>
                                                    <span className="flex items-center gap-1"><Skull className="h-3 w-3" /> {battle.totalKills} {tKill('kills')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <div className="flex-1 md:flex-initial text-right pr-4 border-r border-border">
                                                 <div className="text-xs text-muted-foreground uppercase">{t('totalFame')}</div>
                                                 <div className="font-mono font-bold text-warning">{formatNumber(battle.totalFame)}</div>
                                            </div>
                                            <button 
                                                onClick={(e) => copyBattleLink(e, battle.id)}
                                                className="p-2 hover:bg-background rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                                title={t('shareBattle')}
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                            {expandedBattleId === battle.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedBattleId === battle.id && (
                                    <div className="border-t border-border bg-background/50 animate-in slide-in-from-top-2">
                                        {detailsLoading ? (
                                            <BattleDetailsSkeleton />
                                        ) : battleDetails ? (
                                            <div className="p-4 md:p-6">
                                                {/* Battle Summary (Enhanced Stats) */}
                                                {getBattleSides(battleDetails).length > 0 ? (
                                                    <div className="mb-6 animate-in fade-in slide-in-from-top-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {getBattleSides(battleDetails).slice(0, 2).map((side, idx) => (
                                                            <div key={side.id} className={`p-4 rounded-xl border ${idx === 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div>
                                                                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{side.type === 'guild' ? t('guild') : t('alliance')}</div>
                                                                        <div className="text-lg font-bold flex items-center gap-2 truncate max-w-[200px]" title={side.name}>
                                                                            {side.name}
                                                                            {side.tag && <span className="text-sm font-normal text-muted-foreground">[{side.tag}]</span>}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground mt-1">
                                                                            {side.participants.slice(0, 3).join(', ')}
                                                                            {side.participants.length > 3 && ` +${side.participants.length - 3}`}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                         <div className={`text-2xl font-mono font-bold ${idx === 0 ? 'text-success' : 'text-destructive'}`}>
                                                                            {((side.killFame / (battleDetails.totalFame || 1)) * 100).toFixed(0)}%
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">{t('dominance')}</div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                                    <div className="bg-background/50 p-2 rounded">
                                                                        <div className="text-muted-foreground text-xs">{tKill('kills')}</div>
                                                                        <div className="font-mono font-bold text-success">{side.kills}</div>
                                                                    </div>
                                                                     <div className="bg-background/50 p-2 rounded">
                                                                        <div className="text-muted-foreground text-xs">{tKill('deaths')}</div>
                                                                        <div className="font-mono font-bold text-destructive">{side.deaths}</div>
                                                                    </div>
                                                                     <div className="bg-background/50 p-2 rounded">
                                                                        <div className="text-muted-foreground text-xs">{t('players')}</div>
                                                                        <div className="font-mono font-bold">{side.playerCount}</div>
                                                                    </div>
                                                                     <div className="bg-background/50 p-2 rounded">
                                                                        <div className="text-muted-foreground text-xs">{t('avgIp')}</div>
                                                                        <div className="font-mono font-bold text-warning">{side.averageIp || 'N/A'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        </div>

                                                        {/* Dominance Bar */}
                                                        {getBattleSides(battleDetails).length >= 2 && (
                                                            <div className="mt-4 flex h-2 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="bg-success transition-all duration-1000"
                                                                    style={{ width: `${(getBattleSides(battleDetails)[0].killFame / (battleDetails.totalFame || 1)) * 100}%` }}
                                                                />
                                                                <div 
                                                                    className="bg-destructive transition-all duration-1000"
                                                                    style={{ width: `${(getBattleSides(battleDetails)[1].killFame / (battleDetails.totalFame || 1)) * 100}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="p-6 text-center text-muted-foreground bg-muted/20 rounded-xl mb-6 border border-border/50">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Info className="h-6 w-6 text-muted-foreground/50" />
                                                            <p>{t('noDetails')}</p>
                                                            <p className="text-xs opacity-70">{t('recentBattleNote')}</p>
                                                        </div>
                                                    </div>

                                                )}

                                                {/* Details Tabs */}
                                                <div className="flex gap-2 mb-6 border-b border-border pb-2 overflow-x-auto">
                                                    <button 
                                                        onClick={() => setDetailTab('analysis')}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${detailTab === 'analysis' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                                    >
                                                        {t('analysis')}
                                                    </button>
                                                    <button 
                                                        onClick={() => setDetailTab('guilds')}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${detailTab === 'guilds' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                                    >
                                                        {t('guilds')} ({Object.keys(battleDetails.guilds || {}).length})
                                                    </button>
                                                    <button 
                                                        onClick={() => setDetailTab('alliances')}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${detailTab === 'alliances' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                                    >
                                                        {t('alliances')} ({Object.keys(battleDetails.alliances || {}).length})
                                                    </button>
                                                    <button 
                                                        onClick={() => setDetailTab('players')}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${detailTab === 'players' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                                    >
                                                        {t('players')} ({Object.keys(battleDetails.players || {}).length})
                                                    </button>
                                                     <button 
                                                        onClick={() => setDetailTab('feed')}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${detailTab === 'feed' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                                    >
                                                        {tKill('killFeed')}
                                                    </button>
                                                </div>

                                                {/* Tab Content */}
                                                <div className="space-y-4">
                                                    {detailTab === 'analysis' && (
                                                        <div className="space-y-6 animate-in fade-in">
                                                            {/* MVP Cards */}
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {(() => {
                                                                    const players = Object.values(battleDetails.players || {});
                                                                    const guilds = Object.values(battleDetails.guilds || {});
                                                                    
                                                                    const topFame: any = [...players].sort((a: any, b: any) => b.killFame - a.killFame)[0];
                                                                    const topKiller: any = [...players].sort((a: any, b: any) => b.kills - a.kills)[0];
                                                                    const topIp: any = [...players].sort((a: any, b: any) => (Number(b.averageItemPower) || 0) - (Number(a.averageItemPower) || 0))[0];
                                                                    
                                                                    // Guild Efficiency (Min 5 kills to qualify)
                                                                    const efficientGuilds = [...guilds]
                                                                        .filter((g: any) => g.kills >= 5)
                                                                        .sort((a: any, b: any) => {
                                                                            const kdA = a.deaths > 0 ? a.kills / a.deaths : a.kills;
                                                                            const kdB = b.deaths > 0 ? b.kills / b.deaths : b.kills;
                                                                            return kdB - kdA;
                                                                        })
                                                                        .slice(0, 6);

                                                                    return (
                                                                        <>
                                                                            {/* MVP Fame */}
                                                                            <div className="bg-card border border-border p-4 rounded-xl relative overflow-hidden group">
                                                                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                                                                    <Trophy className="h-16 w-16" />
                                                                                </div>
                                                                                <div className="relative z-10">
                                                                                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">{t('mvpFame')}</div>
                                                                                    {topFame ? (
                                                                                        <>
                                                                                            <div className="text-xl font-bold text-primary truncate">{topFame.name}</div>
                                                                                            <div className="text-sm text-muted-foreground mb-2">{topFame.guildName}</div>
                                                                                            <div className="flex justify-between items-end">
                                                                                                <div className="text-3xl font-mono font-bold text-warning">{formatNumber(topFame.killFame)}</div>
                                                                                                <div className="text-xs text-muted-foreground">{tKill('fame')}</div>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : <div className="text-muted-foreground">{tKill('noData')}</div>}
                                                                                </div>
                                                                            </div>

                                                                            {/* Top Killer */}
                                                                            <div className="bg-card border border-border p-4 rounded-xl relative overflow-hidden group">
                                                                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                                                                    <Swords className="h-16 w-16" />
                                                                                </div>
                                                                                <div className="relative z-10">
                                                                                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">{t('topKiller')}</div>
                                                                                    {topKiller ? (
                                                                                        <>
                                                                                            <div className="text-xl font-bold text-destructive truncate">{topKiller.name}</div>
                                                                                            <div className="text-sm text-muted-foreground mb-2">{topKiller.guildName}</div>
                                                                                            <div className="flex justify-between items-end">
                                                                                                <div className="text-3xl font-mono font-bold text-destructive">{topKiller.kills}</div>
                                                                                                <div className="text-xs text-muted-foreground">{tKill('kills')}</div>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : <div className="text-muted-foreground">{tKill('noData')}</div>}
                                                                                </div>
                                                                            </div>

                                                                            {/* Top Gear */}
                                                                            <div className="bg-card border border-border p-4 rounded-xl relative overflow-hidden group">
                                                                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                                                                    <Shield className="h-16 w-16" />
                                                                                </div>
                                                                                <div className="relative z-10">
                                                                                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">{t('highestIp')}</div>
                                                                                    {topIp ? (
                                                                                        <>
                                                                                            <div className="text-xl font-bold text-foreground truncate">{topIp.name}</div>
                                                                                            <div className="text-sm text-muted-foreground mb-2">{topIp.guildName}</div>
                                                                                            <div className="flex justify-between items-end">
                                                                                                <div className="text-3xl font-mono font-bold text-foreground">{Math.round(Number(topIp.averageItemPower) || 0)}</div>
                                                                                                <div className="text-xs text-muted-foreground">{tk('ip')}</div>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : <div className="text-muted-foreground">{tk('noData')}</div>}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* Efficiency Table */}
                                                                            <div className="col-span-1 md:col-span-3 mt-4">
                                                                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('deadliestGuilds')}</h3>
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                                    {efficientGuilds.map((guild: any, idx: number) => (
                                                                                        <div key={guild.id} className="bg-muted/30 border border-border/50 p-3 rounded-lg flex justify-between items-center">
                                                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                                                <div className="font-mono text-muted-foreground font-bold">#{idx + 1}</div>
                                                                                                <div className="truncate font-medium" title={guild.name}>{guild.name}</div>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-3">
                                                                                                <div className="text-right">
                                                                                                    <div className="text-xs text-muted-foreground">{tKill('kdRatio')}</div>
                                                                                                    <div className={`font-mono font-bold ${guild.deaths === 0 ? 'text-warning' : 'text-success'}`}>
                                                                                                        {guild.deaths > 0 ? (guild.kills / guild.deaths).toFixed(1) : t('perfect')}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                    {efficientGuilds.length === 0 && (
                                                                                        <div className="text-muted-foreground italic col-span-3">{t('notEnoughData')}</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {detailTab === 'guilds' && (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="text-left text-muted-foreground border-b border-border">
                                                                        <th className="pb-2 pl-2">{t('guild')}</th>
                                                                        <th className="pb-2">{t('alliance')}</th>
                                                                        <th className="pb-2 text-right">{tKill('kills')}</th>
                                                                        <th className="pb-2 text-right">{tKill('deaths')}</th>
                                                                        <th className="pb-2 text-right">{tKill('kdRatio')}</th>
                                                                        <th className="pb-2 text-right pr-2">{tKill('fame')}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {Object.values(battleDetails.guilds || {}).sort((a: any, b: any) => b.killFame - a.killFame).map((guild: any) => (
                                                                        <tr key={guild.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                                            <td className="py-2 pl-2 font-medium text-foreground cursor-pointer hover:text-primary hover:underline" onClick={() => handleEntityClick('guilds', guild.id)}>{guild.name}</td>
                                                                            <td className="py-2 text-muted-foreground">{guild.alliance}</td>
                                                                            <td className="py-2 text-right font-mono text-success">{guild.kills}</td>
                                                                            <td className="py-2 text-right font-mono text-destructive">{guild.deaths}</td>
                                                                            <td className="py-2 text-right font-mono">{guild.deaths > 0 ? (guild.kills / guild.deaths).toFixed(1) : '∞'}</td>
                                                                            <td className="py-2 text-right font-mono text-warning pr-2">{formatNumber(guild.killFame)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                     {detailTab === 'alliances' && (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="text-left text-muted-foreground border-b border-border">
                                                                        <th className="pb-2 pl-2">{t('alliance')}</th>
                                                                        <th className="pb-2">{t('tag')}</th>
                                                                        <th className="pb-2 text-right">{tKill('kills')}</th>
                                                                        <th className="pb-2 text-right">{tKill('deaths')}</th>
                                                                        <th className="pb-2 text-right">{tKill('kdRatio')}</th>
                                                                        <th className="pb-2 text-right pr-2">{tKill('fame')}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {Object.values(battleDetails.alliances || {}).sort((a: any, b: any) => b.killFame - a.killFame).map((alliance: any) => (
                                                                        <tr key={alliance.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                                            <td className="py-2 pl-2 font-medium text-foreground cursor-pointer hover:text-primary hover:underline" onClick={() => handleEntityClick('alliances', alliance.id)}>{alliance.name}</td>
                                                                            <td className="py-2 text-muted-foreground">[{alliance.tag}]</td>
                                                                            <td className="py-2 text-right font-mono text-success">{alliance.kills}</td>
                                                                            <td className="py-2 text-right font-mono text-destructive">{alliance.deaths}</td>
                                                                            <td className="py-2 text-right font-mono">{alliance.deaths > 0 ? (alliance.kills / alliance.deaths).toFixed(1) : '∞'}</td>
                                                                            <td className="py-2 text-right font-mono text-warning pr-2">{formatNumber(alliance.killFame)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                     {detailTab === 'players' && (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="text-left text-muted-foreground border-b border-border">
                                                                        <th className="pb-2 pl-2">{t('player')}</th>
                                                                        <th className="pb-2">{t('guild')}</th>
                                                                        <th className="pb-2 text-right">{tKill('kills')}</th>
                                                                        <th className="pb-2 text-right">{tKill('deaths')}</th>
                                                                        <th className="pb-2 text-right">{tk('ip')}</th>
                                                                        <th className="pb-2 text-right pr-2">{tKill('fame')}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {Object.values(battleDetails.players || {}).sort((a: any, b: any) => b.killFame - a.killFame).slice(0, 50).map((player: any) => (
                                                                        <tr key={player.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                                            <td className="py-2 pl-2 font-medium text-foreground cursor-pointer hover:text-primary hover:underline" onClick={() => handleEntityClick('players', player.id)}>{player.name}</td>
                                                                            <td className="py-2 text-muted-foreground">{player.guildName}</td>
                                                                            <td className="py-2 text-right font-mono text-success">{player.kills || 0}</td>
                                                                            <td className="py-2 text-right font-mono text-destructive">{player.deaths || 0}</td>
                                                                            <td className="py-2 text-right font-mono">{Math.round(Number(player.averageItemPower) || 0)}</td>
                                                                            <td className="py-2 text-right font-mono text-warning pr-2">{formatNumber(player.killFame)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                            {Object.keys(battleDetails.players || {}).length > 50 && (
                                                                <div className="text-center text-xs text-muted-foreground mt-4 italic">
                                                                    {t('showingTop50')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {detailTab === 'feed' && (
                                                        <div className="space-y-2">
                                                            {battleEvents.map((event: any) => (
                                                                <div key={event.EventId} className="flex items-center gap-3 p-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors text-sm">
                                                                    <div className="text-muted-foreground text-xs w-16 tabular-nums">{new Date(event.TimeStamp).toLocaleTimeString()}</div>
                                                                    <div className="flex-1 flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                                                            <span className={`font-bold truncate ${event.Killer.AllianceName ? 'text-primary' : 'text-foreground'}`}>{event.Killer.Name}</span>
                                                                            <span className="text-xs text-muted-foreground hidden sm:inline">({Math.round(Number(event.Killer.AverageItemPower) || 0)} {tk('ip')})</span>
                                                                        </div>
                                                                        
                                                                        <div className="flex flex-col items-center px-2">
                                                                             <Swords className="h-4 w-4 text-destructive" />
                                                                             <span className="text-[10px] font-mono text-warning">{formatNumber(event.TotalVictimKillFame)}</span>
                                                                        </div>

                                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                            <span className={`font-bold truncate ${event.Victim.AllianceName ? 'text-destructive' : 'text-foreground'}`}>{event.Victim.Name}</span>
                                                                            <span className="text-xs text-muted-foreground hidden sm:inline">({Math.round(Number(event.Victim.AverageItemPower) || 0)} {tk('ip')})</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-8 h-8 relative shrink-0">
                                                                         <div className="bg-muted w-full h-full rounded flex items-center justify-center text-[10px]">
                                                                             W
                                                                         </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            
                                                            {/* Pagination Controls */}
                                                            <div className="flex justify-center gap-4 mt-4">
                                                                <button 
                                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                    disabled={currentPage === 1 || feedLoading}
                                                                    className="p-1 rounded hover:bg-muted disabled:opacity-50"
                                                                >
                                                                    <ChevronLeft className="h-4 w-4" />
                                                                </button>
                                                                <span className="text-sm text-muted-foreground flex items-center">{tKill('page', { n: currentPage })}</span>
                                                                <button 
                                                                    onClick={() => setCurrentPage(p => p + 1)}
                                                                    disabled={feedLoading}
                                                                    className="p-1 rounded hover:bg-muted disabled:opacity-50"
                                                                >
                                                                    <ChevronRight className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-muted-foreground">
                                                {t('failedToLoad')}
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>
                        ))}
                    </div>
                )}

                {/* Past Battles */}
                <div className="space-y-4">
                     <h2 className="text-lg font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                         <Clock className="h-4 w-4" /> {t('recentHistory')}
                     </h2>
                    {pastBattles.map(battle => (
                         <div key={battle.id} id={`battle-${battle.id}`} className={`bg-card/50 border ${expandedBattleId === battle.id ? 'border-primary ring-1 ring-primary' : 'border-border'} rounded-xl overflow-hidden transition-all duration-300 hover:border-border/80`}>
                                {/* Battle Header */}
                                <div 
                                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleExpandBattle(battle.id)}
                                >
                                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="p-3 bg-muted rounded-lg text-muted-foreground">
                                                <Swords className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-foreground text-lg">{t('battle')} #{battle.id}</span>
                                                    <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-bold rounded-full">{t('ended')}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTimeAgo(battle.startTime)}</span>
                                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {Object.keys(battle.players || {}).length} {t('players')}</span>
                                                    <span className="flex items-center gap-1"><Skull className="h-3 w-3" /> {battle.totalKills} {t('kills')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <div className="flex-1 md:flex-initial text-right pr-4 border-r border-border">
                                                 <div className="text-xs text-muted-foreground uppercase">{t('totalFame')}</div>
                                                 <div className="font-mono font-bold text-warning">{formatNumber(battle.totalFame)}</div>
                                            </div>
                                             <button 
                                                onClick={(e) => copyBattleLink(e, battle.id)}
                                                className="p-2 hover:bg-background rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                                title={t('shareBattle')}
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                            {expandedBattleId === battle.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details - Reusing the same structure as above, ideally this should be a component */}
                                {expandedBattleId === battle.id && (
                                    <div className="border-t border-border bg-background/50 animate-in slide-in-from-top-2">
                                        {detailsLoading ? (
                                            <BattleDetailsSkeleton />
                                        ) : battleDetails ? (
                                            <div className="p-4 md:p-6">
                                                {/* Battle Summary (Enhanced Stats) */}
                                                {getBattleSides(battleDetails).length > 0 ? (
                                                    <div className="mb-6 animate-in fade-in slide-in-from-top-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {getBattleSides(battleDetails).slice(0, 2).map((side, idx) => (
                                                            <div key={side.id} className={`p-4 rounded-xl border ${idx === 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div>
                                                                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{side.type === 'guild' ? t('guild') : t('alliance')}</div>
                                                                        <div className="text-lg font-bold flex items-center gap-2 truncate max-w-[200px]" title={side.name}>
                                                                            {side.name}
                                                                            {side.tag && <span className="text-sm font-normal text-muted-foreground">[{side.tag}]</span>}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground mt-1">
                                                                            {side.participants.slice(0, 3).join(', ')}
                                                                            {side.participants.length > 3 && ` +${side.participants.length - 3}`}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                         <div className={`text-2xl font-mono font-bold ${idx === 0 ? 'text-success' : 'text-destructive'}`}>
                                                                            {((side.killFame / (battleDetails.totalFame || 1)) * 100).toFixed(0)}%
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">{t('dominance')}</div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                                    <div className="bg-background/50 p-2 rounded">
                                                                        <div className="text-muted-foreground text-xs">{tKill('kills')}</div>
                                                                        <div className="font-mono font-bold text-success">{side.kills}</div>
                                                                    </div>
                                                                     <div className="bg-background/50 p-2 rounded">
                                                                        <div className="text-muted-foreground text-xs">{tKill('deaths')}</div>
                                                                        <div className="font-mono font-bold text-destructive">{side.deaths}</div>
                                                                    </div>
                                                                     <div className="bg-background/50 p-2 rounded">
                                                                        <div className="text-muted-foreground text-xs">{t('players')}</div>
                                                                        <div className="font-mono font-bold">{side.playerCount}</div>
                                                                    </div>
                                                                     <div className="bg-background/50 p-2 rounded">
                                                                        <div className="text-muted-foreground text-xs">{t('avgIp')}</div>
                                                                        <div className="font-mono font-bold text-warning">{side.averageIp || 'N/A'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        </div>

                                                        {/* Dominance Bar */}
                                                        {getBattleSides(battleDetails).length >= 2 && (
                                                            <div className="mt-4 flex h-2 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="bg-success transition-all duration-1000"
                                                                    style={{ width: `${(getBattleSides(battleDetails)[0].killFame / (battleDetails.totalFame || 1)) * 100}%` }}
                                                                />
                                                                <div 
                                                                    className="bg-destructive transition-all duration-1000"
                                                                    style={{ width: `${(getBattleSides(battleDetails)[1].killFame / (battleDetails.totalFame || 1)) * 100}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="p-6 text-center text-muted-foreground bg-muted/20 rounded-xl mb-6 border border-border/50">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Info className="h-6 w-6 text-muted-foreground/50" />
                                                            <p>{t('noDetails')}</p>
                                                            <p className="text-xs opacity-70">{t('recentBattleNote')}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Details Tabs */}
                                                <div className="flex gap-2 mb-6 border-b border-border pb-2 overflow-x-auto">
                                                    <button 
                                                        onClick={() => setDetailTab('analysis')}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${detailTab === 'analysis' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                                    >
                                                        {t('analysis')}
                                                    </button>
                                                    <button 
                                                        onClick={() => setDetailTab('guilds')}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${detailTab === 'guilds' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                                    >
                                                        {t('guilds')} ({Object.keys(battleDetails.guilds || {}).length})
                                                    </button>
                                                    <button 
                                                        onClick={() => setDetailTab('alliances')}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${detailTab === 'alliances' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                                    >
                                                        {t('alliances')} ({Object.keys(battleDetails.alliances || {}).length})
                                                    </button>
                                                    <button 
                                                        onClick={() => setDetailTab('players')}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${detailTab === 'players' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                                    >
                                                        {t('players')} ({Object.keys(battleDetails.players || {}).length})
                                                    </button>
                                                     <button 
                                                        onClick={() => setDetailTab('feed')}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${detailTab === 'feed' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                                    >
                                                        {tKill('killFeed')}
                                                    </button>
                                                </div>

                                                {/* Tab Content */}
                                                <div className="space-y-4">
                                                    {detailTab === 'analysis' && (
                                                        <div className="space-y-6 animate-in fade-in">
                                                            {/* MVP Cards */}
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {(() => {
                                                                    const players = Object.values(battleDetails.players || {});
                                                                    const guilds = Object.values(battleDetails.guilds || {});
                                                                    
                                                                    const topFame: any = [...players].sort((a: any, b: any) => b.killFame - a.killFame)[0];
                                                                    const topKiller: any = [...players].sort((a: any, b: any) => b.kills - a.kills)[0];
                                                                    const topIp: any = [...players].sort((a: any, b: any) => (Number(b.averageItemPower) || 0) - (Number(a.averageItemPower) || 0))[0];
                                                                    
                                                                    // Guild Efficiency (Min 5 kills to qualify)
                                                                    const efficientGuilds = [...guilds]
                                                                        .filter((g: any) => g.kills >= 5)
                                                                        .sort((a: any, b: any) => {
                                                                            const kdA = a.deaths > 0 ? a.kills / a.deaths : a.kills;
                                                                            const kdB = b.deaths > 0 ? b.kills / b.deaths : b.kills;
                                                                            return kdB - kdA;
                                                                        })
                                                                        .slice(0, 6);

                                                                    return (
                                                                        <>
                                                                            {/* MVP Fame */}
                                                                            <div className="bg-card border border-border p-4 rounded-xl relative overflow-hidden group">
                                                                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                                                                    <Trophy className="h-16 w-16" />
                                                                                </div>
                                                                                <div className="relative z-10">
                                                                                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">{t('mvpFame')}</div>
                                                                                    {topFame ? (
                                                                                        <>
                                                                                            <div className="text-xl font-bold text-primary truncate">{topFame.name}</div>
                                                                                            <div className="text-sm text-muted-foreground mb-2">{topFame.guildName}</div>
                                                                                            <div className="flex justify-between items-end">
                                                                                                <div className="text-3xl font-mono font-bold text-warning">{formatNumber(topFame.killFame)}</div>
                                                                                                <div className="text-xs text-muted-foreground">{tKill('fame')}</div>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : <div className="text-muted-foreground">{tKill('noData')}</div>}
                                                                                </div>
                                                                            </div>

                                                                            {/* Top Killer */}
                                                                            <div className="bg-card border border-border p-4 rounded-xl relative overflow-hidden group">
                                                                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                                                                    <Swords className="h-16 w-16" />
                                                                                </div>
                                                                                <div className="relative z-10">
                                                                                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">{t('topKiller')}</div>
                                                                                    {topKiller ? (
                                                                                        <>
                                                                                            <div className="text-xl font-bold text-destructive truncate">{topKiller.name}</div>
                                                                                            <div className="text-sm text-muted-foreground mb-2">{topKiller.guildName}</div>
                                                                                            <div className="flex justify-between items-end">
                                                                                                <div className="text-3xl font-mono font-bold text-destructive">{topKiller.kills}</div>
                                                                                                <div className="text-xs text-muted-foreground">{tKill('kills')}</div>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : <div className="text-muted-foreground">{tKill('noData')}</div>}
                                                                                </div>
                                                                            </div>

                                                                            {/* Top Gear */}
                                                                            <div className="bg-card border border-border p-4 rounded-xl relative overflow-hidden group">
                                                                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                                                                    <Shield className="h-16 w-16" />
                                                                                </div>
                                                                                <div className="relative z-10">
                                                                                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">{t('highestIp')}</div>
                                                                                    {topIp ? (
                                                                                        <>
                                                                                            <div className="text-xl font-bold text-foreground truncate">{topIp.name}</div>
                                                                                            <div className="text-sm text-muted-foreground mb-2">{topIp.guildName}</div>
                                                                                            <div className="flex justify-between items-end">
                                                                                                <div className="text-3xl font-mono font-bold text-foreground">{Math.round(Number(topIp.averageItemPower) || 0)}</div>
                                                                                                <div className="text-xs text-muted-foreground">{tk('ip')}</div>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : <div className="text-muted-foreground">{tk('noData')}</div>}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* Efficiency Table */}
                                                                            <div className="col-span-1 md:col-span-3 mt-4">
                                                                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('deadliestGuilds')}</h3>
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                                    {efficientGuilds.map((guild: any, idx: number) => (
                                                                                        <div key={guild.id} className="bg-muted/30 border border-border/50 p-3 rounded-lg flex justify-between items-center">
                                                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                                                <div className="font-mono text-muted-foreground font-bold">#{idx + 1}</div>
                                                                                                <div className="truncate font-medium" title={guild.name}>{guild.name}</div>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-3">
                                                                                                <div className="text-right">
                                                                                                    <div className="text-xs text-muted-foreground">{tKill('kdRatio')}</div>
                                                                                                    <div className={`font-mono font-bold ${guild.deaths === 0 ? 'text-warning' : 'text-success'}`}>
                                                                                                        {guild.deaths > 0 ? (guild.kills / guild.deaths).toFixed(1) : t('perfect')}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                    {efficientGuilds.length === 0 && (
                                                                                        <div className="text-muted-foreground italic col-span-3">{t('notEnoughData')}</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {detailTab === 'guilds' && (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="text-left text-muted-foreground border-b border-border">
                                                                        <th className="pb-2 pl-2">{t('guild')}</th>
                                                                        <th className="pb-2">{t('alliance')}</th>
                                                                        <th className="pb-2 text-right">{tKill('kills')}</th>
                                                                        <th className="pb-2 text-right">{tKill('deaths')}</th>
                                                                        <th className="pb-2 text-right">{tKill('kdRatio')}</th>
                                                                        <th className="pb-2 text-right pr-2">{tKill('fame')}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {Object.values(battleDetails.guilds || {}).sort((a: any, b: any) => b.killFame - a.killFame).map((guild: any) => (
                                                                        <tr key={guild.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                                            <td className="py-2 pl-2 font-medium text-foreground cursor-pointer hover:text-primary hover:underline" onClick={() => handleEntityClick('guilds', guild.id)}>{guild.name}</td>
                                                                            <td className="py-2 text-muted-foreground">{guild.alliance}</td>
                                                                            <td className="py-2 text-right font-mono text-success">{guild.kills}</td>
                                                                            <td className="py-2 text-right font-mono text-destructive">{guild.deaths}</td>
                                                                            <td className="py-2 text-right font-mono">{guild.deaths > 0 ? (guild.kills / guild.deaths).toFixed(1) : '∞'}</td>
                                                                            <td className="py-2 text-right font-mono text-warning pr-2">{formatNumber(guild.killFame)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                     {detailTab === 'alliances' && (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="text-left text-muted-foreground border-b border-border">
                                                                        <th className="pb-2 pl-2">{t('alliance')}</th>
                                                                        <th className="pb-2">{t('tag')}</th>
                                                                        <th className="pb-2 text-right">{tKill('kills')}</th>
                                                                        <th className="pb-2 text-right">{tKill('deaths')}</th>
                                                                        <th className="pb-2 text-right">{tKill('kdRatio')}</th>
                                                                        <th className="pb-2 text-right pr-2">{tKill('fame')}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {Object.values(battleDetails.alliances || {}).sort((a: any, b: any) => b.killFame - a.killFame).map((alliance: any) => (
                                                                        <tr key={alliance.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                                            <td className="py-2 pl-2 font-medium text-foreground cursor-pointer hover:text-primary hover:underline" onClick={() => handleEntityClick('alliances', alliance.id)}>{alliance.name}</td>
                                                                            <td className="py-2 text-muted-foreground">[{alliance.tag}]</td>
                                                                            <td className="py-2 text-right font-mono text-success">{alliance.kills}</td>
                                                                            <td className="py-2 text-right font-mono text-destructive">{alliance.deaths}</td>
                                                                            <td className="py-2 text-right font-mono">{alliance.deaths > 0 ? (alliance.kills / alliance.deaths).toFixed(1) : '∞'}</td>
                                                                            <td className="py-2 text-right font-mono text-warning pr-2">{formatNumber(alliance.killFame)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                     {detailTab === 'players' && (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="text-left text-muted-foreground border-b border-border">
                                                                        <th className="pb-2 pl-2">{t('player')}</th>
                                                                        <th className="pb-2">{t('guild')}</th>
                                                                        <th className="pb-2 text-right">{tKill('kills')}</th>
                                                                        <th className="pb-2 text-right">{tKill('deaths')}</th>
                                                                        <th className="pb-2 text-right">{tk('ip')}</th>
                                                                        <th className="pb-2 text-right pr-2">{tKill('fame')}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {Object.values(battleDetails.players || {}).sort((a: any, b: any) => b.killFame - a.killFame).slice(0, 50).map((player: any) => (
                                                                        <tr key={player.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                                            <td className="py-2 pl-2 font-medium text-foreground cursor-pointer hover:text-primary hover:underline" onClick={() => handleEntityClick('players', player.id)}>{player.name}</td>
                                                                            <td className="py-2 text-muted-foreground">{player.guildName}</td>
                                                                            <td className="py-2 text-right font-mono text-success">{player.kills || 0}</td>
                                                                            <td className="py-2 text-right font-mono text-destructive">{player.deaths || 0}</td>
                                                                            <td className="py-2 text-right font-mono">{Math.round(Number(player.averageItemPower) || 0)}</td>
                                                                            <td className="py-2 text-right font-mono text-warning pr-2">{formatNumber(player.killFame)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                            {Object.keys(battleDetails.players || {}).length > 50 && (
                                                                <div className="text-center text-xs text-muted-foreground mt-4 italic">
                                                                    {t('showingTop50')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {detailTab === 'feed' && (
                                                        <div className="space-y-2">
                                                            {battleEvents.map((event: any) => (
                                                                <div key={event.EventId} className="flex items-center gap-3 p-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors text-sm">
                                                                    <div className="text-muted-foreground text-xs w-16 tabular-nums">{new Date(event.TimeStamp).toLocaleTimeString()}</div>
                                                                    <div className="flex-1 flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                                                            <span className={`font-bold truncate ${event.Killer.AllianceName ? 'text-primary' : 'text-foreground'}`}>{event.Killer.Name}</span>
                                                                            <span className="text-xs text-muted-foreground hidden sm:inline">({Math.round(Number(event.Killer.AverageItemPower) || 0)} {tk('ip')})</span>
                                                                        </div>
                                                                        
                                                                        <div className="flex flex-col items-center px-2">
                                                                             <Swords className="h-4 w-4 text-destructive" />
                                                                             <span className="text-[10px] font-mono text-warning">{formatNumber(event.TotalVictimKillFame)}</span>
                                                                        </div>

                                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                            <span className={`font-bold truncate ${event.Victim.AllianceName ? 'text-destructive' : 'text-foreground'}`}>{event.Victim.Name}</span>
                                                                            <span className="text-xs text-muted-foreground hidden sm:inline">({Math.round(Number(event.Victim.AverageItemPower) || 0)} {tk('ip')})</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-8 h-8 relative shrink-0">
                                                                         <div className="bg-muted w-full h-full rounded flex items-center justify-center text-[10px]">
                                                                             W
                                                                         </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            
                                                            {/* Pagination Controls */}
                                                            <div className="flex justify-center gap-4 mt-4">
                                                                <button 
                                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                    disabled={currentPage === 1 || feedLoading}
                                                                    className="p-1 rounded hover:bg-muted disabled:opacity-50"
                                                                >
                                                                    <ChevronLeft className="h-4 w-4" />
                                                                </button>
                                                                <span className="text-sm text-muted-foreground flex items-center">{tKill('page', { n: currentPage })}</span>
                                                                <button 
                                                                    onClick={() => setCurrentPage(p => p + 1)}
                                                                    disabled={feedLoading}
                                                                    className="p-1 rounded hover:bg-muted disabled:opacity-50"
                                                                >
                                                                    <ChevronRight className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-muted-foreground">
                                                {t('failedToLoad')}
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>
                        ))}
                </div>
            
                <InfoStrip currentPage="zvz-tracker" />
            </div>
        </PageShell>
    );
}
