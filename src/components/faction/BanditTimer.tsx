'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, AlertCircle, CheckCircle2, Timer, Bell, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

interface BanditTimerProps {
  lastStartTime: number | null; // Timestamp in ms
  serverName: string;
  onReport: () => void;
  isReporting?: boolean;
}

export function BanditTimer({ lastStartTime, serverName, onReport, isReporting }: BanditTimerProps) {
  const t = useTranslations('FactionTools.bandit');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Bandit Logic Constants (in ms)
  const EVENT_DURATION = 60 * 60 * 1000; // 1 hour
  const COOLDOWN_DURATION = 3 * 60 * 60 * 1000; // 3 hours
  const WINDOW_DURATION = 2 * 60 * 60 * 1000; // 2 more hours (Total 5-6h window)
  
  const status = useMemo(() => {
    if (!lastStartTime) return 'UNKNOWN';
    
    const elapsed = now - lastStartTime;
    
    if (elapsed < EVENT_DURATION) return 'ACTIVE';
    if (elapsed < EVENT_DURATION + COOLDOWN_DURATION) return 'COOLDOWN';
    if (elapsed < EVENT_DURATION + COOLDOWN_DURATION + WINDOW_DURATION) return 'WINDOW';
    return 'OVERDUE';
  }, [lastStartTime, now]);

  const getTimeLeft = () => {
    if (!lastStartTime) return null;
    const elapsed = now - lastStartTime;
    
    let target = 0;
    if (status === 'ACTIVE') target = EVENT_DURATION;
    else if (status === 'COOLDOWN') target = EVENT_DURATION + COOLDOWN_DURATION;
    else if (status === 'WINDOW') target = EVENT_DURATION + COOLDOWN_DURATION + WINDOW_DURATION;
    else return null;
    
    const diff = target - elapsed;
    if (diff <= 0) return '00:00:00';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!lastStartTime) return 0;
    const elapsed = now - lastStartTime;
    
    let total = 1;
    let current = 0;
    
    if (status === 'ACTIVE') {
      total = EVENT_DURATION;
      current = elapsed;
    } else if (status === 'COOLDOWN') {
      total = COOLDOWN_DURATION;
      current = elapsed - EVENT_DURATION;
    } else if (status === 'WINDOW') {
      total = WINDOW_DURATION;
      current = elapsed - EVENT_DURATION - COOLDOWN_DURATION;
    } else {
      return 100;
    }
    
    return Math.min(100, (current / total) * 100);
  };

  const statusConfig = {
    ACTIVE: {
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      border: 'border-destructive/20',
      icon: <ShieldAlert className="h-6 w-6 animate-pulse" />,
      label: t('active'),
      description: 'The bandits are currently raiding the Outlands!',
    },
    COOLDOWN: {
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      icon: <Clock className="h-6 w-6" />,
      label: t('cooldown'),
      description: 'Resting after the last raid. Next window in...',
    },
    WINDOW: {
      color: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/20',
      icon: <Timer className="h-6 w-6" />,
      label: t('window'),
      description: 'Raids are highly likely to start any minute now.',
    },
    OVERDUE: {
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      icon: <AlertCircle className="h-6 w-6" />,
      label: t('overdue'),
      description: 'It has been a long time since the last raid was reported.',
    },
    UNKNOWN: {
      color: 'text-muted-foreground',
      bg: 'bg-muted',
      border: 'border-border',
      icon: <Clock className="h-6 w-6" />,
      label: 'No Data',
      description: 'Waiting for the first report of the day.',
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  const progress = getProgress();
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`p-8 rounded-3xl border ${config.border} ${config.bg} backdrop-blur-md relative overflow-hidden group transition-all duration-500`}>
        {/* Decorative background circle */}
        <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full ${config.bg} blur-3xl opacity-50 group-hover:opacity-80 transition-opacity`} />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <Badge variant="outline" className="px-3 py-1 font-bold tracking-wider uppercase bg-background/50">
              {serverName}
            </Badge>
            <div className={`w-2 h-2 rounded-full ${status === 'ACTIVE' ? 'bg-destructive animate-ping' : 'bg-muted-foreground'}`} />
          </div>

          {/* Circular Progress */}
          <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform">
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted-foreground/10"
              />
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                strokeLinecap="round"
                className={config.color}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-full bg-background/50 mb-1 shadow-sm">
                {config.icon}
              </div>
              <span className="text-3xl font-black tracking-tighter font-mono">
                {getTimeLeft() || '--:--:--'}
              </span>
            </div>
          </div>

          <h3 className={`text-2xl font-black mb-2 tracking-tight ${config.color}`}>
            {config.label}
          </h3>
          <p className="text-sm text-muted-foreground mb-8 px-4 text-center leading-relaxed">
            {config.description}
          </p>

          <div className="flex flex-col w-full gap-3">
            <Button 
              size="lg" 
              variant={status === 'ACTIVE' ? 'outline' : 'default'}
              className="w-full font-bold h-14 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={onReport}
              disabled={isReporting}
            >
              <Bell className="mr-2 h-5 w-5" />
              {t('reportButton')}
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold opacity-50">
              {t('timezoneNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
