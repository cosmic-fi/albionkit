'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Skull, Swords, X } from 'lucide-react';
import type { Event } from '@/lib/kill-feed-service';

function formatFame(fame: number) {
  if (fame >= 1_000_000) return (fame / 1_000_000).toFixed(2) + 'm';
  if (fame >= 1_000) return (fame / 1_000).toFixed(1) + 'k';
  return fame.toLocaleString();
}

function formatTimeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function LiveKillToasts() {
  const [queue, setQueue] = useState<Event[]>([]);
  const [current, setCurrent] = useState<Event | null>(null);
  const [muted, setMuted] = useState(false);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('ak_home_kill_toasts_muted_v2') : null;
    if (stored === 'true') {
      setMuted(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ak_home_kill_toasts_muted_v2', muted ? 'true' : 'false');
    if (muted && current) {
      setCurrent(null);
    }
  }, [muted, current]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const fetchEvents = async () => {
      try {
        const response = await fetch(
          'https://gameinfo.albiononline.com/api/gameinfo/events?limit=10&offset=0',
          { cache: 'no-store' }
        );
        if (!response.ok) return;
        const events: Event[] = await response.json();
        if (!events || events.length === 0) return;
        const fresh = events.filter(e => !seenIdsRef.current.has(e.EventId));
        if (fresh.length === 0) return;
        fresh.forEach(e => seenIdsRef.current.add(e.EventId));
        setQueue(prev => [...prev, ...fresh.slice(0, 3)]);
      } catch {
      }
    };

    fetchEvents();
    interval = setInterval(fetchEvents, 30000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (muted) return;
    if (current || queue.length === 0) return;

    const next = queue[0];
    setCurrent(next);
    setQueue(prev => prev.slice(1));

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setCurrent(null);
    }, 8000);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [queue, current, muted]);

  if (!current || muted) return null;

  const killer = current.Killer;
  const victim = current.Victim;

  return (
    <div className="fixed bottom-20 left-3 right-3 md:bottom-28 md:left-4 md:right-auto z-40">
      <Link href="/tools/kill-feed" className="block">
        <div className="relative max-w-sm md:max-w-sm mx-auto md:mx-0 bg-card border border-border rounded-xl shadow-xl p-4 flex flex-col gap-3 hover:border-red-500/60 hover:shadow-red-500/20 transition-all">
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setMuted(true);
            }}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground rounded-full h-6 w-6 flex items-center justify-center bg-background/60"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="uppercase tracking-wide font-semibold">Live Kill</span>
            </div>
            <span>•</span>
            <span>{formatTimeAgo(current.TimeStamp)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="text-xs text-muted-foreground">Killer</div>
                  <div className="font-bold text-sm text-emerald-400 truncate">{killer.Name}</div>
                  {killer.GuildName && (
                    <div className="text-[10px] text-muted-foreground truncate">{killer.GuildName}</div>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center mx-1">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/40">
                    <Swords className="h-4 w-4 text-red-400" />
                  </div>
                </div>
                <div className="flex flex-col items-end min-w-0">
                  <div className="text-xs text-muted-foreground text-right">Victim</div>
                  <div className="font-bold text-sm text-red-400 truncate">{victim.Name}</div>
                  {victim.GuildName && (
                    <div className="text-[10px] text-muted-foreground truncate">{victim.GuildName}</div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Skull className="h-3 w-3 text-amber-500" />
                  <span className="font-mono text-amber-400 font-semibold">{formatFame(current.TotalVictimKillFame)} Fame</span>
                </div>
                {current.Location && (
                  <div className="truncate max-w-[60%] text-right">
                    {current.Location}
                  </div>
                )}
              </div>
              <div className="mt-2 text-[11px] text-primary flex items-center justify-between">
                <span className="underline">Open Live Kill Feed</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
