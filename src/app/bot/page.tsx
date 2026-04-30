import { Metadata } from 'next';
import BotClient from './BotClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('BotPage');
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('seoKeywords'),
    alternates: {
      canonical: 'https://albionkit.com/bot',
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: 'https://albionkit.com/bot',
      siteName: 'AlbionKit',
      images: [
        {
          url: 'https://albionkit.com/background/discord-bot---.png',
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['https://albionkit.com/background/discord-bot---.png'],
    },
  };
}

export default function BotPage() {
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
        name: 'Bot',
        item: 'https://albionkit.com/bot',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BotClient />
    </>
  );
}
