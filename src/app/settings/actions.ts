'use server';

import { listOrders, listStores, cancelSubscription, getSubscription, getOrder, listSubscriptionInvoices, getVariant, listSubscriptions } from '@lemonsqueezy/lemonsqueezy.js';
import { configureLemonSqueezy } from '@/lib/lemonsqueezy';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

configureLemonSqueezy();

export async function cancelUserSubscription(userId: string) {
    try {
        const docRef = adminDb.collection('users').doc(userId);
        const docSnap = await docRef.get();
        
        if (!docSnap.exists) {
            return { error: 'User not found' };
        }
        
        const userData = docSnap.data();
        const subscriptionId = userData?.subscription?.lemonSqueezySubscriptionId;
        
        if (!subscriptionId) {
            return { error: 'No active subscription found' };
        }
        
        const response = await cancelSubscription(subscriptionId);
        
        if (response.error) {
            console.error('Lemon Squeezy Cancel Error:', response.error);
            return { error: 'Failed to cancel subscription' };
        }
        
        // Optimistically update Firestore
        // Note: The actual status update will come via webhook, but we can set endsAt and cancelled status
        await docRef.set({
            subscription: {
                ...userData?.subscription,
                status: 'cancelled',
                endsAt: response.data?.data.attributes.ends_at
            }
        }, { merge: true });
        
        return { success: true };
        
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return { error: 'Internal server error' };
    }
}

export async function getUserInvoices(userId: string) {
  try {
     // 1. Try to fetch from Firestore first
     const invoicesRef = adminDb.collection('users').doc(userId).collection('invoices');
     const snapshot = await invoicesRef.orderBy('date', 'desc').get();
     
     if (!snapshot.empty) {
         const invoices = snapshot.docs.map(doc => doc.data());
         return { invoices };
     }

     // 2. Fallback: Fetch from Lemon Squeezy API if Firestore is empty (Sync)
     console.log('No invoices in Firestore, syncing from Lemon Squeezy...');
     
     const docRef = adminDb.collection('users').doc(userId);
     const docSnap = await docRef.get();
     
     if (!docSnap.exists) {
         return { error: 'User not found' };
     }
     
     const userData = docSnap.data();
     const userEmail = userData?.email;
     
     if (!userEmail) {
         return { invoices: [] };
     }

     const filter: any = {};
     
     // Get Store ID (required for email filtering)
     let storeId = process.env.LEMONSQUEEZY_STORE_ID;
     
     if (!storeId) {
        try {
            const stores = await listStores();
            if (stores.data?.data && stores.data.data.length > 0) {
                storeId = stores.data.data[0].id;
            }
        } catch (err) {
            console.warn("Failed to fetch stores for fallback ID", err);
        }
     }

     if (storeId) {
         filter.storeId = storeId;
     }
     
     // NOTE: listOrders does NOT support customerId filter, only userEmail
     filter.userEmail = userEmail;
     
     const orders = await listOrders({ filter });
     
     if (orders.error) {
         console.error('Lemon Squeezy Orders Error:', orders.error);
         return { error: 'Failed to fetch invoices' };
     }

     const invoices = orders.data?.data.map((order: any) => ({
         id: order.id,
         amount: order.attributes.total_formatted,
         status: order.attributes.status,
         date: order.attributes.created_at,
         url: order.attributes.urls.receipt
     })) || [];

     return { invoices };

  } catch (error) {
      console.error('Error fetching invoices:', error);
      return { error: 'Internal server error' };
  }
}

export async function getSubscriptionManagementData(userId: string) {
    try {
        const docRef = adminDb.collection('users').doc(userId);
        const docSnap = await docRef.get();
        
        if (!docSnap.exists) {
            return { error: 'User not found' };
        }
        
        const userData = docSnap.data();
        let subscription = userData?.subscription || null;

        // Force Sync: Fetch all subscriptions from Lemon Squeezy to ensure we have the latest status
        // This fixes issues where webhooks might have been missed or multiple subscriptions exist
        const userEmail = userData?.email;
        if (userEmail) {
            try {
                // Get Store ID (reuse logic or env)
                let storeId = process.env.LEMONSQUEEZY_STORE_ID;
                if (!storeId) {
                     const stores = await listStores();
                     if (stores.data?.data && stores.data.data.length > 0) {
                         storeId = stores.data.data[0].id;
                     }
                }

                if (storeId) {
                    const filter: any = { userEmail, storeId };
                    // Add logging to debug
                    console.log(`Syncing subscriptions for email: ${userEmail}, storeId: ${storeId}`);
                    
                    const allSubsRes = await listSubscriptions({ filter });
                    
                    // console.log(`Found ${allSubsRes.data?.data?.length || 0} subscriptions`);

                    if (allSubsRes.data?.data) {
                        const lsSubscriptions = allSubsRes.data.data;
                        
                        // If we got results, proceed with sync and pruning
                        // If result is empty array, it means no active subscriptions found in LS for this email
                        
                        const subscriptionsMap = userData?.subscriptions || {};
                        let hasChanges = false;
                        const validSubscriptionIds = new Set<string>();

                        for (const sub of lsSubscriptions) {
                            const attrs = sub.attributes;
                            const subId = sub.id;
                            validSubscriptionIds.add(subId);
                            
                            // Determine Plan Type based on Variant ID (most reliable)
                            let planType = 'personal';
                            const variantId = attrs.variant_id;
                            const guildVariantId = parseInt(process.env.LEMONSQUEEZY_VARIANT_ID_GUILD || '0');
                            const guildYearlyVariantId = parseInt(process.env.LEMONSQUEEZY_VARIANT_ID_GUILD_YEARLY || '0');
                            
                            if (variantId === guildVariantId || variantId === guildYearlyVariantId) {
                                planType = 'guild';
                            } else if (attrs.product_name?.toLowerCase().includes('guild') || attrs.variant_name?.toLowerCase().includes('guild')) {
                                // Fallback: Check product name or variant name if variant ID match fails
                                planType = 'guild';
                            } else if (subscriptionsMap[subId]?.planType) {
                                // Fallback to existing known type if variant check fails (unlikely but safe)
                                planType = subscriptionsMap[subId].planType;
                            }
                            
                            const subData = {
                                lemonSqueezySubscriptionId: subId,
                                productName: attrs.product_name,
                                variantName: attrs.variant_name,
                                cardBrand: attrs.card_brand,
                                cardLastFour: attrs.card_last_four,
                                renewsAt: attrs.renews_at,
                                endsAt: attrs.ends_at,
                                status: attrs.status,
                                customerPortalUrl: attrs.urls.customer_portal,
                                planType: planType, //ONLY if we successfully feced  lis
                       // This pveswpigdaa if tAPI call turn partial/paginated data incorrectly (toughSubscriptions is usually fine)
                        
                                updatedAt: new Date().toISOString(),
                                amountFormatted: subscriptionsMap[subId]?.amountFormatted || null
                            };
                            
                            subscriptionsMap[subId] = subData;
                            hasChanges = true;
                        }

                        // Prune invalid/ghost subscriptions ONLY if we successfully fetched a list
                        // This prevents wiping data if the API call returns partial/paginated data incorrectly (though listSubscriptions is usually fine)
                        
                        const existingIds = Object.keys(subscriptionsMap);
                        for (const id of existingIds) {
                            if (!validSubscriptionIds.has(id)) {
                                // Double check: If the user says they have 1 order, and we found 0, maybe we shouldn't delete?
                                // But if LS says 0, it usually means 0.
                                
                                // One edge case: If the subscription is "expired" (not active/cancelled), LS listSubscriptions might filter it out?
                                // Actually listSubscriptions returns all statuses by default unless filtered.
                                
                                console.log(`Pruning ghost subscription: ${id}`);
                                delete subscriptionsMap[id];
                                hasChanges = true;
                            }
                        }

                        if (hasChanges) {
                            // Re-calculate effective subscription (Active > Cancelled; Guild > Personal)
                            const now = new Date();
                            const getScore = (sub: any) => {
                                let score = 0;
                                const isGuild = sub.planType === 'guild';
                                const isActive = sub.status === 'active';
                                const isValidCancelled = sub.status === 'cancelled' && sub.endsAt && new Date(sub.endsAt) > now;
                                
                                if (isActive) score += 100;
                                else if (isValidCancelled) score += 50;
                                else score -= 100;
                                
                                if (isGuild) score += 10;
                                return score;
                            };

                            const allSubs = Object.values(subscriptionsMap);
                            allSubs.sort((a: any, b: any) => {
                                 const scoreA = getScore(a);
                                 const scoreB = getScore(b);
                                 if (scoreA !== scoreB) return scoreB - scoreA;
                                 const dateA = new Date(a.renewsAt || a.endsAt || 0).getTime();
                                 const dateB = new Date(b.renewsAt || b.endsAt || 0).getTime();
                                 return dateB - dateA;
                            });
                            
                            const effectiveSubscription = allSubs[0];
                            subscription = effectiveSubscription;
                            
                            // Update Firestore
                            await docRef.set({
                                subscriptions: subscriptionsMap,
                                subscription: effectiveSubscription,
                                updatedAt: new Date().toISOString()
                            }, { merge: true });

                            // Update local userData to reflect changes so return value is correct
                            if (userData) {
                                userData.subscriptions = subscriptionsMap;
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn("Force sync failed (non-critical):", err);
            }
        }

        // Sync missing details from Lemon Squeezy if needed (Legacy fallback)
        if (subscription && subscription.lemonSqueezySubscriptionId && (!subscription.productName || !subscription.variantName || !subscription.amountFormatted)) {
            try {
                const subRes = await getSubscription(subscription.lemonSqueezySubscriptionId);
                if (subRes.data?.data) {
                    const attrs = subRes.data.data.attributes;
                    
                    // Update local object
                    subscription = {
                        ...subscription,
                        productName: attrs.product_name,
                        variantName: attrs.variant_name,
                        cardBrand: attrs.card_brand,
                        cardLastFour: attrs.card_last_four,
                        renewsAt: attrs.renews_at, // Ensure date is fresh
                        endsAt: attrs.ends_at,
                        status: attrs.status,
                        customerPortalUrl: attrs.urls.customer_portal
                    };

                    // Try to fetch price from variant
                    if (attrs.variant_id) {
                        try {
                            const variantRes = await getVariant(attrs.variant_id);
                            if (variantRes.data?.data) {
                                const price = variantRes.data.data.attributes.price / 100;
                                const amountFormatted = price.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                });
                                subscription.amountFormatted = amountFormatted;
                            }
                        } catch (e) {
                            console.warn('Failed to fetch variant price:', e);
                        }
                    }

                    // Persist to Firestore
                    const updatePayload: any = {
                        'subscription.productName': attrs.product_name,
                        'subscription.variantName': attrs.variant_name,
                        'subscription.cardBrand': attrs.card_brand,
                        'subscription.cardLastFour': attrs.card_last_four,
                        'subscription.renewsAt': attrs.renews_at,
                        'subscription.endsAt': attrs.ends_at,
                        'subscription.status': attrs.status,
                        'subscription.customerPortalUrl': attrs.urls.customer_portal,
                        'subscription.amountFormatted': subscription.amountFormatted || null
                    };

                    // Also update the entry in subscriptions map if it exists to keep it consistent
                    if (userData?.subscriptions && userData.subscriptions[subscription.lemonSqueezySubscriptionId]) {
                        const subId = subscription.lemonSqueezySubscriptionId;
                        updatePayload[`subscriptions.${subId}.productName`] = attrs.product_name;
                        updatePayload[`subscriptions.${subId}.variantName`] = attrs.variant_name;
                        updatePayload[`subscriptions.${subId}.cardBrand`] = attrs.card_brand;
                        updatePayload[`subscriptions.${subId}.cardLastFour`] = attrs.card_last_four;
                        updatePayload[`subscriptions.${subId}.renewsAt`] = attrs.renews_at;
                        updatePayload[`subscriptions.${subId}.endsAt`] = attrs.ends_at;
                        updatePayload[`subscriptions.${subId}.status`] = attrs.status;
                        updatePayload[`subscriptions.${subId}.customerPortalUrl`] = attrs.urls.customer_portal;
                        updatePayload[`subscriptions.${subId}.amountFormatted`] = subscription.amountFormatted || null;
                        updatePayload[`subscriptions.${subId}.updatedAt`] = new Date().toISOString();
                    }

                    await docRef.update(updatePayload);
                }
            } catch (err: any) {
                // Ignore 404s, which can happen if subscription ID is stale or from a different environment
                if (err?.message?.includes('Not Found') || err?.cause?.errors?.[0]?.status === '404') {
                     // console.log('Subscription not found in Lemon Squeezy (stale ID?)');
                } else {
                    console.warn("Failed to sync subscription details:", err);
                }
            }
        }
        
        // Use the most up-to-date subscriptions map (either from sync or initial load)
        const finalSubscriptionsMap = userData?.subscriptions || {}; 
        
        // If we synced (hasChanges was used in the block above but scope is limited), we need to rely on the fact 
        // that we updated the doc. But we don't want to re-fetch.
        // Actually, we should capture the map from the sync block if possible.
        // Since we can't easily access variables from the try/catch block above without refactoring,
        // we will do a simple check: if we have subscription.lemonSqueezySubscriptionId, ensure it's in the list.

        let finalAllSubscriptions = Object.values(finalSubscriptionsMap);
        
        // If the map was empty but we have a main subscription, add it
        if (finalAllSubscriptions.length === 0 && subscription) {
            finalAllSubscriptions = [subscription];
        }
        
        return {
            subscription,
            allSubscriptions: finalAllSubscriptions,
            email: userData?.email || '',
            name: userData?.displayName || ''
        };
    } catch (error) {
        console.error('Error fetching subscription data:', error);
        return { error: 'Internal server error' };
    }
}

// Helper to search Albion Online characters (Added for build error fix)
const REGION_URLS = {
  Americas: 'https://gameinfo.albiononline.com',
  Asia: 'https://gameinfo-sgp.albiononline.com',
  Europe: 'https://gameinfo-ams.albiononline.com'
};

export async function searchAlbionCharacter(query: string) {
  if (!query || query.length < 2) return { players: [] };
  
  const cleanQuery = query.trim();
  console.log(`Searching for Albion character: "${cleanQuery}"`);

  const regions = ['Americas', 'Asia', 'Europe'] as const;

  try {
    const promises = regions.map(async (region) => {
        try {
            const baseUrl = REGION_URLS[region];
            const response = await fetch(`${baseUrl}/api/gameinfo/search?q=${encodeURIComponent(cleanQuery)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            if (!response.ok) {
                 console.warn(`[AlbionAPI] ${region} returned status: ${response.status}`);
                 return [];
            }

            const data = await response.json();
            const players = data.players || data.player || data.Player || [];
            return players.map((p: any) => ({ ...p, Region: region }));
        } catch (err) {
            console.warn(`[AlbionAPI] Failed to search ${region}:`, err);
            return [];
        }
    });

    const results = await Promise.all(promises);
    const allPlayers = results.flat();
    
    // Exact match logic (case-insensitive) across all regions
    const exactMatches = allPlayers.filter((p: any) => 
        p.Name?.toLowerCase() === cleanQuery.toLowerCase() || 
        p.name?.toLowerCase() === cleanQuery.toLowerCase()
    );

    if (exactMatches.length > 0) {
        console.log(`[AlbionAPI] Found exact matches:`, exactMatches.map((p: any) => `${p.Name} (${p.Region})`));
        return { players: exactMatches };
    }
    
    console.log(`[AlbionAPI] Found ${allPlayers.length} total players`);
    return { players: allPlayers };

  } catch (error) {
    console.error('[AlbionAPI] Search error:', error);
    if (error instanceof Error) {
      return { error: `Search failed: ${error.message}` };
    }
    return { error: 'Failed to search players' };
  }
}

export async function searchAlbionGuild(query: string) {
    if (!query || query.length < 2) return { guilds: [] };
    
    try {
      const response = await fetch(`https://gameinfo.albiononline.com/api/gameinfo/search?q=${encodeURIComponent(query)}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      return { guilds: data.guilds || [] };
    } catch (error) {
      console.error('Albion API Error:', error);
      return { error: 'Failed to search guilds' };
    }
  }

  export async function getAlbionGuild(guildId: string) {
    try {
      const response = await fetch(`https://gameinfo.albiononline.com/api/gameinfo/guilds/${guildId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      return { guild: data };
    } catch (error) {
      console.error('Albion API Error:', error);
      return { error: 'Failed to fetch guild details' };
    }
  }

  export async function getAlbionAlliance(allianceId: string) {
    try {
      const response = await fetch(`https://gameinfo.albiononline.com/api/gameinfo/alliances/${allianceId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      return { alliance: data };
    } catch (error) {
      console.error('Albion API Error:', error);
      return { error: 'Failed to fetch alliance details' };
    }
  }

  export async function transferGuildLicenseAction(oldGuildId: string, newGuildId: string, newGuildName: string, userId: string, newAllianceId?: string, newAllianceName?: string) {
    try {
        const oldRef = adminDb.collection('guild_licenses').doc(oldGuildId);
        const oldSnap = await oldRef.get();
        
        if (!oldSnap.exists) {
            return { success: false, error: 'Original license not found' };
        }
        
        const data = oldSnap.data();
        
        // Verify ownership
        if (data?.purchasedBy !== userId) {
             return { success: false, error: 'Unauthorized: You do not own this license' };
        }

        // Transaction to ensure atomicity
        await adminDb.runTransaction(async (t) => {
            const newRef = adminDb.collection('guild_licenses').doc(newGuildId);
            const newDoc = await t.get(newRef);
            
            // Only throw if target exists AND it's a different guild
            if (newDoc.exists && oldGuildId !== newGuildId) {
                throw new Error("Target guild already has a license!");
            }

            const newData: any = {
                ...data,
                guildId: newGuildId,
                guildName: newGuildName,
                updatedAt: new Date().toISOString()
            };

            // If alliance info is provided, update it
            if (newAllianceId) {
                newData.allianceId = newAllianceId;
                newData.allianceName = newAllianceName || null;
            } else {
                newData.allianceId = null;
                newData.allianceName = null;
            }

            t.set(newRef, newData);
            
            // Only delete the old document if it's a different document
            if (oldGuildId !== newGuildId) {
                t.delete(oldRef);
            }
        });
        
        return { success: true };
    } catch (err: any) {
        console.error('Error transferring guild license:', err);
        return { success: false, error: err.message || 'Transfer failed' };
    }
  }

// --- Helper Functions for Server Actions ---

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

function normalizeGuildLicense(data: any) {
    return {
        ...data,
        purchasedAt: formatFirestoreDate(data.purchasedAt),
        expiresAt: formatFirestoreDate(data.expiresAt)
    };
}

// --- New Server Actions for Guild License Management ---

export async function getMyPurchasedLicenseAction(uid: string) {
    try {
        const snapshot = await adminDb.collection('guild_licenses')
            .where('purchasedBy', '==', uid)
            .get();
            
        if (!snapshot.empty) {
            return { license: normalizeGuildLicense(snapshot.docs[0].data()) };
        }
        return { license: null };
    } catch (err: any) {
        console.error('Error fetching purchased license:', err);
        return { error: 'Failed to fetch license' };
    }
}

export async function claimGuildLicenseAction(uid: string, guildId: string, guildName: string, allianceId?: string, allianceName?: string) {
    try {
        // 1. Verify User has a Guild Subscription
        const userRef = adminDb.collection('users').doc(uid);
        const userSnap = await userRef.get();
        const userData = userSnap.data();
        
        const subscription = userData?.subscription;
        
        // Check if effective subscription is Guild plan
        // Also allow if they have a 'pending' status but planType is guild (edge case)
        if (subscription?.planType !== 'guild') {
            // Double check subscriptions map in case effective one is wrong
            const subs = userData?.subscriptions || {};
            const hasGuildSub = Object.values(subs).some((s: any) => 
                s.planType === 'guild' && (s.status === 'active' || (s.status === 'cancelled' && new Date(s.endsAt) > new Date()))
            );
            
            if (!hasGuildSub) {
                // FORCE SYNC: Check Lemon Squeezy one last time to ensure we have the latest data
                const syncResult = await getSubscriptionManagementData(uid);
                const syncedSubs = syncResult.allSubscriptions || [];
                
                const foundSyncedSub = syncedSubs.find((s: any) => 
                    s.planType === 'guild' && (s.status === 'active' || (s.status === 'cancelled' && new Date(s.endsAt) > new Date()))
                );

                if (!foundSyncedSub) {
                    return { error: 'No active Guild Master subscription found.' };
                }
                
                // If found after sync, we can proceed (the user profile is updated by getSubscriptionManagementData)
            }
        }

        // 2. Check if Guild License already exists for this guild
        const licenseRef = adminDb.collection('guild_licenses').doc(guildId);
        const licenseSnap = await licenseRef.get();
        
        if (licenseSnap.exists) {
            const licenseData = licenseSnap.data();
            if (licenseData?.purchasedBy !== uid) {
                 // Check if it's expired? If so, maybe allow takeover? 
                 // For now, strict ownership.
                 return { error: 'This guild already has an active license managed by another user.' };
            }
            // If owned by self, just return success (idempotent)
            return { success: true };
        }

        // 3. Check if User already has a license elsewhere (should be handled by getMyPurchasedLicenseAction but good to verify)
        const existingLicense = await adminDb.collection('guild_licenses')
            .where('purchasedBy', '==', uid)
            .get();
            
        if (!existingLicense.empty) {
             // User already has a license! They should use transfer instead.
             return { error: 'You already have an active guild license. Please transfer it instead of creating a new one.' };
        }

        // 4. Create License
        const newLicense: any = {
            guildId,
            guildName,
            purchasedBy: uid,
            active: true,
            purchasedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: subscription?.renewsAt || subscription?.endsAt || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
            isActive: true
        };

        if (allianceId) {
            newLicense.allianceId = allianceId;
            newLicense.allianceName = allianceName;
        }

        await licenseRef.set(newLicense);
        
        // 5. Update User Profile to remove pending flag
        await userRef.update({
            hasPendingGuildLicense: FieldValue.delete(),
            guildId: guildId, // Optional: auto-set their guild
            guildName: guildName
        });

        return { success: true };

    } catch (err: any) {
        console.error('Error claiming guild license:', err);
        return { error: 'Failed to activate license. Please contact support.' };
    }
}

export async function updateGuildLicenseAllianceAction(guildId: string, allianceId: string | null, allianceName: string | null) {
    try {
        const docRef = adminDb.collection('guild_licenses').doc(guildId);
        
        const updateData: any = {
            updatedAt: new Date().toISOString()
        };

        if (allianceId === null) {
            updateData.allianceId = FieldValue.delete();
            updateData.allianceName = FieldValue.delete();
        } else {
            updateData.allianceId = allianceId;
            updateData.allianceName = allianceName;
        }

        await docRef.set(updateData, { merge: true });
        return { success: true };
    } catch (err: any) {
        console.error('Error updating guild license alliance:', err);
        return { error: 'Failed to update guild license' };
    }
}

// --- Profile Update Action with Build Propagation ---

export async function updateUserProfileAndBuildsAction(uid: string, data: any) {
    try {
        const userRef = adminDb.collection('users').doc(uid);
        
        // Get current data to check for name change
        const userSnap = await userRef.get();
        const currentData = userSnap.data();
        
        const newDisplayName = data.displayName;
        const currentDisplayName = currentData?.displayName;
        const nameChanged = newDisplayName && newDisplayName !== currentDisplayName;
        
        // Update user profile
        await userRef.set({
            ...data,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        
        // Check for any builds that need name updates (auto-healing)
        const buildsRef = adminDb.collection('builds');
        const buildsSnap = await buildsRef.where('authorId', '==', uid).get();
        
        if (!buildsSnap.empty) {
            const batch = adminDb.batch();
            const chunks = [];
            let count = 0;
            let currentBatchCount = 0;
            let currentBatch = adminDb.batch();

            buildsSnap.docs.forEach((doc) => {
                const buildData = doc.data();
                // Only update if the name is actually different and new name is valid
                if (newDisplayName && buildData.authorName !== newDisplayName) {
                    currentBatch.update(doc.ref, { authorName: newDisplayName });
                    currentBatchCount++;
                    count++;

                    if (currentBatchCount >= 500) {
                        chunks.push(currentBatch.commit());
                        currentBatch = adminDb.batch();
                        currentBatchCount = 0;
                    }
                }
            });

            if (currentBatchCount > 0) {
                chunks.push(currentBatch.commit());
            }

            if (chunks.length > 0) {
                await Promise.all(chunks);
                console.log(`Updated ${count} builds with new author name: ${newDisplayName}`);
            }
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error updating profile and builds:', error);
        return { error: 'Failed to update profile' };
    }
}
