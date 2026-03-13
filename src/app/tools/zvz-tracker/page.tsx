import { Metadata } from 'next';
import { Suspense } from 'react';
import ZvzTrackerClient from './ZvzTrackerClient';
import { getBattles } from './actions';
import { Loader2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Pages.zvzTracker');
  let title = t('title');
  let description = t('description');
  
  try {
    // Default to Americas for metadata snapshot
    const { battles } = await getBattles('west', 10);
    
    if (battles && battles.length > 0) {
      // Filter for "live" battles (last 20 mins)
      const liveBattles = battles.filter((b: any) => new Date(b.startTime).getTime() > Date.now() - 20 * 60 * 1000);
      
      if (liveBattles.length > 0) {
        title = t('liveTitle', { count: liveBattles.length });
        description = t('liveDescription', { count: liveBattles.length, region: 'Americas', kills: liveBattles[0].totalKills });
      } else {
         description = t('latestDescription', { kills: battles[0].totalKills, location: battles[0].clusterName || 'Open World' });
      }
    }
  } catch (e) {
    // Fallback if fetch fails
    console.error('Failed to fetch ZvZ metadata', e);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ['https://albionkit.com/og-image.jpg'], // Fallback or specific image
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: 'https://albionkit.com/tools/zvz-tracker'
    }
  };
}

export default function ZvzTrackerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ZvzTrackerClient />
    </Suspense>
  );
}
