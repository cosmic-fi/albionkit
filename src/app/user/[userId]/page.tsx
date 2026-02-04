'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { BuildCard } from '@/components/BuildCard';
import { getUserBuilds, Build } from '@/lib/builds-service';
import { getUserProfile, updateUserProfile, UserProfile, calculateUserGamification } from '@/lib/user-profile';
import { useAuth } from '@/context/AuthContext';
import { User, Calendar, Swords, Edit2, Shield, Eye, Camera, Loader2, Image as ImageIcon, Move, Check, X, Crown, Hammer, Zap, Heart, Star, Flame, Globe, Gamepad2, Twitter, Youtube, Twitch, MessageCircle, Pickaxe, Crosshair, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { uploadImage } from '@/lib/image-service';

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;
  const { user: currentUser, profile: viewerProfile, refreshProfile } = useAuth();
  const router = useRouter();
  
  const wasLoggedIn = useRef(!!currentUser);

  useEffect(() => {
    if (currentUser) wasLoggedIn.current = true;
  }, [currentUser]);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Pagination State
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  
  // Banner Repositioning State
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [bannerY, setBannerY] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const startBannerY = useRef(50);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwner = currentUser?.uid === userId;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileData, { builds: buildsData, lastDoc: last }] = await Promise.all([
          getUserProfile(userId),
          getUserBuilds(userId, 20)
        ]);
        setProfile(profileData);
        if (profileData?.bannerPositionY !== undefined) {
            setBannerY(profileData.bannerPositionY);
        }
        setBuilds(buildsData);
        setLastDoc(last);
        setHasMore(!!last && buildsData.length >= 20);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const { builds: newBuilds, lastDoc: newLast } = await getUserBuilds(userId, 20, lastDoc);
      setBuilds(prev => [...prev, ...newBuilds]);
      setLastDoc(newLast);
      setHasMore(!!newLast && newBuilds.length >= 20);
    } catch (error) {
      console.error('Error loading more builds:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // If user logs out while viewing a private profile (that they likely owned or had access to), redirect home
    if (!currentUser && wasLoggedIn.current && profile?.preferences?.publicProfile === false) {
      router.push('/');
    }
  }, [currentUser, profile, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'photoURL' | 'bannerUrl') => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (field === 'bannerUrl') setUploadingBanner(true);
    else setUploadingAvatar(true);

    try {
      const url = await uploadImage(file);
      if (url) {
        const updates: Partial<UserProfile> = { [field]: url };
        // Reset banner position if changing banner
        if (field === 'bannerUrl') {
            updates.bannerPositionY = 50;
            setBannerY(50);
        }
        await updateUserProfile(profile.uid, updates);
        setProfile(prev => prev ? ({ ...prev, ...updates }) : null);
        // Refresh Auth Context to update Navbar
        await refreshProfile();
      }
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      if (field === 'bannerUrl') setUploadingBanner(false);
      else setUploadingAvatar(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!isRepositioning) return;
      setIsDragging(true);
      dragStartY.current = e.clientY;
      startBannerY.current = bannerY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !isRepositioning) return;
      const deltaY = e.clientY - dragStartY.current;
      // Sensitivity factor: 0.3 seems reasonable for pixel -> percentage
      // Dragging DOWN (+delta) should decrease percentage (move towards top 0%)
      const newY = Math.max(0, Math.min(100, startBannerY.current - (deltaY * 0.3)));
      setBannerY(newY);
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const saveBannerPosition = async () => {
      if (!profile) return;
      await updateUserProfile(profile.uid, { bannerPositionY: bannerY });
      // Refresh Auth Context to update Navbar
      await refreshProfile();
      setIsRepositioning(false);
      // Update local profile to reflect saved state
      setProfile(prev => prev ? ({ ...prev, bannerPositionY: bannerY }) : null);
  };

  const cancelReposition = () => {
      setIsRepositioning(false);
      setBannerY(profile?.bannerPositionY ?? 50);
  };

  if (loading) {
    return (
      <PageShell enableHeader={false} title="Loading Profile..." description="Loading user profile">
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell title="User Not Found" description="User not found">
        <div className="text-center py-20 text-muted-foreground">
          <p>The user you are looking for does not exist.</p>
        </div>
      </PageShell>
    );
  }

  // Access Control: Check if profile is public or if viewer is owner
  if (!isOwner && profile.preferences?.publicProfile === false) {
    return (
        <PageShell title="Private Profile" description="This user has set their profile to private.">
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Lock className="h-16 w-16 mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground mb-2">Private Profile</h2>
          <p>This user has set their profile to private.</p>
        </div>
      </PageShell>
    );
  }

  const totalViews = builds.reduce((acc, b) => acc + (b.views || 0), 0);
  const { rank, badges } = profile ? calculateUserGamification(profile, builds) : { rank: 'Wanderer', badges: [] };

  const getRankColor = (r: string) => {
      switch(r) {
          case 'Grandmaster': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
          case 'Master': return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
          case 'Expert': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
          case 'Adept': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
          case 'Journeyman': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
          case 'Novice': return 'text-muted-foreground border-muted-foreground/30 bg-muted-foreground/10';
          default: return 'text-muted-foreground border-muted-foreground/30 bg-muted-foreground/10';
      }
  };

  const BadgeIcon = ({ icon, className }: { icon: string, className?: string }) => {
      const icons: any = { Crown, Hammer, Zap, Heart, Star, Flame, Shield, Swords };
      const Icon = icons[icon] || Shield;
      return <Icon className={className} />;
  };

  const RoleIcon = ({ role, className }: { role: string, className?: string }) => {
      const icons: any = { 
          'Tank': Shield, 
          'Healer': Heart, 
          'Melee DPS': Swords, 
          'Ranged DPS': Crosshair, 
          'Support': Zap, 
          'Gatherer': Pickaxe, 
          'Crafter': Hammer 
      };
      const Icon = icons[role] || Shield;
      return <Icon className={className} />;
  };

  return (
    <PageShell enableHeader={false} title={profile.displayName || 'User Profile'} description="Profile">
      <input 
        type="file" 
        ref={bannerInputRef} 
        onChange={(e) => handleImageUpload(e, 'bannerUrl')} 
        className="hidden" 
        accept="image/*"
      />
      <input 
        type="file" 
        ref={avatarInputRef} 
        onChange={(e) => handleImageUpload(e, 'photoURL')} 
        className="hidden" 
        accept="image/*"
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Profile Header with Banner */}
        <div className="relative mb-6 rounded-xl overflow-hidden bg-card border border-border">
            {/* Banner */}
            <div 
                className={`h-32 md:h-48 w-full bg-muted relative group ${isRepositioning ? 'cursor-move' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {profile.bannerUrl ? (
                    <Image 
                        src={profile.bannerUrl} 
                        alt="Profile Banner" 
                        fill
                        className={`object-cover ${isRepositioning ? 'pointer-events-none' : ''}`}
                        style={{ objectPosition: `center ${bannerY}%` }}
                        draggable={false}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-muted to-card flex items-center justify-center">
                        <div className="text-muted-foreground font-bold text-4xl opacity-20 uppercase tracking-widest">
                            {profile.displayName}
                        </div>
                    </div>
                )}

                {/* Reposition Overlay Hint */}
                {isRepositioning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                        <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-2">
                            <Move className="h-4 w-4" />
                            Drag to Reposition
                        </div>
                    </div>
                )}

                {/* Banner Controls (Owner Only) */}
                {isOwner && (
                    <div className="absolute top-4 left-4 flex gap-2 z-10">
                        {!isRepositioning ? (
                            <>
                                <button
                                    onClick={() => bannerInputRef.current?.click()}
                                    disabled={uploadingBanner}
                                    className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm transition-all border border-white/10 group/btn"
                                >
                                    {uploadingBanner ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" />
                                            <span className="text-xs font-medium hidden group-hover/btn:block">Change Cover</span>
                                        </div>
                                    )}
                                </button>
                                {profile.bannerUrl && (
                                    <button
                                        onClick={() => setIsRepositioning(true)}
                                        className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm transition-all border border-white/10 group/btn"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Move className="h-4 w-4" />
                                            <span className="text-xs font-medium hidden group-hover/btn:block">Reposition</span>
                                        </div>
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={saveBannerPosition}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all border border-white/10 flex items-center gap-2"
                                >
                                    <Check className="h-4 w-4" />
                                    <span className="text-xs font-bold">Save Position</span>
                                </button>
                                <button
                                    onClick={cancelReposition}
                                    className="bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all border border-white/10 flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="text-xs font-medium">Cancel</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
                
                {/* Edit Button (Owner Only) - Hide when repositioning */}
                {isOwner && !isRepositioning && (
                    <Link 
                        href="/settings?tab=profile" 
                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all flex items-center gap-2 text-xs font-medium border border-white/10"
                    >
                        <Edit2 className="h-3 w-3" />
                        Edit Profile
                    </Link>
                )}
            </div>

            {/* Profile Info Bar */}
            <div className="px-4 py-4">
                <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                    {/* Avatar */}
                    <div className="shrink-0">
                        <div className="w-24 h-24 md:w-25 md:h-25 rounded-full bg-card border-4 border-card overflow-hidden shadow-xl relative group">
                            {profile.photoURL ? (
                                <Image 
                                    src={profile.photoURL} 
                                    alt={profile.displayName || 'User'} 
                                    width={128} 
                                    height={128} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                    <User className="h-10 w-10 md:h-14 md:w-14" />
                                </div>
                            )}

                            {/* Avatar Edit Overlay (Owner Only) */}
                            {isOwner && (
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    {uploadingAvatar ? (
                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                    ) : (
                                        <Camera className="h-6 w-6 text-white" />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Top Section: Name, Signature, Stats */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            {/* Identity & Stats */}
                            <div className="text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{profile.displayName}</h1>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getRankColor(rank as string)}`}>
                                        {rank}
                                    </span>
                                </div>
                                
                                {/* Signature */}
                                {profile.signature && (
                                    <p className="text-muted-foreground text-sm italic mb-3">"{profile.signature}"</p>
                                )}

                                <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-xs md:text-sm text-muted-foreground mt-1">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Shield className="h-3.5 w-3.5 text-amber-500" />
                                        <span><strong className="text-foreground">{builds.length}</strong> Builds</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Eye className="h-3.5 w-3.5 text-blue-400" />
                                        <span><strong className="text-foreground">{totalViews.toLocaleString()}</strong> Hits</span>
                                    </div>
                                </div>

                                {/* Social Links */}
                                {profile.socialLinks && (profile.socialLinks.twitter || profile.socialLinks.twitch || profile.socialLinks.youtube || profile.socialLinks.discord) && (
                                    <div className="flex items-center gap-4 mt-4">
                                        {profile.socialLinks.twitter && (
                                            <a 
                                                href={`https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-muted-foreground hover:text-[#1DA1F2] transition-colors p-1.5 hover:bg-[#1DA1F2]/10 rounded-lg"
                                                title="Twitter"
                                            >
                                                <Twitter className="h-5 w-5" />
                                            </a>
                                        )}
                                        {profile.socialLinks.twitch && (
                                            <a 
                                                href={`https://twitch.tv/${profile.socialLinks.twitch}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-muted-foreground hover:text-[#9146FF] transition-colors p-1.5 hover:bg-[#9146FF]/10 rounded-lg"
                                                title="Twitch"
                                            >
                                                <Twitch className="h-5 w-5" />
                                            </a>
                                        )}
                                        {profile.socialLinks.youtube && (
                                            <a 
                                                href={`https://youtube.com/${profile.socialLinks.youtube.startsWith('@') ? '' : '@'}${profile.socialLinks.youtube}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-muted-foreground hover:text-[#FF0000] transition-colors p-1.5 hover:bg-[#FF0000]/10 rounded-lg"
                                                title="YouTube"
                                            >
                                                <Youtube className="h-5 w-5" />
                                            </a>
                                        )}
                                        {profile.socialLinks.discord && (
                                            <div className="relative group/discord cursor-help">
                                                <div className="text-muted-foreground hover:text-[#5865F2] transition-colors p-1.5 hover:bg-[#5865F2]/10 rounded-lg">
                                                    <MessageCircle className="h-5 w-5" />
                                                </div>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg border border-border shadow-xl whitespace-nowrap opacity-0 group-hover/discord:opacity-100 transition-opacity pointer-events-none z-50">
                                                    {profile.socialLinks.discord}
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-b border-r border-border rotate-45"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Badges & Gameplay */}
                            <div className="flex flex-col items-center md:items-end gap-3 md:max-w-[300px]">
                                {/* Badges */}
                                {badges.length > 0 && viewerProfile?.preferences?.showBadges !== false && (
                                    <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                                        {badges.map(badge => (
                                            <div key={badge.id} className="group relative cursor-help">
                                                <div className={`p-1.5 rounded-lg bg-muted border border-border hover:border-foreground/50 transition-colors ${badge.color}`}>
                                                    <BadgeIcon icon={badge.icon} className="h-4 w-4" />
                                                </div>
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 px-3 py-2 bg-popover text-popover-foreground rounded-lg border border-border shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-[150px]">
                                                    <div className="font-bold text-xs mb-0.5">{badge.label}</div>
                                                    <div className="text-muted-foreground text-[10px] leading-tight">{badge.description}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Gameplay Preferences */}
                                {profile.gameplay && (profile.gameplay.mainRole || profile.gameplay.secondaryRole || profile.gameplay.region) && (
                                    <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                                        {profile.gameplay.region && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50 text-xs text-foreground" title="Region">
                                                <Globe className="h-3 w-3 text-muted-foreground" />
                                                {profile.gameplay.region}
                                            </div>
                                        )}
                                        {profile.gameplay.mainRole && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50 text-xs text-foreground" title="Main Role">
                                                <RoleIcon role={profile.gameplay.mainRole} className="h-3 w-3 text-amber-500" />
                                                {profile.gameplay.mainRole}
                                            </div>
                                        )}
                                        {profile.gameplay.secondaryRole && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50 text-xs text-foreground" title="Secondary Role">
                                                <RoleIcon role={profile.gameplay.secondaryRole} className="h-3 w-3 text-muted-foreground" />
                                                {profile.gameplay.secondaryRole}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* About Section (with Divider) */}
                {profile.bio && (
                    <>
                        <div className="border-t border-border my-4 -mx-6" />
                        <div className="md:px-2">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* Builds Grid (Default View) */}
        <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Swords className="h-5 w-5 text-amber-500" />
                Published Builds
            </h2>
            
            {builds.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {builds.map(build => (
                            <BuildCard 
                                key={build.id} 
                                build={build} 
                                compactMode={viewerProfile?.preferences?.compactMode} 
                            />
                        ))}
                    </div>

                    {hasMore && (
                        <div className="flex justify-center pt-8">
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {loadingMore ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                                {loadingMore ? 'Loading...' : 'Load More Builds'}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-16 bg-muted/30 rounded-xl border border-border/50">
                    <Swords className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-muted-foreground">No Builds Yet</h3>
                    <p className="text-sm text-muted-foreground">This user hasn't published any builds.</p>
                </div>
            )}
        </div>
      </div>
    </PageShell>
  );
}
