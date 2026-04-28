'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BanditReminderProps {
  onReminderChange: (enabled: boolean, leadTime: number) => void;
  onAudioChange: (enabled: boolean) => void;
}

export const BanditReminder: React.FC<BanditReminderProps> = ({ onReminderChange, onAudioChange }) => {
  const t = useTranslations('FactionTools.bandit');
  const [enabled, setEnabled] = useState(false);
  const [leadTime, setLeadTime] = useState(10);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    const savedEnabled = localStorage.getItem('bandit_reminder_enabled') === 'true';
    const savedLeadTime = parseInt(localStorage.getItem('bandit_reminder_lead_time') || '10');
    const savedAudio = localStorage.getItem('bandit_audio_enabled') !== 'false';

    setEnabled(savedEnabled);
    setLeadTime(savedLeadTime);
    setAudioEnabled(savedAudio);
    
    onReminderChange(savedEnabled, savedLeadTime);
    onAudioChange(savedAudio);
  }, []);

  const toggleReminder = () => {
    const newVal = !enabled;
    setEnabled(newVal);
    localStorage.setItem('bandit_reminder_enabled', String(newVal));
    onReminderChange(newVal, leadTime);

    if (newVal && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const changeLeadTime = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = parseInt(e.target.value);
    setLeadTime(newVal);
    localStorage.setItem('bandit_reminder_lead_time', String(newVal));
    onReminderChange(enabled, newVal);
  };

  const toggleAudio = () => {
    const newVal = !audioEnabled;
    setAudioEnabled(newVal);
    localStorage.setItem('bandit_audio_enabled', String(newVal));
    onAudioChange(newVal);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-4 bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleReminder}
            className={`p-2 rounded-xl transition-colors ${enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            title={enabled ? t('disableNotifications') : t('enableNotifications')}
          >
            {enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
          
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{t('reminders')}</span>
            <span className="text-xs text-muted-foreground">{t('remindersDesc')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={leadTime}
            onChange={changeLeadTime}
            disabled={!enabled}
            className="bg-muted border-none rounded-lg text-xs font-medium p-2 focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="5">{t('mins', { mins: 5 })}</option>
            <option value="10">{t('mins', { mins: 10 })}</option>
            <option value="15">{t('mins', { mins: 15 })}</option>
          </select>

          <button
            onClick={toggleAudio}
            className={`p-2 rounded-xl transition-colors ${audioEnabled ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}
            title={audioEnabled ? t('mute') : t('unmute')}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
