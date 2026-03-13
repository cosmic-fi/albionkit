'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { Search, Shield, Sword, Swords, Skull, Crosshair, Lock, Users, Crown, CheckCircle, AlertCircle, Clock, User as UserIcon, ChevronDown, ChevronUp, Trophy, Activity, Target, RefreshCw, Zap, TrendingUp, BarChart2, Download, Share2, ChevronLeft } from 'lucide-react';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Bar, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { searchPlayer, getPlayerStats, getPlayerEvents, getPlayerWeaponMastery, getGuildEvents, getGuildInfo, getGuildMembers, getAllianceInfo, getEventMetadataAction, resolveItemNameAction } from './actions';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, checkAccess } from '@/lib/user-profile';
import { getItems, getItemNameService } from '@/lib/item-service';
import { generateFakeCombatEvents } from '@/lib/fake-data';
import Link from 'next/link';
import AdvancedAnalytics from '@/components/pvp/AdvancedAnalytics';
import { OptionSelector } from '@/components/ui/OptionSelector';
import { Input } from '@/components/ui/Input';
import { PageShell } from '@/components/PageShell';
import { ItemIcon } from '@/components/ItemIcon';
import { Select } from '@/components/ui/Select';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { Tooltip } from '@/components/ui/Tooltip';
import { FeatureLock } from '@/components/subscription/FeatureLock';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';
import { useTranslations, useLocale } from 'next-intl';

const formatNumber = (num: number) => {
  if (!num) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'b';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toLocaleString();
};

const getWeaponAnalysis = (weaponType: string) => {
  const type = weaponType.toUpperCase();
  // Default balanced stats
  let stats = { mobility: 50, damage: 50, control: 50, sustain: 50, utility: 50 };

  if (type.includes('SWORD')) stats = { mobility: 70, damage: 75, control: 40, sustain: 60, utility: 50 };
  else if (type.includes('BOW')) stats = { mobility: 60, damage: 85, control: 30, sustain: 20, utility: 40 };
  else if (type.includes('DAGGER')) stats = { mobility: 90, damage: 90, control: 30, sustain: 30, utility: 20 };
  else if (type.includes('MACE') || type.includes('HAMMER')) stats = { mobility: 60, damage: 40, control: 90, sustain: 70, utility: 60 };
  else if (type.includes('AXE')) stats = { mobility: 60, damage: 85, control: 30, sustain: 70, utility: 30 };
  else if (type.includes('SPEAR')) stats = { mobility: 75, damage: 70, control: 50, sustain: 50, utility: 60 };
  else if (type.includes('NATURE')) stats = { mobility: 40, damage: 30, control: 60, sustain: 100, utility: 80 };
  else if (type.includes('HOLY')) stats = { mobility: 20, damage: 20, control: 50, sustain: 100, utility: 70 };
  else if (type.includes('FIRE') || type.includes('FROST')) stats = { mobility: 30, damage: 95, control: 70, sustain: 30, utility: 40 };
  else if (type.includes('CURSED')) stats = { mobility: 30, damage: 90, control: 50, sustain: 40, utility: 50 };
  else if (type.includes('ARCANE')) stats = { mobility: 50, damage: 40, control: 70, sustain: 40, utility: 100 };
  else if (type.includes('CROSSBOW')) stats = { mobility: 30, damage: 90, control: 40, sustain: 30, utility: 40 };
  else if (type.includes('QUARTERSTAFF')) stats = { mobility: 80, damage: 50, control: 80, sustain: 50, utility: 60 };
  else if (type.includes('GLOVES')) stats = { mobility: 85, damage: 80, control: 60, sustain: 40, utility: 30 };
  else if (type.includes('SHAPESHIFTER')) stats = { mobility: 60, damage: 70, control: 50, sustain: 60, utility: 90 };

  return [
    { subject: 'mobility', A: stats.mobility, fullMark: 100 },
    { subject: 'damage', A: stats.damage, fullMark: 100 },
    { subject: 'control', A: stats.control, fullMark: 100 },
    { subject: 'sustain', A: stats.sustain, fullMark: 100 },
    { subject: 'utility', A: stats.utility, fullMark: 100 },
  ];
};

interface MasteryData {
  id: string;
  kills: number;
  deaths: number;
  fame: number;
  totalIp: number;
  count: number;
  winRate: number;
  avgIp: number;
  sampleId: string;
}

const calculateMastery = (kills: any[], deaths: any[]): MasteryData[] => {
  const stats: Record<string, { kills: number; deaths: number; fame: number; totalIp: number; count: number }> = {};

  // Process Kills
  kills.forEach(kill => {
    const weapon = kill.Killer.Equipment?.MainHand?.Type;
    if (weapon) {
      const baseType = weapon.replace(/^T\d+_/, '').replace(/@\d+$/, '');

      if (!stats[baseType]) stats[baseType] = { kills: 0, deaths: 0, fame: 0, totalIp: 0, count: 0 };
      stats[baseType].kills++;
      stats[baseType].fame += kill.TotalVictimKillFame || 0;
      stats[baseType].totalIp += kill.Killer.AverageItemPower || 0;
      stats[baseType].count++;
    }
  });

  // Process Deaths
  deaths.forEach(death => {
    const weapon = death.Victim.Equipment?.MainHand?.Type;
    if (weapon) {
      const baseType = weapon.replace(/^T\d+_/, '').replace(/@\d+$/, '');

      if (!stats[baseType]) stats[baseType] = { kills: 0, deaths: 0, fame: 0, totalIp: 0, count: 0 };
      stats[baseType].deaths++;
      stats[baseType].totalIp += death.Victim.AverageItemPower || 0;
      stats[baseType].count++;
    }
  });

  return Object.entries(stats)
    .map(([id, data]) => ({
      id,
      ...data,
      winRate: (data.kills / (data.kills + data.deaths)) * 100,
      avgIp: data.totalIp / data.count,
      sampleId: `T4_${id}`
    }))
    .sort((a, b) => b.count - a.count);
};

function ItemNameWithTier({ itemId, sampleId }: { itemId: string, sampleId: string }) {
  const t = useTranslations('PvpIntel');
  const locale = useLocale();
  const [name, setName] = useState<string>('Item');

  useEffect(() => {
    let mounted = true;
    const loadName = async () => {
      const resolvedName = await getItemNameService(sampleId, locale);
      if (mounted) {
        if (resolvedName) {
          const tierMatch = sampleId.match(/^T(\d+)_/);
          const tier = tierMatch ? tierMatch[1] : '';
          const enchantMatch = sampleId.match(/@(\d+)$/);
          const enchantment = enchantMatch ? enchantMatch[1] : '0';
          const tierDisplay = tier ? ` (${t('tier')} ${tier}${enchantment !== '0' ? `.${enchantment}` : ''})` : '';
          setName(`${resolvedName}${tierDisplay}`);
        } else {
          setName(itemId);
        }
      }
    };
    loadName();
    return () => { mounted = false; };
  }, [sampleId, locale, itemId, t]);

  return <span>{name}</span>;
}

function WeaponMasteryTable({
  masteryData,
  expandedWeaponId,
  setExpandedWeaponId,
  formatItemName,
  userProfile,
  selectedPlayer
}: {
  masteryData: MasteryData[],
  expandedWeaponId: string | null,
  setExpandedWeaponId: (id: string | null) => void,
  formatItemName: (id: string) => string,
  userProfile: any,
  selectedPlayer: any
}) {
  const t = useTranslations('PvpIntel');
  const tk = useTranslations('KillFeed');
  const locale = useLocale();

  return (
    <div className="w-full">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {masteryData.map((mastery) => {
          const isExpanded = expandedWeaponId === mastery.id;
          return (
            <div key={mastery.id} className={`bg-card border border-border rounded-xl overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-primary/50' : ''}`}>
              <div
                onClick={() => setExpandedWeaponId(isExpanded ? null : mastery.id)}
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-accent/50"
              >
                {/* Icon */}
                <div className="h-12 w-12 bg-muted rounded border border-border/50 p-1 shrink-0">
                  <ItemIcon item={mastery.sampleId} className="w-full h-full object-contain" />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground truncate">{formatItemName(mastery.sampleId)}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                      {mastery.count} {t('matches')}
                    </span>
                    <span className="text-xs font-mono text-warning">
                      {Math.round(mastery.avgIp)} {tk('ip')}
                    </span>
                  </div>
                </div>

                {/* Win Rate Badge */}
                <div className="text-right">
                  <div className={`text-lg font-bold ${mastery.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                    {Math.round(mastery.winRate)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">{t('winRate')}</div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/30">
                  <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                    <div className="p-3 text-center">
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">{tk('killDeathRatio')}</div>
                      <div className="font-mono text-sm font-medium">
                        <span className="text-success">{mastery.kills}</span> / <span className="text-destructive">{mastery.deaths}</span>
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">{tk('totalFame')}</div>
                      <div className="font-mono text-sm font-medium text-warning">{formatNumber(mastery.fame)}</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">{t('efficiency')}</div>
                      <div className="font-mono text-sm font-medium text-purple-400">
                        {Math.round((mastery.fame / (mastery.totalIp / mastery.count || 1)) * 10)}
                      </div>
                    </div>
                  </div>

                  <FeatureLock
                    title={t('advancedWeaponAnalysis')}
                    description={t('advancedWeaponAnalysisDesc')}
                    lockedContent={
                      <div className="p-8 flex flex-col items-center justify-center text-center bg-muted/10">
                        <div className="bg-primary/10 p-3 rounded-full mb-3">
                          <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-sm font-bold mb-1">{t('analyticsLocked')}</h3>
                        <p className="text-xs text-muted-foreground">
                          {t('tryFree')}
                        </p>
                      </div>
                    }
                  >
                    <div className="p-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-6">
                        {/* Radar Chart */}
                        <div className="bg-card/50 rounded-xl border border-border p-3">
                          <h4 className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-2">
                            <Activity className="h-3 w-3" /> {t('weaponProfile')}
                          </h4>
                          <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getWeaponAnalysis(mastery.id).map(d => ({ ...d, subject: t(`attributes.${d.subject}`) }))}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name={t('metrics')} dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Advanced Stats */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-2">
                            <BarChart2 className="h-3 w-3" /> {t('metrics')}
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-card/50 p-3 rounded-lg border border-border">
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t('famePerMatch')}</div>
                              <div className="text-lg font-mono text-success">
                                {formatNumber(Math.round(mastery.fame / mastery.count))}
                              </div>
                            </div>
                            <div className="bg-card/50 p-3 rounded-lg border border-border">
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t('survival')}</div>
                              <div className="text-lg font-mono text-info">
                                {Math.round((mastery.kills / (mastery.kills + mastery.deaths || 1)) * 100)}%
                              </div>
                            </div>
                          </div>

                          <div className="bg-card/50 p-3 rounded-lg border border-border mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="h-3 w-3 text-warning" />
                              <span className="text-sm font-bold text-foreground">{t('insight')}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {t('winRateTrend', { trend: mastery.winRate >= 50 ? t('positive') : t('negative') })}
                              {mastery.kills > mastery.deaths * 1.5
                                ? t('highlyEffectiveYou')
                                : (mastery.deaths > mastery.kills
                                  ? t('struggleYou')
                                  : t('performanceBalanced'))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FeatureLock>
                </div>
              )}
            </div>
          );
        })}
        {masteryData.length === 0 && (
          <div className="p-8 text-center text-muted-foreground italic border border-border border-dashed rounded-xl">
            {t('noWeaponData')}
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto sm:p-3">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <th className="p-4 font-medium">{t('weapon')}</th>
              <th className="p-4 font-medium text-center">{t('matches')}</th>
              <th className="p-4 font-medium text-center">
                <Tooltip content={t('winRateTooltip')}>
                  <span className="border-b border-dotted border-muted-foreground cursor-help">{t('winRate')}</span>
                </Tooltip>
              </th>
              <th className="p-4 font-medium text-center">{tk('avgIp')}</th>
              <th className="p-4 font-medium text-right">{tk('killFame')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {masteryData.map((mastery) => (
              <Fragment key={mastery.id}>
                <tr
                  onClick={() => setExpandedWeaponId(expandedWeaponId === mastery.id ? null : mastery.id)}
                  className={`cursor-pointer transition-colors ${expandedWeaponId === mastery.id ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-card rounded border border-border/50 flex-shrink-0">
                        <ItemIcon item={mastery.sampleId} className="w-full h-full object-contain p-0.5" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {formatItemName(mastery.sampleId)}
                          {expandedWeaponId === mastery.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mastery.kills} {tk('kills')} / {mastery.deaths} {tk('deaths')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center font-mono text-foreground">
                    {mastery.count}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-bold ${mastery.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                        {Math.round(mastery.winRate)}%
                      </span>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${mastery.winRate >= 50 ? 'bg-success' : 'bg-destructive'}`}
                          style={{ width: `${mastery.winRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center font-mono text-warning">
                    {Math.round(mastery.avgIp)}
                  </td>
                  <td className="p-3 text-right font-mono text-foreground">
                    {formatNumber(mastery.fame)}
                  </td>
                </tr>

                {expandedWeaponId === mastery.id && (
                  <tr className="bg-muted/30">
                    <td colSpan={5} className="p-0 border-b border-border">
                      <FeatureLock
                        title={t('advancedWeaponAnalysis')}
                        description={t('advancedWeaponAnalysisDesc')}
                        lockedContent={
                          <div className="p-12 flex flex-col items-center justify-center text-center bg-muted/10">
                            <div className="bg-primary/10 p-4 rounded-full mb-4">
                              <Activity className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">{t('weaponAnalyticsLocked')}</h3>
                            <p className="text-muted-foreground max-w-md">
                              {t('weaponAnalyticsLockedDesc')}
                            </p>
                          </div>
                        }
                      >
                        <div className="p-6 animate-in fade-in slide-in-from-top-2">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left: Radar Chart */}
                            <div className="bg-card/50 rounded-xl border border-border p-4">
                              <h4 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
                                <Activity className="h-4 w-4" /> {t('weaponProfile')}
                              </h4>
                              <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getWeaponAnalysis(mastery.id).map(d => ({ ...d, subject: t(`attributes.${d.subject}`) }))}>
                                    <PolarGrid stroke="var(--border)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name={t('metrics')} dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Right: Advanced Stats */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
                                <BarChart2 className="h-4 w-4" /> {t('performanceMetrics')}
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-card/50 p-4 rounded-lg border border-border">
                                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('famePerMatch')}</div>
                                  <div className="text-xl font-mono text-success">
                                    {formatNumber(Math.round(mastery.fame / mastery.count))}
                                  </div>
                                </div>
                                <div className="bg-card/50 p-4 rounded-lg border border-border">
                                  <Tooltip content={t('survivalRateTooltip')}>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1 w-fit">
                                      {t('survivalRate')} <AlertCircle className="h-3 w-3" />
                                    </div>
                                  </Tooltip>
                                  <div className="text-xl font-mono text-info">
                                    {Math.round((mastery.kills / (mastery.kills + mastery.deaths || 1)) * 100)}%
                                  </div>
                                </div>
                                <div className="bg-card/50 p-4 rounded-lg border border-border">
                                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{tk('totalFame')}</div>
                                  <div className="text-xl font-mono text-warning">
                                    {formatNumber(mastery.fame)}
                                  </div>
                                </div>
                                <div className="bg-card/50 p-4 rounded-lg border border-border">
                                  <Tooltip content={t('efficiencyScoreTooltip')}>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1 w-fit">
                                      {t('efficiencyScore')} <AlertCircle className="h-3 w-3" />
                                    </div>
                                  </Tooltip>
                                  <div className="text-xl font-mono text-purple-400">
                                    {Math.round((mastery.fame / (mastery.totalIp / mastery.count)) * 10)}
                                  </div>
                                </div>
                              </div>

                              <div className="bg-card/50 p-4 rounded-lg border border-border mt-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <Zap className="h-4 w-4 text-warning" />
                                  <span className="font-bold text-foreground">{t('weaponInsight')}</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {t('winRateTrend', { trend: mastery.winRate >= 50 ? t('positive') : t('negative') })}
                                  {' '}{t('avgIpLabel')} <span className="text-foreground">{Math.round(mastery.avgIp)}</span>.
                                  {mastery.kills > mastery.deaths * 1.5
                                    ? (userProfile?.characterName === selectedPlayer.Name
                                      ? t('highlyEffectiveYou')
                                      : t('highlyEffectivePlayer', { name: selectedPlayer.Name }))
                                    : (mastery.deaths > mastery.kills
                                      ? (userProfile?.characterName === selectedPlayer.Name
                                        ? t('struggleYou')
                                        : t('strugglePlayer', { name: selectedPlayer.Name }))
                                      : t('performanceBalanced'))}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </FeatureLock>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {masteryData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                  {t('noWeaponDataRecent')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ItemNameDisplay({ itemId }: { itemId: string }) {
  const t = useTranslations('PvpIntel');
  const locale = useLocale();
  const [name, setName] = useState<string>(t('unknownItem'));

  useEffect(() => {
    let mounted = true;
    getItemNameService(itemId, locale).then(resolved => {
      if (mounted && resolved) setName(resolved);
    });
    return () => { mounted = false; };
  }, [itemId, locale, t]);

  return <span title={itemId}>{name}</span>;
}

function PlayerDetailView({ player, stats, recentKills, recentDeaths, onBack, onEventClick, userProfile }: any) {
  const t = useTranslations('PvpIntel');
  const tk = useTranslations('KillFeed');
  const [timeFilter, setTimeFilter] = useState<'all' | '12h' | '24h' | '7d' | '30d'>('all');
  
  // Filter Logic
  const filterEvents = (events: any[]) => {
    if (timeFilter === 'all') return events;
    const now = new Date().getTime();
    let cutoff = 0;

    switch (timeFilter) {
      case '12h': cutoff = 12 * 60 * 60 * 1000; break;
      case '24h': cutoff = 24 * 60 * 60 * 1000; break;
      case '7d': cutoff = 7 * 24 * 60 * 60 * 1000; break;
      case '30d': cutoff = 30 * 24 * 60 * 60 * 1000; break;
    }

    return events.filter((e: any) => (now - new Date(e.TimeStamp).getTime()) < cutoff);
  };

  const filteredKills = filterEvents(recentKills);
  const filteredDeaths = filterEvents(recentDeaths);

  // Analytics Data Preparation
  const chartData = useMemo(() => {
    const allEvents = [
      ...filteredKills.map((k: any) => ({ ...k, type: 'kill', time: new Date(k.TimeStamp).getTime() })),
      ...filteredDeaths.map((d: any) => ({ ...d, type: 'death', time: new Date(d.TimeStamp).getTime() }))
    ].sort((a, b) => a.time - b.time);

    if (allEvents.length === 0) return [];

    const buckets: Record<string, { time: string, kills: number, deaths: number }> = {};

    allEvents.forEach(e => {
      const date = new Date(e.time);
      const key = (timeFilter === '12h' || timeFilter === '24h')
        ? `${date.getHours()}:00`
        : `${date.getDate()}/${date.getMonth() + 1}`;

      if (!buckets[key]) buckets[key] = { time: key, kills: 0, deaths: 0 };
      if (e.type === 'kill') buckets[key].kills++;
      else buckets[key].deaths++;
    });

    return Object.values(buckets);
  }, [filteredKills, filteredDeaths, timeFilter]);

  // Enhanced Metrics
  const metrics = useMemo(() => {
    const total = filteredKills.length + filteredDeaths.length;
    if (total === 0) return null;

    const winRate = ((filteredKills.length / total) * 100).toFixed(1);
    const avgIpDiff = filteredKills.reduce((acc: number, k: any) => acc + (k.Killer.AverageItemPower - k.Victim.AverageItemPower), 0) / (filteredKills.length || 1);

    const weapons: Record<string, number> = {};
    filteredKills.forEach((k: any) => {
      const w = k.Killer.Equipment.MainHand?.Type;
      if (w) weapons[w] = (weapons[w] || 0) + 1;
    });
    const topWeapon = Object.entries(weapons).sort((a, b) => b[1] - a[1])[0]?.[0];

    return { winRate, avgIpDiff: Math.round(avgIpDiff), topWeapon };
  }, [filteredKills, filteredDeaths]);

  const getTacticalAnalysis = () => {
    if (recentKills.length === 0 && recentDeaths.length === 0) return null;

    let totalGroupSize = 0;
    let eventsWithGroupData = 0;

    recentKills.forEach((kill: any) => {
      const groupSize = kill.GroupMembers ? kill.GroupMembers.length : (kill.numberOfParticipants || 1);
      totalGroupSize += groupSize;
      eventsWithGroupData++;
    });

    const avgGroupSize = eventsWithGroupData > 0 ? Math.round(totalGroupSize / eventsWithGroupData) : 1;
    let playstyleLabel = t('noTacticalData');
    let playstyleColor = "text-muted-foreground";

    if (eventsWithGroupData > 0) {
      if (avgGroupSize === 1) {
        playstyleLabel = t('soloWolf');
        playstyleColor = "text-warning";
      } else if (avgGroupSize <= 5) {
        playstyleLabel = t('smallScale');
        playstyleColor = "text-info";
      } else {
        playstyleLabel = t('zergLargeScale');
        playstyleColor = "text-destructive";
      }
    }

    const hourCounts = new Array(24).fill(0);
    [...recentKills, ...recentDeaths].forEach(e => {
      const hour = new Date(e.TimeStamp).getHours();
      hourCounts[hour]++;
    });

    let maxActivity = 0;
    let bestWindowStart = 0;
    for (let i = 0; i < 24; i++) {
      let count = 0;
      for (let j = 0; j < 4; j++) {
        count += hourCounts[(i + j) % 24];
      }
      if (count > maxActivity) {
        maxActivity = count;
        bestWindowStart = i;
      }
    }
    const peakTime = `${bestWindowStart.toString().padStart(2, '0')}:00 - ${((bestWindowStart + 4) % 24).toString().padStart(2, '0')}:00`;

    let punchingUp = 0;
    let punchingDown = 0;
    let fairFights = 0;

    recentKills.forEach((kill: any) => {
      const diff = kill.Killer.AverageItemPower - kill.Victim.AverageItemPower;
      if (diff > 100) punchingDown++;
      else if (diff < -50) punchingUp++;
      else fairFights++;
    });

    const totalRated = punchingUp + punchingDown + fairFights;
    const fightStyle = totalRated > 0
      ? (punchingUp > punchingDown ? t('underdog') : (punchingDown > punchingUp * 2 ? t('gearCrutch') : t('balancedFighter')))
      : "N/A";

    return { playstyleLabel, playstyleColor, avgGroupSize, peakTime, fightStyle };
  };

  const tactical = getTacticalAnalysis();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> {tk('backToFeed')}
        </button>

        <div className="flex bg-card border border-border rounded-lg p-1 overflow-x-auto">
          {(['all', '12h', '24h', '7d', '30d'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${timeFilter === filter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
            >
              {tk(`timeFilters.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Player Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="h-20 w-20 bg-accent rounded-full flex items-center justify-center border-4 border-background">
          <span className="text-2xl font-bold text-primary">{player.Name[0]}</span>
        </div>
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tight">{player.Name}</h2>
          <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
            <span>{player.GuildName || tk('noGuild')}</span>
            {player.AllianceName && (
              <>
                <span>•</span>
                <span>[{player.AllianceName}]</span>
              </>
            )}
          </div>
        </div>

        {stats && (
          <div className="ml-auto grid grid-cols-3 gap-4 text-center">
            <div className="bg-background/50 p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground uppercase font-bold">{tk('kills')}</div>
              <div className="text-xl font-mono text-green-500">{stats.KillFame > 0 ? (stats.KillFame / 1000000).toFixed(2) + 'm' : '0'}</div>
            </div>
            <div className="bg-background/50 p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground uppercase font-bold">{tk('deaths')}</div>
              <div className="text-xl font-mono text-red-500">{stats.DeathFame > 0 ? (stats.DeathFame / 1000000).toFixed(2) + 'm' : '0'}</div>
            </div>
            <div className="bg-background/50 p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground uppercase font-bold">{tk('ratio')}</div>
              <div className="text-xl font-mono text-amber-500">
                {stats.DeathFame > 0 ? (stats.KillFame / stats.DeathFame).toFixed(2) : '∞'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Metrics & Charts */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border p-4 rounded-xl">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs font-bold uppercase">{t('winRate')}</span>
                </div>
                <div className="text-2xl font-black">{metrics.winRate}%</div>
                <div className="text-xs text-muted-foreground">{t('performanceTooltip')}</div>
              </div>
              <div className="bg-card border border-border p-4 rounded-xl">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Swords className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold uppercase">{tk('avgIpDiff')}</span>
                </div>
                <div className={`text-2xl font-black ${metrics.avgIpDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.avgIpDiff > 0 ? '+' : ''}{metrics.avgIpDiff}
                </div>
                <div className="text-xs text-muted-foreground">{tk('vsVictims')}</div>
              </div>
            </div>

            {/* Top Weapon */}
            <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-muted-foreground mb-1">{t('bestWeapons')}</div>
                <div className="font-bold text-sm truncate w-32">
                  {metrics.topWeapon ? <ItemNameDisplay itemId={metrics.topWeapon} /> : 'N/A'}
                </div>
              </div>
              <div className="h-12 w-12 bg-accent/50 rounded-lg border border-border p-1">
                {metrics.topWeapon && <ItemIcon item={metrics.topWeapon} className="h-full w-full object-contain" />}
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-card border border-border p-4 rounded-xl h-64 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                {t('combatAnalysis')}
              </h3>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                    labelStyle={{ color: '#999', marginBottom: '4px' }}
                    cursor={{ fill: '#ffffff10' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="kills" name={tk('kills')} fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="deaths" name={tk('deaths')} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tactical Analysis */}
      {tactical && (
        <div className="bg-card/70 rounded-xl p-5 border border-border/80 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h4 className="font-bold text-info mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('tacticalInsight')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Tooltip content={t('playstyleTooltip')}>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1 w-fit">
                    {t('playstylePreference')} <AlertCircle className="h-3 w-3" />
                  </div>
                </Tooltip>
                <div className={`text-2xl font-bold ${tactical.playstyleColor}`}>
                  {tactical.playstyleLabel}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('avgGroupSize')} <span className="text-foreground font-mono">{tactical.avgGroupSize}</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t('activityPeak')}</div>
                <div className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {tactical.peakTime}
                </div>
              </div>

              <div>
                <Tooltip content={t('fightPreferenceTooltip')}>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1 w-fit">
                    {t('fightPreference')} <AlertCircle className="h-3 w-3" />
                  </div>
                </Tooltip>
                <div className="text-sm font-medium text-foreground">
                  {tactical.fightStyle}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {t('fightPreferenceDesc')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PvpIntelPage() {
  const t = useTranslations('PvpIntel');
  const tk = useTranslations('KillFeed');
  const locale = useLocale();
  const { user, profile } = useAuth();
  const { hasAccess } = usePremiumAccess();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [expandedWeaponId, setExpandedWeaponId] = useState<string | null>(null);
  const [recentKills, setRecentKills] = useState<any[]>([]);
  const [recentDeaths, setRecentDeaths] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [weaponMasteryData, setWeaponMasteryData] = useState<any[]>([]);
  const [activityTab, setActivityTab] = useState<'kills' | 'deaths' | 'knockouts'>('kills');
  const [expandedFightId, setExpandedFightId] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const { server: region, setServer: setRegion } = useServer();

  // Guild Data
  const [guildEvents, setGuildEvents] = useState<any[]>([]);
  const [guildMembers, setGuildMembers] = useState<any[]>([]);
  const [guildInfo, setGuildInfo] = useState<any>(null);
  const [guildLoading, setGuildLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Derived Guild Stats
  const [computedGuildActivity, setComputedGuildActivity] = useState<any[]>([]);
  const [computedTopRivals, setComputedTopRivals] = useState<any[]>([]);

  // Alliance Data
  const [allianceData, setAllianceData] = useState<any[]>([]);

  // Access State
  const [access, setAccess] = useState<{ hasAccess: boolean, reason: 'none' | 'premium' | 'guild' | 'pending_guild' | 'alliance' }>({ hasAccess: false, reason: 'none' });

  // Fake Data for Locked View
  const fakeKills = useMemo(() => generateFakeCombatEvents(50, 'kill'), []);
  const fakeDeaths = useMemo(() => generateFakeCombatEvents(50, 'death'), []);

  // Item Names Mapping
  const [itemNames, setItemNames] = useState<Record<string, string>>({});

  useEffect(() => {
    getItems(locale as any).then(items => {
      const map: Record<string, string> = {};
      items.forEach(i => map[i.id] = i.name);
      setItemNames(map);
    });
  }, [locale]);

  const formatItemName = (type: string) => {
    if (!type) return t('unknownItem');

    const tierMatch = type.match(/^T(\d+)_/);
    const tier = tierMatch ? tierMatch[1] : '';
    const enchantMatch = type.match(/@(\d+)$/);
    const enchantment = enchantMatch ? enchantMatch[1] : '0';

    let baseType = type.replace(/@\d+$/, '');
    let name = itemNames[type] || itemNames[baseType];

    if (!name) {
      name = baseType.replace(/^T\d+_/, '').replace(/_/g, ' ');
      name = name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    const tierDisplay = tier ? ` (${t('tier')} ${tier}${enchantment !== '0' ? `.${enchantment}` : ''})` : '';
    return `${name}${tierDisplay}`;
  };

  useEffect(() => {
    if (user) {
      initializeUserProfile();
    }
  }, [user]);

  useEffect(() => {
    const determineAndFetchGuildData = async () => {
      let targetGuildId = null;

      if (selectedPlayer) {
        targetGuildId = selectedPlayer.GuildId;
      } else if (userProfile?.guildId) {
        targetGuildId = userProfile.guildId;
      }

      if (targetGuildId) {
        fetchGuildData(targetGuildId);
      } else {
        setGuildInfo(null);
        setGuildMembers([]);
        setGuildEvents([]);
        setComputedGuildActivity([]);
        setComputedTopRivals([]);
        setAllianceData([]);
      }
    };

    determineAndFetchGuildData();
  }, [selectedPlayer, userProfile, region]);

  const initializeUserProfile = async () => {
    if (!user) return;
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);

    const accessResult = await checkAccess(user.uid);
    setAccess(accessResult);

    if (profile?.characterId && !selectedPlayer && !query) {
      handleSelectPlayer(profile.characterId);
    }
  };

  const fetchGuildData = async (targetGuildId: string) => {
    setGuildLoading(true);

    const { info: gInfo } = await getGuildInfo(targetGuildId, region);
    setGuildInfo(gInfo);

    const { members } = await getGuildMembers(targetGuildId, region);
    setGuildMembers(members || []);

    const { events } = await getGuildEvents(targetGuildId, region);
    setGuildEvents(events || []);

    if (events && events.length > 0) {
      const activityMap = new Array(24).fill(0);
      events.forEach((e: any) => {
        const hour = new Date(e.TimeStamp).getHours();
        activityMap[hour]++;
      });
      const maxActivity = Math.max(...activityMap, 1);
      const activityData = activityMap.map((count, i) => ({
        hour: i.toString().padStart(2, '0'),
        activity: Math.round((count / maxActivity) * 100) || 5
      }));
      setComputedGuildActivity(activityData);

      const rivalMap: Record<string, { kills: number, deaths: number, name: string }> = {};
      events.forEach((e: any) => {
        const isKiller = e.Killer.GuildId === targetGuildId;
        const rivalGuildId = isKiller ? e.Victim.GuildId : e.Killer.GuildId;
        const rivalGuildName = isKiller ? (e.Victim.GuildName || tk('noGuild')) : (e.Killer.GuildName || tk('noGuild'));

        if (rivalGuildId && rivalGuildId !== targetGuildId) {
          if (!rivalMap[rivalGuildId]) {
            rivalMap[rivalGuildId] = { kills: 0, deaths: 0, name: rivalGuildName };
          }
          if (isKiller) {
            rivalMap[rivalGuildId].kills++;
          } else {
            rivalMap[rivalGuildId].deaths++;
          }
        }
      });

      const rivalsList = Object.values(rivalMap)
        .map(r => ({
          ...r,
          kd: r.deaths > 0 ? parseFloat((r.kills / r.deaths).toFixed(2)) : r.kills,
          trend: r.deaths > r.kills ? 'down' : (r.kills > r.deaths * 1.5 ? 'up' : 'neutral')
        }))
        .sort((a, b) => (b.kills + b.deaths) - (a.kills + a.deaths))
        .slice(0, 3);
      setComputedTopRivals(rivalsList);
    } else {
      setComputedGuildActivity(Array(24).fill(0).map((_, i) => ({ hour: i.toString().padStart(2, '0'), activity: 5 })));
      setComputedTopRivals([]);
    }

    if (gInfo?.AllianceId) {
      const { info: aInfo } = await getAllianceInfo(gInfo.AllianceId, region);
      if (aInfo) {
        const allianceObj = {
          id: aInfo.AllianceId,
          alliance: aInfo.AllianceName,
          tag: `[${aInfo.AllianceTag}]`,
          stats: { kills: 0, deaths: 0, fame: aInfo.KillFame || 0, kd: 0 },
          territories: 'N/A',
          hideouts: 'N/A',
          seasonPoints: 'N/A',
          seasonRank: 'N/A',
          guilds: aInfo.Guilds || [],
          topPlayers: []
        };
        setAllianceData([allianceObj]);
      }
    } else {
      setAllianceData([]);
    }

    setGuildLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSelectedPlayer(null);
    setRecentKills([]);
    setRecentDeaths([]);
    setAllEvents([]);
    const { results, error } = await searchPlayer(query);
    if (results) {
      setResults(results);
    }
    setLoading(false);
  };

  const handleSelectPlayer = async (playerId: string, playerRegion?: 'west' | 'east' | 'europe') => {
    let targetRegion = playerRegion || region;

    setStatsLoading(true);
    let { stats, kills, deaths } = await getPlayerStats(playerId, targetRegion);

    if (!stats && !playerRegion) {
      const otherRegions = (['west', 'east', 'europe'] as const).filter(r => r !== targetRegion);
      for (const r of otherRegions) {
        const retry = await getPlayerStats(playerId, r);
        if (retry.stats) {
          stats = retry.stats;
          kills = retry.kills;
          deaths = retry.deaths;
          targetRegion = r;
          break;
        }
      }
    }

    if (stats) {
      setRegion(targetRegion);
      setSelectedPlayer(stats);
      setRecentKills(kills || []);
      setRecentDeaths(deaths || []);
      
      // Fetch all events to get knockouts
      const { events } = await getPlayerEvents(playerId, targetRegion);
      setAllEvents(events || []);
      
      // Fetch weapon mastery (includes PvP + PvE usage)
      const { mastery } = await getPlayerWeaponMastery(playerId, targetRegion);
      setWeaponMasteryData(mastery || []);
      
      setResults([]);
    } else if (!playerRegion) {
      setSelectedPlayer(null);
      setRecentKills([]);
      setRecentDeaths([]);
      setAllEvents([]);
      setWeaponMasteryData([]);
      setResults([]);
    }
    setStatsLoading(false);
  };

  const getThreatAnalysis = () => {
    const deathsByWeapon: Record<string, number> = {};
    recentDeaths.forEach(death => {
      const killer = death.Killer;
      const weapon = killer.Equipment?.MainHand;
      if (weapon) {
        const baseName = weapon.Type;
        deathsByWeapon[baseName] = (deathsByWeapon[baseName] || 0) + 1;
      }
    });

    return Object.entries(deathsByWeapon)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  const getWeaponUsage = () => {
    const usage: Record<string, number> = {};
    recentKills.forEach((kill: any) => {
      const isKiller = kill.Killer.Name === selectedPlayer.Name;
      const equipment = isKiller ? kill.Killer.Equipment : kill.Victim.Equipment;
      const weapon = equipment?.MainHand;
      if (weapon) {
        const baseName = weapon.Type;
        usage[baseName] = (usage[baseName] || 0) + 1;
      }
    });

    return Object.entries(usage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  const weaponMastery = useMemo(() => {
    // Use API mastery data if available (includes PvE + all weapon usage)
    if (weaponMasteryData && weaponMasteryData.length > 0) {
      return weaponMasteryData.map((w: any) => ({
        id: w.Type || w.id,
        kills: w.Kills || w.kills || 0,
        deaths: w.Deaths || w.deaths || 0,
        fame: w.TotalFame || w.fame || 0,
        totalIp: w.TotalItemPower || w.totalIp || 0,
        count: (w.Kills || w.kills || 0) + (w.Deaths || w.deaths || 0),
        winRate: ((w.Kills || w.kills || 0) / ((w.Kills || w.kills || 0) + (w.Deaths || w.deaths || 0))) * 100 || 0,
        avgIp: w.AvgItemPower || (w.TotalItemPower || 0) / Math.max((w.Kills || 0) + (w.Deaths || 0), 1) || 0,
        sampleId: `T4_${w.Type || w.id}`
      })).sort((a, b) => b.count - a.count);
    }
    // Fallback to calculating from kills/deaths (PvP only)
    return calculateMastery(recentKills, recentDeaths);
  }, [weaponMasteryData, recentKills, recentDeaths]);

  const fakeWeaponMastery = useMemo(() => calculateMastery(fakeKills, fakeDeaths), [fakeKills, fakeDeaths]);

  const renderItemSlot = (item: any) => (
    <div className="bg-card rounded border border-border p-1 w-20 h-20 relative group/item shrink-0">
      {item && (
        <Tooltip content={formatItemName(item.Type)} className="w-full h-full">
          <ItemIcon item={item} className="w-full h-full object-contain" />
        </Tooltip>
      )}
    </div>
  );

  return (
    <PageShell
      title={t('title')}
      backgroundImage='/background/ao-pvp.jpg'
      description={t('description')}
      icon={<Sword className="h-6 w-6" />}
      headerActions={
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuery(val);
                    if (val === '') {
                      if (userProfile?.characterId) {
                        handleSelectPlayer(userProfile.characterId, userProfile.region);
                      } else {
                        setSelectedPlayer(null);
                        setRecentKills([]);
                        setRecentDeaths([]);
                        setAllEvents([]);
                        setResults([]);
                      }
                    }
                  }}
                  placeholder={t('searchPlaceholder')}
                  className="w-full md:w-64"
                  icon={<Search className="h-4 w-4 text-muted-foreground" />}
                />
              </form>
            </div>

            <button
              onClick={(e) => { e.preventDefault(); handleSearch(e as any); }}
              disabled={loading}
              className="p-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      }
    >

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Search Results */}
      {results.length > 0 && (
        <div className="grid gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-muted-foreground">{t('searchResults')}</h2>
            <button onClick={() => setResults([])} className="text-sm text-muted-foreground hover:text-foreground">{t('clear')}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((player) => (
              <div
                key={`${player.Id}-${player.region}`}
                onClick={() => handleSelectPlayer(player.Id, player.region)}
                className="p-4 bg-card rounded-xl border border-border hover:border-destructive hover:bg-muted cursor-pointer transition-all flex justify-between items-center group"
              >
                <div>
                  <div className="font-bold text-lg group-hover:text-destructive transition-colors flex items-center gap-2">
                    {player.Name}
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-normal uppercase">
                      {player.region}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">{player.GuildName ? `[${player.GuildName}]` : tk('noGuild')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{tk('killFame')}</div>
                  <div className="font-mono text-destructive font-medium">{formatNumber(player.KillFame)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State / Call to Action */}
      {!selectedPlayer && !loading && !statsLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold text-foreground mb-3">{t('noPlayerSelected')}</h2>
          <p className="text-muted-foreground max-w-md text-center mb-8 leading-relaxed">
            {t('noPlayerSelectedDesc')}
          </p>

          {user && !userProfile?.characterId && (
            <Link
              href="/settings"
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all flex items-center gap-2"
            >
              <UserIcon className="h-4 w-4" />
              {t('linkCharacter')}
            </Link>
          )}

          {!user && (
            <div className="flex gap-4">
              <div className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg border border-border">
                {t('signinTip')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Player Stats */}
      {statsLoading && (
        <div className="text-center py-20">
          <RefreshCw className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('analyzing')}</p>
        </div>
      )}

      {selectedPlayer && (
        <div className="space-y-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 bg-card/80 rounded-xl border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Sword className="h-64 w-64 text-muted-foreground" />
            </div>

            {userProfile?.characterId === selectedPlayer.Id && (
              <div className="absolute top-5 right-4 px-3 py-1 bg-primary/20 text-primary border border-primary/50 rounded-full text-xs font-bold flex items-center gap-1 w-fit z-10">
                <UserIcon className="h-3 w-3" />
                {t('myStats')}
              </div>
            )}
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-foreground flex items-center gap-3">
                {selectedPlayer.Name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {selectedPlayer.GuildName ? <span className="text-foreground font-medium">{selectedPlayer.GuildName}</span> : tk('noGuild')}
                  {selectedPlayer.AllianceName && <span className="text-muted-foreground">[{selectedPlayer.AllianceName}]</span>}
                </span>
                <span className="text-foreground flex items-center gap-2">
                  <Swords className="h-4 w-4 text-muted-foreground" />
                  {tk('avgIp')}: <span className="text-warning font-bold">{Math.round(selectedPlayer.AverageItemPower || 0)}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
              <div className="p-4 bg-card/50 rounded-lg text-center border border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{tk('pveFame')}</div>
                <div className="font-mono text-success text-xl font-bold">
                  {formatNumber(selectedPlayer.LifetimeStatistics?.PvE?.Total)}
                </div>
              </div>
              <div className="p-4 bg-card/50 rounded-lg text-center border border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{tk('killFame')}</div>
                <div className="font-mono text-destructive text-xl font-bold">
                  {formatNumber(selectedPlayer.KillFame)}
                </div>
              </div>
              <div className="p-4 bg-card/50 rounded-lg text-center border border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{tk('deathFame')}</div>
                <div className="font-mono text-foreground text-xl font-bold">
                  {formatNumber(selectedPlayer.DeathFame)}
                </div>
              </div>
              <div className="p-4 bg-card/50 rounded-lg text-center border border-border">
                <Tooltip content={tk('killDeathRatioTooltip')}>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    {tk('killDeathRatio')} <AlertCircle className="h-3 w-3" />
                  </div>
                </Tooltip>
                <div className="font-mono text-warning text-xl font-bold">
                  {selectedPlayer.DeathFame > 0
                    ? (selectedPlayer.KillFame / selectedPlayer.DeathFame).toFixed(2)
                    : '∞'}
                </div>
              </div>
            </div>
          </div>

          <PlayerDetailView 
            player={selectedPlayer}
            stats={selectedPlayer}
            recentKills={recentKills}
            recentDeaths={recentDeaths}
            onBack={() => setSelectedPlayer(null)}
            onEventClick={setExpandedFightId}
            userProfile={userProfile}
          />

          <div className="bg-card/50 rounded-xl border border-border overflow-hidden mb-8">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warning" />
                {t('advancedWeaponMasteryHistory')}
              </h3>
            </div>

            <FeatureLock
              title={t('weaponMasteryAnalysis')}
              description={t('weaponMasteryAnalysisDesc')}
              lockedContent={
                <WeaponMasteryTable
                  masteryData={fakeWeaponMastery}
                  expandedWeaponId={expandedWeaponId}
                  setExpandedWeaponId={setExpandedWeaponId}
                  formatItemName={formatItemName}
                  userProfile={userProfile}
                  selectedPlayer={selectedPlayer}
                />
              }
            >
              <WeaponMasteryTable
                masteryData={weaponMastery}
                expandedWeaponId={expandedWeaponId}
                setExpandedWeaponId={setExpandedWeaponId}
                formatItemName={formatItemName}
                userProfile={userProfile}
                selectedPlayer={selectedPlayer}
              />
            </FeatureLock>
          </div>

          <FeatureLock
            title={t('combatAnalytics')}
            description={t('combatAnalyticsDesc')}
            lockedContent={
              <AdvancedAnalytics
                kills={fakeKills}
                deaths={fakeDeaths}
                playerId={selectedPlayer.Id}
              />
            }
          >
            <AdvancedAnalytics
              kills={recentKills}
              deaths={recentDeaths}
              playerId={selectedPlayer.Id}
            />
          </FeatureLock>

          <div className="bg-card border border-border rounded-xl p-1 mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 pt-3 mb-4 gap-3 sm:gap-0">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('recentFights')}
              </h4>
              <OptionSelector
                options={[
                  { label: tk('lethalKills'), value: 'kills', color: 'green' },
                  { label: tk('lethalDeaths'), value: 'deaths', color: 'red' },
                  { label: tk('knockouts'), value: 'knockouts', color: 'amber' },
                ]}
                selected={activityTab}
                onChange={(val) => setActivityTab(val as any)}
              />
            </div>
            <div className="space-y-2 px-3 pb-3">
              {(() => {
                let events = [];
                if (activityTab === 'kills') {
                  events = recentKills.filter(k => k.TotalVictimKillFame > 0).map(k => ({ ...k, type: 'kill' }));
                } else if (activityTab === 'deaths') {
                  events = recentDeaths.filter(d => d.TotalVictimKillFame > 0).map(d => ({ ...d, type: 'death' }));
                } else {
                  // Knockouts - filter from allEvents for events with 0 fame
                  events = allEvents
                    .filter(e => e.TotalVictimKillFame === 0)
                    .map(e => ({
                      ...e,
                      type: e.Killer.Name === selectedPlayer.Name ? 'kill' : 'death'
                    }));
                }

                if (events.length === 0) {
                  const typeLabel = activityTab === 'knockouts' ? tk('knockouts') : (activityTab === 'kills' ? tk('lethalKills') : tk('lethalDeaths'));
                  return (
                    <div className="text-center py-12 text-muted-foreground italic border border-dashed border-border rounded-lg bg-card/20">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground mb-2" />
                        <span>{t('noRecentEvents', { type: typeLabel })}</span>
                      </div>
                    </div>
                  );
                }

                return events.sort((a: any, b: any) => new Date(b.TimeStamp).getTime() - new Date(a.TimeStamp).getTime())
                  .map((event) => {
                    const isKill = event.type === 'kill';
                    const isExpanded = expandedFightId === event.EventId;
                    const isKnockout = event.TotalVictimKillFame === 0;

                    return (
                      <div key={event.EventId} className={`rounded-lg border transition-all duration-300 ${isKill
                        ? 'bg-success/10 border-success/30 hover:bg-success/20'
                        : (isKnockout ? 'bg-warning/10 border-warning/30 hover:bg-warning/20' : 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20')
                        } ${isExpanded ? 'bg-opacity-50 border-opacity-80' : ''}`}>
                        <div
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 cursor-pointer gap-3 sm:gap-0"
                          onClick={() => setExpandedFightId(isExpanded ? null : event.EventId)}
                        >
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className={`w-16 text-center text-xs font-bold py-1 rounded shrink-0 ${isKill
                              ? 'bg-success/20 text-success'
                              : (isKnockout ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive')
                              }`}>
                              {isKnockout ? tk('killType.knockout') : (isKill ? tk('killType.kill') : tk('killType.death'))}
                            </div>

                            <Tooltip content={formatItemName(event.Killer.Equipment?.MainHand?.Type)}>
                              <div className="h-10 w-10 bg-card/50 rounded border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                                <ItemIcon item={event.Killer.Equipment?.MainHand} className="w-full h-full object-contain" />
                              </div>
                            </Tooltip>

                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-foreground truncate">
                                {isKill
                                  ? (isKnockout ? tk('knockedOut') : tk('killed'))
                                  : (isKnockout ? tk('knockedOutBy') : tk('killedBy'))
                                } <span className={isKill ? 'text-destructive' : 'text-success'}>{isKill ? event.Victim.Name : event.Killer.Name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                                <span className="truncate">{isKill ? event.Victim.GuildName : event.Killer.GuildName || tk('noGuild')}</span>
                                <span>•</span>
                                <span className="shrink-0">{tk('ip')}: {Math.round(isKill ? event.Victim.AverageItemPower : event.Killer.AverageItemPower)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-[5.5rem] sm:pl-0">
                            <div className="text-right">
                              <div className={`font-mono ${isKill ? 'text-success' : 'text-destructive'}`}>
                                {isKill ? '+' : '-'}{event.TotalVictimKillFame.toLocaleString()} {tk('fame')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(event.TimeStamp).toLocaleTimeString()}
                              </div>
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="h-px bg-border/50 my-3" />
                            <div className="p-4 border-b border-border bg-muted/30">
                                <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                                    <Target className="h-5 w-5 text-destructive" />
                                    {t('battleAnalysis')}
                                </h3>
                                <EventDetailContent event={event} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              })()}
            </div>
          </div>
        </div>
      )}
      <InfoStrip currentPage="pvp-intel">
        <InfoBanner icon={<Target className="w-4 h-4" />} color="text-red-400" title={t('realtimeIntel')}>
          <p>{t('realtimeIntelDesc')}</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-xs opacity-90">
            <li>{t('realtimeIntelPoint1')}</li>
            <li>{t('realtimeIntelPoint2')}</li>
            <li>{t('realtimeIntelPoint3')}</li>
          </ul>
        </InfoBanner>
      </InfoStrip>
    </PageShell>
  );
}

function EventDetailContent({ event }: { event: any }) {
  const tk = useTranslations('KillFeed');
  const locale = useLocale();
  const { server } = useServer();
  const [metadata, setMetadata] = useState<any>(null);
  const [localizedNames, setLocalizedNames] = useState<Record<string, string>>({});

  useEffect(() => {
    getEventMetadataAction(event, server).then(async (md) => {
      setMetadata(md);
      // Collect item IDs from killer and victim equipment
      const ids = new Set<string>();
      const pushEquip = (eq?: any) => {
        if (!eq) return;
        Object.values(eq).forEach((it: any) => { if (it?.Type) ids.add(it.Type); });
      };
      pushEquip(event?.Killer?.Equipment);
      pushEquip(event?.Victim?.Equipment);

      // Resolve localized names for all collected IDs
      const pairs = await Promise.all(Array.from(ids).map(async id => [id, await getItemNameService(id, locale)] as const));
      const map: Record<string, string> = {};
      pairs.forEach(([id, name]) => { if (name) map[id] = name; });
      setLocalizedNames(map);
    });
  }, [event, server, locale]);

  const mergedMetadata = useMemo(() => ({ ...(metadata || {}), names: { ...(metadata?.names || {}), ...(localizedNames || {}) } }), [metadata, localizedNames]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-card/40 p-3 rounded border border-border/50">
        <div className="flex justify-between items-center mb-2 border-b border-border/50 pb-2">
          <h4 className="font-bold text-success text-sm flex items-center gap-2">
            <Sword className="h-4 w-4" /> {tk('killer')}
          </h4>
          <span className="text-xs text-muted-foreground">{tk('ip')}: {Math.round(event.Killer.AverageItemPower)}</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="font-medium text-foreground">{event.Killer.Name}</div>
          <span className="text-xs text-muted-foreground">[{event.Killer.GuildName}]</span>
        </div>
        <EquipmentGrid equipment={event.Killer.Equipment} metadata={mergedMetadata} />
      </div>

      <div className="bg-card/40 p-3 rounded border border-border/50">
        <div className="flex justify-between items-center mb-2 border-b border-border/50 pb-2">
          <h4 className="font-bold text-destructive text-sm flex items-center gap-2">
            <Skull className="h-4 w-4" /> {tk('victim')}
          </h4>
          <span className="text-xs text-muted-foreground">{tk('ip')}: {Math.round(event.Victim.AverageItemPower)}</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="font-medium text-foreground">{event.Victim.Name}</div>
          <span className="text-xs text-muted-foreground">[{event.Victim.GuildName}]</span>
        </div>
        <EquipmentGrid equipment={event.Victim.Equipment} metadata={mergedMetadata} />
      </div>
    </div>
  );
}

function EquipmentGrid({ equipment, metadata }: { equipment: any, metadata?: any }) {
  const tk = useTranslations('KillFeed');
  const Slot = ({ item, slotKey }: { item: any, slotKey: string }) => (
    <div className="aspect-square bg-black/20 rounded-md border border-border/50 relative group w-16 h-16 sm:w-20 sm:h-20">
      {item ? (
        <ItemTooltip item={item} metadata={metadata}>
          <div className="w-full h-full">
            <ItemIcon item={item} className="h-full w-full object-contain p-1" />
          </div>
        </ItemTooltip>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[9px] text-muted-foreground/30 font-bold uppercase select-none">
          {tk(`slots.${slotKey}`)}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-3 gap-1 w-fit">
        <Slot item={equipment.Bag} slotKey="bag" />
        <Slot item={equipment.Head} slotKey="head" />
        <Slot item={equipment.Cape} slotKey="cape" />
        <Slot item={equipment.MainHand} slotKey="main" />
        <Slot item={equipment.Armor} slotKey="armor" />
        <Slot item={equipment.OffHand} slotKey="off" />
        <Slot item={equipment.Potion} slotKey="pot" />
        <Slot item={equipment.Shoes} slotKey="shoes" />
        <Slot item={equipment.Food} slotKey="food" />
        <div />
        <Slot item={equipment.Mount} slotKey="mount" />
        <div />
      </div>
    </div>
  );
}

function ItemTooltip({ item, metadata, children }: { item: any, metadata?: any, children: React.ReactNode }) {
  const tk = useTranslations('KillFeed');
  const locale = useLocale();
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered && item && !metadata?.names?.[item.Type] && !resolvedName) {
      getItemNameService(item.Type, locale).then(name => {
        if (name) setResolvedName(name);
      });
    }
  }, [isHovered, item, metadata, resolvedName, locale]);

  if (!item) return <>{children}</>;

  const name = metadata?.names?.[item.Type] || resolvedName || item.Type;
  const price = metadata?.prices?.[item.Type];
  const totalPrice = price ? price * item.Count : 0;

  return (
    <div className="relative group/tooltip" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-popover border border-border rounded-lg p-2 z-50 hidden group-hover/tooltip:block pointer-events-none">
        <div className="text-xs font-bold text-popover-foreground text-center mb-1 break-words">{name}</div>
        <div className="flex border-t border-border justify-between text-[10px] text-muted-foreground">
          <span>{tk('count')}: {item.Count}</span>
          <span>{tk('quality')}: {item.Quality}</span>
        </div>
        {price && (
          <div className="mt-1 pt-1 border-t border-border flex justify-between text-xs font-mono">
            <span className="text-muted-foreground">{tk('estValue')}:</span>
            <span className="text-amber-500">{formatNumber(totalPrice)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
