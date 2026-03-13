import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, deleteField } from 'firebase/firestore';

export interface GuildLicense {
  guildId: string;
  purchasedBy: string;
  purchasedAt: string;
  expiresAt: string;
  isActive: boolean;
  allianceId?: string;
  allianceName?: string;
  allowAllianceAccess?: boolean;
}

export interface UserSubscription {
  status: 'active' | 'past_due' | 'unpaid' | 'cancelled' | 'expired' | 'trialing';
  planType: 'personal' | 'guild';
  renewsAt?: string;
  endsAt?: string;
  lemonSqueezySubscriptionId?: string;
  customerId?: string;
  trialEndsAt?: string;
}

export interface UserPreferences {
  emailNotifications?: boolean;
  publicProfile?: boolean;
  showBadges?: boolean;
  compactMode?: boolean;
  hasUsedTrial?: boolean; // Track if user already used the 7-day trial

  // New Preferences
  defaultServer?: 'Americas' | 'Asia' | 'Europe';
  defaultMarketLocation?: 'Thetford' | 'Fort Sterling' | 'Lymhurst' | 'Bridgewatch' | 'Martlock' | 'Caerleon' | 'Brecilien';
  showPrices?: boolean;
  reducedMotion?: boolean;
  lastNotifiedRank?: string;
  marketAlerts?: boolean;
  goldAlerts?: boolean;
}

export interface SocialLinks {
  discord?: string;
  twitter?: string;
  twitch?: string;
  youtube?: string;
}

export interface GameplayPreferences {
  mainRole?: 'Tank' | 'Healer' | 'Melee DPS' | 'Ranged DPS' | 'Support' | 'Gatherer' | 'Crafter';
  secondaryRole?: 'Tank' | 'Healer' | 'Melee DPS' | 'Ranged DPS' | 'Support' | 'Gatherer' | 'Crafter';
  region?: 'Americas' | 'Asia' | 'Europe';
}

export type UserRank = 'Wanderer' | 'Novice' | 'Journeyman' | 'Adept' | 'Expert' | 'Master' | 'Grandmaster';

export interface UserBadge {
  id: string;
  label: string;
  icon: 'Shield' | 'Swords' | 'Hammer' | 'Zap' | 'Heart' | 'Crown' | 'Star' | 'Flame';
  description: string;
  color: string; // Tailwind class like "text-amber-500"
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bannerUrl?: string;
  bannerPositionY?: number; // 0-100 percentage for vertical alignment
  signature?: string;
  bio?: string;
  createdAt?: string;
  lastLoginAt?: string;
  currentStreak?: number;
  longestStreak?: number;
  characterName?: string;
  characterId?: string;
  guildName?: string;
  guildId?: string;
  allianceName?: string;
  allianceId?: string;
  isPremium?: boolean; // Replaces isPatron
  isAdmin?: boolean; // Admin role flag
  hasPendingGuildLicense?: boolean; // Purchased guild license but not yet linked to a guild
  updatedAt: string;
  locale?: string;
  subscription?: UserSubscription;
  preferences?: UserPreferences;
  socialLinks?: SocialLinks;
  gameplay?: GameplayPreferences;
}

export function calculateUserGamification(profile: UserProfile, builds: any[]) {
  const buildCount = builds.length;
  // Calculate total views safely
  const totalViews = builds.reduce((acc, build) => acc + (build.views || 0), 0);

  // Calculate Rank (XP based)
  // XP = (Builds * 50) + (Views * 1)
  const xp = (buildCount * 50) + totalViews;

  let rank: UserRank = 'Wanderer';
  if (xp >= 25000) rank = 'Grandmaster';
  else if (xp >= 5000) rank = 'Master';
  else if (xp >= 1000) rank = 'Expert';
  else if (xp >= 200) rank = 'Adept';
  else if (xp >= 50) rank = 'Journeyman';
  else if (buildCount >= 1) rank = 'Novice';

  // Calculate Badges
  const badges: UserBadge[] = [];

  // 1. Subscription Badges (Adept / Guild Master)
  let isSupporter = profile.isPremium || profile.subscription?.status === 'active';

  // Check for grace period support
  if (!isSupporter && profile.subscription?.status === 'cancelled' && profile.subscription.endsAt) {
    const endsAt = new Date(formatFirestoreDate(profile.subscription.endsAt));
    if (endsAt > new Date()) {
      isSupporter = true;
    }
  }

  if (isSupporter) {
    if (profile.subscription?.planType === 'guild') {
      badges.push({
        id: 'guild_master',
        label: 'Guild Master',
        icon: 'Shield',
        description: 'Guild License Holder',
        color: 'text-blue-500'
      });
    } else {
      // Default to Adept for personal plans or legacy premium
      badges.push({
        id: 'adept',
        label: 'Adept',
        icon: 'Crown',
        description: 'Premium Supporter',
        color: 'text-amber-500'
      });
    }
  }

  // 2. Contributor (First Build)
  if (buildCount >= 1) {
    badges.push({
      id: 'builder',
      label: 'Builder',
      icon: 'Hammer',
      description: 'Published at least 1 build',
      color: 'text-blue-400'
    });
  }

  // 3. Master Builder (10+ Builds)
  if (buildCount >= 10) {
    badges.push({
      id: 'architect',
      label: 'Architect',
      icon: 'Crown',
      description: 'Published 10+ builds',
      color: 'text-amber-400'
    });
  }

  // 4. Influencer (1000+ Hits)
  if (totalViews >= 1000) {
    badges.push({
      id: 'influencer',
      label: 'Influencer',
      icon: 'Star',
      description: 'Accumulated over 1,000 hits across all builds',
      color: 'text-purple-400'
    });
  }

  // 5. Viral (Single build with > 500 hits)
  const hasViralBuild = builds.some(b => (b.views || 0) >= 500);
  if (hasViralBuild) {
    badges.push({
      id: 'viral',
      label: 'Viral',
      icon: 'Flame',
      description: 'Created a build with over 500 hits',
      color: 'text-orange-500'
    });
  }

  return { rank, badges, xp };
}

// Helper to safely format Firestore dates (String, Timestamp, or Number)
function formatFirestoreDate(date: any): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  // Handle Firestore Timestamp (has toDate method)
  if (date && typeof date.toDate === 'function') {
    return date.toDate().toISOString();
  }
  // Handle seconds/nanoseconds object if toDate is missing
  if (date && typeof date.seconds === 'number') {
    return new Date(date.seconds * 1000).toISOString();
  }
  // Handle number (timestamp) or Date object
  return new Date(date).toISOString();
}

// Helper to normalize GuildLicense data
function normalizeGuildLicense(data: any): GuildLicense {
  return {
    ...data,
    purchasedAt: formatFirestoreDate(data.purchasedAt),
    expiresAt: formatFirestoreDate(data.expiresAt)
  } as GuildLicense;
}

// Helper to check if a license is currently active
export function isLicenseActive(license: GuildLicense): boolean {
  if (!license.isActive) return false;
  const expiresDate = new Date(license.expiresAt);
  // Check if valid date
  if (isNaN(expiresDate.getTime())) return false;

  const now = new Date();
  // Strict future check
  if (expiresDate.getTime() > now.getTime()) return true;

  // Grace period: Allow if it expires today (effectively valid until end of the day)
  return expiresDate.getDate() === now.getDate() &&
    expiresDate.getMonth() === now.getMonth() &&
    expiresDate.getFullYear() === now.getFullYear();
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      return { ...data, uid };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(uid: string | undefined, data: Partial<UserProfile>) {
  try {
    if (!uid) {
      console.error('updateUserProfile called without uid. Data payload:', data);
      return false;
    }
    const docRef = doc(db, 'users', uid);
    // Use setDoc with merge: true to create if not exists
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

export async function checkGuildLicense(guildId: string): Promise<GuildLicense | null> {
  if (!guildId) return null;
  try {
    const docRef = doc(db, 'guild_licenses', guildId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return normalizeGuildLicense(docSnap.data());
    }
    return null;
  } catch (err) {
    console.error('Error checking guild license:', err);
    return null;
  }
}

export async function checkAllianceLicense(allianceId: string): Promise<GuildLicense | null> {
  if (!allianceId) return null;
  try {
    const q = query(
      collection(db, 'guild_licenses'),
      where('allianceId', '==', allianceId),
      where('allowAllianceAccess', '==', true)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      // Return the first active license found
      const activeLicense = snapshot.docs
        .map(doc => normalizeGuildLicense(doc.data()))
        .find(license => isLicenseActive(license));

      return activeLicense || null;
    }
    return null;
  } catch (err) {
    console.error('Error checking alliance license:', err);
    return null;
  }
}

export async function updateSubscriptionStatus(
  uid: string,
  data: UserSubscription
) {
  try {
    const docRef = doc(db, 'users', uid);

    // Logic:
    // If status is active -> set isPatron = true (if personal)
    // If status is cancelled, check if endsAt is in the future.
    // If endsAt > now, treat as active (grace period).

    const isNowActive = data.status === 'active';
    let hasAccess = isNowActive;

    if (data.status === 'cancelled' && data.endsAt) {
      const endsAtDate = new Date(data.endsAt);
      if (endsAtDate > new Date()) {
        hasAccess = true;
      }
    }

    const updateData: any = {
      subscription: data,
      updatedAt: new Date().toISOString()
    };

    if (data.planType === 'personal') {
      updateData.isPremium = hasAccess;
      // Legacy cleanup (optional): updateData.isPatron = deleteField(); or just set false/null if desired
      // For now, we just prioritize isPremium in checkAccess
    } else if (data.planType === 'guild') {
      // We'll handle guild license toggle separately in the webhook logic usually, 
      // but let's keep user profile updated too
    }

    await setDoc(docRef, updateData, { merge: true });
    return true;
  } catch (err) {
    console.error('Error updating subscription status:', err);
    return false;
  }
}

export async function activatePersonalPremium(uid: string) {
  try {
    await updateUserProfile(uid, { isPremium: true });
    return true;
  } catch (err) {
    console.error('Error activating personal premium:', err);
    return false;
  }
}

export async function activateGuildLicense(guildId: string, purchasedByUid: string, allianceId?: string, allianceName?: string) {
  try {
    const docRef = doc(db, 'guild_licenses', guildId);
    const data: any = {
      guildId,
      purchasedBy: purchasedByUid,
      purchasedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      isActive: true
    };
    if (allianceId) data.allianceId = allianceId;
    if (allianceName) data.allianceName = allianceName;

    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (err) {
    console.error('Error activating guild license:', err);
    return false;
  }
}

export async function toggleAllianceAccess(guildId: string, allow: boolean) {
  try {
    const docRef = doc(db, 'guild_licenses', guildId);
    await updateDoc(docRef, { allowAllianceAccess: allow });
    return true;
  } catch (err) {
    console.error('Error toggling alliance access:', err);
    return false;
  }
}

export async function updateGuildLicenseExpiration(guildId: string, newExpiresAt: string) {
  try {
    const docRef = doc(db, 'guild_licenses', guildId);
    await updateDoc(docRef, {
      expiresAt: newExpiresAt,
      isActive: true // Re-activate if it was disabled
    });
    return true;
  } catch (err) {
    console.error('Error updating guild license expiration:', err);
    return false;
  }
}

export async function transferGuildLicense(oldGuildId: string, newGuildId: string, newGuildName?: string) {
  try {
    const oldRef = doc(db, 'guild_licenses', oldGuildId);
    const oldSnap = await getDoc(oldRef);

    if (!oldSnap.exists()) return false;

    const data = oldSnap.data();

    // Create new doc
    const newRef = doc(db, 'guild_licenses', newGuildId);
    await setDoc(newRef, {
      ...data,
      guildId: newGuildId,
      guildName: newGuildName || data.guildName || '',
      updatedAt: new Date().toISOString()
    });

    // Delete old doc
    await deleteDoc(oldRef);

    return true;
  } catch (err) {
    console.error('Error transferring guild license:', err);
    return false;
  }
}

export async function updateGuildLicenseAlliance(guildId: string, allianceId: string | null, allianceName: string | null) {
  try {
    const docRef = doc(db, 'guild_licenses', guildId);
    // If null, we remove the fields
    if (allianceId === null) {
      await updateDoc(docRef, {
        allianceId: deleteField(),
        allianceName: deleteField(),
        allowAllianceAccess: false
      });
    } else {
      await updateDoc(docRef, {
        allianceId,
        allianceName,
        updatedAt: new Date().toISOString()
      });
    }
    return true;
  } catch (err) {
    console.error('Error updating guild license alliance:', err);
    return false;
  }
}

export async function getMyPurchasedLicense(uid: string): Promise<GuildLicense | null> {
  try {
    const q = query(collection(db, 'guild_licenses'), where('purchasedBy', '==', uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return normalizeGuildLicense(snapshot.docs[0].data());
    }
    return null;
  } catch (err) {
    console.error('Error fetching purchased license:', err);
    return null;
  }
}

export async function activatePendingGuildLicense(uid: string) {
  try {
    await updateUserProfile(uid, { hasPendingGuildLicense: true });
    return true;
  } catch (err) {
    console.error('Error activating pending guild license:', err);
    return false;
  }
}

export async function processPendingGuildLicense(uid: string, guildId: string, allianceId?: string, allianceName?: string) {
  try {
    const profile = await getUserProfile(uid);
    if (profile?.hasPendingGuildLicense) {
      // Activate license for this guild
      const activated = await activateGuildLicense(guildId, uid, allianceId, allianceName);
      if (activated) {
        // Remove pending flag
        await updateUserProfile(uid, { hasPendingGuildLicense: false });
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Error processing pending guild license:', err);
    return false;
  }
}

// Check if user has access (either solo premium OR member of premium guild)
export async function checkAccess(uid: string): Promise<{
  hasAccess: boolean;
  reason: 'none' | 'premium' | 'guild' | 'alliance' | 'pending_guild';
  providerId?: string;
}> {
  const profile = await getUserProfile(uid);
  if (!profile) return { hasAccess: false, reason: 'none' };

  if (profile.hasPendingGuildLicense) return { hasAccess: true, reason: 'pending_guild' }; // Special state

  // Priority 1: Subscription Status
  if (profile.subscription?.status === 'active') {
    if (profile.subscription.planType === 'guild') {
      return { hasAccess: true, reason: 'guild' };
    }
    return { hasAccess: true, reason: 'premium' };
  }

  // Check for cancelled but still valid subscription (Grace Period)
  if (profile.subscription?.status === 'cancelled' && profile.subscription.endsAt) {
    // Use helper to safely handle String or Timestamp
    const endsAtStr = formatFirestoreDate(profile.subscription.endsAt);
    const endsAt = new Date(endsAtStr);

    if (endsAt > new Date()) {
      if (profile.subscription.planType === 'guild') {
        return { hasAccess: true, reason: 'guild' };
      }
      return { hasAccess: true, reason: 'premium' };
    }
  }

  // Priority 2: Manual/Legacy Flag
  if (profile.isPremium) return { hasAccess: true, reason: 'premium' };
  if ((profile as any).isPatron) return { hasAccess: true, reason: 'premium' };

  if (profile.guildId) {
    const guildLicense = await checkGuildLicense(profile.guildId);
    if (guildLicense && isLicenseActive(guildLicense)) {
      return { hasAccess: true, reason: 'guild', providerId: guildLicense.purchasedBy };
    }
  }

  if (profile.allianceId) {
    const allianceLicense = await checkAllianceLicense(profile.allianceId);
    if (allianceLicense) {
      return { hasAccess: true, reason: 'alliance', providerId: allianceLicense.purchasedBy };
    }
  }

  return { hasAccess: false, reason: 'none' };
}
