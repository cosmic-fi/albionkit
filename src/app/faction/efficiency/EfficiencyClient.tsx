'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Shield, TrendingUp, Filter, RefreshCcw, Search, ChevronUp, ChevronDown, ChevronRight, RefreshCw, Info, Coins, Percent, Clock, ExternalLink, Activity } from 'lucide-react';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';
import { FACTION_CITIES } from '@/data/faction-data';
import { getFactionEfficiency, RewardEfficiency } from '@/lib/faction-service';
import { PageShell } from '@/components/PageShell';
import { NumberInput } from '@/components/ui/NumberInput';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';
import { ItemIcon } from '@/components/ItemIcon';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { Tooltip } from '@/components/ui/Tooltip';

export default function EfficiencyClient() {
  const t = useTranslations('FactionTools.efficiency');
  const t_regions = useTranslations('regions');
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RewardEfficiency[]>([]);
  const { server: region, setServer: setRegion } = useServer();
  const [selectedFaction, setSelectedFaction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof RewardEfficiency, direction: 'asc' | 'desc' }>({
    key: 'silverPerPoint',
    direction: 'desc'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await getFactionEfficiency(region, undefined, locale);
      setData(results);
    } catch (error) {
      console.error('Failed to fetch efficiency data:', error);
      toast.error('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [region]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesFaction = selectedFaction === 'all' || item.faction === selectedFaction;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFaction && matchesSearch;
    }).sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      if (sortConfig.direction === 'asc') {
        return aValue! < bValue! ? -1 : 1;
      } else {
        return aValue! > bValue! ? -1 : 1;
      }
    });
  }, [data, selectedFaction, searchQuery, sortConfig]);

  const handleSort = (key: keyof RewardEfficiency) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getFactionColor = (faction: string) => {
    switch (faction) {
      case 'Martlock': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Lymhurst': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Thetford': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Fort Sterling': return 'bg-slate-200/10 text-slate-400 border-slate-200/20';
      case 'Bridgewatch': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Caerleon': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Brecilien': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <PageShell
      title={t('title')}
      backgroundImage='/background/ak-factions.jpeg'
      description={t('subtitle')}
      headerActions={
        <div className="flex items-center gap-3">
          <ServerSelector
            selectedServer={region}
            onServerChange={setRegion}
          />
          <Button
            variant="default"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Update</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="w-full lg:w-64 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t('faction')}</label>
              <Select
                value={selectedFaction}
                onChange={(value) => setSelectedFaction(value)}
                options={[
                  { value: 'all', label: t('allFactions') },
                  ...FACTION_CITIES.map(city => ({ value: city, label: city }))
                ]}
              />
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t('item')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder={t('searchItems')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <button className="flex items-center gap-2" onClick={() => handleSort('name')}>
                      {t('reward')}
                      {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <button className="flex items-center gap-2" onClick={() => handleSort('faction')}>
                      {t('faction')}
                      {sortConfig.key === 'faction' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <button className="flex items-center gap-2 ml-auto" onClick={() => handleSort('pointCost')}>
                      {t('points')}
                      {sortConfig.key === 'pointCost' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <button className="flex items-center gap-2 ml-auto" onClick={() => handleSort('price')}>
                      {t('price')}
                      {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-primary">
                    <button className="flex items-center gap-2 ml-auto" onClick={() => handleSort('silverPerPoint')}>
                      <TrendingUp className="h-3 w-3" />
                      {t('spp')}
                      {sortConfig.key === 'silverPerPoint' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8 h-16 bg-muted/10"></td>
                    </tr>
                  ))
                ) : filteredData.length > 0 ? (
                  filteredData.map((reward) => (
                    <RewardRow key={reward.id} reward={reward} t={t} getFactionColor={getFactionColor} region={region} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground font-medium">
                      No rewards found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SEO Info Strip */}
        <InfoStrip currentPage="faction-efficiency">
          <InfoBanner title={t('whatIs')} icon={<Shield className="h-5 w-5" />} color="text-primary">
            {t('whatIsDesc')}
          </InfoBanner>
          <InfoBanner title={t('howWorks')} icon={<Activity className="h-5 w-5" />} color="text-blue-500">
            {t('howWorksDesc')}
          </InfoBanner>
        </InfoStrip>

      </div>
    </PageShell>
  );
}

function RewardRow({ reward, t, getFactionColor, region }: { reward: RewardEfficiency, t: any, getFactionColor: (f: string) => string, region: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isPremium, setIsPremium] = useState(true);
  const [customPrice, setCustomPrice] = useState<string>('');

  const taxRate = isPremium ? 0.065 : 0.105; // 4% + 2.5% vs 8% + 2.5%
  const effectivePrice = customPrice !== '' ? parseInt(customPrice) || 0 : reward.price;
  const netSilver = effectivePrice * (1 - taxRate);
  const currentSpp = reward.pointCost > 0 ? netSilver / reward.pointCost : 0;

  return (
    <>
      <tr
        className={`hover:bg-accent/30 transition-colors group cursor-pointer ${expanded ? 'bg-accent/20' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <ItemIcon itemId={reward.id} size={48} className="group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="font-bold text-foreground text-sm leading-tight">{reward.name}</div>
              <div className="flex flex-col gap-0.5">
                <div className="text-[10px] font-mono text-muted-foreground">{reward.id}</div>
                <div className="text-[9px] text-muted-foreground/60 font-medium flex items-center gap-1">
                  <Clock className="h-2 w-2" />
                  {t('updated')} {reward.lastUpdated ? new Date(reward.lastUpdated).toLocaleDateString() : t('never')}
                </div>
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <Badge className={`font-bold border px-2 py-0.5 ${getFactionColor(reward.faction)}`}>
            {reward.faction}
          </Badge>
        </td>
        <td className="px-6 py-4 text-right font-bold text-sm">
          {reward.pointCost.toLocaleString()}
        </td>
        <td className="px-6 py-4 text-right font-bold text-sm">
          {reward.price > 0 ? reward.price.toLocaleString() : '—'}
        </td>
        <td className="px-6 py-4 text-right">
          <div className="inline-flex flex-col items-end">
            <div className={`text-base font-black ${currentSpp > 10 ? 'text-green-500' : currentSpp > 5 ? 'text-primary' : 'text-muted-foreground'}`}>
              {currentSpp.toFixed(2)}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-center">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/20 border-b border-border/50">
          <td colSpan={6} className="px-4 py-8 md:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Config */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">
                    <Percent className="h-3 w-3 text-primary" />
                    {t('configuration')}
                  </div>

                  <div className="group bg-card/50 hover:bg-card border border-border/50 rounded-2xl p-5 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-bold text-foreground">{t('premiumStatus')}</div>
                        <div className="text-[10px] text-muted-foreground font-medium">{t('premiumDesc')}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsPremium(!isPremium); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ring-2 ring-transparent focus:ring-primary/20 ${isPremium ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${isPremium ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="pt-4 border-t border-border/50 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">{t('marketTax')}</span>
                        <span className="font-mono font-bold text-foreground">{(taxRate - 0.025) * 100}%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">{t('setupFee')}</span>
                        <span className="font-mono font-bold text-foreground">2.5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column: Breakdown */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">
                    <Coins className="h-3 w-3 text-primary" />
                    {t('profitBreakdown')}
                  </div>

                  <div className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">{t('price')}</span>
                      <span className="font-mono font-bold text-foreground transition-all duration-300">
                        {customPrice !== '' ? (
                          <span className="line-through text-muted-foreground/50 mr-2">{reward.price.toLocaleString()}</span>
                        ) : null}
                        {effectivePrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('overridePrice')}</span>
                        {customPrice !== '' && (
                          <button
                            onClick={() => setCustomPrice('')}
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            {t('reset')}
                          </button>
                        )}
                      </div>
                      <div className="relative group/input">
                        <NumberInput
                          value={customPrice !== '' ? parseInt(customPrice) : 0}
                          onChange={(val) => setCustomPrice(val.toString())}
                          placeholder={reward.price.toString()}
                          className="h-9 text-xs font-mono"
                          isCustom={customPrice !== ''}
                          onReset={() => setCustomPrice('')}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs font-medium text-muted-foreground">{t('marketTax')} ({(taxRate * 100).toFixed(1)}%)</span>
                      <span className="font-mono font-bold text-destructive">-{Math.round(effectivePrice * taxRate).toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t border-border flex justify-between items-end">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t('netReturn')}</div>
                        <div className="text-xl font-black text-foreground">{Math.round(netSilver).toLocaleString()}</div>
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">{t('silver')}</div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Efficiency */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    {t('efficiencyResults')}
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-inner space-y-6">
                    <div className="text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2">{t('finalSpp')}</div>
                      <div className="text-4xl font-black text-primary tracking-tighter">
                        {currentSpp.toFixed(2)}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border">
                      <a
                        href={`https://albiononline2d.com/en/item/id/${reward.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-between w-full h-10 px-4 py-2 whitespace-nowrap rounded-xl text-xs font-bold uppercase tracking-wider ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border/60 bg-background hover:bg-accent hover:text-accent-foreground group/btn"
                      >
                        <span className="flex items-center gap-2">
                          <ExternalLink className="h-3.5 w-3.5" />
                          {t('marketIntelligence')}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/btn:translate-x-0.5 transition-transform" />
                      </a>
                      <div className="text-[9px] text-center text-muted-foreground/70 font-medium italic">
                        {t('calculatedUsing', { region: region.charAt(0).toUpperCase() + region.slice(1) })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
