import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createPageMetadata } from '@/lib/screenshot-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('CampaignTrackerPage');

  return createPageMetadata(
    'campaign-tracker',
    t('title'),
    t('description'),
    { canonicalUrl: 'https://albionkit.com/faction/campaign' }
  );
}

export default function CampaignTrackerPage() {
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <h1 className="text-4xl font-bold mb-4">Campaign Progress Tracker</h1>
      <p className="text-muted-foreground text-lg max-w-2xl">
        This tool is currently under development. Soon you will be able to track your monthly faction campaign progress and see how many points you need to reach your goal.
      </p>
    </div>
  );
}
