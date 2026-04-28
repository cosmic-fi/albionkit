import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import EfficiencyClient from './EfficiencyClient';
import { createPageMetadata } from '@/lib/screenshot-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('FactionEfficiencyPage');

  return createPageMetadata(
    'faction-efficiency',
    t('title'),
    t('description'),
    { canonicalUrl: 'https://albionkit.com/faction/efficiency' }
  );
}

export default function EfficiencyPage() {
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
        name: 'Efficiency',
        item: 'https://albionkit.com/faction/efficiency',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <EfficiencyClient />
    </>
  );
}
