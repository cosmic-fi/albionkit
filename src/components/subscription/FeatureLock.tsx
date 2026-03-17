'use client';

import { useState } from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { Lock, Heart } from 'lucide-react';
import { SubscriptionModal } from './SubscriptionModal';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface FeatureLockProps {
  children: React.ReactNode;
  lockedContent?: React.ReactNode;
  featureId?: string;
  title?: string;
  description?: string;
  blur?: boolean;
  className?: string;
}

export function FeatureLock({
  children,
  lockedContent,
  featureId,
  title,
  description,
  blur = true,
  className
}: FeatureLockProps) {
  const { hasAccess, loading } = usePremiumAccess();
  const [showModal, setShowModal] = useState(false);
  const t = useTranslations('Subscription');

  if (loading) {
    return (
      <div className={cn("animate-pulse bg-muted/20 rounded-lg p-3 sm:p-4 h-full min-h-[80px] sm:min-h-[100px]", className)}>
        <div className="h-full w-full flex items-center justify-center">
          <div className="h-4 w-4 sm:h-6 sm:w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg sm:rounded-xl border border-border/50 bg-card/50 py-10 min-h-[230px] sm:min-h-[320px] md:min-h-[200px]", className)}>
      <div className={cn(blur ? "filter blur-md pointer-events-none opacity-50 select-none" : "hidden")}>
        {lockedContent || children}
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center bg-background/20 backdrop-blur-[2px] gap-3 sm:gap-4 md:gap-5">
        <div className="bg-gradient-to-br from-amber-500/20 to-purple-500/20 p-4 sm:p-3 md:p-3 rounded-full ring-1 ring-border flex-shrink-0">
          <Lock size={10} className="h-10 w-10 sm:h-10 md:h-10 sm:w-10 md:w-10 lg:h-10 lg:w-10 text-primary" />
        </div>

        <div className="flex flex-col items-center gap-2 sm:gap-3 flex-shrink-0">
          <h3 className="text-xl sm:text-2xl md:text-2xl font-bold text-center max-w-[240px] sm:max-w-sm md:max-w-md">
            {title}
          </h3>
        </div>

        <p className="text-muted-foreground max-w-[280px] sm:max-w-xs md:max-w-sm text-xs sm:text-sm md:text-base leading-tight flex-shrink-0">
          {description}
        </p>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg md:rounded-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base md:text-base shadow-lg hover:shadow-xl flex-shrink-0"
        >
          {t('tryFree')}
        </button>
      </div>

      <SubscriptionModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
