import React from 'react';
import { Metadata } from 'next';
import { Scale, FileText, ShieldAlert, UserCheck, AlertTriangle, Copyright } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Legal.terms');
  return {
    title: `${t('title')} | AlbionKit`,
    description: t('description'),
    openGraph: {
      title: `${t('title')} | AlbionKit`,
      description: t('description'),
      type: 'website',
    },
  };
}

export default async function TermsPage() {
  const t = await getTranslations('Legal');
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative py-20 px-4 overflow-hidden border-b border-border">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/bg-1.jpg"
            alt="Background"
            fill
            className="object-cover opacity-30"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/90 to-background" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium mb-6">
            <FileText className="h-4 w-4" />
            <span>{t('lastUpdated', { date: new Date().toLocaleDateString() })}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
            {t('terms.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('terms.description')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="prose prose-invert prose-lg max-w-none">
          
          <div className="bg-card/50 backdrop-blur border border-border rounded-2xl p-8 mb-12">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-4 mt-0">
              <Scale className="h-6 w-6 text-amber-500" />
              {t('terms.agreement.title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.agreement.content')}
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <Copyright className="h-6 w-6 text-blue-400" />
                {t('terms.ip.title')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t('terms.ip.content')}
              </p>
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="font-bold text-foreground mb-2">{t('terms.ip.albionIp')}</h3>
                <p className="text-sm text-muted-foreground mb-0">
                  {t('terms.ip.albionIpContent')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <UserCheck className="h-6 w-6 text-emerald-400" />
                {t('terms.accounts.title')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t('terms.accounts.content')}
              </p>
              <ul className="grid md:grid-cols-2 gap-4 list-none pl-0">
                <li className="bg-card p-4 rounded-lg border border-border">
                  <span className="font-bold text-foreground block mb-1">{t('terms.accounts.security')}</span>
                  <span className="text-sm text-muted-foreground">{t('terms.accounts.securityContent')}</span>
                </li>
                <li className="bg-card p-4 rounded-lg border border-border">
                  <span className="font-bold text-foreground block mb-1">{t('terms.accounts.use')}</span>
                  <span className="text-sm text-muted-foreground">{t('terms.accounts.useContent')}</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <ShieldAlert className="h-6 w-6 text-red-400" />
                {t('terms.termination.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('terms.termination.content')}
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
                {t('terms.liability.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('terms.liability.content')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
