'use client';

import { Coffee, Heart, Sparkles, ExternalLink, Coins } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DonateCardProps {
  compact?: boolean;
}

export function DonateCard({ compact = false }: DonateCardProps) {
  const t = useTranslations('Donate');

  if (compact) {
    return (
      <a
        href="https://buymeacoffee.com/cosmic_fi"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center p-3 bg-gradient-to-br from-pink-500/10 to-red-500/10 hover:from-pink-500/20 hover:to-red-500/20 border border-pink-500/30 hover:border-pink-500/50 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden max-w-[200px] mx-auto"
        title={t('title')}
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-red-500/0 group-hover:from-pink-500/10 group-hover:to-red-500/10 transition-all duration-500" />

        {/* Animated sparkles */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <Sparkles className="absolute top-1 right-1 h-3 w-3 text-pink-500 animate-pulse" />
        </div>

        <Coffee className="h-5 w-5 text-pink-500 group-hover:text-pink-400 transition-colors relative z-10" />
      </a>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/10 via-red-500/10 to-pink-600/10 border border-pink-500/30 p-2 sm:p-2 max-w-[250px] mx-auto w-full">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-red-500/5" />

      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />

      <div className="relative z-10">
        {/* Title */}
        <h3 className="text-md font-bold text-center text-foreground mb-2">
          {t('title')}
        </h3>

        {/* Description */}
        <p className="text-[0.8rem] text-muted-foreground text-center mb-4 leading-relaxed">
          {t('description')}
        </p>


        {/* BMC Button */}
        <a
          href="https://www.buymeacoffee.com/cosmic_fi"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center"
        >
          <img
            src="https://img.buymeacoffee.com/button-api/?text=Buy+me+a+Coffee&emoji=☕&slug=cosmic_fi&button_colour=FF5F5F&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=ffffff"
            alt="Buy me a Coffee"
            className="w-full"
          />
        </a>
      </div>
    </div>
  );
}
