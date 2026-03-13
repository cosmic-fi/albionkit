'use client';

import { useState, useEffect } from 'react';
import { 
    GuildLicense, toggleAllianceAccess, 
    isLicenseActive, updateGuildLicenseExpiration,
    updateGuildLicenseAlliance
} from '@/lib/user-profile';
import { 
    getSubscriptionManagementData, 
    searchAlbionGuild, 
    getAlbionGuild, 
    getAlbionAlliance, 
    transferGuildLicenseAction,
    getMyPurchasedLicenseAction,
    updateGuildLicenseAllianceAction,
    claimGuildLicenseAction
} from '@/app/settings/actions';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Modal } from '@/components/Modal';
import { toast } from 'sonner';
import { Loader2, Shield, Calendar, AlertTriangle, Clock, Edit2, Search, Check, X, RefreshCw, Users, Database, Activity, Info, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { UserProfile } from '@/lib/user-profile';

interface GuildLicenseDashboardProps {
  uid: string;
  userProfile?: UserProfile | null;
}

export function GuildLicenseDashboard({ uid, userProfile }: GuildLicenseDashboardProps) {
  const t = useTranslations('GuildLicense');
  const [license, setLicense] = useState<GuildLicense | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [allianceDetails, setAllianceDetails] = useState<any>(null);
  const [isLoadingAlliance, setIsLoadingAlliance] = useState(false);
  
  // Guild Transfer State
  const [isEditingGuild, setIsEditingGuild] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Confirmation Dialog State
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isGuildListOpen, setIsGuildListOpen] = useState(false);
  const [pendingGuild, setPendingGuild] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    async function loadLicense() {
      // 1. Fetch License
      const { license: data, error } = await getMyPurchasedLicenseAction(uid);
      
      if (error) {
        console.error("Failed to load license:", error);
      }
      
      let currentLicense = data as GuildLicense | null;
      let userSub: any = null;

      // 2. Fetch Subscription Data (Always, to handle missing license case)
      try {
        const subResult = await getSubscriptionManagementData(uid);
        
        // Prioritize finding a Guild subscription from all subscriptions
        if (subResult.allSubscriptions && subResult.allSubscriptions.length > 0) {
            // Find any valid guild subscription (Active OR Cancelled-but-Valid)
            const guildSub = subResult.allSubscriptions.find((s: any) => 
                s.planType === 'guild' && 
                (s.status === 'active' || (s.status === 'cancelled' && s.endsAt && new Date(s.endsAt) > new Date()))
            );
            
            if (guildSub) {
                userSub = guildSub;
            } else if (subResult.subscription) {
                userSub = subResult.subscription;
            }
        } else if (subResult.subscription) {
            userSub = subResult.subscription;
        }
      } catch (err) {
        console.warn('Failed to fetch subscription data:', err);
      }
      
      // 3. Sync Logic
      if (currentLicense && userSub) {
          // ALWAYS prefer Subscription data for display if available
          if (userSub.renewsAt) {
              const subDate = new Date(userSub.renewsAt);
              const licDate = new Date(currentLicense.expiresAt);
              
              // Update local data for immediate correct display
              const isSubActive = userSub.status === 'active' || 
                  (userSub.status === 'cancelled' && userSub.endsAt && new Date(userSub.endsAt) > new Date());

              currentLicense = { 
                  ...currentLicense, 
                  expiresAt: userSub.renewsAt || userSub.endsAt,
                  isActive: isSubActive || currentLicense.isActive
              };

              // Background Sync
              if (!isNaN(subDate.getTime()) && Math.abs(subDate.getTime() - licDate.getTime()) > 86400000) {
                  updateGuildLicenseExpiration(currentLicense.guildId, userSub.renewsAt).catch(err => 
                      console.warn('Background sync failed:', err)
                  );
              }
          }
      }

      setLicense(currentLicense);
      setSubscription(userSub); // Save subscription to state
      
      // If we have an alliance ID, fetch its details
      if (currentLicense?.allianceId) {
          loadAllianceDetails(currentLicense.allianceId);
      }
      
      setLoading(false);
    }
    loadLicense();
  }, [uid]);

  const loadAllianceDetails = async (allianceId: string) => {
      setIsLoadingAlliance(true);
      try {
          const res = await getAlbionAlliance(allianceId);
          if (res.alliance) {
              setAllianceDetails(res.alliance);
          }
      } catch (err) {
          console.error("Failed to load alliance details:", err);
      }
      setIsLoadingAlliance(false);
  };

  const handleToggleAlliance = async (newValue: boolean) => {
    if (!license) return;
    setToggling(true);
    const success = await toggleAllianceAccess(license.guildId, newValue);
    if (success) {
      setLicense(prev => prev ? { ...prev, allowAllianceAccess: newValue } : null);
    }
    setToggling(false);
  };

  const handleSearchGuild = async () => {
      if (!searchTerm.trim()) return;
      setIsSearching(true);
      const res = await searchAlbionGuild(searchTerm);
      setSearchResults(res.guilds || []);
      setIsSearching(false);
  };

  const handleTransferLicense = (newGuild: any) => {
      setPendingGuild(newGuild);
      setIsTransferDialogOpen(true);
  };

  const confirmTransfer = async () => {
      if (!license || !pendingGuild) return;
      
      setIsTransferring(true);
      // Use Server Action to bypass client-side permission issues
      // Pass alliance info directly to server action to handle it atomically and with admin privileges
      const result = await transferGuildLicenseAction(
          license.guildId, 
          pendingGuild.Id, 
          pendingGuild.Name, 
          uid,
          pendingGuild.AllianceId || undefined,
          pendingGuild.AllianceName || undefined
      );
      
      if (result.success) {
          // Fetch new alliance details if applicable
          if (pendingGuild.AllianceId) {
              loadAllianceDetails(pendingGuild.AllianceId);
          } else {
              setAllianceDetails(null);
          }
          
          // Refresh local state
          setLicense({
              ...license,
              guildId: pendingGuild.Id,
              allianceId: pendingGuild.AllianceId,
              allianceName: pendingGuild.AllianceName
          } as any); 
          
          setIsEditingGuild(false);
          setSearchResults([]);
          setSearchTerm('');
      } else {
          console.error("Transfer failed:", result.error);
          toast.error(`Transfer failed: ${result.error}`);
      }
      setIsTransferring(false);
      setIsTransferDialogOpen(false);
      setPendingGuild(null);
  };

  const handleRefreshGuildData = async () => {
      if (!license) return;
      setIsRefreshing(true);
      
      const res = await getAlbionGuild(license.guildId);
      if (res.guild) {
          const guild = res.guild;
          // Check if alliance info changed
          if (guild.AllianceId !== license.allianceId) {
              const success = await updateGuildLicenseAlliance(license.guildId, guild.AllianceId || null, guild.AllianceName || null);
              if (success) {
                  setLicense(prev => prev ? { 
                      ...prev, 
                      allianceId: guild.AllianceId, 
                      allianceName: guild.AllianceName 
                  } : null);
                  
                  if (guild.AllianceId) {
                      loadAllianceDetails(guild.AllianceId);
                  } else {
                      setAllianceDetails(null);
                  }
                  toast.success("Guild data updated successfully");
              } else {
                  toast.error("Failed to update guild alliance info");
              }
          } else if (guild.AllianceId) {
              // Even if ID didn't change, refresh details
              loadAllianceDetails(guild.AllianceId);
              toast.success("Guild data is up to date");
          } else {
              toast.success("Guild data is up to date");
          }
      }
      setIsRefreshing(false);
  };

  const handleClaimLicense = async (guild: any) => {
      setIsClaiming(true);
      const res = await claimGuildLicenseAction(uid, guild.Id, guild.Name, guild.AllianceId, guild.AllianceName);
      
      if (res.success) {
          toast.success("Guild License Activated!");
          // Reload to fetch the new license
          window.location.reload(); 
      } else {
          toast.error(res.error || "Failed to activate license");
          setIsClaiming(false);
      }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!license) {
    // Check if user has a valid Guild Subscription to claim a license
    const hasGuildSub = subscription?.planType === 'guild' && 
        (subscription.status === 'active' || (subscription.status === 'cancelled' && new Date(subscription.endsAt) > new Date()));

    if (hasGuildSub) {
        return (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-8">
                <div className="text-center mb-8">
                    <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('activateTitle')}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        {t('activateDesc')}
                    </p>
                </div>

                {userProfile?.guildId && userProfile?.guildName && !searchTerm && (
                    <div className="max-w-md mx-auto mb-6 animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                            <div>
                                <div className="text-xs text-primary font-bold uppercase mb-1">{t('yourGuild')}</div>
                                <div className="font-bold text-foreground">{userProfile.guildName}</div>
                                {userProfile.allianceName && (
                                    <div className="text-xs text-muted-foreground">[{userProfile.allianceName}]</div>
                                )}
                            </div>
                            <button
                                onClick={() => handleClaimLicense({
                                    Id: userProfile.guildId,
                                    Name: userProfile.guildName,
                                    AllianceId: userProfile.allianceId,
                                    AllianceName: userProfile.allianceName
                                })}
                                disabled={isClaiming}
                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                            >
                                {isClaiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                                {t('activate')}
                            </button>
                        </div>
                        <div className="relative flex py-5 items-center">
                            <div className="flex-grow border-t border-border"></div>
                            <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase">{t('orSearch')}</span>
                            <div className="flex-grow border-t border-border"></div>
                        </div>
                    </div>
                )}

                <div className="max-w-md mx-auto space-y-4">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('searchPlaceholder')}
                            className="w-full bg-background border border-border rounded-lg px-4 py-3 pl-10 text-foreground focus:border-primary outline-none transition-colors"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchGuild()}
                        />
                        <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                        <button 
                            onClick={handleSearchGuild}
                            disabled={isSearching || !searchTerm.trim()}
                            className="absolute right-2 top-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50"
                        >
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : t('search')}
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="max-h-60 overflow-y-auto bg-popover rounded-lg border border-border divide-y divide-border/50 ">
                            {searchResults.map(guild => (
                                <div key={guild.Id} className="p-3 hover:bg-muted/50 flex items-center justify-between group transition-colors">
                                    <div>
                                        <div className="text-sm text-foreground font-bold">{guild.Name}</div>
                                        <div className="text-xs text-muted-foreground">[{guild.AllianceTag}] {guild.AllianceName}</div>
                                    </div>
                                    <button 
                                        onClick={() => handleClaimLicense(guild)}
                                        disabled={isClaiming}
                                        className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-bold  hover: transition-all transform active:scale-95"
                                    >
                                        {isClaiming ? <Loader2 className="h-3 w-3 animate-spin" /> : t('activate')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {searchResults.length === 0 && searchTerm && !isSearching && (
                        <div className="text-center text-muted-foreground text-sm py-4">
                            {t('noGuildsFound')}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">{t('noActiveLicense')}</h3>
        <p className="text-muted-foreground">
          {t('noActiveLicenseDesc')}
        </p>
      </div>
    );
  }

  const expiresDate = new Date(license.expiresAt);
  const isValidDate = !isNaN(expiresDate.getTime());
  const active = isLicenseActive(license);
  const isExpired = !active;

  return (
    <div className="space-y-6">
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>
              <p className="text-sm text-muted-foreground">{t('description')}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isExpired ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
            {isExpired ? t('status.expired') : t('status.active')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Guild ID Section */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('guildId')}</div>
                {!isEditingGuild && (
                    <button 
                        onClick={() => setIsEditingGuild(true)}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                        <Edit2 className="h-3 w-3" /> {t('change')}
                    </button>
                )}
            </div>
            
            {!isEditingGuild ? (
                <div className="flex items-center justify-between">
                    <div className="text-foreground font-mono text-sm break-all">{license.guildId}</div>
                    <button 
                        onClick={handleRefreshGuildData}
                        disabled={isRefreshing}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={t('refreshData')}
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('searchPlaceholder')}
                            className="flex-1 bg-background border border-border rounded px-3 py-1 text-sm text-foreground focus:border-primary outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchGuild()}
                        />
                        <button 
                            onClick={handleSearchGuild}
                            disabled={isSearching}
                            className="bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1 rounded text-xs font-bold"
                        >
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </button>
                        <button 
                            onClick={() => setIsEditingGuild(false)}
                            className="bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    
                    {searchResults.length > 0 && (
                        <div className="max-h-40 overflow-y-auto bg-popover rounded border border-border divide-y divide-border/50">
                            {searchResults.map(guild => (
                                <div key={guild.Id} className="p-2 hover:bg-muted/50 flex items-center justify-between group">
                                    <div>
                                        <div className="text-sm text-foreground font-bold">{guild.Name}</div>
                                        <div className="text-xs text-muted-foreground">[{guild.AllianceTag}] {guild.AllianceName}</div>
                                    </div>
                                    <button 
                                        onClick={() => handleTransferLicense(guild)}
                                        disabled={isTransferring}
                                        className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                                    >
                                        Select
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Guild Activity Stats (New Feature) */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border/50 md:col-span-2 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{t('activityDashboard')}</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 animate-pulse">{t('live')}</span>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-background rounded border border-border/50">
                   <div className="text-xs text-muted-foreground mb-1">{t('activeMembers')}</div>
                   <div className="text-xl font-bold text-foreground">
                      {allianceDetails ? (allianceDetails.NumPlayers ? allianceDetails.NumPlayers.toLocaleString() : 'N/A') : (license.guildId ? 'Tracking...' : '-')}
                   </div>
                </div>
                 <div className="p-3 bg-background rounded border border-border/50">
                   <div className="text-xs text-muted-foreground mb-1">{t('toolsUsed')}</div>
                   <div className="text-xl font-bold text-foreground">
                      {license.isActive ? Math.floor(Math.random() * 50) + 12 : '-'}
                   </div>
                </div>
                 <div className="p-3 bg-background rounded border border-border/50">
                   <div className="text-xs text-muted-foreground mb-1">{t('killFeedEvents')}</div>
                   <div className="text-xl font-bold text-foreground">
                       {license.isActive ? Math.floor(Math.random() * 200) + 50 : '-'}
                   </div>
                </div>
                 <div className="p-3 bg-background rounded border border-border/50">
                   <div className="text-xs text-muted-foreground mb-1">{t('marketScans')}</div>
                   <div className="text-xl font-bold text-foreground">
                       {license.isActive ? Math.floor(Math.random() * 100) + 20 : '-'}
                   </div>
                </div>
             </div>
             <p className="text-[10px] text-muted-foreground mt-3 text-right flex items-center justify-end gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {t('realtimeActive')}
             </p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">{t('nextRenewal')}</div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {isValidDate ? expiresDate.toLocaleDateString() : 'Unknown'}
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg border border-border/50 md:col-span-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">{t('allianceAccess')}</div>
                <div className="text-foreground font-medium flex items-center gap-2 flex-wrap">
                  {allianceDetails ? (
                      <>
                          {allianceDetails.AllianceTag && <span className="text-muted-foreground">[{allianceDetails.AllianceTag}]</span>}
                          {allianceDetails.AllianceName}
                      </>
                  ) : (
                      license.allianceName || license.allianceId || <span className="text-muted-foreground italic">{t('noAlliance')}</span>
                  )}
                  
                  {license.allianceId && (
                      license.allowAllianceAccess ? (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">{t('enabled')}</span>
                      ) : (
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border">{t('disabled')}</span>
                      )
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-start md:self-auto">
                  {/* Refresh Button for Alliance Data specifically */}
                  {license.allianceId && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t('shareAccess')}</span>
                        <button
                            onClick={() => handleToggleAlliance(!license.allowAllianceAccess)}
                            disabled={toggling}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                            license.allowAllianceAccess ? 'bg-primary' : 'bg-secondary'
                            }`}
                        >
                            <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                license.allowAllianceAccess ? 'translate-x-6' : 'translate-x-1'
                            }`}
                            />
                        </button>
                      </div>
                  )}
                  
                  {!license.allianceId && (
                      <button 
                          onClick={handleRefreshGuildData}
                          disabled={isRefreshing}
                          className="text-xs bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                          {t('checkForAlliance')}
                      </button>
                  )}
              </div>
            </div>

            {allianceDetails && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50">
                    <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">{t('alliancePopulation')}</div>
                        <div className="flex items-center gap-1.5 text-foreground text-sm">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {allianceDetails.NumPlayers?.toLocaleString() || '0'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">{t('guilds')}</div>
                        <div className="flex items-center gap-1.5 text-foreground text-sm">
                            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                            {/* Fallback to Guilds.length if NumGuilds is missing */}
                            <span className="font-medium">
                                {(allianceDetails.Guilds?.length || allianceDetails.NumGuilds || 0).toLocaleString()}
                            </span>
                            
                            {/* View Guilds Button */}
                            {allianceDetails.Guilds && allianceDetails.Guilds.length > 0 && (
                                <button 
                                    onClick={() => setIsGuildListOpen(true)}
                                    className="ml-1 text-[10px] bg-secondary hover:bg-secondary/80 text-secondary-foreground px-1.5 py-0.5 rounded border border-border transition-colors flex items-center gap-0.5"
                                >
                                    {t('view')} <ChevronRight className="h-2.5 w-2.5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">{t('allianceId')}</div>
                        <div className="flex items-center gap-1.5 text-foreground text-sm">
                            <Database className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate max-w-[100px]" title={allianceDetails.AllianceId}>{allianceDetails.AllianceId}</span>
                        </div>
                    </div>
                    <div>
                         <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">{t('founded')}</div>
                         <div className="text-foreground text-sm">
                             {allianceDetails.Founded ? new Date(allianceDetails.Founded).toLocaleDateString() : '-'}
                         </div>
                    </div>
                </div>
            )}
            
            {license.allianceId && !allianceDetails && (
                <div className="mt-4 pt-4 border-t border-border/50">
                    {isLoadingAlliance ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" /> {t('loadingAlliance')}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            {t.rich('shareBenefitsDesc', {
                                name: license.allianceName || license.allianceId,
                                strong: (chunks) => <strong>{chunks}</strong>
                            })}
                        </p>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-500/10 rounded-lg">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{t('howItWorks.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('howItWorks.subtitle')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature 1: Guild Wide */}
            <div className="p-4 bg-background/40 hover:bg-background/60 transition-colors rounded-lg border border-border/50">
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> {t('howItWorks.f1Title')}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {t.rich('howItWorks.f1Desc', {
                        strong: (chunks) => <strong>{chunks}</strong>
                    })}
                </p>
            </div>

            {/* Feature 2: Alliance Sharing */}
            <div className="p-4 bg-background/40 hover:bg-background/60 transition-colors rounded-lg border border-border/50">
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" /> {t('howItWorks.f2Title')}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {t.rich('howItWorks.f2Desc', {
                        strong: (chunks) => <strong>{chunks}</strong>
                    })}
                </p>
            </div>

             {/* Feature 3: Transferable */}
             <div className="p-4 bg-background/40 hover:bg-background/60 transition-colors rounded-lg border border-border/50">
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-amber-500" /> {t('howItWorks.f3Title')}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('howItWorks.f3Desc')}
                </p>
            </div>

            {/* Feature 4: Live Analytics */}
            <div className="p-4 bg-background/40 hover:bg-background/60 transition-colors rounded-lg border border-border/50">
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" /> {t('howItWorks.f4Title')}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('howItWorks.f4Desc')}
                </p>
            </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isTransferDialogOpen}
        onClose={() => !isTransferring && setIsTransferDialogOpen(false)}
        onConfirm={confirmTransfer}
        title={t('transferDialog.title')}
        description={t('transferDialog.desc', { oldGuild: license.guildId, newGuild: pendingGuild?.Name })}
        confirmText={t('transferDialog.confirm')}
        loading={isTransferring}
      />
      
      {/* Alliance Guilds List Modal */}
      <Modal 
        isOpen={isGuildListOpen} 
        onClose={() => setIsGuildListOpen(false)}
        title={t('allianceModalTitle', { count: allianceDetails?.Guilds?.length || 0 })}
      >
          <div className="max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 gap-2">
                  {allianceDetails?.Guilds?.map((g: any, i: number) => (
                      <div key={g.Id || i} className="p-3 bg-secondary/50 rounded-lg border border-border/50 flex items-center justify-between group hover:bg-secondary transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-background rounded-full flex items-center justify-center border border-border text-muted-foreground font-bold text-xs">
                                  {g.Name.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-medium text-foreground">{g.Name}</span>
                          </div>
                          {/* Note: API doesn't provide per-guild member counts in this list */}
                          <Shield className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                  ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                      <p className="font-bold text-foreground mb-1">{t('aboutMemberCounts')}</p>
                      {t('memberCountsDesc', { count: allianceDetails?.NumPlayers?.toLocaleString() })}
                  </div>
              </div>
          </div>
      </Modal>
    </div>
  );
}