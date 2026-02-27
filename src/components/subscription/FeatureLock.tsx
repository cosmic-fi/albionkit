'use client';

import { useState } from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { Lock, Heart } from 'lucide-react';
import { SubscriptionModal } from './SubscriptionModal';
import { cn } from '@/lib/utils';

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
  title = "Adept Feature",
  description = "Try it out for free and unlock this feature to help keep the project alive!",
  blur = true,
  className
}: FeatureLockProps) {
  const { hasAccess, loading } = usePremiumAccess();
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return (
      <div className={cn("animate-pulse bg-muted/20 rounded-lg p-4 h-full min-h-[100px]", className)}>
        <div className="h-full w-full flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border/50 bg-card/50", className)}>
      <div className={cn(blur ? "filter blur-md pointer-events-none opacity-50 select-none" : "hidden")}>
        {lockedContent || children}
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-background/20 backdrop-blur-[2px]">
        <div className="bg-gradient-to-br from-amber-500/20 to-purple-500/20 p-4 rounded-full mb-4 ring-1 ring-border ">
          <Lock className="h-8 w-8 text-primary" />
        </div>

        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          {title} <Heart className="h-4 w-4 text-pink-500 fill-pink-500 animate-pulse" />
        </h3>

        <p className="text-muted-foreground max-w-sm mb-6 text-sm">
          {description}
        </p>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Try it out for Free
        </button>
      </div>

      <SubscriptionModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
