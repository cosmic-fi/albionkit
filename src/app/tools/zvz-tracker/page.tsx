import { Metadata } from 'next';
import { Suspense } from 'react';
import ZvzTrackerClient from './ZvzTrackerClient';
import { getBattles } from './actions';
import { Preloader } from '@/components/Preloader';
// Loader2 removed - using Preloader component
import { getTranslations } from 'next-intl/server';
import { getScreenshotUrl, getFullScreenshotUrl, getScreenshot } from '@/lib/screenshot-metadata';

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Pages.zvzTracker');
  let title = t('title');
  let description = t('description');
  const screenshotKey = 'zvz-tracker';

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
    keywords: getScreenshot(screenshotKey).keywords.join(', '),
    alternates: {
      canonical: 'https://albionkit.com/tools/zvz-tracker',
    },
    openGraph: {
      title,
      description,
      url: 'https://albionkit.com/tools/zvz-tracker',
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

export default function ZvzTrackerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Preloader size="lg" />
      </div>
    }>
      <ZvzTrackerClient />
    </Suspense>
  );
}
