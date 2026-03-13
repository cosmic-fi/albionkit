import { Metadata } from 'next';
import GoldPriceClient from './GoldPriceClient';
import { getGoldHistory } from '@/lib/gold-service';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Pages.goldPrice');
  let title = t('title');
  let description = t('description');

  try {
    // Default to Americas for metadata snapshot
    const history = await getGoldHistory('west', 1);
    
    if (history && history.length > 0) {
      const currentPrice = history[history.length - 1].price;
      description = t('descriptionDynamic', { price: currentPrice.toLocaleString() });
    }
  } catch (e) {
    console.error('Failed to fetch Gold Price metadata', e);
  }

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
      canonical: 'https://albionkit.com/tools/gold-price'
    }
  };
}

export default function GoldPricePage() {
  return <GoldPriceClient />;
}
