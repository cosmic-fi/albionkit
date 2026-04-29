import { getTranslations } from 'next-intl/server';
import CampaignClient from './CampaignClient';
import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/screenshot-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('FactionTools.campaign');
  
  return createPageMetadata(
    'campaign-tracker',
    t('title'),
    t('subtitle'),
    { canonicalUrl: 'https://albionkit.com/faction/campaign' }
  );
}

export default function CampaignPage() {
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
        name: 'Campaign Tracker',
        item: 'https://albionkit.com/faction/campaign',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CampaignClient />
    </>
  );
}
