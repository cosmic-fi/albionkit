export interface GoldPricePoint {
  price: number;
  timestamp: string; // ISO format or timestamp
}

const REGION_URLS = {
  west: 'https://west.albion-online-data.com',
  east: 'https://east.albion-online-data.com',
  europe: 'https://europe.albion-online-data.com'
};

export async function getGoldHistory(region: 'west' | 'east' | 'europe' = 'west', count: number = 24): Promise<GoldPricePoint[]> {
  try {
    const baseUrl = REGION_URLS[region];
    // The endpoint is /api/v2/stats/gold?count=X
    const url = `${baseUrl}/api/v2/stats/gold?count=${count}`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'User-Agent': 'AlbionTools/1.0 (Development)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch gold history: ${response.status}`);
    }

    const data = await response.json();
    
    // Map response to our interface
    // API returns array of { price: number, timestamp: string }
    return data.map((item: any) => ({
      price: item.price,
      timestamp: item.timestamp
    }));
  } catch (error) {
    console.error('Gold History API Error:', error);
    return [];
  }
}
