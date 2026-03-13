import { 
  Coins, 
  Crown, 
  BarChart3, 
  Swords, 
  Users, 
  Sword, 
  TrendingUp,
  Flame,
  ArrowUpRight
} from "lucide-react";
import { TickerData } from "@/lib/ticker-service";
import { useTranslations } from 'next-intl';

interface MarketTickerProps {
  data: TickerData;
}

export function MarketTicker({ data }: MarketTickerProps) {
  const t = useTranslations('MarketTicker');
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const renderTrend = (trend: number) => {
    const isPositive = trend >= 0;
    const colorClass = isPositive ? "text-success" : "text-destructive";
    const rotationClass = isPositive ? "" : "rotate-180";
    
    return (
      <span className={`${colorClass} text-xs flex items-center gap-0.5`}>
        <TrendingUp className={`h-3 w-3 ${rotationClass}`} /> 
        {Math.abs(trend).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="relative md:absolute bottom-0 left-0 right-0 z-20 bg-card/80 border-t border-border/10 backdrop-blur-md overflow-hidden py-4">
      {/* Mobile Grid View */}
      <div className="grid grid-cols-2 gap-4 px-4 md:hidden">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Coins className="h-3 w-3 text-warning" /> {t('goldPrice')}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{formatNumber(data.goldPrice)}</span>
            {renderTrend(data.goldTrend)}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Crown className="h-3 w-3 text-warning" /> {t('premium')}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{formatLargeNumber(data.premiumPrice)}</span>
            {renderTrend(data.premiumTrend)}
          </div>
        </div>
      </div>

      {/* Desktop Marquee View */}
      <div className="hidden md:flex animate-marquee w-max whitespace-nowrap text-sm font-medium text-muted-foreground">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-16 items-center mr-16">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-warning" />
              <span>{t('gold')}: <span className="text-foreground font-bold">{formatNumber(data.goldPrice)}</span></span>
              {renderTrend(data.goldTrend)}
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-warning" />
              <span>{t('premium')}: <span className="text-foreground font-bold">{formatLargeNumber(data.premiumPrice)}</span></span>
              {renderTrend(data.premiumTrend)}
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-info" />
              <span>{t('blackMarket')}: <span className="text-foreground font-bold">{data.blackMarketVolume}</span></span>
              {renderTrend(data.blackMarketTrend)}
            </div>
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-destructive" />
              <span>{t('topGuild')}: <span className="text-foreground font-bold">{data.topGuild}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-info" />
              <span>{t('activeBattles')}: <span className="text-foreground font-bold">{data.activeBattles}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Sword className="h-4 w-4 text-muted-foreground" />
              <span>{t('meta')}: <span className="text-foreground font-bold">{data.metaItem}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span>{t('mostTraded')}: <span className="text-foreground font-bold">{data.mostTradedItem}</span></span>
            </div>

            {/* Hot Flips Section */}
            {data.hotFlips && data.hotFlips.length > 0 && data.hotFlips.map((flip, idx) => (
              <div key={`flip-${idx}`} className="flex items-center gap-3 bg-primary/5 px-3 py-1 rounded-xl border border-primary/10">
                <Flame className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
                <span className="text-xs font-bold text-foreground">{flip.name}</span>
                <span className="flex items-center gap-1 text-[10px] font-black text-success">
                  <ArrowUpRight className="h-3 w-3" />
                  {formatLargeNumber(flip.profit)} ({flip.margin}%)
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
