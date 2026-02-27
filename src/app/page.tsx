import Link from "next/link";
import Image from "next/image";
import {
  Coins,
  Hammer,
  Sword,
  TrendingUp,
  Swords,
  ArrowRight,
  Users,
  Zap,
  Shield,
  BarChart3,
  Globe,
  MessageCircle,
  CheckCircle2,
  Search,
  Menu,
  ChevronDown,
  Lock,
  Server,
  Crown,
  Skull,
  Activity,
  Twitter,
  Mail
} from "lucide-react";

import { ItemIcon } from "@/components/ItemIcon";
import { getTickerData, getGlobalStats } from "@/lib/ticker-service";
import { MarketTicker } from "@/components/MarketTicker";
import { InfoStrip, InfoBanner } from "@/components/InfoStrip";
import { FeatureSection } from "@/components/FeatureSection";
import { LiveKillToasts } from "@/components/LiveKillToasts";

export default async function Home() {
  const [tickerData, stats] = await Promise.all([
    getTickerData(),
    getGlobalStats()
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AlbionKit',
    url: 'https://albionkit.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://albionkit.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <div className="flex flex-col w-full overflow-hidden bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LiveKillToasts />

      {/* Hero Section */}
      <section className="relative pt-0 overflow-hidden min-h-screen flex flex-col items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/bg-2.jpg"
            alt="Albion Online Landscape"
            fill
            className="object-cover opacity-60"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-[100%] blur-3xl -z-20 opacity-50 animate-pulse" />

        <div className="container mx-auto px-4 relative z-10 pb-4 md:pb-24">
          <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
            {/* Hero Content */}
            <div className="space-y-8 sm:pt-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] animate-fade-in-up">
                Make every session count in&nbsp;
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary">Albion Online</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100">
                Plan your next move with live market data, PvP insights, and meta builds — all in one place so you can spend less time tabbing out and more time playing.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in-up delay-200">
                <Link
                  href="/tools/market-flipper"
                  className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  Explore Market Tools
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/tools/pvp-intel"
                  className="px-8 py-4 bg-secondary/80 hover:bg-secondary/90 text-foreground rounded-xl font-bold transition-all hover:scale-105 border border-border backdrop-blur-md flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  Scout PvP Players
                  <Sword className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Market Ticker */}
        <MarketTicker data={tickerData} />
      </section>

      {/* Stats Strip */}
      <section className="bg-muted/50 backdrop-blur-sm relative z-20 border-b-5 border-muted">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 py-6 md:py-10 container mx-auto px-4">
          <StatItem value={`${stats.itemsTracked > 0 ? stats.itemsTracked.toLocaleString() : '6,000'}+`} label="Items Tracked" />
          <StatItem value={`${stats.battlesAnalyzed > 0 ? stats.battlesAnalyzed.toLocaleString() : '50'}+`} label="Recent Battles" />
          <StatItem value={stats.marketUpdates} label="Market Updates" />
          <StatItem value={stats.uptime} label="Server Uptime" />
        </div>
      </section>

      {/* Feature Sections */}
      <div className="flex flex-col">
        <FeatureSection
          title="Market Flipping Made Easy"
          description="Identify profitable trade routes between cities. Compare buy and sell orders with automatic tax calculations to maximize your margins."
          link="/tools/market-flipper"
          linkText="Start Flipping"
          backgroundImage="/background/ao-market.jpg"
          previewImageLight="/background/ak-marketflipper-light.png"
          previewImageDark="/background/ak-marketflipper-dark.png"
        />

        <FeatureSection
          title="Live PvP Activity Feed"
          description="Monitor server-wide PvP kills as they happen. Track active players and popular equipment in real-time."
          link="/tools/kill-feed"
          linkText="Watch Live Feed"
          backgroundImage="/background/ao-pvp.jpg"
          previewImageLight="/background/ak-killfeed-light.png"
          previewImageDark="/background/ak-killfeed-dark.png"
          reverse
        />

        <FeatureSection
          title="ZvZ Battle Tracker"
          description="Analyze large-scale battles with detailed metrics on guild performance, attendance, and gear composition."
          link="/tools/zvz-tracker"
          linkText="Analyze Battles"
          backgroundImage="/background/ao-zvz.jpg"
          previewImageLight="/background/ak-zvztracker-light.png"
          previewImageDark="/background/ak-zvztracker-dark.png"
        />
      </div>

      {/* Safety & Tech */}
      <section className="py-10 bg-muted relative overflow-hidden border-y border-border">
        <div className="container mx-auto px-4 text-center space-y-16">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Safe, Secure, and Compliant</h2>
            <p className="text-muted-foreground text-lg">
              We use the Albion Data Project to gather public market data. Our tools are strictly read-only and do not interact with the game client in any bannable way.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors">
              <Shield className="h-10 w-10 text-success mx-auto mb-6" />
              <h3 className="text-xl font-bold text-foreground mb-3">Safe to Use</h3>
              <p className="text-muted-foreground">No injection, no memory reading, no automation. We rely on community-gathered data.</p>
            </div>
            <div className="p-8 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors">
              <Server className="h-10 w-10 text-info mx-auto mb-6" />
              <h3 className="text-xl font-bold text-foreground mb-3">Albion Data Project</h3>
              <p className="text-muted-foreground">Powered by the largest decentralized data network in Albion. Contribute to help others!</p>
            </div>
            <div className="p-8 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors">
              <Lock className="h-10 w-10 text-primary mx-auto mb-6" />
              <h3 className="text-xl font-bold text-foreground mb-3">Privacy First</h3>
              <p className="text-muted-foreground">We don't track your personal game activity or link your character unless you choose to.</p>
            </div>
          </div>
        </div>
      </section>

      {/* More Tools Grid */}
      <section className="py-12 md:py-24 bg-background relative overflow-hidden">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

        <div className="container mx-auto px-4 space-y-8 md:space-y-12 relative z-10">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Explore More Tools</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              href="/tools/pvp-intel"
              icon={<Shield className="h-6 w-6 text-info" />}
              itemImage="T8_2H_CLAYMORE"
              title="PvP Intel"
              description="Instantly analyze enemy players, check their IP and win rates before you engage."
              color="blue"
            />
            <FeatureCard
              href="/tools/crafting-calc"
              icon={<Hammer className="h-6 w-6 text-success" />}
              itemImage="T8_2H_TOOL_HAMMER_AVALON"
              title="Crafting Calculator"
              description="Optimize your focus usage. Calculate profit margins for refining and crafting."
              color="emerald"
            />
            <FeatureCard
              href="/profits/farming"
              icon={<TrendingUp className="h-6 w-6 text-success" />}
              itemImage="T8_FARM_YARROW_SEED"
              title="Farming Profits"
              description="Calculate the most profitable crops and animals to raise on your island."
              color="green"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-10 bg-card border-y border-border overflow-hidden bg-[url('/faq-bg.jpg')] bg-contain bg-fixed bg-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/90" />

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-center mb-10">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <FAQItem
              question="Is this tool free to use?"
              answer="Yes! Core features like Market Flipping, PvP Kill Feed, and Build Browsing are 100% free. We offer an 'Adept Tier' that unlocks advanced analytics and helps cover server costs to keep the app alive and running."
            />
            <FAQItem
              question="Is it safe? Will I get banned?"
              answer="AlbionKit is completely safe. We do not inspect game memory, inject code, or automate actions. We strictly follow SBI's Terms of Service. All market data is crowdsourced via the approved Albion Data Project."
            />
            <FAQItem
              question="How accurate is the market data?"
              answer="Prices are updated by real players using the Albion Data Client. In major cities like Lymhurst and Fort Sterling, data is typically just minutes old. Less popular items may have older data."
            />
            <FAQItem
              question="What is the Guild Master plan?"
              answer="The Guild Master plan is a special tier that unlocks Adept perks for ALL members of your guild. It also includes exclusive guild-level dashboards and kill feed integrations."
            />
            <FAQItem
              question="Do you have a mobile app?"
              answer="AlbionKit is a Progressive Web App (PWA). You can install it directly on your phone or tablet for a native-like experience without needing an app store."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 container mx-auto px-4">
        <div className="w-full mx-auto p-12 rounded-3xl border border-primary/20 relative flex flex-col lg:flex-row items-center justify-between gap-10 bg-card/50">

          <div className="flex flex-col items-start gap-6 max-w-2xl">
            <div className="p-0 relative">
              <div className="relative overflow-visible h-18 w-18">
                <Image
                  src="/albion-party.png"
                  alt="Community"
                  fill
                  className="object-fit"
                />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Stay Updated</h2>
              <p className="text-muted-foreground text-lg">
                Follow us on Twitter or subscribe to our newsletter for the latest meta updates and market insights.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
            <Link
              href="https://twitter.com/Albion_Kit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-xl font-bold transition-all text-center whitespace-nowrap flex items-center gap-3 justify-center"
            >
              <Twitter className="h-5 w-5 fill-current" />
              Follow on Twitter
            </Link>
            <Link
              href="/settings"
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all text-center whitespace-nowrap flex items-center gap-3 justify-center"
            >
              <Mail className="h-5 w-5" />
              Manage Alerts
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}

// Helper Components

function FloatingItem({ src, top, left, right, bottom, delay }: { src: string, top?: string, left?: string, right?: string, bottom?: string, delay: number }) {
  return (
    <div
      className="absolute w-24 h-24 opacity-20 animate-float"
      style={{
        top, left, right, bottom,
        animationDelay: `${delay}s`,
        animationDuration: '6s'
      }}
    >
      <Image
        src={src}
        alt="Albion Item"
        width={96}
        height={96}
        className="object-contain"
      />
    </div>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="text-center space-y-2 group cursor-default">
      <p className="text-4xl font-bold text-foreground group-hover:text-primary transition-colors">{value}</p>
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

function FeatureCard({ href, icon, itemImage, title, description, color }: { href: string, icon: React.ReactNode, itemImage: string, title: string, description: string, color: string }) {
  const colorClasses: Record<string, string> = {
    amber: "group-hover:border-primary/50 group-hover:bg-primary/5",
    red: "group-hover:border-destructive/50 group-hover:bg-destructive/5",
    blue: "group-hover:border-info/50 group-hover:bg-info/5",
    emerald: "group-hover:border-success/50 group-hover:bg-success/5",
    green: "group-hover:border-success/50 group-hover:bg-success/5",
    purple: "group-hover:border-purple-500/50 group-hover:bg-purple-500/5",
  };

  const bgClass = colorClasses[color] || colorClasses.amber;

  return (
    <Link href={href} className={`group block relative p-6 md:p-8 bg-card rounded-3xl border border-border transition-all hover:-translate-y-2 overflow-hidden ${bgClass.split(' ')[0]} ${bgClass.split(' ')[1]}`}>
      {/* Background Icon Fade */}
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150 text-foreground">
        {icon}
      </div>

      <div className="flex justify-between items-start mb-6">
        <div className={`h-14 w-14 rounded-2xl bg-background border border-border flex items-center justify-center transition-colors group-hover:border-foreground/10`}>
          {icon}
        </div>
        <div className="relative w-16 h-16 opacity-50 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">
          <Image
            src={`https://render.albiononline.com/v1/item/${itemImage}?quality=5`}
            alt={title}
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-base">
        {description}
      </p>
    </Link>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30">
      <details className="p-6 cursor-pointer">
        <summary className="flex items-center justify-between font-bold text-foreground list-none">
          {question}
          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          {answer}
        </p>
      </details>
    </div>
  );
}
