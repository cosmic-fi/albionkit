'use client';

import { useTranslations } from 'next-intl';
import { PageShell } from '@/components/PageShell';
import Link from 'next/link';
import {
  BookOpen,
  Coins,
  Sword,
  Pickaxe,
  FlaskConical,
  Hammer,
  ChefHat,
  PawPrint,
  Sparkles,
  HardHat,
  Fish,
  TrendingUp,
  Users,
  Shield,
  ArrowRight
} from 'lucide-react';

interface GuideCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  guides: Guide[];
}

interface Guide {
  id: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
}

export default function GuidesClient() {
  const t = useTranslations('Guides');
  const tNav = useTranslations('Navbar');

  const GUIDE_CATEGORIES: GuideCategory[] = [
    {
      id: 'getting-started',
      title: tNav('gettingStarted'),
      description: t('gettingStartedDesc'),
      icon: BookOpen,
      color: 'text-blue-500 bg-blue-500/10',
      guides: [
        {
          id: 'new-player',
          title: tNav('gettingStarted'),
          description: t('gettingStartedGuideDesc'),
          href: '/guides/getting-started',
          badge: t('startHere')
        }
      ]
    },
    {
      id: 'silver-farming',
      title: tNav('silverFarmingGuide'),
      description: t('silverFarmingDesc'),
      icon: Coins,
      color: 'text-success bg-success/10',
      guides: [
        {
          id: 'silver-farming-guide',
          title: tNav('silverFarmingGuide'),
          description: t('silverFarmingGuideDesc'),
          href: '/profits/silver-farming',
          badge: t('popular')
        }
      ]
    },
    {
      id: 'combat',
      title: t('combatTitle'),
      description: t('combatDesc'),
      icon: Sword,
      color: 'text-destructive bg-destructive/10',
      guides: [
        {
          id: 'positioning',
          title: tNav('combatPositioning'),
          description: t('positioningDesc'),
          href: '/guides/combat/positioning'
        }
      ]
    },
    {
      id: 'gathering',
      title: t('gatheringTitle'),
      description: t('gatheringDesc'),
      icon: Pickaxe,
      color: 'text-amber-500 bg-amber-500/10',
      guides: [
        {
          id: 'routes',
          title: tNav('gatheringRoutes'),
          description: t('gatheringRoutesDesc'),
          href: '/guides/gathering/routes'
        }
      ]
    },
    {
      id: 'crafting',
      title: t('craftingTitle'),
      description: t('craftingDesc'),
      icon: Hammer,
      color: 'text-info bg-info/10',
      guides: [
        {
          id: 'specialization',
          title: tNav('crafting'),
          description: t('craftingPathDesc'),
          href: '/profits/crafting'
        }
      ]
    },
    {
      id: 'profits',
      title: t('profitsTitle'),
      description: t('profitsDesc'),
      icon: TrendingUp,
      color: 'text-purple-500 bg-purple-500/10',
      guides: [
        { id: 'crafting-calc', title: tNav('crafting'), description: tNav('crafting'), href: '/profits/crafting' },
        { id: 'farming', title: tNav('farming'), description: tNav('farming'), href: '/profits/farming' },
        { id: 'cooking', title: tNav('cooking'), description: tNav('cooking'), href: '/profits/cooking' },
        { id: 'alchemy', title: tNav('alchemy'), description: tNav('alchemy'), href: '/profits/alchemy' },
        { id: 'animal', title: tNav('animal'), description: tNav('animal'), href: '/profits/animal' },
        { id: 'enchanting', title: tNav('enchanting'), description: tNav('enchanting'), href: '/profits/enchanting' },
        { id: 'labour', title: tNav('labour'), description: tNav('labour'), href: '/profits/labour' },
        { id: 'chopped-fish', title: tNav('choppedFish'), description: tNav('choppedFish'), href: '/profits/chopped-fish' }
      ]
    }
  ];

  return (
    <PageShell
      title={t('title')}
      description={t('description')}
      backgroundImage='/background/ao-player.jpg'
    >
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('heroTitle')}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* Guide Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GUIDE_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all duration-300"
              >
                {/* Category Header */}
                <div className={`${category.color} p-4 border-b border-border`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background/50">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{category.title}</h3>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                </div>

                {/* Guides List */}
                <div className="p-4 space-y-3">
                  {category.guides.map((guide) => (
                    <Link
                      key={guide.id}
                      href={guide.href}
                      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 group-hover:text-primary transition-colors" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {guide.title}
                          </h4>
                          {guide.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                              {guide.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {guide.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <div className="bg-muted/30 rounded-xl border border-border p-6 text-center">
          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">{t('comingSoonTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('comingSoonDesc')}
          </p>
        </div>
      </div>
    </PageShell>
  );
}
