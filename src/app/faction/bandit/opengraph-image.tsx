import { ImageResponse } from 'next/og';
import { getNextWindow, getRemainingTime } from '@/lib/bandit-service';

export const runtime = 'edge';

export const alt = 'AlbionKit Bandit Assault Tracker';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  const now = new Date();
  
  // Calculate status for all regions
  const regions = [
    { id: 'west', name: 'AMERICAS (WEST)' },
    { id: 'east', name: 'ASIA (EAST)' },
    { id: 'europe', name: 'EUROPE' },
  ];

  const data = regions.map(reg => {
    const { targetDate } = getNextWindow(reg.id as any, now);
    const ms = getRemainingTime(targetDate, now);
    const minutes = Math.floor(ms / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    
    let timeText = '';
    if (h > 0) {
      timeText = `${h}h ${m}m`;
    } else {
      timeText = `${m}m`;
    }

    // Determine status color
    let statusColor = '#f59e0b'; // Amber (Waiting)
    if (minutes <= 15) statusColor = '#ef4444'; // Red (Imminent)
    if (minutes <= 0) timeText = 'STARTING...';

    return { ...reg, timeText, statusColor };
  });

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0d0e12',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0d0e12 100%)',
          padding: '40px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            backgroundColor: '#f59e0b', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '20px',
            fontSize: '32px'
          }}>
            ⏱️
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
            Bandit Assault Tracker
          </h1>
        </div>

        {/* Server Cards */}
        <div style={{ display: 'flex', gap: '30px', width: '100%', justifyContent: 'center' }}>
          {data.map((server) => (
            <div
              key={server.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${server.statusColor}`,
                borderRadius: '24px',
                padding: '30px',
                width: '320px',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '18px', color: '#9ca3af', marginBottom: '10px', fontWeight: 'bold' }}>
                {server.name}
              </span>
              <span style={{ fontSize: '48px', color: server.statusColor, fontWeight: 'bold' }}>
                {server.timeText}
              </span>
              <div style={{ 
                marginTop: '15px', 
                padding: '6px 12px', 
                backgroundColor: server.statusColor + '20', 
                borderRadius: '8px',
                color: server.statusColor,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                NEXT START
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '50px', display: 'flex', alignItems: 'center', opacity: 0.6 }}>
          <span style={{ fontSize: '20px', color: '#ffffff', fontWeight: 'bold' }}>
            albionkit.com
          </span>
          <div style={{ margin: '0 15px', width: '4px', height: '4px', backgroundColor: '#ffffff', borderRadius: '50%' }} />
          <span style={{ fontSize: '18px', color: '#9ca3af' }}>
            Real-time Faction Warfare Intel
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
