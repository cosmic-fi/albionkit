'use client';

import { useTranslations } from 'next-intl';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import {
  Shield,
  Sword,
  Target,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Eye,
  Users,
  Zap
} from 'lucide-react';

export default function CombatPositioningClient() {
  const t = useTranslations('CombatPositioning');

  return (
    <PageShell
      title={t('title')}
      description={t('description')}
      backgroundImage='/background/ao-player.jpg'
    >
      <div className="space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('heroTitle')}
              </h1>
              <p className="text-muted-foreground">
                {t('heroSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Core Principles */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-success/10">
                <Eye className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-bold text-foreground">{t('visionTitle')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t('visionDesc')}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{t('visionTip1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{t('visionTip2')}</span>
              </li>
            </ul>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <Target className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-bold text-foreground">{t('rangeTitle')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t('rangeDesc')}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{t('rangeTip1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{t('rangeTip2')}</span>
              </li>
            </ul>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-info/10">
                <Users className="h-6 w-6 text-info" />
              </div>
              <h3 className="font-bold text-foreground">{t('teamworkTitle')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t('teamworkDesc')}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{t('teamworkTip1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{t('teamworkTip2')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Role-Based Positioning */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">{t('rolePositioning')}</h2>

          {/* Tank */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{t('tankRole')}</h3>
                <p className="text-sm text-muted-foreground">{t('tankDesc')}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-success/5 rounded-lg p-4 border border-success/20">
                <h4 className="font-bold text-success mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('doTitle')}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t('tankDo1')}</li>
                  <li>• {t('tankDo2')}</li>
                  <li>• {t('tankDo3')}</li>
                </ul>
              </div>
              <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
                <h4 className="font-bold text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('dontTitle')}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t('tankDont1')}</li>
                  <li>• {t('tankDont2')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* DPS */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <Sword className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{t('dpsRole')}</h3>
                <p className="text-sm text-muted-foreground">{t('dpsDesc')}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-success/5 rounded-lg p-4 border border-success/20">
                <h4 className="font-bold text-success mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('doTitle')}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t('dpsDo1')}</li>
                  <li>• {t('dpsDo2')}</li>
                  <li>• {t('dpsDo3')}</li>
                </ul>
              </div>
              <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
                <h4 className="font-bold text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('dontTitle')}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t('dpsDont1')}</li>
                  <li>• {t('dpsDont2')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Healer */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-info/10">
                <Zap className="h-6 w-6 text-info" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{t('healerRole')}</h3>
                <p className="text-sm text-muted-foreground">{t('healerDesc')}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-success/5 rounded-lg p-4 border border-success/20">
                <h4 className="font-bold text-success mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('doTitle')}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t('healerDo1')}</li>
                  <li>• {t('healerDo2')}</li>
                  <li>• {t('healerDo3')}</li>
                </ul>
              </div>
              <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
                <h4 className="font-bold text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('dontTitle')}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t('healerDont1')}</li>
                  <li>• {t('healerDont2')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Common Mistakes */}
        <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <h2 className="text-xl font-bold text-foreground">{t('commonMistakes')}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground mb-1">{t('mistake1Title')}</h4>
                <p className="text-sm text-muted-foreground">{t('mistake1Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground mb-1">{t('mistake2Title')}</h4>
                <p className="text-sm text-muted-foreground">{t('mistake2Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground mb-1">{t('mistake3Title')}</h4>
                <p className="text-sm text-muted-foreground">{t('mistake3Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground mb-1">{t('mistake4Title')}</h4>
                <p className="text-sm text-muted-foreground">{t('mistake4Desc')}</p>
              </div>
            </div>
          </div>
        </div>

        <InfoStrip currentPage="home" />
      </div>
    </PageShell>
  );
}
