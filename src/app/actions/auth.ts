'use server';

import { getTranslations } from 'next-intl/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email-service';
import { getVerificationEmailHtml } from '@/lib/email-templates';

export async function updateLoginStreakAction(userId: string) {
  if (!userId) return { success: false };

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return { success: false };

    const data = userDoc.data();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    let lastLoginAt = data?.lastLoginAt ? new Date(data.lastLoginAt) : null;
    let currentStreak = data?.currentStreak || 0;
    let longestStreak = data?.longestStreak || 0;

    if (!lastLoginAt) {
      // First time login tracking
      currentStreak = 1;
      longestStreak = 1;
    } else {
      const lastLoginDate = new Date(lastLoginAt.getFullYear(), lastLoginAt.getMonth(), lastLoginAt.getDate()).getTime();
      const diffDays = (today - lastLoginDate) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        // Logged in yesterday, increment streak
        currentStreak += 1;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else if (diffDays > 1) {
        // Missed a day or more, reset streak
        currentStreak = 1;
      }
      // If diffDays === 0, already logged in today, do nothing to streak
    }

    await userRef.update({
      lastLoginAt: now.toISOString(),
      currentStreak,
      longestStreak,
      updatedAt: now.toISOString()
    });

    return { 
      success: true, 
      currentStreak, 
      longestStreak,
      isNewDay: !lastLoginAt || (today > new Date(lastLoginAt.getFullYear(), lastLoginAt.getMonth(), lastLoginAt.getDate()).getTime())
    };
  } catch (error) {
    console.error('[AuthAction] Error updating streak:', error);
    return { success: false };
  }
}

export async function verifyCaptcha(token: string) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('RECAPTCHA_SECRET_KEY is not set. Captcha verification skipped.');
    return { success: true };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: 'Captcha verification failed' };
    }
  } catch (error) {
    console.error('Error verifying captcha:', error);
    return { success: false, error: 'Error verifying captcha' };
  }
}

export async function sendVerificationEmail(email: string) {
  console.log('[AuthAction] Starting sendVerificationEmail for:', email);
  
  if (!email) {
    console.error('[AuthAction] No email provided');
    return { success: false, error: 'Email is required' };
  }

  try {
    // Generate the verification link using Firebase Admin SDK
    console.log('[AuthAction] Generating verification link...');
    const link = await adminAuth.generateEmailVerificationLink(email);
    console.log('[AuthAction] Link generated successfully');

    // Send the email using Resend
    console.log('[AuthAction] Sending email via Resend...');
    const t = await getTranslations('Emails');
    const result = await sendEmail({
      to: email,
      subject: t('verification.subject'),
      html: getVerificationEmailHtml(link, t),
    });

    if (!result.success) {
      console.error('[AuthAction] Failed to send email via Resend:', result.error);
      return { success: false, error: 'Failed to send email service: ' + JSON.stringify(result.error) };
    }

    console.log('[AuthAction] Email sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[AuthAction] Error in sendVerificationEmail:', error);
    return { success: false, error: error.message };
  }
}
