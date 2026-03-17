'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Home, Search, AlertTriangle, Compass, Map, Shield, Hammer, Ghost, Coins, Sword } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('NotFound');
  
  const openSearch = () => {
    // Dispatch Ctrl+K to open global command menu
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        code: 'KeyK',
        ctrlKey: true,
        metaKey: true,
        bubbles: true
      })
    );
  };

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Main Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-100"
          style={{ backgroundImage: 'url(/background/ao-mists.jpg)' }}
        />

        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
        {/* Mists fog effect overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl px-4 text-center space-y-8 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">

        {/* Text */}
        <div className="space-y-4 pt-20 sm:pt-20">
          <h1 className="text-6xl font-black tracking-tighter lg:text-8xl text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground to-muted-foreground">
            404
          </h1>
          <h2 className="text-2xl font-bold text-foreground">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {t('description')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center pt-2">
          <Link href="/">
            <Button size="lg" className="min-w-[160px] gap-2 transition-all">
              <Home className="w-4 h-4" />
              {t('returnHome')}
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            className="min-w-[160px] gap-2 bg-background/50 backdrop-blur-sm hover:bg-accent/50"
            onClick={openSearch}
          >
            <Search className="w-4 h-4" />
            {t('searchGlobal')}
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Suggested Links */}
        <div className="py-12 w-full">
          <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-6">
            {t('safeZones')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('links.market'), href: '/tools/market-flipper', icon: Coins, color: 'group-hover:text-green-500' },
              { label: t('links.pvp'), href: '/tools/pvp-intel', icon: Sword, color: 'group-hover:text-red-500' },
              { label: t('links.builds'), href: '/builds', icon: Shield, color: 'group-hover:text-blue-500' },
              { label: t('links.crafting'), href: '/tools/crafting-calc', icon: Hammer, color: 'group-hover:text-amber-500' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border/50 transition-all duration-300 group hover:-translate-y-1"
              >
                <item.icon className={`w-6 h-6 text-muted-foreground/70 transition-colors duration-300 ${item.color}`} />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
