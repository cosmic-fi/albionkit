import { Metadata } from 'next';
import MarketFlipperClient from './MarketFlipperClient';
import { getItemNameService } from '@/lib/item-service';
import { getTranslations, getLocale } from 'next-intl/server';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const t = await getTranslations('Pages.marketFlipper');
  const locale = await getLocale();
  let title = t('title');
  let description = t('description');
  
  const resolvedSearchParams = await searchParams;
  const itemId = resolvedSearchParams?.item;

  if (typeof itemId === 'string' && itemId) {
    try {
      const itemName = await getItemNameService(itemId, locale);
      if (itemName) {
        title = `${itemName} | ${t('title')}`;
      }
    } catch (e) {
      console.error('Failed to fetch Market Flipper metadata', e);
    }
  }

  return {
    title,
    description,
    keywords: ['Albion Online', 'Market Flipper', 'Arbitrage', 'Black Market', 'Trading', 'Economy'],
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
    }
    ,
    alternates: {
      canonical: 'https://albionkit.com/tools/market-flipper'
    }
  };
}

export default async function MarketFlipperPage() {
  const tNav = await getTranslations('Navbar');
  const tPage = await getTranslations('MarketFlipper');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AlbionKit Market Flipper',
    applicationCategory: 'GameTool',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'A powerful market flipping tool for Albion Online that helps players find arbitrage opportunities between cities.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };

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
        item: 'https://albionkit.com/tools/market-flipper',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <MarketFlipperClient />
    </>
  );
}
