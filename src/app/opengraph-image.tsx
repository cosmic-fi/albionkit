import { ImageResponse } from 'next/og';

export const alt = 'AlbionKit - The Ultimate Albion Online Companion';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #09090b, #18181b)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative Background */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          opacity: 0.1, 
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', 
          backgroundSize: '32px 32px' 
        }} />
        
        {/* Brand */}
        <div style={{
          fontSize: 64,
          fontWeight: 800,
          color: '#f59e0b', // amber-500
          letterSpacing: '-0.02em',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <img 
            src="https://albionkit.com/logo-light.svg" 
            alt="AlbionKit Logo" 
            width={320}
            height={80}
            style={{ width: 320, height: 80, objectFit: 'contain' }} 
          />
        </div>

        {/* Tagline */}
        <div style={{ 
          fontSize: 32, 
          color: '#e4e4e7',
          maxWidth: '80%',
          textAlign: 'center',
          lineHeight: 1.4,
          fontWeight: 500,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          Dominate the Open World
          <small style={{ marginTop: 8 }}>Advanced tools for Albion Online. Analyze market trends, track PvP statistics, and discover meta builds to improve your gameplay.</small>
        </div>

        <div style={{
            marginTop: 48,
            display: 'flex',
            gap: 24,
        }}>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 24, color: '#f59e0b', fontWeight: 'bold' }}>Builds</div>
                <div style={{ fontSize: 16, color: '#a1a1aa' }}>Database</div>
             </div>
             <div style={{ width: 1, height: 60, background: '#27272a' }}></div>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 24, color: '#f59e0b', fontWeight: 'bold' }}>Market</div>
                <div style={{ fontSize: 16, color: '#a1a1aa' }}>Flipper</div>
             </div>
             <div style={{ width: 1, height: 60, background: '#27272a' }}></div>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 24, color: '#f59e0b', fontWeight: 'bold' }}>PvP</div>
                <div style={{ fontSize: 16, color: '#a1a1aa' }}>Intel</div>
             </div>
             <div style={{ width: 1, height: 60, background: '#27272a' }}></div>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 24, color: '#f59e0b', fontWeight: 'bold' }}>And</div>
                <div style={{ fontSize: 16, color: '#a1a1aa' }}>More</div>
             </div>
        </div>

        {/* Footer */}
        <div style={{ 
          position: 'absolute', 
          bottom: 60, 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          fontSize: 20, 
          color: '#52525b',
          letterSpacing: '0.05em'
        }}>
          albionkit.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
