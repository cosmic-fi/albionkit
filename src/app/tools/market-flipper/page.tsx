import { Metadata } from 'next';
import MarketFlipperClient from './MarketFlipperClient';
import { getItemNameService } from '@/lib/item-service';
import { getTranslations, getLocale } from 'next-intl/server';
import { getScreenshotUrl, getFullScreenshotUrl, getScreenshot } from '@/lib/screenshot-metadata';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const t = await getTranslations('Pages.marketFlipper');
  const tPage = await getTranslations('MarketFlipperPage');
  const locale = await getLocale();
  let title = tPage('title');
  let description = tPage('description');
  const screenshotKey = 'market-flipper';

  const resolvedSearchParams = await searchParams;
  const itemId = resolvedSearchParams?.item;

  if (typeof itemId === 'string' && itemId) {
    try {
      const itemName = await getItemNameService(itemId, locale);
      if (itemName) {
        title = `${itemName} - ${t('title')}`;
        description = t('descriptionDynamic', { itemName });
      }
    } catch (e) {
      console.error('Failed to fetch Market Flipper metadata', e);
    }
  }

  return {
    title,
    description,
    keywords: getScreenshot(screenshotKey).keywords.join(', '),
    alternates: {
      canonical: 'https://albionkit.com/tools/market-flipper',
    },
    openGraph: {
      title,
      description,
      url: 'https://albionkit.com/tools/market-flipper',
      type: 'website',
      images: [{
        url: getFullScreenshotUrl(screenshotKey),
        width: 1200,
        height: 630,
        alt: getScreenshot(screenshotKey).alt,
        type: 'image/png'
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getScreenshotUrl(screenshotKey)],
    }
  };
}

export default async function MarketFlipperPage() {
  const t = await getTranslations('Pages.marketFlipper');
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
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
