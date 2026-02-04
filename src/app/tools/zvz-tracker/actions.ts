'use server';

const REGION_URLS = {
  west: 'https://gameinfo.albiononline.com',
  east: 'https://gameinfo-sgp.albiononline.com',
  europe: 'https://gameinfo-ams.albiononline.com'
};

export async function getBattles(
  region: 'west' | 'east' | 'europe' = 'west',
  limit: number = 20,
  offset: number = 0,
  sort: 'totalFame' | 'totalKills' = 'totalFame'
) {
  try {
    const baseUrl = REGION_URLS[region];
    const response = await fetch(
      `${baseUrl}/api/gameinfo/battles?limit=${limit}&offset=${offset}&sort=${sort}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        next: { revalidate: 60 } // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch battles');
    }

    const data = await response.json();
    return { battles: data, error: undefined };
  } catch (error) {
    console.error('Battles fetch error:', error);
    return { error: 'Failed to fetch battles', battles: [] };
  }
}

export async function getBattleDetails(
  battleId: string,
  region: 'west' | 'east' | 'europe' = 'west'
) {
  try {
    const baseUrl = REGION_URLS[region];
    const response = await fetch(
      `${baseUrl}/api/gameinfo/battles/${battleId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch battle details');
    }

    const data = await response.json();
    return { battle: data, error: undefined };
  } catch (error) {
    console.error('Battle details error:', error);
    return { error: 'Failed to fetch battle details', battle: null };
  }
}

export async function searchEntities(
  query: string,
  region: 'west' | 'east' | 'europe' = 'west'
) {
  try {
    const baseUrl = REGION_URLS[region];
    const response = await fetch(
      `${baseUrl}/api/gameinfo/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      }
    );

    if (!response.ok) throw new Error('Search failed');

    const data = await response.json();
    return { results: data, error: undefined };
  } catch (error) {
    console.error('Search error:', error);
    return { error: 'Failed to search', results: null };
  }
}

export async function getEntityDetails(
  type: 'guilds' | 'players' | 'alliances',
  id: string,
  region: 'west' | 'east' | 'europe' = 'west'
) {
  try {
    const baseUrl = REGION_URLS[region];
    const response = await fetch(
      `${baseUrl}/api/gameinfo/${type}/${id}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      }
    );

    if (!response.ok) throw new Error('Fetch details failed');

    const data = await response.json();
    return { data, error: undefined };
  } catch (error) {
    console.error('Entity details error:', error);
    return { error: 'Failed to fetch details', data: null };
  }
}

export async function getBattleEvents(
  battleId: string,
  offset: number = 0,
  limit: number = 50,
  region: 'west' | 'east' | 'europe' = 'west'
) {
  try {
    const baseUrl = REGION_URLS[region];
    // Try primary endpoint first
    try {
      const response = await fetch(
        `${baseUrl}/api/gameinfo/events/battle/${battleId}?offset=${offset}&limit=${limit}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
          next: { revalidate: 30 }
        }
      );

      if (response.ok) {
        const events = await response.json();
        if (Array.isArray(events) && events.length > 0) {
          return { events, error: undefined };
        }
      }
    } catch (e) {
      console.warn('Primary events endpoint failed, trying fallback...');
    }

    // Fallback to query parameter endpoint
    const response = await fetch(
      `${baseUrl}/api/gameinfo/events?battleId=${battleId}&offset=${offset}&limit=${limit}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        next: { revalidate: 30 }
      }
    );

    if (!response.ok) throw new Error('Failed to fetch battle events');

    const events = await response.json();
    return { events, error: undefined };
  } catch (error) {
    console.error('Battle events error:', error);
    return { error: 'Failed to fetch battle events', events: [] };
  }
}
