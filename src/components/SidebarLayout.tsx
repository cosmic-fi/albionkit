'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BookOpen, Menu, X, Search, Sun, Moon, User as UserIcon, LogOut, Settings, Crown, Heart, Bell, ChevronDown, ChevronLeft, Coins, Store, Sword, Skull, Swords, Hammer, Sprout, ChefHat, PawPrint, FlaskConical, ForkKnife, Leaf, FishOff, Fish, Pickaxe, Shield, TrendingUp, Truck, Clock, Activity } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { useLoginModal } from '@/context/LoginModalContext';
import { useCommandMenu } from '@/context/CommandMenuContext';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { DonateCard } from './DonateCard';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  title: string;
  href?: string;
  icon: React.ReactNode;
  submenu?: NavItem[];
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const t = useTranslations('Navbar');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Tools', 'Calculators']);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { user, profile, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const { openLoginModal } = useLoginModal();
  const { setIsOpen } = useCommandMenu();
  const pathname = usePathname();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.displayName || user?.displayName || 'User';
  const photoURL = profile?.photoURL || user?.photoURL;
  const email = profile?.email || user?.email;

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close profile dropdown
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      // Close expanded submenu when clicking outside of it (desktop only)
      if (!isSidebarOpen && expandedGroups.length > 0 && window.innerWidth >= 1024) {
        if (!submenuRef.current || !submenuRef.current.contains(event.target as Node)) {
          setExpandedGroups([]);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, expandedGroups]);

  const navItems: NavItem[] = [
    {
      id: 'home',
      title: t('home'),
      href: '/',
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
      id: 'guides',
      title: t('guides'),
      icon: <BookOpen className="h-5 w-5" />,
      submenu: [
        { id: 'getting-started', title: t('gettingStarted'), href: '/guides/getting-started', icon: <BookOpen className="h-4 w-4" /> },
        { id: 'combat-positioning', title: t('combatPositioning'), href: '/guides/combat/positioning', icon: <Shield className="h-4 w-4" /> },
        { id: 'silver-farming', title: t('silverFarming'), href: '/profits/silver-farming', icon: <Coins className="h-4 w-4" /> },
        { id: 'gathering-routes', title: t('gatheringRoutes'), href: '/guides/gathering/routes', icon: <Pickaxe className="h-4 w-4" /> },
      ],
    },
    {
      id: 'tools',
      title: t('tools'),
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      submenu: [
        { id: 'gold-price', title: t('goldPrice'), href: '/tools/gold-price', icon: <Coins className="h-4 w-4" /> },
        { id: 'market-flipper', title: t('marketFlipper'), href: '/tools/market-flipper', icon: <Store className="h-4 w-4" /> },
        { id: 'pvp-intel', title: t('pvpIntel'), href: '/tools/pvp-intel', icon: <Sword className="h-4 w-4" /> },
        { id: 'killboard', title: t('killboard'), href: '/tools/killboard', icon: <Skull className="h-4 w-4" /> },
        { id: 'zvz-tracker', title: t('zvzTracker'), href: '/tools/zvz-tracker', icon: <Swords className="h-4 w-4" /> },
      ],
    },
    {
      id: 'calculators',
      title: t('calculators'),
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      submenu: [
        { id: 'crafting', title: t('crafting'), href: '/profits/crafting', icon: <Hammer className="h-4 w-4" /> },
        { id: 'farming', title: t('farming'), href: '/profits/farming', icon: <Sprout className="h-4 w-4" /> },
        { id: 'cooking', title: t('cooking'), href: '/profits/cooking', icon: <ForkKnife className="h-4 w-4" /> },
        { id: 'animal', title: t('animal'), href: '/profits/animal', icon: <PawPrint className="h-4 w-4" /> },
        { id: 'alchemy', title: t('alchemy'), href: '/profits/alchemy', icon: <FlaskConical className='h-4 w-4' />},
        { id: 'labour', title: t('labour'), href: '/profits/labour', icon: <Leaf className='h-4 w-4' />},
        { id: 'chopped-fish', title: t('choppedFish'), href: '/profits/chopped-fish', icon: <Fish className='h-4 w-4' />},
        { id: 'enchanting', title: t('enchanting'), href: '/profits/enchanting', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
      ],
    },
    {
      id: 'faction',
      title: t('faction'),
      icon: <Shield className="h-5 w-5" />,
      submenu: [
        { id: 'faction-efficiency', title: t('factionEfficiency'), href: '/faction/efficiency', icon: <TrendingUp className="h-4 w-4" /> },
        { id: 'heart-transport', title: t('heartTransport'), href: '/faction/transport', icon: <Truck className="h-4 w-4" /> },
        { id: 'bandit-tracker', title: t('banditTracker'), href: '/faction/bandit', icon: <Clock className="h-4 w-4" /> },
        { id: 'campaign-tracker', title: t('campaignTracker'), href: '/faction/campaign', icon: <Activity className="h-4 w-4" /> },
      ],
    },
    {
      id: 'builds',
      title: t('builds'),
      href: '/builds',
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    },
  ];

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container (for positioning collapse button) */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${!isSidebarOpen ? 'lg:w-20' : 'lg:w-64'} ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Sidebar */}
        <aside className="h-full bg-card border-r border-border overflow-hidden">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Logo Section */}
            <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
              <Link href="/" className="flex items-center justify-center">
                {!isSidebarOpen ? (
                  <div className="relative p-2 w-full">
                    <img
                      src="/logo.png"
                      alt="AlbionKit"
                      className="h-full w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="relative h-6 w-auto">
                    <img
                      src="/logo-dark.svg"
                      alt="AlbionKit"
                      className="h-full w-auto object-contain dark:hidden"
                    />
                    <img
                      src="/logo-light.svg"
                      alt="AlbionKit"
                      className="h-full w-auto object-contain hidden dark:block"
                    />
                  </div>
                )}
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === pathname;
              const isExpanded = expandedGroups.includes(item.title);
              const hasSubmenu = item.submenu && item.submenu.length > 0;

              if (hasSubmenu) {
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleGroup(item.title)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isExpanded ? 'text-primary bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      } ${!isSidebarOpen && 'lg:justify-center'}`}
                      title={!isSidebarOpen ? item.title : undefined}
                    >
                      <div className="shrink-0">
                        {item.icon}
                      </div>
                      {isSidebarOpen && <span className="whitespace-nowrap">{item.title}</span>}
                      {isSidebarOpen && (
                        <svg className={`h-4 w-4 transition-transform ml-auto ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {isExpanded && (
                      <div 
                        ref={submenuRef}
                        className={`mt-1 space-y-0.5 ${
                        isSidebarOpen
                          ? 'ml-4 border-l-2 border-border pl-3'
                          : 'lg:absolute lg:left-full lg:top-2 lg:ml-2 lg:bg-card lg:border lg:border-border lg:rounded-lg lg:shadow-xl lg:z-50 lg:p-2 lg:min-w-[200px]'
                      }`}>
                        {item.submenu?.map((sub) => (
                          <Link
                            key={sub.id}
                            href={sub.href!}
                            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                              pathname === sub.href
                                ? 'text-primary bg-primary/10 font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                            }`}
                          >
                            {sub.icon}
                            {sub.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                !isSidebarOpen ? (
                  // Collapsed state: just icon with link
                  <Link
                    key={item.id}
                    href={item.href!}
                    className={`w-full flex items-center justify-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'text-primary bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                    title={item.title}
                  >
                    <div className="shrink-0">
                      {item.icon}
                    </div>
                  </Link>
                ) : (
                  // Expanded state: icon with text
                  <Link
                    key={item.id}
                    href={item.href!}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-primary bg-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <div className="shrink-0">
                      {item.icon}
                    </div>
                    <span className="whitespace-nowrap">{item.title}</span>
                  </Link>
                )
              );
            })}
          </nav>

          {/* Donate Section */}
          <div className="p-3 border-t border-border shrink-0">
            {!isSidebarOpen ? (
              <DonateCard compact />
            ) : (
              <DonateCard />
            )}
          </div>
        </div>
      </aside>

        {/* Collapse Button (Outside sidebar, connected to right edge) - Mobile only */}
        {isMobileSidebarOpen && (
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden absolute top-4 -right-12 flex items-center justify-center w-12 h-12 bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-md rounded-tr-lg rounded-br-lg"
          >
            <ChevronLeft size={23} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Desktop Collapse/Expand Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? (
                <Menu className="h-5 w-5" />
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Search - Full bar on desktop, icon only on mobile */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted border border-border rounded-lg text-sm text-muted-foreground transition-all w-64 hidden md:flex"
            >
              <Search className="h-4 w-4" />
              <span>{t('search')}...</span>
              <kbd className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-background border border-border rounded ml-auto">
                <span>⌘</span>K
              </kbd>
            </button>
            {/* Mobile search icon */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
              title={t('search')}
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Language Switcher */}
            <div className="block">
              <LanguageSwitcher />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              title={t('toggleTheme')}
            >
              {mounted && resolvedTheme === 'light' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 pl-2 border-l border-border hover:bg-accent hover:border-transparent hover:rounded-lg pr-2 py-1.5 transition-colors"
                >
                  {photoURL ? (
                    <img src={photoURL} alt={displayName} className="h-8 w-8 rounded-full border border-border" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center border border-border">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium text-foreground max-w-[150px] truncate">{displayName}</span>
                  <ChevronDown className={`hidden md:inline h-4 w-4 text-muted-foreground transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 shadow-xl">
                    <div className="p-3 border-b border-border bg-gradient-to-br from-accent/50 to-transparent">
                      <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>
                    </div>

                    <div className="p-2">
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-accent/70 rounded-xl transition-all"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="font-medium">{t('settings')}</span>
                      </Link>
                    </div>

                    <div className="border-t border-border p-2">
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="font-medium">{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openLoginModal()}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t('login')}</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
