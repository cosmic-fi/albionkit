
interface AlbionItem {
  Index: string;
  UniqueName: string;
  LocalizedNames?: {
    'EN-US'?: string;
    [key: string]: string | undefined;
  };
  LocalizedDescriptions?: {
    'EN-US'?: string;
    [key: string]: string | undefined;
  };
}

export interface SimpleItem {
  id: string;
  name: string;
  twoHanded: boolean;
}

let cachedItems: SimpleItem[] | null = null;
let allItemsMap: Map<string, string> | null = null;
const ITEMS_JSON_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json';

export async function getItems(): Promise<SimpleItem[]> {
  if (cachedItems) return cachedItems;

  try {
    console.log('Fetching Albion items database...');
    const response = await fetch(ITEMS_JSON_URL, {
        cache: 'no-store' // Bypass Next.js Data Cache (file > 2MB)
    });
    
    if (!response.ok) throw new Error('Failed to fetch items');
    
    const data: AlbionItem[] = await response.json();
    
    // Build Map for all items (for name resolution)
    allItemsMap = new Map();
    data.forEach(item => {
        if (item.UniqueName && item.LocalizedNames?.['EN-US']) {
            allItemsMap!.set(item.UniqueName, item.LocalizedNames['EN-US']);
        }
    });

    // Filter and map to simple structure
    // We filter out items without names, IDs, or non-craftable items
    cachedItems = data
      .filter(item => {
          if (!item.UniqueName || !item.LocalizedNames?.['EN-US']) return false;
          
          const id = item.UniqueName;
          
          // Must be tiered item (T1-T8)
          if (!/^T\d+_/.test(id)) return false;
          
          // Exclude Enchanted variants (handled by base item + tier selector)
          if (id.includes('@') || id.includes('_LEVEL')) return false;

          // Exclude specific uncraftable suffixes/types
          const exclusions = [
            '_ORE', '_WOOD', '_HIDE', '_FIBER', '_ROCK', // Raw Resources
            '_ARTEFACT_', // Artifacts
            '_RUNE', '_SOUL', '_RELIC', '_SHARD', // Enchanting materials
            '_INSIGHT', // Tomes
            '_TRASH',
            'NONTRADABLE',
            // '_FISH', // Handled separately to allow Fish Meals
            '_FULL', // Filled journals
            // '_CRYSTAL' // Handled separately to allow Crystal Weapons
          ];
          
          if (exclusions.some(ex => id.includes(ex))) return false;

          // Special filtering for FISH: Exclude raw fish, but allow Meals/Potions containing fish
          if (id.includes('_FISH') && !id.includes('_MEAL') && !id.includes('_POTION')) return false;

          return true;
      })
      .map(item => ({
        id: item.UniqueName,
        name: item.LocalizedNames!['EN-US']!,
        twoHanded: item.UniqueName.includes('_2H_')
      }));
    
    console.log(`Loaded ${cachedItems.length} items.`);
    return cachedItems;
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}

export async function getItemNameService(id: string): Promise<string | null> {
    if (!allItemsMap) await getItems();
    
    // Try exact match first
    let name = allItemsMap?.get(id);
    if (name) return name;

    // Try stripping suffix (e.g., @1, @2, @3)
    if (id.includes('@')) {
        const baseId = id.split('@')[0];
        name = allItemsMap?.get(baseId);
        if (name) return name;
    }
    
    return null;
}

export async function searchItemsService(query: string): Promise<SimpleItem[]> {
  if (!query || query.length < 2) return [];
  
  const items = await getItems();
  const lowerQuery = query.toLowerCase();
  
  return items
    .filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      item.id.toLowerCase().includes(lowerQuery)
    )
    .sort((a, b) => {
        // Prioritize exact matches or startsWith
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aId = a.id.toLowerCase();
        const bId = b.id.toLowerCase();

        // Exact match check
        if (aName === lowerQuery || aId === lowerQuery) return -1;
        if (bName === lowerQuery || bId === lowerQuery) return 1;

        // Starts with check
        if (aName.startsWith(lowerQuery) && !bName.startsWith(lowerQuery)) return -1;
        if (bName.startsWith(lowerQuery) && !aName.startsWith(lowerQuery)) return 1;

        return 0;
    })
    .slice(0, 50); // Limit results
}
