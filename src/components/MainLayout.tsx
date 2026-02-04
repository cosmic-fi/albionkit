'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { ServerStatusBanner } from './ServerStatusBanner';
import { Footer } from './footer';
import { CookieBanner } from './CookieBanner';
import { CommandMenu } from './CommandMenu';
import { useAuth } from '@/context/AuthContext';
import { VerificationBanner } from './VerificationBanner';
import { CommandMenuProvider, useCommandMenu } from '@/context/CommandMenuContext';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const { isOpen, setIsOpen } = useCommandMenu();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  // Apply reduced motion preference
  useEffect(() => {
    if (profile?.preferences?.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [profile?.preferences?.reducedMotion]);

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      <ServerStatusBanner />
      <VerificationBanner />
      <Navbar />
      <CommandMenu open={isOpen} setOpen={setIsOpen} />
      <main className={`flex-1 w-full ${isHomePage ? '' : ''}`}>
        {children}
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <CommandMenuProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </CommandMenuProvider>
  );
}
