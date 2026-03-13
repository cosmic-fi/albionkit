
import Link from 'next/link';
import { Github, Twitter, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="relative mt-20 border-t border-border bg-background overflow-hidden">
      {/* Background Image with Parallax */}
      <div 
        className="absolute inset-0 z-0 bg-fixed bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/footer-bg.jpg')" }}
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/90 to-background/30" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand & Description */}
          <div className="col-span-1 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <img src="/logo-dark.svg" alt="AlbionKit Logo" className="w-30 h-12 dark:hidden block" />
              <img src="/logo-light.svg" alt="AlbionKit Logo" className="w-30 h-12 hidden dark:block" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('description')}
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com/Albion_Kit" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://github.com/albionkit" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Tools Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('tools')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/tools/market-flipper" className="hover:text-primary transition-colors">{t('marketFlipper')}</Link></li>
              <li><Link href="/tools/pvp-intel" className="hover:text-primary transition-colors">{t('pvpIntel')}</Link></li>
              <li><Link href="/tools/zvz-tracker" className="hover:text-primary transition-colors">{t('zvzTracker')}</Link></li>
              <li><Link href="/tools/crafting-calc" className="hover:text-primary transition-colors">{t('craftingPlanner')}</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('resources')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/builds/solo" className="hover:text-primary transition-colors">{t('soloBuilds')}</Link></li>
              <li><Link href="/builds/zvz" className="hover:text-primary transition-colors">{t('zvzBuilds')}</Link></li>
              <li><Link href="/profits/farming" className="hover:text-primary transition-colors">{t('farmingProfit')}</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">{t('aboutUs')}</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('legal')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">{t('privacyPolicy')}</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">{t('termsOfService')}</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors">{t('cookiePolicy')}</Link></li>
              <li><Link href="/refund" className="hover:text-primary transition-colors">{t('refundPolicy')}</Link></li>
            </ul>
          </div>

        </div>
        
        <div className="pt-8 border-t border-border text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground/80 max-w-2xl leading-relaxed">
            {t('disclaimer')}
          </p>
          <span className="text-xs text-muted-foreground/60">
            {t('rightsReserved', { year: new Date().getFullYear() })}
          </span>
        </div>
      </div>
    </footer>
  );
}
