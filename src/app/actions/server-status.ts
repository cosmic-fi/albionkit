'use server';

export interface ServerStatus {
  region: string;
  status: 'online' | 'offline' | 'maintenance' | string;
  message?: string;
}

export async function getAlbionServerStatus(): Promise<ServerStatus[]> {
  // status.txt endpoints are deprecated and return 404.
  // We use the official gameinfo API events endpoint as a proxy for server status.
  // If the API returns 200 OK, the server is online.
  // If the API returns 503/504, it's likely maintenance or down.
  
  const endpoints = [
    { 
      region: 'Americas', 
      url: 'https://gameinfo.albiononline.com/api/gameinfo/events?limit=1'
    },
    { 
      region: 'Asia', 
      url: 'https://gameinfo-sgp.albiononline.com/api/gameinfo/events?limit=1'
    },
    { 
      region: 'Europe', 
      url: 'https://gameinfo-ams.albiononline.com/api/gameinfo/events?limit=1'
    },
  ];

  const statuses = await Promise.all(
    endpoints.map(async (server) => {
      try {
        const response = await fetch(server.url, { 
          cache: 'no-store',
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (response.ok) {
            return { region: server.region, status: 'online' };
        }

        // 502/503/504 usually indicate the game server (or API gateway) is down/maintenance
        if (response.status === 503 || response.status === 504 || response.status === 502) {
            return { region: server.region, status: 'maintenance' };
        }

        return { region: server.region, status: 'offline' };
      } catch (e) {
        // Network error or timeout usually means offline or unreachable
        return { region: server.region, status: 'offline' };
      }
    })
  );

  return statuses;
}
