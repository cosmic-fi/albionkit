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
  try {
    const baseUrl = REGION_URLS[region];
    // Parallel fetch for stats, recent kills, and recent deaths
    const [statsRes, killsRes, deathsRes] = await Promise.all([
      fetch(
        `${baseUrl}/api/gameinfo/players/${playerId}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      ),
      fetch(
        `${baseUrl}/api/gameinfo/players/${playerId}/kills?limit=50`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      ),
      fetch(
        `${baseUrl}/api/gameinfo/players/${playerId}/deaths?limit=50`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      )
    ]);

    if (!statsRes.ok) throw new Error('Failed to fetch player stats');
    
    const stats = await statsRes.json();
    const kills = killsRes.ok ? await killsRes.json() : [];
    const deaths = deathsRes.ok ? await deathsRes.json() : [];

    return { stats, kills, deaths, error: undefined };
  } catch (error) {
    console.error('Stats error:', error);
    return { error: 'Failed to fetch player stats', stats: null, kills: [], deaths: [] };
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
