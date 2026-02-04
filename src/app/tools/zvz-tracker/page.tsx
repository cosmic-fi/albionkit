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

function ZvzTrackerContent() {
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
    const [detailTab, setDetailTab] = useState<'players' | 'guilds' | 'alliances' | 'feed'>('guilds');
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
    const [feedLoading, setFeedLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemMap, setItemMap] = useState<Record<string, string>>({});

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
        if (sharedBattleId && battles.length > 0 && !expandedBattleId) {
            const id = parseInt(sharedBattleId);
            if (!isNaN(id) && battles.find(b => b.id === id)) {
                handleExpandBattle(id);
            }
        }
    }, [battles, searchParams]);

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
        btn.innerHTML = '<span class="text-success">Copied!</span>';
        setTimeout(() => {
            btn.innerHTML = originalContent;
        }, 2000);
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
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
                playerCount: 0
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
                    playerCount: 0
                });
            }
        });

        // Count Players per Faction
        Object.values(players).forEach((player: any) => {
            const guild = guilds[player.guildId];
            if (guild) {
                // Check if guild belongs to an alliance faction
                if (guild.allianceId && alliances[guild.allianceId]) {
                    const faction = factions.find(f => f.id === guild.allianceId);
                    if (faction) faction.playerCount++;
                } else {
                    // Guild faction
                    const faction = factions.find(f => f.id === guild.id);
                    if (faction) faction.playerCount++;
                }
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

    return (
        <PageShell
            title="ZvZ Tracker"
            backgroundImage='/background/ao-zvz.jpg'
            description="Track massive open-world battles and guild warfare"
            icon={<Swords className="h-6 w-6" />}
            headerActions={
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative group">
                        <Input
                            type="text"
                            placeholder="Search guild, alliance, or ID..."
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
                            className="p-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors shadow-lg shadow-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <Trophy className="h-4 w-4 text-warning" /> Recent Top Performers
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
                                    <span className="text-muted-foreground">Fame</span>
                                    <Tooltip content={`${entry.fame.toLocaleString()} Fame`}>
                                        <span className="text-warning font-mono cursor-help">{formatNumber(entry.fame)}</span>
                                    </Tooltip>
                                </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">K/D</span>
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
                        <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
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
                                            {selectedEntity.type === 'guilds' ? 'Guild' : selectedEntity.type === 'alliances' ? 'Alliance' : 'Player'} Profile
                                            {selectedEntity.AllianceId && <span className="text-muted-foreground/80">• Alliance: {selectedEntity.AllianceTag}</span>}
                                            {selectedEntity.GuildName && <span className="text-muted-foreground/80">• Guild: {selectedEntity.GuildName}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Total Fame</div>
                                        <Tooltip content={`${selectedEntity.KillFame?.toLocaleString() || 0} Fame`}>
                                            <div className="text-warning font-mono font-bold text-xl cursor-help">{formatNumber(selectedEntity.KillFame)}</div>
                                        </Tooltip>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Death Fame</div>
                                        <Tooltip content={`${selectedEntity.DeathFame?.toLocaleString() || 0} Fame`}>
                                            <div className="text-destructive font-mono font-bold text-xl cursor-help">{formatNumber(selectedEntity.DeathFame)}</div>
                                        </Tooltip>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Kills</div>
                                        {/* Note: Standard API might not return raw kills count for guild/player, mostly Fame. Checking if available. */}
                                        <div className="text-foreground font-mono font-bold text-xl">{selectedEntity.Kills !== undefined ? formatNumber(selectedEntity.Kills) : (selectedEntity.KillFame > 0 ? 'N/A' : '0')}</div>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                                        <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">K/D Ratio</div>
                                        <div className="text-foreground font-mono font-bold text-xl">
                                            {(selectedEntity.DeathFame > 0 ? ((selectedEntity.KillFame || 0) / selectedEntity.DeathFame).toFixed(2) : '∞')}
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Stats if available */}
                                {(selectedEntity.Ratio || selectedEntity.AverageItemPower) && (
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        {selectedEntity.AverageItemPower && (
                                            <div className="bg-muted/50 p-4 rounded-xl border border-border/50 flex items-center justify-between">
                                                <span className="text-muted-foreground">Average IP</span>
                                                <span className="text-foreground font-bold">{Math.round(selectedEntity.AverageItemPower)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Results Section */}
                {searchQuery && entityResults && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4">
                        <h2 className="text-lg font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                            <Search className="h-4 w-4" /> Search Results
                        </h2>

                        <div className="flex flex-wrap gap-6">
                            {/* Guilds */}
                            {entityResults.guilds && entityResults.guilds.length > 0 && (
                                <div className="flex-1 min-w-[300px] bg-card/50 border border-border rounded-xl overflow-hidden">
                                    <div className="bg-muted px-4 py-3 border-b border-border font-bold text-foreground flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-success" /> Guilds
                                    </div>
                                    <div className="divide-y divide-border max-h-60 overflow-y-auto">
                                        {entityResults.guilds.slice(0, 5).map((guild: any) => (
                                            <button
                                                key={guild.Id}
                                                onClick={() => handleEntityClick('guilds', guild.Id)}
                                                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex justify-between items-center group"
                                            >
                                                <span className="font-medium text-foreground group-hover:text-foreground truncate">
                                                    {guild.Name} <span className="text-muted-foreground text-sm">[{guild.Tag}]</span>
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-success" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Alliances */}
                            {entityResults.alliances && entityResults.alliances.length > 0 && (
                                <div className="flex-1 min-w-[300px] bg-card/50 border border-border rounded-xl overflow-hidden">
                                    <div className="bg-muted px-4 py-3 border-b border-border font-bold text-foreground flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-info" /> Alliances
                                    </div>
                                    <div className="divide-y divide-border max-h-60 overflow-y-auto">
                                        {entityResults.alliances.slice(0, 5).map((alliance: any) => (
                                            <button
                                                key={alliance.Id}
                                                onClick={() => handleEntityClick('alliances', alliance.Id)}
                                                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex justify-between items-center group"
                                            >
                                                <span className="font-medium text-foreground group-hover:text-foreground truncate">
                                                    {alliance.Name} <span className="text-muted-foreground text-sm">[{alliance.Tag}]</span>
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-info" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Players */}
                            {entityResults.players && entityResults.players.length > 0 && (
                                <div className="flex-1 min-w-[300px] bg-card/50 border border-border rounded-xl overflow-hidden">
                                    <div className="bg-muted px-4 py-3 border-b border-border font-bold text-foreground flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" /> Players
                                    </div>
                                    <div className="divide-y divide-border max-h-60 overflow-y-auto">
                                        {entityResults.players.slice(0, 5).map((player: any) => (
                                            <button
                                                key={player.Id}
                                                onClick={() => handleEntityClick('players', player.Id)}
                                                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex justify-between items-center group"
                                            >
                                                <span className="font-medium text-foreground group-hover:text-foreground truncate">
                                                    {player.Name}
                                                    {player.GuildName && <span className="text-muted-foreground text-xs ml-2 block">{player.GuildName}</span>}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="my-8 border-b border-border"></div>
                    </div>
                )}

                {loading && battles.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        Scanning battlefields...
                    </div>
                ) : filteredBattles.length === 0 && searchQuery ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <div className="flex justify-center mb-4">
                            <Search className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        No battles found matching "{searchQuery}"
                    </div>
                ) : (
                    <div className="grid gap-4">

                        {/* Live Battles Section */}
                        {liveBattles.length > 0 && (
                            <div className="mb-8 animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-destructive rounded-full animate-ping opacity-75"></div>
                                        <div className="relative h-3 w-3 bg-destructive rounded-full"></div>
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground tracking-tight">Active Battles</h2>
                                    <span className="px-2 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-full">
                                        {liveBattles.length} LIVE
                                    </span>
                                </div>

                                <div className="grid gap-4">
                                    {liveBattles.map(battle => (
                                        <div
                                            id={`battle-${battle.id}`}
                                            key={battle.id}
                                            className={`bg-card/80 rounded-xl border-2 transition-all overflow-hidden relative ${expandedBattleId === battle.id ? 'border-destructive shadow-[0_0_30px_-5px_hsl(var(--destructive)/0.3)]' : 'border-destructive/30 hover:border-destructive/60 shadow-[0_0_15px_-5px_hsl(var(--destructive)/0.1)]'}`}
                                        >
                                            {/* Live Pulse Effect Background */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 via-transparent to-transparent opacity-50 pointer-events-none" />

                                            <div
                                                className="p-6 cursor-pointer relative z-10"
                                                onClick={() => handleExpandBattle(battle.id)}
                                            >
                                                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-destructive/20 rounded-lg border border-destructive/30">
                                                            <Swords className="h-6 w-6 text-destructive animate-pulse" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-lg text-foreground flex items-center gap-2">
                                                                Battle #{battle.id}
                                                                <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-bold rounded animate-pulse shadow-lg shadow-destructive/20">LIVE</span>
                                                                {expandedBattleId === battle.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                                                                <Clock className="h-3 w-3" />
                                                                Started {formatTimeAgo(battle.startTime)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-6 text-right items-center">
                                                        <button
                                                            onClick={(e) => copyBattleLink(e, battle.id)}
                                                            className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                                            title="Share Battle Link"
                                                        >
                                                            <Share2 className="h-5 w-5" />
                                                        </button>
                                                        <div>
                                                            <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                                                                <Trophy className="h-3 w-3" /> Total Fame
                                                            </div>
                                                            <Tooltip content={`${battle.totalFame.toLocaleString()} Fame`}>
                                                                <div className="font-mono text-xl font-bold text-warning cursor-help">
                                                                    {formatNumber(battle.totalFame)}
                                                                </div>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-background/40 rounded-lg border border-destructive/20 backdrop-blur-sm">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Players</div>
                                                        <div className="flex items-center gap-2 text-foreground font-medium">
                                                            <Users className="h-4 w-4 text-muted-foreground" />
                                                            {Object.values(battle.players || {}).length}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Guilds</div>
                                                        <div className="text-foreground font-medium">
                                                            {Object.keys(battle.guilds || {}).length}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Alliances</div>
                                                        <div className="text-foreground font-medium">
                                                            {Object.keys(battle.alliances || {}).length}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top Guild</div>
                                                        <div className="text-foreground font-medium truncate">
                                                            {(Object.entries(battle.guilds || {}).sort(([, a]: any, [, b]: any) => b.killFame - a.killFame)[0]?.[1] as any)?.name || 'Unknown'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detailed Expanded View for Live Battle */}
                                            {expandedBattleId === battle.id && (
                                                <div className="border-t border-destructive/20 bg-card/50 p-6 animate-in fade-in slide-in-from-top-2 relative z-10">
                                                    {detailsLoading ? (
                                                        <div className="flex justify-center py-12">
                                                            <RefreshCw className="h-8 w-8 text-destructive animate-spin" />
                                                        </div>
                                                    ) : battleDetails ? (
                                                        (() => {
                                                            const sides = getBattleSides(battleDetails);
                                                            const winner = sides[0];
                                                            const loser = sides[1];

                                                            // Pagination Logic
                                                            const rawItems = detailTab === 'feed' ? [] : Object.entries(battleDetails[detailTab] || {}).map(([id, data]: [string, any]) => ({
                                                                ...data,
                                                                id: data.id || id
                                                            }));
                                                            const sortedItems = rawItems.sort((a: any, b: any) => b.killFame - a.killFame);

                                                            const totalPages = detailTab === 'feed'
                                                                ? Math.ceil((battleDetails.totalKills || 0) / ITEMS_PER_PAGE)
                                                                : Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
                                                            const currentItems = sortedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

                                                            return (
                                                                <div className="space-y-8">
                                                                    {/* VS Card */}
                                                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-background/40 p-8 rounded-2xl border border-destructive/30 relative overflow-hidden">
                                                                        {/* Side A (Leader) */}
                                                                        <div className="flex-1 text-center md:text-left z-10 w-full">
                                                                            <h3 className="text-2xl md:text-3xl font-black text-foreground mb-2 truncate">
                                                                                {winner?.tag && <span className="text-muted-foreground mr-2">[{winner.tag}]</span>}
                                                                                {winner?.name}
                                                                            </h3>
                                                                            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start text-sm text-muted-foreground mb-6">
                                                                                <span className={`px-2 py-0.5 rounded border ${winner?.type === 'alliance' ? 'bg-info/10 text-info border-info/20' : 'bg-success/10 text-success border-success/20'}`}>
                                                                                    {winner?.type === 'alliance' ? 'Alliance' : 'Guild'}
                                                                                </span>
                                                                                {winner?.type === 'alliance' && (
                                                                                    <>
                                                                                        <span>•</span>
                                                                                        <span>{winner?.participants?.length || 0} Guilds</span>
                                                                                    </>
                                                                                )}
                                                                                <span>•</span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <Users className="h-3 w-3" />
                                                                                    {winner?.playerCount || 0}
                                                                                </span>
                                                                                <span>•</span>
                                                                                <span className="text-warning font-bold">{formatNumber(winner?.killFame)} Fame</span>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto md:mx-0">
                                                                                <div className="bg-success/10 border border-success/20 p-3 rounded-lg text-center">
                                                                                    <div className="text-2xl font-bold text-success">{formatNumber(winner?.kills)}</div>
                                                                                    <div className="text-xs text-success/70 uppercase font-bold tracking-wider">Kills</div>
                                                                                </div>
                                                                                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-center">
                                                                                    <div className="text-2xl font-bold text-destructive">{formatNumber(winner?.deaths)}</div>
                                                                                    <div className="text-xs text-destructive/70 uppercase font-bold tracking-wider">Deaths</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* VS Badge */}
                                                                        <div className="relative z-10 shrink-0">
                                                                            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center border-4 border-destructive/40 shadow-xl ring-4 ring-destructive/10 animate-pulse">
                                                                                <span className="font-black text-destructive text-xl italic">VS</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Side B */}
                                                                        <div className="flex-1 text-center md:text-right z-10 w-full">
                                                                            {loser ? (
                                                                                <>
                                                                                    <h3 className="text-2xl md:text-3xl font-black text-muted-foreground mb-2 truncate">
                                                                                        {loser.name}
                                                                                        {loser.tag && <span className="text-muted-foreground ml-2">[{loser.tag}]</span>}
                                                                                    </h3>
                                                                                    <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end text-sm text-muted-foreground mb-6">
                                                                                        <span className="text-muted-foreground font-bold">{formatNumber(loser.killFame)} Fame</span>
                                                                                        <span>•</span>
                                                                                        <span className="flex items-center gap-1">
                                                                                            {loser.playerCount || 0}
                                                                                            <Users className="h-3 w-3" />
                                                                                        </span>
                                                                                        {loser.type === 'alliance' && (
                                                                                            <>
                                                                                                <span>•</span>
                                                                                                <span>{loser.participants?.length || 0} Guilds</span>
                                                                                            </>
                                                                                        )}
                                                                                        <span>•</span>
                                                                                        <span className={`px-2 py-0.5 rounded border ${loser.type === 'alliance' ? 'bg-info/10 text-info border-info/20' : 'bg-success/10 text-success border-success/20'}`}>
                                                                                            {loser.type === 'alliance' ? 'Alliance' : 'Guild'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto md:ml-auto md:mr-0">
                                                                                        <div className="bg-muted/30 border border-border/30 p-3 rounded-lg text-center">
                                                                                            <div className="text-2xl font-bold text-foreground">{loser.kills}</div>
                                                                                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Kills</div>
                                                                                        </div>
                                                                                        <div className="bg-muted/30 border border-border/30 p-3 rounded-lg text-center">
                                                                                            <div className="text-2xl font-bold text-foreground">{loser.deaths}</div>
                                                                                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Deaths</div>
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div className="h-full flex items-center justify-center text-muted-foreground italic border-2 border-dashed border-border rounded-lg p-8">
                                                                                    No significant opposition found
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Detailed Stats Tabs (Reused) */}
                                                                    <div>
                                                                        <div className="flex gap-2 border-b border-border pb-4 mb-6">
                                                                            <button
                                                                                onClick={() => { setDetailTab('guilds'); setCurrentPage(1); }}
                                                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${detailTab === 'guilds' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                                            >
                                                                                <Shield className="h-4 w-4" /> Guilds
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { setDetailTab('alliances'); setCurrentPage(1); }}
                                                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${detailTab === 'alliances' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                                            >
                                                                                <Crown className="h-4 w-4" /> Alliances
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { setDetailTab('players'); setCurrentPage(1); }}
                                                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${detailTab === 'players' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                                            >
                                                                                <Users className="h-4 w-4" /> Players
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { setDetailTab('feed'); setCurrentPage(1); }}
                                                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${detailTab === 'feed' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                                            >
                                                                                <Skull className="h-4 w-4" /> Kill Feed
                                                                            </button>
                                                                        </div>

                                                                        {detailTab === 'feed' ? (
                                                                            <div className="space-y-4">
                                                                                <div className="flex justify-end mb-2">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setFeedLoading(true);
                                                                                            setBattleEvents([]);
                                                                                            const load = async () => {
                                                                                                if (expandedBattleId) {
                                                                                                    const { events } = await getBattleEvents(expandedBattleId.toString(), 0, ITEMS_PER_PAGE, region);
                                                                                                    if (events) setBattleEvents(events);
                                                                                                    setFeedLoading(false);
                                                                                                }
                                                                                            };
                                                                                            load();
                                                                                        }}
                                                                                        className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                                                                                    >
                                                                                        <RefreshCw className={`h-3 w-3 ${feedLoading ? 'animate-spin' : ''}`} /> Refresh Feed
                                                                                    </button>
                                                                                </div>

                                                                                {feedLoading ? (
                                                                                    <div className="flex justify-center py-12">
                                                                                        <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
                                                                                    </div>
                                                                                ) : (!battleEvents || battleEvents.length === 0) ? (
                                                                                    <div className="text-center py-12 text-muted-foreground italic flex flex-col items-center gap-2">
                                                                                        <span>No kill events found for this battle.</span>
                                                                                        <span className="text-xs">The API might be delayed or incomplete.</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="bg-card rounded-xl overflow-hidden border border-border">
                                                                                        <div className="divide-y divide-border">
                                                                                            {battleEvents.map((event: any) => (
                                                                                                <div key={event.EventId} className="group">
                                                                                                    <div
                                                                                                        className={`p-4 flex flex-col md:flex-row items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer ${expandedEventId === event.EventId ? 'bg-muted/80' : ''}`}
                                                                                                        onClick={() => setExpandedEventId(expandedEventId === event.EventId ? null : event.EventId)}
                                                                                                    >
                                                                                                        {/* Time */}
                                                                                                        <div className="text-sm text-muted-foreground font-mono whitespace-nowrap w-20">
                                                                                                            {new Date(event.TimeStamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                                                        </div>

                                                                                                        {/* Killer */}
                                                                                                        <div className="flex-1 flex items-center justify-end gap-3 text-right">
                                                                                                            <div className="flex flex-col items-end">
                                                                                                                <span className="font-bold text-foreground group-hover:text-destructive transition-colors">{event.Killer.Name}</span>
                                                                                                                <span className="text-xs text-muted-foreground">{event.Killer.GuildName || 'No Guild'}</span>
                                                                                                            </div>
                                                                                                            <div className="relative">
                                                                                                                {event.Killer.Equipment?.MainHand ? (
                                                                                                                    <Tooltip content={formatItemName(event.Killer.Equipment.MainHand.Type)}>
                                                                                                                        <ItemIcon item={event.Killer.Equipment.MainHand} className="w-10 h-10 object-contain p-1" />
                                                                                                                    </Tooltip>
                                                                                                                ) : (
                                                                                                                    <div className="w-10 h-10 bg-muted/50 rounded flex items-center justify-center">
                                                                                                                        <Swords className="h-4 w-4 text-muted-foreground" />
                                                                                                                    </div>
                                                                                                                )}
                                                                                                                <div className="absolute -bottom-1 -right-1 bg-card text-[10px] px-1 rounded border border-border text-muted-foreground">
                                                                                                                    {Math.round(event.Killer.AverageItemPower)}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>

                                                                                                        {/* Action Icon */}
                                                                                                        <div className="px-2 text-muted-foreground">
                                                                                                            <Swords className="h-5 w-5" />
                                                                                                        </div>

                                                                                                        {/* Victim */}
                                                                                                        <div className="flex-1 flex items-center gap-3">
                                                                                                            <div className="relative">
                                                                                                                {event.Victim.Equipment?.MainHand ? (
                                                                                                                    <Tooltip content={formatItemName(event.Victim.Equipment.MainHand.Type)}>
                                                                                                                        <ItemIcon item={event.Victim.Equipment.MainHand} className="w-10 h-10 object-contain grayscale p-1" />
                                                                                                                    </Tooltip>
                                                                                                                ) : (
                                                                                                                    <div className="w-10 h-10 bg-muted/50 rounded flex items-center justify-center">
                                                                                                                        <Skull className="h-4 w-4 text-muted-foreground" />
                                                                                                                    </div>
                                                                                                                )}
                                                                                                                <div className="absolute -bottom-1 -right-1 bg-card text-[10px] px-1 rounded border border-border text-muted-foreground">
                                                                                                                    {Math.round(event.Victim.AverageItemPower)}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                            <div className="flex flex-col">
                                                                                                                <span className="font-bold text-muted-foreground decoration-muted-foreground/50 line-through decoration-2">{event.Victim.Name}</span>
                                                                                                                <span className="text-xs text-muted-foreground">{event.Victim.GuildName || 'No Guild'}</span>
                                                                                                            </div>
                                                                                                        </div>

                                                                                                        {/* Fame */}
                                                                                                        <div className="text-right min-w-[80px]">
                                                                                                            <div className="text-warning font-bold font-mono">+{formatNumber(event.TotalVictimKillFame)}</div>
                                                                                                            <div className="text-xs text-muted-foreground">Fame</div>
                                                                                                        </div>

                                                                                                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedEventId === event.EventId ? 'rotate-180' : ''}`} />
                                                                                                    </div>

                                                                                                    {/* Expanded Details */}
                                                                                                    {expandedEventId === event.EventId && (
                                                                                                        <div className="bg-background/50 p-4 border-t border-border text-sm animate-in slide-in-from-top-2">
                                                                                                            <div className="flex flex-col gap-6">
                                                                                                                {/* Participants Table */}
                                                                                                                <div>
                                                                                                                    <h4 className="text-muted-foreground font-bold uppercase text-xs mb-3 flex items-center gap-2">
                                                                                                                        <Users className="h-3 w-3" /> Participants ({event.Participants?.length || 0})
                                                                                                                    </h4>
                                                                                                                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                                                                                                                        <table className="w-full text-left text-sm">
                                                                                                                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                                                                                                                                <tr>
                                                                                                                                    <th className="px-4 py-2">Player</th>
                                                                                                                                    <th className="px-4 py-2">Loadout</th>
                                                                                                                                    <th className="px-4 py-2 text-center">IP</th>
                                                                                                                                    <th className="px-4 py-2 text-right">Damage</th>
                                                                                                                                    <th className="px-4 py-2 text-right">Healing</th>
                                                                                                                                </tr>
                                                                                                                            </thead>
                                                                                                                            <tbody className="divide-y divide-border/50">
                                                                                                                                {event.Participants?.map((p: any, i: number) => (
                                                                                                                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                                                                                                                        <td className="px-4 py-2">
                                                                                                                                            <div className="font-medium text-foreground">{p.Name}</div>
                                                                                                                                            {p.GuildName && <div className="text-xs text-muted-foreground">{p.GuildName}</div>}
                                                                                                                                        </td>
                                                                                                                                        <td className="px-4 py-2">
                                                                                                                                            <div className="flex items-center gap-1">
                                                                                                                                                {/* Main Hand */}
                                                                                                                                                {p.Equipment?.MainHand && (
                                                                                                                                                    <Tooltip content={formatItemName(p.Equipment.MainHand.Type)}>
                                                                                                                                                        <div className="w-8 h-8 bg-muted/50 rounded border border-border/50 p-0.5">
                                                                                                                                                            <ItemIcon item={p.Equipment.MainHand} className="w-full h-full object-contain" />
                                                                                                                                                        </div>
                                                                                                                                                    </Tooltip>
                                                                                                                                                )}
                                                                                                                                                {/* Off Hand */}
                                                                                                                                                {p.Equipment?.OffHand && (
                                                                                                                                                    <Tooltip content={formatItemName(p.Equipment.OffHand.Type)}>
                                                                                                                                                        <div className="w-8 h-8 bg-muted/50 rounded border border-border/50 p-0.5">
                                                                                                                                                            <ItemIcon item={p.Equipment.OffHand} className="w-full h-full object-contain" />
                                                                                                                                                        </div>
                                                                                                                                                    </Tooltip>
                                                                                                                                                )}
                                                                                                                                            </div>
                                                                                                                                        </td>
                                                                                                                                        <td className="px-4 py-2 text-center text-muted-foreground font-mono">
                                                                                                                                            {Math.round(p.AverageItemPower)}
                                                                                                                                        </td>
                                                                                                                                        <td className="px-4 py-2 text-right">
                                                                                                                                            {p.DamageDone > 0 ? (
                                                                                                                                                <span className="text-destructive font-mono">{formatNumber(p.DamageDone)}</span>
                                                                                                                                            ) : <span className="text-muted-foreground/60">-</span>}
                                                                                                                                        </td>
                                                                                                                                        <td className="px-4 py-2 text-right">
                                                                                                                                            {p.SupportHealingDone > 0 ? (
                                                                                                                                                <span className="text-success font-mono">{formatNumber(p.SupportHealingDone)}</span>
                                                                                                                                            ) : <span className="text-muted-foreground/60">-</span>}
                                                                                                                                        </td>
                                                                                                                                    </tr>
                                                                                                                                ))}
                                                                                                                            </tbody>
                                                                                                                        </table>
                                                                                                                    </div>
                                                                                                                </div>

                                                                                                                {/* Summary Stats */}
                                                                                                                <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
                                                                                                                    <div className="flex-1 min-w-[140px] bg-card/50 p-3 rounded-lg border border-border">
                                                                                                                        <div className="text-muted-foreground text-xs uppercase mb-1">Total Damage</div>
                                                                                                                        <div className="text-destructive font-mono font-bold text-lg">
                                                                                                                            {formatNumber(event.Participants?.reduce((acc: number, p: any) => acc + (p.DamageDone || 0), 0))}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                    <div className="flex-1 min-w-[140px] bg-card/50 p-3 rounded-lg border border-border">
                                                                                                                        <div className="text-muted-foreground text-xs uppercase mb-1">Total Healing</div>
                                                                                                                        <div className="text-success font-mono font-bold text-lg">
                                                                                                                            {formatNumber(event.Participants?.reduce((acc: number, p: any) => acc + (p.SupportHealingDone || 0), 0))}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                    <div className="flex-1 min-w-[200px] flex items-end">
                                                                                                                        <button
                                                                                                                            onClick={(e) => {
                                                                                                                                e.stopPropagation();
                                                                                                                                navigator.clipboard.writeText(`https://albiononline.com/killboard/kill/${event.EventId}`);
                                                                                                                                const btn = e.currentTarget;
                                                                                                                                const original = btn.innerHTML;
                                                                                                                                btn.innerHTML = '<span class="text-success">Copied!</span>';
                                                                                                                                setTimeout(() => btn.innerHTML = original, 2000);
                                                                                                                            }}
                                                                                                                            className="w-full py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors text-xs flex items-center justify-center gap-2 h-full"
                                                                                                                        >
                                                                                                                            <Share2 className="h-4 w-4" /> Copy Official Killboard Link
                                                                                                                        </button>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            /* Leaderboard Table (Reused logic) */
                                                                            <div className="bg-card rounded-xl overflow-hidden border border-border">
                                                                                <table className="w-full text-left text-sm">
                                                                                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                                                                                        <tr>
                                                                                            <th className="px-6 py-4">Rank</th>
                                                                                            <th className="px-6 py-4">{detailTab === 'players' ? 'Name' : 'Name'}</th>
                                                                                            <th className="px-6 py-4 text-right">Kills</th>
                                                                                            <th className="px-6 py-4 text-right">Deaths</th>
                                                                                            <th className="px-6 py-4 text-right">Fame</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-border">
                                                                                        {currentItems.map((item: any, index: number) => {
                                                                                            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                                                                                            return (
                                                                                                <tr
                                                                                                    key={globalIndex}
                                                                                                    onClick={() => handleEntityClick(detailTab as 'players' | 'guilds' | 'alliances', item.id)}
                                                                                                    className="hover:bg-muted/50 transition-colors cursor-pointer group"
                                                                                                >
                                                                                                    <td className="px-6 py-4 text-muted-foreground font-mono">#{globalIndex + 1}</td>
                                                                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            {globalIndex < 3 && <Trophy className={`h-4 w-4 ${globalIndex === 0 ? 'text-warning' : globalIndex === 1 ? 'text-muted-foreground' : 'text-warning/70'}`} />}
                                                                                                            <span className="group-hover:text-foreground transition-colors">
                                                                                                                {item.name || item.Name}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="px-6 py-4 text-right text-muted-foreground">{formatNumber(item.kills)}</td>
                                                                                                    <td className="px-6 py-4 text-right text-muted-foreground">{formatNumber(item.deaths)}</td>
                                                                                                    <td className="px-6 py-4 text-right font-mono text-warning font-bold">{formatNumber(item.killFame)}</td>
                                                                                                </tr>
                                                                                            );
                                                                                        })}
                                                                                    </tbody>
                                                                                </table>
                                                                                {rawItems.length === 0 && (
                                                                                    <div className="text-center py-12 text-muted-foreground italic">
                                                                                        No {detailTab} data available for this battle.
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Pagination Controls */}
                                                                        {totalPages > 1 && (
                                                                            <div className="flex items-center justify-between mt-4 px-2 border-t border-border/50 pt-4">
                                                                                <button
                                                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                                    disabled={currentPage === 1}
                                                                                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                                                                >
                                                                                    <ChevronLeft className="h-4 w-4" /> Previous
                                                                                </button>

                                                                                <div className="text-sm text-muted-foreground font-medium">
                                                                                    Page <span className="text-foreground">{currentPage}</span> of <span className="text-foreground">{totalPages}</span>
                                                                                </div>

                                                                                <button
                                                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                                    disabled={currentPage === totalPages}
                                                                                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                                                                >
                                                                                    Next <ChevronRight className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()
                                                    ) : (
                                                        <div className="text-center text-destructive py-8">Failed to load battle details</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Battles Header */}
                        {pastBattles.length > 0 && liveBattles.length > 0 && (
                            <h2 className="text-lg font-bold text-muted-foreground mt-8 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Recent History
                            </h2>
                        )}

                        {pastBattles
                            .slice((battlesPage - 1) * BATTLES_PER_PAGE, battlesPage * BATTLES_PER_PAGE)
                            .map((battle) => (
                                <div
                                    id={`battle-${battle.id}`}
                                    key={battle.id}
                                    className={`bg-card/50 rounded-lg border transition-all overflow-hidden ${expandedBattleId === battle.id ? 'border-destructive/50 ring-1 ring-destructive/20' : 'border-border hover:border-destructive/30'}`}
                                >
                                    <div
                                        className="p-6 cursor-pointer"
                                        onClick={() => handleExpandBattle(battle.id)}
                                    >
                                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                                                    <Swords className="h-6 w-6 text-destructive" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-lg text-foreground flex items-center gap-2">
                                                        Battle #{battle.id}
                                                        {new Date(battle.startTime).getTime() > Date.now() - 20 * 60 * 1000 && (
                                                            <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-bold rounded animate-pulse">LIVE</span>
                                                        )}
                                                        {expandedBattleId === battle.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTimeAgo(battle.startTime)}
                                                        <span className="text-muted-foreground/60">•</span>
                                                        <span>{new Date(battle.startTime).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-6 text-right items-center">
                                                <button
                                                    onClick={(e) => copyBattleLink(e, battle.id)}
                                                    className="p-2 hover:bg-secondary/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Share Battle Link"
                                                >
                                                    <Share2 className="h-5 w-5" />
                                                </button>
                                                <div>
                                                    <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                                                        <Trophy className="h-3 w-3" /> Total Fame
                                                    </div>
                                                    <div className="font-mono text-xl font-bold text-warning">
                                                        {formatNumber(battle.totalFame)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                                                        <Skull className="h-3 w-3" /> Kills
                                                    </div>
                                                    <div className="font-mono text-xl font-bold text-destructive">
                                                        {formatNumber(battle.totalKills)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Players Involved</div>
                                                <div className="flex items-center gap-2 text-foreground font-medium">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {Object.values(battle.players || {}).length} Players
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Guilds</div>
                                                <div className="text-foreground font-medium">
                                                    {Object.keys(battle.guilds || {}).length} Guilds
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Alliances</div>
                                                <div className="text-foreground font-medium">
                                                    {Object.keys(battle.alliances || {}).length} Alliances
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top Guild</div>
                                                <div className="text-foreground font-medium truncate">
                                                    {(Object.entries(battle.guilds || {}).sort(([, a]: any, [, b]: any) => b.killFame - a.killFame)[0]?.[1] as any)?.name || 'Unknown'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Expanded View */}
                                    {expandedBattleId === battle.id && (
                                        <div className="border-t border-border/50 bg-background/50 p-6 animate-in fade-in slide-in-from-top-2">
                                            {detailsLoading && !battleDetails ? (
                                                <div className="flex justify-center py-12">
                                                    <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
                                                </div>
                                            ) : battleDetails ? (
                                                (() => {
                                                    const sides = getBattleSides(battleDetails);
                                                    const winner = sides[0];
                                                    const loser = sides[1];

                                                    // Top Stats Calculation
                                                    const topStats = (() => {
                                                        const players = Object.values(battleDetails.players || {});
                                                        // Note: We use type assertion because typescript doesn't know the structure of player object
                                                        const topKiller = [...players].sort((a: any, b: any) => b.kills - a.kills)[0] as any;
                                                        const topDeathFame = [...players].sort((a: any, b: any) => b.deathFame - a.deathFame)[0] as any;

                                                        const damageMap: Record<string, number> = {};
                                                        const healMap: Record<string, number> = {};

                                                        battleEvents.forEach((event: any) => {
                                                            if (event.Participants) {
                                                                event.Participants.forEach((p: any) => {
                                                                    if (p.DamageDone) damageMap[p.Name] = (damageMap[p.Name] || 0) + p.DamageDone;
                                                                    if (p.SupportHealingDone) healMap[p.Name] = (healMap[p.Name] || 0) + p.SupportHealingDone;
                                                                });
                                                            }
                                                        });

                                                        const topDamageName = Object.keys(damageMap).sort((a, b) => damageMap[b] - damageMap[a])[0];
                                                        const topHealName = Object.keys(healMap).sort((a, b) => healMap[b] - healMap[a])[0];

                                                        return {
                                                            topKiller: topKiller ? { name: topKiller.name, value: topKiller.kills, guild: battleDetails.guilds[topKiller.guildId]?.name } : null,
                                                            topDeathFame: topDeathFame ? { name: topDeathFame.name, value: topDeathFame.deathFame, guild: battleDetails.guilds[topDeathFame.guildId]?.name } : null,
                                                            topDamage: topDamageName ? { name: topDamageName, value: damageMap[topDamageName] } : null,
                                                            topHeal: topHealName ? { name: topHealName, value: healMap[topHealName] } : null
                                                        };
                                                    })();

                                                    // Pagination Logic
                                                    const rawItems = detailTab === 'feed' ? [] : Object.entries(battleDetails[detailTab] || {}).map(([id, data]: [string, any]) => ({
                                                        ...data,
                                                        id: data.id || id
                                                    }));
                                                    const sortedItems = rawItems.sort((a: any, b: any) => b.killFame - a.killFame);

                                                    const totalPages = detailTab === 'feed'
                                                        ? Math.ceil((battleDetails.totalKills || 0) / ITEMS_PER_PAGE)
                                                        : Math.ceil(sortedItems.length / ITEMS_PER_PAGE);

                                                    const currentItems = sortedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

                                                    return (
                                                        <div className="space-y-8">
                                                            {/* Match Result Header */}
                                                            <div className="relative">
                                                                <div className="text-center mb-6">
                                                                    <div className="inline-block px-6 py-2 bg-warning/10 border border-warning/20 rounded-full">
                                                                        <span className="text-warning font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                                                            <Crown className="h-4 w-4" />
                                                                            Victory for {winner?.name || 'Unknown'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* VS Card */}
                                                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-background/50 p-8 rounded-2xl border border-border relative overflow-hidden">

                                                                    {/* Side A (Winner) */}
                                                                    <div className="flex-1 text-center md:text-left z-10 w-full">
                                                                        <h3 className="text-2xl md:text-3xl font-black text-foreground mb-2 truncate">
                                                                            {winner?.tag && <span className="text-muted-foreground mr-2">[{winner.tag}]</span>}
                                                                            {winner?.name}
                                                                        </h3>
                                                                        <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start text-sm text-muted-foreground mb-6">
                                                                            <span className={`px-2 py-0.5 rounded border ${winner?.type === 'alliance' ? 'bg-info/10 text-info border-info/20' : 'bg-success/10 text-success border-success/20'}`}>
                                                                                {winner?.type === 'alliance' ? 'Alliance' : 'Guild'}
                                                                            </span>
                                                                            {winner?.type === 'alliance' && (
                                                                                <>
                                                                                    <span>•</span>
                                                                                    <span>{winner?.participants?.length || 0} Guilds</span>
                                                                                </>
                                                                            )}
                                                                            <span>•</span>
                                                                            <span className="flex items-center gap-1">
                                                                                <Users className="h-3 w-3" />
                                                                                {winner?.playerCount || 0}
                                                                            </span>
                                                                            <span>•</span>
                                                                            <span className="text-warning font-bold">{formatNumber(winner?.killFame)} Fame</span>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto md:mx-0">
                                                                            <div className="bg-success/10 border border-success/20 p-3 rounded-lg text-center">
                                                                                <div className="text-2xl font-bold text-success">{formatNumber(winner?.kills)}</div>
                                                                                <div className="text-xs text-success/70 uppercase font-bold tracking-wider">Kills</div>
                                                                            </div>
                                                                            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-center">
                                                                                <div className="text-2xl font-bold text-destructive">{formatNumber(winner?.deaths)}</div>
                                                                                <div className="text-xs text-destructive/70 uppercase font-bold tracking-wider">Deaths</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* VS Badge */}
                                                                    <div className="relative z-10 shrink-0">
                                                                        <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center border-4 border-background shadow-xl ring-4 ring-card/50">
                                                                            <span className="font-black text-muted-foreground text-xl italic">VS</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Side B (Loser) */}
                                                                    <div className="flex-1 text-center md:text-right z-10 w-full">
                                                                        {loser ? (
                                                                            <>
                                                                                <h3 className="text-2xl md:text-3xl font-black text-muted-foreground mb-2 truncate">
                                                                                    {loser.name}
                                                                                    {loser.tag && <span className="text-muted-foreground/60 ml-2">[{loser.tag}]</span>}
                                                                                </h3>
                                                                                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end text-sm text-muted-foreground mb-6">
                                                                                    <span className="text-muted-foreground/60 font-bold">{formatNumber(loser.killFame)} Fame</span>
                                                                                    <span>•</span>
                                                                                    <span className="flex items-center gap-1">
                                                                                        {loser.playerCount || 0}
                                                                                        <Users className="h-3 w-3" />
                                                                                    </span>
                                                                                    {loser.type === 'alliance' && (
                                                                                        <>
                                                                                            <span>•</span>
                                                                                            <span>{loser.participants?.length || 0} Guilds</span>
                                                                                        </>
                                                                                    )}
                                                                                    <span>•</span>
                                                                                    <span className={`px-2 py-0.5 rounded border ${loser.type === 'alliance' ? 'bg-info/10 text-info border-info/20' : 'bg-success/10 text-success border-success/20'}`}>
                                                                                        {loser.type === 'alliance' ? 'Alliance' : 'Guild'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto md:ml-auto md:mr-0">
                                                                                    <div className="bg-muted/30 border border-border/30 p-3 rounded-lg text-center">
                                                                                        <div className="text-2xl font-bold text-muted-foreground">{formatNumber(loser.kills)}</div>
                                                                                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Kills</div>
                                                                                    </div>
                                                                                    <div className="bg-muted/30 border border-border/30 p-3 rounded-lg text-center">
                                                                                        <div className="text-2xl font-bold text-muted-foreground">{formatNumber(loser.deaths)}</div>
                                                                                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Deaths</div>
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <div className="h-full flex items-center justify-center text-muted-foreground/60 italic border-2 border-dashed border-border rounded-lg p-8">
                                                                                No significant opposition found
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Background Effects */}
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-warning/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                                                                </div>
                                                            </div>


                                                            {/* Top Stats Grid */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                                <div className="bg-card/50 p-4 rounded-lg border border-border">
                                                                    <div className="text-muted-foreground text-sm mb-1">Top Kills</div>
                                                                    {topStats?.topKiller ? (
                                                                        <div>
                                                                            <div className="text-lg font-bold text-destructive truncate" title={topStats.topKiller.name}>{topStats.topKiller.name}</div>
                                                                            <div className="text-xs text-muted-foreground truncate" title={topStats.topKiller.guild}>{topStats.topKiller.guild}</div>
                                                                            <div className="text-2xl font-bold mt-1">{topStats.topKiller.value}</div>
                                                                        </div>
                                                                    ) : <div className="text-muted-foreground">-</div>}
                                                                </div>
                                                                <div className="bg-card/50 p-4 rounded-lg border border-border">
                                                                    <div className="text-muted-foreground text-sm mb-1">Top Heal (Recent)</div>
                                                                    {topStats?.topHeal ? (
                                                                        <div>
                                                                            <div className="text-lg font-bold text-success truncate" title={topStats.topHeal.name}>{topStats.topHeal.name}</div>
                                                                            <div className="text-2xl font-bold mt-1">{formatNumber(topStats.topHeal.value)}</div>
                                                                        </div>
                                                                    ) : <div className="text-muted-foreground">-</div>}
                                                                </div>
                                                                <div className="bg-card/50 p-4 rounded-lg border border-border">
                                                                    <div className="text-muted-foreground text-sm mb-1">Top Damage (Recent)</div>
                                                                    {topStats?.topDamage ? (
                                                                        <div>
                                                                            <div className="text-lg font-bold text-warning truncate" title={topStats.topDamage.name}>{topStats.topDamage.name}</div>
                                                                            <div className="text-2xl font-bold mt-1">{formatNumber(topStats.topDamage.value)}</div>
                                                                        </div>
                                                                    ) : <div className="text-muted-foreground">-</div>}
                                                                </div>
                                                                <div className="bg-card/50 p-4 rounded-lg border border-border">
                                                                    <div className="text-muted-foreground text-sm mb-1">Top Death Fame</div>
                                                                    {topStats?.topDeathFame ? (
                                                                        <div>
                                                                            <div className="text-lg font-bold text-warning truncate" title={topStats.topDeathFame.name}>{topStats.topDeathFame.name}</div>
                                                                            <div className="text-xs text-muted-foreground truncate" title={topStats.topDeathFame.guild}>{topStats.topDeathFame.guild}</div>
                                                                            <div className="text-2xl font-bold mt-1">{formatNumber(topStats.topDeathFame.value)}</div>
                                                                        </div>
                                                                    ) : <div className="text-muted-foreground">-</div>}
                                                                </div>
                                                            </div>

                                                            {/* Detailed Stats Tabs */}
                                                            <div>
                                                                <div className="flex gap-2 border-b border-border pb-4 mb-6 overflow-x-auto">
                                                                    <button
                                                                        onClick={() => { setDetailTab('guilds'); setCurrentPage(1); }}
                                                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${detailTab === 'guilds' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                                    >
                                                                        <Shield className="h-4 w-4" /> Guilds
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setDetailTab('alliances'); setCurrentPage(1); }}
                                                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${detailTab === 'alliances' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                                    >
                                                                        <Crown className="h-4 w-4" /> Alliances
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setDetailTab('players'); setCurrentPage(1); }}
                                                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${detailTab === 'players' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                                    >
                                                                        <Users className="h-4 w-4" /> Players
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setDetailTab('feed'); setCurrentPage(1); }}
                                                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${detailTab === 'feed' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                                    >
                                                                        <Skull className="h-4 w-4" /> Kill Feed
                                                                    </button>
                                                                </div>



                                                                {detailTab === 'feed' ? (
                                                                    <div className="space-y-4">
                                                                        <div className="flex justify-end mb-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setFeedLoading(true);
                                                                                    setBattleEvents([]);
                                                                                    const load = async () => {
                                                                                        if (expandedBattleId) {
                                                                                            const { events } = await getBattleEvents(expandedBattleId.toString(), 0, ITEMS_PER_PAGE, region);
                                                                                            if (events) setBattleEvents(events);
                                                                                            setFeedLoading(false);
                                                                                        }
                                                                                    };
                                                                                    load();
                                                                                }}
                                                                                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                                                                            >
                                                                                <RefreshCw className={`h-3 w-3 ${feedLoading ? 'animate-spin' : ''}`} /> Refresh Feed
                                                                            </button>
                                                                        </div>

                                                                        {feedLoading ? (
                                                                            <div className="flex justify-center py-12">
                                                                                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
                                                                            </div>
                                                                        ) : (!battleEvents || battleEvents.length === 0) ? (
                                                                            <div className="text-center py-12 text-muted-foreground italic flex flex-col items-center gap-2">
                                                                                <span>No kill events found for this battle.</span>
                                                                                <span className="text-xs">The API might be delayed or incomplete.</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="bg-card rounded-xl overflow-hidden border border-border">
                                                                                <div className="divide-y divide-border">
                                                                                    {battleEvents.map((event: any) => (
                                                                                        <div key={event.EventId} className="group">
                                                                                            <div
                                                                                                className={`p-4 flex flex-col md:flex-row items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer ${expandedEventId === event.EventId ? 'bg-muted/80' : ''}`}
                                                                                                onClick={() => setExpandedEventId(expandedEventId === event.EventId ? null : event.EventId)}
                                                                                            >
                                                                                                {/* Time */}
                                                                                                <div className="text-sm text-muted-foreground font-mono whitespace-nowrap w-20">
                                                                                                    {new Date(event.TimeStamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                                                </div>

                                                                                                {/* Killer */}
                                                                                                <div className="flex-1 flex items-center justify-end gap-3 text-right">
                                                                                                    <div className="flex flex-col items-end">
                                                                                                        <span className="font-bold text-foreground group-hover:text-destructive transition-colors">{event.Killer.Name}</span>
                                                                                                        <span className="text-xs text-muted-foreground">{event.Killer.GuildName || 'No Guild'}</span>
                                                                                                    </div>
                                                                                                    <div className="relative">
                                                                                                        {event.Killer.Equipment?.MainHand && (
                                                                                                            <Tooltip content={formatItemName(event.Killer.Equipment.MainHand.Type)}>
                                                                                                                <ItemIcon item={event.Killer.Equipment.MainHand} className="w-10 h-10 object-contain" alt={formatItemName(event.Killer.Equipment.MainHand.Type)} />
                                                                                                            </Tooltip>
                                                                                                        )}
                                                                                                        <div className="absolute -bottom-1 -right-1 bg-card text-[10px] px-1 rounded border border-border text-muted-foreground">
                                                                                                            {Math.round(event.Killer.AverageItemPower)}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>

                                                                                                {/* Action Icon */}
                                                                                                <div className="px-2 text-muted-foreground">
                                                                                                    <Swords className="h-5 w-5" />
                                                                                                </div>

                                                                                                {/* Victim */}
                                                                                                <div className="flex-1 flex items-center gap-3">
                                                                                                    <div className="relative">
                                                                                                        {event.Victim.Equipment?.MainHand && (
                                                                                                            <Tooltip content={formatItemName(event.Victim.Equipment.MainHand.Type)}>
                                                                                                                <ItemIcon
                                                                                                                    item={event.Victim.Equipment.MainHand}
                                                                                                                    size={40}
                                                                                                                    className="w-10 h-10 object-contain grayscale"
                                                                                                                    alt={formatItemName(event.Victim.Equipment.MainHand.Type)}
                                                                                                                />
                                                                                                            </Tooltip>
                                                                                                        )}
                                                                                                        <div className="absolute -bottom-1 -right-1 bg-card text-[10px] px-1 rounded border border-border text-muted-foreground">
                                                                                                            {Math.round(event.Victim.AverageItemPower)}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div className="flex flex-col">
                                                                                                        <span className="font-bold text-muted-foreground decoration-muted-foreground line-through decoration-2">{event.Victim.Name}</span>
                                                                                                        <span className="text-xs text-muted-foreground">{event.Victim.GuildName || 'No Guild'}</span>
                                                                                                    </div>
                                                                                                </div>

                                                                                                {/* Fame */}
                                                                                                <div className="text-right min-w-[80px]">
                                                                                                    <div className="text-warning font-bold font-mono">+{formatNumber(event.TotalVictimKillFame)}</div>
                                                                                                    <div className="text-xs text-muted-foreground">Fame</div>
                                                                                                </div>

                                                                                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedEventId === event.EventId ? 'rotate-180' : ''}`} />
                                                                                            </div>

                                                                                            {/* Expanded Details */}
                                                                                            {expandedEventId === event.EventId && (
                                                                                                <div className="bg-background/50 p-4 border-t border-border text-sm animate-in slide-in-from-top-2">
                                                                                                    <div className="flex flex-col gap-6">
                                                                                                        {/* Participants Table */}
                                                                                                        <div>
                                                                                                            <h4 className="text-muted-foreground font-bold uppercase text-xs mb-3 flex items-center gap-2">
                                                                                                                <Users className="h-3 w-3" /> Participants ({event.Participants?.length || 0})
                                                                                                            </h4>
                                                                                                            <div className="bg-card border border-border rounded-lg overflow-hidden">
                                                                                                                <table className="w-full text-left text-sm">
                                                                                                                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                                                                                                                        <tr>
                                                                                                                            <th className="px-4 py-2">Player</th>
                                                                                                                            <th className="px-4 py-2">Loadout</th>
                                                                                                                            <th className="px-4 py-2 text-center">IP</th>
                                                                                                                            <th className="px-4 py-2 text-right">Damage</th>
                                                                                                                            <th className="px-4 py-2 text-right">Healing</th>
                                                                                                                        </tr>
                                                                                                                    </thead>
                                                                                                                    <tbody className="divide-y divide-border/50">
                                                                                                                        {event.Participants?.map((p: any, i: number) => (
                                                                                                                            <tr key={i} className="hover:bg-muted/50 transition-colors">
                                                                                                                                <td className="px-4 py-2">
                                                                                                                                    <div className="font-medium text-foreground">{p.Name}</div>
                                                                                                                                    {p.GuildName && <div className="text-xs text-muted-foreground">{p.GuildName}</div>}
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-2">
                                                                                                                                    <div className="flex items-center gap-1">
                                                                                                                                        {/* Main Hand */}
                                                                                                                                        {p.Equipment?.MainHand && (
                                                                                                                                            <Tooltip content={formatItemName(p.Equipment.MainHand.Type)}>
                                                                                                                                                <ItemIcon
                                                                                                                                                    item={p.Equipment.MainHand}
                                                                                                                                                    size={48}
                                                                                                                                                    className="w-8 h-8 object-contain bg-muted/50 rounded border border-border/50"
                                                                                                                                                    alt={formatItemName(p.Equipment.MainHand.Type)}
                                                                                                                                                />
                                                                                                                                            </Tooltip>
                                                                                                                                        )}
                                                                                                                                        {/* Off Hand */}
                                                                                                                                        {p.Equipment?.OffHand && (
                                                                                                                                            <Tooltip content={formatItemName(p.Equipment.OffHand.Type)}>
                                                                                                                                                <ItemIcon
                                                                                                                                                    item={p.Equipment.OffHand}
                                                                                                                                                    size={48}
                                                                                                                                                    className="w-8 h-8 object-contain bg-muted/50 rounded border border-border/50"
                                                                                                                                                    alt={formatItemName(p.Equipment.OffHand.Type)}
                                                                                                                                                />
                                                                                                                                            </Tooltip>
                                                                                                                                        )}
                                                                                                                                    </div>
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-2 text-center text-muted-foreground font-mono">
                                                                                                                                    {Math.round(p.AverageItemPower)}
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-2 text-right">
                                                                                                                                    {p.DamageDone > 0 ? (
                                                                                                                                        <span className="text-destructive font-mono">{formatNumber(p.DamageDone)}</span>
                                                                                                                                    ) : <span className="text-muted-foreground/50">-</span>}
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-2 text-right">
                                                                                                                                    {p.SupportHealingDone > 0 ? (
                                                                                                                                        <span className="text-success font-mono">{formatNumber(p.SupportHealingDone)}</span>
                                                                                                                                    ) : <span className="text-muted-foreground/50">-</span>}
                                                                                                                                </td>
                                                                                                                            </tr>
                                                                                                                        ))}
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </div>
                                                                                                        </div>

                                                                                                        {/* Summary Stats */}
                                                                                                        <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
                                                                                                            <div className="flex-1 min-w-[140px] bg-card/50 p-3 rounded-lg border border-border">
                                                                                                                <div className="text-muted-foreground text-xs uppercase mb-1">Total Damage</div>
                                                                                                                <div className="text-destructive font-mono font-bold text-lg">
                                                                                                                    {formatNumber(event.Participants?.reduce((acc: number, p: any) => acc + (p.DamageDone || 0), 0))}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                            <div className="flex-1 min-w-[140px] bg-card/50 p-3 rounded-lg border border-border">
                                                                                                                <div className="text-muted-foreground text-xs uppercase mb-1">Total Healing</div>
                                                                                                                <div className="text-success font-mono font-bold text-lg">
                                                                                                                    {formatNumber(event.Participants?.reduce((acc: number, p: any) => acc + (p.SupportHealingDone || 0), 0))}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                            <div className="flex-1 min-w-[200px] flex items-end">
                                                                                                                <button
                                                                                                                    onClick={(e) => {
                                                                                                                        e.stopPropagation();
                                                                                                                        navigator.clipboard.writeText(`https://albiononline.com/killboard/kill/${event.EventId}`);
                                                                                                                        const btn = e.currentTarget;
                                                                                                                        const original = btn.innerHTML;
                                                                                                                        btn.innerHTML = '<span class="text-success">Copied!</span>';
                                                                                                                    setTimeout(() => btn.innerHTML = original, 2000);
                                                                                                                }}
                                                                                                                className="w-full py-3 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-colors text-xs flex items-center justify-center gap-2 h-full"
                                                                                                            >
                                                                                                                    <Share2 className="h-4 w-4" /> Copy Official Killboard Link
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    /* Leaderboard Table */
                                                                    <div className="bg-card rounded-xl overflow-hidden border border-border">
                                                                        <table className="w-full text-left text-sm">
                                                                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                                                                                <tr>
                                                                                    <th className="px-6 py-4">Rank</th>
                                                                                    <th className="px-6 py-4">{detailTab === 'players' ? 'Name' : 'Name'}</th>
                                                                                    <th className="px-6 py-4 text-center">Avg IP</th>
                                                                                    <th className="px-6 py-4 text-center">K/D</th>
                                                                                    <th className="px-6 py-4 text-right">Kills</th>
                                                                                    <th className="px-6 py-4 text-right">Deaths</th>
                                                                                    <th className="px-6 py-4 text-right">Fame</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-border">
                                                                                {currentItems.map((item: any, index: number) => {
                                                                                    const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                                                                                    return (
                                                                                        <tr
                                                                                            key={globalIndex}
                                                                                            onClick={() => handleEntityClick(detailTab as 'players' | 'guilds' | 'alliances', item.id)}
                                                                                            className="hover:bg-muted/50 transition-colors cursor-pointer group"
                                                                                        >
                                                                                            <td className="px-6 py-4 text-muted-foreground font-mono">#{globalIndex + 1}</td>
                                                                                            <td className="px-6 py-4 font-medium text-foreground">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    {globalIndex < 3 && <Trophy className={`h-4 w-4 ${globalIndex === 0 ? 'text-warning' : globalIndex === 1 ? 'text-muted-foreground' : 'text-warning/70'}`} />}
                                                                                                    <span className="group-hover:text-foreground transition-colors">
                                                                                                        {item.name || item.Name}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="px-6 py-4 text-center text-muted-foreground">
                                                                                                {item.AverageItemPower ? Math.round(item.AverageItemPower) : '-'}
                                                                                            </td>
                                                                                            <td className="px-6 py-4 text-center font-mono text-muted-foreground">
                                                                                                {(item.deaths > 0 ? (item.kills / item.deaths).toFixed(2) : item.kills > 0 ? '∞' : '0.00')}
                                                                                            </td>
                                                                                            <td className="px-6 py-4 text-right text-muted-foreground">{formatNumber(item.kills)}</td>
                                                                                            <td className="px-6 py-4 text-right text-muted-foreground">{formatNumber(item.deaths)}</td>
                                                                                            <td className="px-6 py-4 text-right font-mono text-warning font-bold">{formatNumber(item.killFame)}</td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                        {rawItems.length === 0 && (
                                                                            <div className="text-center py-12 text-muted-foreground italic">
                                                                                No {detailTab} data available for this battle.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Pagination Controls */}
                                                                {totalPages > 1 && (
                                                                    <div className="flex items-center justify-between mt-4 px-2 border-t border-border/50 pt-4">
                                                                        <button
                                                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                            disabled={currentPage === 1}
                                                                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                                                        >
                                                                            <ChevronLeft className="h-4 w-4" /> Previous
                                                                        </button>

                                                                        <div className="text-sm text-muted-foreground font-medium">
                                                                            Page <span className="text-foreground">{currentPage}</span> of <span className="text-foreground">{totalPages}</span>
                                                                        </div>

                                                                        <button
                                                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                            disabled={currentPage === totalPages}
                                                                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                                                        >
                                                                            Next <ChevronRight className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                <div className="text-center text-destructive py-8">Failed to load battle details</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                        {/* Main List Pagination */}
                        {pastBattles.length > BATTLES_PER_PAGE && (
                            <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                                <button
                                    onClick={() => {
                                        setBattlesPage(p => Math.max(1, p - 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={battlesPage === 1}
                                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-muted-foreground transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Previous
                                </button>

                                <span className="text-muted-foreground">
                                    Page <span className="text-foreground font-bold">{battlesPage}</span> of {Math.ceil(pastBattles.length / BATTLES_PER_PAGE)}
                                </span>

                                <button
                                    onClick={() => {
                                        setBattlesPage(p => Math.min(Math.ceil(pastBattles.length / BATTLES_PER_PAGE), p + 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={battlesPage === Math.ceil(pastBattles.length / BATTLES_PER_PAGE)}
                                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-muted-foreground transition-colors"
                                >
                                    Next <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {battles.length === 0 && !loading && (
                            <div className="text-center py-20 text-muted-foreground">
                                No recent large-scale battles found. Peace reigns... for now.
                            </div>
                        )}
                    </div>
                )}
                <InfoStrip currentPage="zvz-tracker" />
        </PageShell>
    );
}

export default function ZvzTrackerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>}>
            <ZvzTrackerContent />
        </Suspense>
    );
}
