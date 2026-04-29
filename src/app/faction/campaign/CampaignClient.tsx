'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageShell } from '@/components/PageShell';
import { Target, Calendar, TrendingUp, Trophy, Info, Shield, Activity } from 'lucide-react';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import { CampaignProgressBar } from '@/components/faction/CampaignProgressBar';
import { PaceMetricsCard } from '@/components/faction/PaceMetricsCard';

const getTiers = (t: any) => [
  { value: 10000, label: `${t('tier1')} (10,000)` },
  { value: 30000, label: `${t('tier2')} (30,000)` },
  { value: 75000, label: `${t('tier3')} (75,000)` },
  { value: 150000, label: `${t('tier4')} (150,000)` },
  { value: 300000, label: `${t('tier5')} (300,000)` },
  { value: 600000, label: `${t('tier6')} (600,000)` },
  { value: 1000000, label: `${t('monthlyChest')} (1,000,000)` },
];

export default function CampaignClient() {
  const t = useTranslations('FactionTools.campaign');
  const [currentPoints, setCurrentPoints] = useState<number>(0);
  const [targetGoal, setTargetGoal] = useState<number>(1000000);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedPoints = localStorage.getItem('faction_campaign_points');
    const savedGoal = localStorage.getItem('faction_campaign_goal');

    if (savedPoints) setCurrentPoints(parseInt(savedPoints, 10));
    if (savedGoal) setTargetGoal(parseInt(savedGoal, 10));
  }, []);

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value) || 0);
    setCurrentPoints(val);
    localStorage.setItem('faction_campaign_points', val.toString());
  };

  const handleGoalChange = (val: number) => {
    setTargetGoal(val);
    localStorage.setItem('faction_campaign_goal', val.toString());
  };

  // Date and Time calculations (UTC)
  const now = new Date();
  const currentUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes()));
  const eomUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

  const msLeft = eomUTC.getTime() - currentUTC.getTime();
  const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const currentDay = now.getUTCDate();

  // Metrics
  const pointsRemaining = Math.max(0, targetGoal - currentPoints);
  const pointsPerDay = Math.ceil(pointsRemaining / daysLeft);
  const pointsPerWeek = pointsPerDay * 7;

  const currentPercent = Math.min(100, (currentPoints / targetGoal) * 100);
  const expectedProgress = (targetGoal / daysInMonth) * currentDay;
  const expectedPercent = Math.min(100, (expectedProgress / targetGoal) * 100);

  const isAheadOfPace = currentPercent >= expectedPercent;

  if (!isClient) return null; // Prevent hydration mismatch for dynamic dates

  return (
    <PageShell
      title={t('title')}
      description={t('subtitle')}
      backgroundImage='/background/ak-factions.jpeg'

      icon={<Target className="w-6 h-6 text-primary" />}
      stats={[
        {
          label: t('remaining'),
          value: pointsRemaining.toLocaleString(),
          icon: <Trophy className="w-4 h-4 text-primary" />,
        },
        {
          label: t('daysLeft'),
          value: daysLeft.toString(),
          icon: <Calendar className="w-4 h-4 text-primary" />,
        },
        {
          label: t('required'),
          value: pointsPerDay.toLocaleString(),
          icon: <TrendingUp className="w-4 h-4 text-primary" />,
          trend: isAheadOfPace ? 'up' : 'down'
        }
      ]}
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-center">
            <NumberInput
              label={<span className="text-sm font-semibold text-muted-foreground">{t('current')}</span>}
              min={0}
              step={1000}
              value={currentPoints}
              onChange={(val) => {
                const newVal = Math.max(0, val);
                setCurrentPoints(newVal);
                localStorage.setItem('faction_campaign_points', newVal.toString());
              }}
              className="text-lg font-mono font-bold bg-muted/50 border-transparent focus-within:border-primary"
            />
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <label className="text-sm font-semibold text-muted-foreground">{t('goal')}</label>
            <Select
              value={targetGoal}
              onChange={(val) => handleGoalChange(val as number)}
              options={getTiers(t)}
              className="text-sm font-normal py-3 bg-muted/50 border-transparent"
            />
          </div>
        </div>

        {/* Progress Visualization */}
        <CampaignProgressBar
          currentPoints={currentPoints}
          targetGoal={targetGoal}
          currentPercent={currentPercent}
          expectedPercent={expectedPercent}
          isAheadOfPace={isAheadOfPace}
        />

        {/* Pacing Details */}
        <PaceMetricsCard
          pointsPerDay={pointsPerDay}
          pointsPerWeek={pointsPerWeek}
          daysLeft={daysLeft}
          isCompleted={currentPoints >= targetGoal}
        />

        {/* SEO Info Strip */}
        <InfoStrip currentPage="faction-campaign">
          <InfoBanner title={t('proTip')} icon={<Info className="h-5 w-5" />} color="text-blue-500">
            {t('proTipDesc')}
          </InfoBanner>
          <InfoBanner title={t('whatIs')} icon={<Shield className="h-5 w-5" />} color="text-primary">
            {t('whatIsDesc')}
          </InfoBanner>
        </InfoStrip>

      </div>
    </PageShell>
  );
}
