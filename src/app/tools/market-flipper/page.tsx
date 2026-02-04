import { Metadata } from 'next';
import MarketFlipperClient from './MarketFlipperClient';

export const metadata: Metadata = {
  title: 'Albion Online Market Flipper - Profit Calculator | AlbionKit',
  description: 'Find the most profitable items to flip in Albion Online. Real-time market data, arbitrage calculator, and historical price charts for all cities and the Black Market.',
  keywords: ['Albion Online Market Flipper', 'Albion Flipping Tool', 'Albion Market Arbitrage', 'Black Market Flipper', 'Albion Online Economy', 'Albion Trading'],
  openGraph: {
    title: 'Albion Online Market Flipper - Profit Calculator',
    description: 'Maximize your silver with the ultimate Market Flipper tool. Find trade routes, arbitrage opportunities, and Black Market flips instantly.',
    type: 'website',
  },
};

export default function MarketFlipperPage() {
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
        name: 'Market Flipper',
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
