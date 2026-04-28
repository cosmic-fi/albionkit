import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createPageMetadata } from '@/lib/screenshot-metadata';

import TransportClient from './TransportClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('HeartTransportPage');

  return createPageMetadata(
    'heart-transport',
    t('title'),
    t('description'),
    { canonicalUrl: 'https://albionkit.com/faction/transport' }
  );
}

export default function HeartTransportPage() {
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
        name: 'Faction',
        item: 'https://albionkit.com/faction',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Heart Transport',
        item: 'https://albionkit.com/faction/transport',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TransportClient />
    </>
  );
}
