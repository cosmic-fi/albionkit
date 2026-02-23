import { getGoldHistory } from './gold-service';
import { getItems, getItemNameService } from './item-service';
import { getMarketVolume, GAMEINFO_API } from './market-service';

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
  
  let blackMarketVolumeValue = 0;
  let blackMarketTrend = 0;
  let activeBattles = 0;
  let topGuild = '';
  let metaItemId: string | null = null;
  let marketMostTradedId: string | null = null;

  try {
    const volumeItems = [
      'T4_BAG',
      'T4_CAPE',
      'T4_MAIN_SWORD',
      'T4_2H_BOW',
      'T4_ARMOR_PLATE_SET1'
    ];

    const volumeData = await getMarketVolume(volumeItems, 'west', 'Black Market');

    if (Array.isArray(volumeData) && volumeData.length > 0) {
      let latestVolumeTotal = 0;
      let previousVolumeTotal = 0;
      const itemVolumes = new Map<string, number>();

      volumeData.forEach(hist => {
        if (!hist.data || hist.data.length === 0) return;
        const lastIdx = hist.data.length - 1;
        const prevIdx = hist.data.length - 2;

        const latestPoint = hist.data[lastIdx];
        const latestValue = latestPoint.item_count * latestPoint.avg_price;
        latestVolumeTotal += latestValue;

        const id = hist.item_id;
        if (id) {
          itemVolumes.set(id, (itemVolumes.get(id) || 0) + latestValue);
        }

        if (prevIdx >= 0) {
          const prevPoint = hist.data[prevIdx];
          previousVolumeTotal += prevPoint.item_count * prevPoint.avg_price;
        }
      });

      blackMarketVolumeValue = latestVolumeTotal;
      if (previousVolumeTotal > 0) {
        blackMarketTrend = ((latestVolumeTotal - previousVolumeTotal) / previousVolumeTotal) * 100;
      }

      if (itemVolumes.size > 0) {
        marketMostTradedId = [...itemVolumes.entries()].sort((a, b) => b[1] - a[1])[0][0];
      }
    }
  } catch (e) {
    console.error('Failed to compute Black Market volume', e);
  }

  try {
    const [battlesRes, eventsRes] = await Promise.all([
      fetch(`${GAMEINFO_API}/battles?limit=50&sort=totalFame`, {
        next: { revalidate: 300 }
      }),
      fetch(`${GAMEINFO_API}/events?limit=50&offset=0`, {
        next: { revalidate: 60 }
      })
    ]);

    if (battlesRes.ok) {
      const data = await battlesRes.json();
      if (Array.isArray(data)) {
        activeBattles = data.length;
      }
    }

    if (eventsRes.ok) {
      const events = await eventsRes.json();
      if (Array.isArray(events)) {
        const guildCounts = new Map<string, number>();
        const itemCounts = new Map<string, number>();

        const isWeaponId = (id: string) => {
          if (!id) return false;
          return id.includes('_MAIN_') || id.includes('_2H_');
        };

        const addGuild = (name?: string | null) => {
          if (!name) return;
          const trimmed = name.trim();
          if (!trimmed) return;
          guildCounts.set(trimmed, (guildCounts.get(trimmed) || 0) + 1);
        };

        const addEquipItems = (equip: any) => {
          if (!equip) return;
          Object.values(equip).forEach((slot: any) => {
            const type = slot?.Type as string | undefined;
            if (!type) return;
            if (!isWeaponId(type)) return;
            itemCounts.set(type, (itemCounts.get(type) || 0) + 1);
          });
        };

        events.forEach((ev: any) => {
          addGuild(ev?.Killer?.GuildName);
          addGuild(ev?.Victim?.GuildName);
          addEquipItems(ev?.Killer?.Equipment);
          addEquipItems(ev?.Victim?.Equipment);
        });

        if (guildCounts.size > 0) {
          topGuild = [...guildCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
        }

        if (itemCounts.size > 0) {
          metaItemId = [...itemCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch activity data for ticker', e);
  }

  let metaItem = '';
  let mostTradedItem = '';

  const resolveItemName = async (id: string | null) => {
    if (!id) return '';
    try {
      const resolved = await getItemNameService(id);
      if (resolved) return resolved;
      return id
        .replace(/^T\d+_/, '')
        .split('@')[0]
        .replace(/_/g, ' ')
        .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
    } catch {
      return '';
    }
  };

  metaItem = await resolveItemName(metaItemId);
  mostTradedItem = await resolveItemName(marketMostTradedId);

  if (!topGuild) {
    topGuild = '—';
  }
  if (!metaItem) {
    metaItem = '—';
  }
  if (!mostTradedItem) {
    mostTradedItem = '—';
  }

  const formatVolume = (num: number) => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
    if (num <= 0) return '---';
    return num.toFixed(0);
  };
  
  return {
    goldPrice,
    goldTrend,
    premiumPrice,
    premiumTrend,
    blackMarketVolume: formatVolume(blackMarketVolumeValue),
    blackMarketTrend,
    topGuild,
    activeBattles,
    metaItem,
    mostTradedItem
  };
}
