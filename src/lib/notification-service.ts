import { getUserProfile, UserProfile, UserRank, calculateUserGamification } from './user-profile';
import { sendNotificationAction } from '@/app/actions/notifications';
import { db } from './firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type NotificationType = 'welcome' | 'purchase_success' | 'rank_up' | 'reminder' | 'market_opportunity' | 'gold_alert';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: any; // Timestamp or date string
  data?: any;
}

export async function notifyUser(userId: string, type: NotificationType, data?: any, email?: string) {
  try {
    // 1. Send Email (via Server Action)
    // We don't await this to avoid blocking, but we catch errors inside the action
    sendNotificationAction(userId, type, data, email).catch(err => console.error('Error sending email notification:', err));

    // 2. Create In-App Notification
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
      case 'market_opportunity':
        title = 'Market Opportunity';
        message = data?.message || 'A high-profit market flip opportunity has been detected!';
        break;
      case 'gold_alert':
        title = 'Gold Price Alert';
        message = data?.message || 'Gold price has reached your target.';
        break;
    }

    await addDoc(collection(db, 'users', userId, 'notifications'), {
      type,
      title,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
      data: data || {}
    });

  } catch (error) {
    console.error('Error notifying user:', error);
  }
}

export async function checkAndNotifyRankUp(userId: string, builds: any[]) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return;

    const { rank: currentRank } = calculateUserGamification(profile, builds);
    const lastRank = profile.preferences?.lastNotifiedRank as UserRank | undefined;

    // Rank hierarchy
    const ranks: UserRank[] = ['Wanderer', 'Novice', 'Journeyman', 'Adept', 'Expert', 'Master', 'Grandmaster'];
    const currentRankIndex = ranks.indexOf(currentRank);
    const lastRankIndex = lastRank ? ranks.indexOf(lastRank) : -1;

    // Only notify if rank has INCREASED and we haven't notified for this rank yet
    if (currentRankIndex > lastRankIndex) {
      console.log(`User ${userId} ranked up to ${currentRank}`);
      
      // Update lastNotifiedRank FIRST to prevent duplicate notifications
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'preferences.lastNotifiedRank': currentRank
      });

      // Notify
      await notifyUser(userId, 'rank_up', { newRank: currentRank });
    }
  } catch (error) {
    console.error('Error checking rank up:', error);
  }
}
