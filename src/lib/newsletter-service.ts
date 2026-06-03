import { adminDb } from './firebase-admin';
import { sendEmail } from './email-service';

export type NewsletterType = 'gold_alert' | 'flip_digest' | 'general';

/** Resend free tier: 100 emails/day. Leave headroom with 95. */
const DAILY_EMAIL_CAP = parseInt(process.env.DAILY_EMAIL_CAP || '95', 10);

interface Subscriber {
  uid: string;
  email: string;
  displayName?: string;
  locale?: string;
  preferences: {
    emailNotifications?: boolean;
    goldAlerts?: boolean;
    marketAlerts?: boolean;
  };
}

interface BatchSendResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Fetch all users who have opted into a specific newsletter type
 */
export async function getSubscribers(type: NewsletterType): Promise<Subscriber[]> {
  try {
    const usersRef = adminDb.collection('users');
    let query;

    switch (type) {
      case 'gold_alert':
        // Users with emailNotifications AND goldAlerts enabled
        query = usersRef
          .where('preferences.emailNotifications', '==', true)
          .where('preferences.goldAlerts', '==', true);
        break;
      case 'flip_digest':
        // Users with emailNotifications AND marketAlerts enabled
        query = usersRef
          .where('preferences.emailNotifications', '==', true)
          .where('preferences.marketAlerts', '==', true);
        break;
      case 'general':
        // All users with emailNotifications enabled
        query = usersRef
          .where('preferences.emailNotifications', '==', true);
        break;
      default:
        return [];
    }

    const snapshot = await query.get();
    const subscribers: Subscriber[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        subscribers.push({
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          locale: data.locale || 'en',
          preferences: data.preferences || {},
        });
      }
    });

    console.log(`[Newsletter] Found ${subscribers.length} subscribers for type: ${type}`);
    return subscribers;
  } catch (error) {
    console.error('[Newsletter] Error fetching subscribers:', error);
    return [];
  }
}

/**
 * Get today's date key for the daily email counter (YYYY-MM-DD)
 */
function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Read how many emails have been sent today from Firestore
 */
async function getDailyEmailCount(): Promise<number> {
  try {
    const doc = await adminDb.collection('email_rate_limit').doc(getTodayKey()).get();
    return doc.exists ? (doc.data()?.count || 0) : 0;
  } catch {
    return 0;
  }
}

/**
 * Atomically increment the daily email counter in Firestore
 */
async function incrementDailyEmailCount(count: number): Promise<number> {
  const todayKey = getTodayKey();
  const ref = adminDb.collection('email_rate_limit').doc(todayKey);
  await ref.set({ count, lastUpdated: new Date().toISOString() }, { merge: true });
  return count;
}

/**
 * Send a newsletter to all subscribers of a given type with rate limiting
 *
 * Supports two modes:
 * 1. Pass a static `html` string — simple {{name}} replacement per user
 * 2. Pass `renderFn` to generate per-user HTML (e.g. for locale-aware content)
 */
export async function sendNewsletter(
  type: NewsletterType,
  subject: string,
  html: string,
  options?: {
    dryRun?: boolean;
    batchSize?: number;
    delayMs?: number;
    renderFn?: (subscriber: Subscriber) => string | Promise<string>;
    renderSubjectFn?: (subscriber: Subscriber) => string | Promise<string>;
  }
): Promise<BatchSendResult> {
  const { dryRun = false, batchSize = 10, delayMs = 1000, renderFn, renderSubjectFn } = options || {};

  const subscribers = await getSubscribers(type);
  const result: BatchSendResult = {
    total: subscribers.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  if (subscribers.length === 0) {
    console.log('[Newsletter] No subscribers found, skipping send.');
    return result;
  }

  if (dryRun) {
    console.log(`[Newsletter] DRY RUN - Would send to ${subscribers.length} subscribers`);
    result.sent = subscribers.length;
    return result;
  }

  // Check daily email cap
  const sentToday = await getDailyEmailCount();
  const remaining = DAILY_EMAIL_CAP - sentToday;
  if (remaining <= 0) {
    console.log(`[Newsletter] Daily cap reached (${sentToday}/${DAILY_EMAIL_CAP}). Skipping send.`);
    result.errors.push(`Daily cap reached: ${sentToday}/${DAILY_EMAIL_CAP}`);
    return result;
  }

  // Cap the number of emails we send in this batch
  const cappedSubscribers = subscribers.slice(0, remaining);
  if (cappedSubscribers.length < subscribers.length) {
    console.log(`[Newsletter] Capping batch: ${cappedSubscribers.length}/${subscribers.length} (daily cap: ${sentToday}/${DAILY_EMAIL_CAP})`);
  }
  result.total = cappedSubscribers.length;
  let dailyCount = sentToday;

  // Send in batches with delay to respect Resend rate limits
  for (let i = 0; i < cappedSubscribers.length; i += batchSize) {
    const batch = cappedSubscribers.slice(i, i + batchSize);

    const promises = batch.map(async (subscriber) => {
      try {
        const subscriberName = subscriber.displayName || 'Traveler';
        // If a render function is provided, use it to generate per-user HTML (locale-aware)
        // Otherwise fall back to simple placeholder replacement
        const subscriberHtml = renderFn
          ? await renderFn(subscriber)
          : html
              .replace(/\{\{name\}\}/g, subscriberName)
              .replace(/\{\{email\}\}/g, subscriber.email);

        const subscriberSubject = renderFn
          ? renderSubjectFn
            ? await renderSubjectFn(subscriber)
            : subject
          : subject.replace(/\{\{name\}\}/g, subscriberName);

        const emailResult = await sendEmail({
          to: subscriber.email,
          subject: subscriberSubject,
          html: subscriberHtml,
        });

        if (emailResult.success) {
          result.sent++;
          dailyCount++;
        } else {
          result.failed++;
          result.errors.push(`Failed to send to ${subscriber.email}: ${JSON.stringify(emailResult.error)}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Error sending to ${subscriber.email}: ${error}`);
      }
    });

    await Promise.all(promises);

    // Log progress
    console.log(`[Newsletter] Batch ${Math.floor(i / batchSize) + 1} complete. Sent: ${result.sent}, Failed: ${result.failed}`);

    // Delay between batches (except for the last batch)
    if (i + batchSize < cappedSubscribers.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`[Newsletter] Send complete. Total: ${result.total}, Sent: ${result.sent}, Failed: ${result.failed}`);

  // Update daily counter in Firestore
  if (result.sent > 0) {
    await incrementDailyEmailCount(dailyCount);
    console.log(`[Newsletter] Daily counter updated: ${dailyCount}/${DAILY_EMAIL_CAP}`);
  }

  return result;
}

/**
 * Get subscriber count by type
 */
export async function getSubscriberCounts(): Promise<Record<NewsletterType, number>> {
  const [goldSubs, flipSubs, generalSubs] = await Promise.all([
    getSubscribers('gold_alert'),
    getSubscribers('flip_digest'),
    getSubscribers('general'),
  ]);

  return {
    gold_alert: goldSubs.length,
    flip_digest: flipSubs.length,
    general: generalSubs.length,
  };
}
