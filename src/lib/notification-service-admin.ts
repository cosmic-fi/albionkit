import { adminDb } from './firebase-admin';
import { sendEmail } from './email-service';
import { NotificationType } from './notification-service';
import { getWelcomeEmailHtml, getPurchaseSuccessEmailHtml, getRankUpEmailHtml, getReminderEmailHtml } from './email-templates';

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
    let title = 'Notification';
    let message = 'You have a new notification.';

    switch (type) {
      case 'welcome':
        title = 'Welcome to AlbionKit!';
        message = 'Thanks for joining! Explore our tools to get started.';
        break;
      case 'purchase_success':
        title = 'Subscription Active';
        message = 'Thank you for your support! You now have access to premium features.';
        break;
      case 'rank_up':
        title = 'Rank Up!';
        message = `Congratulations! You have reached ${data?.newRank || 'a new'} rank.`;
        break;
      case 'reminder':
        title = 'Reminder';
        message = data?.message || 'Here is your reminder.';
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
  let subject = '';
  let html = '';
  const name = profile.displayName || 'Traveler';

  switch (type) {
    case 'welcome':
      subject = 'Welcome to AlbionKit!';
      html = getWelcomeEmailHtml(name);
      break;
    case 'purchase_success':
      subject = 'Thank you for your support!';
      html = getPurchaseSuccessEmailHtml(name);
      break;
    case 'rank_up':
      subject = `You've reached ${data.newRank} Rank!`;
      html = getRankUpEmailHtml(data.newRank);
      break;
    case 'reminder':
      subject = 'Reminder from AlbionKit';
      html = getReminderEmailHtml(data.message);
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
