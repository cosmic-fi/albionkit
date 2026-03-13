'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function CookieBanner() {
  const t = useTranslations('CookieBanner');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consented = localStorage.getItem('cookie-consent');
    if (!consented) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto bg-popover/95 backdrop-blur-md border border-border rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Cookie className="h-5 w-5" />
            <span>{t('title')}</span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t('description')}
            <Link href="/cookies" className="text-primary hover:text-primary/80 underline">{t('cookiePolicy')}</Link>.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleDecline}
            className="flex-1 md:flex-none px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg text-sm font-medium transition-colors"
          >
            {t('decline')}
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 md:flex-none px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-bold transition-all hover:scale-105"
          >
            {t('acceptAll')}
          </button>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
