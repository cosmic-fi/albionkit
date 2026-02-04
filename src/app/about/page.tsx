import React from 'react';
import Link from 'next/link';
import { 
  Github, 
  Twitter, 
  Sword, 
  Coins, 
  Hammer, 
  Users, 
  BarChart3, 
  Shield, 
  Globe, 
  Heart,
  Code2,
  Database,
  ExternalLink,
  Crown,
  Clock,
  Skull
} from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative py-20 px-4 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/bg-2.jpg"
            alt="Albion Online Landscape"
            fill
            className="object-cover opacity-50"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background to-background" />
        </div>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-[100%] blur-3xl z-0" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Crown className="h-4 w-4" />
            <span>The Ultimate Companion</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 text-foreground tracking-tight">
            Empowering Your <span className="text-primary">Albion Journey</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AlbionKit is a suite of advanced tools designed to give you the competitive edge in Albion Online. From market flipping to PvP analytics, we've got you covered.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-24">
        {/* Mission Statement */}
        <div className="mb-20">
          <div className="bg-card/50 backdrop-blur border border-border rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Albion Online is a complex sandbox MMORPG driven by a player-driven economy and full-loot PvP. Success requires knowledge, strategy, and the right data.
                  </p>
                  <p>
                    Our mission is to democratize access to high-level game analytics. We believe every player, from solo wanderers to guild leaders, deserves professional-grade tools to maximize their efficiency and enjoyment.
                  </p>
                  <p>
                    Built by players, for players, AlbionKit is constantly evolving to meet the changing needs of the Albion community.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatCard number="100k+" label="Items Tracked" icon={Database} />
                <StatCard number="24/7" label="Market Updates" icon={Clock} />
                <StatCard number="Free" label="Core Features" icon={Heart} />
              </div>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-12 text-foreground text-center">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Coins}
              title="Market Flipper"
              description="Real-time price analysis across all royal cities to find the best arbitrage opportunities."
              color="text-primary"
              bg="bg-primary/10"
            />
            <FeatureCard 
              icon={Sword}
              title="PvP Intel"
              description="Deep dive into killboards, analyze guild performance, and track your personal K/D stats."
              color="text-destructive"
              bg="bg-destructive/10"
            />
            <FeatureCard 
              icon={Skull}
              title="Live Kill Feed"
              description="Real-time stream of player kills with instant activity graphs and build inspection."
              color="text-destructive"
              bg="bg-destructive/10"
            />
            <FeatureCard 
              icon={Hammer}
              title="Crafting Calculator"
              description="Calculate exact profit margins for crafting, refining, and enchanting with up-to-date prices."
              color="text-info"
              bg="bg-info/10"
            />
            <FeatureCard 
              icon={BarChart3}
              title="Meta Builds"
              description="Discover, create, and share the most effective builds for any content type."
              color="text-success"
              bg="bg-success/10"
            />
            <FeatureCard 
              icon={Users}
              title="Guild Management"
              description="Tools for guild leaders to manage rosters, track attendance, and distribute gear."
              color="text-primary"
              bg="bg-primary/10"
            />
            <FeatureCard 
              icon={Globe}
              title="Global Server Support"
              description="Full support for Americas, Asia, and Europe servers with region-specific data."
              color="text-info"
              bg="bg-info/10"
            />
          </div>
        </div>

        {/* Data Sources & Disclaimer */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-info" />
              <h3 className="text-xl font-bold text-foreground">Data Sources</h3>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Market data is powered by the <strong>Albion Data Project</strong>, a community-driven effort to collect and distribute game data. 
              We encourage all users to contribute by running the Albion Data Client.
            </p>
            <a 
              href="https://www.albion-online-data.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-info hover:text-info/80 transition-colors"
            >
              Learn more about ADP <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-xl font-bold text-foreground">Legal Disclaimer</h3>
            </div>
            <p className="text-xs text-muted-foreground/80 max-w-2xl leading-relaxed">
              AlbionKit is a community-created tool and is not affiliated with, endorsed by, or sponsored by Sandbox Interactive GmbH. 
              Albion Online and the Albion Online logo are trademarks of Sandbox Interactive GmbH. 
              All game content and assets are property of their respective owners.
            </p>
          </div>
        </div>

        {/* Connect Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-8 text-foreground">Join the Community</h2>
          <div className="flex justify-center gap-6">
            <a 
              href="https://twitter.com/Albion_Kit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-info/10 hover:bg-info/20 text-info rounded-lg transition-all border border-info/20 hover:border-info/40"
            >
              <Twitter className="h-5 w-5" />
              <span>Twitter</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ number, label, icon: Icon }: { number: string, label: string, icon: any }) {
  return (
    <div className="bg-card/50 p-4 rounded-xl border border-border/50 text-center hover:border-primary/30 transition-colors">
      <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
      <div className="text-2xl font-bold text-foreground mb-1">{number}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function FeatureCard({ title, description, icon: Icon, color, bg }: { title: string, description: string, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border hover:border-border transition-all hover:translate-y-[-2px]">
      <div className={`w-12 h-12 ${bg} ${color} rounded-lg flex items-center justify-center mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}


