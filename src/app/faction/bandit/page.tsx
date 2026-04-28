import { Metadata } from 'next';
import BanditTrackerClient from './BanditTrackerClient';
import { getTranslations } from 'next-intl/server';
import { createPageMetadata } from '@/lib/screenshot-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('BanditTrackerPage');

  return createPageMetadata(
    'bandit-tracker',
    t('title'),
    t('description'),
    { canonicalUrl: 'https://albionkit.com/faction/bandit' }
  );
}

export default function BanditTrackerPage() {
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
        name: 'Bandit Tracker',
        item: 'https://albionkit.com/faction/bandit',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BanditTrackerClient />
    </>
  );
}
