'use server';

import { searchItemsService, SimpleItem } from '@/lib/item-service';
import { searchBuildsService } from '@/lib/builds-service';

export type SearchResultType = 'page' | 'item' | 'tool' | 'build';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
  icon?: string;
}

const STATIC_PAGES: SearchResult[] = [
  // Tools
  { id: 'tool-market', type: 'tool', title: 'Market Flipper', subtitle: 'Find arbitrage opportunities', href: '/tools/market-flipper', icon: 'Coins' },
  { id: 'tool-pvp', type: 'tool', title: 'PvP Intel', subtitle: 'Analyze battles and killboards', href: '/tools/pvp-intel', icon: 'Sword' },
  { id: 'tool-zvz', type: 'tool', title: 'ZvZ Tracker', subtitle: 'Large scale battle analysis', href: '/tools/zvz-tracker', icon: 'Shield' },
  { id: 'tool-craft', type: 'tool', title: 'Crafting Calculator', subtitle: 'Optimize crafting profits', href: '/tools/crafting-calc', icon: 'Hammer' },
  { id: 'tool-gold', type: 'tool', title: 'Gold Price', subtitle: 'Gold market charts', href: '/tools/gold-price', icon: 'LineChart' },
  
  // Profit Calculators
  { id: 'profit-farming', type: 'page', title: 'Farming Profits', subtitle: 'Crop and animal yield calculator', href: '/profits/farming', icon: 'Sprout' },
  { id: 'profit-cooking', type: 'page', title: 'Cooking Profits', subtitle: 'Food crafting calculator', href: '/profits/cooking', icon: 'Utensils' },
  { id: 'profit-alchemy', type: 'page', title: 'Alchemy Profits', subtitle: 'Potion brewing calculator', href: '/profits/alchemy', icon: 'FlaskConical' },
  { id: 'profit-animal', type: 'page', title: 'Animal Breeding', subtitle: 'Breeding profit calculator', href: '/profits/animal', icon: 'Rabbit' }, // Using Rabbit as generic animal icon
  { id: 'profit-enchant', type: 'page', title: 'Enchanting Profits', subtitle: 'Enchanting profit calculator', href: '/profits/enchanting', icon: 'Sparkles' },
  { id: 'profit-labour', type: 'page', title: 'Labourer Profits', subtitle: 'Labourer yield calculator', href: '/profits/labour', icon: 'HardHat' },
  
  // Build Categories
  { id: 'builds-solo', type: 'page', title: 'Solo Builds', subtitle: 'Best builds for solo play', href: '/builds/solo', icon: 'User' },
  { id: 'builds-zvz', type: 'page', title: 'ZvZ Builds', subtitle: 'Meta builds for large scale', href: '/builds/zvz', icon: 'Skull' },
  { id: 'builds-small', type: 'page', title: 'Small Scale Builds', subtitle: 'Builds for small groups', href: '/builds/small-scale', icon: 'Users' },
  { id: 'builds-pvp', type: 'page', title: 'PvP Builds', subtitle: 'General PvP builds', href: '/builds/pvp', icon: 'Swords' },
  
  // Misc
  { id: 'settings', type: 'page', title: 'Settings', subtitle: 'App configuration', href: '/settings', icon: 'Settings' },
  { id: 'premium', type: 'page', title: 'Premium Status', subtitle: 'Manage premium features', href: '/premium', icon: 'Crown' },
];

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  // 1. Search Static Pages & Tools
  const matchingPages = STATIC_PAGES.filter(page => 
    page.title.toLowerCase().includes(lowerQuery) || 
    page.subtitle?.toLowerCase().includes(lowerQuery)
  );
  results.push(...matchingPages);

  // 2. Search Items and then Builds
  let matchedItemIds: string[] = [];
  try {
    const items = await searchItemsService(query);
    matchedItemIds = items.map(i => i.id);
    
    const itemResults: SearchResult[] = items.slice(0, 5).map(item => ({
      id: `item-${item.id}`,
      type: 'item',
      title: item.name,
      subtitle: item.twoHanded ? 'Two-Handed Weapon' : 'Item',
      href: `/tools/market-flipper?item=${item.id}`,
      icon: 'Box'
    }));
    results.push(...itemResults);
  } catch (error) {
    console.error('Item search failed:', error);
  }

  // 3. Search Builds (by title OR by matched item)
  try {
    const builds = await searchBuildsService(query, matchedItemIds);
    const buildResults: SearchResult[] = builds.map(build => ({
      id: `build-${build.id}`,
      type: 'build',
      title: build.title,
      subtitle: `${build.category} • ${build.authorName}`,
      href: `/builds/${build.category}/${build.id}`,
      icon: 'Hammer' // Or a specific build icon
    }));
    results.push(...buildResults);
  } catch (error) {
    console.error('Build search failed:', error);
  }

  return results;
}
