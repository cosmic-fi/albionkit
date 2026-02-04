
import Link from 'next/link';
import { Github, Twitter, MessageCircle } from 'lucide-react';

export function Footer() {
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
              The essential companion for Albion Online players. Market flipper, PvP intel, crafting calculators, and more.
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
            <h3 className="font-semibold text-foreground mb-4">Tools</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/tools/market-flipper" className="hover:text-primary transition-colors">Market Flipper</Link></li>
              <li><Link href="/tools/pvp-intel" className="hover:text-primary transition-colors">PvP Intel</Link></li>
              <li><Link href="/tools/zvz-tracker" className="hover:text-primary transition-colors">ZvZ Tracker</Link></li>
              <li><Link href="/tools/crafting-calc" className="hover:text-primary transition-colors">Crafting Planner</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/builds/solo" className="hover:text-primary transition-colors">Solo Builds</Link></li>
              <li><Link href="/builds/zvz" className="hover:text-primary transition-colors">ZvZ Builds</Link></li>
              <li><Link href="/profits/farming" className="hover:text-primary transition-colors">Farming Profit Calculator</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
              <li><Link href="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

        </div>
        
        <div className="pt-8 border-t border-border text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground/80 max-w-2xl leading-relaxed">
            AlbionKit is a community-created tool and is not affiliated with, endorsed by, or sponsored by Sandbox Interactive GmbH. 
            Albion Online and the Albion Online logo are trademarks of Sandbox Interactive GmbH. 
            All game content and assets are property of their respective owners.
          </p>
          <span className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} AlbionKit. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
