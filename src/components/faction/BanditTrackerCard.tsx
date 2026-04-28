'use client';

import React, { useState, useEffect } from 'react';
import { ServerRegion } from '@/data/bandit-schedule';
import { getNextWindow, getRemainingTime, getBanditStatus } from '@/lib/bandit-service';
import { Clock, AlertTriangle, PlayCircle } from 'lucide-react';

interface BanditTrackerCardProps {
  region: ServerRegion;
}

export const BanditTrackerCard: React.FC<BanditTrackerCardProps> = ({ region }) => {
  const [now, setNow] = useState(new Date());
  
  // Update the timer every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { window, targetDate } = getNextWindow(region, now);
  const remainingMs = getRemainingTime(targetDate, now);
  const status = getBanditStatus(remainingMs, now);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'ROLLING':
        return {
          label: 'Rolling Now',
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          icon: <PlayCircle className="w-4 h-4 animate-pulse" />
        };
      case 'IMMINENT':
        return {
          label: 'Starting Soon',
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          icon: <AlertTriangle className="w-4 h-4" />
        };
      default:
        return {
          label: 'Waiting',
          color: 'text-muted-foreground',
          bg: 'bg-muted/10',
          icon: <Clock className="w-4 h-4" />
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const probabilityColor = window.chance >= 0.6 
    ? 'text-green-500' 
    : window.chance >= 0.4 
      ? 'text-yellow-500' 
      : 'text-muted-foreground';

  return (
    <div className="w-full max-w-md mx-auto bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Next Bandit Window
          </h3>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${statusDisplay.bg} ${statusDisplay.color}`}>
            {statusDisplay.icon}
            {statusDisplay.label}
          </div>
        </div>

        <div className="text-center py-4">
          <div className={`text-6xl font-mono font-bold tracking-tighter mb-4 ${status === 'ROLLING' ? 'text-green-500' : ''}`}>
            {status === 'ROLLING' ? '00:00:00' : formatTime(remainingMs)}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Probability of Assault:</span>
            <span className={`font-bold text-base ${probabilityColor}`}>
              {Math.round(window.chance * 100)}%
            </span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex flex-col">
            <span>Target Hour (UTC)</span>
            <span className="font-medium text-foreground">{window.utcHour}:00</span>
          </div>
          <div className="flex flex-col text-right">
            <span>Server Time (UTC)</span>
            <span className="font-medium text-foreground">
              {now.getUTCHours().toString().padStart(2, '0')}:{now.getUTCMinutes().toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
