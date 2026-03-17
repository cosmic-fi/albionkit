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
        title = `${itemName} - Market Flipper | AlbionKit`;
        description = `Find profitable market flips for ${itemName} in Albion Online. Real-time price tracking and profit calculator.`;
      }
    } catch (e) {
      console.error('Failed to fetch Market Flipper metadata', e);
    }
  } else {
    // Enhanced default metadata
    title = 'Albion Online Market Flipper - Real-Time Profit Calculator | AlbionKit';
    description = 'Find profitable market flips in Albion Online. Track prices across all cities, set watchlist alerts, and maximize profits with real-time market data. Free tool with premium features.';
  }

  return {
    title,
    description,
    keywords: ['Albion Online market', 'market flipper', 'profit calculator', 'Albion trading', 'price tracker', 'arbitrage', 'Black Market', 'real-time prices'],
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://albionkit.com/tools/market-flipper',
      images: ['https://albionkit.com/og-market-flipper.jpg'],
      siteName: 'AlbionKit',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@Albion_Kit',
    },
    alternates: {
      canonical: 'https://albionkit.com/tools/market-flipper'
    }
  };
}

export default async function MarketFlipperPage() {
  const t = await getTranslations('Pages.marketFlipper');
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Market Flipper - AlbionKit',
    applicationCategory: 'GameUtility',
    operatingSystem: 'Web Browser',
    description: 'Real-time market flipping tool for Albion Online with profit calculator, price alerts, and watchlist tracking.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '156'
    },
    featureList: 'Market tracking, Profit calculator, Price alerts, Watchlist, Real-time data, Multi-city comparison'
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketFlipperClient />
    </>
  );
}
