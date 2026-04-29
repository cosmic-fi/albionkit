'use client';

import React, { useState, useEffect } from 'react';
import { useServer } from '@/hooks/useServer';
import { ServerSelector } from '@/components/ServerSelector';
import { BanditTrackerCard } from '@/components/faction/BanditTrackerCard';
import { BanditScheduleList } from '@/components/faction/BanditScheduleList';
import { BanditReminder } from '@/components/faction/BanditReminder';
import { useTranslations } from 'next-intl';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import { Clock, Info, Shield, Bell, Calendar, Activity } from 'lucide-react';
import { getNextWindow } from '@/lib/bandit-service';

export default function BanditTrackerClient() {
  const { server, setServer } = useServer('west');
  const t = useTranslations('BanditTrackerPage');
  const tBandit = useTranslations('FactionTools.bandit');

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderLeadTime, setReminderLeadTime] = useState(10);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [now, setNow] = useState(new Date());

  // Keep time updated for header stats
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { window: nextWin } = getNextWindow(server, now);

  return (
    <PageShell
      title={t('title')}
      description={t('description')}
      backgroundImage='/background/ak-factions.jpeg'
      headerActions={
        <ServerSelector
          selectedServer={server}
          onServerChange={setServer}
          size="sm"
        />
      }
      stats={[
        {
          label: tBandit('serverTime'),
          value: <span suppressHydrationWarning>{`${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`}</span>,
          icon: <Clock className="h-4 w-4 text-primary" />
        },
        {
          label: tBandit('nextWindowLabel'),
          value: `${nextWin.utcHour}:00`,
          icon: <Calendar className="h-4 w-4 text-primary" />
        },
        {
          label: tBandit('chanceLabel'),
          value: `${Math.round(nextWin.chance * 100)}%`,
          icon: <Shield className="h-4 w-4 text-primary" />,
          trend: nextWin.chance >= 0.6 ? 'up' : nextWin.chance >= 0.4 ? 'neutral' : 'down'
        }
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <BanditTrackerCard
            region={server}
            reminderEnabled={reminderEnabled}
            reminderLeadTime={reminderLeadTime}
          />

          <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-blue-500 text-sm uppercase tracking-wider mb-1">{tBandit('proTip')}</p>
              <p className="text-blue-500/80 text-sm leading-relaxed">
                {tBandit('proTipDesc')}
              </p>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none bg-card/50 border border-border p-8 rounded-3xl">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              {tBandit('whatIs')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {tBandit('whatIsDesc1')}
                </p>
                <p className="text-muted-foreground leading-relaxed font-medium text-foreground italic border-l-2 border-primary pl-4">
                  "{tBandit('whatIsDesc2')}"
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                  <Activity className="h-5 w-5 text-primary" />
                  {tBandit('howWorks')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {tBandit('howWorksDesc')}
                </p>
              </div>
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-bold">{tBandit('triggerProbabilities')}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tBandit('triggerProbDesc')}
                </p>
                <div className="p-3 bg-muted/50 rounded-xl border border-border flex items-center gap-3 text-xs text-muted-foreground mt-4">
                  <Clock className="h-4 w-4 text-primary" />
                  {tBandit('timezoneNote')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-2">
              <Bell className="h-4 w-4" />
              {tBandit('notificationSettings')}
            </h3>
            <BanditReminder
              onReminderChange={(enabled, leadTime) => {
                setReminderEnabled(enabled);
                setReminderLeadTime(leadTime);
              }}
              onAudioChange={setAudioEnabled}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-2">
              <Calendar className="h-4 w-4" />
              {tBandit('dailySchedule')}
            </h3>
            <BanditScheduleList region={server} />
          </div>
        </div>
      </div>

      <InfoStrip currentPage="faction-bandit" />
    </PageShell>
  );
}
