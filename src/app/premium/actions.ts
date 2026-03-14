'use server';

import { createCheckout, getVariant } from '@lemonsqueezy/lemonsqueezy.js';
import { configureLemonSqueezy } from '@/lib/lemonsqueezy';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

// Initialize configuration
configureLemonSqueezy();

// Helper to get user profile (admin)
async function getUserProfileAdmin(uid: string) {
    try {
        console.log(`[getUserProfileAdmin] Fetching profile for uid: ${uid}`);
        
        // DEBUG: Check what project we are connected to
        console.log(`[getUserProfileAdmin] Env Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
        console.log(`[getUserProfileAdmin] Admin App Options: ${JSON.stringify(adminAuth.app.options)}`);
        
        // DEBUG: List first few users in Auth to see if we are in the right place
        try {
            const listUsersResult = await adminAuth.listUsers(5);
            console.log(`[getUserProfileAdmin] Auth Users found: ${listUsersResult.users.length}`);
            listUsersResult.users.forEach(u => console.log(` - ${u.uid} (${u.email})`));
        } catch (e) {
            console.error('[getUserProfileAdmin] Failed to list auth users:', e);
        }

        const docRef = adminDb.collection('users').doc(uid);
        const docSnap = await docRef.get();
        
        console.log(`[getUserProfileAdmin] Exists: ${docSnap.exists}, Path: ${docRef.path}`);
        
        if (docSnap.exists) {
            return docSnap.data() as any;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile (admin):', error);
        return null;
    }
}

export async function getGuildDetails(guildId: string) {
  if (!guildId) return null;

  try {
    const response = await fetch(`https://gameinfo.albiononline.com/api/gameinfo/guilds/${guildId}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch guild details');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching guild details:', error);
    return null;
  }
}

export async function getProductPrices() {
  try {
    const personalVariantId = process.env.LEMONSQUEEZY_VARIANT_ID_PERSONAL;
    const guildVariantId = process.env.LEMONSQUEEZY_VARIANT_ID_GUILD;

    if (!personalVariantId || !guildVariantId) {
      console.warn('Missing variant IDs for price fetching');
      return { personal: '$4.99', guild: '$19.99' }; // Fallback prices
    }

    // Validate variant IDs are numbers
    if (isNaN(Number(personalVariantId)) || isNaN(Number(guildVariantId))) {
      console.error('Invalid variant IDs - must be numeric');
      return { personal: '$4.99', guild: '$19.99' }; // Fallback prices
    }

    console.log(`[getProductPrices] Fetching prices for variants: Personal=${personalVariantId}, Guild=${guildVariantId}`);

    const [personal, guild] = await Promise.all([
      getVariant(personalVariantId).catch(err => {
        console.error('[getProductPrices] Error fetching personal variant:', err.message || err);
        return { data: null, error: err };
      }),
      getVariant(guildVariantId).catch(err => {
        console.error('[getProductPrices] Error fetching guild variant:', err.message || err);
        return { data: null, error: err };
      })
    ]);

    // Helper to format price
    const formatPrice = (variant: any) => {
        if (!variant || !variant.data || !variant.data.data) {
          console.warn('[getProductPrices] Variant data missing for formatting');
          return '$4.99'; // Fallback price
        }
        try {
          const price = variant.data.data.attributes.price / 100;
          return price.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
          });
        } catch (e) {
          console.error('[getProductPrices] Error formatting price:', e);
          return '$4.99'; // Fallback price
        }
    };

    return {
        personal: formatPrice(personal),
        guild: formatPrice(guild)
    };

  } catch (error) {
    console.error('Error fetching prices:', error);
    return { personal: '$4.99', guild: '$19.99' }; // Fallback prices
  }
}

export async function getCheckoutURL(userId: string, type: 'personal' | 'guild', interval: 'month' | 'year' = 'month') {
  try {
    // Use Admin SDK to bypass client-side permission rules
    const profile = await getUserProfileAdmin(userId);
    
    if (!profile) {
        throw new Error('User profile not found in database. Please contact support.');
    }
    
    if (!profile.email) throw new Error('User email not found');

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    let variantId = type === 'personal' 
      ? process.env.LEMONSQUEEZY_VARIANT_ID_PERSONAL 
      : process.env.LEMONSQUEEZY_VARIANT_ID_GUILD;

    if (interval === 'year') {
        const yearlyVariantId = type === 'personal'
            ? process.env.LEMONSQUEEZY_VARIANT_ID_PERSONAL_YEARLY
            : process.env.LEMONSQUEEZY_VARIANT_ID_GUILD_YEARLY;
        
        if (yearlyVariantId) {
            variantId = yearlyVariantId;
        } else {
            console.warn(`Missing yearly variant ID for ${type}, falling back to monthly`);
        }
    }

    if (!storeId || !variantId) {
        console.error('Missing Lemon Squeezy env vars');
        throw new Error('Payment configuration missing');
    }

    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`
        : 'http://localhost:3000/settings?success=true';

    const customData: any = {
        user_id: userId,
        plan_type: type,
        is_trial: (!profile.preferences?.hasUsedTrial).toString(),
    };
    if (type === 'guild' && profile.guildId) {
        customData.guild_id = profile.guildId;
    }

    const checkoutPayload = {
        checkoutOptions: {
            embed: false,
            media: false,
            logo: true,
        },
        checkoutData: {
            email: profile.email,
            custom: customData,
        },
        productOptions: {
            redirectUrl,
            receiptButtonText: 'Return to Dashboard',
            receiptThankYouNote: 'Thank you for supporting AlbionKit!',
        },
    };

    console.log('Creating checkout with payload:', JSON.stringify(checkoutPayload, null, 2));

    try {
        // Validate environment variables before making API call
        if (!process.env.LEMONSQUEEZY_API_KEY) {
            console.error('[getCheckoutURL] LEMON_SQUEEZY_API_KEY is missing');
            return { error: 'Payment configuration incomplete. Please contact support.' };
        }

        const checkout = await createCheckout(
            parseInt(storeId),
            parseInt(variantId),
            checkoutPayload
        );

        console.log('[getCheckoutURL] Checkout response:', JSON.stringify(checkout, null, 2));

        // Check for errors in the response
        if (checkout.error) {
            console.error('[getCheckoutURL] Lemon Squeezy Error:', checkout.error);
            return { error: `Payment provider error: ${checkout.error.message || 'Unknown error'}` };
        }

        // Extract URL from the nested response structure
        const checkoutUrl = checkout.data?.data?.attributes?.url;
        
        if (!checkoutUrl) {
            console.error('[getCheckoutURL] No checkout URL in response:', checkout);
            return { error: 'Failed to create checkout session. Please try again.' };
        }

        console.log('[getCheckoutURL] Checkout URL created successfully:', checkoutUrl);
        return { url: checkoutUrl };
    } catch (lsError: any) {
        console.error('[getCheckoutURL] Exception during createCheckout:', lsError);

        // Check if it's an HTTP error with HTML response
        if (lsError.message && lsError.message.includes('Unexpected token')) {
            console.error('[getCheckoutURL] Lemon Squeezy returned HTML instead of JSON.');
            console.error('[getCheckoutURL] This usually means:');
            console.error('[getCheckoutURL] 1. API Key is invalid/expired');
            console.error('[getCheckoutURL] 2. Store ID or Variant ID is incorrect');
            console.error('[getCheckoutURL] 3. Lemon Squeezy API is down');
            return {
                error: 'Payment provider configuration error. Please check API credentials or contact support.'
            };
        }

        return { error: 'Failed to connect to payment provider' };
    }

  } catch (error) {
    console.error('Error creating checkout:', error);
    return { error: 'Failed to create checkout session' };
  }
}

// Keep mock for backward compatibility or dev mode if needed, but we'll try to use real checkouts
export async function processUpgrade(type: 'personal' | 'guild', targetId: string) {
  // Deprecated in favor of getCheckoutURL
  // This is just a fallback stub now
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    success: true,
    message: `Successfully upgraded to ${type === 'personal' ? 'Premium Personal' : 'Guild License'}!`
  };
}

