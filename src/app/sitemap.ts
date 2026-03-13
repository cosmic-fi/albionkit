import { MetadataRoute } from 'next';
import { getAllBuildsForSitemap, getAllThreadsForSitemap } from '@/lib/sitemap-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://albionkit.com';
  
  // All supported locales
  const locales = ['en', 'de', 'es', 'fr', 'ko', 'pl', 'pt', 'ru', 'tr', 'zh'];

  // 1. Static Routes for all locales
  const staticRoutes = [
    '',
    '/builds',
    // '/forum',  // Temporarily hidden
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
  ];

  const routes: MetadataRoute.Sitemap = [];
  
  // Generate sitemap entries for all locales
  locales.forEach(locale => {
    staticRoutes.forEach((route) => {
      routes.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
      });
    });
  });

  // 2. Dynamic Routes (Builds) for all locales
  const builds = await getAllBuildsForSitemap();
  locales.forEach(locale => {
    builds.forEach((build) => {
      routes.push({
        url: `${baseUrl}/${locale}/builds/${build.category}/${build.id}`,
        lastModified: build.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  });

  // 3. Dynamic Routes (Threads) for all locales
  const threads = await getAllThreadsForSitemap();
  locales.forEach(locale => {
    threads.forEach((thread) => {
      routes.push({
        url: `${baseUrl}/${locale}/forum/thread/${thread.id}`,
        lastModified: thread.updatedAt,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    });
  });

  return routes;
}
