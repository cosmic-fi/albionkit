'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { sendVerificationEmail } from '@/app/actions/auth';
import { AlertTriangle, Send, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { verifyBeforeUpdateEmail } from 'firebase/auth';

import { useTranslations } from 'next-intl';

export function VerificationBanner() {
  const t = useTranslations('Auth.verification');
  const { user, profile, loading } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Determine the target email (profile email takes precedence if different from auth email)
  // This handles the case where a user changes their email but hasn't verified it yet
  const targetEmail = profile?.email || user?.email;
  const isPendingUpdate = user?.email && targetEmail && user.email !== targetEmail;

  // Don't show if:
  // 1. Auth is loading
  // 2. User not logged in
  // 3. Email already verified AND no pending update
  // 4. Banner dismissed for this session
  if (loading || !user || (user.emailVerified && !isPendingUpdate) || dismissed) {
    return null;
  }

  const handleResend = async () => {
    if (!user || !targetEmail) return;
    
    setSending(true);
    try {
      if (isPendingUpdate) {
         // Use client-side SDK for pending email updates
         await verifyBeforeUpdateEmail(user, targetEmail);
      } else {
         // Use server action for current email verification
         const result = await sendVerificationEmail(targetEmail);
         if (!result.success) {
            throw new Error(result.error);
         }
      }

      setSent(true);
      toast.success(t('sentToast', { email: targetEmail }));
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      if (error.code === 'auth/too-many-requests') {
        toast.error(t('tooManyRequests'));
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error(t('requiresRecentLogin'));
      } else {
        toast.error(error.message || t('failedToSend'));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 relative animate-in fade-in slide-in-from-top-5 duration-300">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3 text-amber-500">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-bold">
                {isPendingUpdate ? t('confirmNewEmail') : t('verificationRequired')}
            </span> 
            {' '}{t.rich('pleaseVerifyEmail', {
              email: targetEmail ?? '',
              action: isPendingUpdate ? t('completeUpdate') : t('accessAllFeatures')
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {sent ? (
            <div className="flex items-center gap-2 text-green-500 font-medium bg-green-500/10 px-3 py-1.5 rounded-md w-full sm:w-auto justify-center">
              <CheckCircle className="h-4 w-4" />
              <span>{t('emailSent')}</span>
            </div>
          ) : (
            <button 
              onClick={handleResend}
              disabled={sending}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-1.5 rounded-md transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {sending ? (
                <>{t('sending')}</>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  {t('resendEmail')}
                </>
              )}
            </button>
          )}
          
          <button 
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors hidden sm:block"
            title="Dismiss for this session"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
