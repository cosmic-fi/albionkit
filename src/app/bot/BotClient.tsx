'use client';

import React from 'react';
import {
  MessageSquare,
  Bot,
  Terminal,
  Bell,
  Activity,
  Zap,
  ShieldCheck,
  Plus,
  Monitor,
  Github,
  Settings,
  HelpCircle
} from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function BotClient() {
  const t = useTranslations('BotPage');
  const inviteUrl = 'https://discord.com/oauth2/authorize?client_id=1499136494638731294';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative py-24 px-4 overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 z-0">
          <Image
            src="/bg-2.jpg"
            alt="Albion Online Landscape"
            fill
            className="object-cover opacity-20 grayscale"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background to-background" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>AlbionKit Bot v1.0 [Beta]</span>
          </div>
          <h1 className="text-6xl font-extrabold mb-6 text-foreground tracking-tight sm:text-7xl">
            {t('heroTitle')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-bold transition-all hover:scale-105 shadow-lg shadow-primary/20"
            >
              <Plus className="h-5 w-5" />
              {t('addToDiscord')}
            </a>
            <a
              href="https://github.com/cosmic-fi/albionkit"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-lg font-bold transition-all border border-border"
            >
              <Github className="h-5 w-5" />
              {t('viewOnGithub')}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-24">
        {/* Features Grid */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">{t('featuresTitle')}</h2>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <BotFeatureCard
              icon={Monitor}
              title={t('featureMarket')}
              description={t('featureMarketDesc')}
              tags={['/price', '/gold']}
            />
            <BotFeatureCard
              icon={Bell}
              title={t('featureEvents')}
              description={t('featureEventsDesc')}
              tags={['/bandit']}
            />
            <BotFeatureCard
              icon={Activity}
              title={t('featureKillboard')}
              description={t('featureKillboardDesc')}
              tags={['Auto-alerts']}
            />
            <BotFeatureCard
              icon={MessageSquare}
              title={t('featureSuggest')}
              description={t('featureSuggestDesc')}
              tags={['/suggest']}
            />
          </div>
        </div>

        {/* Guides Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-border bg-card">
            <div className="absolute inset-0 bg-[#0E0D24] flex items-center justify-center p-2">
              <div className="relative w-full h-full max-w-md max-h-lg">
                <Image
                  src="/background/discord-bot---.png"
                  alt="AlbionKit Bot Discord Interface"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          <div>
            <h2 className="text-4xl font-bold mb-8 text-foreground">{t('howToUse')}</h2>
            <div className="space-y-8">
              <GuideStep
                step="01"
                title={t('step1Title')}
                description={t('step1')}
                icon={Plus}
              />
              <GuideStep
                step="02"
                title={t('step2Title')}
                description={t('step2')}
                icon={HelpCircle}
              />
              <GuideStep
                step="03"
                title={t('step3Title')}
                description={t('step3')}
                icon={Settings}
              />
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">{t('faqTitle')}</h2>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-colors">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-black">?</span>
                  {t(`faq.q${i}`)}
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-11">
                  {t(`faq.a${i}`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Callout */}
        <div className="bg-card/50 border border-border rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-info/10 rounded-full blur-[100px]" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6 text-foreground">{t('securityTitle')}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {t('securityDesc')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium">{t('techDiscord')}</span>
              <span className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium">{t('techNextJS')}</span>
              <span className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium">{t('techOSS')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BotFeatureCard({ title, description, icon: Icon, tags }: { title: string, description: string, icon: any, tags: string[] }) {
  return (
    <div className="group bg-card p-8 rounded-3xl border border-border hover:border-primary/50 transition-all hover:translate-y-[-4px]">
      <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-6">{description}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag} className="px-2.5 py-1 bg-accent/50 text-accent-foreground rounded-lg text-[10px] font-black uppercase tracking-widest border border-border/50">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function GuideStep({ step, title, description, icon: Icon }: { step: string, title: string, description: string, icon: any }) {
  return (
    <div className="flex gap-6 group">
      <div className="relative shrink-0">
        <div className="text-5xl font-black text-primary/10 group-hover:text-primary/20 transition-colors tabular-nums leading-none">
          {step}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center shadow-sm">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div>
        <h4 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
