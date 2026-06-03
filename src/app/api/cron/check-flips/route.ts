import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendNewsletter } from '@/lib/newsletter-service';
import { getFlipDigestNewsletterHtml } from '@/lib/newsletter-templates';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Cron job: Check for top flip opportunities and send digest
 * 
 * Expected Vercel cron: weekly on Monday at 12:00 UTC (0 12 * * 1)
 * Verifies via CRON_SECRET header
 * 
 * Fetches popular items, checks Black Market vs city prices,
 * and sends a digest of the top 10 most profitable flips
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron:Flips] Starting flip digest check...');

  try {
    // Fetch market data for popular items across regions
    const regions = ['americas', 'europe', 'asia'];
    const allFlips: Array<{
      name: string;
      itemId: string;
      buyCity: string;
      buyPrice: number;
      sellPrice: number;
      profit: number;
      margin: number;
      roi: number;
    }> = [];

    // Popular high-value items to check
    const popularItems = [
      'T8_MAIN_MACE_ENIGMA', 'T8_MAIN_AXE_ENIGMA', 'T8_2H_HAMMER_ENIGMA',
      'T8_2H_CROSSBOW_ENIGMA', 'T8_MAIN_SWORD_ENIGMA', 'T8_MAIN_DAGGER_ENIGMA',
      'T8_MAIN_STAFF_ENIGMA', 'T8_2H_BOW_ENIGMA', 'T8_MAIN_SPEAR_ENIGMA',
      'T8_2HQuarterstaff_ENIGMA', 'T8_ARMOR_PLATE_ENIGMA', 'T8_ARMOR_LEATHER_ENIGMA',
      'T8_ARMOR_CLOTH_ENIGMA', 'T8_ARMOR_MOUNTED_ENIGMA',
      'T8_BAG_ENIGMA', 'T8_CAPE_ENIGMA', 'T8_OFF_SHIELD_ENIGMA',
      'T8_POTION_CC', 'T8_POTION_HEAL', 'T8_POTION_CLEANSE',
      'T8_FISH_FRESHWATER_FOREST', 'T8_FISH_SALTWATER_SWAMP',
    ];

    for (const region of regions) {
      try {
        // Fetch item prices from Albion Data Project
        const itemParam = popularItems.join(',');
        const response = await fetch(
          `https://www.albion-online-data.com/api/v2/prices/${itemParam}?locations=Bridgewatch&qualities=1&region=${region}`,
          { next: { revalidate: 0 } }
        );

        if (response.ok) {
          const prices = await response.json();

          // Fetch Black Market prices
          const bmResponse = await fetch(
            `https://www.albion-online-data.com/api/v2/prices/${itemParam}?locations=Caerleon&qualities=1&region=${region}`,
            { next: { revalidate: 0 } }
          );

          if (bmResponse.ok) {
            const bmPrices = await bmResponse.json();
            const bmPriceMap = new Map<string, number>();
            
            bmPrices.forEach((p: any) => {
              if (p.location === 'Caerleon') {
                bmPriceMap.set(p.item_id, p.sell_price_max || p.sell_price_min || 0);
              }
            });

            // Calculate flips
            prices.forEach((p: any) => {
              if (p.location === 'Bridgewatch') {
                const buyPrice = p.buy_price_max || p.buy_price_min || 0;
                const sellPrice = bmPriceMap.get(p.item_id) || 0;

                if (buyPrice > 0 && sellPrice > 0 && sellPrice > buyPrice) {
                  const profit = sellPrice - buyPrice;
                  const margin = (profit / buyPrice) * 100;

                  if (margin > 5 && profit > 1000) {
                    const name = p.item_id
                      .replace(/^T\d+_/, '')
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l: string) => l.toUpperCase());

                    allFlips.push({
                      name,
                      itemId: p.item_id,
                      buyCity: 'Bridgewatch',
                      buyPrice,
                      sellPrice,
                      profit,
                      margin,
                      roi: margin,
                    });
                  }
                }
              }
            });
          }
        }
      } catch (err) {
        console.error(`[Cron:Flips] Failed to fetch data for ${region}:`, err);
      }
    }

    // Sort by profit and take top 10
    const topFlips = allFlips
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    console.log(`[Cron:Flips] Found ${allFlips.length} flips, top ${topFlips.length} selected.`);

    if (topFlips.length === 0) {
      console.log('[Cron:Flips] No profitable flips found, skipping send.');
      return NextResponse.json({ success: true, flips: 0, sent: false });
    }

    // Send digest - render per-user in their locale
    const renderFn = (subscriber: any) => {
      return getFlipDigestNewsletterHtml(topFlips, subscriber.locale || 'en');
    };

    const sendResult = await sendNewsletter(
      'flip_digest',
      '🔥 Top Flip Opportunities - AlbionKit',
      '',
      { renderFn, batchSize: 10, delayMs: 1000 }
    );

    console.log(`[Cron:Flips] Digest sent. Result:`, sendResult);

    // Log to Firestore for history
    await adminDb.collection('cron_state').doc('flip_digest_log').set({
      lastRun: new Date().toISOString(),
      totalFlips: allFlips.length,
      sentFlips: topFlips.length,
      sendResult,
    });

    return NextResponse.json({
      success: true,
      totalFlips: allFlips.length,
      topFlips: topFlips.length,
      sendResult,
    });
  } catch (error) {
    console.error('[Cron:Flips] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
