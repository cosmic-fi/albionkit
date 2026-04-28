import { getMarketPrices, MarketStat } from './market-service';
import { FACTION_REWARDS, FactionReward, FACTION_CITIES } from '@/data/faction-data';

export interface RewardEfficiency extends FactionReward {
  price: number;
  silverPerPoint: number;
  lastUpdated: string;
}

/**
 * Calculates the silver-per-point efficiency for faction rewards
 */
export async function getFactionEfficiency(
  region: 'west' | 'east' | 'europe' = 'west',
  factionFilter?: string,
  locale: string = 'en'
): Promise<RewardEfficiency[]> {
  const rewards = factionFilter 
    ? FACTION_REWARDS.filter(r => r.faction === factionFilter)
    : FACTION_REWARDS;

  const itemIds = rewards.map(r => r.id);
  const prices = await getMarketPrices(itemIds, region);
  
  // Import dynamically to avoid circular dependencies if any
  const { getItemNameService } = await import('./item-service');

  const efficiency: RewardEfficiency[] = await Promise.all(rewards.map(async (reward) => {
    // Find the best price for this item (usually minimum sell price across cities)
    const itemPrices = prices.filter(p => p.item_id === reward.id && p.sell_price_min > 0);
    
    // Get the lowest sell price available
    const bestPrice = itemPrices.length > 0 
      ? Math.min(...itemPrices.map(p => p.sell_price_min))
      : 0;
    
    const lastUpdated = itemPrices.length > 0
      ? itemPrices[0].sell_price_min_date
      : new Date().toISOString();

    // Localized name
    const localizedName = await getItemNameService(reward.id, locale) || reward.name;

    // SPP = (Price * (1 - Tax)) / Points
    // Using 6.5% tax as a safe default (4% premium tax + 2.5% setup fee)
    const taxFactor = 0.935;
    const silverPerPoint = reward.pointCost > 0 
      ? (bestPrice * taxFactor) / reward.pointCost 
      : 0;

    return {
      ...reward,
      name: localizedName,
      price: bestPrice,
      silverPerPoint,
      lastUpdated
    };
  }));

  // Sort by efficiency (descending)
  return efficiency.sort((a, b) => b.silverPerPoint - a.silverPerPoint);
}

/**
 * Calculates profit for transporting hearts between cities
 */
export async function getTransportProfitability(
  heartId: string,
  sourceCity: string,
  targetCity: string,
  quantity: number,
  region: 'west' | 'east' | 'europe' = 'west'
) {
  const prices = await getMarketPrices([heartId], region, [sourceCity, targetCity]);
  
  const sourcePrice = prices.find(p => p.city === sourceCity)?.sell_price_min || 0;
  const targetPrice = prices.find(p => p.city === targetCity)?.buy_price_max || 0;

  if (sourcePrice === 0 || targetPrice === 0) return null;

  const totalCost = sourcePrice * quantity;
  const totalRevenue = targetPrice * quantity;
  const grossProfit = totalRevenue - totalCost;
  
  // Basic fee calculation (market tax on sell side)
  const netProfit = (targetPrice * 0.96 * quantity) - totalCost;
  const roi = (netProfit / totalCost) * 100;

  return {
    sourcePrice,
    targetPrice,
    totalCost,
    totalRevenue,
    grossProfit,
    netProfit,
    roi
  };
}

/**
 * Fetches prices for all faction hearts across all royal cities and calculates the transport matrix
 */
export async function getHeartTransportMatrix(
  region: 'west' | 'east' | 'europe' = 'west',
  quantity: number = 1
) {
  const heartIds = FACTION_REWARDS
    .filter(r => r.category === 'heart')
    .map(r => r.id);

  // Fetch prices for all hearts in all royal cities
  const prices = await getMarketPrices(heartIds, region, FACTION_CITIES);

  const matrix: any[] = [];

  for (const sourceCity of FACTION_CITIES) {
    for (const targetCity of FACTION_CITIES) {
      if (sourceCity === targetCity) continue;

      // Find the best heart to transport between these two cities
      // (The one with the highest ROI)
      let bestHeartRoute = null;
      let maxRoi = -Infinity;

      for (const heartId of heartIds) {
        const sourcePrice = prices.find(p => p.item_id === heartId && p.city === sourceCity)?.sell_price_min || 0;
        const targetPrice = prices.find(p => p.item_id === heartId && p.city === targetCity)?.buy_price_max || 0;

        if (sourcePrice === 0 || targetPrice === 0) continue;

        const totalCost = sourcePrice * quantity;
        const netRevenue = (targetPrice * 0.935) * quantity; // 6.5% tax/fee
        const netProfit = netRevenue - totalCost;
        const roi = (netProfit / totalCost) * 100;

        if (roi > maxRoi) {
          maxRoi = roi;
          bestHeartRoute = {
            heartId,
            heartName: FACTION_REWARDS.find(r => r.id === heartId)?.name || heartId,
            sourcePrice,
            targetPrice,
            netProfit,
            roi
          };
        }
      }

      if (bestHeartRoute) {
        matrix.push({
          sourceCity,
          targetCity,
          ...bestHeartRoute
        });
      }
    }
  }

  return matrix;
}
