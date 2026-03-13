
interface AlbionItem {
  Index: string;
  UniqueName: string;
  LocalizedNames?: {
    'EN-US'?: string;
    'DE-DE'?: string;
    'ES-ES'?: string;
    'FR-FR'?: string;
    'PT-BR'?: string;
    'RU-RU'?: string;
    'TR-TR'?: string;
    'KO-KR'?: string;
    'PL-PL'?: string;
    'ZH-CN'?: string;
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

// Mapping from app locales (en, de, es, etc.) to Albion API locales
const LOCALE_MAP: Record<string, string> = {
  'en': 'EN-US',
  'de': 'DE-DE',
  'es': 'ES-ES',
  'fr': 'FR-FR',
  'pt': 'PT-BR',
  'ru': 'RU-RU',
  'tr': 'TR-TR',
  'ko': 'KO-KR',
  'pl': 'PL-PL',
  'zh': 'ZH-CN',
};

export { LOCALE_MAP };

let cachedRawItems: AlbionItem[] = [];
let cachedItemsByLocale: Map<string, SimpleItem[]> = new Map();
let allItemsMapByLocale: Map<string, Map<string, string>> = new Map();
let cachedMultilingualIndex: Map<string, { id: string; allNames: Map<string, string> }> | null = null;
const ITEMS_JSON_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json';

async function getRawItems(): Promise<AlbionItem[]> {
  if (cachedRawItems.length > 0) return cachedRawItems;

  try {
    console.log('Fetching Albion items database...');
    const response = await fetch(ITEMS_JSON_URL, {
        next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) throw new Error('Failed to fetch items');
    
    cachedRawItems = await response.json();
    console.log(`Loaded ${cachedRawItems.length} raw items.`);
    return cachedRawItems || [];
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}

function processItemsForLocale(rawItems: AlbionItem[], locale: string): SimpleItem[] {
  const albionLocale = LOCALE_MAP[locale] || 'EN-US';
  
  return rawItems
    .filter(item => {
      if (!item.UniqueName) return false;
      
      // Try to get name in requested locale, fall back to EN-US
      const localizedNames = item.LocalizedNames || {};
      const name = localizedNames[albionLocale] || localizedNames['EN-US'];
      if (!name) return false;
      
      const id = item.UniqueName;
      
      // Must be tiered item (T1-T8)
      if (!/^T\d+_/.test(id)) return false;
      
      // Exclude Enchanted variants
      if (id.includes('@') || id.includes('_LEVEL')) return false;

      // Exclude specific uncraftable suffixes/types
      const exclusions = [
        '_ORE', '_WOOD', '_HIDE', '_FIBER', '_ROCK', // Raw Resources
        '_ARTEFACT_', // Artifacts
        '_RUNE', '_SOUL', '_RELIC', '_SHARD', // Enchanting materials
        '_INSIGHT', // Tomes
        '_TRASH',
        'NONTRADABLE',
        '_FULL', // Filled journals
      ];
      
      if (exclusions.some(ex => id.includes(ex))) return false;

      // Special filtering for FISH
      if (id.includes('_FISH') && !id.includes('_MEAL') && !id.includes('_POTION')) return false;

      return true;
    })
    .map(item => ({
      id: item.UniqueName,
      name: (item.LocalizedNames?.[albionLocale] || item.LocalizedNames?.['EN-US'])!,
      twoHanded: item.UniqueName.includes('_2H_')
    }));
}

export async function getItems(locale: string = 'en'): Promise<SimpleItem[]> {
  // Check cache first
  if (cachedItemsByLocale.has(locale)) {
    return cachedItemsByLocale.get(locale)!;
  }

  try {
    const rawItems = await getRawItems();
    const items = processItemsForLocale(rawItems, locale);
    
    // Cache the processed items for this locale
    cachedItemsByLocale.set(locale, items);
    console.log(`Loaded ${items.length} items for locale ${locale}.`);
    
    return items;
  } catch (error) {
    console.error('Error processing items:', error);
    return [];
  }
}

export async function getItemNameService(id: string, locale: string = 'en'): Promise<string | null> {
    // Check cache first
    if (!allItemsMapByLocale.has(locale)) {
      const rawItems = await getRawItems();
      const albionLocale = LOCALE_MAP[locale] || 'EN-US';
      const itemMap = new Map<string, string>();
      
      rawItems.forEach(item => {
        if (item.UniqueName) {
          // Try the requested locale first, then fall back to EN-US, then any available locale
          const name = item.LocalizedNames?.[albionLocale] || 
                       item.LocalizedNames?.['EN-US'] ||
                       Object.values(item.LocalizedNames || {})[0]; // First available locale
          if (name) {
            itemMap.set(item.UniqueName, name);
          }
        }
      });
      
      allItemsMapByLocale.set(locale, itemMap);
    }
    
    const itemMap = allItemsMapByLocale.get(locale);
    
    // Try exact match first
    let name = itemMap?.get(id);
    if (name) return name;

    // Try stripping suffix (e.g., @1, @2, @3)
    if (id.includes('@')) {
        const baseId = id.split('@')[0];
        name = itemMap?.get(baseId);
        if (name) return name;
    }
    
    // If not found in the locale-specific map, try the EN-US map
    if (locale !== 'en') {
        const enMap = allItemsMapByLocale.get('en');
        if (enMap) {
            name = enMap.get(id);
            if (name) return name;
            
            if (id.includes('@')) {
                const baseId = id.split('@')[0];
                name = enMap.get(baseId);
                if (name) return name;
            }
        }
    }
    
    return null;
}

async function buildMultilingualIndex(): Promise<Map<string, { id: string; allNames: Map<string, string> }>> {
  if (cachedMultilingualIndex) return cachedMultilingualIndex;

  const rawItems = await getRawItems();
  const index = new Map<string, { id: string; allNames: Map<string, string> }>();

  rawItems.forEach(item => {
    if (!item.UniqueName) return;
    
    const id = item.UniqueName;
    
    // Must be tiered item (T1-T8)
    if (!/^T\d+_/.test(id)) return;
    
    // Exclude Enchanted variants
    if (id.includes('@') || id.includes('_LEVEL')) return;

    // Exclude uncraftable items
    const exclusions = [
      '_ORE', '_WOOD', '_HIDE', '_FIBER', '_ROCK',
      '_ARTEFACT_',
      '_RUNE', '_SOUL', '_RELIC', '_SHARD',
      '_INSIGHT',
      '_TRASH',
      'NONTRADABLE',
      '_FULL',
    ];
    
    if (exclusions.some(ex => id.includes(ex))) return;

    // Special filtering for FISH
    if (id.includes('_FISH') && !id.includes('_MEAL') && !id.includes('_POTION')) return;

    // Collect all language names for this item
    const allNames = new Map<string, string>();
    const localizedNames = item.LocalizedNames || {};
    
    // Add all available language variants
    Object.entries(LOCALE_MAP).forEach(([appLocale, albionLocale]) => {
      const name = localizedNames[albionLocale] || localizedNames['EN-US'];
      if (name) {
        allNames.set(appLocale, name);
      }
    });

    // Only add if we have at least English name
    if (allNames.has('en')) {
      index.set(id, { id, allNames });
    }
  });

  cachedMultilingualIndex = index;
  console.log(`Built multilingual index with ${index.size} items across ${Object.keys(LOCALE_MAP).length} languages.`);
  return index;
}

export async function searchItemsMultilingual(query: string, locale: string = 'en'): Promise<SimpleItem[]> {
  if (!query || query.length < 2) return [];

  const multilingualIndex = await buildMultilingualIndex();
  const lowerQuery = query.toLowerCase();
  const results: SimpleItem[] = [];
  const seen = new Set<string>();

  // Search through all items and check all language variants
  multilingualIndex.forEach(({ id, allNames }) => {
    if (seen.has(id)) return;

    // Check if query matches ANY language variant
    let matchedInAnyLanguage = false;
    let exactMatch = false;

    for (const [_, name] of allNames) {
      const lowerName = name.toLowerCase();
      if (lowerName === lowerQuery) {
        exactMatch = true;
        matchedInAnyLanguage = true;
        break;
      }
      if (lowerName.includes(lowerQuery)) {
        matchedInAnyLanguage = true;
      }
    }

    // Also check item ID
    if (id.toLowerCase().includes(lowerQuery)) {
      matchedInAnyLanguage = true;
    }

    if (matchedInAnyLanguage) {
      // Get name in user's selected locale
      const name = allNames.get(locale) || allNames.get('en') || 'Unknown';
      results.push({
        id,
        name,
        twoHanded: id.includes('_2H_')
      });
      seen.add(id);
    }
  });

  // Sort results: exact matches first, then by name
  return results
    .sort((a, b) => {
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
    .slice(0, 50);
}

export async function searchItemsService(query: string, locale: string = 'en'): Promise<SimpleItem[]> {
  // Use multilingual search by default
  return await searchItemsMultilingual(query, locale);
}
