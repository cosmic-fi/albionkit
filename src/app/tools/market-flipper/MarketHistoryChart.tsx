'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getMarketHistory, MarketHistory } from './actions';
import { Loader2 } from 'lucide-react';

interface MarketHistoryChartProps {
  itemId: string;
  buyCity: string;
  region?: 'west' | 'east' | 'europe';
}

export default function MarketHistoryChart({ itemId, buyCity, region = 'west' }: MarketHistoryChartProps) {
  const [data, setData] = useState<{ chartData: any[], avgVolume: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const historyData = await getMarketHistory(itemId, region);
        
        if (!mounted) return;

        // Process data for Recharts
        // We want to compare Black Market vs Buy City
        const blackMarketData = historyData.find(h => h.location === 'Black Market')?.data || [];
        const buyCityData = historyData.find(h => h.location === buyCity)?.data || [];

        // Combine timestamps
        const allTimestamps = new Set([
          ...blackMarketData.map(d => d.timestamp),
          ...buyCityData.map(d => d.timestamp)
        ]);

        const sortedTimestamps = Array.from(allTimestamps).sort();

        // Calculate Average Volume (last 5 points)
        const recentBMData = blackMarketData.slice(-5);
        const avgVolume = recentBMData.length > 0 
          ? Math.round(recentBMData.reduce((acc, curr) => acc + curr.item_count, 0) / recentBMData.length)
          : 0;

        // Create chart data points
        const chartData = sortedTimestamps.map(ts => {
          const bmPoint = blackMarketData.find(d => d.timestamp === ts);
          const cityPoint = buyCityData.find(d => d.timestamp === ts);
          
          return {
            timestamp: new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullDate: new Date(ts),
            'Black Market': bmPoint ? bmPoint.avg_price : null,
            [buyCity]: cityPoint ? cityPoint.avg_price : null,
          };
        }).slice(-20); // Last 20 data points to keep it readable

        setData({ chartData, avgVolume });
      } catch (err) {
        console.error(err);
        setError('Failed to load history data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => { mounted = false; };
  }, [itemId, buyCity, region]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-info" />
      </div>
    );
  }

  if (error || !data || data.chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg text-muted-foreground">
        No history data available for this period
      </div>
    );
  }

  return (
    <div className="bg-muted/50 p-4 rounded-lg border border-border">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-medium text-foreground">Price History (Last 5 Days)</h4>
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
          Avg. Daily Volume (BM): <span className="text-foreground font-bold">{data.avgVolume}</span>
        </div>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="timestamp" 
              stroke="var(--muted-foreground)" 
              fontSize={12}
              tickFormatter={(val) => val.split(' ')[0]} // Show date only on axis
            />
            <YAxis 
              stroke="var(--muted-foreground)" 
              fontSize={12}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }}
              itemStyle={{ color: 'var(--popover-foreground)' }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Black Market" 
              stroke="var(--warning)" // Amber
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey={buyCity} 
              stroke="var(--info)" // Blue
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-center text-muted-foreground">
        * Comparison of Average Prices
      </div>
    </div>
  );
}
