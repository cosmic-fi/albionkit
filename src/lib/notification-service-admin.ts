import { adminDb } from './firebase-admin';
import { sendEmail } from './email-service';
import { NotificationType } from './notification-service';
import { getTranslations } from 'next-intl/server';
import { 
  getWelcomeEmailHtml, 
  getPurchaseSuccessEmailHtml, 
  getRankUpEmailHtml, 
  getReminderEmailHtml, 
  getWatchlistAlertEmailHtml, 
  getGoldAlertEmailHtml 
} from './email-templates';

export async function notifyUserAdmin(userId: string, type: NotificationType, data?: any, explicitEmail?: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    // Fallback profile if doc doesn't exist yet (rare race condition)
    const profile = userDoc.exists ? userDoc.data() : { preferences: { emailNotifications: true } };
    const preferences = profile?.preferences || { emailNotifications: true };

    // Always send email for purchase_success (transactional) or welcome, otherwise check preferences
    // For welcome emails, we want to ensure they go out even if preferences aren't fully set up yet
    const shouldSendEmail = type === 'purchase_success' || type === 'welcome' || preferences.emailNotifications;

    const emailToSend = explicitEmail || profile?.email;

    if (shouldSendEmail && emailToSend) {
      await sendEmailNotificationAdmin(profile || {}, emailToSend, type, data);
    }
  } catch (error) {
    console.error('Error notifying user (admin):', error);
  }
}

export async function createInAppNotificationAdmin(userId: string, type: NotificationType, data?: any) {
  try {
    // Fetch user to get locale
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const locale = userDoc.data()?.locale || 'en';
    const t = await getTranslations({ locale, namespace: 'Notifications' });

    let title = t('welcome.title');
    let message = t('welcome.message');

    switch (type) {
      case 'welcome':
        title = t('welcome.title');
        message = t('welcome.message');
        break;
      case 'purchase_success':
        title = t('subscriptionActive.title');
        message = t('subscriptionActive.message');
        break;
      case 'rank_up':
        title = t('rankUp.title');
        message = t('rankUp.message', { rank: data?.newRank || '' });
        break;
      case 'reminder':
        title = t('reminder.title');
        message = data?.message || '';
        break;
    }

    await adminDb.collection('users').doc(userId).collection('notifications').add({
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date(),
      data: data || {}
    });
  } catch (error) {
    console.error('Error creating in-app notification (admin):', error);
  }
}

async function sendEmailNotificationAdmin(profile: any, email: string, type: NotificationType, data?: any) {
  const locale = profile.locale || 'en';
  // Use Emails namespace for subject lines and templates
  // Note: getTranslations works on server side
  const t = await getTranslations({ locale, namespace: 'Emails' });

  let subject = '';
  let html = '';
  const name = profile.displayName || 'Traveler';

  switch (type) {
    case 'welcome':
      subject = t('welcome.subject');
      html = getWelcomeEmailHtml(name, t);
      break;
    case 'purchase_success':
      subject = t('purchase.subject');
      html = getPurchaseSuccessEmailHtml(name, t);
      break;
    case 'rank_up':
      subject = t('rankUp.subject', { rank: data?.newRank || '' });
      html = getRankUpEmailHtml(data?.newRank || '', t);
      break;
    case 'reminder':
        subject = t('reminder.subject');
        html = getReminderEmailHtml(data?.message || '', t);
        break;
      case 'market_opportunity':
        if (data?.isWatchlist) {
          subject = t('watchlist.subject');
          html = getWatchlistAlertEmailHtml(name, data.items, t);
        } else {
          subject = t('reminder.subject');
          html = getReminderEmailHtml(data?.message || '', t);
        }
        break;
      case 'gold_alert':
        const trendText = data.change > 0 ? t('gold.rising') : t('gold.dropping');
        subject = t('gold.baseTitle', { trendText });
        html = getGoldAlertEmailHtml(name, data.region, data.currentPrice, data.change, t);
        break;
      default:
      return;
  }

  if (subject && html && email) {
    await sendEmail({
      to: email,
      subject,
      html
    });
  }
}
