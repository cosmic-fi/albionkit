'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { Search, Shield, Sword, Swords, Skull, Crosshair, Lock, Users, Crown, CheckCircle, AlertCircle, Clock, User as UserIcon, ChevronDown, ChevronUp, Trophy, Activity, Target, RefreshCw, Zap, TrendingUp, BarChart2, Download, Share2 } from 'lucide-react';
import { searchPlayer, getPlayerStats, getGuildEvents, getGuildInfo, getGuildMembers, getAllianceInfo } from './actions';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, checkAccess } from '@/lib/user-profile';
import { getItems } from '@/lib/item-service';
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
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';

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
    { subject: 'Mobility', A: stats.mobility, fullMark: 100 },
    { subject: 'Damage', A: stats.damage, fullMark: 100 },
    { subject: 'Control', A: stats.control, fullMark: 100 },
    { subject: 'Sustain', A: stats.sustain, fullMark: 100 },
    { subject: 'Utility', A: stats.utility, fullMark: 100 },
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
                             {mastery.count} Matches
                          </span>
                          <span className="text-xs font-mono text-warning">
                             {Math.round(mastery.avgIp)} IP
                          </span>
                       </div>
                    </div>

                    {/* Win Rate Badge */}
                    <div className="text-right">
                       <div className={`text-lg font-bold ${mastery.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                          {Math.round(mastery.winRate)}%
                       </div>
                       <div className="text-[10px] text-muted-foreground uppercase">Win Rate</div>
                    </div>
                 </div>
                 
                 {/* Expanded Details */}
                 {isExpanded && (
                    <div className="border-t border-border bg-muted/30">
                       <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                          <div className="p-3 text-center">
                             <div className="text-[10px] uppercase text-muted-foreground mb-1">K/D Ratio</div>
                             <div className="font-mono text-sm font-medium">
                                <span className="text-success">{mastery.kills}</span> / <span className="text-destructive">{mastery.deaths}</span>
                             </div>
                          </div>
                          <div className="p-3 text-center">
                             <div className="text-[10px] uppercase text-muted-foreground mb-1">Total Fame</div>
                             <div className="font-mono text-sm font-medium text-warning">{formatNumber(mastery.fame)}</div>
                          </div>
                          <div className="p-3 text-center">
                             <div className="text-[10px] uppercase text-muted-foreground mb-1">Efficiency</div>
                             <div className="font-mono text-sm font-medium text-purple-400">
                                {Math.round((mastery.fame / (mastery.totalIp / mastery.count || 1)) * 10)}
                             </div>
                          </div>
                       </div>
                       
                           <FeatureLock 
                              title="Advanced Weapon Analysis" 
                              description="Unlock deep insights, radar charts, and performance metrics for this weapon."
                              lockedContent={
                                <div className="p-8 flex flex-col items-center justify-center text-center bg-muted/10">
                                  <div className="bg-primary/10 p-3 rounded-full mb-3">
                                    <Activity className="h-6 w-6 text-primary" />
                                  </div>
                                  <h3 className="text-sm font-bold mb-1">Analytics Locked</h3>
                                  <p className="text-xs text-muted-foreground">
                                    Unlock Premium to view detailed performance metrics.
                                  </p>
                                </div>
                              }
                           >
                           <div className="p-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-6">
                                 {/* Radar Chart */}
                                 <div className="bg-card/50 rounded-xl border border-border p-3">
                                    <h4 className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-2">
                                       <Activity className="h-3 w-3" /> Weapon Profile
                                    </h4>
                                    <div className="h-56 w-full">
                                       <ResponsiveContainer width="100%" height="100%">
                                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getWeaponAnalysis(mastery.id)}>
                                             <PolarGrid stroke="var(--border)" />
                                             <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                                             <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                             <Radar name="Stats" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
                                          </RadarChart>
                                       </ResponsiveContainer>
                                    </div>
                                 </div>

                                 {/* Advanced Stats */}
                                 <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-2">
                                       <BarChart2 className="h-3 w-3" /> Metrics
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                       <div className="bg-card/50 p-3 rounded-lg border border-border">
                                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Fame/Match</div>
                                          <div className="text-lg font-mono text-success">
                                             {formatNumber(Math.round(mastery.fame / mastery.count))}
                                          </div>
                                       </div>
                                       <div className="bg-card/50 p-3 rounded-lg border border-border">
                                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Survival</div>
                                          <div className="text-lg font-mono text-info">
                                             {Math.round((mastery.kills / (mastery.kills + mastery.deaths || 1)) * 100)}%
                                          </div>
                                       </div>
                                    </div>
                                    
                                    <div className="bg-card/50 p-3 rounded-lg border border-border mt-3">
                                       <div className="flex items-center gap-2 mb-2">
                                          <Zap className="h-3 w-3 text-warning" />
                                          <span className="text-sm font-bold text-foreground">Insight</span>
                                       </div>
                                       <p className="text-xs text-muted-foreground leading-relaxed">
                                          This weapon shows a <strong>{mastery.winRate >= 50 ? 'positive' : 'negative'}</strong> win rate trend.
                                          {mastery.kills > mastery.deaths * 1.5 
                                             ? ' Highly effective for you.' 
                                             : (mastery.deaths > mastery.kills 
                                                ? ' Statistics suggest you struggle with this build.' 
                                                : ' Performance is balanced.')}
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
              No weapon data available.
           </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto sm:p-3">
        <table className="w-full text-left border-collapse">
          <thead>
              <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                <th className="p-4 font-medium">Weapon</th>
                <th className="p-4 font-medium text-center">Matches</th>
                <th className="p-4 font-medium text-center">
                    <Tooltip content="Percentage of lethal fights won">
                      <span className="border-b border-dotted border-muted-foreground cursor-help">Win Rate</span>
                    </Tooltip>
                </th>
                <th className="p-4 font-medium text-center">Avg IP</th>
                <th className="p-4 font-medium text-right">Kill Fame</th>
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
                                  {mastery.kills} Kills / {mastery.deaths} Deaths
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
                                title="Advanced Weapon Analysis" 
                                description="Unlock deep insights, radar charts, and performance metrics for this weapon."
                                lockedContent={
                                  <div className="p-12 flex flex-col items-center justify-center text-center bg-muted/10">
                                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                                      <Activity className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">Weapon Analytics Locked</h3>
                                    <p className="text-muted-foreground max-w-md">
                                      Get detailed breakdown of win rates, average IP, and playstyle analysis for this weapon build.
                                    </p>
                                  </div>
                                }
                            >
                            <div className="p-6 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  {/* Left: Radar Chart */}
                                  <div className="bg-card/50 rounded-xl border border-border p-4">
                                      <h4 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
                                        <Activity className="h-4 w-4" /> Weapon Profile
                                      </h4>
                                      <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getWeaponAnalysis(mastery.id)}>
                                              <PolarGrid stroke="var(--border)" />
                                              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                              <Radar name="Stats" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                      </div>
                                  </div>

                                  {/* Right: Advanced Stats */}
                                  <div className="space-y-4">
                                      <h4 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
                                        <BarChart2 className="h-4 w-4" /> Performance Metrics
                                      </h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-card/50 p-4 rounded-lg border border-border">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fame per Match</div>
                                            <div className="text-xl font-mono text-success">
                                              {formatNumber(Math.round(mastery.fame / mastery.count))}
                                            </div>
                                        </div>
                                        <div className="bg-card/50 p-4 rounded-lg border border-border">
                                            <Tooltip content="Percentage of fights where you survived (Win or Escape)">
                                              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1 w-fit">
                                                Survival Rate <AlertCircle className="h-3 w-3" />
                                              </div>
                                            </Tooltip>
                                            <div className="text-xl font-mono text-info">
                                              {Math.round((mastery.kills / (mastery.kills + mastery.deaths || 1)) * 100)}%
                                            </div>
                                        </div>
                                        <div className="bg-card/50 p-4 rounded-lg border border-border">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Fame</div>
                                            <div className="text-xl font-mono text-warning">
                                              {formatNumber(mastery.fame)}
                                            </div>
                                        </div>
                                        <div className="bg-card/50 p-4 rounded-lg border border-border">
                                            <Tooltip content="Fame gained per point of IP risked. Higher = Better Risk/Reward.">
                                              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1 w-fit">
                                                Efficiency Score <AlertCircle className="h-3 w-3" />
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
                                            <span className="font-bold text-foreground">Weapon Insight</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            This weapon shows a <strong>{mastery.winRate >= 50 ? 'positive' : 'negative'}</strong> win rate trend 
                                            with an average IP of <span className="text-foreground">{Math.round(mastery.avgIp)}</span>. 
                                            {mastery.kills > mastery.deaths * 1.5 
                                              ? (userProfile?.characterName === selectedPlayer.Name 
                                                  ? ' Highly effective for you.' 
                                                  : ` Highly effective for ${selectedPlayer.Name}.`)
                                              : (mastery.deaths > mastery.kills 
                                                  ? (userProfile?.characterName === selectedPlayer.Name 
                                                    ? ' Statistics suggest you struggle with this build.' 
                                                    : ` Statistics suggest ${selectedPlayer.Name} struggles with this build.`)
                                                  : ' Performance is balanced.')}
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
                      No weapon data available from recent matches.
                    </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PvpIntelPage() {
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
  const [activityTab, setActivityTab] = useState<'kills' | 'deaths' | 'knockouts'>('kills');
  const [statsLoading, setStatsLoading] = useState(false);
  const { server: region, setServer: setRegion } = useServer();



  // Guild Radar
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

  // Premium Access
  const [access, setAccess] = useState<{ hasAccess: boolean, reason: 'none' | 'premium' | 'guild' | 'pending_guild' | 'alliance' }>({ hasAccess: false, reason: 'none' });

  // Expanded View States
  const [expandedAlliance, setExpandedAlliance] = useState<string | null>(null);
  const [showGuildRoster, setShowGuildRoster] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [expandedFightId, setExpandedFightId] = useState<string | null>(null);

  // Pagination
  const [guildEventsPage, setGuildEventsPage] = useState(1);
  const EVENTS_PER_PAGE = 10;

  // Fake Data for Locked View
  const fakeKills = useMemo(() => generateFakeCombatEvents(50, 'kill'), []);
  const fakeDeaths = useMemo(() => generateFakeCombatEvents(50, 'death'), []);

  // Item Names Mapping
  const [itemNames, setItemNames] = useState<Record<string, string>>({});

  useEffect(() => {
    getItems().then(items => {
      const map: Record<string, string> = {};
      items.forEach(i => map[i.id] = i.name);
      setItemNames(map);
    });
  }, []);

  const formatItemName = (type: string) => {
    if (!type) return 'Unknown Item';

    // Extract Tier and Enchantment
    const tierMatch = type.match(/^T(\d+)_/);
    const tier = tierMatch ? tierMatch[1] : '';
    const enchantMatch = type.match(/@(\d+)$/);
    const enchantment = enchantMatch ? enchantMatch[1] : '0';

    // Lookup Name
    // 1. Try exact match (e.g. T4_HEAD_PLATE_SET1@1) - unlikely to be in map usually
    // 2. Try base type (e.g. T4_HEAD_PLATE_SET1)
    let baseType = type.replace(/@\d+$/, '');
    let name = itemNames[type] || itemNames[baseType];

    if (!name) {
      // Fallback: Remove prefix/suffix and pretty print
      name = baseType.replace(/^T\d+_/, '').replace(/_/g, ' ');
      name = name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // Format: "Soldier Boots (Tier 4.1)"
    const tierDisplay = tier ? ` (Tier ${tier}${enchantment !== '0' ? `.${enchantment}` : ''})` : '';
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

    // Check Premium Access
    const accessResult = await checkAccess(user.uid);
    setAccess(accessResult);

    // Auto-load personal stats if linked
    if (profile?.characterId && !selectedPlayer && !query) {
      handleSelectPlayer(profile.characterId);
    }
  };

  const fetchGuildData = async (targetGuildId: string) => {
    setGuildLoading(true);

    // Fetch Guild Info and Members
    const { info: gInfo } = await getGuildInfo(targetGuildId, region);
    setGuildInfo(gInfo);

    const { members } = await getGuildMembers(targetGuildId, region);
    setGuildMembers(members || []);

    // Fetch Events
    const { events } = await getGuildEvents(targetGuildId, region);
    setGuildEvents(events || []);

    // Process Activity Heatmap
    if (events && events.length > 0) {
      const activityMap = new Array(24).fill(0);
      events.forEach((e: any) => {
        const hour = new Date(e.TimeStamp).getHours();
        activityMap[hour]++;
      });
      // Normalize to percentage relative to max
      const maxActivity = Math.max(...activityMap, 1);
      const activityData = activityMap.map((count, i) => ({
        hour: i.toString().padStart(2, '0'),
        activity: Math.round((count / maxActivity) * 100) || 5 // min 5% for visibility
      }));
      setComputedGuildActivity(activityData);

      // Process Top Rivals
      const rivalMap: Record<string, { kills: number, deaths: number, name: string }> = {};
      events.forEach((e: any) => {
        const isKiller = e.Killer.GuildId === targetGuildId;
        const rivalGuildId = isKiller ? e.Victim.GuildId : e.Killer.GuildId;
        const rivalGuildName = isKiller ? (e.Victim.GuildName || 'No Guild') : (e.Killer.GuildName || 'No Guild');

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
      // Default/Empty stats if no events
      setComputedGuildActivity(Array(24).fill(0).map((_, i) => ({ hour: i.toString().padStart(2, '0'), activity: 5 })));
      setComputedTopRivals([]);
    }

    // Fetch Alliance Data
    if (gInfo?.AllianceId) {
      const { info: aInfo } = await getAllianceInfo(gInfo.AllianceId, region);
      if (aInfo) {
        // Map API data to UI structure
        const allianceObj = {
          id: aInfo.AllianceId,
          alliance: aInfo.AllianceName,
          tag: `[${aInfo.AllianceTag}]`,
          stats: {
            kills: 0, // Requires event aggregation
            deaths: 0,
            fame: aInfo.KillFame || 0,
            kd: 0
          },
          territories: 'N/A',
          hideouts: 'N/A',
          seasonPoints: 'N/A',
          seasonRank: 'N/A',
          guilds: aInfo.Guilds || [], // Assuming API returns Guilds array
          topPlayers: [] // Requires separate fetching
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
    // Search all regions by not passing a specific region
    const { results, error } = await searchPlayer(query);
    if (results) {
      setResults(results);
    }
    setLoading(false);
  };

  const handleSelectPlayer = async (playerId: string, playerRegion?: 'west' | 'east' | 'europe') => {
    let targetRegion = playerRegion || region;
    
    setStatsLoading(true);
    let { stats, kills, deaths, error } = await getPlayerStats(playerId, targetRegion);

    // If failed and we didn't specify a region (e.g. auto-reset), try others
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
      setResults([]); // Clear results to show profile
    } else if (!playerRegion) {
        // Only clear if this was an auto-attempt (no specific region)
        setSelectedPlayer(null);
        setRecentKills([]);
        setRecentDeaths([]);
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
    recentKills.forEach(kill => {
      // Check if killer is the selected player
      const isKiller = kill.Killer.Name === selectedPlayer.Name;
      const equipment = isKiller ? kill.Killer.Equipment : kill.Victim.Equipment;

      // Get weapon (MainHand)
      const weapon = equipment?.MainHand;
      if (weapon) {
        // Strip tier prefix (e.g. T4_MAIN_SWORD -> MAIN_SWORD)
        const baseName = weapon.Type;
        usage[baseName] = (usage[baseName] || 0) + 1;
      }
    });

    return Object.entries(usage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3); // Top 3
  };

  const getTacticalAnalysis = () => {
    if (recentKills.length === 0 && recentDeaths.length === 0) return null;

    // 1. Playstyle (Solo vs Group)
    let soloKills = 0;
    let groupKills = 0;
    let totalGroupSize = 0;
    let eventsWithGroupData = 0;

    recentKills.forEach(kill => {
      const groupSize = kill.GroupMembers ? kill.GroupMembers.length : (kill.numberOfParticipants || 1);
      if (groupSize === 1) soloKills++;
      else groupKills++;

      totalGroupSize += groupSize;
      eventsWithGroupData++;
    });

    const avgGroupSize = eventsWithGroupData > 0 ? Math.round(totalGroupSize / eventsWithGroupData) : 1;
    let playstyleLabel = "Unknown";
    let playstyleColor = "text-muted-foreground";

    if (eventsWithGroupData > 0) {
      if (avgGroupSize === 1) {
        playstyleLabel = "Solo Wolf";
        playstyleColor = "text-warning";
      } else if (avgGroupSize <= 5) {
        playstyleLabel = "Small Scale";
        playstyleColor = "text-info";
      } else {
        playstyleLabel = "Zerg / Large Scale";
        playstyleColor = "text-destructive";
      }
    }

    // 2. Activity Peak
    const hourCounts = new Array(24).fill(0);
    [...recentKills, ...recentDeaths].forEach(e => {
      const hour = new Date(e.TimeStamp).getHours();
      hourCounts[hour]++;
    });

    // Find the 4-hour window with max activity
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

    // 3. Fair Fight Ratio (IP Delta)
    let punchingUp = 0;
    let punchingDown = 0;
    let fairFights = 0;

    recentKills.forEach(kill => {
      const diff = kill.Killer.AverageItemPower - kill.Victim.AverageItemPower;
      if (diff > 100) punchingDown++;
      else if (diff < -50) punchingUp++;
      else fairFights++;
    });

    const totalRated = punchingUp + punchingDown + fairFights;
    const fightStyle = totalRated > 0
      ? (punchingUp > punchingDown ? "Underdog (High Skill)" : (punchingDown > punchingUp * 2 ? "Gear Crutch" : "Balanced Fighter"))
      : "N/A";

    return {
      playstyleLabel,
      playstyleColor,
      avgGroupSize,
      peakTime,
      fightStyle
    };
  };

  const weaponMastery = useMemo(() => calculateMastery(recentKills, recentDeaths), [recentKills, recentDeaths]);
  const fakeWeaponMastery = useMemo(() => calculateMastery(fakeKills, fakeDeaths), [fakeKills, fakeDeaths]);

  return (
    <PageShell
      title="PvP Intel"
      backgroundImage='/background/ao-pvp.jpg'
      description="Analyze player stats and recent battles."
      icon={<Sword className="h-6 w-6" />}
      headerActions={
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 mr-2">
             <Tooltip content="Export Report (Supporter Only)">
                <button
                   onClick={(e) => { e.preventDefault(); !hasAccess && setShowSubscriptionModal(true); }}
                   className={`p-2 rounded-lg transition-colors flex items-center justify-center relative ${hasAccess ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                >
                   <Download className="h-5 w-5" />
                   {!hasAccess && <Lock className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" />}
                </button>
             </Tooltip>
             <Tooltip content="Share Report (Supporter Only)">
                <button
                   onClick={(e) => { e.preventDefault(); !hasAccess && setShowSubscriptionModal(true); }}
                   className={`p-2 rounded-lg transition-colors flex items-center justify-center relative ${hasAccess ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                >
                   <Share2 className="h-5 w-5" />
                   {!hasAccess && <Lock className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" />}
                </button>
             </Tooltip>
          </div>
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
                        setResults([]);
                      }
                    }
                  }}
                  placeholder="Search player..."
                  className="w-full md:w-64"
                  icon={<Search className="h-4 w-4 text-muted-foreground" />}
                />
              </form>
            </div>

            <button
              onClick={(e) => { e.preventDefault(); handleSearch(e as any); }}
              disabled={loading}
              className="p-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors shadow-lg shadow-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
            <h2 className="text-xl font-semibold text-muted-foreground">Search Results</h2>
            <button onClick={() => setResults([])} className="text-sm text-muted-foreground hover:text-foreground">Clear</button>
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
                  <div className="text-sm text-muted-foreground">{player.GuildName ? `[${player.GuildName}]` : 'No Guild'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Kill Fame</div>
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
          {/* <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6 border border-border shadow-xl shadow-black/20">
            <UserIcon className="h-10 w-10 text-muted-foreground" />
          </div> */}
          <h2 className="text-2xl font-bold text-foreground mb-3">No Player Selected</h2>
          <p className="text-muted-foreground max-w-md text-center mb-8 leading-relaxed">
            Search for a player above to view their combat statistics, or link your Albion Online character to automatically see your own stats.
          </p>
          
          {user && !userProfile?.characterId && (
            <Link 
              href="/settings"
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <UserIcon className="h-4 w-4" />
              Link Your Character
            </Link>
          )}

          {!user && (
             <div className="flex gap-4">
                 <div className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg border border-border">
                    💡 Tip: Sign in to save your default region and character.
                 </div>
             </div>
          )}
        </div>
      )}

      {/* Player Stats */}
      {statsLoading && (
        <div className="text-center py-20">
            <RefreshCw className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Analyzing combat data...</p>
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
                MY STATS
              </div>
            )}
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-foreground flex items-center gap-3">
                {selectedPlayer.Name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {selectedPlayer.GuildName ? <span className="text-foreground font-medium">{selectedPlayer.GuildName}</span> : 'No Guild'}
                  {selectedPlayer.AllianceName && <span className="text-muted-foreground">[{selectedPlayer.AllianceName}]</span>}
                </span>
                <span className="text-foreground flex items-center gap-2">
                  <Swords className="h-4 w-4 text-muted-foreground" />
                  Avg IP: <span className="text-warning font-bold">{Math.round(selectedPlayer.AverageItemPower || 0)}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
              <div className="p-4 bg-card/50 rounded-lg text-center border border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">PvE Fame</div>
                <div className="font-mono text-success text-xl font-bold">
                  {formatNumber(selectedPlayer.LifetimeStatistics?.PvE?.Total)}
                </div>
              </div>
              <div className="p-4 bg-card/50 rounded-lg text-center border border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Kill Fame</div>
                <div className="font-mono text-destructive text-xl font-bold">
                  {formatNumber(selectedPlayer.KillFame)}
                </div>
              </div>
              <div className="p-4 bg-card/50 rounded-lg text-center border border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Death Fame</div>
                <div className="font-mono text-foreground text-xl font-bold">
                  {formatNumber(selectedPlayer.DeathFame)}
                </div>
              </div>
              <div className="p-4 bg-card/50 rounded-lg text-center border border-border">
                <Tooltip content="Ratio of Total Kill Fame to Death Fame">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    K/D Ratio <AlertCircle className="h-3 w-3" />
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

          {/* Combat Analysis */}
          {(recentKills.length > 0 || recentDeaths.length > 0) && (
            <div className="mt-8 border-t border-border/50 pt-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                <Target className="h-6 w-6 text-destructive" />
                Combat Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {/* Win Rate & Survival */}
                <div className="bg-card/70 rounded-xl p-5 border border-border/80 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <Crosshair className="h-4 w-4" />
                      Performance
                    </h4>
                    <Tooltip content="Based on the last 50 recorded kills and deaths">
                      <AlertCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Recent Win Rate</span>
                        <span className="text-foreground font-bold">
                          {Math.round((recentKills.length / ((recentKills.length + recentDeaths.length) || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-success"
                          style={{ width: `${(recentKills.filter(k => k.TotalVictimKillFame > 0).length / ((recentKills.length + recentDeaths.length) || 1)) * 100}%` }}
                        />
                        <div
                          className="h-full bg-success/60"
                          style={{ width: `${(recentKills.filter(k => k.TotalVictimKillFame === 0).length / ((recentKills.length + recentDeaths.length) || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-b border-border pb-4">
                      <div className="text-center flex-1 border-r border-border">
                        <div className="text-3xl font-bold text-success">{recentKills.length}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Wins</div>
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-3xl font-bold text-destructive">{recentDeaths.length}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Losses</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-muted/50 p-2 rounded text-center">
                        <div className="text-xs text-muted-foreground">K/D Ratio</div>
                        <div className="font-bold text-warning">
                          {recentDeaths.length > 0
                            ? (recentKills.length / recentDeaths.length).toFixed(2)
                            : recentKills.length}
                        </div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded text-center">
                        <div className="text-xs text-muted-foreground">Avg IP</div>
                        <div className="font-bold text-foreground">
                          {Math.round(
                            ([...recentKills.map(k => k.Killer.AverageItemPower), ...recentDeaths.map(d => d.Victim.AverageItemPower)]
                              .reduce((a, b) => a + b, 0)) / ((recentKills.length + recentDeaths.length) || 1)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tactical Insight */}
                {(() => {
                  const tactical = getTacticalAnalysis();
                  return tactical ? (
                    <div className="bg-card/70 rounded-xl p-5 border border-border/80 flex flex-col h-full">
                      <h4 className="font-bold text-info mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Tactical Insight
                      </h4>
                      <div className="space-y-6 flex-1">
                        <div>
                          <Tooltip content="Determined by avg group size: Solo (1), Small Scale (2-5), Zerg (6+)">
                            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1 w-fit">
                              Playstyle Preference <AlertCircle className="h-3 w-3" />
                            </div>
                          </Tooltip>
                          <div className={`text-2xl font-bold ${tactical.playstyleColor}`}>
                            {tactical.playstyleLabel}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Avg Group Size: <span className="text-foreground font-mono">{tactical.avgGroupSize}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Activity Peak (UTC)</div>
                          <div className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {tactical.peakTime}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                          <Tooltip content="Underdog: Winning vs Higher IP. Gear Crutch: Winning vs Lower IP.">
                            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1 w-fit">
                              Fight Preference <AlertCircle className="h-3 w-3" />
                            </div>
                          </Tooltip>
                          <div className="text-sm font-medium text-foreground">
                            {tactical.fightStyle}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            Based on IP difference in recent fights
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-card/40 rounded-xl p-5 border border-border flex items-center justify-center">
                      <span className="text-muted-foreground">No tactical data</span>
                    </div>
                  );
                })()}

                {/* Top Weapons */}
                <div className="bg-card/70 rounded-xl p-5 border border-border/80 flex flex-col h-full">
                  <h4 className="font-bold text-success mb-4 flex items-center gap-2">
                    <Sword className="h-4 w-4" />
                    Best Weapons
                  </h4>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {getWeaponUsage().length > 0 ? getWeaponUsage().map(([weapon, count]) => (
                      <div key={weapon} className="flex items-center justify-between bg-muted/50 p-2 rounded border border-border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-card rounded border border-border/50 flex-shrink-0">
                             <ItemIcon item={weapon} className="w-full h-full object-contain p-0.5" />
                          </div>
                          <span className="text-foreground text-sm font-medium">
                            {formatItemName(weapon)}
                          </span>
                        </div>
                        <span className="text-xs font-bold bg-success/20 text-success px-2 py-1 rounded">
                          {count}
                        </span>
                      </div>
                    )) : (
                      <div className="text-muted-foreground text-sm italic">No recent kill data</div>
                    )}
                  </div>
                </div>

                {/* Threats */}
                <div className="bg-card/70 rounded-xl p-5 border border-border/80 flex flex-col h-full">
                  <h4 className="font-bold text-destructive mb-4 flex items-center gap-2">
                    <Skull className="h-4 w-4" />
                    Top Threats
                  </h4>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {getThreatAnalysis().length > 0 ? getThreatAnalysis().map(([weapon, count]) => (
                      <div key={weapon} className="flex items-center justify-between bg-muted/50 p-2 rounded border border-border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-card rounded border border-border/50 flex-shrink-0">
                            <ItemIcon item={weapon} className="w-full h-full object-contain p-0.5" />
                          </div>
                          <span className="text-foreground text-sm font-medium">
                            {formatItemName(weapon)}
                          </span>
                        </div>
                        <span className="text-xs font-bold bg-destructive/20 text-destructive px-2 py-1 rounded">
                          {count}
                        </span>
                      </div>
                    )) : (
                      <div className="text-muted-foreground text-sm italic">No recent death data</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Weapon Mastery History */}
              <div className="bg-card/50 rounded-xl border border-border overflow-hidden mb-8">
                <div className="p-4 border-b border-border bg-muted/30">
                   <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-warning" />
                      Advanced Weapon Mastery History
                   </h3>
                </div>
                
                <FeatureLock
                  title="Weapon Mastery Analysis"
                  description="Unlock detailed weapon performance stats including win rates, average IP, and efficiency scores for every weapon you use."
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

              {/* Advanced Analytics */}
              <FeatureLock 
                title="Combat Analytics" 
                description="Unlock deep combat insights including fame trends, hourly activity, and IP performance analysis."
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

              {/* Recent Fights Feed */}
              <div className="bg-card border border-border rounded-xl p-1 mt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 pt-3 mb-4 gap-3 sm:gap-0">
                  <h4 className="font-bold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Fights
                  </h4>
                  <OptionSelector
                    options={[
                      { label: 'Lethal Kills', value: 'kills', color: 'green' },
                      { label: 'Lethal Deaths', value: 'deaths', color: 'red' },
                      { label: 'Knockouts', value: 'knockouts', color: 'amber' },
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
                      const koKills = recentKills.filter(k => k.TotalVictimKillFame === 0).map(k => ({ ...k, type: 'kill' }));
                      const koDeaths = recentDeaths.filter(d => d.TotalVictimKillFame === 0).map(d => ({ ...d, type: 'death' }));
                      events = [...koKills, ...koDeaths];
                    }

                    if (events.length === 0) {
                      return (
                        <div className="text-center py-12 text-muted-foreground italic border border-dashed border-border rounded-lg bg-card/20">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="h-8 w-8 text-muted-foreground mb-2" />
                            <span>No {activityTab === 'knockouts' ? 'knockouts' : (activityTab === 'kills' ? 'lethal kills' : 'lethal deaths')} recorded recently.</span>
                          </div>
                        </div>
                      );
                    }

                    return events.sort((a: any, b: any) => new Date(b.TimeStamp).getTime() - new Date(a.TimeStamp).getTime())
                      .map((event) => {
                        const isKill = event.type === 'kill';
                        const isExpanded = expandedFightId === event.EventId;
                        const isKnockout = event.TotalVictimKillFame === 0;

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
                          <div key={event.EventId} className={`rounded-lg border transition-all duration-300 ${isKill
                              ? (isKnockout ? 'bg-success/10 border-success/30 hover:bg-success/20' : 'bg-success/10 border-success/30 hover:bg-success/20')
                              : (isKnockout ? 'bg-warning/10 border-warning/30 hover:bg-warning/20' : 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20')
                            } ${isExpanded ? 'bg-opacity-50 border-opacity-80' : ''}`}>
                            <div
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 cursor-pointer gap-3 sm:gap-0"
                            onClick={() => setExpandedFightId(isExpanded ? null : event.EventId)}
                          >
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                              <div className={`w-16 text-center text-xs font-bold py-1 rounded shrink-0 ${isKill
                                  ? (isKnockout ? 'bg-success/20 text-success' : 'bg-success/20 text-success')
                                  : (isKnockout ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive')
                                }`}>
                                {isKnockout ? 'KO' : (isKill ? 'KILL' : 'DEATH')}
                              </div>

                              {/* Weapon Icon */}
                              <Tooltip content={formatItemName(event.Killer.Equipment?.MainHand?.Type)}>
                                <div className="h-10 w-10 bg-card/50 rounded border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                                  <ItemIcon item={event.Killer.Equipment?.MainHand} className="w-full h-full object-contain" />
                                </div>
                              </Tooltip>

                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-foreground truncate">
                                  {isKill
                                    ? (isKnockout ? 'Knocked Out' : 'Killed')
                                    : (isKnockout ? 'Knocked Out by' : 'Killed by')
                                  } <span className={isKill ? 'text-destructive' : 'text-success'}>{isKill ? event.Victim.Name : event.Killer.Name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                                  <span className="truncate">{isKill ? event.Victim.GuildName : event.Killer.GuildName || 'No Guild'}</span>
                                  <span>•</span>
                                  <span className="shrink-0">IP: {Math.round(isKill ? event.Victim.AverageItemPower : event.Killer.AverageItemPower)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-[5.5rem] sm:pl-0">
                              <div className="text-right">
                                  <div className={`font-mono ${isKill ? 'text-success' : 'text-destructive'}`}>
                                    {isKill ? '+' : '-'}{event.TotalVictimKillFame.toLocaleString()} Fame
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

                                {/* Battle Analysis */}
                                <div className="grid md:grid-cols-2 gap-6">
                                  {/* Killer Side */}
                                  <div className="bg-card/40 p-3 rounded border border-border/50">
                                    <div className="flex justify-between items-center mb-2 border-b border-border/50 pb-2">
                                      <h4 className="font-bold text-success text-sm flex items-center gap-2">
                                        <Sword className="h-4 w-4" /> Killer
                                      </h4>
                                      <span className="text-xs text-muted-foreground">IP: {Math.round(event.Killer.AverageItemPower)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="font-medium text-foreground">{event.Killer.Name}</div>
                                      <span className="text-xs text-muted-foreground">[{event.Killer.GuildName}]</span>
                                    </div>

                                    {/* Equipment Grid */}
                                    <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
                                       {renderItemSlot(event.Killer.Equipment?.Bag)}
                                       {renderItemSlot(event.Killer.Equipment?.Head)}
                                       {renderItemSlot(event.Killer.Equipment?.Cape)}
                                       
                                       {renderItemSlot(event.Killer.Equipment?.MainHand)}
                                       {renderItemSlot(event.Killer.Equipment?.Armor)}
                                       {renderItemSlot(event.Killer.Equipment?.OffHand)}
                                       
                                       {renderItemSlot(event.Killer.Equipment?.Potion)}
                                       {renderItemSlot(event.Killer.Equipment?.Shoes)}
                                       {renderItemSlot(event.Killer.Equipment?.Food)}
                                       
                                       <div />
                                       {renderItemSlot(event.Killer.Equipment?.Mount)}
                                       <div />
                                    </div>
                                  </div>

                                  {/* Victim Side */}
                                  <div className="bg-card/40 p-3 rounded border border-border/50">
                                    <div className="flex justify-between items-center mb-2 border-b border-border/50 pb-2">
                                      <h4 className="font-bold text-destructive text-sm flex items-center gap-2">
                                        <Skull className="h-4 w-4" /> Victim
                                      </h4>
                                      <span className="text-xs text-muted-foreground">IP: {Math.round(event.Victim.AverageItemPower)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="font-medium text-foreground">{event.Victim.Name}</div>
                                      <span className="text-xs text-muted-foreground">[{event.Victim.GuildName}]</span>
                                    </div>

                                    {/* Equipment Grid */}
                                    <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
                                       {renderItemSlot(event.Victim.Equipment?.Bag)}
                                       {renderItemSlot(event.Victim.Equipment?.Head)}
                                       {renderItemSlot(event.Victim.Equipment?.Cape)}
                                       
                                       {renderItemSlot(event.Victim.Equipment?.MainHand)}
                                       {renderItemSlot(event.Victim.Equipment?.Armor)}
                                       {renderItemSlot(event.Victim.Equipment?.OffHand)}
                                       
                                       {renderItemSlot(event.Victim.Equipment?.Potion)}
                                       {renderItemSlot(event.Victim.Equipment?.Shoes)}
                                       {renderItemSlot(event.Victim.Equipment?.Food)}
                                       
                                       <div />
                                       {renderItemSlot(event.Victim.Equipment?.Mount)}
                                       <div />
                                    </div>
                                  </div>
                                </div>

                                {/* Participants / Assists */}
                                {event.Participants && event.Participants.filter((p: any) => p.Name !== event.Killer.Name).length > 0 && (
                                  <div className="mt-4 bg-card/40 p-3 rounded border border-border/50">
                                    <h4 className="font-bold text-muted-foreground text-sm mb-3 flex items-center gap-2">
                                      <Users className="h-4 w-4" /> Assists ({event.Participants.filter((p: any) => p.Name !== event.Killer.Name).length})
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {event.Participants
                                        .filter((p: any) => p.Name !== event.Killer.Name)
                                        .map((participant: any, idx: number) => (
                                          <div key={idx} className="flex items-center gap-2 bg-background/50 p-2 rounded border border-border/50">
                                            <div className="h-10 w-10 bg-card rounded border border-border shrink-0 relative group/assist">
                                              {participant.Equipment?.MainHand ? (
                                                <Tooltip content={formatItemName(participant.Equipment.MainHand.Type)}>
                                                  <ItemIcon item={participant.Equipment.MainHand} className="w-full h-full object-contain p-1" />
                                                </Tooltip>
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                                                  <Swords className="h-4 w-4" />
                                                </div>
                                              )}
                                            </div>
                                            <div className="overflow-hidden min-w-0">
                                              <div className="text-sm font-medium text-foreground truncate">{participant.Name}</div>
                                              <div className="text-xs text-muted-foreground truncate flex gap-2">
                                                {participant.DamageDone > 0 && (
                                                  <span className="text-destructive">{formatNumber(participant.DamageDone)} dmg</span>
                                                )}
                                                {participant.SupportHealingDone > 0 && (
                                                  <span className="text-success">{formatNumber(participant.SupportHealingDone)} heal</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
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
        </div>
      )}
      <InfoStrip currentPage="pvp-intel">
        <InfoBanner icon={<Target className="w-4 h-4" />} color="text-red-400" title="Real-time Combat Intel">
          <p>Intel data is refreshed every 60 seconds. View detailed combat logs, player stats, and recent kill events.</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-xs opacity-90">
            <li>Search for players or guilds to see their recent activity</li>
            <li>Analyze kill fame and item power trends</li>
            <li>Check detailed combat logs for ability usage</li>
          </ul>
        </InfoBanner>
      </InfoStrip>
    </PageShell>
  );
}
