'use client';

import { useTranslations } from 'next-intl';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import {
  Pickaxe,
  MapPin,
  Shield,
  Skull,
  TrendingUp,
  AlertCircle,
  Clock,
  Coins,
  Leaf,
  Flame,
  Droplets,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface GatheringZone {
  id: string;
  name: string;
  tier: string;
  risk: 'safe' | 'medium' | 'high' | 'extreme';
  resources: string[];
  silverPerHour: string;
  bestFor: string[];
  tips: string[];
  icon: any;
}

export default function GatheringRoutesClient() {
  const t = useTranslations('GatheringRoutes');

  const GATHERING_ZONES: GatheringZone[] = [
    {
      id: 'royal-cities',
      name: t('zones.royal.name'),
      tier: 'T3-T5',
      risk: 'safe',
      resources: [t('zones.royal.resources.0'), t('zones.royal.resources.1'), t('zones.royal.resources.2'), t('zones.royal.resources.3'), t('zones.royal.resources.4')],
      silverPerHour: t('zones.royal.silver'),
      bestFor: [t('zones.royal.best.0'), t('zones.royal.best.1'), t('zones.royal.best.2')],
      tips: [t('zones.royal.tips.0'), t('zones.royal.tips.1'), t('zones.royal.tips.2'), t('zones.royal.tips.3')],
      icon: Shield
    },
    {
      id: 'yellow-zone',
      name: t('zones.yellow.name'),
      tier: 'T4-T6',
      risk: 'medium',
      resources: [t('zones.yellow.resources.0'), t('zones.yellow.resources.1')],
      silverPerHour: t('zones.yellow.silver'),
      bestFor: [t('zones.yellow.best.0'), t('zones.yellow.best.1')],
      tips: [t('zones.yellow.tips.0'), t('zones.yellow.tips.1'), t('zones.yellow.tips.2'), t('zones.yellow.tips.3')],
      icon: AlertCircle
    },
    {
      id: 'red-zone',
      name: t('zones.red.name'),
      tier: 'T5-T7',
      risk: 'high',
      resources: [t('zones.red.resources.0'), t('zones.red.resources.1')],
      silverPerHour: t('zones.red.silver'),
      bestFor: [t('zones.red.best.0'), t('zones.red.best.1')],
      tips: [t('zones.red.tips.0'), t('zones.red.tips.1'), t('zones.red.tips.2'), t('zones.red.tips.3'), t('zones.red.tips.4')],
      icon: Skull
    },
    {
      id: 'black-zone',
      name: t('zones.black.name'),
      tier: 'T6-T8',
      risk: 'extreme',
      resources: [t('zones.black.resources.0'), t('zones.black.resources.1'), t('zones.black.resources.2')],
      silverPerHour: t('zones.black.silver'),
      bestFor: [t('zones.black.best.0'), t('zones.black.best.1'), t('zones.black.best.2')],
      tips: [t('zones.black.tips.0'), t('zones.black.tips.1'), t('zones.black.tips.2'), t('zones.black.tips.3'), t('zones.black.tips.4')],
      icon: Pickaxe
    },
    {
      id: 'mists',
      name: t('zones.mists.name'),
      tier: 'T4-T8',
      risk: 'medium',
      resources: [t('zones.mists.resources.0'), t('zones.mists.resources.1')],
      silverPerHour: t('zones.mists.silver'),
      bestFor: [t('zones.mists.best.0'), t('zones.mists.best.1')],
      tips: [t('zones.mists.tips.0'), t('zones.mists.tips.1'), t('zones.mists.tips.2'), t('zones.mists.tips.3')],
      icon: MapPin
    },
    {
      id: 'avalon',
      name: t('zones.avalon.name'),
      tier: 'T5-T7',
      risk: 'high',
      resources: [t('zones.avalon.resources.0'), t('zones.avalon.resources.1')],
      silverPerHour: t('zones.avalon.silver'),
      bestFor: [t('zones.avalon.best.0'), t('zones.avalon.best.1')],
      tips: [t('zones.avalon.tips.0'), t('zones.avalon.tips.1'), t('zones.avalon.tips.2'), t('zones.avalon.tips.3')],
      icon: Flame
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'safe': return 'text-success bg-success/10 border-success/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'extreme': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <PageShell
      title={t('title')}
      description={t('description')}
      backgroundImage='/background/ao-player.jpg'
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-info/10 border border-info/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-info mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-info mb-1">{t('focusTitle')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('focusDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Resource Type Quick Guide */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Leaf className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="font-bold text-foreground text-sm">{t('fiber')}</div>
            <div className="text-xs text-muted-foreground">{t('clothArmor')}</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Shield className="h-8 w-8 text-info mx-auto mb-2" />
            <div className="font-bold text-foreground text-sm">{t('hide')}</div>
            <div className="text-xs text-muted-foreground">{t('leatherArmor')}</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Pickaxe className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <div className="font-bold text-foreground text-sm">{t('ore')}</div>
            <div className="text-xs text-muted-foreground">{t('plateArmor')}</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <MapPin className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-foreground text-sm">{t('wood')}</div>
            <div className="text-xs text-muted-foreground">{t('bowsCrossbows')}</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Droplets className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="font-bold text-foreground text-sm">{t('stone')}</div>
            <div className="text-xs text-muted-foreground">{t('tools')}</div>
          </div>
        </div>

        {/* Zones Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">{t('gatheringZones')}</h2>

          {GATHERING_ZONES.map((zone) => {
            const Icon = zone.icon;
            return (
              <div
                key={zone.id}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{zone.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{zone.tier}</Badge>
                          <Badge className={getRiskColor(zone.risk)}>
                            {t(zone.risk)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{t('silverPerHour')}</div>
                      <div className="text-lg font-bold text-success">{zone.silverPerHour}</div>
                    </div>
                  </div>

                  {/* Resources */}
                  <div className="mb-4">
                    <div className="text-sm font-bold text-muted-foreground mb-2">{t('resources')}:</div>
                    <div className="flex flex-wrap gap-2">
                      {zone.resources.map((resource, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Best For */}
                    <div>
                      <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        {t('bestFor')}
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {zone.bestFor.map((use, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            {use}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tips */}
                    <div>
                      <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-info" />
                        {t('tips')}
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {zone.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-info">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Focus Point Guide */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{t('focusGuideTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('focusGuideDesc')}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card/50 rounded-xl p-4 border border-border">
              <div className="text-sm text-muted-foreground mb-1">{t('dailyFocus')}</div>
              <div className="font-bold text-foreground">10,000</div>
              <div className="text-xs text-muted-foreground mt-1">{t('baseAmount')}</div>
            </div>
            <div className="bg-card/50 rounded-xl p-4 border border-border">
              <div className="text-sm text-muted-foreground mb-1">{t('premiumBonus')}</div>
              <div className="font-bold text-amber-500">+50%</div>
              <div className="text-xs text-muted-foreground mt-1">{t('withPremium')}</div>
            </div>
            <div className="bg-card/50 rounded-xl p-4 border border-border">
              <div className="text-sm text-muted-foreground mb-1">{t('focusYield')}</div>
              <div className="font-bold text-success">+50%</div>
              <div className="text-xs text-muted-foreground mt-1">{t('resourceYield')}</div>
            </div>
          </div>
        </div>

        <InfoStrip currentPage="home" />
      </div>
    </PageShell>
  );
}
