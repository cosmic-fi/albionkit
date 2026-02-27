'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '@/components/PageShell';
import { Coins, RefreshCw, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, ArrowRightLeft, Calculator, Calendar } from 'lucide-react';
import { getGoldHistory, GoldPricePoint } from '@/lib/gold-service';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { InfoStrip } from '@/components/InfoStrip';

export default function GoldPriceClient() {
  const { profile } = useAuth();
  const { server: region, setServer: setRegion } = useServer();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  const [history, setHistory] = useState<GoldPricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    current: 0,
    change24h: 0,
    changePercent: 0,
    high24h: 0,
    low24h: 0
  });

  // Converter State
  const [goldAmount, setGoldAmount] = useState<string>('1');
  const [silverAmount, setSilverAmount] = useState<string>('');

  // Premium Calculator
  const [premiumGoldCost, setPremiumGoldCost] = useState<string>('3750');

  const loadData = async () => {
    setLoading(true);
    try {
      // Calculate count based on timeRange
      let count = 24 * 7; // Default 7d
      if (timeRange === '24h') count = 24;
      if (timeRange === '30d') count = 24 * 30;

      const data = await getGoldHistory(region, count);

      if (data.length > 0) {
        // Sort by timestamp just in case
        const sorted = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setHistory(sorted);

        const current = sorted[sorted.length - 1].price;

        // Update converter if silver is empty or needs update based on new current price
        // Only update silver if user hasn't typed in it specifically? 
        // For simplicity, let's just update silver based on current gold amount
        if (goldAmount && !isNaN(parseFloat(goldAmount))) {
          setSilverAmount(Math.round(parseFloat(goldAmount) * current).toString());
        }

        // Calculate stats based on the selected time range (entire fetched history)
        const startPrice = sorted[0].price;

        const change = current - startPrice;
        const percent = (change / startPrice) * 100;

        const high = Math.max(...sorted.map(d => d.price));
        const low = Math.min(...sorted.map(d => d.price));

        setStats({
          current,
          change24h: change,
          changePercent: percent,
          high24h: high,
          low24h: low
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [region, timeRange]);

  // Converter Handlers
  const handleGoldChange = (val: string) => {
    setGoldAmount(val);
    if (!val || isNaN(parseFloat(val))) {
      setSilverAmount('');
      return;
    }
    setSilverAmount(Math.round(parseFloat(val) * stats.current).toString());
  };

  const handleSilverChange = (val: string) => {
    setSilverAmount(val);
    if (!val || isNaN(parseFloat(val)) || stats.current === 0) {
      setGoldAmount('');
      return;
    }
    setGoldAmount((parseFloat(val) / stats.current).toFixed(2));
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg">
          <p className="text-muted-foreground text-xs mb-1">{new Date(label).toLocaleString()}</p>
          <p className="text-primary font-bold font-mono text-lg">
            {formatPrice(payload[0].value)} Silver
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <PageShell
      title="Gold Price Tracker"
      backgroundImage='/background/ao-market.jpg'
      description="Track the gold-to-silver exchange rate history and trends."
      icon={<Coins className="h-6 w-6" />}
      headerActions={
        <div className="flex flex-col md:flex-full md:flex-row  md:px-0 sm:items-end sm:items-start md:items-start gap-4">
          <SegmentedControl
            options={[
              { label: '24h', value: '24h' },
              { label: '7 Days', value: '7d' },
              { label: '30 Days', value: '30d' },
            ]}
            value={timeRange}
            onChange={(val) => setTimeRange(val as any)}
            size="sm"
            className='w-fit'
          />
          <div className="h-8 w-px bg-border hidden md:block" />
          <div className='flex flex-row gap-4'>
            <ServerSelector
              selectedServer={region}
              onServerChange={setRegion}
            />
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card/50 p-6 rounded-xl border border-border">
            <div className="text-muted-foreground text-sm mb-2">Current Price</div>
            <div className="text-3xl font-bold font-mono text-primary flex items-end gap-2">
              {loading ? <span className="animate-pulse">...</span> : formatPrice(stats.current)}
              <span className="text-sm text-muted-foreground font-sans mb-1">Silver</span>
            </div>
          </div>

          <div className="bg-card/50 p-6 rounded-xl border border-border">
            <div className="text-muted-foreground text-sm mb-2">Change ({timeRange})</div>
            <div className={`text-2xl font-bold font-mono flex items-center gap-2 ${stats.change24h > 0 ? 'text-success' : stats.change24h < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <>
                  {stats.change24h > 0 ? <TrendingUp className="h-6 w-6" /> : stats.change24h < 0 ? <TrendingDown className="h-6 w-6" /> : <Minus className="h-6 w-6" />}
                  {stats.change24h > 0 ? '+' : ''}{formatPrice(stats.change24h)}
                </>
              )}
            </div>
            {!loading && (
              <div className={`text-xs mt-1 ${stats.changePercent > 0 ? 'text-success' : stats.changePercent < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {stats.changePercent > 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
              </div>
            )}
          </div>

          <div className="bg-card/50 p-6 rounded-xl border border-border">
            <div className="text-muted-foreground text-sm mb-2">High ({timeRange})</div>
            <div className="text-2xl font-bold font-mono text-success flex items-center gap-2">
              {loading ? <span className="animate-pulse">...</span> : formatPrice(stats.high24h)}
              <ArrowUp className="h-4 w-4 text-success/50" />
            </div>
          </div>

          <div className="bg-card/50 p-6 rounded-xl border border-border">
            <div className="text-muted-foreground text-sm mb-2">Low ({timeRange})</div>
            <div className="text-2xl font-bold font-mono text-destructive flex items-center gap-2">
              {loading ? <span className="animate-pulse">...</span> : formatPrice(stats.low24h)}
              <ArrowDown className="h-4 w-4 text-destructive/50" />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-card/50 p-6 rounded-xl border border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2 md:gap-0">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Price History
            </h3>
            <div className="text-xs text-muted-foreground">
              Showing last {history.length} data points
            </div>
          </div>

          <div className="h-[300px] md:h-[400px] w-full -mx-2 md:mx-0">
            {loading && history.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
              </div>
            ) : history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9e9e9e6e" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return timeRange === '24h'
                        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }}
                    stroke="#475569"
                    fontSize={12}
                    minTickGap={40}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    width={55}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Currency Converter */}
          <div className="bg-card/50 p-6 rounded-xl border border-border">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Gold / Silver Converter
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Gold Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Coins className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    value={goldAmount}
                    onChange={(e) => handleGoldChange(e.target.value)}
                    className="pl-9 font-mono text-primary"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <div className="bg-muted p-2 rounded-full text-muted-foreground">
                  <ArrowDown className="h-4 w-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Silver Value</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-muted-foreground text-sm font-bold">S</span>
                  </div>
                  <Input
                    value={silverAmount}
                    onChange={(e) => handleSilverChange(e.target.value)}
                    className="pl-9 font-mono text-foreground"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2">
                Based on current price: 1 Gold = {stats.current.toLocaleString()} Silver
              </div>
            </div>
          </div>

          {/* Premium Calculator */}
          <div className="bg-card/50 p-6 rounded-xl border border-border">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-info" />
              Premium Calculator
            </h3>

            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Premium Gold Cost</span>
                  <span className="text-xs text-muted-foreground">Usually 3,750 or 3,000</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Coins className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    value={premiumGoldCost}
                    onChange={(e) => setPremiumGoldCost(e.target.value)}
                    className="pl-9 font-mono bg-background"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded border border-border">
                  <span className="text-muted-foreground">Silver Cost</span>
                  <span className="text-xl font-bold font-mono text-foreground">
                    {(!isNaN(parseFloat(premiumGoldCost)) && stats.current > 0)
                      ? (parseFloat(premiumGoldCost) * stats.current).toLocaleString()
                      : '---'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted/50 rounded border border-border">
                  <span className="text-muted-foreground">Real Money (Approx)</span>
                  <span className="text-sm font-mono text-success">~$15.00 USD</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Use this to calculate how much Silver you need to farm to pay for your Premium status using Gold exchange.
              </p>
            </div>
          </div>

        </div>

        {/* Market Insights */}
        <div className="bg-card/50 p-6 rounded-xl border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">Market Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">About Gold Price</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The Gold price in Albion Online is the primary indicator of the game's economy inflation.
                It is directly tied to the cost of Premium status. When more players buy Gold with Silver to purchase Premium, the price rises.
                Conversely, when players buy Gold with real money and sell it for Silver, the price stabilizes or drops.
              </p>
              <h4 className="font-medium text-foreground mb-2">Trading Tips</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Prices often spike during weekends due to higher player activity.</li>
                <li>Major content updates usually cause Gold prices to fluctuate as players return.</li>
                <li>Long-term trends show a consistent inflationary pressure on Silver.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Recent Averages</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">7-Day Average</span>
                  <span className="font-mono font-medium">
                    {history.length > 0
                      ? formatPrice(Math.round(history.reduce((a, b) => a + b.price, 0) / history.length))
                      : '---'} Silver
                  </span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">30-Day High</span>
                  <span className="font-mono font-medium text-success">
                    {formatPrice(stats.high24h)} Silver
                  </span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">30-Day Low</span>
                  <span className="font-mono font-medium text-destructive">
                    {formatPrice(stats.low24h)} Silver
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <InfoStrip currentPage="gold-price" />
    </PageShell>
  );
}
