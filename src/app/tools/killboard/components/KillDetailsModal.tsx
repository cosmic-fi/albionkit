'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useServer } from '@/hooks/useServer';
import { ItemIcon } from '@/components/ItemIcon';
import { resolveItemNameAction, getEventMetadataAction } from '../actions';
import { Event, Equipment, Item, Participant } from '../types';
import {
  X, Skull, Swords, Users, Zap, Shield, Sword, Archive,
  TrendingUp, Heart, Activity, Award, ChevronDown, ChevronUp,
  Eye, EyeOff, Share2
} from 'lucide-react';

interface KillDetailsModalProps {
  event: Event;
  onClose: () => void;
  onShare?: (event: Event) => void;
}

export function KillDetailsModal({ event, onClose, onShare }: KillDetailsModalProps) {
  const t = useTranslations('KillFeed');
  const { server } = useServer();
  const locale = useLocale();
  const [metadata, setMetadata] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    equipment: true,
    inventory: false,
    participants: true,
    analysis: false
  });

  useEffect(() => {
    getEventMetadataAction(event, server).then(setMetadata);
  }, [event, server]);

  const participants = useMemo(() => 
    event.Participants.filter(p => p.Id !== event.Killer.Id),
    [event.Participants, event.Killer.Id]
  );

  const { totalLoss, inventoryValue, killerInventoryValue, killStyle } = useMemo(() => {
    const pCount = event.Participants.length;
    const killerIp = event.Killer.AverageItemPower;
    const victimIp = event.Victim.AverageItemPower;
    const ipDiff = Math.abs(killerIp - victimIp);

    let style = { label: t('soloKill'), color: 'text-purple-500', icon: Sword, bg: 'bg-purple-500/10' };
    if (pCount > 10) style = { label: t('zvzLargeScale'), color: 'text-red-500', icon: Users, bg: 'bg-red-500/10' };
    else if (pCount > 1) style = { label: t('groupGank'), color: 'text-orange-500', icon: Users, bg: 'bg-orange-500/10' };
    else if (killerIp > victimIp + 300) style = { label: t('stomp'), color: 'text-yellow-500', icon: Zap, bg: 'bg-yellow-500/10' };
    else if (ipDiff < 50) style = { label: t('fairFight'), color: 'text-green-500', icon: Swords, bg: 'bg-green-500/10' };

    let invVal = 0;
    let equipVal = 0;
    let killerInvVal = 0;

    if (metadata?.prices) {
      if (event.Victim.Inventory) {
        invVal = event.Victim.Inventory.reduce((acc: number, item: any) => {
          if (!item) return acc;
          return acc + ((metadata.prices[item.Type] || 0) * item.Count);
        }, 0);
      }
      if (event.Killer.Inventory) {
        killerInvVal = event.Killer.Inventory.reduce((acc: number, item: any) => {
          if (!item) return acc;
          return acc + ((metadata.prices[item.Type] || 0) * item.Count);
        }, 0);
      }
      if (event.Victim.Equipment) {
        equipVal = Object.values(event.Victim.Equipment).reduce((acc: number, item: any) => {
          if (!item) return acc;
          return acc + ((metadata.prices[item.Type] || 0) * item.Count);
        }, 0);
      }
    }

    return {
      totalLoss: invVal + equipVal,
      inventoryValue: invVal,
      killerInventoryValue: killerInvVal,
      killStyle: style
    };
  }, [metadata, event, t]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-popover border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-6xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 sm:animate-in sm:slide-in-from-bottom-4 sm:zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0" aria-hidden="true">
          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between bg-accent/20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-red-500/10 shrink-0">
              <Skull className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base sm:text-lg truncate">{t('killDetails')}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {new Date(event.TimeStamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-2">
            {onShare && (
              <button
                onClick={() => onShare(event)}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title={t('shareKill')}
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          {/* Combat Analysis Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <AnalysisCard
              icon={killStyle.icon}
              label={t('killStyle')}
              value={killStyle.label}
              valueClass={killStyle.color}
            />
            <AnalysisCard
              icon={Archive}
              label={t('totalLoss')}
              value={metadata ? formatCompactNumber(totalLoss) : '...'}
              valueClass="text-red-500"
              subvalue={t('estMarketValue')}
            />
            <AnalysisCard
              icon={Sword}
              label={t('killFame')}
              value={formatCompactNumber(event.TotalVictimKillFame)}
              valueClass="text-amber-500"
            />
            <AnalysisCard
              icon={Users}
              label={t('participants')}
              value={event.Participants.length.toString()}
              valueClass="text-blue-500"
            />
          </div>

          {/* IP Comparison Bar */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4" /> {t('ipComparison')}
              </h4>
            </div>
            <IPComparisonBar
              killer={{ name: event.Killer.Name, ip: event.Killer.AverageItemPower }}
              victim={{ name: event.Victim.Name, ip: event.Victim.AverageItemPower }}
            />
          </div>

          {/* Equipment Comparison - Collapsible */}
          <CollapsibleSection
            title={t('equipment')}
            icon={Shield}
            isExpanded={expandedSections.equipment}
            onToggle={() => toggleSection('equipment')}
          >
            <div className="grid md:grid-cols-2 gap-6">
              <PlayerEquipment
                player={event.Killer}
                title={t('killer')}
                color="green"
                metadata={metadata}
                locale={locale}
              />
              <PlayerEquipment
                player={event.Victim}
                title={t('victim')}
                color="red"
                metadata={metadata}
                locale={locale}
              />
            </div>
          </CollapsibleSection>

          {/* Inventory - Collapsible */}
          <CollapsibleSection
            title={t('inventory')}
            icon={Archive}
            isExpanded={expandedSections.inventory}
            onToggle={() => toggleSection('inventory')}
          >
            <div className="grid md:grid-cols-2 gap-6">
              <PlayerInventory
                player={event.Killer}
                title={t('killer')}
                color="green"
                value={killerInventoryValue}
                metadata={metadata}
                locale={locale}
              />
              <PlayerInventory
                player={event.Victim}
                title={t('victim')}
                color="red"
                value={inventoryValue}
                metadata={metadata}
                locale={locale}
              />
            </div>
          </CollapsibleSection>

          {/* Participants - Collapsible */}
          {participants.length > 0 && (
            <CollapsibleSection
              title={t('assists', { n: participants.length })}
              icon={Users}
              isExpanded={expandedSections.participants}
              onToggle={() => toggleSection('participants')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {participants.map((p) => (
                  <ParticipantCard
                    key={p.Id}
                    participant={p}
                    metadata={metadata}
                    locale={locale}
                  />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Combat Analysis - Collapsible */}
          <CollapsibleSection
            title={t('combatAnalysis')}
            icon={TrendingUp}
            isExpanded={expandedSections.analysis}
            onToggle={() => toggleSection('analysis')}
          >
            <CombatAnalysis
              event={event}
              killStyle={killStyle}
              totalLoss={totalLoss}
            />
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function AnalysisCard({ icon: Icon, label, value, valueClass, subvalue }: {
  icon: any;
  label: string;
  value: string | number;
  valueClass?: string;
  subvalue?: string;
}) {
  return (
    <div className="bg-card border border-border p-2 sm:p-3 rounded-xl">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        <span className="text-[9px] sm:text-xs font-bold text-muted-foreground uppercase truncate">{label}</span>
      </div>
      <div className={`text-base sm:text-lg md:text-xl font-black break-words ${valueClass || 'text-foreground'}`}>
        {value}
      </div>
      {subvalue && <div className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5">{subvalue}</div>}
    </div>
  );
}

function IPComparisonBar({ killer, victim }: {
  killer: { name: string; ip: number };
  victim: { name: string; ip: number };
}) {
  const t = useTranslations('KillFeed');
  const totalIp = killer.ip + victim.ip;
  const killerPercent = totalIp > 0 ? (killer.ip / totalIp) * 100 : 50;
  const victimPercent = 100 - killerPercent;
  const ipDiff = killer.ip - victim.ip;
  const ipDiffPercent = victim.ip > 0 ? Math.round((ipDiff / victim.ip) * 100) : 0;

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Bar */}
      <div className="h-5 sm:h-6 bg-muted rounded-full overflow-hidden flex">
        <div
          className="bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
          style={{ width: `${killerPercent}%` }}
        />
        <div
          className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
          style={{ width: `${victimPercent}%` }}
        />
      </div>

      {/* Labels - Stacked on mobile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 shrink-0" />
          <span className="font-bold truncate flex-1 sm:flex-none">{killer.name}</span>
          <span className="font-mono text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">{Math.round(killer.ip)} IP</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <span className="font-mono text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">{Math.round(victim.ip)} IP</span>
          <span className="font-bold truncate flex-1 sm:flex-none">{victim.name}</span>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 shrink-0" />
        </div>
      </div>

      {/* IP Advantage */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
        <span className={`font-bold ${ipDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {ipDiff > 0 ? '↑' : ipDiff < 0 ? '↓' : '='} {Math.abs(ipDiffPercent)}% {t('ipAdvantage')}
        </span>
      </div>
    </div>
  );
}

function PlayerEquipment({ player, title, color, metadata, locale }: {
  player: any;
  title: string;
  color: 'green' | 'red';
  metadata?: any;
  locale: string;
}) {
  const t = useTranslations('KillFeed');
  const colorClasses = {
    green: 'border-green-500/20 bg-green-500/5',
    red: 'border-red-500/20 bg-red-500/5'
  };
  const textClasses = {
    green: 'text-green-600',
    red: 'text-red-600'
  };

  const slots: Array<{ key: keyof Equipment; label: string; row: number; col: number }> = [
    { key: 'Bag', label: t('slots.bag'), row: 1, col: 1 },
    { key: 'Head', label: t('slots.head'), row: 1, col: 2 },
    { key: 'Cape', label: t('slots.cape'), row: 1, col: 3 },
    { key: 'MainHand', label: t('slots.main'), row: 2, col: 1 },
    { key: 'Armor', label: t('slots.armor'), row: 2, col: 2 },
    { key: 'OffHand', label: t('slots.off'), row: 2, col: 3 },
    { key: 'Potion', label: t('slots.pot'), row: 3, col: 1 },
    { key: 'Shoes', label: t('slots.shoes'), row: 3, col: 2 },
    { key: 'Food', label: t('slots.food'), row: 3, col: 3 },
    { key: 'Mount', label: t('slots.mount'), row: 4, col: 2 }
  ];

  return (
    <div className={`border rounded-xl p-3 sm:p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="min-w-0 flex-1">
          <div className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider ${textClasses[color]} truncate`}>{title}</div>
          <div className="font-bold text-sm sm:text-base truncate">{player.Name}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{player.GuildName || t('noGuild')}</div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <div className="text-[9px] sm:text-xs text-muted-foreground uppercase">IP</div>
          <div className="text-lg sm:text-xl font-mono font-bold">{Math.round(player.AverageItemPower)}</div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full max-w-[160px] sm:max-w-[200px]">
          {slots.map(({ key, label, row, col }) => (
            <EquipmentSlot
              key={key}
              item={player.Equipment[key]}
              metadata={metadata}
              locale={locale}
              label={label}
              isMount={key === 'Mount'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EquipmentSlot({ item, metadata, locale, label, isMount }: {
  item: Item | null;
  metadata?: any;
  locale: string;
  label: string;
  isMount?: boolean;
}) {
  const t = useTranslations('KillFeed');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered && item && !metadata?.names?.[item.Type] && !resolvedName) {
      resolveItemNameAction(item.Type, locale as any).then(name => {
        if (name) setResolvedName(name);
      });
    }
  }, [isHovered, item, metadata, resolvedName, locale]);

  const itemName = (item?.Type && (metadata?.names?.[item.Type || ''] || resolvedName || item.Type)) || '';

  return (
    <div
      className={`aspect-square bg-black/20 rounded-lg border border-border/50 relative group ${isMount ? 'col-start-2' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {item ? (
        <>
          <ItemIcon item={item} className="h-full w-full object-contain p-0.5 sm:p-1" />
          {isHovered && itemName && (
            <div className="absolute inset-x-0 bottom-full mb-1 sm:mb-2 z-20 bg-popover border border-border rounded-lg p-1.5 sm:p-2 shadow-lg text-[10px] sm:text-xs pointer-events-none">
              <div className="font-bold truncate max-w-[120px] sm:max-w-none">{itemName}</div>
              {item.Quality > 0 && (
                <div className="text-muted-foreground">{t('quality')}: {item.Quality}</div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[9px] text-muted-foreground/30 font-bold uppercase select-none px-0.5 text-center leading-tight">
          {label}
        </div>
      )}
    </div>
  );
}

function PlayerInventory({ player, title, color, value, metadata, locale }: {
  player: any;
  title: string;
  color: 'green' | 'red';
  value: number;
  metadata?: any;
  locale: string;
}) {
  const t = useTranslations('KillFeed');
  const items = player.Inventory?.filter((i: Item | null) => i !== null) || [];

  if (items.length === 0) {
    return (
      <div className={`border rounded-xl p-6 sm:p-8 text-center ${color === 'green' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
        <Archive className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-xs sm:text-sm text-muted-foreground italic">{t('emptyInventory')}</p>
      </div>
    );
  }

  const colorClasses = {
    green: 'border-green-500/20 bg-green-500/5',
    red: 'border-red-500/20 bg-red-500/5'
  };
  const textClasses = {
    green: 'text-green-600',
    red: 'text-red-600'
  };

  return (
    <div className={`border rounded-xl p-3 sm:p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <div className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider ${textClasses[color]} flex items-center gap-1 sm:gap-2`}>
            <Archive className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {title}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">{items.length} {t('items')}</div>
        </div>
        {value > 0 && (
          <div className="text-right">
            <div className="text-[9px] sm:text-xs text-muted-foreground uppercase">{t('estValue')}</div>
            <div className={`font-mono font-bold text-sm sm:text-base ${color === 'green' ? 'text-green-500' : 'text-red-500'}`}>
              {formatCompactNumber(value)}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5 sm:gap-2">
        {items.map((item: Item, i: number) => (
          <InventoryItem
            key={i}
            item={item}
            metadata={metadata}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}

function InventoryItem({ item, metadata, locale }: {
  item: Item;
  metadata?: any;
  locale: string;
}) {
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered && item && !metadata?.names?.[item.Type] && !resolvedName) {
      resolveItemNameAction(item.Type, locale as any).then(name => {
        if (name) setResolvedName(name);
      });
    }
  }, [isHovered, item, metadata, resolvedName, locale]);

  const itemName = (item.Type && (metadata?.names?.[item.Type] || resolvedName || item.Type)) || '';

  return (
    <div
      className="aspect-square bg-black/20 rounded-lg border border-border/50 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ItemIcon item={item} className="h-full w-full object-contain p-0.5 sm:p-1" />
      <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] sm:text-[9px] text-white px-0.5 sm:px-1 rounded">
        {item.Count}
      </div>
      {isHovered && itemName && (
        <div className="absolute inset-x-0 bottom-full mb-1 sm:mb-2 z-20 bg-popover border border-border rounded-lg p-1.5 sm:p-2 shadow-lg text-[10px] sm:text-xs min-w-[100px] sm:min-w-[120px] pointer-events-none">
          <div className="font-bold truncate max-w-[100px] sm:max-w-none">{itemName}</div>
          <div className="text-muted-foreground">x{item.Count}</div>
        </div>
      )}
    </div>
  );
}

function ParticipantCard({ participant, metadata, locale }: {
  participant: Participant;
  metadata?: any;
  locale: string;
}) {
  const t = useTranslations('KillFeed');
  const hasDamage = participant.DamageDone > 0;
  const hasHealing = participant.SupportHealingDone > 0;

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-card border border-border rounded-lg sm:rounded-xl hover:border-primary/30 transition-colors">
      <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 bg-black/20 rounded-lg overflow-hidden">
        <ItemIcon item={participant.Equipment.MainHand} className="h-full w-full object-contain p-1" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-xs sm:text-sm truncate">{participant.Name}</div>
        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{participant.GuildName || t('noGuild')}</div>
        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs mt-1">
          {hasDamage && (
            <span className="text-red-400 font-mono font-bold flex items-center gap-0.5 sm:gap-1">
              <Sword className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {Math.round(participant.DamageDone)}
            </span>
          )}
          {hasHealing && (
            <span className="text-green-400 font-mono font-bold flex items-center gap-0.5 sm:gap-1">
              <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {Math.round(participant.SupportHealingDone)}
            </span>
          )}
          {!hasDamage && !hasHealing && (
            <span className="text-muted-foreground">{participant.AverageItemPower} IP</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CombatAnalysis({ event, killStyle, totalLoss }: {
  event: Event;
  killStyle: any;
  totalLoss: number;
}) {
  const t = useTranslations('KillFeed');
  const killerIp = event.Killer.AverageItemPower;
  const victimIp = event.Victim.AverageItemPower;
  const ipDiff = killerIp - victimIp;
  const ipDiffPercent = victimIp > 0 ? Math.round((ipDiff / victimIp) * 100) : 0;
  const ipDiffRounded = Math.round(Math.abs(ipDiff));
  const participantCount = event.Participants.length;

  const topDamager = useMemo(() => {
    if (event.Participants.length === 0) return null;
    return [...event.Participants].sort((a, b) => b.DamageDone - a.DamageDone)[0];
  }, [event.Participants]);

  const topHealer = useMemo(() => {
    if (event.Participants.length === 0) return null;
    return [...event.Participants].sort((a, b) => b.SupportHealingDone - a.SupportHealingDone)[0];
  }, [event.Participants]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Kill Type Analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-card border border-border p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-bold">{t('killTypeAnalysis')}</span>
          </div>
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('type')}</span>
              <span className={`font-bold ${killStyle.color}`}>{killStyle.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('participants')}</span>
              <span className="font-mono">{participantCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('totalLoss')}</span>
              <span className="font-mono text-red-500">{formatCompactNumber(totalLoss)}</span>
            </div>
          </div>
        </div>

        {/* IP Advantage */}
        <div className="bg-card border border-border p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-bold">{t('ipAdvantage')}</span>
          </div>
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground truncate">{event.Killer.Name}</span>
              <span className="font-mono whitespace-nowrap">{Math.round(killerIp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground truncate">{event.Victim.Name}</span>
              <span className="font-mono whitespace-nowrap">{Math.round(victimIp)}</span>
            </div>
            <div className="pt-1.5 sm:pt-2 border-t border-border">
              <div className={`text-center font-bold text-[11px] sm:text-xs ${ipDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {ipDiff > 0 ? '↑' : ipDiff < 0 ? '↓' : '='} {ipDiffRounded} ({ipDiffPercent}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      {(topDamager || topHealer) && (
        <div className="bg-card border border-border p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Swords className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-bold">{t('topPerformers')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {topDamager && (
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/10 shrink-0">
                  <Sword className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] sm:text-xs text-muted-foreground uppercase">{t('topDamager')}</div>
                  <div className="font-bold text-xs sm:text-sm truncate">{topDamager.Name}</div>
                  <div className="text-[10px] sm:text-xs text-red-400 font-mono">{Math.round(topDamager.DamageDone)} {t('damage')}</div>
                </div>
              </div>
            )}
            {topHealer && (
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 shrink-0">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] sm:text-xs text-muted-foreground uppercase">{t('topHealer')}</div>
                  <div className="font-bold text-xs sm:text-sm truncate">{topHealer.Name}</div>
                  <div className="text-[10px] sm:text-xs text-green-400 font-mono">{Math.round(topHealer.SupportHealingDone)} {t('healing')}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, isExpanded, onToggle, children }: {
  title: string;
  icon: any;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-card hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <span className="font-bold text-sm sm:text-base truncate">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 ml-2" />
        )}
      </button>
      {isExpanded && (
        <div className="p-3 sm:p-4 border-t border-border bg-card/50">
          {children}
        </div>
      )}
    </div>
  );
}

function formatCompactNumber(num: number) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}
