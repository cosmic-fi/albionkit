'use server';

import { POPULAR_ITEMS } from './constants';
import { searchItemsService, getItems } from '@/lib/item-service';
import { getMarketHistory as getHistoryService, getMarketPrices, getMarketVolume, MarketHistory as ServiceMarketHistory, MarketStat as ServiceMarketStat, MarketHistoryPoint as ServiceHistoryPoint } from '@/lib/market-service';

export type MarketStat = ServiceMarketStat;
export type MarketHistoryPoint = ServiceHistoryPoint;
export type MarketHistory = ServiceMarketHistory;

export async function getMarketHistory(itemId: string, region: 'west' | 'east' | 'europe' = 'west') {
  return getHistoryService(itemId, region);
}

export async function getMarketData(
  region: 'west' | 'east' | 'europe' = 'west', 
  additionalItems: string[] = [],
  categoryItems: string[] = []
) {
  try {
    let baseItems = categoryItems.length > 0 ? categoryItems : POPULAR_ITEMS;
    const allItems = Array.from(new Set([...baseItems, ...additionalItems]));
    
    // Fetch Prices and Volume in parallel, and get Item Names
    // We add a timeout for items to prevent blocking the whole request if the large JSON fetch is slow
    const itemsPromise = getItems().catch(() => []);
    const timeoutPromise = new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 2500));

    const [data, historyData, itemsList] = await Promise.all([
      getMarketPrices(allItems, region),
      getMarketVolume(allItems, region),
      Promise.race([itemsPromise, timeoutPromise])
    ]);

    // Build Name Map
    const nameMap = new Map<string, string>();
    if (Array.isArray(itemsList)) {
      itemsList.forEach((item: any) => {
        if (item && item.id && item.name) {
          nameMap.set(item.id, item.name);
        }
      });
    }

    // Process volume data into a map: ItemId -> Avg Daily Volume (last 3 days)
    const volumeMap = new Map<string, number>();
    historyData.forEach(hist => {
      if (hist.location === 'Black Market' && hist.data && hist.data.length > 0) {
        // Take up to last 3 data points
        const recentPoints = hist.data.slice(-3);
        const avgVolume = recentPoints.reduce((sum, p) => sum + p.item_count, 0) / recentPoints.length;
        volumeMap.set(hist.item_id, Math.round(avgVolume));
      }
    });

    return processMarketData(data, additionalItems, volumeMap, nameMap);
  } catch (error) {
    console.error('Market Data Error:', error);
    return { flips: [], error: 'Failed to fetch market data' };
  }
}

function processMarketData(
  data: MarketStat[], 
  customItems: string[] = [], 
  volumeMap: Map<string, number> = new Map(),
  nameMap: Map<string, string> = new Map()
) {
  const flips: any[] = [];
  const groupedByItem = new Map<string, MarketStat[]>();
  const customItemSet = new Set(customItems);

  // Group data by item_id
  data.forEach(stat => {
    if (!groupedByItem.has(stat.item_id)) {
      groupedByItem.set(stat.item_id, []);
    }
    groupedByItem.get(stat.item_id)?.push(stat);
  });

  // Calculate flips
  groupedByItem.forEach((stats, itemId) => {
    // Find Black Market Buy Price (Highest Buy Order)
    const blackMarket = stats.find(s => s.city === 'Black Market');
    
    // Check if custom item has NO Black Market data
    if (customItemSet.has(itemId) && (!blackMarket || blackMarket.buy_price_max <= 0)) {
        // We will handle missing custom items after the loop
        return; 
    }

    if (!blackMarket || blackMarket.buy_price_max <= 0) return;

    const bmPrice = blackMarket.buy_price_max;

    // Compare with Royal Cities Sell Price (Lowest Sell Order)
    stats.forEach(cityStat => {
      if (cityStat.city === 'Black Market' || cityStat.sell_price_min <= 0) return;

      const cost = cityStat.sell_price_min;
      const profit = bmPrice - cost;
      const profitMargin = (profit / cost) * 100;

      // Filter out bad deals (e.g. profit < 1000 or margin < 10%)
      // BUT always include custom items regardless of profit
      if (customItemSet.has(itemId) || (profit > 1000 && profitMargin > 10)) {
        flips.push({
          itemId: itemId,
          buyCity: cityStat.city,
          buyPrice: cost,
          sellCity: 'Black Market',
          sellPrice: bmPrice,
          profit: profit,
          margin: Math.round(profitMargin),
          dailyVolume: volumeMap.get(itemId) || 0, // Add volume
          updatedAt: cityStat.sell_price_min_date,
          name: nameMap.get(itemId.split('@')[0]) || itemId // Add name
        });
      }
    });
  });

  // Ensure all custom items are represented, even if no data found
  const flippedItemIds = new Set(flips.map(f => f.itemId));
  
  customItems.forEach(itemId => {
      if (!flippedItemIds.has(itemId)) {
          flips.push({
              itemId: itemId,
              buyCity: 'N/A',
              buyPrice: 0,
              sellCity: 'Black Market',
              sellPrice: 0,
              profit: 0,
              margin: 0,
              dailyVolume: volumeMap.get(itemId) || 0,
              updatedAt: new Date().toISOString(),
              name: nameMap.get(itemId.split('@')[0]) || itemId, // Add name
              noData: true
          });
      }
  });

  // Sort by profit descending
  return { flips: flips.sort((a, b) => b.profit - a.profit), error: undefined };
}

export async function searchAlbionItems(query: string) {
  return await searchItemsService(query);
}
