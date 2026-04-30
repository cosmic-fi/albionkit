'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Twitter, Mail, Github, Heart } from 'lucide-react';

export function Footer() {
  const t = useTranslations('Footer');

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-card border-t-2 border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-extrabold text-xl mb-4 text-foreground flex items-center gap-2">
              <img src="/logo-dark.svg" alt="AlbionKit" className="h-8 w-auto dark:hidden" />
              <img src="/logo-light.svg" alt="AlbionKit" className="h-8 w-auto hidden dark:block" />
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {t('description')}
            </p>
            <div className="flex gap-3">
              <Link
                href="https://twitter.com/Albion_Kit"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:support@albionkit.com"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all hover:scale-110"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </Link>
              <Link
                href="https://github.com/cosmic-fi/albionkit"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all hover:scale-110"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Tools Column */}
          <div>
            <h4 className="font-extrabold mb-4 text-foreground text-sm uppercase tracking-wider">{t('tools')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/tools/market-flipper" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('marketFlipper')}
                </Link>
              </li>
              <li>
                <Link href="/tools/killboard" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('killboard')}
                </Link>
              </li>
              <li>
                <Link href="/tools/pvp-intel" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('pvpIntel')}
                </Link>
              </li>
              <li>
                <Link href="/profits/crafting" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('craftingCalc')}
                </Link>
              </li>
              <li>
                <Link href="/tools/gold-price" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('goldPrice')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Profit Calculators Column */}
          <div>
            <h4 className="font-extrabold mb-4 text-foreground text-sm uppercase tracking-wider">{t('calculators')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/profits/farming" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('farming')}
                </Link>
              </li>
              <li>
                <Link href="/profits/cooking" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('cooking')}
                </Link>
              </li>
              <li>
                <Link href="/profits/alchemy" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('alchemy')}
                </Link>
              </li>
              <li>
                <Link href="/profits/labour" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('laborers')}
                </Link>
              </li>
              <li>
                <Link href="/profits/animal" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('animal')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Column */}
          <div>
            <h4 className="font-extrabold mb-4 text-foreground text-sm uppercase tracking-wider">{t('community')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/builds" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('builds')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href="/bot" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('bot')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Faction Column */}
          <div>
            <h4 className="font-extrabold mb-4 text-foreground text-sm uppercase tracking-wider">{t('faction')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/faction/efficiency" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('factionEfficiency')}
                </Link>
              </li>
              <li>
                <Link href="/faction/transport" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('heartTransport')}
                </Link>
              </li>
              <li>
                <Link href="/faction/bandit" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('banditTracker')}
                </Link>
              </li>
              <li>
                <Link href="/faction/campaign" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('campaignTracker')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-extrabold mb-4 text-foreground text-sm uppercase tracking-wider">{t('legal')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block">
                  {t('cookies')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t-2 border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground font-medium">
            © {currentYear} AlbionKit. {t('allRightsReserved')}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span>{t('madeWith')}</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span>{t('forCommunity')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
