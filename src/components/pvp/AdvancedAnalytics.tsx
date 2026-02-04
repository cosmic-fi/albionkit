'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Clock, Target, Info } from 'lucide-react';

interface AdvancedAnalyticsProps {
  kills: any[];
  deaths: any[];
  playerId: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded shadow-xl text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
            <span className="capitalize">{p.name}:</span>
            <span className="font-mono font-bold">
              {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            </span>
          </p>
        ))}
        {payload[0].payload.opponent && (
           <p className="text-muted-foreground mt-1">vs {payload[0].payload.opponent}</p>
        )}
      </div>
    );
  }
  return null;
};

export default function AdvancedAnalytics({ kills, deaths, playerId }: AdvancedAnalyticsProps) {
  
  // Process data for Fame Trend (Cumulative Kill Fame)
  const fameData = useMemo(() => {
    // Combine and sort by time ascending
    const allEvents = [...kills].map(k => ({ ...k, type: 'kill' }))
      .sort((a, b) => new Date(a.TimeStamp).getTime() - new Date(b.TimeStamp).getTime());

    const { events: processedEvents } = allEvents.reduce((acc, event) => {
      acc.cumulativeFame += event.TotalVictimKillFame;
      acc.events.push({
        time: new Date(event.TimeStamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullDate: new Date(event.TimeStamp).toLocaleString(),
        fame: acc.cumulativeFame,
        eventFame: event.TotalVictimKillFame,
        opponent: event.Victim.Name
      });
      return acc;
    }, { cumulativeFame: 0, events: [] as any[] });

    return processedEvents;
  }, [kills]);

  // Process data for Hourly Activity
  const activityData = useMemo(() => {
    const hours = Array(24).fill(0).map((_, i) => ({ hour: i, kills: 0, deaths: 0 }));
    
    kills.forEach(k => {
      const h = new Date(k.TimeStamp).getHours();
      hours[h].kills++;
    });
    
    deaths.forEach(d => {
      const h = new Date(d.TimeStamp).getHours();
      hours[h].deaths++;
    });

    // Transform for chart (convert 0-23 to readable labels if needed, but numbers are fine)
    return hours.map(h => ({
      ...h,
      label: `${h.hour}:00`
    }));
  }, [kills, deaths]);

  // Process data for IP vs Outcome
  const ipData = useMemo(() => {
    const data: any[] = [];
    
    kills.forEach(k => {
      const ip = k.Victim.AverageItemPower;
      if (ip) {
        data.push({
          ip: Math.round(ip),
          fame: k.TotalVictimKillFame,
          type: 'Victory',
          opponent: k.Victim.Name,
          weapon: k.Victim.Equipment?.MainHand?.Type
        });
      }
    });

    deaths.forEach(d => {
      const ip = d.Killer.AverageItemPower;
      if (ip) {
        data.push({
          ip: Math.round(ip),
          fame: d.TotalVictimKillFame, // Fame lost (or gained by killer)
          type: 'Defeat',
          opponent: d.Killer.Name,
          weapon: d.Killer.Equipment?.MainHand?.Type
        });
      }
    });

    return data;
  }, [kills, deaths]);

  if (kills.length === 0 && deaths.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <h3 className="text-xl font-bold flex items-center gap-2 text-foreground border-b border-border pb-4">
        <Target className="h-6 w-6 text-primary" />
        Advanced Analytics
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <h4 className="font-bold text-card-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Recent Fame Trend
          </h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fameData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="var(--muted-foreground)" 
                  fontSize={12} 
                  tickMargin={10}
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="fame" 
                  name="Cumulative Fame" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Activity Chart */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h4 className="font-bold text-card-foreground mb-6 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Activity by Hour (UTC)
          </h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  stroke="var(--muted-foreground)" 
                  fontSize={12}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                  contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }}
                />
                <Legend />
                <Bar dataKey="kills" name="Kills" fill="#10b981" stackId="a" radius={[0, 0, 4, 4]} />
                <Bar dataKey="deaths" name="Deaths" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* IP vs Fame Scatter */}
        <div className="col-span-1 lg:col-span-2 bg-card rounded-xl p-4 border border-border">
          <div className="flex justify-between items-start mb-6">
            <h4 className="font-bold text-card-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Opponent IP vs Fame Value
            </h4>
            <div className="text-xs text-muted-foreground flex gap-4">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div> Victory</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive"></div> Defeat</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  type="number" 
                  dataKey="ip" 
                  name="Item Power" 
                  stroke="var(--muted-foreground)" 
                  domain={['auto', 'auto']}
                  label={{ value: 'Item Power', position: 'bottom', fill: 'var(--muted-foreground)', offset: 0 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="fame" 
                  name="Fame" 
                  stroke="var(--muted-foreground)"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  label={{ value: 'Fame', angle: -90, position: 'left', fill: 'var(--muted-foreground)' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border p-3 rounded shadow-xl text-xs">
                          <p className={`font-bold mb-1 ${data.type === 'Victory' ? 'text-success' : 'text-destructive'}`}>
                            {data.type} vs {data.opponent}
                          </p>
                          <p className="text-muted-foreground">IP: {data.ip}</p>
                          <p className="text-muted-foreground">Fame: {data.fame.toLocaleString()}</p>
                          {data.weapon && (
                             <p className="text-muted-foreground mt-1 opacity-75">
                               {data.weapon.replace(/^T\d+_/, '').replace(/_/g, ' ')}
                             </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Wins" data={ipData.filter(d => d.type === 'Victory')} fill="#10b981" />
                <Scatter name="Losses" data={ipData.filter(d => d.type === 'Defeat')} fill="#ef4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
