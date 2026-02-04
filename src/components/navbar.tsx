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
  Search
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useLoginModal } from '@/context/LoginModalContext';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useCommandMenu } from '@/context/CommandMenuContext';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  submenu?: NavItem[];
}

interface NavbarProps {
  // onOpenCommandMenu prop is deprecated in favor of CommandMenuContext
  onOpenCommandMenu?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Home',
    href: '/',
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: 'Tools',
    icon: <Hammer className="h-4 w-4" />,
    submenu: [
      { title: 'Gold Price', href: '/tools/gold-price', icon: <Coins className="h-4 w-4 text-warning" /> },
      { title: 'Live Kill Feed', href: '/tools/kill-feed', icon: <Skull className="h-4 w-4 text-red-500" /> },
      { title: 'PvP Intel', href: '/tools/pvp-intel', icon: <Sword className="h-4 w-4" /> },
      { title: 'ZvZ Tracker', href: '/tools/zvz-tracker', icon: <Swords className="h-4 w-4" /> },
      { title: 'Market Flipper', href: '/tools/market-flipper', icon: <Coins className="h-4 w-4" /> },
      { title: 'Craft Planner', href: '/tools/crafting-calc', icon: <Hammer className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Profits',
    icon: <TrendingUp className="h-4 w-4" />,
    submenu: [
      { title: 'Farming', href: '/profits/farming', icon: <Sprout className="h-4 w-4" /> },
      { title: 'Animal', href: '/profits/animal', icon: <PawPrint className="h-4 w-4" /> },
      { title: 'Labour', href: '/profits/labour', icon: <Users className="h-4 w-4" /> },
      { title: 'Enchanting', href: '/profits/enchanting', icon: <Sparkles className="h-4 w-4" /> },
      { title: 'Cooking', href: '/profits/cooking', icon: <Utensils className="h-4 w-4" /> },
      { title: 'Alchemy', href: '/profits/alchemy', icon: <FlaskConical className="h-4 w-4" /> },
      { title: 'Chopped Fish', href: '/profits/chopped-fish', icon: <Fish className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Builds',
    icon: <Shield className="h-4 w-4" />,
    submenu: [
      { title: 'Solo', href: '/builds/solo', icon: <User className="h-4 w-4" /> },
      { title: 'Small Scale', href: '/builds/small-scale', icon: <Users className="h-4 w-4" /> },
      { title: 'PvP', href: '/builds/pvp', icon: <Sword className="h-4 w-4" /> },
      { title: 'ZvZ', href: '/builds/zvz', icon: <Skull className="h-4 w-4" /> },
      { title: 'Large Scale', href: '/builds/large-scale', icon: <Shield className="h-4 w-4" /> },
      { title: 'Group', href: '/builds/group', icon: <Users className="h-4 w-4" /> },
    ],
  },
];

export function Navbar({ onOpenCommandMenu }: NavbarProps) {
  const { user, profile, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<string[]>(['Profits', 'Tools', 'Builds']);
  const { openLoginModal } = useLoginModal();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
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
              {NAV_ITEMS.map((item) => {
                if (item.submenu) {
                  const isActive = activeDropdown === item.title;
                  return (
                    <div key={item.title} className="relative">
                      <button
                        onClick={() => setActiveDropdown(isActive ? null : item.title)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                      >
                        {item.icon}
                        {item.title}
                        <ChevronDown className={`h-4 w-4 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                      </button>

                      {isActive && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <div className="p-1">
                            {item.submenu.map((sub) => (
                              <Link
                                key={sub.href}
                                href={sub.href!}
                                onClick={() => setActiveDropdown(null)}
                                className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                              >
                                {sub.icon}
                                {sub.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.title}
                    href={item.href!}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pathname === item.href ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
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
                onClick={onOpenCommandMenu}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors hidden sm:flex items-center gap-2"
                title="Search (Ctrl+K)"
              >
                <Search className="h-5 w-5" />
                <span className="hidden lg:inline text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</span>
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors" 
                title="Toggle Theme"
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
                  className="relative overflow-hidden hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-amber-900/20"
                >
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent z-10 skew-x-12" />
                  <Crown className="h-3 w-3 relative z-20" />
                  <span className="hidden lg:inline relative z-20">SUPPORT US</span>
                </button>
              )}

              {user ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 group p-1.5 pr-2 hover:bg-accent rounded-full border border-transparent hover:border-border transition-all"
                  >
                    {photoURL ? (
                      <img src={photoURL} alt={displayName} className="h-8 w-8 rounded-full border border-border group-hover:border-amber-500 transition-colors" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center border border-border group-hover:border-amber-500 transition-colors">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium hidden md:block group-hover:text-amber-400 transition-colors max-w-[150px] truncate">
                      {displayName}
                    </span>
                    
                    {/* Badge Icon */}
                    {(profile?.isPremium || profile?.subscription?.status === 'active') && (
                       profile?.subscription?.planType === 'guild' ? (
                          <Shield className="h-3 w-3 text-blue-500 fill-blue-500/20" aria-label="Guild Master" />
                       ) : (
                          <Crown className="h-3 w-3 text-amber-500 fill-amber-500/20" aria-label="Adept" />
                       )
                    )}

                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
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
                          View Profile
                        </Link>
                        <Link 
                          href="/settings"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Settings
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
                          Logout
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
                  <span className="hidden sm:inline">Login</span>
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
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === pathname;
                const isExpanded = expandedMobileGroups.includes(item.title);
                const hasSubmenu = item.submenu && item.submenu.length > 0;

                if (hasSubmenu) {
                  return (
                    <div key={item.title}>
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
                          {item.submenu!.map((sub) => (
                            <Link
                              key={sub.href}
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
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.title}
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
                  onOpenCommandMenu?.();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <Search className="h-4 w-4" />
                Search
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
                   Support Us
                 </button>
              )}
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
