import React from 'react';
import { Metadata } from 'next';
import { Shield, Lock, Eye, Server, Mail, Globe } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Legal.privacy');
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

export default async function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            <span>{t('lastUpdated', { date: new Date().toLocaleDateString() })}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
            {t('privacy.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('privacy.description')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-card/50 backdrop-blur border border-border rounded-2xl p-8 mb-12">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-4 mt-0">
              <Eye className="h-6 w-6 text-blue-400" />
              {t('privacy.intro.title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.intro.content')}
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <Server className="h-6 w-6 text-purple-400" />
                {t('privacy.data.title')}
              </h2>
              <p className="text-muted-foreground mb-4">{t('privacy.data.content')}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="font-bold text-foreground mb-2">{t('privacy.data.identity')}</h3>
                  <p className="text-sm text-muted-foreground">{t('privacy.data.identityContent')}</p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="font-bold text-foreground mb-2">{t('privacy.data.technical')}</h3>
                  <p className="text-sm text-muted-foreground">{t('privacy.data.technicalContent')}</p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="font-bold text-foreground mb-2">{t('privacy.data.usage')}</h3>
                  <p className="text-sm text-muted-foreground">{t('privacy.data.usageContent')}</p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="font-bold text-foreground mb-2">{t('privacy.data.transaction')}</h3>
                  <p className="text-sm text-muted-foreground">{t('privacy.data.transactionContent')}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <Lock className="h-6 w-6 text-emerald-400" />
                {t('privacy.use.title')}
              </h2>
              <p className="text-muted-foreground mb-4">{t('privacy.use.content')}</p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5" />
                  <span>{t('privacy.use.c1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5" />
                  <span>{t('privacy.use.c2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5" />
                  <span>{t('privacy.use.c3')}</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <Globe className="h-6 w-6 text-amber-400" />
                {t('privacy.thirdParty.title')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t('privacy.thirdParty.content')}
              </p>
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="font-bold text-foreground mb-2">{t('privacy.thirdParty.processors')}</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li><strong>Google Firebase:</strong> {t('privacy.thirdParty.firebase')}</li>
                  <li><strong>Lemon Squeezy:</strong> {t('privacy.thirdParty.lemonsqueezy')}</li>
                  <li><strong>Albion Data Project:</strong> {t('privacy.thirdParty.adp')}</li>
                </ul>
              </div>
            </section>

            <section className="bg-muted/50 border border-border rounded-xl p-8">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-4 mt-0">
                <Mail className="h-6 w-6 text-muted-foreground" />
                {t('contact')}
              </h2>
              <p className="text-muted-foreground mb-0">
                {t('contactDesc')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
