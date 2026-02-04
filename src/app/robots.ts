import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/settings/', '/login/', '/admin/'],
    },
    sitemap: 'https://albionkit.com/sitemap.xml',
  };
}
