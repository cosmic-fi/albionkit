import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { notifyUserAdmin, createInAppNotificationAdmin } from '@/lib/notification-service-admin';

async function updateSubscriptionStatus(uid: string, data: any, eventType: string) {
    try {
        const docRef = adminDb.collection('users').doc(uid);
        
        // Get current status to check for changes
        const doc = await docRef.get();
        const currentData = doc.data() || {};
        const previousStatus = currentData?.subscription?.status;

        // 1. Initialize subscriptions map from existing data
        // Use a Record<string, any> type for subscriptions
        let subscriptions: Record<string, any> = currentData.subscriptions || {};
        
        // Migration: If no subscriptions map but legacy subscription exists, add it to map
        if (Object.keys(subscriptions).length === 0 && currentData.subscription?.lemonSqueezySubscriptionId) {
            subscriptions[currentData.subscription.lemonSqueezySubscriptionId] = {
                ...currentData.subscription,
                migratedAt: new Date().toISOString()
            };
        }

        // 2. Add/Update the incoming subscription
        const subId = data.lemonSqueezySubscriptionId;
        // Remove undefined fields
        const cleanData = JSON.parse(JSON.stringify(data));
        
        subscriptions[subId] = {
            ...cleanData,
            updatedAt: new Date().toISOString()
        };

        // 3. Determine Effective Subscription Logic
        const now = new Date();
        const getScore = (sub: any) => {
            let score = 0;
            const isGuild = sub.planType === 'guild';
            const isActive = sub.status === 'active';
            const isValidCancelled = sub.status === 'cancelled' && sub.endsAt && new Date(sub.endsAt) > now;
            
            if (isActive) score += 100;
            else if (isValidCancelled) score += 50;
            else score -= 100; // Expired/invalid
            
            if (isGuild) score += 10;
            
            return score;
        };

        const allSubs = Object.values(subscriptions);
        // Sort by score descending to find the best one
        allSubs.sort((a: any, b: any) => {
             const scoreA = getScore(a);
             const scoreB = getScore(b);
             if (scoreA !== scoreB) return scoreB - scoreA;
             // Tie breaker: latest end/renew date
             const dateA = new Date(a.renewsAt || a.endsAt || 0).getTime();
             const dateB = new Date(b.renewsAt || b.endsAt || 0).getTime();
             return dateB - dateA;
        });
        
        const effectiveSubscription = allSubs[0]; // The winner

        // 4. Prepare Update Data
        // Calculate hasPremiumAccess based on EFFECTIVE subscription
        let hasPremiumAccess = false;
        if (effectiveSubscription) {
             if (effectiveSubscription.status === 'active') hasPremiumAccess = true;
             else if (effectiveSubscription.status === 'cancelled' && effectiveSubscription.endsAt) {
                 if (new Date(effectiveSubscription.endsAt) > now) hasPremiumAccess = true;
             }
        }

        const updateData: any = {
            subscriptions: subscriptions,
            subscription: effectiveSubscription, // Update legacy field with the best one
            updatedAt: new Date().toISOString()
        };

        // If user has no email in profile, use the one from billing
        if (!currentData?.email && data.email) {
            updateData.email = data.email;
        }

        // Update isPremium flag (mostly for Personal/Adept plans)
        // We set it based on the effective subscription's status
        if (effectiveSubscription?.planType === 'personal') {
            updateData.isPremium = hasPremiumAccess;
        }

        await docRef.set(updateData, { merge: true });
        console.log(`Successfully updated subscription for user ${uid}. Effective plan: ${effectiveSubscription?.planType} (${effectiveSubscription?.status})`);

        // Notify user only if status CHANGED to active (prevents duplicates)
        // We compare against the previous effective status
        const isNowActive = effectiveSubscription?.status === 'active';
        const wasActive = previousStatus === 'active';

        if (isNowActive && !wasActive) {
            if (eventType === 'subscription_created' || eventType === 'subscription_updated') {
                await notifyUserAdmin(uid, 'purchase_success');
                await createInAppNotificationAdmin(uid, 'purchase_success');
            }
        }

        return true;
    } catch (err) {
        console.error('Error updating subscription status:', err);
        return false;
    }
}

async function activateGuildLicense(guildId: string, userId: string) {
    try {
        const docRef = adminDb.collection('guild_licenses').doc(guildId);
        await docRef.set({
            guildId,
            purchasedBy: userId,
            active: true,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        return true;
    } catch (err) {
        console.error('Error activating guild license:', err);
        return false;
    }
}

async function activatePendingGuildLicense(userId: string) {
    try {
        const docRef = adminDb.collection('users').doc(userId);
        await docRef.set({
            hasPendingGuildLicense: true,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        return true;
    } catch (err) {
        console.error('Error activating pending guild license:', err);
        return false;
    }
}

async function saveOrderInvoice(uid: string, orderData: any) {
    try {
        const invoiceData = {
            id: orderData.id,
            orderId: orderData.id,
            date: orderData.attributes.created_at,
            amount: orderData.attributes.total_formatted,
            status: orderData.attributes.status,
            receiptUrl: orderData.attributes.urls.receipt,
            createdAt: new Date().toISOString()
        };
        
        // Save to users/{uid}/invoices/{orderId}
        await adminDb.collection('users').doc(uid)
            .collection('invoices').doc(orderData.id.toString())
            .set(invoiceData, { merge: true });
            
        console.log(`Saved invoice ${orderData.id} for user ${uid}`);
        return true;
    } catch (err) {
        console.error('Error saving invoice:', err);
        return false;
    }
}

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const eventType = req.headers.get("X-Event-Name");
    const signature = req.headers.get("X-Signature");
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!secret) {
      console.error('LEMONSQUEEZY_WEBHOOK_SECRET not set');
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(text).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'))) {
       return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(text);
    const { meta } = payload;
    const custom_data = meta.custom_data;

    console.log('Webhook received:', eventType, custom_data);

    if (!custom_data || !custom_data.user_id) {
       return NextResponse.json({ message: 'No user_id in custom_data' }, { status: 200 });
    }

    if (eventType === 'order_created' || eventType === 'subscription_created' || eventType === 'subscription_updated' || eventType === 'subscription_cancelled' || eventType === 'subscription_expired') {
        const { user_id, plan_type, guild_id } = custom_data;
        const attributes = payload.data.attributes;
        
        // Save invoice for new orders
        if (eventType === 'order_created') {
             await saveOrderInvoice(user_id, payload.data);
        }

        const status = attributes.status; // active, past_due, unpaid, cancelled, expired
        const renewsAt = attributes.renews_at;
        const endsAt = attributes.ends_at;
        const subscriptionId = payload.data.id;
        const customerId = attributes.customer_id;

        // Update generic subscription status in user profile
        await updateSubscriptionStatus(user_id, {
            status,
            planType: plan_type,
            renewsAt,
            endsAt,
            lemonSqueezySubscriptionId: subscriptionId,
            customerId,
            email: attributes.user_email
        }, eventType);

        // Specific Logic
        if (plan_type === 'personal') {
            // activatePersonalPremium is now redundant if we rely solely on subscription status
        } else if (plan_type === 'guild') {
             // Logic for guild license expiration/cancellation could be complex
             // For now, if active, we ensure it's active
             if (status === 'active') {
                if (guild_id) {
                    await activateGuildLicense(guild_id, user_id);
                } else {
                    await activatePendingGuildLicense(user_id);
                }
             }
             // If expired/cancelled, we might want to deactivate the guild license
             // but that requires finding the guild license doc by user_id which is a query.
             // For MVP, we'll let the license expire naturally via its own 'expiresAt' field 
             // or handle it manually.
        }
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
