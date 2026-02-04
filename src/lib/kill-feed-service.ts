import { searchPlayer as searchPlayerPvp, getPlayerStats as getPlayerStatsPvp } from '@/app/tools/pvp-intel/actions';

const REGION_URLS = {
  west: 'https://gameinfo.albiononline.com',
  east: 'https://gameinfo-sgp.albiononline.com',
  europe: 'https://gameinfo-ams.albiononline.com'
};

export interface Event {
  EventId: number;
  TimeStamp: string;
  Killer: {
    Name: string;
    Id: string;
    GuildName: string;
    GuildId: string;
    AllianceName: string;
    AllianceId: string;
    AverageItemPower: number;
    Equipment: any;
    Inventory: any[];
  };
  Victim: {
    Name: string;
    Id: string;
    GuildName: string;
    GuildId: string;
    AllianceName: string;
    AllianceId: string;
    AverageItemPower: number;
    Equipment: any;
    Inventory: any[];
  };
  TotalVictimKillFame: number;
  Location: string;
  Participants: any[];
  GroupMembers: any[];
  GvGMatch: any;
  BattleId: number;
  KillArea: string;
  Type: string;
}

export async function getRecentEvents(
  region: 'west' | 'east' | 'europe' = 'west',
  limit: number = 20,
  offset: number = 0
): Promise<{ events: Event[], error?: string }> {
  try {
    const baseUrl = REGION_URLS[region];
    const response = await fetch(
      `${baseUrl}/api/gameinfo/events?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        next: { revalidate: 15 } // Short cache for live feed
      }
    );

    if (!response.ok) {
      console.error(`Albion API Error: ${response.status} ${response.statusText} for URL: ${response.url}`);
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
    }

    const events = await response.json();
    return { events, error: undefined };
  } catch (error) {
    console.error('Events fetch error:', error);
    return { events: [], error: 'Failed to fetch events' };
  }
}

export async function getEventDetails(
  eventId: number,
  region: 'west' | 'east' | 'europe' = 'west'
): Promise<{ event: Event | null, error?: string }> {
  try {
    const baseUrl = REGION_URLS[region];
    const response = await fetch(
      `${baseUrl}/api/gameinfo/events/${eventId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        next: { revalidate: 600 } // Cache details longer
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch event details');
    }

    const event = await response.json();
    return { event, error: undefined };
  } catch (error) {
    console.error('Event details error:', error);
    return { event: null, error: 'Failed to fetch event details' };
  }
}

// Re-export or wrap player search/stats for consistency in this module
export const searchPlayer = searchPlayerPvp;
export const getPlayerStats = getPlayerStatsPvp;

interface ItemPrice {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

export async function getItemPrices(
  itemIds: string[],
  region: 'west' | 'east' | 'europe' = 'west'
): Promise<Record<string, number>> {
  if (itemIds.length === 0) return {};

  const uniqueIds = Array.from(new Set(itemIds)).join(',');
  const subdomain = region === 'west' ? 'west' : region === 'east' ? 'east' : 'europe';
  const url = `https://${subdomain}.albion-online-data.com/api/v2/stats/prices/${uniqueIds}.json`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1h
    if (!response.ok) return {};
    
    const data: ItemPrice[] = await response.json();
    
    // Calculate min sell price per item across all cities
    const priceMap: Record<string, number> = {};
    
    data.forEach(p => {
      if (p.sell_price_min > 0) {
        // If we haven't seen this item or found a cheaper price, update it
        if (!priceMap[p.item_id] || p.sell_price_min < priceMap[p.item_id]) {
           priceMap[p.item_id] = p.sell_price_min;
        }
      }
    });
    
    return priceMap;
  } catch (error) {
    console.error('Error fetching prices:', error);
    return {};
  }
}

import { getItemNameService } from './item-service';

export async function getEventMetadata(
  event: Event,
  region: 'west' | 'east' | 'europe' = 'west'
) {
  const itemIds = new Set<string>();
  
  // Helper to collect IDs
  const collect = (equip: any) => {
    if (!equip) return;
    Object.values(equip).forEach((item: any) => {
      if (item?.Type) itemIds.add(item.Type);
    });
  };

  collect(event.Killer.Equipment);
  collect(event.Victim.Equipment);
  
  if (event.Victim.Inventory) {
      event.Victim.Inventory.forEach((item: any) => {
          if (item?.Type) itemIds.add(item.Type);
      });
  }

  if (event.Killer.Inventory) {
      event.Killer.Inventory.forEach((item: any) => {
          if (item?.Type) itemIds.add(item.Type);
      });
  }
  
  const ids = Array.from(itemIds);
  
  // Parallel fetch
  const [prices, nameEntries] = await Promise.all([
    getItemPrices(ids, region),
    Promise.all(ids.map(async id => ({ id, name: await getItemNameService(id) })))
  ]);
  
  const names = nameEntries.reduce((acc, curr) => {
      if (curr.name) {
        acc[curr.id] = curr.name;
      }
      return acc;
  }, {} as Record<string, string>);
  
  return { prices, names };
}
