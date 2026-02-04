
'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Crown, TrendingUp, Shield, Zap, Heart, Coins, Hammer, Lightbulb, Github, Bug, Sword, ScrollText, Utensils } from 'lucide-react';
import Link from 'next/link';

export type PageId = 'home' | 'pvp-intel' | 'zvz-tracker' | 'market-flipper' | 'crafting-calc' | 'kill-feed' | 'gold-price' | 'builds' | 'profits' | 'profits-alchemy' | 'profits-cooking' | 'profits-animal' | 'profits-farming' | 'profits-labour' | 'profits-enchanting' | 'profits-chopped-fish';

interface InfoItem {
  id: string;
  relatedPages?: PageId[];
  excludePages?: PageId[];
  icon: any;
  text: string;
  actionLabel: string;
  actionLink: string;
  color: string;
  isExternal?: boolean;
}

const INFO_ITEMS: InfoItem[] = [
  // Social & Community
  {
    id: 'twitter',
    icon: MessageSquare,
    text: "Follow us on Twitter for the latest updates, feature announcements, and community highlights!",
    actionLabel: "Follow on Twitter",
    actionLink: "https://twitter.com/Albion_Kit",
    color: "text-blue-400",
    isExternal: true
  },
  {
    id: 'share',
    icon: Heart,
    text: "Enjoying the app? Consider sharing it with your guildmates!",
    actionLabel: "Share App",
    actionLink: "#share",
    color: "text-pink-400"
  },
  {
    id: 'github',
    icon: Github,
    text: "Follow our organization on GitHub for updates and future open source projects.",
    actionLabel: "View GitHub",
    actionLink: "https://github.com/albionkit",
    color: "text-slate-200",
    isExternal: true
  },
  
  // Tool Promos (Cross-linking)
  {
    id: 'market-flipper',
    excludePages: ['market-flipper'],
    icon: TrendingUp,
    text: "Track real-time market trends and find profitable flips with our Market Flipper tool.",
    actionLabel: "Check Market",
    actionLink: "/tools/market-flipper",
    color: "text-green-400"
  },
  {
    id: 'zvz-tracker',
    excludePages: ['zvz-tracker'],
    icon: Shield,
    text: "Analyze guild performance and battle history with our advanced ZvZ Tracker.",
    actionLabel: "Analyze ZvZ",
    actionLink: "/tools/zvz-tracker",
    color: "text-purple-400"
  },
  {
    id: 'pvp-intel',
    excludePages: ['pvp-intel', 'kill-feed'],
    icon: Zap,
    text: "Get real-time PvP intel and player statistics to stay ahead of the competition.",
    actionLabel: "PvP Intel",
    actionLink: "/tools/pvp-intel",
    color: "text-red-400"
  },
  {
    id: 'gold-price',
    excludePages: ['gold-price'],
    icon: Coins,
    text: "Monitor Gold/Silver exchange rates and calculate Premium costs efficiently.",
    actionLabel: "Check Gold",
    actionLink: "/tools/gold-price",
    color: "text-yellow-400"
  },
  {
    id: 'crafting-calc',
    excludePages: ['crafting-calc'],
    icon: Hammer,
    text: "Maximize your crafting profits with our advanced Crafting Calculator.",
    actionLabel: "Calculate Profits",
    actionLink: "/tools/crafting-calc",
    color: "text-orange-400"
  },
  {
    id: 'builds',
    excludePages: ['builds'],
    icon: Sword,
    text: "Discover the current meta and share your own builds in our Builds Database.",
    actionLabel: "View Builds",
    actionLink: "/builds",
    color: "text-cyan-400"
  },
  {
    id: 'profits-alchemy',
    excludePages: ['profits-alchemy'],
    icon: ScrollText,
    text: "Calculate profits for Alchemy, Cooking, and more with our Profit Calculators.",
    actionLabel: "Calculate Alchemy",
    actionLink: "/profits/alchemy",
    color: "text-emerald-400"
  },
  {
    id: 'profits-cooking',
    excludePages: ['profits-cooking'],
    icon: Utensils,
    text: "Maximize your food crafting profits with our advanced Cooking Calculator.",
    actionLabel: "Calculate Cooking",
    actionLink: "/profits/cooking",
    color: "text-orange-400"
  },

  // General / Filler / Tips
  {
    id: 'tip-1',
    icon: Lightbulb,
    text: "Did you know? You can search for any item or player using the global command menu (Ctrl+K).",
    actionLabel: "Try Search",
    actionLink: "#search",
    color: "text-cyan-400"
  },
  {
      id: 'feedback',
      icon: Bug,
      text: "Found a bug or have a suggestion? Let us know directly via GitHub.",
      actionLabel: "Report Bug",
      actionLink: "https://github.com/albionkit",
      color: "text-rose-400",
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
      <div className="bg-gradient-to-r from-card/50 to-card/30 border border-border/50 rounded-lg p-4 flex items-start gap-4 shadow-sm">
         {icon && (
          <div className={`p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-inner mt-0.5 ${color}`}>
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
  const Icon = item.icon;

  const handleAction = () => {
    if (item.actionLink === '#share') {
      if (navigator.share) {
        navigator.share({
            title: 'AlbionKit',
            text: 'Check out AlbionKit for the best Albion Online tools!',
            url: window.location.origin
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.origin);
      }
    } else if (item.actionLink === '#search') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-gradient-to-r from-card/50 to-card/30 border border-border/50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
        
        {/* Subtle background glow based on color */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-current ${item.color}`} />

        <div className="flex items-center gap-4 relative z-10">
          <div className={`p-2.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-inner ${item.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground font-medium max-w-xl">
            {item.text}
          </p>
        </div>
        
        <div className="relative z-10">
          {item.actionLink.startsWith('#') ? (
             <button 
              onClick={handleAction}
              className="whitespace-nowrap px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-md transition-all hover:scale-105 active:scale-95"
            >
              {item.actionLabel}
            </button>
          ) : (
            <Link 
              href={item.actionLink}
              target={item.isExternal ? "_blank" : undefined}
              className="whitespace-nowrap px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-md transition-all hover:scale-105 active:scale-95 inline-block text-center"
            >
              {item.actionLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
