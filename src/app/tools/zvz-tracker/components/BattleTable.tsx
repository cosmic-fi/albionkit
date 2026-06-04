'use client';

import { Swords, ChevronDown, ChevronUp } from 'lucide-react';
import type { Battle } from '../types';
import { BattleRow } from './BattleRow';
import { Pagination } from '@/components/ui/Pagination';
import { Preloader } from '@/components/Preloader';

interface Props {
  battles: Battle[];
  liveBattles: Battle[];
  expandedBattleId: number | null;
  onExpandBattle: (battleId: number) => void;
  onCopyLink: (battleId: number) => void;
  isLive: (battle: Battle) => boolean;
  formatTimeAgo: (date: string) => string;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  t: (key: string) => string;
}

export function BattleTable({
  battles,
  liveBattles,
  expandedBattleId,
  onExpandBattle,
  onCopyLink,
  isLive,
  formatTimeAgo,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  t
}: Props) {
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-card/50 rounded-2xl border border-border/50">
        <div className="flex flex-col items-center gap-4">
        <Preloader size="lg" showText text={t('loadingBattles')} />
        </div>
      </div>
    );
  }

  if (battles.length === 0 && liveBattles.length === 0) {
    return (
      <div className="bg-card/50 rounded-2xl border border-border/50 p-12 text-center">
        <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-bold text-foreground">{t('noBattlesFound')}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('tryAdjustingFilters')}</p>
      </div>
    );
  }

  const start = Math.min((currentPage - 1) * 15 + 1, battles.length);
  const end = Math.min(currentPage * 15, battles.length);

  return (
    <div className="space-y-6 animate-fade-in-up delay-150">
      {/* Live Battles Section */}
      {liveBattles.length > 0 && (
        <LiveBattlesSection
          liveBattles={liveBattles}
          expandedBattleId={expandedBattleId}
          onExpandBattle={onExpandBattle}
          onCopyLink={onCopyLink}
          isLive={isLive}
          formatTimeAgo={formatTimeAgo}
          t={t}
        />
      )}

      {/* Past Battles Table */}
      <div className="bg-card/50 rounded-2xl border border-border/50 overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-bold text-foreground">{t('battleHistory')}</h3>
          <p className="text-xs text-muted-foreground mt-1">{battles.length} {t('battlesFound')}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground">{t('battle')}</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground">{t('time')}</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground">{t('kills')}</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground">{t('fame')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {battles.map((battle) => (
                <BattleRow
                  key={battle.id}
                  battle={battle}
                  isExpanded={expandedBattleId === battle.id}
                  onExpand={() => onExpandBattle(battle.id)}
                  isLive={isLive(battle)}
                  onCopyLink={() => onCopyLink(battle.id)}
                  formatTimeAgo={formatTimeAgo}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Mobile Responsive */}
        {totalPages > 1 && (
          <div className="p-4 sm:p-6 border-t border-border/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Showing <span className="font-bold text-foreground">{start}</span>-<span className="font-bold text-foreground">{end}</span> of <span className="font-bold text-foreground">{battles.length}</span> battles
              </div>
              <div className="flex items-center gap-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveBattlesSection({
  liveBattles,
  expandedBattleId,
  onExpandBattle,
  onCopyLink,
  isLive,
  formatTimeAgo,
  t
}: any) {
  return (
    <div className="bg-card/50 rounded-2xl border border-destructive/30 overflow-hidden animate-fade-in-up">
      <div className="p-6 border-b border-destructive/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-destructive/10">
            <Swords className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">{t('liveBattlesTitle')}</h3>
              <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full animate-pulse">
                {t('live')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{liveBattles.length} {t('battlesInProgress')}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground">{t('battle')}</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground">{t('time')}</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground">{t('kills')}</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground">{t('fame')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {liveBattles.map((battle: any) => (
              <BattleRow
                key={battle.id}
                battle={battle}
                isExpanded={expandedBattleId === battle.id}
                onExpand={() => onExpandBattle(battle.id)}
                isLive={true}
                onCopyLink={() => onCopyLink(battle.id)}
                formatTimeAgo={formatTimeAgo}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
