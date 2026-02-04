import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AlbionKit - The Ultimate Albion Online Companion',
    short_name: 'AlbionKit',
    description: 'Master Albion Online with AlbionKit. Features include a powerful Build Database, Market Flipper, PvP Intel, Crafting Calculator, and real-time Kill Feeds.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a', // slate-900 (background)
    theme_color: '#f59e0b', // amber-500 (primary)
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
