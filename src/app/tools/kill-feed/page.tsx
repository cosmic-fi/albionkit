import { Metadata } from 'next';
import KillFeedClient from './KillFeedClient';

export const metadata: Metadata = {
  title: 'Live Kill Feed - Real-time Albion Online PvP | AlbionKit',
  description: 'Watch the action unfold with the Albion Online Live Kill Feed. Track high-value kills, guild battles, and zone activity in real-time.',
  keywords: ['Albion Online Kill Feed', 'Live PvP', 'High Value Kills', 'Albion PvP Tracker', 'Real-time Killboard'],
  openGraph: {
    title: 'Albion Online Live Kill Feed',
    description: 'Real-time tracking of PvP kills in Albion Online. See who is dying and what they are dropping.',
    type: 'website',
  },
};

export default function KillFeedPage() {
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
        name: 'Kill Feed',
        item: 'https://albionkit.com/tools/kill-feed',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <KillFeedClient />
    </>
  );
}
