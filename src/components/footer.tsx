'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Twitter, MessageCircle, Mail, Github } from 'lucide-react';

export function Footer() {
  const t = useTranslations('Footer');

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-card border-t border-border py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-bold text-lg mb-4 text-foreground">AlbionKit</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The ultimate Albion Online companion tool for market trading, PvP tracking, and build sharing.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://twitter.com/Albion_Kit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:support@albionkit.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Tools Column */}
          <div>
            <h4 className="font-bold mb-4 text-foreground">{t('tools')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tools/market-flipper" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('marketFlipper')}
                </Link>
              </li>
              <li>
                <Link href="/tools/kill-feed" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('killFeed')}
                </Link>
              </li>
              <li>
                <Link href="/tools/pvp-intel" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('pvpIntel')}
                </Link>
              </li>
              <li>
                <Link href="/tools/crafting-calc" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('craftingCalc')}
                </Link>
              </li>
              <li>
                <Link href="/tools/gold-price" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('goldPrice')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Profit Calculators Column */}
          <div>
            <h4 className="font-bold mb-4 text-foreground">{t('calculators')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/profits/farming" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('farming')}
                </Link>
              </li>
              <li>
                <Link href="/profits/cooking" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('cooking')}
                </Link>
              </li>
              <li>
                <Link href="/profits/alchemy" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('alchemy')}
                </Link>
              </li>
              <li>
                <Link href="/profits/labour" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('laborers')}
                </Link>
              </li>
              <li>
                <Link href="/profits/animal" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('animal')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Column */}
          <div>
            <h4 className="font-bold mb-4 text-foreground">{t('community')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/builds" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('builds')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-bold mb-4 text-foreground">{t('legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('cookies')}
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('refund')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {currentYear} AlbionKit. {t('allRightsReserved')}
          </div>
          <div className="text-sm text-muted-foreground">
            {t('notAffiliated')}
          </div>
        </div>
      </div>
    </footer>
  );
}
