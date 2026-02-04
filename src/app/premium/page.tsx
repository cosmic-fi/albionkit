'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, checkAccess, activatePersonalPremium, activateGuildLicense } from '@/lib/user-profile';
import { getGuildDetails, getCheckoutURL, getProductPrices } from './actions';
import { Check, Shield, Crown, Users, Zap, Star, LayoutDashboard, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import { PageShell } from '@/components/PageShell';
import { toast } from 'sonner';

export default function PremiumPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [access, setAccess] = useState<any>({ hasAccess: false, reason: 'none' });
  const [guildInfo, setGuildInfo] = useState<any>(null);
  const [processing, setProcessing] = useState<'personal' | 'guild' | null>(null);
  const [prices, setPrices] = useState<{ personal: string, guild: string }>({ personal: '$4.99', guild: '$19.99' });
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    // Fetch prices in parallel with user data if possible, or just fetch them
    getProductPrices().then(fetchedPrices => {
        if (fetchedPrices) setPrices(fetchedPrices);
    });

    if (!user) {
        setLoading(false);
        return;
    }

    const userProfile = await getUserProfile(user.uid);
    setProfile(userProfile);
    
    const accessStatus = await checkAccess(user.uid);
    setAccess(accessStatus);

    if (userProfile?.guildId) {
      const gInfo = await getGuildDetails(userProfile.guildId);
      setGuildInfo(gInfo);
    }
    setLoading(false);
  };

  const handleUpgrade = async (type: 'personal' | 'guild') => {
    if (!user) return;
    setProcessing(type);

    try {
        const result = await getCheckoutURL(user.uid, type, billingInterval);
        
        if (result.error) {
            console.error(result.error);
            toast.error('Payment initialization failed. Please check your network or try again later.');
        } else if (result.url) {
            // Redirect to Lemon Squeezy
            window.location.href = result.url;
            return; // Don't stop processing, let the redirect happen
        }
    } catch (err) {
        console.error(err);
        toast.error('An unexpected error occurred.');
    }

    setProcessing(null);
  };

  if (loading) {
    return (
      <PageShell
        title="Become a Supporter"
        description="Unlock the full power of AlbionKit. Choose the tier that fits your playstyle."
        icon={<Crown className="h-6 w-6" />}
      >
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[1, 2].map((i) => (
                <div key={i} className="p-8 rounded-2xl border border-slate-800 bg-slate-900/50 h-[600px] animate-pulse">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 rounded-xl bg-slate-800"></div>
                        <div className="space-y-2">
                            <div className="h-6 w-32 bg-slate-800 rounded"></div>
                            <div className="h-4 w-24 bg-slate-800 rounded"></div>
                        </div>
                    </div>
                    <div className="space-y-4 mb-8">
                        {[1, 2, 3, 4, 5].map((j) => (
                            <div key={j} className="h-4 w-full bg-slate-800 rounded"></div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
        title="Become a Supporter"
        description="Unlock the full power of AlbionKit. Choose the tier that fits your playstyle."
        icon={<Crown className="h-6 w-6" />}
    >
      {/* Billing Interval Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-slate-900/50 p-1 rounded-xl inline-flex relative border border-slate-800">
          <button
            onClick={() => setBillingInterval('month')}
            className={`py-2 px-6 rounded-lg text-sm font-medium transition-all ${
              billingInterval === 'month' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`py-2 px-6 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              billingInterval === 'year' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 rounded-full border border-green-500/30 font-bold">2 MONTHS FREE</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Personal Plan */}
        <div className={`relative p-8 rounded-2xl border transition-all duration-300 ${access.reason === 'premium' ? 'bg-amber-950/20 border-amber-500 ring-1 ring-amber-500' : 'bg-slate-900/50 border-slate-700 hover:border-amber-500/50'}`}>
          {access.reason === 'premium' && (
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <span className="bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="h-3 w-3" /> ACTIVE
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Adept Tier</h3>
              <p className="text-slate-400">
                {billingInterval === 'year' 
                  ? 'Get 2 months FREE with yearly billing!' 
                  : 'For the solo conqueror'}
              </p>
            </div>
          </div>

          <div className="mb-8 space-y-4">
            <FeatureItem text="Alliance Radar Dashboard" />
            <FeatureItem text="Advanced ZvZ Heatmaps" />
            <FeatureItem text="Market History Analytics" />
            <FeatureItem text="Unlimited Watchlist" />
            <FeatureItem text="Support Development" />
          </div>

          <div className="mt-auto">
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold text-foreground">
                {billingInterval === 'year' 
                  ? `$${(parseFloat(prices.personal.replace(/[^0-9.]/g, '')) * 10).toFixed(2)}` 
                  : prices.personal}
              </span>
              <span className="text-slate-500">/{billingInterval}</span>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 italic">
              * This is a donation to support server costs. Access is a thank-you perk.
            </p>

            {access.reason === 'premium' ? (
               <button disabled className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl font-bold cursor-not-allowed border border-slate-700">
                 Plan Active
               </button>
            ) : (
              <button 
                onClick={() => handleUpgrade('personal')}
                disabled={!!processing || !user}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-foreground rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing === 'personal' ? 'Processing...' : 'Become an Adept'}
              </button>
            )}
            {!user && <p className="text-center text-sm text-slate-500 mt-2">Login required</p>}
          </div>
        </div>

        {/* Guild Plan */}
        <div className={`relative p-8 rounded-2xl border transition-all duration-300 ${access.reason === 'guild' ? 'bg-indigo-950/20 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-900/50 border-slate-700 hover:border-indigo-500/50'}`}>
           {access.reason === 'guild' && (
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <span className="bg-indigo-500 text-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="h-3 w-3" /> ACTIVE
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Guild Master</h3>
              <p className="text-slate-400">
                {billingInterval === 'year' 
                  ? 'Get 2 months FREE! Power up your entire army.' 
                  : 'Power up your entire army'}
              </p>
            </div>
          </div>

          <div className="mb-8 space-y-4">
            <FeatureItem text="Adept Status for ALL Guild Members" />
            <FeatureItem text="Guild Activity Dashboard" />
            <FeatureItem text="Death/Kill Feed Integration" />
            <FeatureItem text="Priority API Updates" />
            <FeatureItem text="Guild Leaderboard Badge" />
          </div>

          <div className="mt-auto">
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold text-foreground">
                {billingInterval === 'year' 
                  ? `$${(parseFloat(prices.guild.replace(/[^0-9.]/g, '')) * 10).toFixed(2)}` 
                  : prices.guild}
              </span>
              <span className="text-slate-500">/{billingInterval}</span>
            </div>

            <p className="text-xs text-slate-500 mb-4 italic">
              * Supports development of advanced guild tools.
            </p>

            {profile?.guildName ? (
               <div className="mb-4 p-3 bg-slate-800 rounded-lg flex items-center justify-between">
                 <span className="text-sm text-slate-300">Target Guild:</span>
                 <span className="font-bold text-indigo-400">{profile.guildName}</span>
               </div>
            ) : (
                <div className="mb-4 p-3 bg-amber-900/20 border border-amber-900/50 rounded-lg">
                  <p className="text-xs text-amber-400 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    No guild linked. Join now to reserve license.
                  </p>
                </div>
            )}

            {access.reason === 'guild' ? (
              <button disabled className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl font-bold cursor-not-allowed border border-slate-700">
                Plan Active
              </button>
            ) : access.reason === 'pending_guild' ? (
                <button disabled className="w-full py-3 bg-amber-900/50 text-amber-400 rounded-xl font-bold cursor-not-allowed border border-amber-900/50 flex items-center justify-center gap-2">
                   <AlertCircle className="h-4 w-4" /> Pending Activation
                </button>
            ) : (
                <button 
                  onClick={() => handleUpgrade('guild')}
                  disabled={!!processing || !user}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-foreground rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing === 'guild' ? 'Processing...' : 'Unlock Guild Master'}
                </button>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}
