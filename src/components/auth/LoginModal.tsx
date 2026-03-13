'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, X, Mail, Lock, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import ReCAPTCHA from 'react-google-recaptcha';
import { verifyCaptcha } from '@/app/actions/auth';
import { useTranslations } from 'next-intl';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  message?: string;
}

export function LoginModal({ isOpen, onClose, message }: LoginModalProps) {
  const t = useTranslations('Auth');
  const { signInWithGoogle, signInWithEmail, registerWithEmail } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setError(null);
      setEmail('');
      setPassword('');
      setCaptchaToken(null);
      setIsRegistering(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultMessage = isRegistering ? t('createAccountToContinue') : t('signInToContinue');
  const displayMessage = message || defaultMessage;

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose?.();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
      console.error(err);
      setError(t('googleFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError(t('emailPasswordRequired'));
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        if (!captchaToken) {
          setError(t('captchaRequired'));
          setLoading(false);
          return;
        }

        const verification = await verifyCaptcha(captchaToken);
        if (!verification.success) {
          setError(verification.error || t('captchaFailed'));
          setLoading(false);
          return;
        }

        await registerWithEmail(email, password);
        toast.success(t('accountCreated'));
      } else {
        await signInWithEmail(email, password);
        toast.success(t('signedIn'));
      }
      onClose?.();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError(t('errors.emailInUse'));
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError(t('errors.invalidCredentials'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('errors.weakPassword'));
      } else {
        setError(t('errors.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-popover border border-border rounded-xl p-6 animate-in zoom-in-95 duration-200">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground">{isRegistering ? t('registerTitle') : t('loginTitle')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{displayMessage}</p>
        </div>

        <div className="space-y-4">
          {/* Social Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-card border border-border text-card-foreground font-bold py-2.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{t('continueGoogle')}</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-popover px-2 text-muted-foreground">{t('orEmail')}</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={t('emailLabel')}
                  className="pl-9 bg-background border-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder={t('passwordLabel')}
                  className="pl-9 bg-background border-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {isRegistering && (
              <div className="flex justify-center py-2">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
                  onChange={setCaptchaToken}
                  theme="dark"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isRegistering ? t('signUp') : t('signIn')}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {isRegistering ? t('alreadyHaveAccount') : t('dontHaveAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
