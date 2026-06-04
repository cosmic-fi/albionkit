'use client';

import { useState, useEffect } from 'react';
import { Preloader } from '@/components/Preloader';
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

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export default function GoldPriceClient() {
  const t = useTranslations('GoldPrice');
  const tCommon = useTranslations('Common');
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
        <div className="bg-popover border-2 border-border p-4 rounded-2xl shadow-xl">
          <p className="text-muted-foreground text-xs mb-2 font-semibold">{new Date(label).toLocaleString()}</p>
          <p className="text-primary font-black font-mono text-xl">
            {formatPrice(payload[0].value)} <span className="text-sm text-muted-foreground">{t('silver')}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <PageShell
      title={t('title')}
      backgroundImage='/background/ao-market.jpg'
      description={t('description')}
      headerActions={
        <div className="flex w-full md:w-fit flex-col md:flex-row md:items-end gap-4">
          <SegmentedControl
            options={[
              { label: t('ranges.24h'), value: '24h' },
              { label: t('ranges.7d'), value: '7d' },
              { label: t('ranges.30d'), value: '30d' },
            ]}
            value={timeRange}
            onChange={(val) => setTimeRange(val as any)}
            size="sm"
            className='w-fit'
          />
          <div className="hidden md:block h-8 w-px bg-border" />
          <div className='w-full md:w-fit flex items-center justify-between gap-3 md:justify-start'>
            <ServerSelector
              selectedServer={region}
              onServerChange={setRegion}
            />
            <Button
              variant="default"
              size="sm"
              onClick={loadData}
              disabled={loading}
              aria-label={t('refreshData')}
              className="gap-2"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? tCommon('loading') : tCommon('refresh')}</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Grid - Enhanced for clarity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Price */}
          <div className="group bg-card/50 hover:bg-card/80 p-6 rounded-2xl border border-border/50 transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Coins className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('currentPrice')}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl lg:text-4xl font-black font-mono text-primary">
                {loading ? <span className="animate-pulse">...</span> : formatPrice(stats.current)}
              </div>
              <span className="text-sm text-muted-foreground font-sans">{t('silver')}</span>
            </div>
          </div>

          {/* Price Change */}
          <div className={`group bg-card/50 hover:bg-card/80 p-6 rounded-2xl border border-border/50 transition-all hover:scale-105 hover:shadow-xl ${stats.change24h > 0 ? 'hover:border-success/30' : stats.change24h < 0 ? 'hover:border-destructive/30' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              {stats.change24h > 0 ? <TrendingUp className="h-5 w-5 text-success" /> : stats.change24h < 0 ? <TrendingDown className="h-5 w-5 text-destructive" /> : <Minus className="h-5 w-5 text-muted-foreground" />}
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('change', { range: t(`ranges.${timeRange}`) })}</span>
            </div>
            {loading ? (
              <span className="animate-pulse text-2xl">...</span>
            ) : (
              <>
                <div className={`text-2xl lg:text-3xl font-black font-mono flex items-center gap-2 ${stats.change24h > 0 ? 'text-success' : stats.change24h < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {stats.change24h > 0 ? '+' : ''}{formatPrice(stats.change24h)}
                </div>
                <div className={`text-sm font-bold ${stats.changePercent > 0 ? 'text-success' : stats.changePercent < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {stats.changePercent > 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
                </div>
              </>
            )}
          </div>

          {/* High */}
          <div className="group bg-card/50 hover:bg-card/80 hover:border-success/30 p-6 rounded-2xl border border-border/50 transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUp className="h-5 w-5 text-success/70" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('high', { range: t(`ranges.${timeRange}`) })}</span>
            </div>
            <div className="text-2xl lg:text-3xl font-black font-mono text-success">
              {loading ? <span className="animate-pulse">...</span> : formatPrice(stats.high24h)}
            </div>
          </div>

          {/* Low */}
          <div className="group bg-card/50 hover:bg-card/80 hover:border-destructive/30 p-6 rounded-2xl border border-border/50 transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <ArrowDown className="h-5 w-5 text-destructive/70" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('low', { range: t(`ranges.${timeRange}`) })}</span>
            </div>
            <div className="text-2xl lg:text-3xl font-black font-mono text-destructive">
              {loading ? <span className="animate-pulse">...</span> : formatPrice(stats.low24h)}
            </div>
          </div>
        </div>

        {/* Chart - Enhanced with better accessibility and modern design */}
        <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('priceHistory')}</h3>
                <p className="text-xs text-muted-foreground">{t('dataPoints', { count: history.length })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary/40" />
                <span className="text-muted-foreground">{t('goldPrice')}</span>
              </div>
            </div>
          </div>

          <div className="h-[400px] md:h-[500px] w-full" role="img" aria-label={t('chartAriaLabel') || 'Gold price chart showing historical data'}>
            {loading && history.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Preloader size="lg" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{t('loadingChart')}</p>
                  <p className="text-xs text-muted-foreground">{t('fetchingPrices')}</p>
                </div>
              </div>
            ) : history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#a8a29e" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return timeRange === '24h'
                        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }}
                    stroke="#a8a29e"
                    fontSize={12}
                    tick={{ fill: '#a8a29e' }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={50}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke="#a8a29e"
                    fontSize={12}
                    tick={{ fill: '#a8a29e' }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
                    width={60}
                    axisLine={false}
                    tickLine={false}
                    tickCount={6}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 5', opacity: 0.5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    name="Gold Price"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    animationDuration={800}
                    activeDot={{ r: 7, strokeWidth: 3, stroke: '#fff', fill: '#f59e0b' }}
                    filter="url(#glow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground font-semibold mb-2">No data available</p>
                  <p className="text-xs text-muted-foreground">Try refreshing the page</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tools Grid - Enhanced for usability */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Currency Converter */}
          <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <ArrowRightLeft className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('converterTitle')}</h3>
                <p className="text-xs text-muted-foreground">{t('converterDesc')}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="gold-input" className="block text-xs font-semibold text-muted-foreground mb-2">{t('goldAmount')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Coins className="h-5 w-5 text-primary" />
                  </div>
                  <Input
                    id="gold-input"
                    type="number"
                    value={goldAmount}
                    onChange={(e) => handleGoldChange(e.target.value)}
                    className="pl-12 font-mono text-primary text-lg rounded-xl"
                    placeholder="0"
                    aria-describedby="gold-description"
                  />
                </div>
                <p id="gold-description" className="sr-only">Enter amount of gold to convert to silver</p>
              </div>

              <div className="flex justify-center">
                <div className="bg-primary/10 p-3 rounded-full">
                  <ArrowDown className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div>
                <label htmlFor="silver-input" className="block text-xs font-semibold text-muted-foreground mb-2">{t('silverValue')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-primary text-sm font-black">S</span>
                  </div>
                  <Input
                    id="silver-input"
                    type="number"
                    value={silverAmount}
                    onChange={(e) => handleSilverChange(e.target.value)}
                    className="pl-12 font-mono text-foreground text-lg rounded-xl"
                    placeholder="0"
                    aria-describedby="silver-description"
                  />
                </div>
                <p id="silver-description" className="sr-only">Equivalent silver value</p>
              </div>

              <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                <p className="text-sm text-muted-foreground text-center">
                  {t('basedOnPrice', { price: stats.current.toLocaleString() })}
                </p>
              </div>
            </div>
          </div>

          {/* Premium Calculator */}
          <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-info/10">
                <Calculator className="h-6 w-6 text-info" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('premiumCalculator')}</h3>
                <p className="text-xs text-muted-foreground">{t('premiumCalculatorDesc')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-muted/50 p-5 rounded-xl border border-border/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-muted-foreground">{t('premiumGoldCost')}</span>
                  <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">{t('premiumNote')}</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Coins className="h-5 w-5 text-primary" />
                  </div>
                  <Input
                    id="premium-gold-input"
                    type="number"
                    value={premiumGoldCost}
                    onChange={(e) => setPremiumGoldCost(e.target.value)}
                    className="pl-12 font-mono bg-background rounded-xl"
                    aria-label={t('premiumGoldCost')}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border border-border/50">
                  <span className="text-sm font-semibold text-muted-foreground">{t('silverCost')}</span>
                  <span className="text-2xl font-black font-mono text-foreground">
                    {(!isNaN(parseFloat(premiumGoldCost)) && stats.current > 0)
                      ? (parseFloat(premiumGoldCost) * stats.current).toLocaleString()
                      : '---'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-success/10 rounded-xl border border-success/30">
                  <span className="text-sm font-semibold text-muted-foreground">{t('realMoney')}</span>
                  <span className="text-lg font-bold font-mono text-success">~$15.00 USD</span>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('premiumCalculatorDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Insights - Enhanced for clarity */}
        <div className="bg-card/50 p-8 rounded-2xl border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">{t('marketInsights')}</h3>
              <p className="text-sm text-muted-foreground">Tips and data to help you trade smarter</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Info */}
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t('aboutGoldPrice')}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('aboutGoldPriceDesc')}
                </p>
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  {t('tradingTips')}
                </h4>
                <ul className="space-y-2">
                  { [t('tip1'), t('tip2'), t('tip3')].map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-info" />
                {t('recentAverages')}
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border border-border/50">
                  <span className="text-sm font-semibold text-muted-foreground">{t('average7d')}</span>
                  <span className="text-lg font-black font-mono text-foreground">
                    {history.length > 0
                      ? formatPrice(Math.round(history.reduce((a, b) => a + b.price, 0) / history.length))
                      : '---'} <span className="text-sm text-muted-foreground">{t('silver')}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-success/10 rounded-xl border border-success/30">
                  <span className="text-sm font-semibold text-muted-foreground">{t('high30d')}</span>
                  <span className="text-lg font-black font-mono text-success">
                    {formatPrice(stats.high24h)} <span className="text-sm text-muted-foreground">{t('silver')}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-destructive/10 rounded-xl border border-destructive/30">
                  <span className="text-sm font-semibold text-muted-foreground">{t('low30d')}</span>
                  <span className="text-lg font-black font-mono text-destructive">
                    {formatPrice(stats.low24h)} <span className="text-sm text-muted-foreground">{t('silver')}</span>
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
