'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email-service';
import { getVerificationEmailHtml } from '@/lib/email-templates';

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
    const result = await sendEmail({
      to: email,
      subject: 'Verify your email for AlbionKit',
      html: getVerificationEmailHtml(link),
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
