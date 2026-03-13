'use server';

const REGION_URLS = {
  west: 'https://gameinfo.albiononline.com',
  east: 'https://gameinfo-sgp.albiononline.com',
  europe: 'https://gameinfo-ams.albiononline.com'
};

export async function searchPlayer(query: string, region?: 'west' | 'east' | 'europe') {
  if (!query) return { results: [] };

  const regions = region ? [region] : (['west', 'east', 'europe'] as const);

  try {
    const promises = regions.map(async (r) => {
      try {
        const baseUrl = REGION_URLS[r];
        const response = await fetch(
          `${baseUrl}/api/gameinfo/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
          }
        );

        if (!response.ok) return [];
        const data = await response.json();
        return (data.players || []).map((p: any) => ({ ...p, region: r }));
      } catch (e) {
        console.error(`Search error for ${r}:`, e);
        return [];
      }
    });

    const resultsArray = await Promise.all(promises);
    const allResults = resultsArray.flat();
    
    return { results: allResults, error: undefined };
  } catch (error) {
    console.error('Search error:', error);
    return { error: 'Failed to search players', results: [] };
  }
}

export async function getPlayerStats(playerId: string, region: 'west' | 'east' | 'europe' = 'west') {
  // Small helper to retry on transient failures (network/5xx)
  const fetchWithRetry = async (url: string, init?: RequestInit, retries = 2, delayMs = 300) => {
    let lastErr: any = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, init);
        // If 5xx, optionally retry; otherwise return
        if (!res.ok && res.status >= 500 && res.status < 600 && attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
        return res;
      } catch (e) {
        lastErr = e;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
        throw e;
      }
    }
    throw lastErr;
  };

  try {
    const baseUrl = REGION_URLS[region];

    // Fetch stats with retry first, since it's the gate for displaying anything
    const statsUrl = `${baseUrl}/api/gameinfo/players/${playerId}`;
    const statsRes = await fetchWithRetry(statsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });

    if (!statsRes.ok) {
      // If 404, allow caller to try other regions without logging a hard error
      if (statsRes.status === 404) {
        return { error: 'not_found', stats: null, kills: [], deaths: [] };
      }
      console.error(`Failed to fetch player stats: ${statsRes.status} ${statsRes.statusText} for URL: ${statsUrl}`);
      throw new Error('Failed to fetch player stats');
    }

    // Fetch kills/deaths in parallel (no retries, degrade to empty on failure)
    const [killsRes, deathsRes] = await Promise.all([
      fetch(
        `${baseUrl}/api/gameinfo/players/${playerId}/kills?limit=500`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      ).catch(() => null as any),
      fetch(
        `${baseUrl}/api/gameinfo/players/${playerId}/deaths?limit=500`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      ).catch(() => null as any)
    ]);

    const stats = await statsRes.json();
    const kills = killsRes && killsRes.ok ? await killsRes.json() : [];
    const deaths = deathsRes && deathsRes.ok ? await deathsRes.json() : [];

    return { stats, kills, deaths, error: undefined };
  } catch (error: any) {
    console.error('Stats error:', error?.message || error);
    return { error: 'Failed to fetch player stats', stats: null, kills: [], deaths: [] };
  }
}

export async function getPlayerEvents(playerId: string, region: 'west' | 'east' | 'europe' = 'west') {
  try {
    const baseUrl = REGION_URLS[region];
    // Fetch all events for this player (includes knockouts with TotalVictimKillFame === 0)
    const response = await fetch(
      `${baseUrl}/api/gameinfo/events?playerId=${playerId}&limit=100`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch player events: ${response.status}`);
      return { events: [], error: 'Failed to fetch player events' };
    }

    const events = await response.json();
    return { events, error: undefined };
  } catch (error) {
    console.error('Player events error:', error);
    return { events: [], error: 'Failed to fetch player events' };
  }
}

export async function getPlayerWeaponMastery(playerId: string, region: 'west' | 'east' | 'europe' = 'west') {
  try {
    const baseUrl = REGION_URLS[region];
    // Fetch all weapon mastery data for the player (includes both PvP and PvE usage)
    const response = await fetch(
      `${baseUrl}/api/gameinfo/players/${playerId}/mastery`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch player mastery: ${response.status}`);
      return { mastery: [], error: 'Failed to fetch player mastery' };
    }

    const mastery = await response.json();
    return { mastery, error: undefined };
  } catch (error) {
    console.error('Player mastery error:', error);
    return { mastery: [], error: 'Failed to fetch player mastery' };
  }
}

export async function getGuildEvents(guildId: string, region: 'west' | 'east' | 'europe' = 'west') {
  try {
    const baseUrl = REGION_URLS[region];
    // Fetch recent events where this guild was involved (either as killer or victim)
    // We use the general events endpoint with a guildId filter if possible, 
    // or we might need to rely on the guild top kills endpoint if that's more stable.
    // The standard /events endpoint allows filtering by guildId.
    
    const response = await fetch(
      `${baseUrl}/api/gameinfo/events?guildId=${guildId}&limit=50`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!response.ok) throw new Error('Failed to fetch guild events');

    const events = await response.json();
    return { events, error: undefined };
  } catch (error) {
    console.error('Guild events error:', error);
    return { error: 'Failed to fetch guild events', events: [] };
  }
}

export async function getGuildInfo(guildId: string, region: 'west' | 'east' | 'europe' = 'west') {
  try {
    const baseUrl = REGION_URLS[region];
    const response = await fetch(
      `${baseUrl}/api/gameinfo/guilds/${guildId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!response.ok) throw new Error('Failed to fetch guild info');

    const info = await response.json();
    return { info, error: undefined };
  } catch (error) {
    console.error('Guild info error:', error);
    return { error: 'Failed to fetch guild info', info: null };
  }
}

export async function getGuildMembers(guildId: string, region: 'west' | 'east' | 'europe' = 'west') {
  try {
    const baseUrl = REGION_URLS[region];
    const response = await fetch(
      `${baseUrl}/api/gameinfo/guilds/${guildId}/members`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!response.ok) throw new Error('Failed to fetch guild members');

    const members = await response.json();
    return { members, error: undefined };
  } catch (error) {
    console.error('Guild members error:', error);
    return { error: 'Failed to fetch guild members', members: [] };
  }
}

export async function getAllianceInfo(allianceId: string, region: 'west' | 'east' | 'europe' = 'west') {
  try {
    const baseUrl = REGION_URLS[region];
    const response = await fetch(
      `${baseUrl}/api/gameinfo/alliances/${allianceId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!response.ok) throw new Error('Failed to fetch alliance info');

    const info = await response.json();
    return { info, error: undefined };
  } catch (error) {
    console.error('Alliance info error:', error);
    return { error: 'Failed to fetch alliance info', info: null };
  }
}

export async function getPlayerEventsById(playerId: string, region: 'west' | 'east' | 'europe' = 'west', limit: number = 200) {
  try {
    const baseUrl = REGION_URLS[region];
    const url = `${baseUrl}/api/gameinfo/events?limit=${limit}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 20 } });

    if (!response.ok) {
      console.error(`Failed to fetch player-related events: ${response.status} ${response.statusText} for URL: ${url}`);
      throw new Error('Failed to fetch player events');
    }

    const events = await response.json();
    const filtered = (events || []).filter((e: any) => e?.Killer?.Id === playerId || e?.Victim?.Id === playerId);
    return { events: filtered, error: undefined };
  } catch (error) {
    console.error('Player events error:', error);
    return { events: [], error: 'Failed to fetch player events' };
  }
}

export async function getEventMetadataAction(event: any, region: 'west' | 'east' | 'europe' = 'west') {
  try {
    // This is a placeholder for the actual implementation in lib/kill-feed-service
    // Since we don't want to import from lib if it might cause issues in server actions,
    // we'll just return a simplified version or the event itself if it's already enough.
    return {
      victim: event.Victim,
      killer: event.Killer,
      totalVictimIp: event.Victim.AverageItemPower,
      totalKillerIp: event.Killer.AverageItemPower,
      participants: event.Participants || [],
      groupMemberCount: event.GroupMemberCount,
      isGank: (event.Participants || []).length > 3 && event.Victim.AverageItemPower > event.Killer.AverageItemPower + 200,
      isFairFight: Math.abs(event.Victim.AverageItemPower - event.Killer.AverageItemPower) < 200,
    };
  } catch (error) {
    console.error('Error getting event metadata:', error);
    return null;
  }
}

export async function resolveItemNameAction(itemId: string) {
  try {
    // In a real app, this would fetch from a database or a localized JSON
    // For now, we'll return a formatted version of the ID if we can't find it
    return itemId.replace(/^T\d_/, '').replace(/_LEVEL\d/, '').split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  } catch (error) {
    console.error('Error resolving item name:', error);
    return itemId;
  }
}
