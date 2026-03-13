'use client';

import { useEffect, useState } from 'react';
import { getAlbionServerStatus, ServerStatus } from '@/app/actions/server-status';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useTranslations } from 'next-intl';

export function ServerStatusBanner() {
  const t = useTranslations('Common');
  const [statuses, setStatuses] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getAlbionServerStatus();
        setStatuses(data);
        setError(false);
      } catch (err) {
        console.error('Failed to load server statuses:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Refresh every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null; // Or a skeleton if desired, but banner popping in is okay for now or minimal height
  if (error || statuses.length === 0) return null;

  return (
    <div className="bg-muted-foreground/5 backdrop-blur supports-[backdrop-filter]:bg-muted-foreground/10 border-b border-border/40 text-[10px] sm:text-xs py-2 px-4 flex justify-center items-center gap-4 sm:gap-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
      {statuses.map((server) => (
        <div key={server.region} className="flex items-center gap-1.5">
          <span className="font-medium text-muted-foreground uppercase tracking-wider">
            {server.region}
          </span>
          <div className="flex items-center gap-1">
            {server.status === 'online' ? (
              <div className="flex items-center gap-1 text-emerald-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold">{t('online')}</span>
              </div>
            ) : server.status === 'offline' ? (
              <div className="flex items-center gap-1 text-destructive">
                <WifiOff className="h-3 w-3" />
                <span className="font-semibold">{t('offline')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-warning">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-semibold">{server.status}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
