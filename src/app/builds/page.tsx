import { PageShell } from '@/components/PageShell';
import { InfoStrip, InfoBanner } from '@/components/InfoStrip';
import { User, Users, Skull, Sword, Shield, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function BuildsIndexPage() {
  const categories = [
    { id: 'solo', name: 'Solo', icon: User, desc: 'Optimized for solo play, mists, and corrupted dungeons.' },
    { id: 'small-scale', name: 'Small Scale', icon: Users, desc: 'Builds for small groups, roaming, and hellgates.' },
    { id: 'pvp', name: 'PvP', icon: Sword, desc: 'General PvP builds for various scenarios.' },
    { id: 'zvz', name: 'ZvZ', icon: Skull, desc: 'Large scale battles and faction warfare.' },
    { id: 'large-scale', name: 'Large Scale', icon: Shield, desc: 'Massive group fights and territory control.' },
    { id: 'group', name: 'Group', icon: Users, desc: 'General group content and fame farming.' },
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://albionkit.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Builds',
        item: 'https://albionkit.com/builds',
      },
    ],
  };

  return (
    <PageShell 
      title="Builds Database" 
      backgroundImage='/background/ao-group.jpg'  
      description="Explore the best builds for every content type in Albion Online.">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/builds/${cat.id}`}>
              <div className="bg-card/50 border border-border rounded-xl p-6 hover:border-primary/50 hover:bg-card transition-all cursor-pointer h-full group">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors text-muted-foreground">
                  <cat.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-muted-foreground text-sm">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <InfoStrip currentPage="builds">
        <InfoBanner icon={<BookOpen className="w-4 h-4" />} color="text-cyan-400" title="Community Builds Database">
          <p>Explore meta builds curated by the community for every activity in Albion Online.</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-xs opacity-90">
             <li>Browse by category (Solo, ZvZ, Small Scale, etc.)</li>
             <li>Create and share your own builds with the community</li>
             <li>Vote on the best builds to help others find what works</li>
          </ul>
        </InfoBanner>
      </InfoStrip>
    </PageShell>
  );
}
