'use server';

import { POPULAR_ITEMS } from './constants';
import { searchItemsService, getItems } from '@/lib/item-service';
import { getMarketHistory as getHistoryService, getMarketPrices, getMarketVolume, MarketHistory as ServiceMarketHistory, MarketStat as ServiceMarketStat, MarketHistoryPoint as ServiceHistoryPoint } from '@/lib/market-service';
import { getLocale } from 'next-intl/server';

import { notifyUser } from '@/lib/notification-service';
import { adminDb } from '@/lib/firebase-admin';

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

export async function triggerWatchlistAlerts(userId: string, region: 'west' | 'east' | 'europe', watchlist: string[]) {
  if (!userId || !watchlist.length) return;

  try {
    // 0. CHECK SUPPORTER STATUS
    // Market alerts are a premium feature (Adept or Guild Master)
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const isSupporter = userData?.role === 'adept' || userData?.role === 'guild_master' || userData?.role === 'admin';
    
    // Check if alerts are enabled in preferences
    const alertsEnabled = userData?.preferences?.marketAlerts !== false;

    if (!isSupporter || !alertsEnabled) {
      return { success: false, reason: 'unauthorized_or_disabled' };
    }

    // 1. Get watchlist items (IDs only)
    const itemIds = Array.from(new Set(watchlist.map(w => w.split('-')[0])));
    
    // 2. Fetch current market data for these items
    const { flips } = await getMarketData(region, itemIds, []);
    
    // 3. Filter for profitable flips (> 5000 profit and > 10% margin for alert)
    const profitableWatchlistItems = flips.filter(f => 
      itemIds.includes(f.itemId) && f.profit > 5000 && f.margin > 10
    );

    if (profitableWatchlistItems.length > 0) {
      // 4. Trigger notification
      await notifyUser(userId, 'market_opportunity', {
        isWatchlist: true,
        items: profitableWatchlistItems.slice(0, 5) // Limit to top 5 for email
      });
      return { success: true, count: profitableWatchlistItems.length };
    }
    
    return { success: false, count: 0 };
  } catch (error) {
    console.error('Trigger Watchlist Alerts Error:', error);
    return { error: 'Failed to process alerts' };
  }
}

export async function searchAlbionItems(query: string) {
  const locale = await getLocale();
  return await searchItemsService(query, locale);
}
