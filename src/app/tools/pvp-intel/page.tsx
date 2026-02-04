import { Metadata } from 'next';
import PvpIntelClient from './PvpIntelClient';

export const metadata: Metadata = {
  title: 'Albion Online PvP Intel - Player & Guild Stats | AlbionKit',
  description: 'Analyze Albion Online PvP stats with precision. Search players, guilds, and battles to view kill fame, K/D ratios, and recent combat history.',
  keywords: ['Albion Online PvP', 'Albion Killboard', 'Player Stats', 'Guild Stats', 'Albion ZvZ', 'PvP Analysis'],
  openGraph: {
    title: 'Albion Online PvP Intel - Player & Guild Stats',
    description: 'Deep dive into Albion Online PvP statistics. Track player performance, guild history, and recent battles.',
    type: 'website',
  },
};

export default function PvpIntelPage() {
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
        name: 'Tools',
        item: 'https://albionkit.com/tools',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'PvP Intel',
        item: 'https://albionkit.com/tools/pvp-intel',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PvpIntelClient />
    </>
  );
}
