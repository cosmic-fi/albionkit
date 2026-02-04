'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email-service';
import { getVerificationEmailHtml } from '@/lib/email-templates';

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
