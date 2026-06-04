'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { Preloader } from '@/components/Preloader';
import { 
  Search, Sword, Skull, Trophy, Activity, Target, TrendingUp, TrendingDown, 
  Shield, Crosshair, Users, Crown, Zap, BarChart3, Radar, Clock, Calendar,
  MapPin, Award, Flame, Heart, RefreshCw, Share2, Download, ChevronRight,
  ArrowUpRight, ArrowDownRight, Minus, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar 
} from 'recharts';
import { useTranslations, useLocale } from 'next-intl';
import { PageShell } from '@/components/PageShell';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { ServerSelector } from '@/components/ServerSelector';
import { useServer } from '@/hooks/useServer';
import { ItemIcon } from '@/components/ItemIcon';
import { InfoStrip } from '@/components/InfoStrip';
import { getUserProfile } from '@/lib/user-profile';
import { useAuth } from '@/context/AuthContext';
import {
  searchPlayer,
  getPlayerStats,
  getPlayerEvents,
  getPlayerWeaponMastery,
  getGuildInfo
} from './actions';

// Round to specified decimal places
const roundTo = (num: number, decimals: number = 1) => {
  if (!num || isNaN(num)) return 0;
  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier) / multiplier;
};

// Format large numbers
const formatNumber = (num: number) => {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const formatWeaponName = (weaponType: string) => {
  // Remove tier prefix (T4_, T5_, etc.) and enchantment (@3, @4, etc.)
  let name = weaponType.replace(/^T\d+_/, '').replace(/@\d+$/, '');
  // Replace underscores with spaces
  name = name.replace(/_/g, ' ');
  // Add spaces before numbers (e.g., "SET1" → "SET 1")
  name = name.replace(/(\d+)/g, ' $1');
  // Capitalize first letter of each word
  return name.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  ).trim();
};

// Calculate combat score (0-100)
const calculateCombatScore = (stats: any) => {
  if (!stats) return 0;
  const killFameScore = Math.min((stats.KillFame || 0) / 10000, 40);
  const kdScore = Math.min((stats.FameRatio || 0) * 10, 30);
  const winRateScore = 20; // Default
  const activityScore = 10; // Default
  return Math.min(Math.round(killFameScore + kdScore + winRateScore + activityScore), 100);
};

// Get weapon analysis for radar chart
const getWeaponAnalysis = (weaponType: string, t: any) => {
  const type = weaponType.toUpperCase();
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
  else if (type.includes('GLOVES')) stats = { mobility: 85, damage: 80, control: 60, sustain: 40, utility: 30 };

  return [
    { subject: t('mobility'), A: stats.mobility, fullMark: 100 },
    { subject: t('damage'), A: stats.damage, fullMark: 100 },
    { subject: t('control'), A: stats.control, fullMark: 100 },
    { subject: t('sustain'), A: stats.sustain, fullMark: 100 },
    { subject: t('utility'), A: stats.utility, fullMark: 100 },
  ];
};

interface Player {
  Id: string;
  Name: string;
  region?: string;
  items?: string[]; // Recent items from kills
}

interface CombatStats {
  KillFame: number;
  DeathFame: number;
  FameRatio: number;
  TotalKills?: number;
  TotalDeaths?: number;
}

interface WeaponMastery {
  id: string;
  kills: number;
  deaths: number;
  fame: number;
  count: number;
  winRate: number;
  avgIp: number;
  sampleId: string;
}

export default function PvpIntelClient() {
  const t = useTranslations('PvpIntel');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const { server: region, setServer: setRegion } = useServer();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Search State
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [linkedCharacter, setLinkedCharacter] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [playerNotFound, setPlayerNotFound] = useState(false);

  // Function to load player data from any source
  const loadPlayerData = async (playerId: string, playerName: string, targetRegion: 'west' | 'east' | 'europe') => {
    setLoading(true);
    setPlayerNotFound(false);
    
    try {
      console.log('Fetching player stats for:', playerId, 'in', targetRegion);
      
      // First, get player stats to verify the player exists
      const statsData = await getPlayerStats(playerId, targetRegion);
      console.log('Player stats:', statsData);

      if (!statsData || !statsData.stats) {
        console.log('Player not found in', targetRegion);
        setPlayerNotFound(true);
        setSelectedPlayer(null);
        setLoading(false);
        return false;
      }

      // Create player object
      const player = {
        Id: playerId,
        Name: statsData.stats.Name || playerName || 'Unknown Player'
      };

      console.log('Using player:', player);
      setSelectedPlayer(player);

      // Load all player data
      console.log('Loading full player data...');
      const [fetchedStatsData, masteryData, eventsData] = await Promise.all([
        getPlayerStats(playerId, targetRegion),
        getPlayerWeaponMastery(playerId, targetRegion),
        getPlayerEvents(playerId, targetRegion)
      ]);

      console.log('Loaded data:', { fetchedStatsData, masteryData, eventsData });

      // Process stats
      if (fetchedStatsData?.stats) {
        setCombatStats({
          KillFame: fetchedStatsData.stats.KillFame || 0,
          DeathFame: fetchedStatsData.stats.DeathFame || 0,
          FameRatio: fetchedStatsData.stats.FameRatio || 0,
          TotalKills: fetchedStatsData.kills?.length || 0,
          TotalDeaths: fetchedStatsData.deaths?.length || 0
        });
        setRecentKills(fetchedStatsData.kills || []);
        setRecentDeaths(fetchedStatsData.deaths || []);
      }

      // Process weapon mastery
      if (masteryData?.mastery && Array.isArray(masteryData.mastery)) {
        const processedMastery = masteryData.mastery.map((m: any) => ({
          id: m.Type || m.type || t('unknown'),
          kills: m.Kills || m.kills || 0,
          deaths: m.Deaths || m.deaths || 0,
          fame: m.Fame || m.fame || 0,
          count: (m.Kills || 0) + (m.Deaths || 0),
          winRate: ((m.Kills || 0) / ((m.Kills || 0) + (m.Deaths || 0))) * 100,
          avgIp: m.AverageItemPower || m.avgIp || 0,
          sampleId: m.Type || m.type || ''
        }));
        setWeaponMastery(processedMastery);
      }

      console.log('Player data loaded successfully');
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to load player data:', error);
      setLoading(false);
      setPlayerNotFound(true);
      return false;
    }
  };

  // Try to find player across all servers
  const findPlayerOnAnyServer = async (playerId: string, playerName: string): Promise<boolean> => {
    const servers: Array<'west' | 'east' | 'europe'> = ['west', 'east', 'europe'];
    
    for (const server of servers) {
      console.log(`Trying to find player on ${server} server...`);
      const found = await loadPlayerData(playerId, playerName, server);
      if (found) {
        setRegion(server);
        return true;
      }
    }
    
    return false;
  };

  // Load user's linked character on mount (if no URL player param)
  useEffect(() => {
    const playerId = searchParams?.get('player');
    
    // Only load linked character if:
    // 1. User is logged in
    // 2. User has a linked character
    // 3. No player is already selected from URL
    if (user?.uid && !playerId) {
      const loadLinkedCharacter = async () => {
        try {
          const profile = await getUserProfile(user.uid);
          const characterId = profile?.characterId;
          const characterName = profile?.characterName;
          
          if (characterId && characterName) {
            console.log('Loading user\'s linked character:', characterName);
            // Try to find player on any server
            await findPlayerOnAnyServer(characterId, characterName);
          }
        } catch (error) {
          console.error('Failed to load linked character:', error);
        }
      };
      loadLinkedCharacter();
    }
  }, [user?.uid, searchParams]);

  // Handle URL parameters on mount
  useEffect(() => {
    const playerId = searchParams?.get('player');
    const playerName = searchParams?.get('name');
    const playerRegion = searchParams?.get('region');

    console.log('URL params:', { playerId, playerName, playerRegion });

    if (playerId && playerId !== 'null' && playerId !== 'undefined') {
      console.log('Loading player from URL:', playerId, playerName, playerRegion);

      // Set region if provided
      if (playerRegion && ['west', 'east', 'europe'].includes(playerRegion)) {
        console.log('Setting region:', playerRegion);
        setRegion(playerRegion as any);
        // Load player on specified server
        loadPlayerData(playerId, playerName || '', playerRegion as any);
      } else {
        // Try to find player on any server
        findPlayerOnAnyServer(playerId, playerName || '');
      }
    }
  }, []); // Run once on mount

  // Fetch linked character when player is selected
  useEffect(() => {
    if (selectedPlayer?.Id) {
      const fetchLinkedCharacter = async () => {
        try {
          const profile = await getUserProfile(selectedPlayer.Id);
          setLinkedCharacter(profile?.characterName || null);
        } catch (error) {
          console.error('Failed to fetch linked character:', error);
          setLinkedCharacter(null);
        }
      };
      fetchLinkedCharacter();
    } else {
      setLinkedCharacter(null);
    }
  }, [selectedPlayer?.Id]);

  // Combat Data State
  const [combatStats, setCombatStats] = useState<CombatStats | null>(null);
  const [weaponMastery, setWeaponMastery] = useState<WeaponMastery[]>([]);
  const [recentKills, setRecentKills] = useState<any[]>([]);
  const [recentDeaths, setRecentDeaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'weapons' | 'timeline' | 'battles'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [copied, setCopied] = useState(false);

  // Copy link handler
  const handleCopyLink = async () => {
    if (!selectedPlayer) return;
    
    const url = `${window.location.origin}/tools/pvp-intel?player=${encodeURIComponent(selectedPlayer.Id)}&name=${encodeURIComponent(selectedPlayer.Name)}&region=${encodeURIComponent(region)}`;
    console.log('Copying URL:', url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Export handler
  const handleExport = () => {
    if (!selectedPlayer || !analytics) return;
    
    const exportData = {
      playerName: selectedPlayer.Name,
      region,
      exportedAt: new Date().toISOString(),
      stats: {
        kdRatio: kdRatio,
        winRate: winRate,
        totalKills,
        totalDeaths,
        combatScore: calculateCombatScore(combatStats)
      },
      analytics: analytics
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pvp-intel-${selectedPlayer.Name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Search Players
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchPlayer(searchQuery, region);
      
      // Fetch recent kills for each player to get their items
      const resultsWithItems = await Promise.all(
        (results?.results || []).map(async (player: any) => {
          try {
            const killsRes = await fetch(
              `https://gameinfo${player.region !== 'west' ? `-${player.region === 'europe' ? 'ams' : 'sgp'}` : ''}.albiononline.com/api/gameinfo/players/${player.Id}/kills?limit=5`,
              { headers: { 'User-Agent': 'Mozilla/5.0' } }
            );
            const kills = killsRes.ok ? await killsRes.json() : [];
            
            // Extract unique items from kills (main hand, off hand, armor)
            const items = new Set<string>();
            kills.forEach((kill: any) => {
              if (kill.Killer?.Equipment) {
                const eq = kill.Killer.Equipment;
                if (eq.MainHand?.Type) items.add(eq.MainHand.Type);
                if (eq.OffHand?.Type) items.add(eq.OffHand.Type);
                if (eq.Armor?.Type) items.add(eq.Armor.Type);
              }
            });
            
            return { ...player, items: Array.from(items).slice(0, 3) };
          } catch {
            return { ...player, items: [] };
          }
        })
      );
      
      setSearchResults(resultsWithItems);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Select Player
  const handleSelectPlayer = async (playerId: string, playerName: string) => {
    setLoading(true);
    setSelectedPlayer({ Id: playerId, Name: playerName });
    setSearchResults([]);
    setQuery('');

    try {
      // Fetch all data in parallel
      const [statsData, masteryData, eventsData] = await Promise.all([
        getPlayerStats(playerId, region),
        getPlayerWeaponMastery(playerId, region),
        getPlayerEvents(playerId, region)
      ]);

      console.log('Stats Data:', statsData);
      console.log('Mastery Data:', masteryData);
      console.log('Events Data:', eventsData);

      // Process stats - API returns { stats, kills, deaths }
      if (statsData?.stats) {
        setCombatStats({
          KillFame: statsData.stats.KillFame || 0,
          DeathFame: statsData.stats.DeathFame || 0,
          FameRatio: statsData.stats.FameRatio || 0,
          TotalKills: statsData.kills?.length || 0,
          TotalDeaths: statsData.deaths?.length || 0
        });
        setRecentKills(statsData.kills || []);
        setRecentDeaths(statsData.deaths || []);
      }

      // Process weapon mastery - API returns array directly
      if (masteryData?.mastery && Array.isArray(masteryData.mastery)) {
        const processedMastery = masteryData.mastery.map((m: any) => ({
          id: m.Type || m.type || t('unknown'),
          kills: m.Kills || m.kills || 0,
          deaths: m.Deaths || m.deaths || 0,
          fame: m.Fame || m.fame || 0,
          count: (m.Kills || 0) + (m.Deaths || 0),
          winRate: ((m.Kills || 0) / ((m.Kills || 0) + (m.Deaths || 0))) * 100,
          avgIp: m.AverageItemPower || m.averageItemPower || 0,
          sampleId: m.Type || m.type || ''
        })).sort((a: any, b: any) => b.count - a.count);
        setWeaponMastery(processedMastery);
      }

      // Process events if needed
      if (eventsData?.events) {
        console.log('Events:', eventsData.events);
      }
    } catch (error) {
      console.error('Failed to load player data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const combatScore = useMemo(() => calculateCombatScore(combatStats), [combatStats]);
  
  const recentForm = useMemo(() => {
    const last10 = [...recentKills.slice(0, 5), ...recentDeaths.slice(0, 5)].sort(
      (a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
    ).slice(0, 10);
    const kills = last10.filter(e => e.Killer?.Id === selectedPlayer?.Id).length;
    return Math.round((kills / 10) * 100);
  }, [recentKills, recentDeaths, selectedPlayer]);

  const totalKills = combatStats?.TotalKills || recentKills.length;
  const totalDeaths = combatStats?.TotalDeaths || recentDeaths.length;
  const kdRatio = combatStats?.FameRatio || 0;
  const winRate = totalKills + totalDeaths > 0 ? Math.round((totalKills / (totalKills + totalDeaths)) * 100) : 0;

  // Advanced Analytics Calculations
  const analytics = useMemo(() => {
    const allFights = [...recentKills, ...recentDeaths];
    if (allFights.length === 0) return null;
    
    // Zone Type Classification
    const getZoneType = (zoneName: string) => {
      const name = zoneName.toLowerCase();
      if (name.includes('market') || name.includes('city')) return 'city';
      if (name.includes('hideout') || name.includes('camp')) return 'hideout';
      if (name.includes('crystal')) return 'crystal';
      if (name.includes('abyss')) return 'abyss';
      if (name.includes('hellgate')) return 'hellgate';
      if (name.includes('corrupted')) return 'corrupted';
      if (name.includes('dungeon')) return 'dungeon';
      if (name.includes('safe')) return 'safe';
      if (name.includes('red')) return 'red';
      if (name.includes('black')) return 'black';
      return 'open';
    };
    
    const getZoneTypeName = (type: string) => {
      const names: Record<string, string> = {
        city: 'Royal City',
        hideout: 'Hideout',
        crystal: 'Crystal League',
        abyss: 'Abyssal',
        hellgate: 'Hellgate',
        corrupted: 'Corrupted',
        dungeon: 'Dungeon',
        safe: 'Safe Zone',
        red: 'Red Zone',
        black: 'Black Zone',
        open: 'Open World'
      };
      return names[type] || type;
    };
    
    // Zone Analysis - Detailed with types
    const zoneStats: Record<string, { 
      kills: number; 
      deaths: number; 
      totalFame: number;
      type: string;
      zoneType: string;
    }> = {};
    
    allFights.forEach((fight: any) => {
      const location = fight.Location || t('unknown');
      if (!zoneStats[location]) {
        zoneStats[location] = { 
          kills: 0, 
          deaths: 0, 
          totalFame: 0,
          type: getZoneType(location),
          zoneType: getZoneTypeName(getZoneType(location))
        };
      }
      const isKill = fight.Killer?.Id === selectedPlayer?.Id;
      if (isKill) {
        zoneStats[location].kills++;
        zoneStats[location].totalFame += fight.TotalVictimKillFame || 0;
      } else {
        zoneStats[location].deaths++;
      }
    });
    
    const zones = Object.entries(zoneStats)
      .map(([name, data]) => ({ name, ...data, winRate: data.kills / (data.kills + data.deaths) * 100 }))
      .sort((a, b) => (b.kills + b.deaths) - (a.kills + a.deaths));
    
    // Zone Type Summary
    const zoneTypeSummary: Record<string, { kills: number; deaths: number; fights: number }> = {};
    zones.forEach(zone => {
      if (!zoneTypeSummary[zone.zoneType]) {
        zoneTypeSummary[zone.zoneType] = { kills: 0, deaths: 0, fights: 0 };
      }
      zoneTypeSummary[zone.zoneType].kills += zone.kills;
      zoneTypeSummary[zone.zoneType].deaths += zone.deaths;
      zoneTypeSummary[zone.zoneType].fights += zone.kills + zone.deaths;
    });
    
    // Combat Style Analysis
    let soloKills = 0, groupKills = 0, soloDeaths = 0, groupDeaths = 0;
    recentKills.forEach((kill: any) => {
      const participantCount = kill.Participants?.length || 1;
      if (participantCount <= 2) soloKills++; else groupKills++;
    });
    recentDeaths.forEach((death: any) => {
      const participantCount = death.Participants?.length || 1;
      if (participantCount <= 2) soloDeaths++; else groupDeaths++;
    });
    
    // Weapon Mastery - ONLY WEAPONS with Detailed Stats
    const weaponUsage: Record<string, { 
      kills: number; 
      deaths: number; 
      fame: number; 
      ip: number[];
      sampleId: string;
      // Additional stats
      damageDealt: number;
      damageTaken: number;
      supportHealing: number;
      kills_with_item: number;
      deaths_with_item: number;
    }> = {};
    
    // Helper to check if it's a weapon
    const isWeapon = (type: string) => {
      const upperType = type.toUpperCase();
      return upperType.includes('MAIN') || upperType.includes('OFF') || upperType.includes('2H');
    };
    
    // Process kills - extract ONLY WEAPONS
    recentKills.forEach((kill: any) => {
      const equipment = kill.Killer?.Equipment;
      if (!equipment) return;
      
      // Main Hand Weapon
      if (equipment.MainHand?.Type && isWeapon(equipment.MainHand.Type)) {
        const type = equipment.MainHand.Type;
        if (!weaponUsage[type]) {
          weaponUsage[type] = { 
            kills: 0, deaths: 0, fame: 0, ip: [], sampleId: type,
            damageDealt: 0, damageTaken: 0, supportHealing: 0,
            kills_with_item: 0, deaths_with_item: 0
          };
        }
        weaponUsage[type].kills++;
        weaponUsage[type].kills_with_item++;
        weaponUsage[type].fame += kill.TotalVictimKillFame || 0;
        weaponUsage[type].ip.push(kill.Killer?.AverageItemPower || 0);
        weaponUsage[type].damageDealt += kill.Killer?.DamageDealt || 0;
      }
      
      // Off Hand
      if (equipment.OffHand?.Type && isWeapon(equipment.OffHand.Type)) {
        const type = equipment.OffHand.Type;
        if (!weaponUsage[type]) {
          weaponUsage[type] = { 
            kills: 0, deaths: 0, fame: 0, ip: [], sampleId: type,
            damageDealt: 0, damageTaken: 0, supportHealing: 0,
            kills_with_item: 0, deaths_with_item: 0
          };
        }
        weaponUsage[type].kills++;
        weaponUsage[type].fame += kill.TotalVictimKillFame || 0;
        weaponUsage[type].ip.push(kill.Killer?.AverageItemPower || 0);
      }
    });
    
    // Process deaths - track ONLY WEAPONS
    recentDeaths.forEach((death: any) => {
      const equipment = death.Victim?.Equipment;
      if (!equipment) return;
      
      // Main Hand Weapon
      if (equipment.MainHand?.Type && isWeapon(equipment.MainHand.Type)) {
        const type = equipment.MainHand.Type;
        if (!weaponUsage[type]) {
          weaponUsage[type] = { 
            kills: 0, deaths: 0, fame: 0, ip: [], sampleId: type,
            damageDealt: 0, damageTaken: 0, supportHealing: 0,
            kills_with_item: 0, deaths_with_item: 0
          };
        }
        weaponUsage[type].deaths++;
        weaponUsage[type].deaths_with_item++;
        weaponUsage[type].ip.push(death.Victim?.AverageItemPower || 0);
        weaponUsage[type].damageTaken += death.Victim?.DamageTaken || 0;
      }
      
      // Off Hand
      if (equipment.OffHand?.Type && isWeapon(equipment.OffHand.Type)) {
        const type = equipment.OffHand.Type;
        if (!weaponUsage[type]) {
          weaponUsage[type] = { 
            kills: 0, deaths: 0, fame: 0, ip: [], sampleId: type,
            damageDealt: 0, damageTaken: 0, supportHealing: 0,
            kills_with_item: 0, deaths_with_item: 0
          };
        }
        weaponUsage[type].deaths++;
        weaponUsage[type].ip.push(death.Victim?.AverageItemPower || 0);
      }
    });
    
    const weapons = Object.entries(weaponUsage)
      .map(([type, data]) => ({
        type,
        ...data,
        winRate: (data.kills_with_item + data.deaths_with_item) > 0 
          ? (data.kills_with_item / (data.kills_with_item + data.deaths_with_item)) * 100 
          : 0,
        avgIp: data.ip.length > 0 ? data.ip.reduce((a, b) => a + b, 0) / data.ip.length : 0,
        avgDamageDealt: data.kills_with_item > 0 ? data.damageDealt / data.kills_with_item : 0,
        avgDamageTaken: data.deaths_with_item > 0 ? data.damageTaken / data.deaths_with_item : 0
      }))
      .sort((a, b) => b.kills - a.kills);
    
    // Kill/Death Streaks - Detailed
    let maxKillStreak = 0, currentKillStreak = 0;
    let maxDeathStreak = 0, currentDeathStreak = 0;
    let bestKillStreakPeriod = { start: 0, end: 0 };
    let worstDeathStreakPeriod = { start: 0, end: 0 };
    
    const sortedFights = allFights.sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());
    sortedFights.forEach((fight: any, index: number) => {
      const isKill = fight.Killer?.Id === selectedPlayer?.Id;
      if (isKill) {
        if (currentKillStreak === 0) bestKillStreakPeriod.start = index;
        currentKillStreak++;
        currentDeathStreak = 0;
        if (currentKillStreak > maxKillStreak) {
          maxKillStreak = currentKillStreak;
          bestKillStreakPeriod.end = index;
        }
      } else {
        if (currentDeathStreak === 0) worstDeathStreakPeriod.start = index;
        currentDeathStreak++;
        currentKillStreak = 0;
        if (currentDeathStreak > maxDeathStreak) {
          maxDeathStreak = currentDeathStreak;
          worstDeathStreakPeriod.end = index;
        }
      }
    });
    
    // Time-based Analytics
    const fightsByHour = new Array(24).fill(0);
    const fightsByDay = new Array(7).fill(0);
    allFights.forEach((fight: any) => {
      const date = new Date(fight.Timestamp);
      fightsByHour[date.getHours()]++;
      fightsByDay[date.getDay()]++;
    });
    
    const peakHour = fightsByHour.indexOf(Math.max(...fightsByHour));
    const peakDay = fightsByDay.indexOf(Math.max(...fightsByDay));
    
    // Average Fight Interval
    const fightTimestamps = allFights.map((f: any) => new Date(f.Timestamp).getTime()).sort((a, b) => b - a);
    let totalFightTime = 0;
    let fightCount = 0;
    for (let i = 1; i < Math.min(50, fightTimestamps.length); i++) {
      totalFightTime += fightTimestamps[i - 1] - fightTimestamps[i];
      fightCount++;
    }
    const avgFightInterval = fightCount > 0 ? Math.round(totalFightTime / fightCount / 60000) : 0;
    
    // Performance Metrics
    const totalFameGained = recentKills.reduce((sum, k) => sum + (k.TotalVictimKillFame || 0), 0);
    const avgFamePerKill = recentKills.length > 0 ? Math.round(totalFameGained / recentKills.length) : 0;
    const famePerMinute = avgFightInterval > 0 ? Math.round(avgFamePerKill / avgFightInterval) : 0;
    
    // IP Analysis
    const killerIPs = recentKills.map(k => k.Killer?.AverageItemPower || 0).filter(ip => ip > 0);
    const victimIPs = recentDeaths.map(d => d.Victim?.AverageItemPower || 0).filter(ip => ip > 0);
    const avgKillerIP = killerIPs.length > 0 ? Math.round(killerIPs.reduce((a, b) => a + b, 0) / killerIPs.length) : 0;
    const avgVictimIP = victimIPs.length > 0 ? Math.round(victimIPs.reduce((a, b) => a + b, 0) / victimIPs.length) : 0;
    const ipAdvantage = avgKillerIP - avgVictimIP;
    
    // Combat Efficiency
    const totalKills = recentKills.length;
    const totalDeaths = recentDeaths.length;
    const kdRatio = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills;
    const killParticipation = ((totalKills + totalDeaths) / allFights.length) * 100;
    
    return {
      zones,
      zoneTypeSummary,
      weapons,
      combatStyle: {
        solo: { kills: soloKills, deaths: soloDeaths, winRate: soloKills / (soloKills + soloDeaths) * 100 },
        group: { kills: groupKills, deaths: groupDeaths, winRate: groupKills / (groupKills + groupDeaths) * 100 }
      },
      streaks: {
        maxKillStreak,
        maxDeathStreak,
        bestKillStreakPeriod,
        worstDeathStreakPeriod
      },
      timeAnalysis: {
        peakHour,
        peakDay,
        fightsByHour,
        fightsByDay,
        avgFightInterval
      },
      performance: {
        totalFameGained,
        avgFamePerKill,
        famePerMinute,
        kdRatio: parseFloat(kdRatio as string),
        killParticipation
      },
      ipAnalysis: {
        avgKillerIP,
        avgVictimIP,
        ipAdvantage
      },
      summary: {
        totalFights: allFights.length,
        zoneCount: zones.length,
        weaponCount: weapons.length,
        mostActiveZone: zones[0]?.name || t('unknown'),
        favoriteWeapon: weapons[0]?.type || t('unknown')
      }
    };
  }, [recentKills, recentDeaths, selectedPlayer]);

  // Prepare timeline data
  const timelineData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const killsOnDay = recentKills.filter(k => {
        const killDate = new Date(k.Timestamp);
        return killDate.toDateString() === date.toDateString();
      }).length;

      const deathsOnDay = recentDeaths.filter(d => {
        const deathDate = new Date(d.Timestamp);
        return deathDate.toDateString() === date.toDateString();
      }).length;

      data.push({
        date: dateStr,
        kills: killsOnDay,
        deaths: deathsOnDay,
        net: killsOnDay - deathsOnDay
      });
    }
    console.log('[Timeline] Generated timeline data:', data.filter(d => d.kills > 0 || d.deaths > 0).length, 'days with activity');
    console.log('[Timeline] Recent kills:', recentKills.length, 'Recent deaths:', recentDeaths.length);
    return data;
  }, [recentKills, recentDeaths, timeRange]);

  // Get top weapon for radar chart
  const topWeapon = weaponMastery.length > 0 ? weaponMastery[0] : null;
  const radarData = topWeapon ? getWeaponAnalysis(topWeapon.id, t) : [];

  return (
    <PageShell
      title={t('title')}
      backgroundImage="/background/ao-pvp.jpg"
      description={t('description')}
      headerActions={
        <div className="w-full md:w-fit flex items-center justify-between gap-3 md:justify-start">
          <ServerSelector
            selectedServer={region}
            onServerChange={(server) => {
              setRegion(server);
              if (selectedPlayer) {
                handleSelectPlayer(selectedPlayer.Id, selectedPlayer.Name);
              }
            }}
          />
          {selectedPlayer && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleSelectPlayer(selectedPlayer.Id, selectedPlayer.Name)}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? tCommon('loading') : tCommon('refresh')}</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search Section */}
        <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder={t('searchPlaceholder')}
                className="w-full"
                icon={<Search className="h-5 w-5 text-muted-foreground" />}
              />
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                  {searchResults.map((player) => (
                    <button
                      key={player.Id}
                      onClick={() => handleSelectPlayer(player.Id, player.Name)}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-3 border-b border-border/50 last:border-0 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground truncate">{player.Name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {player.items && player.items.length > 0 ? (
                            <div className="flex items-center gap-1">
                              {player.items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="w-5 h-5 bg-muted rounded p-0.5">
                                  <ItemIcon item={item} className="w-full h-full object-contain" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">{t('viewFullProfile')}</div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-card/50 rounded-2xl border border-border/50 p-12 text-center">
            <Preloader size="lg" showText text={t('loadingStats')} />
          </div>
        )}

        {/* No Player Selected */}
        {!selectedPlayer && !loading && (
          <div className="bg-card/50 rounded-2xl border border-border/50 p-12 text-center">
            <Sword className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">{t('selectPlayer')}</h3>
            <p className="text-muted-foreground">{t('searchPlaceholder')}</p>
          </div>
        )}

        {/* Player Not Found */}
        {playerNotFound && !loading && (
          <div className="bg-destructive/10 rounded-2xl border border-destructive/30 p-12 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Player Not Found</h3>
            <p className="text-muted-foreground mb-4">
              This player doesn't exist on the <span className="font-bold text-destructive">{region.toUpperCase()}</span> server.
            </p>
            <p className="text-sm text-muted-foreground">
              Try switching to a different server or search for a different player.
            </p>
          </div>
        )}

        {/* Combat Overview Dashboard */}
        {selectedPlayer && !loading && combatStats && (
          <>
            {/* Player Info Header */}
            <div className="bg-card/50 p-4 sm:p-6 rounded-2xl border border-border/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/30 shrink-0">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-foreground break-words">{selectedPlayer.Name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-semibold whitespace-nowrap">
                      {t('combatScore')}: {combatScore}/100
                    </span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded font-mono whitespace-nowrap">
                      {region.toUpperCase()}
                    </span>
                    {linkedCharacter && (
                      <span className="text-xs bg-success/10 text-success px-2 py-1 rounded font-semibold whitespace-nowrap flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {linkedCharacter}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Tooltip content={copied ? t('copied') : t('share')}>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="p-2 flex-1 sm:flex-none"
                      onClick={handleCopyLink}
                      disabled={!selectedPlayer}
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </Tooltip>
                  <Tooltip content={t('export')}>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="p-2 flex-1 sm:flex-none"
                      onClick={handleExport}
                      disabled={!selectedPlayer || !analytics}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Combat Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* K/D Ratio */}
              <StatCard
                icon={<Target className="h-5 w-5 text-primary" />}
                label={t('kdRatio')}
                value={kdRatio.toFixed(2)}
                trend={kdRatio > 1.5 ? 'up' : kdRatio < 0.5 ? 'down' : 'neutral'}
                subvalue={t('killsDeaths', { kills: formatNumber(totalKills), deaths: formatNumber(totalDeaths) })}
              />

              {/* Kill Fame */}
              <StatCard
                icon={<Flame className="h-5 w-5 text-success" />}
                label={t('killFame')}
                value={formatNumber(combatStats.KillFame)}
                trend="up"
                subvalue={t('fameFromKills')}
              />

              {/* Death Fame */}
              <StatCard
                icon={<Skull className="h-5 w-5 text-destructive" />}
                label={t('deathFame')}
                value={formatNumber(combatStats.DeathFame)}
                trend="down"
                subvalue={t('fameLostOnDeath')}
              />

              {/* Win Rate */}
              <StatCard
                icon={<Award className="h-5 w-5 text-info" />}
                label={t('winRate')}
                value={`${winRate}%`}
                trend={winRate > 60 ? 'up' : winRate < 40 ? 'down' : 'neutral'}
                subvalue={t('totalMatches', { count: totalKills + totalDeaths })}
              />

              {/* Combat Score */}
              <StatCard
                icon={<Zap className="h-5 w-5 text-warning" />}
                label={t('combatScore')}
                value={`${combatScore}/100`}
                trend={combatScore > 70 ? 'up' : combatScore < 30 ? 'down' : 'neutral'}
                subvalue={t('overallCombatRating')}
              />

              {/* Recent Form */}
              <StatCard
                icon={<Activity className="h-5 w-5 text-primary" />}
                label={t('recentForm')}
                value={`${recentForm}%`}
                trend={recentForm > 60 ? 'up' : recentForm < 40 ? 'down' : 'neutral'}
                subvalue={t('winRateLast10Fights')}
              />
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                icon={<BarChart3 className="h-4 w-4" />}
                label={t('analysis')}
              />
              <TabButton
                active={activeTab === 'weapons'}
                onClick={() => setActiveTab('weapons')}
                icon={<Radar className="h-4 w-4" />}
                label={t('weaponMastery')}
              />
              <TabButton
                active={activeTab === 'timeline'}
                onClick={() => setActiveTab('timeline')}
                icon={<Clock className="h-4 w-4" />}
                label={t('combatTimeline')}
              />
              <TabButton
                active={activeTab === 'battles'}
                onClick={() => setActiveTab('battles')}
                icon={<Sword className="h-4 w-4" />}
                label={t('recentBattles')}
              />
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <OverviewTab 
                weaponMastery={weaponMastery}
                topWeapon={topWeapon}
                radarData={radarData}
                formatNumber={formatNumber}
                t={t}
                analytics={analytics}
              />
            )}

            {activeTab === 'weapons' && (
              <WeaponsTab 
                weaponMastery={weaponMastery}
                formatNumber={formatNumber}
                t={t}
                locale={locale}
                analytics={analytics}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelineTab 
                timelineData={timelineData}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                t={t}
                analytics={analytics}
                recentKills={recentKills}
                recentDeaths={recentDeaths}
              />
            )}

            {activeTab === 'battles' && (
              <BattlesTab 
                recentKills={recentKills}
                recentDeaths={recentDeaths}
                formatNumber={formatNumber}
                t={t}
                locale={locale}
              />
            )}
          </>
        )}
      </div>

      <InfoStrip currentPage="pvp-intel" />
    </PageShell>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, trend, subvalue }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  subvalue: string;
}) {
  return (
    <div className="group bg-card/50 hover:bg-card/80 p-4 rounded-xl border border-border/50 transition-all hover:scale-105 hover:shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="p-1.5 rounded-lg bg-primary/10">{icon}</div>
        <div className={`flex items-center text-xs font-bold ${
          trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
          {trend === 'down' && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
          {trend === 'neutral' && <Minus className="h-3 w-3 mr-0.5" />}
        </div>
      </div>
      <div className="text-lg lg:text-xl font-black text-foreground mb-0.5">{value}</div>
      <div className="text-[10px] text-muted-foreground">{subvalue}</div>
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
        active
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
          : 'bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// Overview Tab
function OverviewTab({ weaponMastery, topWeapon, radarData, formatNumber, t, analytics }: any) {
  const weapons = Array.isArray(weaponMastery) ? weaponMastery : [];
  
  if (!analytics && weapons.length === 0) {
    return (
      <div className="bg-card/50 p-12 rounded-2xl border border-border/50 text-center">
        <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">{t('noCombatData')}</h3>
        <p className="text-sm text-muted-foreground">{t('combatAnalyticsAppear')}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      {analytics?.performance && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <PerformanceCard
            icon={<TrendingUp className="h-5 w-5 text-success" />}
            label={t('kdRatio')}
            value={analytics.performance.kdRatio.toFixed(2)}
            trend={analytics.performance.kdRatio > 1.5 ? 'positive' : analytics.performance.kdRatio < 0.5 ? 'negative' : 'neutral'}
          />
          <PerformanceCard
            icon={<Flame className="h-5 w-5 text-primary" />}
            label={t('famePerMin')}
            value={formatNumber(analytics.performance.famePerMinute)}
            subvalue={`${formatNumber(analytics.performance.avgFamePerKill)} ${t('avgPerFight')}`}
          />
          <PerformanceCard
            icon={<Target className="h-5 w-5 text-info" />}
            label={t('killParticipation')}
            value={`${analytics.performance.killParticipation.toFixed(0)}%`}
            subvalue={t('ofAllFights')}
          />
          <PerformanceCard
            icon={<Zap className="h-5 w-5 text-warning" />}
            label={t('avgFightInterval')}
            value={`${analytics.performance.famePerMinute > 0 ? Math.round(60 / analytics.performance.famePerMinute) : t('notAvailable')}m`}
            subvalue={t('betweenBattles')}
          />
        </div>
      )}
      
      {/* Combat Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Activity */}
        <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('zoneActivity')}</h3>
                <p className="text-xs text-muted-foreground">{t('top5FightingLocations')}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {analytics?.zones?.slice(0, 5).map((zone: any, index: number) => (
              <div key={zone.name} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{zone.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                      zone.type === 'city' ? 'bg-primary/10 text-primary' :
                      zone.type === 'hellgate' ? 'bg-destructive/10 text-destructive' :
                      zone.type === 'crystal' ? 'bg-info/10 text-info' :
                      zone.type === 'hideout' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {zone.zoneType}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatNumber(zone.kills)} {t('killsShort')} / {formatNumber(zone.deaths)} {t('deathsShort')} • {zone.winRate.toFixed(0)}% {t('winRateShort')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">{zone.kills + zone.deaths}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{t('fights')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weapon Performance */}
        <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/10">
                <Sword className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('weaponPerformance')}</h3>
                <p className="text-xs text-muted-foreground">{t('topWeaponsByKills')}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {analytics?.weapons?.slice(0, 5).map((weapon: any, index: number) => (
              <div key={weapon.type} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg shrink-0">
                  <ItemIcon item={weapon.sampleId} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground text-sm truncate">
                    {formatWeaponName(weapon.type)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {weapon.kills}K / {weapon.deaths}D • {weapon.winRate.toFixed(0)}% WR
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">{Math.round(weapon.avgIp)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{t('avgIp')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Combat Style & Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Combat Style */}
        <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-info/10">
              <Users className="h-6 w-6 text-info" />
            </div>
            <h3 className="text-lg font-black text-foreground">{t('combatStyle')}</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">{t('solo')}</span>
                <span className="text-sm font-bold text-foreground">
                  {analytics?.combatStyle?.solo.kills || 0}K / {analytics?.combatStyle?.solo.deaths || 0}D
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all"
                  style={{ width: `${analytics?.combatStyle?.solo.winRate || 0}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('winRateLabel', { rate: analytics?.combatStyle?.solo.winRate.toFixed(0) })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">{t('group')}</span>
                <span className="text-sm font-bold text-foreground">
                  {analytics?.combatStyle?.group.kills || 0}K / {analytics?.combatStyle?.group.deaths || 0}D
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${analytics?.combatStyle?.group.winRate || 0}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('winRateLabel', { rate: analytics?.combatStyle?.group.winRate.toFixed(0) })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Streaks */}
        <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-destructive/10">
              <Flame className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-black text-foreground">{t('streaks')}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-success/10 rounded-xl border border-success/30">
              <div className="text-3xl font-black text-success mb-1">
                {analytics?.streaks?.maxKillStreak || 0}
              </div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">{t('bestKill')}</div>
            </div>
            <div className="text-center p-3 bg-destructive/10 rounded-xl border border-destructive/30">
              <div className="text-3xl font-black text-destructive mb-1">
                {analytics?.streaks?.maxDeathStreak || 0}
              </div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">{t('worstDeath')}</div>
            </div>
          </div>
        </div>
        
        {/* IP Analysis */}
        <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-warning/10">
              <Award className="h-6 w-6 text-warning" />
            </div>
            <h3 className="text-lg font-black text-foreground">{t('ipAnalysis')}</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('avgKillerIp')}</span>
              <span className="text-sm font-bold text-success">{formatNumber(roundTo(analytics?.ipAnalysis?.avgKillerIP || 0, 1))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('avgVictimIp')}</span>
              <span className="text-sm font-bold text-destructive">{formatNumber(roundTo(analytics?.ipAnalysis?.avgVictimIP || 0, 1))}</span>
            </div>
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{t('ipAdvantage')}</span>
                <span className={`text-lg font-black ${analytics?.ipAnalysis?.ipAdvantage > 0 ? 'text-success' : 'text-destructive'}`}>
                  {analytics?.ipAnalysis?.ipAdvantage > 0 ? '+' : ''}{formatNumber(roundTo(analytics?.ipAnalysis?.ipAdvantage || 0, 1))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Weapon Mastery Radar (if available) */}
      {weapons.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Radar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('weaponMastery')}</h3>
                <p className="text-xs text-muted-foreground">
                  {topWeapon ? formatNumber(topWeapon.count) : '0'} {t('matches')}
                </p>
              </div>
            </div>
            
            {topWeapon && radarData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#a8a29e" opacity={0.3} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#a8a29e', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#a8a29e', fontSize: 10 }} />
                    <RechartsRadar
                      name={t('weaponCharacteristics')}
                      dataKey="A"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No radar data available
              </div>
            )}
          </div>

          {/* Top Weapons */}
          <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-success/10">
                <Award className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('topWeapons')}</h3>
                <p className="text-xs text-muted-foreground">{t('byUsageWinRate')}</p>
              </div>
            </div>

            <div className="space-y-3">
              {weapons.slice(0, 5).map((weapon: any, index: number) => (
                <div key={weapon.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                  <div className="h-10 w-10 bg-muted rounded-lg border border-border/50 p-1 shrink-0">
                    <ItemIcon item={weapon.sampleId} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground text-sm truncate">
                      {weapon.id.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(weapon.count)} {t('matches')} • {roundTo(weapon.avgIp, 0)} IP
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${weapon.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                      {Math.round(weapon.winRate)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">{t('winRate')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Performance Card Component
function PerformanceCard({ icon, label, value, trend, subvalue }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: 'positive' | 'negative' | 'neutral';
  subvalue?: string;
}) {
  return (
    <div className="bg-card/50 p-4 rounded-xl border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-primary/10">{icon}</div>
        {trend && (
          <div className={`text-xs font-bold ${
            trend === 'positive' ? 'text-success' : trend === 'negative' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {trend === 'positive' ? '↑' : trend === 'negative' ? '↓' : '•'}
          </div>
        )}
      </div>
      <div className="text-xl font-black text-foreground mb-0.5">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {subvalue && <div className="text-[10px] text-muted-foreground">{subvalue}</div>}
    </div>
  );
}

// Weapons Tab
function WeaponsTab({ weaponMastery, formatNumber, t, locale, analytics }: any) {
  const weapons = Array.isArray(weaponMastery) ? weaponMastery : [];
  const analyticsWeapons = analytics?.weapons || [];
  
  // Use analytics weapons if available, otherwise fall back to weaponMastery
  const displayWeapons = analyticsWeapons.length > 0 ? analyticsWeapons : weapons;
  const [expandedWeapon, setExpandedWeapon] = useState<string | null>(null);
  
  if (displayWeapons.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-card/50 rounded-2xl border border-border/50 p-12 text-center">
          <Sword className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">{t('noWeaponData')}</h3>
          <p className="text-sm text-muted-foreground">{t('weaponStatsAppear')}</p>
        </div>
        
        {/* API Limit Notice */}
        <div className="bg-info/10 border border-info/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-info mt-0.5" />
            <div>
              <h4 className="font-bold text-info mb-1">API Data Limit</h4>
              <p className="text-sm text-muted-foreground">
                The Albion Online API only provides the last 10 kills and 10 deaths per player. 
                This is a hard limit from Sandbox Interactive. Weapon mastery is calculated from these 20 recent battles.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate weapon category breakdown - ONLY WEAPONS
  const weaponCategories = displayWeapons
    .filter((weapon: any) => {
      const type = weapon.type.toUpperCase();
      return type.includes('MAIN') || type.includes('OFF') || type.includes('2H');
    })
    .reduce((acc: any, weapon: any) => {
      // Determine category from weapon type
      const upperType = weapon.type.toUpperCase();
      let category = 'Other';
      if (upperType.includes('2H')) category = '2H';
      else if (upperType.includes('MAIN')) category = 'MAIN';
      else if (upperType.includes('OFF')) category = 'OFF';
      
      if (!acc[category]) acc[category] = { kills: 0, deaths: 0, fame: 0, count: 0 };
      acc[category].kills += weapon.kills;
      acc[category].deaths += weapon.deaths;
      acc[category].fame += weapon.fame;
      acc[category].count++;
      return acc;
    }, {});
  
  const categoryData = Object.entries(weaponCategories)
    .map(([name, data]: any) => ({
      category: name,
      ...data,
      winRate: (data.kills + data.deaths) > 0 ? (data.kills / (data.kills + data.deaths)) * 100 : 0
    }))
    .sort((a, b) => b.kills - a.kills);

  return (
    <div className="space-y-6">
      {/* Weapon Categories Overview */}
      <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">{t('weaponCategories')}</h3>
              <p className="text-xs text-muted-foreground">{t('performanceByWeaponType')}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categoryData.slice(0, 6).map((cat: any, index: number) => (
            <div key={cat.category} className="bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2 truncate">
                {cat.category}
              </div>
              <div className="text-2xl font-black text-foreground mb-1">
                {formatNumber(cat.kills)}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {cat.kills}K / {cat.deaths}D
              </div>
              <div className={`text-sm font-bold ${cat.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                {cat.winRate.toFixed(0)}% WR
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Detailed Weapon Table */}
      <div className="bg-card/50 rounded-2xl border border-border/50 overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-black text-foreground">{t('allWeapons')}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t('completeWeaponStats')}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t('weaponTable')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t('killsTable')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t('deathsTable')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t('fameTable')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t('kdTable')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t('winRate')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t('avgIpTable')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {displayWeapons
                .filter((weapon: any) => {
                  const type = weapon.type.toUpperCase();
                  return type.includes('MAIN') || type.includes('OFF') || type.includes('2H');
                })
                .filter((weapon: any) => weapon.kills + weapon.deaths >= 2)
                .map((weapon: any) => {
                  const kd = weapon.deaths > 0 ? (weapon.kills / weapon.deaths).toFixed(2) : weapon.kills;
                  const winRate = (weapon.kills + weapon.deaths) > 0
                    ? (weapon.kills / (weapon.kills + weapon.deaths)) * 100
                    : 0;
                  const isExpanded = expandedWeapon === weapon.type;
                  const radarData = getWeaponAnalysis(weapon.type, t);

                  return (
                    <Fragment key={weapon.type}>
                      <tr
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedWeapon(isExpanded ? null : weapon.type)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-muted rounded-lg border border-border/50 p-1">
                              <ItemIcon item={weapon.sampleId} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-sm">
                                  {formatWeaponName(weapon.type)}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {t('fightsLabel', { count: weapon.kills + weapon.deaths })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-success">
                          {formatNumber(weapon.kills)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-destructive">
                          {formatNumber(weapon.deaths)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-foreground">
                          {formatNumber(weapon.fame)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-mono font-bold ${parseFloat(kd as string) >= 1.5 ? 'text-success' : parseFloat(kd as string) < 0.5 ? 'text-destructive' : 'text-foreground'}`}>
                            {kd}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-mono font-bold ${winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                            {winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-foreground">
                          {Math.round(weapon.avgIp)}
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-6 py-6 bg-muted/30">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="bg-card/50 p-6 rounded-xl border border-border/50">
                                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                  <Radar className="h-5 w-5 text-primary" />
                                  {t('weaponCharacteristics')}
                                </h4>
                                <div className="h-[300px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData}>
                                      <PolarGrid stroke="#a8a29e" opacity={0.3} />
                                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#a8a29e', fontSize: 11 }} />
                                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#a8a29e', fontSize: 10 }} />
                                      <RechartsTooltip
                                        contentStyle={{
                                          backgroundColor: 'hsl(var(--popover))',
                                          border: '2px solid hsl(var(--border))',
                                          borderRadius: '12px'
                                        }}
                                      />
                                      <RechartsRadar
                                        name={t('weaponCharacteristics')}
                                        dataKey="A"
                                        stroke="#f59e0b"
                                        fill="#f59e0b"
                                        fillOpacity={0.5}
                                      />
                                    </RadarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="bg-card/50 p-4 rounded-xl border border-border/50">
                                  <h4 className="font-bold text-foreground mb-3">{t('performanceStats')}</h4>
                                  <div className="grid grid-cols-2 gap-3">
                                    <StatRow label={t('totalFights')} value={(weapon.kills + weapon.deaths).toString()} />
                                    <StatRow label={t('winRate')} value={`${winRate.toFixed(1)}%`} highlight={winRate >= 50} />
                                    <StatRow label={t('killsTable')} value={formatNumber(weapon.kills)} color="text-success" />
                                    <StatRow label={t('deathsTable')} value={formatNumber(weapon.deaths)} color="text-destructive" />
                                    <StatRow label={t('kdTable')} value={kd} highlight={parseFloat(kd as string) >= 1.5} />
                                    <StatRow label={t('fameTable')} value={formatNumber(weapon.fame)} />
                                  </div>
                                </div>

                                <div className="bg-card/50 p-4 rounded-xl border border-border/50">
                                  <h4 className="font-bold text-foreground mb-3">{t('itemPower')}</h4>
                                  <div className="grid grid-cols-2 gap-3">
                                    <StatRow label={t('avgIpTable')} value={Math.round(weapon.avgIp).toString()} />
                                    <StatRow label={t('ipSpread')} value={`${Math.max(0, Math.round(weapon.avgIp - 100))} - ${Math.round(weapon.avgIp + 100)}`} />
                                  </div>
                                </div>

                                {weapon.damageDealt > 0 && (
                                  <div className="bg-card/50 p-4 rounded-xl border border-border/50">
                                    <h4 className="font-bold text-foreground mb-3">{t('damageStats')}</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                      <StatRow label={t('avgDmgDealt')} value={formatNumber(Math.round(weapon.damageDealt / Math.max(1, weapon.kills_with_item)))} />
                                      <StatRow label={t('avgDmgTaken')} value={formatNumber(Math.round(weapon.damageTaken / Math.max(1, weapon.deaths_with_item)))} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Stat Row Helper
function StatRow({ label, value, color, highlight }: { 
  label: string; 
  value: string; 
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold ${color || (highlight ? 'text-success' : 'text-foreground')}`}>
        {value}
      </span>
    </div>
  );
}

// Timeline Tab
function TimelineTab({ timelineData, timeRange, setTimeRange, t, analytics, recentKills, recentDeaths }: any) {
  const totalKills = recentKills?.length || 0;
  const totalDeaths = recentDeaths?.length || 0;
  const totalBattles = totalKills + totalDeaths;
  const winRate = totalBattles > 0 ? ((totalKills / totalBattles) * 100).toFixed(1) : '0';
  
  const peakHour = analytics?.timeAnalysis?.peakHour || 0;
  const peakDay = analytics?.timeAnalysis?.peakDay || 0;
  const hourLabels = [t('hour12AM'), t('hour3AM'), t('hour6AM'), t('hour9AM'), t('hour12PM'), t('hour3PM'), t('hour6PM'), t('hour9PM')];
  const dayLabels = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

  if (totalBattles === 0) {
    return (
      <div className="bg-card/50 p-12 rounded-2xl border border-border/50 text-center">
        <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">{t('noBattleData')}</h3>
        <p className="text-sm text-muted-foreground">{t('combatTimelineAppear')}</p>
        <div className="mt-6 bg-info/10 border border-info/30 rounded-xl p-4 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-info mt-0.5" />
            <div className="text-left">
              <h4 className="font-bold text-info mb-1">API Data Limit</h4>
              <p className="text-sm text-muted-foreground">
                {t('apiLimitationBattle')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Info Notice */}
      <div className="bg-info/10 border border-info/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-info mt-0.5" />
          <div>
            <h4 className="font-bold text-info mb-1">{t('combatAnalysisReport')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('analysisBasedOn', { kills: totalKills, deaths: totalDeaths })}{' '}
              {t('winRateLabel', { rate: winRate })}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Sword className="h-5 w-5 text-success" />}
          label={t('killsTable')}
          value={totalKills.toString()}
          trend="up"
          subvalue={t('winRateLabel', { rate: ((totalKills / Math.max(1, totalBattles)) * 100).toFixed(0) })}
        />
        <StatCard
          icon={<Skull className="h-5 w-5 text-destructive" />}
          label={t('deathsTable')}
          value={totalDeaths.toString()}
          trend="down"
          subvalue={t('fightsLabel', { count: ((totalDeaths / Math.max(1, totalBattles)) * 100).toFixed(0) })}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5 text-primary" />}
          label={t('winRate')}
          value={`${winRate}%`}
          trend={parseFloat(winRate) >= 50 ? 'up' : 'down'}
          subvalue={parseFloat(winRate) >= 50 ? t('positive') : t('needsImprovement')}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-info" />}
          label={t('avgFightInterval')}
          value={`${analytics?.timeAnalysis?.avgFightInterval || 0}m`}
          trend="neutral"
          subvalue={t('betweenBattles')}
        />
      </div>

      {/* Activity Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity */}
        <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-info/10">
                <Clock className="h-6 w-6 text-info" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('hourlyActivity')}</h3>
                <p className="text-xs text-muted-foreground">{t('whenYouFightMost')}</p>
              </div>
            </div>
          </div>
          
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.timeAnalysis?.fightsByHour?.map((count: number, hour: number) => ({
                hour: hourLabels[hour] || `${hour}:00`,
                [t('battles')]: count,
                isPeak: hour === peakHour
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#a8a29e" opacity={0.3} vertical={false} />
                <XAxis dataKey="hour" stroke="#a8a29e" fontSize={10} tick={{ fill: '#a8a29e' }} />
                <YAxis stroke="#a8a29e" fontSize={10} tick={{ fill: '#a8a29e' }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '2px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey={t('battles')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {t('peakActivity')} <span className="font-bold text-primary">{peakHour}:00</span>
            </p>
            <p className="text-muted-foreground">
              {t('totalBattles')} <span className="font-bold text-foreground">{totalBattles}</span>
            </p>
          </div>
        </div>

        {/* Daily Activity */}
        <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-warning/10">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('dailyActivity')}</h3>
                <p className="text-xs text-muted-foreground">{t('whichDaysYouFightMost')}</p>
              </div>
            </div>
          </div>
          
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.timeAnalysis?.fightsByDay?.map((count: number, day: number) => ({
                day: dayLabels[day] || t('unknown'),
                [t('battles')]: count,
                isPeak: day === peakDay
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#a8a29e" opacity={0.3} vertical={false} />
                <XAxis dataKey="day" stroke="#a8a29e" fontSize={10} tick={{ fill: '#a8a29e' }} />
                <YAxis stroke="#a8a29e" fontSize={10} tick={{ fill: '#a8a29e' }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '2px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey={t('battles')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {t('mostActive')} <span className="font-bold text-warning">{dayLabels[peakDay] || t('unknown')}</span>
            </p>
            <p className="text-muted-foreground">
              {t('avgBattlesPerDay')} <span className="font-bold text-foreground">{(totalBattles / 7).toFixed(1)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Combat Insights */}
      <div className="bg-card/50 p-6 rounded-2xl border border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground">{t('combatInsights')}</h3>
            <p className="text-xs text-muted-foreground">{t('analysisOfFightingPatterns')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="text-sm text-muted-foreground mb-1">{t('preferredPlayTime')}</div>
            <div className="text-2xl font-black text-foreground">
              {peakHour >= 6 && peakHour < 12 ? t('morning') : peakHour >= 12 && peakHour < 18 ? t('afternoon') : peakHour >= 18 || peakHour < 6 ? t('night') : t('midday')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('peakAt', { hour: peakHour })}
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="text-sm text-muted-foreground mb-1">{t('combatFrequency')}</div>
            <div className="text-2xl font-black text-foreground">
              {analytics?.timeAnalysis?.avgFightInterval && analytics.timeAnalysis.avgFightInterval < 30 ? t('veryActive') : analytics?.timeAnalysis?.avgFightInterval && analytics.timeAnalysis.avgFightInterval < 120 ? t('active') : t('casual')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('everyMinutes', { minutes: analytics?.timeAnalysis?.avgFightInterval || 0 })}
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="text-sm text-muted-foreground mb-1">{t('performance')}</div>
            <div className={`text-2xl font-black ${parseFloat(winRate) >= 60 ? 'text-success' : parseFloat(winRate) >= 40 ? 'text-warning' : 'text-destructive'}`}>
              {parseFloat(winRate) >= 60 ? t('dominating') : parseFloat(winRate) >= 40 ? t('balanced') : t('learning')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('winRateLabel', { rate: winRate })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Battles Tab
function BattlesTab({ recentKills, recentDeaths, formatNumber, t, locale }: any) {
  const [activeTab, setActiveTab] = useState<'all' | 'kills' | 'deaths'>('all');
  const [expandedBattle, setExpandedBattle] = useState<number | null>(null);
  
  const allBattles = [
    ...(recentKills || []).map((k: any) => ({ ...k, type: 'kill' })), 
    ...(recentDeaths || []).map((d: any) => ({ ...d, type: 'death' }))
  ].sort(
    (a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
  );
  
  const filteredBattles = activeTab === 'all' 
    ? allBattles 
    : activeTab === 'kills' 
      ? allBattles.filter((b: any) => b.type === 'kill')
      : allBattles.filter((b: any) => b.type === 'death');

  const totalKills = recentKills?.length || 0;
  const totalDeaths = recentDeaths?.length || 0;

  if (allBattles.length === 0) {
    return (
      <div className="bg-card/50 rounded-2xl border border-border/50 p-12 text-center">
        <Sword className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">{t('noRecentBattles')}</h3>
        <p className="text-sm text-muted-foreground">{t('recentBattleHistoryAppear')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Battle Summary with Tabs */}
      <div className="bg-card/50 p-4 rounded-xl border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-success">{totalKills}</div>
              <div className="text-xs text-muted-foreground uppercase">{t('killsTable')}</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-black text-destructive">{totalDeaths}</div>
              <div className="text-xs text-muted-foreground uppercase">{t('deathsTable')}</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-black text-foreground">{allBattles.length}</div>
              <div className="text-xs text-muted-foreground uppercase">{t('totalFights')}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{t('recentActivity')}</div>
            <div className="text-xs text-muted-foreground">{t('lastBattles', { count: allBattles.length })}</div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-card'
            }`}
          >
            {t('allBattles', { count: allBattles.length })}
          </button>
          <button
            onClick={() => setActiveTab('kills')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'kills'
                ? 'bg-success text-success-foreground'
                : 'bg-muted text-muted-foreground hover:bg-card'
            }`}
          >
            {t('killBattles', { count: totalKills })}
          </button>
          <button
            onClick={() => setActiveTab('deaths')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'deaths'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-muted text-muted-foreground hover:bg-card'
            }`}
          >
            {t('deathBattles', { count: totalDeaths })}
          </button>
        </div>
      </div>

      {/* Battle List */}
      <div className="space-y-3">
        {filteredBattles.map((battle: any, index: number) => (
          <BattleCard
            key={index}
            battle={battle}
            formatNumber={formatNumber}
            roundTo={roundTo}
            t={t}
            locale={locale}
            isExpanded={expandedBattle === index}
            onToggle={() => setExpandedBattle(expandedBattle === index ? null : index)}
          />
        ))}
      </div>
      
      {filteredBattles.length === 0 && (
        <div className="bg-card/50 rounded-xl border border-border/50 p-8 text-center">
          <p className="text-muted-foreground">{t('noOverview')}</p>
        </div>
      )}
    </div>
  );
}

// Equipment Slot Helper Component
function EquipmentSlot({ item, label, t }: { item: any; label: string; t: any }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded p-0.5 border border-border/50 bg-muted/50">
        {item ? (
          <ItemIcon item={item?.Type || item?.type} className="w-20" />
        ) : (
          <div className="w-20 h-20 flex items-center justify-center text-muted-foreground text-xs">-</div>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase mt-1">{t(label)}</div>
    </div>
  );
}

// Battle Card Component
function BattleCard({ battle, formatNumber, roundTo, t, locale, isExpanded, onToggle }: any) {
  const isKill = battle.type === 'kill';
  const killer = battle.Killer;
  const victim = battle.Victim;
  const fame = battle.TotalVictimKillFame || 0;

  // Calculate IP advantage
  const killerIP = killer?.AverageItemPower || 0;
  const victimIP = victim?.AverageItemPower || 0;
  const ipAdvantage = killerIP - victimIP;
  const ipAdvantagePercent = victimIP > 0 ? Math.round((ipAdvantage / victimIP) * 100) : 0;

  return (
    <>
      <div 
        className={`bg-card/50 p-4 rounded-xl border border-border/50 transition-all hover:shadow-lg cursor-pointer`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Battle Type Icon */}
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isKill ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {isKill ? (
                <Sword className="h-6 w-6 text-success" />
              ) : (
                <Skull className="h-6 w-6 text-destructive" />
              )}
            </div>

            {/* Battle Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-bold text-sm px-2 py-0.5 rounded ${isKill ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {isKill ? t('victory') : t('defeat')}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(battle.Timestamp).toLocaleDateString(locale, { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {isKill ? t('killed') : t('killedBy')}{' '}
                <span className="font-semibold text-foreground">{isKill ? victim?.Name : killer?.Name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Fame */}
            <div className="text-right">
              <div className={`font-mono font-bold ${isKill ? 'text-success' : 'text-destructive'}`}>
                {isKill ? '+' : '-'}{formatNumber(fame)}
              </div>
              <div className="text-xs text-muted-foreground uppercase">{t('fame')}</div>
            </div>
            
            {/* Expand Icon */}
            <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="bg-card/50 rounded-xl border border-border/50 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* VS Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Killer */}
              <div className="bg-success/10 p-4 rounded-xl border border-success/30">
                <div className="text-sm text-success font-bold mb-2">{t('killer')}</div>
                <div className="text-lg font-black text-foreground mb-1">{killer?.Name}</div>
                <div className="text-sm text-muted-foreground">IP: {formatNumber(killerIP)}</div>
              </div>
              
              {/* VS */}
              <div className="text-center">
                <div className="text-3xl font-black text-destructive">{t('vs')}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {ipAdvantage > 0 ? '+' : ''}{roundTo(ipAdvantage, 1)} IP ({ipAdvantagePercent}%)
                </div>
              </div>
              
              {/* Victim */}
              <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/30">
                <div className="text-sm text-destructive font-bold mb-2">{t('victim')}</div>
                <div className="text-lg font-black text-foreground mb-1">{victim?.Name}</div>
                <div className="text-sm text-muted-foreground">IP: {formatNumber(victimIP)}</div>
              </div>
            </div>
            
            {/* Equipment Comparison - Game-style Grid */}
            <div>
              <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {t('equipmentComparison')}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Killer Equipment */}
                <div className="bg-background/10 pt-4 rounded-xl border border-border/50">
                  <div className="text-sm text-success font-bold mb-3 md:mb-4 text-center">{t('killer')}</div>
                  <div className="grid grid-cols-3 gap-2 mb:gap-1 border-t border-border/30 pt-4">
                    {/* Row 1: Bag, Head, Cape */}
                    <EquipmentSlot item={killer?.Equipment?.Bag} label="bag" t={t} />
                    <EquipmentSlot item={killer?.Equipment?.Head} label="head" t={t} />
                    <EquipmentSlot item={killer?.Equipment?.Cape} label="cape" t={t} />

                    {/* Row 2: Main Hand, Armor, Off Hand */}
                    <EquipmentSlot item={killer?.Equipment?.MainHand} label="main" t={t} />
                    <EquipmentSlot item={killer?.Equipment?.Armor} label="armor" t={t} />
                    <EquipmentSlot item={killer?.Equipment?.OffHand} label="off" t={t} />

                    {/* Row 3: Potion, Shoes, Food */}
                    <EquipmentSlot item={killer?.Equipment?.Potion} label="pot" t={t} />
                    <EquipmentSlot item={killer?.Equipment?.Shoes} label="shoes" t={t} />
                    <EquipmentSlot item={killer?.Equipment?.Food} label="food" t={t} />

                    {/* Row 4: Empty, Mount, Empty */}
                    <div className="h-16" />
                    <EquipmentSlot item={killer?.Equipment?.Mount} label="mount" t={t} />
                    <div className="h-16" />
                  </div>
                </div>
                
                {/* Victim Equipment */}
                <div className="bg-background/10 pt-4 rounded-xl border border-border/30">
                  <div className="text-sm text-destructive font-bold mb-3 text-center">{t('victim')}</div>
                  <div className="grid grid-cols-3 gap-2 mb:gap-1 border-t border-border/30 pt-4">
                    {/* Row 1: Bag, Head, Cape */}
                    <EquipmentSlot item={victim?.Equipment?.Bag} label="bag" t={t} />
                    <EquipmentSlot item={victim?.Equipment?.Head} label="head" t={t} />
                    <EquipmentSlot item={victim?.Equipment?.Cape} label="cape" t={t} />

                    {/* Row 2: Main Hand, Armor, Off Hand */}
                    <EquipmentSlot item={victim?.Equipment?.MainHand} label="main" t={t} />
                    <EquipmentSlot item={victim?.Equipment?.Armor} label="armor" t={t} />
                    <EquipmentSlot item={victim?.Equipment?.OffHand} label="off" t={t} />

                    {/* Row 3: Potion, Shoes, Food */}
                    <EquipmentSlot item={victim?.Equipment?.Potion} label="pot" t={t} />
                    <EquipmentSlot item={victim?.Equipment?.Shoes} label="shoes" t={t} />
                    <EquipmentSlot item={victim?.Equipment?.Food} label="food" t={t} />

                    {/* Row 4: Empty, Mount, Empty */}
                    <div className="h-16" />
                    <EquipmentSlot item={victim?.Equipment?.Mount} label="mount" t={t} />
                    <div className="h-16" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Battle Analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">{t('ipAdvantage')}</div>
                <div className={`text-2xl font-black ${ipAdvantage > 0 ? 'text-success' : ipAdvantage < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {ipAdvantage > 0 ? '+' : ''}{roundTo(ipAdvantage, 1)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('ipAdvantagePercent', { percent: ipAdvantagePercent })}
                </div>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">{t('location')}</div>
                <div className="text-lg font-bold text-foreground">{battle.Location || t('unknown')}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(battle.Timestamp).toLocaleDateString(locale, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">{t('participants')}</div>
                <div className="text-lg font-bold text-foreground">{battle.Participants?.length || 1}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {battle.Participants && battle.Participants.length > 2 ? t('groupFight') : t('soloFight')}
                </div>
              </div>
            </div>
            
            {/* Kill Fame */}
            <div className="bg-primary/10 p-4 rounded-xl border border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('killFameEarned')}</div>
                  <div className="text-2xl font-black text-primary">+{formatNumber(roundTo(fame, 0))}</div>
                </div>
                <Trophy className="h-12 w-12 text-primary/30" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
