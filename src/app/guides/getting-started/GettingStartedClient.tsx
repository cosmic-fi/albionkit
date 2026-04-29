'use client';

import { useTranslations } from 'next-intl';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Sword,
  Coins,
  Pickaxe,
  Hammer,
  Home,
  BookOpen,
  Shield,
  Skull,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
}

export default function GettingStartedClient() {
  const t = useTranslations('GettingStarted');

  const DAY1_CHECKLIST: ChecklistItem[] = [
    {
      id: 'tutorial',
      title: t('checklist.tutorial.title'),
      description: t('checklist.tutorial.desc'),
      icon: BookOpen,
      completed: false
    },
    {
      id: 'city',
      title: t('checklist.city.title'),
      description: t('checklist.city.desc'),
      icon: Home,
      completed: false
    },
    {
      id: 'laborers',
      title: t('checklist.laborers.title'),
      description: t('checklist.laborers.desc'),
      icon: Coins,
      completed: false
    },
    {
      id: 'island',
      title: t('checklist.island.title'),
      description: t('checklist.island.desc'),
      icon: Home,
      completed: false
    }
  ];

  const FIRST_WEEK_GOALS = [
    {
      day: t('goals.day1-2.day'),
      title: t('goals.day1-2.title'),
      goals: [
        t('goals.day1-2.goals.0'),
        t('goals.day1-2.goals.1'),
        t('goals.day1-2.goals.2'),
        t('goals.day1-2.goals.3')
      ]
    },
    {
      day: t('goals.day3-4.day'),
      title: t('goals.day3-4.title'),
      goals: [
        t('goals.day3-4.goals.0'),
        t('goals.day3-4.goals.1'),
        t('goals.day3-4.goals.2'),
        t('goals.day3-4.goals.3')
      ]
    },
    {
      day: t('goals.day5-7.day'),
      title: t('goals.day5-7.title'),
      goals: [
        t('goals.day5-7.goals.0'),
        t('goals.day5-7.goals.1'),
        t('goals.day5-7.goals.2'),
        t('goals.day5-7.goals.3')
      ]
    }
  ];

  const COMMON_MISTAKES = [
    {
      title: t('mistakes.0.title'),
      description: t('mistakes.0.desc'),
      icon: Hammer
    },
    {
      title: t('mistakes.1.title'),
      description: t('mistakes.1.desc'),
      icon: AlertTriangle
    },
    {
      title: t('mistakes.2.title'),
      description: t('mistakes.2.desc'),
      icon: Shield
    },
    {
      title: t('mistakes.3.title'),
      description: t('mistakes.3.desc'),
      icon: Coins
    }
  ];

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
              <Sword className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('welcomeTitle')}
              </h1>
              <p className="text-muted-foreground">
                {t('welcomeSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* First 7 Days Checklist */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t('firstDaysTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('firstDaysSubtitle')}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {DAY1_CHECKLIST.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Week Goals */}
        <div className="grid md:grid-cols-3 gap-6">
          {FIRST_WEEK_GOALS.map((goal) => (
            <div
              key={goal.day}
              className="bg-card rounded-xl border border-border p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{goal.day}</h3>
              </div>
              <h4 className="font-bold text-foreground mb-3">{goal.title}</h4>
              <ul className="space-y-2">
                {goal.goals.map((g, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Circle className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                    <span className="text-muted-foreground">{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Common Mistakes */}
        <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t('mistakesTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('mistakesSubtitle')}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {COMMON_MISTAKES.map((mistake, index) => {
              const Icon = mistake.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border"
                >
                  <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                    <Icon className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{mistake.title}</h3>
                    <p className="text-sm text-muted-foreground">{mistake.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">{t('nextSteps')}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/guides/combat/positioning"
              className="group flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20 hover:border-destructive/40 transition-all"
            >
              <Shield className="h-6 w-6 text-destructive group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-foreground group-hover:text-destructive transition-colors">
                  {t('positioningGuide')}
                </div>
                <div className="text-xs text-muted-foreground">{t('positioningDesc')}</div>
              </div>
            </Link>

            <Link
              href="/guides/gathering/routes"
              className="group flex items-center gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all"
            >
              <Pickaxe className="h-6 w-6 text-amber-500 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-foreground group-hover:text-amber-500 transition-colors">
                  {t('gatheringRoutes')}
                </div>
                <div className="text-xs text-muted-foreground">{t('gatheringRoutesDesc')}</div>
              </div>
            </Link>
          </div>
        </div>

        <InfoStrip currentPage="home" />
      </div>
    </PageShell>
  );
}
