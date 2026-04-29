import { Metadata } from 'next';
import KillboardClient from './KillboardClient';
import { getTranslations } from 'next-intl/server';
import { getScreenshotUrl, getFullScreenshotUrl, getScreenshot } from '@/lib/screenshot-metadata';

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Pages.killFeed');
  const title = t('title');
  const description = t('description');
  const screenshotKey = 'killboard';

  return {
    title,
    description,
    keywords: getScreenshot(screenshotKey).keywords.join(', '),
    alternates: {
      canonical: 'https://albionkit.com/tools/killboard',
    },
    openGraph: {
      title,
      description,
      url: 'https://albionkit.com/tools/killboard',
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

export default async function KillboardPage() {
  const tNav = await getTranslations('Navbar');
  const tPage = await getTranslations('Pages.killFeed');
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
        item: 'https://albionkit.com/tools/killboard',
      },
    ],
  };

  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Killboard - AlbionKit',
    applicationCategory: 'GameUtility',
    operatingSystem: 'Web Browser',
    description: 'Real-time PvP battle tracker and killboard for Albion Online. Analyze player statistics, guild wars, and live combat logs.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    featureList: 'Live Kill Feed, PvP Analysis, Guild Wars Tracking, Meta Weapon Tracking'
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <KillboardClient />
    </>
  );
}
