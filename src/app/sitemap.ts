import { MetadataRoute } from 'next';
import { getAllBuildsForSitemap } from '@/lib/sitemap-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://albionkit.com';

  // 1. Core Pages (Highest Priority)
  const corePages = [
    { route: '', priority: 1, changeFrequency: 'daily' as const },
    { route: '/bot', priority: 1, changeFrequency: 'weekly' as const },
    { route: '/builds', priority: 1, changeFrequency: 'daily' as const },
    { route: '/guides', priority: 1, changeFrequency: 'daily' as const },
  ].map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // 2. Tools Pages (High Priority)
  const toolsPages = [
    '/tools/market-flipper',
    '/tools/pvp-intel',
    '/tools/gold-price',
    '/tools/killboard',
    '/tools/zvz-tracker',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }));

  // 3. Faction Warfare Suite (High Priority)
  const factionPages = [
    '/faction/efficiency',
    '/faction/transport',
    '/faction/bandit',
    '/faction/campaign',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }));

  // 4. Profit Calculators (High Priority)
  const profitsPages = [
    '/profits/crafting',
    '/profits/farming',
    '/profits/animal',
    '/profits/cooking',
    '/profits/alchemy',
    '/profits/enchanting',
    '/profits/labour',
    '/profits/chopped-fish',
    '/profits/silver-farming',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }));

  // 4. Guide Pages (High Priority - SEO Content)
  const guidePages = [
    '/guides/getting-started',
    '/guides/combat/positioning',
    '/guides/gathering/routes',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.95,
  }));

  // 5. Community & Info Pages (exclude low-value pages from sitemap)
  const infoPages = [
    '/about',
    '/donate',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // 6. Dynamic Routes (Builds) - Top 100 by likes
  const builds = await getAllBuildsForSitemap();
  const buildRoutes = builds.slice(0, 50).map((build) => ({
    url: `${baseUrl}/builds/${build.id}`,
    lastModified: build.updatedAt ? new Date(build.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Combine all sitemap entries
  return [
    ...corePages,
    ...toolsPages,
    ...factionPages,
    ...profitsPages,
    ...guidePages,
    ...infoPages,
    ...buildRoutes,
  ];
}
