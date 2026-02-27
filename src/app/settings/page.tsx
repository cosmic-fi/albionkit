'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, updateUserProfile, UserProfile, UserPreferences, SocialLinks, GameplayPreferences, checkAccess, processPendingGuildLicense } from '@/lib/user-profile';
import { searchAlbionCharacter, getUserInvoices, cancelUserSubscription, getSubscriptionManagementData, updateUserProfileAndBuildsAction } from './actions';
import { 
  Search, Shield, User as UserIcon, Save, CheckCircle, AlertCircle, 
  Crown, Users, ArrowRight, CreditCard, Clock, Settings as SettingsIcon,
  LogOut, ExternalLink, Edit2, X, Loader2, Bell, Eye, Layout, Monitor, Lock,
  Gamepad2, MessageCircle, Twitter, Twitch, Youtube,
  MapPin, Coins, Zap, Globe, TrendingUp, ShieldCheck, Key, Mail, Smartphone, FileText,
  Trophy,
  Flame
} from 'lucide-react';
import Link from 'next/link';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Select } from '@/components/ui/Select';
import Image from 'next/image';
import { uploadImage } from '@/lib/image-service';
import { toast } from 'sonner';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, verifyBeforeUpdateEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLoginModal } from '@/context/LoginModalContext';

const ROLE_OPTIONS = [
  'Tank', 'Healer', 'Melee DPS', 'Ranged DPS', 'Support', 'Gatherer', 'Crafter'
].map(role => ({ value: role, label: role }));

const REGION_OPTIONS = [
  'Americas', 'Asia', 'Europe'
].map(region => ({ value: region, label: region }));

const SERVER_OPTIONS = [
  { value: 'Americas', label: 'Americas' },
  { value: 'Asia', label: 'Asia' },
  { value: 'Europe', label: 'Europe' }
];

const CITY_OPTIONS = [
  'Thetford', 'Fort Sterling', 'Lymhurst', 'Bridgewatch', 'Martlock', 'Caerleon', 'Brecilien'
].map(city => ({ value: city, label: city }));

import { GuildLicenseDashboard } from '@/components/settings/GuildLicenseDashboard';

import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';

function SettingsContent() {
  const { user, profile: authProfile, loading: authLoading, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openLoginModal } = useLoginModal();
  
  // Track previous login state to distinguish logout from initial navigation
  const wasLoggedIn = useRef(!!user);

  useEffect(() => {
    if (user) {
      wasLoggedIn.current = true;
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      if (wasLoggedIn.current) {
        // User was logged in and is now logged out -> Redirect Home
        router.push('/');
      } else {
        // User navigated here directly without login -> Redirect to Home and Open Modal
        router.push('/');
        // Small timeout to ensure navigation starts/completes so modal opens on destination
        setTimeout(() => openLoginModal('Please sign in to access settings'), 100);
      }
    }
  }, [user, authLoading, router, openLoginModal]);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Search State
  const [searchName, setSearchName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundCharacter, setFoundCharacter] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Profile Edit State
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState<{
      displayName: string;
      bio: string;
      signature: string;
      photoURL: string;
      bannerUrl: string;
      socialLinks: SocialLinks;
      gameplay: GameplayPreferences;
  }>({
      displayName: '',
      bio: '',
      signature: '',
      photoURL: '',
      bannerUrl: '',
      socialLinks: { discord: '', twitter: '', twitch: '', youtube: '' },
      gameplay: { mainRole: undefined, secondaryRole: undefined, region: undefined }
  });

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>({
      emailNotifications: true,
      publicProfile: true,
      showBadges: true,
      compactMode: false,
      defaultServer: 'Americas',
      defaultMarketLocation: 'Thetford',
      showPrices: true,
      reducedMotion: false
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'preferences' | 'profile' | 'security'>('overview');
    const [access, setAccess] = useState<{ 
        hasAccess: boolean; 
        reason: 'none' | 'premium' | 'guild' | 'alliance' | 'pending_guild';
        providerId?: string;
    }>({ hasAccess: false, reason: 'none' });
    const [providerName, setProviderName] = useState<string | null>(null);
  
  // Billing State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([]);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalPlan, setSubscriptionModalPlan] = useState<'personal' | 'guild'>('personal');

  const openSubscriptionModal = (plan: 'personal' | 'guild' = 'personal') => {
      setSubscriptionModalPlan(plan);
      setShowSubscriptionModal(true);
  };

  // Security State
  const [securityForm, setSecurityForm] = useState({
      currentPassword: '',
      newEmail: '',
      newPassword: '',
      confirmNewPassword: ''
  });
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Update edit form when profile is loaded
  useEffect(() => {
    const activeProfile = profile || authProfile;

    if (activeProfile || user) {
      setEditForm({
        displayName: activeProfile?.displayName || activeProfile?.characterName || user?.displayName || '',
        bio: activeProfile?.bio || '',
        signature: activeProfile?.signature || '',
        photoURL: activeProfile?.photoURL || user?.photoURL || '',
        bannerUrl: activeProfile?.bannerUrl || '',
        socialLinks: {
            discord: activeProfile?.socialLinks?.discord || '',
            twitter: activeProfile?.socialLinks?.twitter || '',
            twitch: activeProfile?.socialLinks?.twitch || '',
            youtube: activeProfile?.socialLinks?.youtube || ''
        },
        gameplay: {
            mainRole: activeProfile?.gameplay?.mainRole,
            secondaryRole: activeProfile?.gameplay?.secondaryRole,
            region: activeProfile?.gameplay?.region
        }
      });
      if (activeProfile?.preferences) {
          setPreferences(prev => ({ ...prev, ...activeProfile.preferences }));
      }
    }
  }, [profile, authProfile, user]);

  useEffect(() => {
    if (activeTab === 'billing' && user) {
        setLoadingInvoices(true);
        setLoadingSubscription(true);
        
        // Fetch invoices
        getUserInvoices(user.uid).then(result => {
            if (result.invoices) {
                setInvoices(result.invoices);
            }
            setLoadingInvoices(false);
        });
        
        // Fetch subscription details
        getSubscriptionManagementData(user.uid).then(result => {
            if (result.subscription) {
                setSubscriptionDetails(result.subscription);
            }
            if (result.allSubscriptions) {
                setAllSubscriptions(result.allSubscriptions);
            }
            setLoadingSubscription(false);
        });
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      // Clean up URL
      router.replace('/settings');
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }

    const tab = searchParams.get('tab');
    if (tab && ['overview', 'profile', 'billing', 'preferences', 'security'].includes(tab)) {
        setActiveTab(tab as any);
    }
  }, [searchParams, router]);

  const loadProfile = async () => {
    if (!user) return;
    const data = await getUserProfile(user.uid);
    setProfile(data);
    
    const accessStatus = await checkAccess(user.uid);
          setAccess(accessStatus);

          if (accessStatus.providerId) {
            const provider = await getUserProfile(accessStatus.providerId);
            if (provider) {
                setProviderName(provider.characterName || provider.displayName || 'Anonymous Patron');
            }
          }

          if (data?.characterName) {
      setSearchName(data.characterName);
    }
    setLoading(false);
  };

  const handleCancelSubscription = () => {
    setIsCancelModalOpen(true);
  };

  const confirmCancelSubscription = async () => {
      setIsCancelling(true);
      try {
          if (!user) return;
          const result = await cancelUserSubscription(user.uid);
          if (result.success) {
               setIsCancelModalOpen(false);
               // Simple timeout to allow modal to close before alert
               setTimeout(() => {
                    toast.success('Subscription cancelled successfully. You will retain access until the end of your current billing period.');
               }, 100);
               loadProfile(); // Refresh to show updated status
               // Refresh subscription details
               getSubscriptionManagementData(user.uid).then(res => {
                   if (res.subscription) setSubscriptionDetails(res.subscription);
               });
          } else {
               setIsCancelModalOpen(false);
               setTimeout(() => {
                    toast.error(result.error || 'Failed to cancel subscription');
               }, 100);
          }
      } catch (error) {
          console.error(error);
          setIsCancelModalOpen(false);
          setTimeout(() => {
                toast.error('An unexpected error occurred');
          }, 100);
      } finally {
          setIsCancelling(false);
      }
  };

  const handleSearchCharacter = async () => {
    if (!searchName.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setFoundCharacter(null);

    try {
      const result = await searchAlbionCharacter(searchName);
      
      if (result.error) {
        setSearchError(result.error);
        setIsSearching(false);
        return;
      }

      const players = result.players || [];

      if (players.length === 0) {
        setSearchError('Character not found. Exact match required.');
        setIsSearching(false);
        return;
      }

      const targetPlayer = players[0];
      setFoundCharacter(targetPlayer);

    } catch (err) {
      setSearchError('Failed to connect to Albion API');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLinkCharacter = async () => {
    if (!user || !foundCharacter) return;

    const newProfileData: Partial<UserProfile> = {
      uid: user.uid,
      email: user.email || '',
      characterName: foundCharacter.Name,
      characterId: foundCharacter.Id,
      guildName: foundCharacter.GuildName || null,
      guildId: foundCharacter.GuildId || null,
      allianceName: foundCharacter.AllianceName || null,
      allianceId: foundCharacter.AllianceId || null,
    };

    await updateUserProfile(user.uid, newProfileData);
    
    // Check for pending license
    if (foundCharacter.GuildId) {
        await processPendingGuildLicense(
            user.uid, 
            foundCharacter.GuildId,
            foundCharacter.AllianceId,
            foundCharacter.AllianceName
        );
    }

    setIsEditing(false);
    setFoundCharacter(null);
    await loadProfile();
    await refreshProfile();
  };

  const handleUnlink = () => {
      if (!user) return;
      setIsUnlinkDialogOpen(true);
  };

  const confirmUnlink = async () => {
      if (!user) return;
      setIsUnlinking(true);
      try {
          await updateUserProfile(user.uid, {
              characterName: null as any,
              characterId: null as any,
              guildName: null as any,
              guildId: null as any,
              allianceName: null as any,
              allianceId: null as any
          });
          setIsEditing(false);
          setSearchName('');
          await loadProfile();
          await refreshProfile();
          setIsUnlinkDialogOpen(false);
      } catch (error) {
          console.error('Error unlinking character:', error);
      } finally {
          setIsUnlinking(false);
      }
  };

  const handleSaveProfile = async () => {
      if (!user) return;
      setIsSavingProfile(true);
      try {
          // Use Server Action to update profile and propagate name changes to builds
          const result = await updateUserProfileAndBuildsAction(user.uid, editForm);
          
          if (result.error) {
              throw new Error(result.error);
          }
          
          await loadProfile();
          await refreshProfile();
          toast.success('Profile updated successfully');
      } catch (error) {
          console.error('Error saving profile:', error);
          toast.error('Failed to update profile');
      } finally {
          setIsSavingProfile(false);
      }
  };

  const handleSavePreferences = async (newPrefs: UserPreferences) => {
      if (!user) return;
      setPreferences(newPrefs); // Optimistic update
      setIsSavingPreferences(true);
      try {
          await updateUserProfile(user.uid, { preferences: newPrefs });
          // No need to reload profile, local state is enough for now
      } catch (error) {
          console.error('Error saving preferences:', error);
          // Revert on error? For now just log
      } finally {
          setIsSavingPreferences(false);
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'photoURL' | 'bannerUrl') => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Optimistic preview (optional, or just wait for upload)
      // Upload to ImgBB or similar
      const url = await uploadImage(file);
      if (url) {
          setEditForm(prev => ({ ...prev, [field]: url }));
      }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !securityForm.newEmail) return;
      
      setIsUpdatingSecurity(true);
      try {
          if (user.providerData.some(p => p.providerId === 'password')) {
             if (!securityForm.currentPassword) {
                 toast.error('Current password is required to change email');
                 setIsUpdatingSecurity(false);
                 return;
             }
             const credential = EmailAuthProvider.credential(user.email!, securityForm.currentPassword);
             await reauthenticateWithCredential(user, credential);
          }
          
          await verifyBeforeUpdateEmail(user, securityForm.newEmail);
          await updateUserProfile(user.uid, { email: securityForm.newEmail });
          await refreshProfile();
          toast.success('Verification email sent to new address. Please verify to complete the change.');
          setSecurityForm(prev => ({ ...prev, newEmail: '', currentPassword: '' }));
      } catch (error: any) {
          console.error(error);
          if (error.code === 'auth/wrong-password') {
              toast.error('Incorrect current password');
          } else if (error.code === 'auth/requires-recent-login') {
              toast.error('Please log in again before changing sensitive settings');
          } else {
              toast.error(error.message || 'Failed to update email');
          }
      } finally {
          setIsUpdatingSecurity(false);
      }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      
      if (securityForm.newPassword !== securityForm.confirmNewPassword) {
          toast.error('New passwords do not match');
          return;
      }

      if (securityForm.newPassword.length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
      }

      setIsUpdatingSecurity(true);
      try {
          if (user.providerData.some(p => p.providerId === 'password')) {
             if (!securityForm.currentPassword) {
                 toast.error('Current password is required');
                 setIsUpdatingSecurity(false);
                 return;
             }
             const credential = EmailAuthProvider.credential(user.email!, securityForm.currentPassword);
             await reauthenticateWithCredential(user, credential);
          }
          
          await updatePassword(user, securityForm.newPassword);
          toast.success('Password updated successfully');
          setSecurityForm(prev => ({ ...prev, newPassword: '', confirmNewPassword: '', currentPassword: '' }));
      } catch (error: any) {
          console.error(error);
           if (error.code === 'auth/wrong-password') {
              toast.error('Incorrect current password');
          } else if (error.code === 'auth/requires-recent-login') {
              toast.error('Please log in again before changing sensitive settings');
          } else {
              toast.error(error.message || 'Failed to update password');
          }
      } finally {
          setIsUpdatingSecurity(false);
      }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-3 px-4">
      <h1 className="text-3xl font-bold pt-10 mb-8 flex items-center gap-2">
        <UserIcon className="h-8 w-8 text-primary" />
        Account Dashboard
      </h1>

      {showSuccess && (
        <div className="mb-8 p-4 bg-success/20 border border-success/50 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
          <div>
            <h3 className="font-bold text-success">Payment Successful!</h3>
            <p className="text-success/80 text-sm">Thank you for your support. Your subscription is now active.</p>
          </div>
          <button onClick={() => setShowSuccess(false)} className="ml-auto text-success hover:text-success/80">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs - Mobile Dropdown */}
      <div className="md:hidden mb-8">
        <Select
          options={[
            { value: 'overview', label: 'Overview', icon: <Layout className="h-4 w-4" /> },
            { value: 'profile', label: 'Profile', icon: <UserIcon className="h-4 w-4" /> },
            { value: 'billing', label: 'Subscription & Billing', icon: <CreditCard className="h-4 w-4" /> },
            { value: 'preferences', label: 'Preferences', icon: <SettingsIcon className="h-4 w-4" /> },
            { value: 'security', label: 'Security & Policy', icon: <ShieldCheck className="h-4 w-4" /> }
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          className="w-full"
        />
      </div>

      {/* Navigation Tabs - Desktop */}
      <div className="hidden md:flex gap-4 border-b border-border mb-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'overview' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
              <span className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Overview
              </span>
              {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-2 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'profile' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
              <span className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Profile
              </span>
              {activeTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`pb-4 px-2 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'billing' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription & Billing
              </span>
              {activeTab === 'billing' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
          </button>
          
          {/* Guild Management Tab - Only show if user has purchased a license */}
          {profile?.subscription?.planType === 'guild' && (
             <button 
                onClick={() => setActiveTab('guild_mgmt' as any)}
                className={`pb-4 px-2 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'guild_mgmt' as any ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
             >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Guild License
                  </span>
                  {activeTab === 'guild_mgmt' as any && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
             </button>
          )}

          <button 
            onClick={() => setActiveTab('preferences')}
            className={`pb-4 px-2 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'preferences' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
              <span className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Preferences
              </span>
              {activeTab === 'preferences' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
          </button>
          
          <button 
            onClick={() => setActiveTab('security')}
            className={`pb-4 px-2 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'security' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Security & Policy
              </span>
              {activeTab === 'security' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
            
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Welcome Card */}
                    <div className="bg-gradient-to-r from-primary/15 to-primary/5 rounded-xl border border-primary/30 p-8 relative overflow-hidden">
                         <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Welcome back, {profile?.displayName || user?.displayName || 'Traveler'}
                            </h2>
                            <p className="text-muted-foreground max-w-lg mb-6">
                                Manage your account settings, subscription, and connected Albion Online characters here.
                            </p>
                            
                            {!profile?.characterName && (
                                <button 
                                    onClick={() => document.getElementById('albion-identity')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors flex items-center gap-2"
                                >
                                    Link Character
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            )}
                         </div>
                         <div className="absolute top-0 right-0 p-8 opacity-10">
                             <UserIcon className="w-48 h-48 text-primary" />
                         </div>
                    </div>

                    {/* Subscription Summary (if active) */}
                    {access.hasAccess && (
                        <div className="bg-card backdrop-blur rounded-xl border border-border p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                    <Crown className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="font-bold text-foreground text-lg flex items-center gap-2">
                                        {access.reason === 'guild' ? 'Guild Master Status Active' : 'Adept Status Active'}
                                        {access.reason === 'guild' && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">Guild</span>}
                                        {access.reason === 'alliance' && <span className="text-xs bg-info/20 text-info px-2 py-0.5 rounded-full border border-info/30">Alliance</span>}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                         {profile?.subscription?.renewsAt 
                                            ? `Next billing date: ${new Date(profile.subscription.renewsAt).toLocaleDateString()}` 
                                            : profile?.subscription?.endsAt ? (
                                                `Access expires on: ${new Date(profile.subscription.endsAt).toLocaleDateString()}`
                                            ) : access.providerId ? (
                                                 <span className="text-primary/80">
                                                     Provided by{' '}
                                                     <Link href={`/user/${access.providerId}`} className="hover:underline hover:text-primary transition-colors">
                                                         {providerName || 'a guild member'}
                                                     </Link>
                                                 </span>
                                             ) : 'Lifetime Access'}
                                     </div>
                                </div>
                            </div>
                            {access.reason === 'premium' && (
                                <button 
                                    onClick={() => setActiveTab('billing')}
                                    className="text-sm font-bold text-muted-foreground bg-accent px-4 p-2 rounded-md hover:text-foreground transition-colors"
                                >
                                    Manage Subscription
                                </button>
                            )}
                        </div>
                    )}

                    {/* Albion Identity Card */}
                    <div id="albion-identity" className="bg-card backdrop-blur rounded-xl border border-border p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-muted-foreground" />
                                    Albion Identity
                                </h2>
                                <p className="text-muted-foreground text-sm">Link your character to unlock Guild/Alliance features.</p>
                            </div>
                            {profile?.characterName && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors bg-accent hover:bg-accent/80 px-3 py-1.5 rounded-lg border border-border"
                                >
                                    <Edit2 className="h-3 w-3" /> Edit
                                </button>
                            )}
                        </div>

                        {/* Search Mode */}
                        {(isEditing || !profile?.characterName) && (
                            <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Search Character</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchName}
                                        onChange={(e) => setSearchName(e.target.value)}
                                        placeholder="Ex: Syndic"
                                        className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:border-primary outline-none transition-colors"
                                    />
                                    <button
                                        onClick={handleSearchCharacter}
                                        disabled={isSearching}
                                        className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        {isSearching ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="h-4 w-4" />}
                                        Find
                                    </button>
                                </div>
                                {searchError && (
                                    <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" /> {searchError}
                                    </p>
                                )}
                                {isEditing && (
                                    <div className="mt-4 flex gap-4">
                                         <button onClick={() => setIsEditing(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                                         <button onClick={handleUnlink} className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
                                            <LogOut className="h-3 w-3" /> Unlink Account
                                         </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Found Character Preview */}
                        {foundCharacter && (
                            <div className="bg-card rounded-lg p-4 border border-amber-500/30 mb-6 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-accent rounded-full flex items-center justify-center border border-border">
                                        <UserIcon className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-lg font-bold text-foreground">{foundCharacter.Name}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                                            {foundCharacter.GuildName && <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> {foundCharacter.GuildName}</span>}
                                            {foundCharacter.AllianceName && <span className="text-muted-foreground">[{foundCharacter.AllianceName}]</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLinkCharacter}
                                        className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Current Linked Display */}
                        {profile?.characterName && !isEditing && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-card rounded-lg border border-border flex items-center gap-4">
                                    <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center border border-border text-muted-foreground">
                                        <UserIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase mb-0.5">Character</div>
                                        <div className="font-bold text-foreground">{profile.characterName}</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-card rounded-lg border border-border flex items-center gap-4">
                                    <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center border border-border text-muted-foreground">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase mb-0.5">Guild</div>
                                        <div className="font-bold text-foreground">
                                            {profile.guildName || <span className="text-muted-foreground italic">No Guild</span>}
                                        </div>
                                    </div>
                                </div>
                             </div>
                        )}
                        
                        {access.reason === 'pending_guild' && (
                             <div className="mt-6 p-4 bg-primary/20 border border-primary/50 rounded-lg flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-primary text-sm">Action Required</h4>
                                    <p className="text-primary/80 text-xs mt-1">
                                        You have purchased a Guild License but haven't linked a guild yet. 
                                        Link your character above to activate your license.
                                    </p>
                                </div>
                             </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                 <div className="bg-card backdrop-blur rounded-xl border border-border overflow-hidden p-6 relative">
                    <div className="space-y-6">
                        {/* Visual Identity */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Banner & Profile Picture</label>
                            </div>
                            
                            {/* Banner & Avatar Container */}
                            <div className="relative group rounded-xl overflow-visible bg-card">
                                {/* Banner */}
                                <div className="h-48 w-full relative rounded-xl overflow-hidden border border-border bg-muted">
                                    {editForm.bannerUrl ? (
                                        <Image src={editForm.bannerUrl} alt="Banner" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <span className="text-sm">No Banner Set</span>
                                        </div>
                                    )}
                                    {/* Banner Edit Overlay */}
                                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-200 z-10">
                                        <div className="bg-popover text-foreground px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform  border border-border">
                                            <Edit2 className="h-4 w-4" /> Change Banner
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'bannerUrl')} />
                                    </label>
                                </div>

                                {/* Avatar (Overlapping) */}
                                <div className="absolute -bottom-10 left-4 z-20">
                                    <div className="w-24 h-24 rounded-full bg-card border-4 border-card overflow-hidden relative group/avatar ">
                                        {editForm.photoURL ? (
                                            <Image src={editForm.photoURL} alt="Avatar" fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                                                <UserIcon className="h-8 w-8" />
                                            </div>
                                        )}
                                        {/* Avatar Edit Overlay */}
                                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                            <Edit2 className="h-5 w-5 text-foreground" />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'photoURL')} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Spacer for Avatar overflow */}
                            <div className="h-6"></div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-border w-full" />

                        {/* Info Fields */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wider">Display Name</label>
                                <input
                                    type="text"
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:border-primary outline-none transition-colors"
                                    placeholder="How you want to be seen"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wider">Bio</label>
                                        <span className={`text-xs ${editForm.bio.length >= 500 ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {editForm.bio.length}/500
                                        </span>
                                    </div>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                        maxLength={500}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:border-primary outline-none transition-colors min-h-[120px] resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wider">Signature</label>
                                        <span className={`text-xs ${editForm.signature.length >= 60 ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {editForm.signature.length}/60
                                        </span>
                                    </div>
                                    <textarea
                                        value={editForm.signature}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, signature: e.target.value }))}
                                        maxLength={60}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:border-primary outline-none transition-colors min-h-[120px] resize-none"
                                        placeholder="A short quote or tagline displayed under your name"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-border w-full" />

                        {/* Gameplay Preferences */}
                        <div>
                             <div className="flex items-center gap-2 mb-4">
                                <Gamepad2 className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Gameplay Preferences</h3>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wider">Main Role</label>
                                    <Select
                                        value={editForm.gameplay?.mainRole}
                                        onChange={(value) => setEditForm(prev => ({ 
                                            ...prev, 
                                            gameplay: { ...prev.gameplay, mainRole: value as any } 
                                        }))}
                                        options={ROLE_OPTIONS}
                                        placeholder="Select Role"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wider">Secondary Role</label>
                                    <Select
                                        value={editForm.gameplay?.secondaryRole}
                                        onChange={(value) => setEditForm(prev => ({ 
                                            ...prev, 
                                            gameplay: { ...prev.gameplay, secondaryRole: value as any } 
                                        }))}
                                        options={ROLE_OPTIONS}
                                        placeholder="Select Role"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wider">Region</label>
                                    <Select
                                        value={editForm.gameplay?.region}
                                        onChange={(value) => setEditForm(prev => ({ 
                                            ...prev, 
                                            gameplay: { ...prev.gameplay, region: value as any } 
                                        }))}
                                        options={REGION_OPTIONS}
                                        placeholder="Select Region"
                                    />
                                </div>
                             </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-border w-full" />

                        {/* Social Links */}
                        <div>
                             <div className="flex items-center gap-2 mb-4">
                                <Users className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Social Links</h3>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wider">Discord</label>
                                    <div className="relative">
                                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={editForm.socialLinks?.discord || ''}
                                            onChange={(e) => setEditForm(prev => ({ 
                                                ...prev, 
                                                socialLinks: { ...prev.socialLinks, discord: e.target.value } 
                                            }))}
                                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary outline-none transition-colors"
                                            placeholder="username"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wider">Twitter (X)</label>
                                    <div className="relative">
                                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={editForm.socialLinks?.twitter || ''}
                                            onChange={(e) => setEditForm(prev => ({ 
                                                ...prev, 
                                                socialLinks: { ...prev.socialLinks, twitter: e.target.value } 
                                            }))}
                                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary outline-none transition-colors"
                                            placeholder="@username"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wider">Twitch</label>
                                    <div className="relative">
                                        <Twitch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={editForm.socialLinks?.twitch || ''}
                                            onChange={(e) => setEditForm(prev => ({ 
                                                ...prev, 
                                                socialLinks: { ...prev.socialLinks, twitch: e.target.value } 
                                            }))}
                                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary outline-none transition-colors"
                                            placeholder="channel"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wider">YouTube</label>
                                    <div className="relative">
                                        <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={editForm.socialLinks?.youtube || ''}
                                            onChange={(e) => setEditForm(prev => ({ 
                                                ...prev, 
                                                socialLinks: { ...prev.socialLinks, youtube: e.target.value } 
                                            }))}
                                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary outline-none transition-colors"
                                            placeholder="channel"
                                        />
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Save Button (Bottom Right) */}
                        <div className="flex justify-end pt-4 border-t border-border">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors flex items-center gap-2  "
                            >
                                {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                 </div>
            )}

            {/* Guild Management Content */}
        {activeTab === 'guild_mgmt' as any && user && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <GuildLicenseDashboard uid={user.uid} userProfile={profile} />
            </div>
        )}

        {activeTab === 'billing' && (
                <div className="space-y-6">
                    {/* Subscription Details */}
                    <div className="bg-card backdrop-blur rounded-xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <Crown className="h-5 w-5 text-primary" />
                            Subscription Management
                        </h2>

                        {loadingSubscription ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-4 bg-muted rounded w-1/4"></div>
                                <div className="h-10 bg-muted rounded"></div>
                            </div>
                        ) : subscriptionDetails ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                        <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Current Plan</div>
                                        <div className="text-lg font-bold text-foreground mb-1">
                                            {(subscriptionDetails.productName.toLowerCase().includes('personal') || subscriptionDetails.productName.toLowerCase().includes('adept')) ? 'Adept' : 
                                             subscriptionDetails.productName.toLowerCase().includes('guild') ? 'Guild Master' : 
                                             subscriptionDetails.productName} 
                                            {' - '}
                                            {(subscriptionDetails.variantName.toLowerCase().includes('year') || subscriptionDetails.productName.toLowerCase().includes('year')) ? 'Yearly' : 'Monthly'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                                subscriptionDetails.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                                subscriptionDetails.status === 'cancelled' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                                'bg-secondary border-secondary text-muted-foreground'
                                            }`}>
                                                {subscriptionDetails.status.toUpperCase()}
                                            </span>
                                            {subscriptionDetails.amountFormatted && (
                                                <span className="text-sm text-muted-foreground">
                                                    {subscriptionDetails.amountFormatted} / {(subscriptionDetails.variantName.toLowerCase().includes('year') || subscriptionDetails.productName.toLowerCase().includes('year')) ? 'year' : 'month'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                        <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Payment Method</div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                                            <div className="text-foreground font-medium">
                                                {subscriptionDetails.cardBrand} •••• {subscriptionDetails.cardLastFour}
                                            </div>
                                        </div>
                                        {subscriptionDetails.renewsAt && subscriptionDetails.status === 'active' && (
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Next billing: {new Date(subscriptionDetails.renewsAt).toLocaleDateString()}
                                            </div>
                                        )}
                                        {subscriptionDetails.endsAt && subscriptionDetails.status === 'cancelled' && (
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Access ends: {new Date(subscriptionDetails.endsAt).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                                    {subscriptionDetails.updatePaymentMethodUrl && (
                                        <a 
                                            href={subscriptionDetails.updatePaymentMethodUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            Update Payment Method
                                        </a>
                                    )}
                                    
                                    {subscriptionDetails.customerPortalUrl && (
                                        <a 
                                            href={subscriptionDetails.customerPortalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Customer Portal
                                        </a>
                                    )}

                                    {subscriptionDetails.status === 'active' && (
                                        <button 
                                            onClick={() => setIsCancelModalOpen(true)}
                                            className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ml-auto"
                                        >
                                            Cancel Subscription
                                        </button>
                                    )}

                                    {/* Renew / Upgrade Button */}
                                    <button 
                                        onClick={() => openSubscriptionModal(subscriptionDetails.status === 'cancelled' ? 'personal' : 'guild')}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
                                            subscriptionDetails.status === 'cancelled' 
                                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                                            : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                                        }`}
                                    >
                                        <Crown className="h-4 w-4" />
                                        {subscriptionDetails.status === 'cancelled' ? 'Renew Subscription' : 'View Plans & Upgrades'}
                                    </button>
                                </div>
                                
                                {/* Guild Master Upgrade Banner for Adept Users */}
                                {subscriptionDetails.status === 'active' && 
                                 (subscriptionDetails.productName.toLowerCase().includes('personal') || subscriptionDetails.productName.toLowerCase().includes('adept')) && (
                                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                                <Trophy className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground">Upgrade to Guild Master</div>
                                                <div className="text-sm text-muted-foreground">Get Adept status for all your guild members + analytics!</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => openSubscriptionModal('guild')}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap  -900/20"
                                        >
                                            Upgrade
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Crown className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2">No Active Subscription</h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    Upgrade to a Supporter plan to unlock exclusive features, badges, and support the development of the platform.
                                </p>
                                <button 
                                    onClick={() => openSubscriptionModal('personal')}
                                    className="relative overflow-hidden inline-flex px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold transition-colors items-center justify-center gap-2"
                                >
                                    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent z-10 skew-x-12" />
                                    <span className="relative z-20 flex items-center gap-2">
                                        View Plans
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Other Subscriptions List (if multiple exist) */}
                    {allSubscriptions && allSubscriptions.filter((sub: any) => sub.productName && sub.lemonSqueezySubscriptionId !== subscriptionDetails?.lemonSqueezySubscriptionId).length > 0 && (
                        <div className="bg-card backdrop-blur rounded-xl border border-border p-6">
                            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                                <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                                Other Subscriptions
                            </h2>
                            <div className="space-y-4">
                                {allSubscriptions.filter((sub: any) => sub.productName && sub.lemonSqueezySubscriptionId !== subscriptionDetails?.lemonSqueezySubscriptionId).sort((a: any, b: any) => (a.status === 'active' ? -1 : 1)).map((sub: any) => (
                                    <div key={sub.lemonSqueezySubscriptionId} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg border border-border gap-4">
                                        <div>
                                            <div className="font-bold text-foreground flex items-center gap-2">
                                                {sub.productName} 
                                                <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
                                                    {sub.variantName}
                                                </span>
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                                                <span className={`flex items-center gap-1.5 ${
                                                    sub.status === 'active' ? 'text-green-400' : 
                                                    sub.status === 'cancelled' ? 'text-red-400' : 'text-muted-foreground'
                                                }`}>
                                                    <div className={`h-1.5 w-1.5 rounded-full ${
                                                        sub.status === 'active' ? 'bg-green-400' : 
                                                        sub.status === 'cancelled' ? 'bg-red-400' : 'bg-muted-foreground'
                                                    }`} />
                                                    {sub.status.toUpperCase()}
                                                </span>
                                                {sub.endsAt && sub.status === 'cancelled' && (
                                                    <span>Ends: {new Date(sub.endsAt).toLocaleDateString()}</span>
                                                )}
                                                {sub.renewsAt && sub.status === 'active' && (
                                                    <span>Renews: {new Date(sub.renewsAt).toLocaleDateString()}</span>
                                                )}
                                                <span className="text-muted-foreground/50 text-xs">ID: {sub.lemonSqueezySubscriptionId}</span>
                                            </div>
                                        </div>
                                        {sub.customerPortalUrl && (
                                            <a 
                                                href={sub.customerPortalUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-bold text-sm transition-colors text-center whitespace-nowrap"
                                            >
                                                Manage Plan
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-card backdrop-blur rounded-xl border border-border p-6">
                        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            Billing History
                        </h2>
                        
                        <div className="overflow-hidden rounded-lg border border-border">
                             <table className="w-full text-left text-sm text-muted-foreground">
                                <thead className="bg-muted/50 text-xs uppercase font-medium text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Description</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-muted/20">
                                    {loadingInvoices ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                                <div className="flex justify-center items-center gap-2">
                                                    <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-foreground rounded-full" />
                                                    Loading invoices...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : invoices.length > 0 ? (
                                        invoices.map((invoice) => (
                                            <tr key={invoice.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(invoice.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">Subscription Renewal</td>
                                                <td className="px-6 py-4 font-mono text-foreground">{invoice.amount}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        invoice.status === 'paid' 
                                                        ? 'bg-green-900/30 text-green-400' 
                                                        : 'bg-secondary text-muted-foreground'
                                                    }`}>
                                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {invoice.receiptUrl && (
                                                        <a 
                                                            href={invoice.receiptUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:text-primary/80 text-xs font-bold flex items-center gap-1 justify-end ml-auto"
                                                        >
                                                            <ExternalLink className="h-3 w-3" /> PDF
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">
                                                No billing history found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'preferences' && (
                 <div className="bg-card backdrop-blur rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-slate-400" />
                            App Preferences
                        </h2>
                        {isSavingPreferences && (
                            <span className="text-xs text-amber-500 animate-pulse">Saving...</span>
                        )}
                    </div>
                    
                    <div className="space-y-8">
                        
                        {/* Regional & Market */}
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Regional & Market
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-1">Default Server</label>
                                        <p className="text-xs text-muted-foreground mb-3">Preferred server for killboards and stats.</p>
                                        <Select
                                            value={preferences.defaultServer}
                                            onChange={(val) => handleSavePreferences({ ...preferences, defaultServer: val as any })}
                                            options={SERVER_OPTIONS}
                                            placeholder="Select Server"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-1">Default Market City</label>
                                        <p className="text-xs text-muted-foreground mb-3">Default location for market calculations.</p>
                                        <Select
                                            value={preferences.defaultMarketLocation}
                                            onChange={(val) => handleSavePreferences({ ...preferences, defaultMarketLocation: val as any })}
                                            options={CITY_OPTIONS}
                                            placeholder="Select City"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interface & Accessibility */}
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                Interface & Accessibility
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Compact Mode */}
                                <div className="p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-purple-400">
                                            <Layout className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">Compact Mode</div>
                                            <div className="text-xs text-muted-foreground">Denser information density</div>
                                        </div>
                                     </div>
                                     <button 
                                        onClick={() => handleSavePreferences({ ...preferences, compactMode: !preferences.compactMode })}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${preferences.compactMode ? 'bg-primary' : 'bg-secondary'}`}
                                     >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full  transition-all ${preferences.compactMode ? 'right-1' : 'left-1'}`} />
                                     </button>
                                </div>

                                {/* Show Prices */}
                                <div className="p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-green-400">
                                            <Coins className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">Show Market Prices</div>
                                            <div className="text-xs text-muted-foreground">Display estimated silver values</div>
                                        </div>
                                     </div>
                                     <button 
                                        onClick={() => handleSavePreferences({ ...preferences, showPrices: !preferences.showPrices })}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${preferences.showPrices ? 'bg-primary' : 'bg-secondary'}`}
                                     >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full  transition-all ${preferences.showPrices ? 'right-1' : 'left-1'}`} />
                                     </button>
                                </div>

                                {/* Reduced Motion */}
                                <div className="p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-blue-400">
                                            <Zap className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">Reduced Motion</div>
                                            <div className="text-xs text-muted-foreground">Minimize animations</div>
                                        </div>
                                     </div>
                                     <button 
                                        onClick={() => handleSavePreferences({ ...preferences, reducedMotion: !preferences.reducedMotion })}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${preferences.reducedMotion ? 'bg-primary' : 'bg-secondary'}`}
                                     >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full  transition-all ${preferences.reducedMotion ? 'right-1' : 'left-1'}`} />
                                     </button>
                                </div>

                                {/* Show Badges */}
                                <div className="p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-yellow-400">
                                            <Crown className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">Show Badges</div>
                                            <div className="text-xs text-muted-foreground">Display rank and achievements</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleSavePreferences({ ...preferences, showBadges: !preferences.showBadges })}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${preferences.showBadges ? 'bg-primary' : 'bg-secondary'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full  transition-all ${preferences.showBadges ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Privacy & Notifications */}
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Privacy & Notifications
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Public Profile */}
                                <div className="p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-blue-400">
                                            <Eye className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">Public Profile</div>
                                            <div className="text-xs text-muted-foreground">Allow others to view your profile</div>
                                        </div>
                                     </div>
                                     <button 
                                        onClick={() => handleSavePreferences({ ...preferences, publicProfile: !preferences.publicProfile })}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${preferences.publicProfile ? 'bg-primary' : 'bg-secondary'}`}
                                     >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full  transition-all ${preferences.publicProfile ? 'right-1' : 'left-1'}`} />
                                     </button>
                                </div>

                                {/* Email Notifications */}
                                <div className="p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-amber-400">
                                            <Bell className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">Email Notifications</div>
                                            <div className="text-xs text-muted-foreground">Updates and alerts</div>
                                        </div>
                                     </div>
                                     <button 
                                        onClick={() => handleSavePreferences({ ...preferences, emailNotifications: !preferences.emailNotifications })}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${preferences.emailNotifications ? 'bg-primary' : 'bg-secondary'}`}
                                     >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full  transition-all ${preferences.emailNotifications ? 'right-1' : 'left-1'}`} />
                                     </button>
                                </div>
                            </div>
                        </div>

                        {/* Market Intelligence (Premium) */}
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Market Intelligence
          {!access.hasAccess && (
            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">SUPPORTERS ONLY</span>
          )}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Market Alerts */}
                                <div className={`p-4 rounded-lg border flex items-center justify-between ${!access.hasAccess ? 'bg-muted/30 border-border/50 opacity-70' : 'bg-muted/50 border-border'}`}>
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-green-400">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">Market Watchlist Alerts</div>
                                            <div className="text-xs text-muted-foreground">Notify when watched items are profitable</div>
                                        </div>
                                     </div>
                                     <button 
                                        disabled={!access.hasAccess}
                                        onClick={() => handleSavePreferences({ ...preferences, marketAlerts: !preferences.marketAlerts })}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${preferences.marketAlerts ? 'bg-primary' : 'bg-secondary'} ${!access.hasAccess ? 'cursor-not-allowed opacity-50' : ''}`}
                                     >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full  transition-all ${preferences.marketAlerts ? 'right-1' : 'left-1'}`} />
                                     </button>
                                </div>

                                {/* Gold Price Alerts */}
                                <div className={`p-4 rounded-lg border flex items-center justify-between ${!access.hasAccess ? 'bg-muted/30 border-border/50 opacity-70' : 'bg-muted/50 border-border'}`}>
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-yellow-400">
                                            <Coins className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">Gold Price Alerts</div>
                                            <div className="text-xs text-muted-foreground">Notify on price drops/spikes</div>
                                        </div>
                                     </div>
                                     <button 
                                        disabled={!access.hasAccess}
                                        onClick={() => handleSavePreferences({ ...preferences, goldAlerts: !preferences.goldAlerts })}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${preferences.goldAlerts ? 'bg-primary' : 'bg-secondary'} ${!access.hasAccess ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full  transition-all ${preferences.goldAlerts ? 'right-1' : 'left-1'}`} />
                                     </button>
                                </div>
                            </div>
                        </div>

                    </div>
                 </div>
            )}

            {activeTab === 'security' && (
                 <div className="bg-card backdrop-blur rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Security & Policy
                        </h2>
                    </div>

                    <div className="space-y-8">
                        {/* Account Security Section */}
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Account Security
                            </h3>
                            
                            {user?.providerData.some(p => p.providerId === 'password') ? (
                                <div className="space-y-6">
                                    {/* Change Email */}
                                    <div className="p-6 bg-muted/30 rounded-lg border border-border">
                                        <h4 className="font-bold text-foreground mb-4">Change Email Address</h4>
                                        <form onSubmit={handleUpdateEmail} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-muted-foreground font-medium">New Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <input 
                                                        type="email" 
                                                        required
                                                        value={securityForm.newEmail}
                                                        onChange={(e) => setSecurityForm(prev => ({ ...prev, newEmail: e.target.value }))}
                                                        className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary outline-none"
                                                        placeholder="new@email.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-muted-foreground font-medium">Current Password (Required)</label>
                                                <div className="relative">
                                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <input 
                                                        type="password" 
                                                        required
                                                        value={securityForm.currentPassword}
                                                        onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                        className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary outline-none"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={isUpdatingSecurity || !securityForm.newEmail || !securityForm.currentPassword}
                                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                                            >
                                                {isUpdatingSecurity ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                Update Email
                                            </button>
                                        </form>
                                    </div>

                                    {/* Change Password */}
                                    <div className="p-6 bg-muted/30 rounded-lg border border-border">
                                        <h4 className="font-bold text-foreground mb-4">Change Password</h4>
                                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-muted-foreground font-medium">Current Password</label>
                                                <div className="relative">
                                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <input 
                                                        type="password" 
                                                        required
                                                        value={securityForm.currentPassword}
                                                        onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                        className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary outline-none"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground font-medium">New Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <input 
                                                            type="password" 
                                                            required
                                                            minLength={6}
                                                            value={securityForm.newPassword}
                                                            onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary outline-none"
                                                            placeholder="••••••••"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground font-medium">Confirm New Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <input 
                                                            type="password" 
                                                            required
                                                            minLength={6}
                                                            value={securityForm.confirmNewPassword}
                                                            onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                                                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary outline-none"
                                                            placeholder="••••••••"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={isUpdatingSecurity || !securityForm.newPassword || !securityForm.currentPassword}
                                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                                            >
                                                {isUpdatingSecurity ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                Update Password
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-4">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-400 mb-1">Managed by Google</h4>
                                        <p className="text-sm text-blue-400/80 mb-4">
                                            You are logged in with your Google account ({user?.email}). 
                                            To change your password or update your security settings, please visit your Google Account settings.
                                        </p>
                                        <a 
                                            href="https://myaccount.google.com/" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-fit text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            Go to Google Account <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Policies Section */}
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Policies & Legal
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link href="/privacy" className="p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors group flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-foreground">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">Privacy Policy</div>
                                            <div className="text-xs text-muted-foreground">How we handle your data</div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                </Link>
                                <Link href="/terms" className="p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors group flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary text-foreground">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">Terms of Service</div>
                                            <div className="text-xs text-muted-foreground">Rules and regulations</div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                </Link>
                            </div>
                        </div>
                    </div>
                 </div>
            )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
            {/* Account Status Widget */}
            <div className="bg-card backdrop-blur rounded-xl border border-border p-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Account Status</h3>
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${access.hasAccess ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                        <Crown className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="font-bold text-foreground text-lg">
                            {access.hasAccess ? 'Supporter' : 'Free Plan'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {access.hasAccess ? 'Thank you for your support!' : 'Upgrade to unlock features'}
                        </div>
                    </div>
                </div>

                {authProfile?.currentStreak && authProfile.currentStreak > 0 && (
                    <div className="mb-6 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                            <div>
                                <div className="text-xs font-bold text-orange-500 uppercase">Login Streak</div>
                                <div className="text-lg font-black text-foreground">{authProfile.currentStreak} Days</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-muted-foreground uppercase">Best</div>
                            <div className="text-sm font-bold text-foreground">{authProfile.longestStreak || authProfile.currentStreak}</div>
                        </div>
                    </div>
                )}
                {!access.hasAccess ? (
                    <button 
                        onClick={() => openSubscriptionModal('personal')}
                        className="block w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-center rounded-lg transition-colors text-sm"
                    >
                        {authProfile?.preferences?.hasUsedTrial ? 'Unlock Adept' : 'Try it out for Free'}
                    </button>
                ) : profile?.subscription?.status === 'cancelled' ? (
                     <button 
                        onClick={() => openSubscriptionModal('personal')}
                        className="block w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-center rounded-lg transition-colors text-sm"
                    >
                        Renew Membership
                    </button>
                ) : (access.reason === 'premium' && profile?.subscription?.planType !== 'guild') ? (
                     <button 
                        onClick={() => openSubscriptionModal('guild')}
                        className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-lg transition-colors text-sm"
                    >
                        Upgrade to Guild Master
                    </button>
                ) : null}
            </div>

            {/* Quick Actions */}
            <div className="bg-card backdrop-blur rounded-xl border border-border p-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="space-y-2">
                    <Link href={`/user/${user?.uid}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                        <span className="text-sm text-muted-foreground group-hover:text-foreground">Public Profile</span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </Link>
                    <Link href="/tools/market-flipper" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                        <span className="text-sm text-muted-foreground group-hover:text-foreground">Market Flipper</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </Link>
                </div>
            </div>

            <div className="bg-gradient-to-br from-[#1DA1F2]/20 to-[#1DA1F2]/10 rounded-xl border border-[#1DA1F2]/30 p-6">
                 <h3 className="text-lg font-bold text-[#1DA1F2] mb-2">Stay Updated!</h3>
                 <p className="text-sm text-[#1DA1F2]/80 mb-4">
                     Follow us on Twitter for the latest updates, features, and market insights.
                 </p>
                 <a 
                   href="https://twitter.com/Albion_Kit"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center justify-center gap-2 w-full py-2 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] border border-[#1DA1F2]/30 rounded-lg text-sm font-bold transition-colors"
                 >
                     <Twitter className="h-4 w-4" />
                     Follow @Albion_Kit
                 </a>
            </div>
        </div>

      </div>
    
      <ConfirmationDialog
        isOpen={isCancelModalOpen}
        onClose={() => !isCancelling && setIsCancelModalOpen(false)}
        onConfirm={confirmCancelSubscription}
        title="Cancel Subscription"
        description="Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period."
        confirmText="Yes, Cancel"
        cancelText="Keep Subscription"
        variant="danger"
        loading={isCancelling}
      />

      <ConfirmationDialog
        isOpen={isUnlinkDialogOpen}
        onClose={() => setIsUnlinkDialogOpen(false)}
        onConfirm={confirmUnlink}
        title="Unlink Character"
        description="Are you sure you want to unlink your character? You will lose access to Guild License features and other character-specific benefits."
        confirmText="Unlink Character"
        variant="danger"
        loading={isUnlinking}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        initialPlan={subscriptionModalPlan}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 flex justify-center text-slate-400">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
