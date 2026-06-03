import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendNewsletter, getSubscribers } from '@/lib/newsletter-service';
import { getGoldAlertNewsletterHtml } from '@/lib/newsletter-templates';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Cron job: Check gold prices and send alerts when significant changes detected
 * 
 * Expected Vercel cron: every 12 hours (0 0,12 * * *)
 * Verifies via CRON_SECRET header
 * 
 * Stores last known prices in Firestore `cron_state/gold_prices`
 * Alerts when price changes by more than 3%
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron:Gold] Starting gold price check...');

  try {
    // Fetch current gold prices from Albion API for all regions
    const regions = ['americas', 'europe', 'asia'];
    const currentPrices: Record<string, number> = {};

    for (const region of regions) {
      try {
        const response = await fetch(
          `https://www.albion-online-data.com/api/v2/stats/gold/T8_GOLD?region=${region}`,
          { next: { revalidate: 0 } }
        );

        if (response.ok) {
          const data = await response.json();
          // The API returns an array of price entries, get the latest
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[data.length - 1];
            currentPrices[region] = latest.price || latest.avg_price || 0;
          }
        }
      } catch (err) {
        console.error(`[Cron:Gold] Failed to fetch gold price for ${region}:`, err);
      }
    }

    if (Object.keys(currentPrices).length === 0) {
      console.log('[Cron:Gold] No gold prices fetched, skipping.');
      return NextResponse.json({ success: false, reason: 'No prices fetched' });
    }

    console.log('[Cron:Gold] Current prices:', currentPrices);

    // Get last known prices from Firestore
    const cronStateRef = adminDb.collection('cron_state').doc('gold_prices');
    const cronStateDoc = await cronStateRef.get();
    const previousState = cronStateDoc.exists ? cronStateDoc.data() : null;

    // Check for significant changes (>3%)
    const alerts: Array<{
      region: string;
      currentPrice: number;
      previousPrice: number;
      change: number;
    }> = [];

    for (const region of regions) {
      const currentPrice = currentPrices[region];
      const previousPrice = previousState?.prices?.[region];

      if (currentPrice && previousPrice && previousPrice > 0) {
        const change = ((currentPrice - previousPrice) / previousPrice) * 100;

        if (Math.abs(change) >= 3) {
          alerts.push({
            region,
            currentPrice,
            previousPrice,
            change,
          });
          console.log(`[Cron:Gold] Significant change detected in ${region}: ${change.toFixed(1)}%`);
        }
      }
    }

    // Send alerts if any
    let sendResult = null;
    if (alerts.length > 0) {
      // Send one email covering all regions with alerts
      const primaryAlert = alerts.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];

      // Render per-user HTML in their locale
      const renderFn = (subscriber: any) => {
        return getGoldAlertNewsletterHtml({
          name: subscriber.displayName || 'Traveler',
          locale: subscriber.locale || 'en',
          region: primaryAlert.region,
          currentPrice: primaryAlert.currentPrice,
          previousPrice: primaryAlert.previousPrice,
          change: primaryAlert.change,
        });
      };

      sendResult = await sendNewsletter(
        'gold_alert',
        `Gold ${primaryAlert.change > 0 ? '📈 Rising' : '📉 Dropping'} - ${primaryAlert.region.toUpperCase()}`,
        '', // unused when renderFn is provided
        {
          renderFn,
          batchSize: 10,
          delayMs: 1000,
        }
      );

      console.log(`[Cron:Gold] Alerts sent. Result:`, sendResult);
    } else {
      console.log('[Cron:Gold] No significant changes detected.');
    }

    // Update stored prices
    await cronStateRef.set({
      prices: currentPrices,
      lastChecked: new Date().toISOString(),
      lastAlerts: alerts.length > 0 ? alerts : previousState?.lastAlerts || [],
    });

    return NextResponse.json({
      success: true,
      prices: currentPrices,
      alerts: alerts.length,
      sendResult,
    });
  } catch (error) {
    console.error('[Cron:Gold] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
