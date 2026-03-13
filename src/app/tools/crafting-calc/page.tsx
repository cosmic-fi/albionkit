import { Metadata } from 'next';
import CraftingCalcClient from './CraftingCalcClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Pages.crafting');
  const title = t('title');
  const description = t('description');
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ['https://albionkit.com/og-image.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: 'https://albionkit.com/tools/crafting-calc'
    }
  };
}

export default async function CraftingCalcPage() {
  const tNav = await getTranslations('Navbar');
  const tPage = await getTranslations('Pages.crafting');
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: tNav('home'),
        item: 'https://albionkit.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: tNav('tools'),
        item: 'https://albionkit.com/tools',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: tPage('title'),
        item: 'https://albionkit.com/tools/crafting-calc',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CraftingCalcClient />
    </>
  );
}
