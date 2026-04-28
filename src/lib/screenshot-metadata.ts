/**
 * Screenshot Metadata Helper
 * 
 * Provides utilities for managing and using SEO screenshots across the app
 */

import screenshotsData from '../../public/screenshots/screenshots.json';

export interface ScreenshotMetadata {
  alt: string;
  title: string;
  caption: string;
  keywords: string[];
  page: string | null;
}

export type ScreenshotKey = keyof typeof screenshotsData;

/**
 * Get screenshot metadata by key
 * 
 * @example
 * const screenshot = getScreenshot('market-flipper');
 * 
 * @param key - Screenshot key (e.g., 'market-flipper', 'builds-list')
 */
export function getScreenshot(key: ScreenshotKey): ScreenshotMetadata {
  return screenshotsData[key];
}

/**
 * Get screenshot URL by key
 * 
 * @example
 * const url = getScreenshotUrl('market-flipper');
 * // Returns: '/screenshots/tools/market-flipper.png'
 * 
 * @param key - Screenshot key
 */
export function getScreenshotUrl(key: ScreenshotKey): string {
  const mapping = getScreenshotPathMapping(key);
  return `/screenshots/${mapping}/${key}.png`;
}

/**
 * Get full screenshot URL for Open Graph (absolute URL)
 * 
 * @example
 * const fullUrl = getFullScreenshotUrl('market-flipper');
 * // Returns: 'https://albionkit.com/screenshots/tools/market-flipper.png'
 * 
 * @param key - Screenshot key
 * @param baseUrl - Base URL (default: 'https://albionkit.com')
 */
export function getFullScreenshotUrl(key: ScreenshotKey, baseUrl = 'https://albionkit.com'): string {
  return `${baseUrl}${getScreenshotUrl(key)}`;
}

/**
 * Create Open Graph image configuration
 *
 * @example
 * const ogImage = createOpenGraphImage('market-flipper');
 *
 * @param key - Screenshot key
 * @param width - Image width (default: 1200 for OG)
 * @param height - Image height (default: 630 for OG)
 */
export function createOpenGraphImage(
  key: ScreenshotKey,
  width = 1200,
  height = 630
) {
  const screenshot = getScreenshot(key);
  return {
    url: getFullScreenshotUrl(key),
    width,
    height,
    alt: screenshot.alt,
    type: 'image/png'
  };
}

/**
 * Create Twitter card image configuration
 * 
 * @example
 * const twitterImage = createTwitterImage('market-flipper');
 * 
 * @param key - Screenshot key
 */
export function createTwitterImage(key: ScreenshotKey) {
  const screenshot = getScreenshot(key);
  return {
    card: 'summary_large_image' as const,
    title: screenshot.title,
    description: screenshot.caption,
    images: [getScreenshotUrl(key)]
  };
}

/**
 * Create complete metadata object for a page
 *
 * @example
 * export const metadata = createPageMetadata(
 *   'market-flipper',
 *   'Market Flipper - AlbionKit',
 *   'Find profitable market flips in real-time...'
 * );
 *
 * @param key - Screenshot key
 * @param title - Page title
 * @param description - Page description
 * @param options - Additional metadata options
 */
export function createPageMetadata(
  key: ScreenshotKey,
  title: string,
  description: string,
  options: {
    includeTwitter?: boolean;
    canonicalUrl?: string;
  } = {}
) {
  const { includeTwitter = true, canonicalUrl } = options;
  const screenshot = getScreenshot(key);

  const metadata: any = {
    title,
    description,
    keywords: screenshot.keywords.join(', '),
    openGraph: {
      title,
      description,
      images: [createOpenGraphImage(key)],
      type: 'website',
      locale: 'en_US',
      siteName: 'AlbionKit'
    }
  };

  // Use correct Next.js canonical URL property
  if (canonicalUrl) {
    metadata.alternates = {
      canonical: canonicalUrl,
    };
  }

  if (includeTwitter) {
    metadata.twitter = createTwitterImage(key);
  }

  return metadata;
}

/**
 * Get all screenshot keys for a category
 * 
 * @example
 * const toolScreenshots = getScreenshotsByCategory('tools');
 * 
 * @param category - Category name (e.g., 'tools', 'profits', 'builds')
 */
export function getScreenshotsByCategory(category: string): ScreenshotKey[] {
  const categoryMapping: Record<string, ScreenshotKey[]> = {
    tools: ['market-flipper', 'gold-price', 'crafting-calc', 'pvp-intel', 'zvz-tracker'],
    profits: ['farming-calc', 'cooking-calc', 'alchemy-calc', 'animal-calc', 'chopped-fish-calc', 'enchanting-calc', 'labour-calc'],
    builds: ['builds-list', 'build-detail'],
    forum: ['forum-list', 'thread-detail'],
    user: ['user-profile', 'settings'],
    misc: ['homepage', 'login', 'about'],
    faction: ['faction-efficiency', 'heart-transport', 'bandit-tracker', 'campaign-tracker']
  };

  return categoryMapping[category] || [];
}

/**
 * Get screenshot path mapping based on key
 * Internal helper function
 */
function getScreenshotPathMapping(key: ScreenshotKey): string {
  const pathMapping: Record<ScreenshotKey, string> = {
    // Misc
    'homepage': 'misc',
    'logo': 'misc',
    'logo-alt': 'misc',
    'tools-overview': 'misc',
    'guild-tools': 'misc',
    'login': 'misc',
    'about': 'misc',
    
    // Builds
    'builds-list': 'builds',
    'build-detail': 'builds',
    
    // Tools
    'market-flipper': 'tools',
    'killboard': 'tools',
    'gold-price': 'tools',
    'crafting-calc': 'tools',
    'pvp-intel': 'tools',
    'zvz-tracker': 'tools',
    
    // Profits
    'farming-calc': 'profits',
    'cooking-calc': 'profits',
    'alchemy-calc': 'profits',
    'animal-calc': 'profits',
    'chopped-fish-calc': 'profits',
    'enchanting-calc': 'profits',
    'labour-calc': 'profits',
    
    // Forum
    'forum-list': 'forum',
    'thread-detail': 'forum',
    
    // User
    'user-profile': 'user',
    'settings': 'user',

    // Faction
    'faction-efficiency': 'faction',
    'heart-transport': 'faction',
    'bandit-tracker': 'faction',
    'campaign-tracker': 'faction'
  };
  
  return pathMapping[key] || 'misc';
}

/**
 * Generate sitemap entries for pages with screenshots
 * 
 * @example
 * const sitemapEntries = generateScreenshotSitemap();
 */
export function generateScreenshotSitemap() {
  return Object.entries(screenshotsData).map(([key, data]) => ({
    url: data.page,
    image: `/screenshots/${getScreenshotPathMapping(key as ScreenshotKey)}/${key}.png`,
    imageTitle: data.title,
    imageCaption: data.caption
  }));
}

/**
 * Hook for using screenshot metadata in components
 * 
 * @example
 * function Page() {
 *   const { screenshot, imageUrl } = useScreenshot('market-flipper');
 *   return <img src={imageUrl} alt={screenshot.alt} />;
 * }
 */
export function useScreenshot(key: ScreenshotKey) {
  const screenshot = getScreenshot(key);
  const imageUrl = getScreenshotUrl(key);
  
  return {
    screenshot,
    imageUrl,
    fullImageUrl: getFullScreenshotUrl(key)
  };
}

/**
 * Validate that all screenshot files exist
 * Run this during build to catch missing screenshots
 * 
 * @example
 * await validateScreenshots();
 */
export async function validateScreenshots(): Promise<{
  valid: string[];
  missing: string[];
}> {
  const valid: string[] = [];
  const missing: string[] = [];
  
  // In a real implementation, you'd check the file system
  // This is a placeholder for build-time validation
  
  const keys = Object.keys(screenshotsData) as ScreenshotKey[];
  
  for (const key of keys) {
    const path = getScreenshotUrl(key);
    // Check if file exists (implement based on your build system)
    const exists = await checkFileExists(path);
    
    if (exists) {
      valid.push(key);
    } else {
      missing.push(key);
    }
  }
  
  return { valid, missing };
}

/**
 * Helper to check if file exists
 * Placeholder - implement based on your environment
 */
async function checkFileExists(path: string): Promise<boolean> {
  // In Next.js, you can use fetch in development
  // or check the file system in Node.js
  try {
    const response = await fetch(path);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Export all screenshot data for external use
 */
export const allScreenshots = screenshotsData;

/**
 * Get total number of screenshots
 */
export const screenshotCount = Object.keys(screenshotsData).length;
