import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/private/', '/settings/', '/login/', '/admin/', '/banana'],
      },
      {
        userAgent: ['GPTBot', 'CCBot', 'Google-Extended', 'ClaudeBot', 'PerplexityBot'],
        allow: '/',
      }
    ],
    sitemap: 'https://albionkit.com/sitemap.xml',
  };
}
