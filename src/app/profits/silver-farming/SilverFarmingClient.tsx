'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import {
  Coins,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Crown,
  Sword,
  Skull,
  Flame,
  Pickaxe,
  Leaf,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface SilverActivity {
  id: string;
  name: string;
  silverPerHour: string;
  timeRequired: string;
  premiumRequired: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'dungeon' | 'open-world' | 'pvp' | 'gathering' | 'other';
  description: string;
  icon: any;
}

export default function SilverFarmingClient() {
  const t = useTranslations('SilverFarming');

  const SILVER_ACTIVITIES: SilverActivity[] = [
    {
      id: 'crystal-spiders',
      name: t('activities.spiders.name'),
      silverPerHour: t('activities.spiders.silver'),
      timeRequired: t('activities.spiders.time'),
      premiumRequired: false,
      difficulty: 'medium',
      category: 'open-world',
      description: t('activities.spiders.desc'),
      icon: Flame
    },
    {
      id: 'static-dungeons',
      name: t('activities.static.name'),
      silverPerHour: t('activities.static.silver'),
      timeRequired: t('activities.static.time'),
      premiumRequired: false,
      difficulty: 'easy',
      category: 'dungeon',
      description: t('activities.static.desc'),
      icon: Skull
    },
    {
      id: 'hellgates',
      name: t('activities.hellgates.name'),
      silverPerHour: t('activities.hellgates.silver'),
      timeRequired: t('activities.hellgates.time'),
      premiumRequired: false,
      difficulty: 'hard',
      category: 'pvp',
      description: t('activities.hellgates.desc'),
      icon: Sword
    },
    {
      id: 'corrupted-dungeons',
      name: t('activities.corrupted.name'),
      silverPerHour: t('activities.corrupted.silver'),
      timeRequired: t('activities.corrupted.time'),
      premiumRequired: false,
      difficulty: 'medium',
      category: 'dungeon',
      description: t('activities.corrupted.desc'),
      icon: Shield
    },
    {
      id: 'faction-warfare',
      name: t('activities.faction.name'),
      silverPerHour: t('activities.faction.silver'),
      timeRequired: t('activities.faction.time'),
      premiumRequired: false,
      difficulty: 'medium',
      category: 'pvp',
      description: t('activities.faction.desc'),
      icon: Target
    },
    {
      id: 'gathering-crystal',
      name: t('activities.crystal.name'),
      silverPerHour: t('activities.crystal.silver'),
      timeRequired: t('activities.crystal.time'),
      premiumRequired: false,
      difficulty: 'easy',
      category: 'gathering',
      description: t('activities.crystal.desc'),
      icon: Pickaxe
    },
    {
      id: 'farming-fiber',
      name: t('activities.fiber.name'),
      silverPerHour: t('activities.fiber.silver'),
      timeRequired: t('activities.fiber.time'),
      premiumRequired: false,
      difficulty: 'easy',
      category: 'gathering',
      description: t('activities.fiber.desc'),
      icon: Leaf
    },
    {
      id: 'laborers',
      name: t('activities.laborers.name'),
      silverPerHour: t('activities.laborers.silver'),
      timeRequired: t('activities.laborers.time'),
      premiumRequired: true,
      difficulty: 'easy',
      category: 'other',
      description: t('activities.laborers.desc'),
      icon: Coins
    }
  ];
  const [filter, setFilter] = useState<'all' | 'premium' | 'free'>('all');
  const [sortBy, setSortBy] = useState<'silver' | 'time' | 'difficulty'>('silver');

  const filteredActivities = useMemo(() => {
    let result = [...SILVER_ACTIVITIES];

    // Filter by premium status
    if (filter === 'free') {
      result = result.filter(a => !a.premiumRequired);
    } else if (filter === 'premium') {
      result = result.filter(a => a.premiumRequired);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'silver') {
        const aSilver = parseInt(a.silverPerHour.replace(/[^0-9]/g, '').split(' ')[0]) || 0;
        const bSilver = parseInt(b.silverPerHour.replace(/[^0-9]/g, '').split(' ')[0]) || 0;
        return bSilver - aSilver;
      } else if (sortBy === 'time') {
        return parseInt(a.timeRequired) - parseInt(b.timeRequired);
      } else {
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      }
    });

    return result;
  }, [filter, sortBy]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-success bg-success/10 border-success/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'hard': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getCategoryIcon = (icon: any) => {
    const Icon = icon;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <PageShell
      title={t('title')}
      description={t('description')}
      backgroundImage='/background/ao-player.jpg'
      headerActions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Coins className="h-3 w-3" />
            {t('updatedDaily')}
          </Badge>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-info/10 border border-info/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-info mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-info mb-1">{t('dailyTipTitle')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('dailyTipDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Premium vs Free Comparison */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{t('freeActivities')}</h3>
                <p className="text-xs text-muted-foreground">{t('noPremiumNeeded')}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('avgSilverPerHour')}</span>
                <span className="font-bold text-success">300k - 1M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('activitiesCount')}</span>
                <span className="font-bold">7+</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{t('premiumActivities')}</h3>
                <p className="text-xs text-muted-foreground">{t('premiumNeeded')}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('avgSilverPerHour')}</span>
                <span className="font-bold text-amber-500">400k - 1.5M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('activitiesCount')}</span>
                <span className="font-bold">3+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-muted-foreground">{t('filter')}:</span>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              {t('all')}
            </Button>
            <Button
              variant={filter === 'free' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('free')}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {t('freeOnly')}
            </Button>
            <Button
              variant={filter === 'premium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('premium')}
            >
              <Crown className="h-4 w-4 mr-1" />
              {t('premiumOnly')}
            </Button>

            <div className="flex-1" />

            <span className="text-sm font-bold text-muted-foreground">{t('sortBy')}:</span>
            <Button
              variant={sortBy === 'silver' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('silver')}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              {t('silverPerHour')}
            </Button>
            <Button
              variant={sortBy === 'time' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('time')}
            >
              <Clock className="h-4 w-4 mr-1" />
              {t('time')}
            </Button>
            <Button
              variant={sortBy === 'difficulty' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('difficulty')}
            >
              <Target className="h-4 w-4 mr-1" />
              {t('difficulty')}
            </Button>
          </div>
        </div>

        {/* Activities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className={getDifficultyColor(activity.difficulty)}>
                    {t(activity.difficulty)}
                  </Badge>
                </div>

                <h3 className="font-bold text-foreground mb-2">{activity.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {activity.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('silverPerHourLabel')}</span>
                    <span className="font-bold text-success">{activity.silverPerHour}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('timeRequired')}</span>
                    <span className="font-medium">{activity.timeRequired}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('premium')}</span>
                    <span className={activity.premiumRequired ? 'text-amber-500 font-bold' : 'text-success font-bold'}>
                      {activity.premiumRequired ? t('yes') : t('no')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Focus Point Optimization */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('focusOptimization')}</h3>
              <p className="text-xs text-muted-foreground">{t('focusOptimizationDesc')}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card/50 rounded-xl p-4 border border-border">
              <div className="text-sm text-muted-foreground mb-1">{t('bestForFocus')}</div>
              <div className="font-bold text-foreground">Crystal Spiders</div>
              <div className="text-xs text-success mt-1">{t('highestReturn')}</div>
            </div>
            <div className="bg-card/50 rounded-xl p-4 border border-border">
              <div className="text-sm text-muted-foreground mb-1">{t('dailyFocus')}</div>
              <div className="font-bold text-foreground">10,000</div>
              <div className="text-xs text-muted-foreground mt-1">{t('focusPerDay')}</div>
            </div>
            <div className="bg-card/50 rounded-xl p-4 border border-border">
              <div className="text-sm text-muted-foreground mb-1">{t('premiumBonus')}</div>
              <div className="font-bold text-foreground">+50%</div>
              <div className="text-xs text-amber-500 mt-1">{t('withPremium')}</div>
            </div>
          </div>
        </div>

        <InfoStrip currentPage="profits" />
      </div>
    </PageShell>
  );
}
