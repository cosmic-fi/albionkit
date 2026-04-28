export const LOCATIONS = [
  'Black Market',
  'Caerleon',
  'Bridgewatch',
  'Fort Sterling',
  'Lymhurst',
  'Martlock',
  'Thetford',
  'Brecilien'
];

export const REGION_URLS = {
  west: 'https://west.albion-online-data.com',
  east: 'https://east.albion-online-data.com',
  europe: 'https://europe.albion-online-data.com'
};

export const OPEN_ALBION_API = 'https://api.openalbion.com/api/v3';
export const GAMEINFO_API = 'https://gameinfo.albiononline.com/api/gameinfo';

export interface OpenAlbionConsumable {
  id: number;
  name: string;
  tier: string;
  item_power: number;
  identifier: string;
  icon: string;
  category?: {
    id: number;
    name: string;
  };
  info?: string; // Description containing yield info
}

export interface OpenAlbionCraftingResponse {
  data: any[];
}

export interface OpenAlbionStatsResponse {
  data: any[];
}

export interface GameInfoCraftingResource {
  uniqueName: string;
  count: number;
  maxReturnRate: number;
}

export interface GameInfoCraftingRequirements {
  amount: number;
  craftingFocus: number;
  craftingResources: GameInfoCraftingResource[];
}

export interface GameInfoItem {
  uniqueName: string;
  localizedNames: {
    'EN-US': string;
    [key: string]: string;
  };
  craftingRequirements: GameInfoCraftingRequirements;
}

export interface MarketHistoryPoint {
  item_count: number;
  avg_price: number;
  timestamp: string;
}

export interface MarketHistory {
  location: string;
  item_id: string;
  quality: number;
  data: MarketHistoryPoint[];
}

export interface MarketStat {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

export async function getMarketHistory(itemId: string, region: 'west' | 'east' | 'europe' = 'west') {
  try {
    const baseUrl = REGION_URLS[region];
    const locationsParam = LOCATIONS.map(l => encodeURIComponent(l)).join(',');
    const url = `${baseUrl}/api/v2/stats/history/${itemId}.json?locations=${locationsParam}&qualities=1&time-scale=6`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'User-Agent': 'AlbionTools/1.0 (Development)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.status}`);
    }

    const data: MarketHistory[] = await response.json();
    return data;
  } catch (error) {
    console.error('History API Error:', error);
    return [];
  }
}

export async function getMarketPrices(
  items: string[],
  region: 'west' | 'east' | 'europe' = 'west',
  locations: string[] = LOCATIONS,
  quality: number = 1
) {
  try {
    if (items.length === 0) return [];

    const locationsParam = locations.map(l => encodeURIComponent(l)).join(',');
    const baseUrl = REGION_URLS[region];

    // Batch requests
    const BATCH_SIZE = 50;
    const batches = [];

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE));
    }

    const pricePromises = batches.map(async (batch) => {
      const itemsParam = batch.join(',');
      const url = `${baseUrl}/api/v2/stats/prices/${itemsParam}.json?locations=${locationsParam}&qualities=${quality}`;

      const response = await fetch(url, {
        next: { revalidate: 120 }, // Cache for 2 minutes instead of 1
        headers: { 'User-Agent': 'AlbionTools/1.0 (Development)' }
      });

      if (!response.ok) return [];
      return await response.json() as MarketStat[];
    });

    const results = await Promise.all(pricePromises);
    return results.flat();
  } catch (error) {
    console.error('Prices API Error:', error);
    return [];
  }
}

export async function getConsumablesList() {
  try {
    const response = await fetch(`${OPEN_ALBION_API}/consumables`);
    if (!response.ok) throw new Error('Failed to fetch consumables');
    const data = await response.json();
    return data.data as OpenAlbionConsumable[];
  } catch (error) {
    console.error('Consumables List Error:', error);
    return [];
  }
}

export async function getConsumableDetails(id: number) {
  try {
    const [craftingRes, statsRes] = await Promise.all([
      fetch(`${OPEN_ALBION_API}/consumable-craftings/consumable/${id}`),
      fetch(`${OPEN_ALBION_API}/consumable-stats/consumable/${id}`)
    ]);

    const craftingData = craftingRes.ok ? (await craftingRes.json() as OpenAlbionCraftingResponse) : null;
    const statsData = statsRes.ok ? (await statsRes.json() as OpenAlbionStatsResponse) : null;

    return { crafting: craftingData?.data || [], stats: statsData?.data || [] };
  } catch (error) {
    console.error('Consumable Details Error:', error);
    return null;
  }
}

export async function getMarketVolume(
  items: string[],
  region: 'west' | 'east' | 'europe' = 'west',
  location: string = 'Black Market'
) {
  try {
    if (items.length === 0) return [];

    const baseUrl = REGION_URLS[region];
    const BATCH_SIZE = 50;
    const batches = [];

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE));
    }

    const volumePromises = batches.map(async (batch) => {
      const itemsParam = batch.join(',');
      // time-scale=24 gives daily resolution.
      const url = `${baseUrl}/api/v2/stats/history/${itemsParam}.json?locations=${encodeURIComponent(location)}&qualities=1&time-scale=24`;

      const response = await fetch(url, {
        next: { revalidate: 600 }, // Cache for 10 minutes instead of 5
        headers: { 'User-Agent': 'AlbionTools/1.0 (Development)' }
      });

      if (!response.ok) return [];
      return await response.json() as MarketHistory[];
    });

    const results = await Promise.all(volumePromises);
    return results.flat();
  } catch (error) {
    console.error('Market Volume API Error:', error);
    return [];
  }
}

export async function getGameInfoItemData(itemId: string) {
  try {
    // Use local proxy to avoid CORS issues
    const response = await fetch(`/api/proxy/gameinfo/items/${itemId}/data`);
    
    if (!response.ok) throw new Error('Failed to fetch item data');
    return await response.json() as GameInfoItem;
  } catch (error) {
    console.error('GameInfo API Error:', error);
    return null;
  }
}
