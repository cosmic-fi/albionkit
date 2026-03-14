'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLoginModal } from '@/context/LoginModalContext';
import { getUserProfile, checkAccess } from '@/lib/user-profile';
import { getGuildDetails, getCheckoutURL, getProductPrices } from '@/app/premium/actions';
import { Check, Zap, Users, X, Loader2, Crown, Heart, Trophy, Activity, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: 'personal' | 'guild';
}

export function SubscriptionModal({ isOpen, onClose, initialPlan = 'personal' }: SubscriptionModalProps) {
  const t = useTranslations('Subscription');
  const { user } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [access, setAccess] = useState<any>({ hasAccess: false, reason: 'none' });
  const [processing, setProcessing] = useState<'personal' | 'guild' | null>(null);
  const [prices, setPrices] = useState<{ personal: string, guild: string }>({ personal: '$4.99', guild: '$19.99' });
  const [planType, setPlanType] = useState<'personal' | 'guild'>(initialPlan);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialPlan) setPlanType(initialPlan);
      loadData();
    }
  }, [isOpen, user, initialPlan]);

  const loadData = async () => {
    setLoading(true);
    // Fetch prices
    getProductPrices().then(fetchedPrices => {
        if (fetchedPrices) setPrices(fetchedPrices);
    });

    if (!user) {
        setLoading(false);
        return;
    }

    try {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      setHasUsedTrial(userProfile?.preferences?.hasUsedTrial || false);
      
      const accessStatus = await checkAccess(user.uid);
      setAccess(accessStatus);

      if (userProfile?.guildId) {
        // Prefetch guild info if needed
        getGuildDetails(userProfile.guildId);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
        onClose();
        openLoginModal(t('signInToUpgrade'));
        return;
    }
    setProcessing(planType);

    try {
        console.log('[SubscriptionModal] Requesting checkout URL for:', planType, billingInterval);
        const result = await getCheckoutURL(user.uid, planType, billingInterval);

        console.log('[SubscriptionModal] Checkout result:', result);

        if (result.error) {
            console.error('[SubscriptionModal] Checkout error:', result.error);
            toast.error(result.error);
        } else if (result.url) {
            window.location.href = result.url;
            return;
        } else {
            toast.error('Failed to create checkout session');
        }
    } catch (err: any) {
        console.error('[SubscriptionModal] Unexpected error:', err);
        toast.error(err.message || t('unexpectedError'));
    }

    setProcessing(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl  animate-in zoom-in-95 duration-200 my-auto overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-purple-500/10 p-6 md:p-8 text-center border-b border-border/50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600  mb-4 ring-4 ring-background">
            <Heart className="h-8 w-8 text-white fill-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('supportTitle')}</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            {t.rich('supportDesc', {
              solo: (chunks) => <span className="font-bold text-foreground">{chunks}</span>
            })}
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">{t('loading')}</p>
            </div>
          ) : (
            <>
              {/* Billing Interval Toggle */}
              <div className="flex justify-center mb-6">
                <div className="bg-muted/50 p-1 rounded-xl inline-flex relative">
                  <button
                    onClick={() => setBillingInterval('month')}
                    className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      billingInterval === 'month' 
                        ? 'bg-background  text-foreground ring-1 ring-border' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('monthly')}
                  </button>
                  <button
                    onClick={() => setBillingInterval('year')}
                    className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      billingInterval === 'year' 
                        ? 'bg-background  text-foreground ring-1 ring-border' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('yearly')} <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 rounded-full border border-green-500/20 font-bold">{t('monthsFree')}</span>
                  </button>
                </div>
              </div>
              
              {!hasUsedTrial && billingInterval === 'year' && (
                <p className="text-[10px] text-center text-amber-600/80 mb-4 animate-in fade-in slide-in-from-top-1">
                  {t('trialNote')}
                </p>
              )}

              {/* Toggle */}
              <div className="flex bg-muted/50 p-1 rounded-xl mb-6">
                <button
                  onClick={() => setPlanType('personal')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    planType === 'personal' 
                      ? 'bg-background  text-foreground ring-1 ring-border' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('adept')}
                </button>
                <button
                  onClick={() => setPlanType('guild')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    planType === 'guild' 
                      ? 'bg-background  text-foreground ring-1 ring-border' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('guildMaster')}
                </button>
              </div>

              {planType === 'personal' ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <FeatureItem text={t('adeptFeatures.f1')} icon={<Zap className="h-4 w-4 text-amber-500" />} />
                    <FeatureItem text={t('adeptFeatures.f2')} icon={<Crown className="h-4 w-4 text-amber-500" />} />
                    <FeatureItem text={t('adeptFeatures.f3')} icon={<Check className="h-4 w-4 text-green-500" />} />
                    <FeatureItem text={t('adeptFeatures.f4')} icon={<Heart className="h-4 w-4 text-pink-500" />} />
                  </div>
                  
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center relative overflow-hidden">
                    {!hasUsedTrial && billingInterval === 'month' && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg animate-pulse ">
                        {t('freeTrial')}
                      </div>
                    )}
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {billingInterval === 'year' 
                        ? `$${(parseFloat(prices.personal.replace(/[^0-9.]/g, '')) * 10).toFixed(2)}` 
                        : prices.personal}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('perInterval', { interval: billingInterval })}</div>
                    {!hasUsedTrial && billingInterval === 'month' && (
                      <div className="mt-2 text-[11px] font-bold text-amber-600 bg-amber-500/10 py-1 rounded-lg">
                        {t('includesTrial')}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="space-y-3">
                    <FeatureItem text={t('guildFeatures.f1')} icon={<Users className="h-4 w-4 text-blue-500" />} />
                    <FeatureItem text={t('guildFeatures.f2')} icon={<Activity className="h-4 w-4 text-blue-500" />} />
                    <FeatureItem text={t('guildFeatures.f3')} icon={<Zap className="h-4 w-4 text-amber-500" />} />
                    <FeatureItem text={t('guildFeatures.f4')} icon={<Trophy className="h-4 w-4 text-yellow-500" />} />
                  </div>

                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center relative overflow-hidden">
                    {!hasUsedTrial && billingInterval === 'month' && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg animate-pulse ">
                        {t('freeTrial')}
                      </div>
                    )}
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {billingInterval === 'year' 
                        ? `$${(parseFloat(prices.guild.replace(/[^0-9.]/g, '')) * 10).toFixed(2)}` 
                        : prices.guild}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('perInterval', { interval: billingInterval })}</div>
                    {!hasUsedTrial && billingInterval === 'month' && (
                      <div className="mt-2 text-[11px] font-bold text-blue-600 bg-blue-500/10 py-1 rounded-lg">
                        {t('includesTrial')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8">
                 {access.hasAccess && access.reason === (planType === 'personal' ? 'premium' : 'guild') && profile?.subscription?.status === 'active' ? (
                    <button disabled className="w-full py-3 bg-secondary/50 text-secondary-foreground rounded-xl font-bold cursor-not-allowed border border-border">
                      {t('alreadyActive')}
                    </button>
                 ) : (
                  <button 
                    onClick={handleUpgrade}
                    disabled={!!processing}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold  hover: transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('processing')}
                      </>
                    ) : (
                      <>
                        {profile?.subscription?.status === 'cancelled' && access.hasAccess 
                          ? t('renew') 
                          : (!hasUsedTrial && billingInterval === 'month'
                              ? t('tryFree') 
                              : (planType === 'personal' ? t('unlockAdept') : t('getGuildMaster')))}
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </>
                    )}
                  </button>
                 )}
                 <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
                   {t('securePayment', { trialNote: !hasUsedTrial && billingInterval === 'month' ? '7-day free trial included. ' : '' })}
                 </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text, icon }: { text: string, icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
        {icon || <Check className="h-3 w-3 text-primary" />}
      </div>
      <span className="text-sm font-medium text-foreground/80">{text}</span>
    </div>
  );
}
