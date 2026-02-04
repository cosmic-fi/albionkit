'use server';

import { notifyUserAdmin } from '@/lib/notification-service-admin';
import { NotificationType } from '@/lib/notification-service';

export async function sendNotificationAction(userId: string, type: NotificationType, data?: any, email?: string) {
  await notifyUserAdmin(userId, type, data, email);
}
