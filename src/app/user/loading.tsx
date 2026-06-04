'use client';

import { useTranslations } from 'next-intl';
import { Preloader } from '@/components/Preloader';

export default function Loading() {
  const t = useTranslations('Common');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Preloader size="lg" showText text={t('loading')} />
    </div>
  );
}
