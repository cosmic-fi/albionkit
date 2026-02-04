
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  console.log('[EmailService] Attempting to send email to:', to);
  
  if (!RESEND_API_KEY) {
    console.warn('[EmailService] RESEND_API_KEY is not set. Email notification skipped.');
    return { success: false, error: 'API key missing' };
  } else {
    console.log('[EmailService] RESEND_API_KEY is present (length: ' + RESEND_API_KEY.length + ')');
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AlbionKit <notifications@albionkit.com>',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch (e) {
        error = errorText;
      }
      console.error('[EmailService] Failed to send email via Resend API:', response.status, error);
      return { success: false, error };
    }

    const data = await response.json();
    console.log('[EmailService] Email sent successfully via Resend API:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[EmailService] Error sending email:', error);
    return { success: false, error };
  }
}
