import { MetadataRoute } from 'next';
import { getAllBuildsForSitemap, getAllThreadsForSitemap } from '@/lib/sitemap-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://albionkit.com';

  // 1. Static Routes
  const routes = [
    '',
    '/builds',
    '/tools/market-flipper',
    '/tools/pvp-intel',
    '/tools/crafting-calc',
    '/tools/gold-price',
    '/tools/kill-feed',
    '/tools/zvz-tracker',
    '/profits/alchemy',
    '/profits/cooking',
    '/profits/farming',
    '/profits/labour',
    '/profits/animal',
    '/profits/chopped-fish',
    '/profits/enchanting',
    '/about',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Dynamic Routes (Builds)
  const builds = await getAllBuildsForSitemap();
  const buildRoutes = builds.map((build) => ({
    url: `${baseUrl}/builds/${build.category}/${build.id}`,
    lastModified: build.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 3. Dynamic Routes (Threads)
  const threads = await getAllThreadsForSitemap();
  const threadRoutes = threads.map((thread) => ({
    url: `${baseUrl}/community/thread/${thread.id}`,
    lastModified: thread.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...routes, ...buildRoutes, ...threadRoutes];
}
