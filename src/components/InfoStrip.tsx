'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Crown, TrendingUp, Shield, Zap, Heart, Coins, Hammer, Lightbulb, Bug, Sword, ScrollText, Utensils, Coffee, Github } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export type PageId = 'home' | 'pvp-intel' | 'zvz-tracker' | 'market-flipper' | 'crafting-calc' | 'killboard' | 'gold-price' | 'builds' | 'profits' | 'profits-alchemy' | 'profits-cooking' | 'profits-animal' | 'profits-farming' | 'profits-labour' | 'profits-enchanting' | 'profits-chopped-fish' | 'faction-campaign' | 'faction-efficiency' | 'faction-transport' | 'faction-bandit';

interface InfoItem {
  id: string;
  relatedPages?: PageId[];
  excludePages?: PageId[];
  icon: any;
  translationKey: string;
  actionLink: string;
  color: string;
  isExternal?: boolean;
}

const INFO_ITEMS: InfoItem[] = [
  // Social & Community
  {
    id: 'twitter',
    icon: MessageSquare,
    translationKey: 'twitter',
    actionLink: "https://twitter.com/Albion_Kit",
    color: "text-blue-400",
    isExternal: true
  },
  {
    id: 'share',
    icon: Heart,
    translationKey: 'share',
    actionLink: "#share",
    color: "text-pink-400"
  },

  // Tool Promos (Cross-linking)
  {
    id: 'market-flipper',
    excludePages: ['market-flipper'],
    icon: TrendingUp,
    translationKey: 'marketFlipper',
    actionLink: "/tools/market-flipper",
    color: "text-green-400"
  },
  {
    id: 'zvz-tracker',
    excludePages: ['zvz-tracker'],
    icon: Shield,
    translationKey: 'zvzTracker',
    actionLink: "/tools/zvz-tracker",
    color: "text-purple-400"
  },
  {
    id: 'pvp-intel',
    excludePages: ['pvp-intel', 'killboard'],
    icon: Zap,
    translationKey: 'pvpIntel',
    actionLink: "/tools/pvp-intel",
    color: "text-red-400"
  },
  {
    id: 'gold-price',
    excludePages: ['gold-price'],
    icon: Coins,
    translationKey: 'goldPrice',
    actionLink: "/tools/gold-price",
    color: "text-yellow-400"
  },
  {
    id: 'crafting-calc',
    excludePages: ['crafting-calc'],
    icon: Hammer,
    translationKey: 'craftingCalc',
    actionLink: "/profits/crafting",
    color: "text-orange-400"
  },
  {
    id: 'builds',
    excludePages: ['builds'],
    icon: Sword,
    translationKey: 'builds',
    actionLink: "/builds",
    color: "text-cyan-400"
  },
  {
    id: 'profits-alchemy',
    excludePages: ['profits-alchemy'],
    icon: ScrollText,
    translationKey: 'profitsAlchemy',
    actionLink: "/profits/alchemy",
    color: "text-emerald-400"
  },
  {
    id: 'profits-cooking',
    excludePages: ['profits-cooking'],
    icon: Utensils,
    translationKey: 'profitsCooking',
    actionLink: "/profits/cooking",
    color: "text-orange-400"
  },

  // General / Filler / Tips
  {
    id: 'tip-1',
    icon: Lightbulb,
    translationKey: 'tip1',
    actionLink: "#search",
    color: "text-cyan-400"
  },
  {
    id: 'feedback',
    icon: Bug,
    translationKey: 'feedback',
    actionLink: "https://github.com/cosmic-fi/albionkit/issues",
    color: "text-rose-400",
    isExternal: true
  },

  // Support & Contributions
  {
    id: 'donate',
    icon: Coffee,
    translationKey: 'donateInfo',
    actionLink: "/donate",
    color: "text-pink-400",
  },
  {
    id: 'contribute',
    icon: Github,
    translationKey: 'contributeInfo',
    actionLink: "https://github.com/cosmic-fi/albionkit?tab=contributing-ov-file",
    color: "text-foreground",
    isExternal: true
  }
];

interface InfoStripProps {
  currentPage?: PageId;
  children?: React.ReactNode;
}

export function InfoBanner({ title, children, icon, color = "text-blue-400" }: { title?: string, children: React.ReactNode, icon?: React.ReactNode, color?: string }) {
  return (
    <div className="w-full mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-gradient-to-r from-card/50 to-card/30 border border-border/50 rounded-lg p-4 flex items-start gap-4">
        {icon && (
          <div className={`p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 mt-0.5 ${color}`}>
            {icon}
          </div>
        )}
        <div className="flex flex-col gap-1 w-full">
          {title && <h4 className="text-sm font-semibold text-foreground">{title}</h4>}
          <div className="text-sm text-muted-foreground font-medium w-full leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InfoStrip({ currentPage, children }: InfoStripProps) {
  const [mounted, setMounted] = useState(false);
  const [randomItem, setRandomItem] = useState<InfoItem | null>(null);

  useEffect(() => {
    setMounted(true);

    // Filter items
    const availableItems = INFO_ITEMS.filter(item => {
      if (!currentPage) return true;
      if (item.excludePages?.includes(currentPage)) return false;
      return true;
    });

    setRandomItem(availableItems[Math.floor(Math.random() * availableItems.length)]);
  }, [currentPage]);

  if (!mounted) return null;

  return (
    <div className="w-full my-8 flex flex-col">
      {children}

      {randomItem && <RandomInfoCard item={randomItem} />}
    </div>
  );
}

function RandomInfoCard({ item }: { item: InfoItem }) {
  const t = useTranslations('InfoStrip');
  const Icon = item.icon;

  const handleAction = () => {
    if (item.actionLink === '#share') {
      if (navigator.share) {
        navigator.share({
          title: 'AlbionKit',
          text: 'Check out AlbionKit for the best Albion Online tools!',
          url: window.location.origin
        }).catch(() => { });
      } else {
        navigator.clipboard.writeText(window.location.origin);
      }
    } else if (item.actionLink === '#search') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-gradient-to-r from-card/50 to-card/30 border border-border/50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 group relative overflow-hidden">

        {/* Subtle background glow based on color */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-current ${item.color}`} />

        <div className="flex items-center gap-4 relative z-10">
          <div className={`p-2.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 ${item.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground font-medium max-w-xl">
            {t(`${item.translationKey}.text`)}
          </p>
        </div>

        <div className="relative z-10">
          {item.actionLink.startsWith('#') ? (
            <button
              onClick={handleAction}
              className="whitespace-nowrap px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-md transition-all hover:scale-105 active:scale-95"
            >
              {t(`${item.translationKey}.action`)}
            </button>
          ) : (
            <Link
              href={item.actionLink}
              target={item.isExternal ? "_blank" : undefined}
              className="whitespace-nowrap px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-md transition-all hover:scale-105 active:scale-95 inline-block text-center"
            >
              {t(`${item.translationKey}.action`)}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
