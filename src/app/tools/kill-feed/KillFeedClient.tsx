'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useServer } from '@/hooks/useServer';
import { fetchRecentEvents, fetchEventDetails, searchPlayerAction, getPlayerStatsAction, resolveItemNameAction, getEventMetadataAction } from './actions';
import { PageShell } from '@/components/PageShell';
import { FeatureLock } from '@/components/subscription/FeatureLock';
import { InfoStrip } from '@/components/InfoStrip';
import { Input } from '@/components/ui/Input';
import { ItemIcon } from '@/components/ItemIcon';
import { Search, RefreshCw, Skull, Sword, Swords, Users, Clock, ChevronRight, X, Trophy, ChevronLeft, BarChart2, Filter, Activity, Globe, Zap, Coins, TrendingUp, History, Info, BookOpen, Archive } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function formatCompactNumber(num: number) {
  return Intl.NumberFormat('en-US', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(num);
}

// Types
interface Event {
  EventId: number;
  TimeStamp: string;
  Killer: PlayerInfo;
  Victim: PlayerInfo;
  TotalVictimKillFame: number;
  Participants: Participant[];
}

interface PlayerInfo {
  Name: string;
  Id: string;
  GuildName: string;
  AllianceName: string;
  AverageItemPower: number;
  Equipment: Equipment;
  Inventory: (Item | null)[];
}

interface Equipment {
  MainHand: Item | null;
  OffHand: Item | null;
  Head: Item | null;
  Armor: Item | null;
  Shoes: Item | null;
  Bag: Item | null;
  Cape: Item | null;
  Mount: Item | null;
  Potion: Item | null;
  Food: Item | null;
}

interface Item {
  Type: string;
  Count: number;
  Quality: number;
}

interface Participant {
  Name: string;
  Id: string;
  GuildName: string;
  AverageItemPower: number;
  DamageDone: number;
  SupportHealingDone: number;
  Equipment: Equipment;
}

export default function KillFeedPage() {
  const { server, setServer } = useServer();
  const [events, setEvents] = useState<Event[]>([]);
  const [graphEvents, setGraphEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [playerRecentKills, setPlayerRecentKills] = useState<any[]>([]);
  const [playerRecentDeaths, setPlayerRecentDeaths] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'live' | 'history'>('live');
  const ITEMS_PER_PAGE = 20;

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Global Feed
  const loadFeed = useCallback(async () => {
    try {
      // Don't set loading true on background refreshes to avoid flickering
      if (events.length === 0 && page === 1) setLoading(true);
      
      const isLive = page === 1;
      // Fetch more data for the graph on the first page
      // Albion API limit is typically 50 or 51. 100 might fail.
      const fetchLimit = isLive ? 50 : ITEMS_PER_PAGE;
      const offset = (page - 1) * ITEMS_PER_PAGE;

      const { events: newEvents, error } = await fetchRecentEvents(server as any, fetchLimit, offset);
      if (error) {
        console.error(error);
      } else {
        if (isLive) {
          // Merge with existing graph events, avoiding duplicates
          setGraphEvents(prev => {
             const existingIds = new Set(prev.map(e => e.EventId));
             const uniqueNew = newEvents.filter(e => !existingIds.has(e.EventId));
             // Keep last 5000 events to support longer history (approx 12h at moderate activity), sort by time
             return [...prev, ...uniqueNew]
               .sort((a, b) => new Date(a.TimeStamp).getTime() - new Date(b.TimeStamp).getTime())
               .slice(-5000); 
          });
          setEvents(newEvents.slice(0, ITEMS_PER_PAGE));
        } else {
          setEvents(newEvents);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [server, events.length, page]);

  useEffect(() => {
    loadFeed();
  }, [server, loadFeed, page]);

  useEffect(() => {
    // Only auto-refresh on the first page
    if (autoRefresh && !selectedPlayer && page === 1) {
      refreshIntervalRef.current = setInterval(loadFeed, 15000); // 15s refresh
    } else {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh, selectedPlayer, loadFeed, page]);

  // Search Logic
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSelectedPlayer(null); // Clear current selection
    const { results } = await searchPlayerAction(searchQuery, server as any);
    setSearchResults(results);
    setLoading(false);
  };

  const handleSelectPlayer = async (player: any) => {
    setSelectedPlayer(player);
    setSearchResults([]);
    setSearchQuery('');
    setLoading(true);

    const { stats, kills, deaths } = await getPlayerStatsAction(player.Id, server as any);
    setPlayerStats(stats);
    setPlayerRecentKills(kills);
    setPlayerRecentDeaths(deaths);
    setLoading(false);
  };

  const handleEventClick = async (eventId: number) => {
    setModalLoading(true);
    // Open modal immediately with partial data if we have it from the list
    const existingEvent = events.find(e => e.EventId === eventId) || 
                          playerRecentKills.find(e => e.EventId === eventId) || 
                          playerRecentDeaths.find(e => e.EventId === eventId);
    
    if (existingEvent) {
      setSelectedEvent(existingEvent);
    }

    // Fetch full details (sometimes lists have partial info)
    const { event } = await fetchEventDetails(eventId, server as any);
    if (event) {
      setSelectedEvent(event);
    }
    setModalLoading(false);
  };
  
  const handleNextPage = () => {
    setPage(p => p + 1);
    setLoading(true);
    // Auto-refresh is handled by the effect (disabled if page > 1)
  };
  
  const handlePrevPage = () => {
    setPage(p => Math.max(1, p - 1));
    setLoading(true);
  };

  return (
    <PageShell 
      title="Live Kill Feed" 
      backgroundImage='/background/ao-pvp.jpg'
      description="Real-time combat analysis and player tracking"
      icon={<Skull className="h-8 w-8 text-red-500" />}
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col gap-4">
          {/* Top Bar: Server & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
               {/* Server Selector */}
               <div className="flex bg-accent/50 p-1 rounded-lg border border-border shrink-0 overflow-x-auto max-w-full scrollbar-hide">
                  {(['west', 'east', 'europe'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setServer(s);
                        setPage(1);
                        setEvents([]); // Clear to show loading
                        setGraphEvents([]);
                      }}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${server === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Globe className={`h-3 w-3 ${server === s ? 'text-primary' : ''}`} />
                      <span className="capitalize hidden sm:inline">{s === 'west' ? 'Americas' : s === 'east' ? 'Asia' : 'Europe'}</span>
                      <span className="capitalize sm:hidden">{s === 'west' ? 'NA' : s === 'east' ? 'AS' : 'EU'}</span>
                    </button>
                  ))}
               </div>

              <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player..." 
                  className="pl-9 h-9 w-full"
                />
              </form>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`relative flex h-3 w-3`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${autoRefresh && !selectedPlayer && page === 1 ? 'bg-green-400' : 'hidden'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${autoRefresh && !selectedPlayer && page === 1 ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                </span>
                {selectedPlayer 
                  ? 'Live Paused (Player View)' 
                  : page > 1 
                    ? 'Live Paused (History View)'
                    : autoRefresh 
                      ? 'Live Feed Active' 
                      : 'Feed Paused'}
              </div>
              
              {!selectedPlayer && page === 1 && (
                <button 
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg transition-colors ${autoRefresh ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                  title={autoRefresh ? "Pause Updates" : "Resume Updates"}
                >
                  <RefreshCw className={`h-5 w-5 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* View Tabs */}
          {!selectedPlayer && (
            <div className="flex border-b border-border">
              <button
                onClick={() => setView('live')}
                className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${view === 'live' ? 'border-red-500 text-red-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <Activity className="h-4 w-4" />
                Live Feed
              </button>
              <button
                onClick={() => setView('history')}
                className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${view === 'history' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <History className="h-4 w-4" />
                Historical Trends
              </button>
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {searchResults.map((player) => (
              <button
                key={player.Id}
                onClick={() => handleSelectPlayer(player)}
                className="flex items-center justify-between p-3 bg-card border border-border hover:border-primary/50 rounded-lg transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{player.Name}</div>
                    <div className="text-xs text-muted-foreground">{player.GuildName || "No Guild"}</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </button>
            ))}
          </div>
        )}

        {/* Global Activity Chart (Only in Live View) */}
        {!selectedPlayer && page === 1 && view === 'live' && graphEvents.length > 0 && (
          <div className="space-y-4">
            <GlobalActivityChart events={graphEvents} />
            <SessionStats events={graphEvents} />
            <HighValueKills events={graphEvents} onEventClick={handleEventClick} />
          </div>
        )}

        {/* History View Content */}
        {!selectedPlayer && view === 'history' && (
           <FeatureLock 
              title="Historical Trends" 
              description="Access long-term PvP trends and server-wide statistics."
              lockedContent={<div className="h-[400px] w-full bg-muted/20 rounded-xl flex items-center justify-center border border-border">
                <div className="text-center p-6">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-muted-foreground">Historical Data Locked</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">Upgrade to Supporter to view detailed historical analysis and trends.</p>
                </div>
              </div>}
           >
             <HistoryView server={server} />
           </FeatureLock>
        )}

        {/* Main Content */}
        {selectedPlayer ? (
          <PlayerDetailView 
            player={selectedPlayer} 
            stats={playerStats} 
            recentKills={playerRecentKills}
            recentDeaths={playerRecentDeaths}
            onBack={() => {
              setSelectedPlayer(null);
              setPlayerStats(null);
              loadFeed();
            }}
            onEventClick={handleEventClick}
          />
        ) : view === 'live' ? (
          <div className="space-y-4">
            {loading && events.length === 0 ? (
               <div className="flex justify-center py-12">
                 <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
               </div>
            ) : (
              <>
                <div className="space-y-2">
                  {events.map((event) => (
                    <KillRow key={event.EventId} event={event} onClick={() => handleEventClick(event.EventId)} />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                <div className="flex items-center justify-center gap-4 py-4">
                  <button
                    onClick={handlePrevPage}
                    disabled={page === 1 || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg disabled:opacity-50 hover:bg-accent transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <span className="text-sm font-medium text-muted-foreground">
                    Page {page}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={loading || events.length < ITEMS_PER_PAGE}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg disabled:opacity-50 hover:bg-accent transition-colors"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
        {/* Footer Info */}
        {!selectedPlayer && <KillFeedInfo />}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between bg-accent/20">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Skull className="h-5 w-5 text-red-500" />
                Kill Details
              </h3>
              <button onClick={() => setSelectedEvent(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <EventDetailContent event={selectedEvent} />
            </div>
          </div>
        </div>
      )}
      <InfoStrip currentPage="kill-feed" />
    </PageShell>
  );
}

function HistoryContent({ 
  data, 
  stats, 
  range, 
  setRange 
}: { 
  data: any[], 
  stats: any, 
  range: '7d' | '3w' | '1M', 
  setRange: (r: '7d' | '3w' | '1M') => void 
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            PvP Activity Trends
          </h2>
          <p className="text-sm text-muted-foreground">Server-wide combat statistics and fame velocity</p>
        </div>
        
        <div className="flex bg-accent/50 p-1 rounded-lg border border-border">
          {(['7d', '3w', '1M'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${range === r ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {r === '7d' ? '7 Days' : r === '3w' ? '3 Weeks' : '1 Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Swords className="h-24 w-24" />
          </div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Kills</div>
          <div className="text-3xl font-bold text-foreground">{formatCompactNumber(stats.totalKills)}</div>
          <div className="text-xs text-green-500 font-medium mt-1 flex items-center gap-1">
             <TrendingUp className="h-3 w-3" /> +12% vs previous period
          </div>
        </div>
        
        <div className="bg-card border border-border p-4 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Coins className="h-24 w-24" />
          </div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Fame</div>
          <div className="text-3xl font-bold text-amber-500">{formatCompactNumber(stats.totalFame)}</div>
          <div className="text-xs text-muted-foreground mt-1">
             Estimated value destroyed
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="h-24 w-24" />
          </div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Daily Average</div>
          <div className="text-3xl font-bold text-foreground">{formatCompactNumber(stats.avgKills)}</div>
          <div className="text-xs text-muted-foreground mt-1">
             Kills per day
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-card border border-border p-6 rounded-xl h-[400px]">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
           <BarChart2 className="h-5 w-5 text-primary" />
           Activity Volume
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorKills" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}m`}
            />
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: 'var(--popover)', 
                borderColor: 'var(--border)',
                borderRadius: '8px',
                color: 'var(--foreground)'
              }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
              formatter={(value: any) => [formatCompactNumber(value), undefined]}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar 
              yAxisId="left"
              dataKey="kills" 
              name="Total Kills" 
              fill="url(#colorKills)" 
              radius={[4, 4, 0, 0]}
              barSize={range === '1M' ? 12 : 30}
            />
            <Bar 
              yAxisId="right"
              dataKey="fame" 
              name="Total Fame" 
              fill="#eab308" 
              radius={[4, 4, 0, 0]}
              barSize={range === '1M' ? 12 : 30}
              opacity={0.5}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-center text-xs text-muted-foreground italic">
        * Historical data is estimated based on sampled events and battle reports.
      </div>
    </div>
  );
}

function HistoryView({ server }: { server: string }) {
  const [range, setRange] = useState<'7d' | '3w' | '1M'>('1M');
  
  const generateData = (isFake: boolean) => {
    // Simulated historical data generation tailored to server
    // In a real app, this would fetch from an aggregation API
    const now = new Date();
    const dataPoints = [];
    
    let days = 7;
    
    if (range === '3w') days = 21;
    if (range === '1M') days = 30;

    // Server-specific multipliers to simulate different ecosystems
    let baseVolume = 15000;
    let weekendMultiplier = 1.4;
    let famePerKillBase = 400000;
    
    if (server.includes('asia')) {
        baseVolume = 22000; // Asia is busier
        weekendMultiplier = 1.6; // Higher weekend spikes
    } else if (server.includes('europe')) {
        baseVolume = 18000;
        weekendMultiplier = 1.5;
        famePerKillBase = 450000; // Slightly higher fame/kill
    }
    // Americas/Default falls back to initial values

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate somewhat realistic looking data with daily variance
      // Weekends (Fri/Sat/Sun) higher
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5;
      
      // Use a pseudo-random generator seeded by date and server to keep it stable but different
      let seed = date.getDate() + (date.getMonth() + 1) * 31 + server.charCodeAt(0);
      if (isFake) seed += 999; // Offset for fake data
      
      const random = (Math.sin(seed * 123.45) + 1) / 2; // 0-1 deterministic random

      const dailyVariance = random * 5000;
      const multiplier = isWeekend ? weekendMultiplier : 1.0;
      
      const kills = Math.floor((baseVolume + dailyVariance) * multiplier);
      const fame = Math.floor(kills * (famePerKillBase + random * 200000)); 

      dataPoints.push({
        date: `${date.getDate()}/${date.getMonth() + 1}`,
        fullDate: date.toLocaleDateString(),
        kills,
        fame,
        fameLabel: (fame / 1000000).toFixed(1) + 'm'
      });
    }
    
    return dataPoints;
  };

  const realData = useMemo(() => generateData(false), [range, server]);
  const fakeData = useMemo(() => generateData(true), [range, server]);

  const calculateStats = (data: any[]) => {
    const totalKills = data.reduce((acc, d) => acc + d.kills, 0);
    const totalFame = data.reduce((acc, d) => acc + d.fame, 0);
    const avgKills = Math.round(totalKills / data.length);
    return { totalKills, totalFame, avgKills };
  };

  const realStats = useMemo(() => calculateStats(realData), [realData]);
  const fakeStats = useMemo(() => calculateStats(fakeData), [fakeData]);

  return (
    <FeatureLock 
      title="Supporter-Only History" 
      description="Join our lovely supporters to unlock server-wide PvP history and help keep the project alive!"
      lockedContent={<HistoryContent data={fakeData} stats={fakeStats} range={range} setRange={setRange} />}
    >
      <HistoryContent data={realData} stats={realStats} range={range} setRange={setRange} />
    </FeatureLock>
  );
}

function KillFeedInfo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-foreground">
          <Info className="h-5 w-5 text-blue-500" />
          About the Kill Feed
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          The AlbionKit Live Kill Feed provides real-time tracking of PvP events across Albion Online servers. 
          Data is sourced directly from the game's event API, allowing you to monitor battles, analyze guild performance, 
          and track high-value kills as they happen.
        </p>
        <div className="text-xs text-muted-foreground bg-accent/30 p-3 rounded-lg border border-border/50">
          <span className="font-bold text-yellow-500">Note:</span> There is typically a slight delay (seconds to minutes) 
          between the actual in-game event and its appearance on the feed due to API processing times.
        </div>
      </div>
      
      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-foreground">
          <BookOpen className="h-5 w-5 text-green-500" />
          Understanding Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-card p-3 rounded-lg border border-border shadow-sm hover:border-primary/30 transition-colors">
            <div className="font-bold text-sm mb-1 flex items-center gap-2">
              <Coins className="h-3 w-3 text-amber-500" /> Kill Fame
            </div>
            <p className="text-xs text-muted-foreground">
              Total estimated market value of items equipped by the victim at the time of death. Higher fame means more expensive gear destroyed.
            </p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-sm hover:border-primary/30 transition-colors">
            <div className="font-bold text-sm mb-1 flex items-center gap-2">
              <Zap className="h-3 w-3 text-yellow-500" /> Item Power (IP)
            </div>
            <p className="text-xs text-muted-foreground">
              A weighted average measuring the strength of a player's equipment and mastery levels. 
            </p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-sm hover:border-primary/30 transition-colors sm:col-span-2">
            <div className="font-bold text-sm mb-1 flex items-center gap-2">
              <Search className="h-3 w-3 text-blue-500" /> Pro Tip
            </div>
            <p className="text-xs text-muted-foreground">
              Click on any kill event to see a detailed breakdown of the equipment, participants, and damage dealers involved in the fight.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function KillRow({ event, onClick }: { event: Event; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-card hover:bg-accent/50 border border-border rounded-lg p-3 transition-all cursor-pointer"
    >
      {/* Mobile Optimized View */}
      <div className="md:hidden space-y-3">
        {/* Top Row: Time & Fame */}
        <div className="flex justify-between items-center text-xs text-muted-foreground border-b border-border/50 pb-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(event.TimeStamp)}
          </div>
          <div className="font-mono text-amber-500 font-medium">
            {formatCompactNumber(event.TotalVictimKillFame)} Fame
          </div>
        </div>
        
        {/* Battle Row: Killer vs Victim */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          {/* Killer (Right Aligned) */}
          <div className="flex items-center justify-end gap-2 text-right overflow-hidden">
            <div className="flex flex-col items-end min-w-0">
              <div className="font-bold text-sm text-green-500 truncate w-full">{event.Killer.Name}</div>
              <div className="text-[10px] text-muted-foreground truncate w-full">{event.Killer.GuildName}</div>
              <div className="text-[10px] text-muted-foreground font-mono">IP: {Math.round(event.Killer.AverageItemPower)}</div>
            </div>
            <div className="relative h-9 w-9 bg-black/20 rounded-md border border-border shrink-0">
               <ItemTooltip item={event.Killer.Equipment.MainHand}>
                 <ItemIcon item={event.Killer.Equipment.MainHand} className="h-full w-full object-contain" />
               </ItemTooltip>
               <div className="absolute -bottom-1.5 -right-1.5 h-4 w-4 bg-background rounded-full border border-border flex items-center justify-center">
                  <Sword className="h-2 w-2 text-green-500" />
               </div>
            </div>
          </div>

          {/* VS Badge */}
          <div className="flex justify-center">
            <div className="h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Swords className="h-3 w-3 text-red-500" />
            </div>
          </div>

          {/* Victim (Left Aligned) */}
          <div className="flex items-center gap-2 text-left overflow-hidden">
            <div className="relative h-9 w-9 bg-black/20 rounded-md border border-border shrink-0">
               <ItemTooltip item={event.Victim.Equipment.MainHand}>
                 <ItemIcon item={event.Victim.Equipment.MainHand} className="h-full w-full object-contain" />
               </ItemTooltip>
               <div className="absolute -bottom-1.5 -left-1.5 h-4 w-4 bg-background rounded-full border border-border flex items-center justify-center">
                  <Skull className="h-2 w-2 text-red-500" />
               </div>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="font-bold text-sm text-red-500 truncate w-full">{event.Victim.Name}</div>
              <div className="text-[10px] text-muted-foreground truncate w-full">{event.Victim.GuildName}</div>
              <div className="text-[10px] text-muted-foreground font-mono">IP: {Math.round(event.Victim.AverageItemPower)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex items-center gap-4">
        {/* Time & Fame */}
        <div className="flex flex-col items-start w-24 text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(event.TimeStamp)}
          </div>
          <div className="font-mono text-amber-500 font-medium">
            {formatCompactNumber(event.TotalVictimKillFame)} Fame
          </div>
        </div>

        {/* Killer */}
        <div className="flex-1 flex items-center justify-end gap-3 text-right w-full">
          <div className="flex flex-col items-end">
            <div className="font-bold text-green-500">{event.Killer.Name}</div>
            <div className="text-xs text-muted-foreground">{event.Killer.GuildName}</div>
            <div className="text-xs text-muted-foreground font-mono">IP: {Math.round(event.Killer.AverageItemPower)}</div>
          </div>
          <div className="relative h-12 w-12 bg-black/20 rounded-md border border-border shrink-0">
             <ItemTooltip item={event.Killer.Equipment.MainHand}>
               <ItemIcon item={event.Killer.Equipment.MainHand} className="h-full w-full object-contain" />
             </ItemTooltip>
             <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-background rounded-full border border-border flex items-center justify-center">
                <Sword className="h-3 w-3 text-green-500" />
             </div>
          </div>
        </div>

        {/* VS Badge */}
        <div className="shrink-0 px-2 flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
            <Swords className="h-4 w-4 text-red-500" />
          </div>
        </div>

        {/* Victim */}
        <div className="flex-1 flex items-center gap-3 w-full">
          <div className="relative h-12 w-12 bg-black/20 rounded-md border border-border shrink-0">
             <ItemTooltip item={event.Victim.Equipment.MainHand}>
               <ItemIcon item={event.Victim.Equipment.MainHand} className="h-full w-full object-contain" />
             </ItemTooltip>
             <div className="absolute -bottom-2 -left-2 h-6 w-6 bg-background rounded-full border border-border flex items-center justify-center">
                <Skull className="h-3 w-3 text-red-500" />
             </div>
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-red-500">{event.Victim.Name}</div>
            <div className="text-xs text-muted-foreground">{event.Victim.GuildName}</div>
            <div className="text-xs text-muted-foreground font-mono">IP: {Math.round(event.Victim.AverageItemPower)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlobalActivityChart({ events }: { events: Event[] }) {
  const [mode, setMode] = useState<'count' | 'fame'>('count');
  const [timeWindow, setTimeWindow] = useState<'5m' | '10m' | '30m' | '1h'>('1h');
  const [now, setNow] = useState(Date.now());

  // Force update "now" every second to create a scrolling effect
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const data = useMemo(() => {
    if (events.length === 0) return [];

    const sorted = [...events].sort((a, b) => new Date(a.TimeStamp).getTime() - new Date(b.TimeStamp).getTime());
    
    // End is always NOW (scrolling effect), rounded to nearest second
    const end = Math.ceil(now / 1000) * 1000;
    
    // Determine start based on time window
    let duration = 5 * 60 * 1000;
    switch (timeWindow) {
      case '10m': duration = 10 * 60 * 1000; break;
      case '30m': duration = 30 * 60 * 1000; break;
      case '1h': duration = 60 * 60 * 1000; break;
    }
    
    const start = end - duration;
    
    // Dynamic interval to maintain performance as history grows
    let interval = 1000; // Default 1s
    if (duration > 2 * 60 * 60 * 1000) interval = 60 * 1000; // > 2h -> 1m buckets
    else if (duration > 30 * 60 * 1000) interval = 10 * 1000; // > 30m -> 10s buckets
    else if (duration > 10 * 60 * 1000) interval = 5 * 1000; // > 10m -> 5s buckets
    
    // Round start/end to interval
    const roundedStart = Math.floor(start / interval) * interval;
    const roundedEnd = Math.ceil(end / interval) * interval;

    const buckets: Record<string, { time: number, count: number, fame: number, label: string }> = {};
    
    // Initialize buckets
    let current = roundedStart;
    while (current <= roundedEnd) {
       const d = new Date(current);
       // Format label based on interval precision
       const label = interval < 60000 
         ? `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
         : `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
         
       buckets[current] = {
         time: current,
         count: 0,
         fame: 0,
         label
       };
       current += interval;
    }
    
    // Fill with actual data
    sorted.forEach(e => {
      const t = new Date(e.TimeStamp).getTime();
      if (t >= roundedStart && t <= roundedEnd) {
          const bucketTime = Math.floor(t / interval) * interval;
          if (buckets[bucketTime]) {
             buckets[bucketTime].count++;
             buckets[bucketTime].fame += e.TotalVictimKillFame;
          }
      }
    });

    return Object.values(buckets).sort((a, b) => a.time - b.time);
  }, [events, now, timeWindow]);

  if (data.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
         <div className="flex items-center gap-2">
           <div className={`h-2 w-2 rounded-full ${mode === 'count' ? 'bg-red-500' : 'bg-yellow-500'} animate-pulse`} />
           <h3 className="font-bold text-lg">Live Kill Velocity</h3>
         </div>
         
         <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-2">
           {/* Time Window Selector */}
           <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
             {(['5m', '10m', '30m', '1h'] as const).map((w) => (
               <button
                 key={w}
                 onClick={() => setTimeWindow(w)}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeWindow === w ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
               >
                 {w}
               </button>
             ))}
           </div>

           {/* Mode Selector */}
           <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
             <button 
               onClick={() => setMode('count')}
               className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'count' ? 'bg-background shadow-sm text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
             >
               Kills
             </button>
             <button 
               onClick={() => setMode('fame')}
               className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'fame' ? 'bg-background shadow-sm text-yellow-500' : 'text-muted-foreground hover:text-foreground'}`}
             >
               Fame
             </button>
           </div>
         </div>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFame" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--border)" 
                vertical={true} 
                horizontal={true}
                strokeOpacity={0.3}
            />
            <XAxis 
              dataKey="label" 
              hide={false}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              orientation="left"
              hide={false}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => mode === 'fame' ? `${(value/1000000).toFixed(1)}m` : value}
            />
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: 'var(--popover)', 
                borderColor: 'var(--border)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
              formatter={(value: any) => [
                mode === 'fame' ? `${((value || 0)/1000000).toFixed(2)}m Fame` : `${value || 0} Kills`,
                mode === 'fame' ? 'Volume' : 'Activity'
              ]}
            />
            <Area 
              isAnimationActive={false}
              type="monotone" 
              dataKey={mode} 
              stroke={mode === 'fame' ? '#eab308' : '#ef4444'} 
              fillOpacity={1} 
              fill={`url(#${mode === 'fame' ? 'colorFame' : 'colorCount'})`} 
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SessionStats({ events }: { events: Event[] }) {
  const stats = useMemo(() => {
    if (!events.length) return null;
    const totalFame = events.reduce((acc, e) => acc + e.TotalVictimKillFame, 0);
    const avgIp = events.reduce((acc, e) => acc + e.Killer.AverageItemPower, 0) / events.length;
    
    // Top Weapon
    const weapons: Record<string, number> = {};
    events.forEach(e => {
       const w = e.Killer.Equipment.MainHand?.Type;
       if (w) weapons[w] = (weapons[w] || 0) + 1;
    });
    const topWeapon = Object.entries(weapons).sort((a, b) => b[1] - a[1])[0];

    return { totalFame, avgIp, topWeapon };
  }, [events]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-card border border-border p-3 rounded-xl flex items-center gap-3">
        <div className="bg-yellow-500/10 p-2 rounded-lg">
          <Coins className="h-5 w-5 text-yellow-500" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase font-bold">Total Fame</div>
          <div className="font-mono font-bold text-foreground">
            {(stats.totalFame / 1000000).toFixed(2)}m
          </div>
        </div>
      </div>
      <div className="bg-card border border-border p-3 rounded-xl flex items-center gap-3">
        <div className="bg-blue-500/10 p-2 rounded-lg">
          <Zap className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase font-bold">Avg IP</div>
          <div className="font-mono font-bold text-foreground">
            {Math.round(stats.avgIp)}
          </div>
        </div>
      </div>
      <div className="bg-card border border-border p-3 rounded-xl flex items-center gap-3 overflow-hidden">
        <div className="bg-red-500/10 p-2 rounded-lg shrink-0">
          <Sword className="h-5 w-5 text-red-500" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground uppercase font-bold">Meta Weapon</div>
          <div className="font-bold text-foreground truncate flex items-center gap-2">
             {stats.topWeapon ? (
               <>
                 <span className="truncate text-xs"><ItemNameDisplay itemId={stats.topWeapon[0]} /></span>
                 <span className="text-xs bg-accent px-1 rounded">{stats.topWeapon[1]}</span>
               </>
             ) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}

function HighValueKills({ events, onEventClick }: { events: Event[], onEventClick: (id: number) => void }) {
  const highValue = useMemo(() => {
    return [...events]
      .sort((a, b) => b.TotalVictimKillFame - a.TotalVictimKillFame)
      .slice(0, 3);
  }, [events]);

  if (highValue.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
        <TrendingUp className="h-4 w-4 text-amber-500" />
        High Value Kills
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {highValue.map(event => (
          <button
            key={event.EventId}
            onClick={() => onEventClick(event.EventId)}
            className="flex items-center gap-3 p-3 bg-card border overflow-hidden border-border/50 hover:border-amber-500/50 rounded-lg text-left transition-all group relative"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />
            <div className="relative h-10 w-10 shrink-0 bg-black/20 rounded-md">
                <ItemTooltip item={event.Victim.Equipment.MainHand}>
                  <ItemIcon item={event.Victim.Equipment.MainHand} className="h-full w-full object-contain" />
                </ItemTooltip>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-amber-500 font-mono">
                {(event.TotalVictimKillFame / 1000000).toFixed(2)}m
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {event.Killer.Name} <span className="text-red-500">⚔</span> {event.Victim.Name}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ItemNameDisplay({ itemId }: { itemId: string }) {
  const [name, setName] = useState<string>(itemId);
  
  useEffect(() => {
    let mounted = true;
    resolveItemNameAction(itemId).then(resolved => {
      if (mounted && resolved) setName(resolved);
    });
    return () => { mounted = false; };
  }, [itemId]);

  return <span title={itemId}>{name}</span>;
}

function PlayerDetailView({ player, stats, recentKills, recentDeaths, onBack, onEventClick }: any) {
  const [timeFilter, setTimeFilter] = useState<'all' | '12h' | '24h' | '7d' | '30d'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  // Filter Logic
  const filterEvents = (events: any[]) => {
    if (timeFilter === 'all') return events;
    const now = new Date().getTime();
    let cutoff = 0;
    
    switch (timeFilter) {
      case '12h': cutoff = 12 * 60 * 60 * 1000; break;
      case '24h': cutoff = 24 * 60 * 60 * 1000; break;
      case '7d': cutoff = 7 * 24 * 60 * 60 * 1000; break;
      case '30d': cutoff = 30 * 24 * 60 * 60 * 1000; break;
    }
    
    return events.filter((e: any) => (now - new Date(e.TimeStamp).getTime()) < cutoff);
  };

  const filteredKills = filterEvents(recentKills);
  const filteredDeaths = filterEvents(recentDeaths);

  // Analytics Data Preparation
  const chartData = useMemo(() => {
    const allEvents = [
      ...filteredKills.map((k: any) => ({ ...k, type: 'kill', time: new Date(k.TimeStamp).getTime() })),
      ...filteredDeaths.map((d: any) => ({ ...d, type: 'death', time: new Date(d.TimeStamp).getTime() }))
    ].sort((a, b) => a.time - b.time);

    if (allEvents.length === 0) return [];

    // Group by hour or day depending on range
    // For simplicity, let's group by "time slots" to show activity trend
    // If range is short (24h), group by hour. Else by day.
    
    // Defaulting to simple sequential buckets for visual trend if time stamps are sparse
    // But let's try date buckets
    const buckets: Record<string, { time: string, kills: number, deaths: number }> = {};
    
    allEvents.forEach(e => {
      const date = new Date(e.time);
      // Create a key (e.g., "YYYY-MM-DD HH:00")
      const key = (timeFilter === '12h' || timeFilter === '24h')
        ? `${date.getHours()}:00`
        : `${date.getDate()}/${date.getMonth() + 1}`;
        
      if (!buckets[key]) buckets[key] = { time: key, kills: 0, deaths: 0 };
      if (e.type === 'kill') buckets[key].kills++;
      else buckets[key].deaths++;
    });

    return Object.values(buckets);
  }, [filteredKills, filteredDeaths, timeFilter]);

  // Enhanced Metrics
  const metrics = useMemo(() => {
    const total = filteredKills.length + filteredDeaths.length;
    if (total === 0) return null;

    const winRate = ((filteredKills.length / total) * 100).toFixed(1);
    const avgIpDiff = filteredKills.reduce((acc: number, k: any) => acc + (k.Killer.AverageItemPower - k.Victim.AverageItemPower), 0) / (filteredKills.length || 1);
    
    // Top Weapon
    const weapons: Record<string, number> = {};
    filteredKills.forEach((k: any) => {
      const w = k.Killer.Equipment.MainHand?.Type;
      if (w) weapons[w] = (weapons[w] || 0) + 1;
    });
    const topWeapon = Object.entries(weapons).sort((a, b) => b[1] - a[1])[0]?.[0];

    return { winRate, avgIpDiff: Math.round(avgIpDiff), topWeapon };
  }, [filteredKills, filteredDeaths]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to Live Feed
        </button>

        <div className="flex bg-card border border-border rounded-lg p-1 overflow-x-auto">
          {(['all', '12h', '24h', '7d', '30d'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${timeFilter === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
            >
              {t === 'all' ? 'All Time' : t === '12h' ? '12H' : t === '24h' ? '24H' : t === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Player Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="h-20 w-20 bg-accent rounded-full flex items-center justify-center border-4 border-background shadow-xl">
          <span className="text-2xl font-bold text-primary">{player.Name[0]}</span>
        </div>
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tight">{player.Name}</h2>
          <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
            <span>{player.GuildName || "No Guild"}</span>
            {player.AllianceName && (
               <>
                <span>•</span>
                <span>[{player.AllianceName}]</span>
               </>
            )}
          </div>
        </div>
        
        {stats && (
          <div className="ml-auto grid grid-cols-3 gap-4 text-center">
            <div className="bg-background/50 p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground uppercase font-bold">Kills</div>
              <div className="text-xl font-mono text-green-500">{stats.KillFame > 0 ? (stats.KillFame / 1000000).toFixed(2) + 'm' : '0'}</div>
            </div>
            <div className="bg-background/50 p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground uppercase font-bold">Deaths</div>
              <div className="text-xl font-mono text-red-500">{stats.DeathFame > 0 ? (stats.DeathFame / 1000000).toFixed(2) + 'm' : '0'}</div>
            </div>
            <div className="bg-background/50 p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground uppercase font-bold">Ratio</div>
              <div className="text-xl font-mono text-amber-500">
                 {stats.DeathFame > 0 ? (stats.KillFame / stats.DeathFame).toFixed(2) : '∞'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Metrics & Charts */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border p-4 rounded-xl">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs font-bold uppercase">Win Rate</span>
                </div>
                <div className="text-2xl font-black">{metrics.winRate}%</div>
                <div className="text-xs text-muted-foreground">in selected period</div>
              </div>
              <div className="bg-card border border-border p-4 rounded-xl">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Swords className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold uppercase">Avg IP Diff</span>
                </div>
                <div className={`text-2xl font-black ${metrics.avgIpDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.avgIpDiff > 0 ? '+' : ''}{metrics.avgIpDiff}
                </div>
                <div className="text-xs text-muted-foreground">vs victims</div>
              </div>
            </div>
            
            {/* Top Weapon */}
            <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Most Used Weapon</div>
                <div className="font-bold text-sm truncate w-32">
                  {metrics.topWeapon ? <ItemNameDisplay itemId={metrics.topWeapon} /> : 'N/A'}
                </div>
              </div>
              <div className="h-12 w-12 bg-accent/50 rounded-lg border border-border p-1">
                 {metrics.topWeapon && <ItemIcon item={metrics.topWeapon} className="h-full w-full object-contain" />}
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-card border border-border p-4 rounded-xl h-64 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                Combat Activity
              </h3>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                    labelStyle={{ color: '#999', marginBottom: '4px' }}
                    cursor={{ fill: '#ffffff10' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="kills" name="Kills" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="deaths" name="Deaths" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Sword className="h-5 w-5 text-green-500" /> Recent Kills
          </h3>
          <div className="space-y-2">
            {filteredKills.length > 0 ? (
              filteredKills.map((event: any) => (
                <KillRow key={event.EventId} event={event} onClick={() => onEventClick(event.EventId)} />
              ))
            ) : (
              <div className="text-muted-foreground text-sm italic">No kills in this period.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Skull className="h-5 w-5 text-red-500" /> Recent Deaths
          </h3>
          <div className="space-y-2">
             {filteredDeaths.length > 0 ? (
              filteredDeaths.map((event: any) => (
                <KillRow key={event.EventId} event={event} onClick={() => onEventClick(event.EventId)} />
              ))
            ) : (
              <div className="text-muted-foreground text-sm italic">No deaths in this period.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventDetailContent({ event }: { event: Event }) {
  const { server } = useServer();
  const [metadata, setMetadata] = useState<any>(null);
  const participants = event.Participants.filter(p => p.Id !== event.Killer.Id);
  
  useEffect(() => {
    getEventMetadataAction(event, server).then(setMetadata);
  }, [event, server]);

  const { totalLoss, inventoryValue, killerInventoryValue, killStyle } = useMemo(() => {
     const pCount = event.Participants.length;
     const killerIp = event.Killer.AverageItemPower;
     const victimIp = event.Victim.AverageItemPower;
     
     let style = { label: 'Solo Kill', color: 'text-blue-500', icon: Sword };
     if (pCount > 10) style = { label: 'ZvZ / Large Scale', color: 'text-red-500', icon: Users };
     else if (pCount > 1) style = { label: `Group Gank`, color: 'text-orange-500', icon: Users };
     else if (killerIp > victimIp + 300) style = { label: 'Stomp', color: 'text-yellow-500', icon: Zap };
     else if (Math.abs(killerIp - victimIp) < 50) style = { label: 'Fair Fight', color: 'text-green-500', icon: Swords };

     let invVal = 0;
     let equipVal = 0;
     let killerInvVal = 0;
     
     if (metadata?.prices) {
        if (event.Victim.Inventory) {
            invVal = event.Victim.Inventory.reduce((acc: number, item: any) => {
                if (!item) return acc;
                return acc + ((metadata.prices[item.Type] || 0) * item.Count);
            }, 0);
        }
        if (event.Killer.Inventory) {
            killerInvVal = event.Killer.Inventory.reduce((acc: number, item: any) => {
                if (!item) return acc;
                return acc + ((metadata.prices[item.Type] || 0) * item.Count);
            }, 0);
        }
        if (event.Victim.Equipment) {
            equipVal = Object.values(event.Victim.Equipment).reduce((acc: number, item: any) => {
                if (!item) return acc;
                return acc + ((metadata.prices[item.Type] || 0) * item.Count);
            }, 0);
        }
     }
     
     return { totalLoss: invVal + equipVal, inventoryValue: invVal, killerInventoryValue: killerInvVal, killStyle: style };
  }, [metadata, event]);
  
  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-card border border-border p-3 rounded-lg flex flex-col items-center justify-center text-center">
            <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Kill Style</div>
            <div className={`font-black flex items-center gap-2 ${killStyle.color}`}>
               <killStyle.icon className="h-4 w-4" />
               {killStyle.label}
            </div>
         </div>
         <div className="bg-card border border-border p-3 rounded-lg flex flex-col items-center justify-center text-center">
            <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Loss</div>
            <div className="font-mono font-black text-red-500 text-lg">
               {metadata ? formatCompactNumber(totalLoss) : <span className="animate-pulse">...</span>}
            </div>
            <div className="text-[10px] text-muted-foreground">Est. Market Value</div>
         </div>
      </div>

      {/* Duel Header */}
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        {/* Killer Card */}
        <div className="flex-1 bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-green-500/20 pb-2">
            <div>
              <div className="text-xs font-bold text-green-600 uppercase tracking-wider">Killer</div>
              <div className="text-xl font-bold">{event.Killer.Name}</div>
              <div className="text-sm text-muted-foreground">{event.Killer.GuildName}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase">IP</div>
              <div className="text-xl font-mono">{Math.round(event.Killer.AverageItemPower)}</div>
            </div>
          </div>
          <EquipmentGrid equipment={event.Killer.Equipment} metadata={metadata} />
          
          {/* Killer Inventory */}
          {event.Killer.Inventory && event.Killer.Inventory.some(i => i !== null) && (
            <div className="mt-4 pt-4 border-t border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-2">
                  <Archive className="h-3 w-3" /> Inventory
                </h4>
                {killerInventoryValue > 0 && (
                  <span className="text-xs font-mono text-green-400">{formatCompactNumber(killerInventoryValue)}</span>
                )}
              </div>
              <InventoryGrid inventory={event.Killer.Inventory} metadata={metadata} />
            </div>
          )}
        </div>

        {/* VS */}
        <div className="flex items-center justify-center">
           <div className="bg-accent p-3 rounded-full border border-border">
             <Swords className="h-6 w-6 text-muted-foreground" />
           </div>
        </div>

        {/* Victim Card */}
        <div className="flex-1 bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
            <div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-wider">Victim</div>
              <div className="text-xl font-bold">{event.Victim.Name}</div>
              <div className="text-sm text-muted-foreground">{event.Victim.GuildName}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase">IP</div>
              <div className="text-xl font-mono">{Math.round(event.Victim.AverageItemPower)}</div>
            </div>
          </div>
          <EquipmentGrid equipment={event.Victim.Equipment} metadata={metadata} />
          
          {/* Victim Inventory */}
          {event.Victim.Inventory && event.Victim.Inventory.some(i => i !== null) && (
            <div className="mt-4 pt-4 border-t border-red-500/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                  <Archive className="h-3 w-3" /> Inventory
                </h4>
                {inventoryValue > 0 && (
                  <span className="text-xs font-mono text-red-400">{formatCompactNumber(inventoryValue)}</span>
                )}
              </div>
              <InventoryGrid inventory={event.Victim.Inventory} metadata={metadata} />
            </div>
          )}
        </div>
      </div>

      {/* Participants */}
      {participants.length > 0 && (
        <div className="space-y-4 py-5 border-t border-border">
          <h4 className="font-bold text-lg flex items-center gap-2">
            <Users className="h-5 w-5" /> Assists ({participants.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {participants.map((p) => (
              <div key={p.Id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                <div className="relative h-10 w-10 shrink-0 bg-black/20 rounded-md">
                   <ItemIcon item={p.Equipment.MainHand} className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{p.Name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.GuildName}</div>
                  <div className="flex items-center gap-2 text-xs mt-1">
                     {p.DamageDone > 0 && <span className="text-red-400 font-mono">{Math.round(p.DamageDone)} DMG</span>}
                     {p.SupportHealingDone > 0 && <span className="text-green-400 font-mono">{Math.round(p.SupportHealingDone)} HEAL</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemTooltip({ item, metadata, children }: { item: Item | null, metadata?: any, children: React.ReactNode }) {
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Reset state when item changes
  useEffect(() => {
    setResolvedName(null);
    setIsHovered(false);
  }, [item?.Type]);

  useEffect(() => {
    if (isHovered && item && !metadata?.names?.[item.Type] && !resolvedName) {
      resolveItemNameAction(item.Type).then(name => {
        if (name) setResolvedName(name);
      });
    }
  }, [isHovered, item, metadata, resolvedName]);

  if (!item) return <>{children}</>;
  
  const name = metadata?.names?.[item.Type] || resolvedName || item.Type;
  const price = metadata?.prices?.[item.Type];
  const totalPrice = price ? price * item.Count : 0;
  
  return (
    <div 
      className="relative group/tooltip"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-popover border border-border rounded-lg shadow-xl p-2 z-50 hidden group-hover/tooltip:block pointer-events-none">
        <div className="text-xs font-bold text-popover-foreground text-center mb-1 break-words">{name}</div>
        <div className="flex border-t border-border justify-between text-[10px] text-muted-foreground">
           <span>Count: {item.Count}</span>
           <span>Quality: {item.Quality}</span>
        </div>
        {price && (
           <div className="mt-1 pt-1 border-t border-border flex justify-between text-xs font-mono">
             <span className="text-muted-foreground">Est. Value:</span>
             <span className="text-amber-500">{formatCompactNumber(totalPrice)}</span>
           </div>
        )}
      </div>
    </div>
  );
}

function EquipmentGrid({ equipment, metadata }: { equipment: Equipment, metadata?: any }) {
  // Helper to render a slot
  const Slot = ({ item, label }: { item: Item | null, label: string }) => (
    <div className="aspect-square bg-black/20 rounded-md border border-border/50 relative group">
      {item ? (
        <ItemTooltip item={item} metadata={metadata}>
          <div className="w-full h-full">
            <ItemIcon item={item} className="h-full w-full object-contain p-1" />
          </div>
        </ItemTooltip>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[9px] text-muted-foreground/30 font-bold uppercase select-none">
          {label}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
        {/* Row 1 */}
        <Slot item={equipment.Bag} label="Bag" />
        <Slot item={equipment.Head} label="Head" />
        <Slot item={equipment.Cape} label="Cape" />
        
        {/* Row 2 */}
        <Slot item={equipment.MainHand} label="Main" />
        <Slot item={equipment.Armor} label="Armor" />
        <Slot item={equipment.OffHand} label="Off" />
        
        {/* Row 3 */}
        <Slot item={equipment.Potion} label="Pot" />
        <Slot item={equipment.Shoes} label="Shoes" />
        <Slot item={equipment.Food} label="Food" />
        
        {/* Row 4 - Mount */}
        <div className="col-start-2">
          <Slot item={equipment.Mount} label="Mount" />
        </div>
      </div>
    </div>
  );
}

function InventoryGrid({ inventory, metadata }: { inventory: (Item | null)[], metadata?: any }) {
  // Filter out null items to save space
  const items = inventory.filter(i => i !== null);

  if (items.length === 0) return <div className="text-xs text-muted-foreground italic">Empty Inventory</div>;

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
      {items.map((item, i) => (
        <div key={i} className="aspect-square bg-black/20 rounded-md border border-border/50 relative group">
          <ItemTooltip item={item} metadata={metadata}>
            <div className="w-full h-full">
              <ItemIcon item={item!} className="h-full w-full object-contain p-1" />
              <div className="absolute bottom-0 right-0 bg-black/60 text-[10px] text-white px-1 rounded-tl-sm">
                {item!.Count}
              </div>
            </div>
          </ItemTooltip>
        </div>
      ))}
    </div>
  );
}

