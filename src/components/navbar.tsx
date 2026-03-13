'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User as UserIcon,
  LogOut,
  Settings,
  Crown,
  Menu,
  ChevronDown,
  User,
  Moon,
  Sun,
  Home,
  Coins,
  Hammer,
  Sword,
  Swords,
  TrendingUp,
  Sprout,
  PawPrint,
  Users,
  Sparkles,
  Utensils,
  FlaskConical,
  Anvil,
  Fish,
  Shield,
  Skull,
  X,
  Search,
  MessageCircle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useLoginModal } from '@/context/LoginModalContext';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useCommandMenu } from '@/context/CommandMenuContext';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface NavItem {
  id: string;
  title: string;
  href?: string;
  icon: React.ReactNode;
  submenu?: NavItem[];
  category?: string;
  group?: string;
}

interface NavbarProps {
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    title: 'Home',
    href: '/',
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 'tools',
    title: 'Tools',
    icon: <Hammer className="h-4 w-4" />,
    submenu: [
      { id: 'market-flipper', title: 'Market Flipper', href: '/tools/market-flipper', icon: <Coins className="h-4 w-4" /> },
      { id: 'pvp-intel', title: 'PvP Intel', href: '/tools/pvp-intel', icon: <Sword className="h-4 w-4" /> },
      { id: 'zvz-tracker', title: 'ZvZ Tracker', href: '/tools/zvz-tracker', icon: <Swords className="h-4 w-4" /> },
      { id: 'craft-planner', title: 'Craft Planner', href: '/tools/crafting-calc', icon: <Hammer className="h-4 w-4" /> },
      { id: 'gold-price', title: 'Gold Price', href: '/tools/gold-price', icon: <Coins className="h-4 w-4 text-warning" /> },
    ],
  },
  {
    id: 'calculators',
    title: 'Calculators',
    icon: <Sparkles className="h-4 w-4" />,
    submenu: [
      { id: 'farming', title: 'Farming', href: '/profits/farming', icon: <Sprout className="h-4 w-4" /> },
      { id: 'cooking', title: 'Cooking', href: '/profits/cooking', icon: <Utensils className="h-4 w-4" /> },
      { id: 'alchemy', title: 'Alchemy', href: '/profits/alchemy', icon: <FlaskConical className="h-4 w-4" /> },
      { id: 'enchanting', title: 'Enchanting', href: '/profits/enchanting', icon: <Sparkles className="h-4 w-4" /> },
      { id: 'labour', title: 'Labour', href: '/profits/labour', icon: <Users className="h-4 w-4" /> },
      { id: 'animal', title: 'Animal', href: '/profits/animal', icon: <PawPrint className="h-4 w-4" /> },
      { id: 'chopped-fish', title: 'Chopped Fish', href: '/profits/chopped-fish', icon: <Fish className="h-4 w-4" /> },
    ],
  },
    {
      id: 'forum',
      title: 'Forum',
      // href: '/forum',  // Temporarily hidden
      icon: <MessageCircle className="h-4 w-4" />,
    },
    {
      id: 'builds',
      title: 'Builds',
      href: '/builds',
      icon: <Shield className="h-4 w-4" />,
    },
  ];

export function Navbar() {
  const t = useTranslations('Navbar');
  const { user, profile, logout } = useAuth();
  const { setIsOpen } = useCommandMenu();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<string[]>([t('calculators'), t('tools')]);
  const { openLoginModal } = useLoginModal();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'home',
      title: t('home'),
      href: '/',
      icon: <Home className="h-4 w-4" />,
    },
    {
      id: 'tools',
      title: t('tools'),
      icon: <Hammer className="h-4 w-4" />,
      submenu: [
        { id: 'gold-price', title: t('goldPrice'), href: '/tools/gold-price', icon: <Coins className="h-4 w-4 text-warning" />, group: 'market' },
        { id: 'market-flipper', title: t('marketFlipper'), href: '/tools/market-flipper', icon: <Coins className="h-4 w-4" />, group: 'market' },
        { id: 'craft-planner', title: t('craftPlanner'), href: '/tools/crafting-calc', icon: <Hammer className="h-4 w-4" />, group: 'market' },
        { id: 'pvp-intel', title: t('pvpIntel'), href: '/tools/pvp-intel', icon: <Sword className="h-4 w-4" />, group: 'pvp' },
        { id: 'kill-feed', title: t('killFeed'), href: '/tools/kill-feed', icon: <Skull className="h-4 w-4" />, group: 'pvp' },
        { id: 'zvz-tracker', title: t('zvzTracker'), href: '/tools/zvz-tracker', icon: <Swords className="h-4 w-4" />, group: 'pvp' },
      ],
    },
    {
      id: 'calculators',
      title: t('calculators'),
      icon: <Sparkles className="h-4 w-4" />,
      submenu: [
        { id: 'farming', title: t('farming'), href: '/profits/farming', icon: <Sprout className="h-4 w-4" />, category: 'profits' },
        { id: 'cooking', title: t('cooking'), href: '/profits/cooking', icon: <Utensils className="h-4 w-4" />, category: 'profits' },
        { id: 'alchemy', title: t('alchemy'), href: '/profits/alchemy', icon: <FlaskConical className="h-4 w-4" />, category: 'profits' },
        { id: 'enchanting', title: t('enchanting'), href: '/profits/enchanting', icon: <Sparkles className="h-4 w-4" />, category: 'profits' },
        { id: 'labour', title: t('labour'), href: '/profits/labour', icon: <Users className="h-4 w-4" />, category: 'profits' },
        { id: 'animal', title: t('animal'), href: '/profits/animal', icon: <PawPrint className="h-4 w-4" />, category: 'profits' },
        { id: 'chopped-fish', title: t('choppedFish'), href: '/profits/chopped-fish', icon: <Fish className="h-4 w-4" />, category: 'profits' },
      ],
    },
    // {
    //   id: 'forum',
    //   title: t('forum'),
    //   href: '/forum',
    //   icon: <MessageCircle className="h-4 w-4" />,
    // },
    {
      id: 'builds',
      title: t('builds'),
      href: '/builds',
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use profile data if available, fallback to auth user data
  const displayName = profile?.displayName || user?.displayName || 'User';
  const photoURL = profile?.photoURL || user?.photoURL;
  const email = profile?.email || user?.email;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileGroup = (title: string) => {
    setExpandedMobileGroups(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  if (!mounted) {
    return (
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-[60] h-16">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="relative h-8 w-32 bg-muted/20 animate-pulse rounded" />
            <div className="hidden lg:flex gap-1">
              <div className="h-9 w-20 bg-muted/10 animate-pulse rounded-lg" />
              <div className="h-9 w-20 bg-muted/10 animate-pulse rounded-lg" />
              <div className="h-9 w-20 bg-muted/10 animate-pulse rounded-lg" />
              <div className="h-9 w-20 bg-muted/10 animate-pulse rounded-lg" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 bg-muted/10 animate-pulse rounded-lg" />
            <div className="h-9 w-9 bg-muted/10 animate-pulse rounded-lg" />
            <div className="h-9 w-24 bg-primary/20 animate-pulse rounded-lg" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-[60] text-foreground">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mr-4 lg:mr-10 p-0 hover:opacity-90 transition-opacity">
              <div className="relative h-8 p-0 sm:h-8">
                <img
                  src="/logo-dark.svg"
                  alt="AlbionKit Logo"
                  className="h-full dark:hidden block"
                />
                <img
                  src="/logo-light.svg"
                  alt="AlbionKit Logo"
                  className="h-full hidden dark:block"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1" ref={navDropdownRef}>
              {mounted && navItems.map((item) => {
                if (item.submenu) {
                  const isActive = activeDropdown === item.title;
                  return (
                    <div key={item.id} className="relative">
                      <button
                        onClick={() => setActiveDropdown(isActive ? null : item.title)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          }`}
                      >
                        {item.icon}
                        {item.title}
                        <ChevronDown className={`h-4 w-4 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                      </button>

                      {isActive && (
                        <div className="absolute top-full left-0 mt-2 w-72 bg-popover border border-border rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <div className="p-3">
                            {(() => {
                              // Group items by category
                              const itemsWithCategory = item.submenu?.filter(s => s.category);
                              const itemsWithoutCategory = item.submenu?.filter(s => !s.category);
                              
                              if (itemsWithCategory && itemsWithCategory.length > 0) {
                                const categories = [...new Set(itemsWithCategory.map(s => s.category))];
                                return (
                                  <div className="flex gap-4">
                                    {categories.map(cat => (
                                      <div key={cat} className="flex-1">
                                        <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">
                                          {t(`profits`)}
                                        </div>
                                        <div className="space-y-1">
                                          {itemsWithCategory
                                            .filter(s => s.category === cat)
                                            .map(sub => (
                                              <Link
                                                key={sub.id}
                                                href={sub.href!}
                                                onClick={() => setActiveDropdown(null)}
                                                className="flex items-center gap-3 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                              >
                                                {sub.icon}
                                                {sub.title}
                                              </Link>
                                            ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="space-y-1">
                                  {(() => {
                                    // Group submenu items
                                    const submenu = item.submenu || [];
                                    const groups: Record<string, NavItem[]> = {};
                                    
                                    submenu.forEach((sub) => {
                                      const group = sub.group || 'default';
                                      if (!groups[group]) {
                                        groups[group] = [];
                                      }
                                      groups[group]!.push(sub);
                                    });

                                    const groupOrder = Object.keys(groups);
                                    
                                    return groupOrder.map((group, groupIndex) => (
                                      <div key={group}>
                                        {groups[group]?.map((sub) => (
                                          sub.group === group && (
                                            <Link
                                              key={sub.id}
                                              href={sub.href!}
                                              onClick={() => setActiveDropdown(null)}
                                              className="flex items-center gap-3 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                            >
                                              {sub.icon}
                                              {sub.title}
                                            </Link>
                                          )
                                        ))}
                                        {groupIndex < groupOrder.length - 1 && (
                                          <div className="my-2 border-t border-border" />
                                        )}
                                      </div>
                                    ));
                                  })()}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href!}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === item.href ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              {/* Search Trigger */}
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors hidden sm:flex items-center gap-2"
                title={`${t('search')} (Ctrl+K)`}
              >
                <Search className="h-5 w-5" />
                <span className="hidden lg:inline text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</span>
              </button>

              {/* Language Switcher */}
              <LanguageSwitcher />

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

              <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>

              {!profile?.isPremium && (
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="relative overflow-hidden hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-full text-xs font-bold transition-all"
                >
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent z-10 skew-x-12" />
                  <Crown className="h-3 w-3 relative z-20" />
                  <span className="hidden lg:inline relative z-20">{t('supportUs')}</span>
                </button>
              )}

              {user ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center group p-1 hover:bg-accent rounded-full border border-transparent hover:border-border transition-all relative"
                  >
                    {photoURL ? (
                      <div className="h-10 w-10" >
                        <img src={photoURL} alt={displayName} className="w-12 rounded-full border border-border group-hover:border-amber-500 transition-colors" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full bg-accent flex items-center justify-center border border-border group-hover:border-amber-500 transition-colors">
                        <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-muted-foreground" />
                      </div>
                    )}
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="p-3 border-b border-border">
                        <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{email}</p>
                      </div>

                      <div className="p-1">
                        <Link
                          href={`/user/${user.uid}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          {t('viewProfile')}
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          {t('settings')}
                        </Link>
                      </div>

                      <div className="border-t border-border p-1">
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('logout')}
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
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-background border-r border-border flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="relative h-8 w-32">
                <img
                  src="/logo-word-dark.svg"
                  alt="AlbionKit Logo"
                  className="h-full w-full object-contain object-left dark:hidden block"
                />
                <img
                  src="/logo-word-light.svg"
                  alt="AlbionKit Logo"
                  className="h-full w-full object-contain object-left hidden dark:block"
                />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = item.href === pathname;
                const isExpanded = expandedMobileGroups.includes(item.title);
                const hasSubmenu = item.submenu && item.submenu.length > 0;

                if (hasSubmenu) {
                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => toggleMobileGroup(item.title)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          {item.title}
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="mt-1 ml-4 space-y-1 border-l-2 border-border pl-2">
                          {(() => {
                            // Group submenu items for mobile
                            const submenu = item.submenu || [];
                            const groups: Record<string, NavItem[]> = {};
                            
                            submenu.forEach((sub) => {
                              const group = sub.group || 'default';
                              if (!groups[group]) {
                                groups[group] = [];
                              }
                              groups[group]!.push(sub);
                            });

                            const groupOrder = Object.keys(groups);
                            
                            return groupOrder.map((group, groupIndex) => (
                              <div key={group}>
                                {groups[group]?.map((sub) => (
                                  <Link
                                    key={sub.id}
                                    href={sub.href!}
                                    className={`
                                      flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors
                                      ${pathname === sub.href
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
                                    `}
                                  >
                                    {sub.icon}
                                    {sub.title}
                                  </Link>
                                ))}
                                {groupIndex < groupOrder.length - 1 && (
                                  <div className="my-2 border-t border-border" />
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href!}
                    className={`
                      flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
                    `}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                );
              })}

              <div className="h-px bg-border my-2"></div>

              {/* Mobile Search */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <Search className="h-4 w-4" />
                {t('search')}
              </button>

              {/* Mobile Support Us */}
              {!profile?.isPremium && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowSubscriptionModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors mt-1"
                >
                  <Crown className="h-4 w-4" />
                  {t('supportUs')}
                </button>
              )}

              <div className="h-px bg-border my-2"></div>

              {/* Mobile Theme Toggle */}
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                {mounted && resolvedTheme === 'light' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span>{t('toggleTheme')}</span>
              </button>

              {/* Mobile Language Switcher */}
              <div className="px-3 py-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Language</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'de', label: 'Deutsch' },
                    { code: 'fr', label: 'Français' },
                    { code: 'ru', label: 'Русский' },
                    { code: 'pl', label: 'Polski' },
                    { code: 'pt', label: 'Português' },
                    { code: 'es', label: 'Español' },
                    { code: 'tr', label: 'Türkçe' },
                    { code: 'zh', label: '中文' },
                    { code: 'ko', label: '한국어' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={async () => {
                        const { setLocale } = await import('@/app/actions/locale');
                        await setLocale(lang.code);
                        window.location.reload();
                      }}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-all text-left ${
                        (typeof window !== 'undefined' && document.cookie.includes(`NEXT_LOCALE=${lang.code}`)) || lang.code === 'en' && !document.cookie.includes('NEXT_LOCALE=')
                          ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                          : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </>
  );
}
