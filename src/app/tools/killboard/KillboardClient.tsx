'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useServer } from '@/hooks/useServer';
import { PageShell } from '@/components/PageShell';
import { Preloader } from '@/components/Preloader';
import { InfoStrip } from '@/components/InfoStrip';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SocialShare } from '@/components/SocialShare';
import { ServerSelector } from '@/components/ServerSelector';
import {
  Search, RefreshCw, Skull, Activity, History, Pause, Play,
  TrendingUp, Coins, Users, Target, Sword, Flame, Clock,
  ChevronRight, Filter, X, ExternalLink, Share2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import { useKillFeed } from './hooks/useKillFeed';
import { KillCard } from './components/KillCard';
import { KillDetailsModal } from './components/KillDetailsModal';
import { Pagination } from '@/components/ui/Pagination';
import { Event } from './types';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

function formatTimeAgo(dateString: string, t: any) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 30) return t('justNow');
  if (seconds < 60) return t('secondsAgo', { n: seconds });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? t('minuteAgo') : t('minutesAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? t('hourAgo') : t('hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  return days === 1 ? t('dayAgo') : t('daysAgo', { n: days });
}

function formatCompactNumber(num: number) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

export default function KillboardClient() {
  const t = useTranslations('KillFeed');
  const tCommon = useTranslations('Common');
  const { server, setServer } = useServer();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [view, setView] = useState<'live' | 'history'>('live');
  const [chartTimeOffset, setChartTimeOffset] = useState(0); // For auto-scrolling chart
  const [chartMode, setChartMode] = useState<'kills' | 'fame' | 'both'>('kills');
  const [timeWindow, setTimeWindow] = useState<'5m' | '10m' | '30m' | '1h'>('1h');
  const [chartNow, setChartNow] = useState(Date.now());
  const ITEMS_PER_PAGE = 20;

  const {
    events,
    graphEvents,
    loading,
    page,
    loadFeed,
    handleNextPage,
    handlePrevPage,
    handleRefresh,
    setPage
  } = useKillFeed({ server, autoRefresh });

  // Handle URL parameter for kill details after events are loaded
  useEffect(() => {
    const eventId = searchParams?.get('kill');
    if (eventId && !loading && events.length > 0) {
      const event = events.find(e => e.EventId === parseInt(eventId));
      if (event && !selectedEvent) {
        setSelectedEvent(event);
      }
    }
  }, [searchParams, events, loading, selectedEvent]);

  const handleShare = async (event: Event) => {
    const url = `${window.location.origin}${pathname}?kill=${event.EventId}&server=${server}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('killUrlCopied'), {
        description: t('shareKillDescription'),
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error(t('copyFailed'));
    }
  };

  // Filter kills by player name (searches through all loaded kills)
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;

    const query = searchQuery.toLowerCase().trim();
    return events.filter(event => {
      const killerName = event.Killer.Name.toLowerCase();
      const victimName = event.Victim.Name.toLowerCase();
      const killerGuild = event.Killer.GuildName?.toLowerCase() || '';
      const victimGuild = event.Victim.GuildName?.toLowerCase() || '';

      return killerName.includes(query) ||
             victimName.includes(query) ||
             killerGuild.includes(query) ||
             victimGuild.includes(query);
    });
  }, [events, searchQuery]);

  // Auto-scroll chart every 1 second (heartbeat-like smooth scrolling)
  useEffect(() => {
    if (view !== 'live') return;

    const scrollInterval = setInterval(() => {
      setChartNow(prev => prev + 1000); // Move "now" forward by 1 second
    }, 1000);

    return () => clearInterval(scrollInterval);
  }, [view]);

  // Update "now" every second for real-time chart scrolling
  useEffect(() => {
    if (view !== 'live') return;
    
    const timer = setInterval(() => setChartNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [view]);

  // Reset chart scroll when time window changes (smooth transition)
  useEffect(() => {
    setChartNow(Date.now());
  }, [timeWindow]);

  // Auto-refresh data every 5 seconds (fetch new kills)
  useEffect(() => {
    if (view !== 'live' || !autoRefresh || page !== 1) return;

    const dataInterval = setInterval(() => {
      loadFeed();
    }, 5000);

    return () => clearInterval(dataInterval);
  }, [view, autoRefresh, page, loadFeed]);

  // Activity Data - Real-time scrolling chart (like crypto graphs)
  const activityData = useMemo(() => {
    if (graphEvents.length === 0) return [];

    // Duration based on timeWindow
    const duration = timeWindow === '5m' ? 5 * 60 * 1000
      : timeWindow === '10m' ? 10 * 60 * 1000
      : timeWindow === '30m' ? 30 * 60 * 1000
      : 60 * 60 * 1000; // 1h

    // End is always NOW (scrolling effect)
    const end = Math.ceil(chartNow / 1000) * 1000;
    const start = end - duration;

    // Dynamic interval based on duration
    let interval = 1000; // Default 1s
    if (duration > 30 * 60 * 1000) interval = 10 * 1000; // > 30m → 10s buckets
    else if (duration > 10 * 60 * 1000) interval = 5 * 1000; // > 10m → 5s buckets

    // Round start/end to interval
    const roundedStart = Math.floor(start / interval) * interval;
    const roundedEnd = Math.ceil(end / interval) * interval;

    const buckets: Record<string, { time: number, kills: number, fame: number, label: string }> = {};

    // Initialize buckets
    let current = roundedStart;
    while (current <= roundedEnd) {
      const d = new Date(current);
      const label = interval < 60000
        ? `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
        : `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;

      buckets[current] = {
        time: current,
        kills: 0,
        fame: 0,
        label
      };
      current += interval;
    }

    // Fill with actual data
    graphEvents.forEach(event => {
      const eventTime = new Date(event.TimeStamp).getTime();
      if (eventTime >= roundedStart && eventTime <= roundedEnd) {
        const bucketTime = Math.floor(eventTime / interval) * interval;
        if (buckets[bucketTime]) {
          buckets[bucketTime].kills++;
          buckets[bucketTime].fame += event.TotalVictimKillFame;
        }
      }
    });

    return Object.values(buckets).sort((a, b) => a.time - b.time);
  }, [graphEvents, timeWindow, chartNow, chartTimeOffset]);

  // Kill type distribution
  const killDistribution = useMemo(() => {
    const dist = { solo: 0, group: 0, stomp: 0, fair: 0 };
    events.forEach(event => {
      const participantCount = event.Participants?.length || 1;
      const killerIp = event.Killer.AverageItemPower;
      const victimIp = event.Victim.AverageItemPower;
      const ipDiffPercent = victimIp > 0 ? Math.abs(((killerIp - victimIp) / victimIp) * 100) : 0;

      if (participantCount === 1) dist.solo++;
      else if (ipDiffPercent > 20) dist.stomp++;
      else if (ipDiffPercent < 10) dist.fair++;
      else dist.group++;
    });
    return dist;
  }, [events]);

  // Top killers in session
  const topKillers = useMemo(() => {
    const killerStats = new Map<string, { name: string; guild: string; kills: number; fame: number }>();
    events.forEach(event => {
      const killerId = event.Killer.Id;
      if (!killerStats.has(killerId)) {
        killerStats.set(killerId, {
          name: event.Killer.Name,
          guild: event.Killer.GuildName || t('noGuild'),
          kills: 0,
          fame: 0
        });
      }
      killerStats.get(killerId)!.kills++;
      killerStats.get(killerId)!.fame += event.TotalVictimKillFame;
    });

    return Array.from(killerStats.values())
      .sort((a, b) => b.kills - a.kills)
      .slice(0, 5);
  }, [events, t]);

  return (
    <PageShell
      title={t('title')}
      backgroundImage='/background/ao-pvp.jpg'
      description={t('description')}
      headerActions={
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="w-full md:w-fit flex items-center justify-between gap-3 md:justify-start">
            <ServerSelector selectedServer={server} onServerChange={setServer} />
            <Button
              variant="default"
              size="sm"
              onClick={handleRefresh}
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
      <div className="space-y-6">
        {/* ===== CONTROLS ===== */}
        <div className="flex flex-col gap-4">
          {/* View Tabs & Controls */}
          <div className="flex w-full md:w-fit md:flex-row gap-4 items-center">
            <div className="flex border border-border rounded-lg p-1 bg-card shadow-sm">
              <button
                onClick={() => setView('live')}
                className={`px-5 py-2 text-sm font-semibold flex items-center gap-2 rounded-md transition-all ${
                  view === 'live'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/70'
                }`}
              >
                <Activity className="h-4 w-4" />
                {t('liveFeed')}
              </button>
              <button
                onClick={() => setView('history')}
                className={`px-5 py-2 text-sm font-semibold flex items-center gap-2 rounded-md transition-all ${
                  view === 'history'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/70'
                }`}
              >
                <History className="h-4 w-4" />
                {t('historicalTrends')}
              </button>
            </div>

            {/* <div className="flex items-center gap-4"> */}
              {/* Auto Refresh Toggle */}
              {/* <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="gap-2"
              >
                {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="hidden sm:inline">{autoRefresh ? t('pause') : t('play')}</span>
              </Button> */}
            {/* </div> */}
          </div>
        </div>

        {/* ===== STATS CARDS ===== */}
        {view === 'live' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in-up">
            <StatCard
              icon={<Activity className="h-5 w-5 text-green-500" />}
              label={t('totalKills')}
              value={formatCompactNumber(events.length)}
              subvalue={t('kills')}
              trend="up"
              loading={loading}
            />
            <StatCard
              icon={<Coins className="h-5 w-5 text-amber-500" />}
              label={t('totalFame')}
              value={formatCompactNumber(events.reduce((sum, e) => sum + e.TotalVictimKillFame, 0))}
              subvalue={t('fame')}
              loading={loading}
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-blue-500" />}
              label={t('avgParticipants')}
              value={(events.reduce((sum, e) => sum + (e.Participants?.length || 1), 0) / (events.length || 1)).toFixed(1)}
              subvalue={t('players')}
              loading={loading}
            />
            <StatCard
              icon={<Target className="h-5 w-5 text-purple-500" />}
              label={t('avgIp')}
              value={formatCompactNumber(
                events.length > 0
                  ? Math.round(events.reduce((sum, e) => sum + e.Killer.AverageItemPower, 0) / events.length)
                  : 0
              )}
              subvalue={t('itemPower')}
              loading={loading}
            />
          </div>
        )}

        {/* ===== ACTIVITY CHART ===== */}
        {view === 'live' && activityData.length > 0 && (
          <div className="bg-card p-6 rounded-xl border border-border animate-in fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{t('activityVolume')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('realTimeTracking')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-2">
                {/* Time Window Selector */}
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                  {(['5m', '10m', '30m', '1h'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setTimeWindow(w)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeWindow === w ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                {/* Mode Selector */}
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                  <button
                    onClick={() => setChartMode('kills')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartMode === 'kills' ? 'bg-background text-red-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {t('kills')}
                  </button>
                  <button
                    onClick={() => setChartMode('fame')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartMode === 'fame' ? 'bg-background text-amber-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {t('fame')}
                  </button>
                  <button
                    onClick={() => setChartMode('both')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartMode === 'both' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {t('both')}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'both' ? (
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorKills" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFame" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.3} />
                    <XAxis
                      dataKey="label"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}m`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        color: 'hsl(var(--popover-foreground))',
                        padding: '10px 14px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: '600', marginBottom: '6px' }}
                      itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      formatter={(value: any, name: any) => {
                        if (name === 'fame' || name === t('fame')) {
                          return [`${((value || 0) / 1000000).toFixed(2)}m`, t('fame')];
                        }
                        return [value, t('kills')];
                      }}
                      cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="kills"
                      name={t('kills')}
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorKills)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="fame"
                      name={t('fame')}
                      stroke="#eab308"
                      fillOpacity={1}
                      fill="url(#colorFame)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                ) : (
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartMode === 'fame' ? '#eab308' : '#ef4444'} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={chartMode === 'fame' ? '#eab308' : '#ef4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.3} />
                    <XAxis
                      dataKey="label"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => chartMode === 'fame' ? `${(value / 1000000).toFixed(1)}m` : value}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        color: 'hsl(var(--popover-foreground))',
                        padding: '10px 14px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: '600', marginBottom: '6px' }}
                      itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      formatter={(value: any, name: any) => {
                        if (chartMode === 'fame') {
                          return [`${((value || 0) / 1000000).toFixed(2)}m`, t('fame')];
                        }
                        return [value, t('kills')];
                      }}
                      cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartMode === 'fame' ? 'fame' : 'kills'}
                      name={chartMode === 'fame' ? t('fame') : t('kills')}
                      stroke={chartMode === 'fame' ? '#eab308' : '#ef4444'}
                      fillOpacity={1}
                      fill="url(#colorChart)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Live indicator */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>{t('liveUpdating')}</span>
            </div>
          </div>
        )}

        {/* ===== KILL DISTRIBUTION ===== */}
        {view === 'live' && events.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DistributionCard
              label={t('soloKill')}
              value={killDistribution.solo}
              total={events.length}
              color="bg-purple-500"
              icon={<Sword className="h-4 w-4" />}
            />
            <DistributionCard
              label={t('groupGank')}
              value={killDistribution.group}
              total={events.length}
              color="bg-blue-500"
              icon={<Users className="h-4 w-4" />}
            />
            <DistributionCard
              label={t('stomp')}
              value={killDistribution.stomp}
              total={events.length}
              color="bg-orange-500"
              icon={<Flame className="h-4 w-4" />}
            />
            <DistributionCard
              label={t('fairFight')}
              value={killDistribution.fair}
              total={events.length}
              color="bg-green-500"
              icon={<Target className="h-4 w-4" />}
            />
          </div>
        )}

        {/* ===== KILLBOARD LIST ===== */}
        {view === 'live' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder={t('searchPlaceholder')}
                  className="pl-10 h-10 text-sm shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent text-muted-foreground transition-colors"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <span>{t('filteringKills')}</span>
                <a href="/tools/pvp-intel" className="text-primary hover:underline inline-flex items-center gap-1">
                  {t('needPlayerStats')}
                </a>
              </p>
              {searchQuery && filteredEvents.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {t('foundKillsMatching', { count: filteredEvents.length, query: searchQuery })}
                </p>
              )}
            </div>

            {loading && filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Preloader size="lg" showText text={t('loadingFeed')} />
              </div>
            ) : filteredEvents.length === 0 && searchQuery ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <Search className="h-16 w-16 text-muted-foreground/50" />
                <h3 className="text-lg font-bold text-foreground">No kills found</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  No kills found matching "<span className="font-semibold text-foreground">{searchQuery}</span>". Try a different search term or clear the search.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {filteredEvents
                    .slice(((page - 1) * ITEMS_PER_PAGE), page * ITEMS_PER_PAGE)
                    .map((event) => (
                    <KillCard
                      key={event.EventId}
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                      formatTimeAgo={(date) => formatTimeAgo(date, t)}
                      formatCompactNumber={formatCompactNumber}
                      t={t}
                      onShare={handleShare}
                    />
                  ))}
                </div>

                {/* Pagination - Only show if more than 1 page */}
                {Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) > 1 && (
                  <div className="p-4 rounded-xl">
                    <Pagination
                      currentPage={page}
                      totalPages={Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)}
                      onPageChange={(newPage) => {
                        if (newPage < page) handlePrevPage();
                        else if (newPage > page) handleNextPage();
                      }}
                      isLoading={loading}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== HISTORY VIEW ===== */}
        {view === 'history' && (
          <div className="bg-card p-12 rounded-xl border border-border text-center animate-in fade-in">
            <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">{t('historicalTrends')}</h3>
            <p className="text-muted-foreground mb-4">{t('historicalDataDesc')}</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>{t('kills')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>{t('fame')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== KILL DETAILS MODAL ===== */}
      {selectedEvent && (
        <KillDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onShare={handleShare}
        />
      )}

      <InfoStrip currentPage="killboard" />

      {/* ===== SOCIAL SHARE ===== */}
      <div className="flex justify-center py-8">
        <SocialShare
          title={t('socialTitle')}
          description={t('socialDescription')}
        />
      </div>
    </PageShell>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, subvalue, trend, loading }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subvalue?: string;
  trend?: 'up' | 'down';
  loading?: boolean;
}) {
  return (
    <div className="bg-card p-4 rounded-xl border border-border hover:shadow-lg transition-all group">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg bg-accent group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {trend && (
          <div className={`text-xs font-bold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </div>
        )}
      </div>
      <div className="text-2xl font-black font-mono mb-1">{loading ? '...' : value}</div>
      <div className="text-xs font-semibold text-muted-foreground uppercase">{label}</div>
      {subvalue && <div className="text-xs text-muted-foreground mt-0.5">{subvalue}</div>}
    </div>
  );
}

// Distribution Card
function DistributionCard({ label, value, total, color, icon }: {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="bg-card p-4 rounded-xl border border-border hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${color} text-white`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs text-muted-foreground">{percentage}% of total</div>
    </div>
  );
}
