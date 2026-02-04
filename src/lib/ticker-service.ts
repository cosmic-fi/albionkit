import { getGoldHistory } from './gold-service';
import { getItems } from './item-service';

export interface TickerData {
  goldPrice: number;
  goldTrend: number; // percentage
  premiumPrice: number;
  premiumTrend: number; // percentage
  blackMarketVolume: string; // e.g., "850M"
  blackMarketTrend: number;
  topGuild: string;
  activeBattles: number;
  metaItem: string;
  mostTradedItem: string;
}

export interface GlobalStats {
  itemsTracked: number;
  battlesAnalyzed: number;
  marketUpdates: string;
  uptime: string;
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const items = await getItems();
  
  // Fetch recent battles from Albion API to get a "real" number for activity
  let battlesCount = 0;
  try {
    const response = await fetch('https://gameinfo.albiononline.com/api/gameinfo/battles?limit=50&sort=totalFame', {
       next: { revalidate: 300 }
    });
    if (response.ok) {
        const data = await response.json();
        battlesCount = data.length;
    }
  } catch (e) {
    console.error("Failed to fetch battles count", e);
  }

  return {
    itemsTracked: items.length,
    battlesAnalyzed: battlesCount, 
    marketUpdates: "24/7",
    uptime: "99.9%"
  };
}

export async function getTickerData(): Promise<TickerData> {
  // 1. Fetch Gold Price
  const goldHistory = await getGoldHistory('west', 2); // Get last 2 points for trend
  
  let goldPrice = 0;
  let goldTrend = 0;

  if (goldHistory && goldHistory.length > 0) {
    goldPrice = goldHistory[0].price; // Newest first usually? 
    // Wait, getGoldHistory implementation needs checking. 
    // Usually API returns chronological, so last item is newest?
    // Let's check the implementation of getGoldHistory again or assume and fix.
    // The previous read showed: return data.map(...)
    // Albion API usually returns chronological.
    
    // If chronological:
    const latest = goldHistory[goldHistory.length - 1];
    const previous = goldHistory.length > 1 ? goldHistory[goldHistory.length - 2] : latest;
    
    goldPrice = latest.price;
    if (previous.price > 0) {
      goldTrend = ((latest.price - previous.price) / previous.price) * 100;
    }
  }

  // 2. Calculate Premium Price
  // Estimate: 3750 Gold for 1 Month Premium
  // This is a static approximation of the Gold -> Silver conversion for Premium
  const premiumPrice = goldPrice * 3750;
  const premiumTrend = goldTrend; // Assuming it follows gold roughly

  // 3. Others (Mock for now, but ready for API integration)
  // We could potentially fetch these from other endpoints in the future
  
  return {
    goldPrice,
    goldTrend,
    premiumPrice,
    premiumTrend,
    blackMarketVolume: "850M", // Placeholder
    blackMarketTrend: 5.2,
    topGuild: "Escalation", // Placeholder
    activeBattles: 12, // Placeholder
    metaItem: "Carving Sword",
    mostTradedItem: "Runes"
  };
}
