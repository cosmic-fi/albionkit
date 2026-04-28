'use client';

import React, { useState } from 'react';
import { useServer } from '@/hooks/useServer';
import { ServerSelector } from '@/components/ServerSelector';
import { BanditTrackerCard } from '@/components/faction/BanditTrackerCard';
import { BanditScheduleList } from '@/components/faction/BanditScheduleList';
import { BanditReminder } from '@/components/faction/BanditReminder';
import { useTranslations } from 'next-intl';

export default function BanditTrackerClient() {
  const { server, setServer } = useServer('west');
  const t = useTranslations('BanditTrackerPage');
  
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderLeadTime, setReminderLeadTime] = useState(10);
  const [audioEnabled, setAudioEnabled] = useState(true);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Select Game Server</span>
            <ServerSelector 
              selectedServer={server} 
              onServerChange={setServer} 
              size="md"
            />
          </div>

          <div className="w-full space-y-4">
            <BanditTrackerCard 
              region={server} 
              reminderEnabled={reminderEnabled}
              reminderLeadTime={reminderLeadTime}
            />
            
            <BanditReminder 
              onReminderChange={(enabled, leadTime) => {
                setReminderEnabled(enabled);
                setReminderLeadTime(leadTime);
              }}
              onAudioChange={setAudioEnabled}
            />
          </div>

          <div className="w-full max-w-md bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-sm text-blue-500 text-center">
            <p className="font-medium">Pro Tip:</p>
            <p>Bandit Assault triggers within a 1-hour roll window. Each window has a specific probability based on historical game data.</p>
          </div>

          <BanditScheduleList region={server} />
        </div>

        <div className="mt-12 prose dark:prose-invert max-w-none border-t border-border pt-8">
          <h2 className="text-2xl font-bold mb-4">What is Bandit Assault?</h2>
          <p>
            Bandit Assault is a major Faction Warfare event in the Red Zones of the Royal Continent. 
            During the event, Caerleon takes control of all outposts, and factions must fight to capture them back.
          </p>
          <p>
            This event is highly profitable for Faction Points and is also a strategic window for heart transports, 
            as many PKs (Player Killers) are distracted by the faction blobs.
          </p>
          <h3 className="text-xl font-bold mt-6 mb-2">Trigger Probabilities</h3>
          <p>
            Albion Online uses a rolling system for Bandit Assaults. Every few hours, there's a "roll" to see if an 
            assault starts. Our tracker uses the community-sourced probability percentages to show you when an 
            event is most likely to begin.
          </p>
        </div>
      </div>
    </div>
  );
}
