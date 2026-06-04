'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginModal } from '@/context/LoginModalContext';
import { Preloader } from '@/components/Preloader';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('Login');
  const router = useRouter();
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    // Open the login modal and then redirect back home if they close it
    openLoginModal();
    router.replace('/');
  }, [openLoginModal, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Preloader size="lg" showText text={t('redirecting')} />

      </div>
    </div>
  );
}
