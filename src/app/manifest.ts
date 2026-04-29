import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AlbionKit - The Ultimate Albion Online Companion',
    short_name: 'AlbionKit',
    description: 'Master Albion Online with AlbionKit. Features include a powerful Build Database, Faction Warfare & Bandit Trackers, Market Flipper, PvP Intel, Crafting Calculator, and real-time Killboard.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c0a09',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
