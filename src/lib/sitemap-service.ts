import buildsData from '@/data/builds.json';

/**
 * Get builds for sitemap - returns top builds from JSON data
 */
export async function getAllBuildsForSitemap() {
  try {
    // Return formatted build data for sitemap
    return (buildsData as any[]).map(build => ({
      id: build.id,
      updatedAt: build.updatedAt || new Date().toISOString(),
      title: build.title,
      likes: build.likes || 0,
    }));
  } catch (error) {
    console.error('Error fetching builds for sitemap:', error);
    return [];
  }
}