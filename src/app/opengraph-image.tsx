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
           <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
            <path d="M12 2l-4 4 4 4 4-4-4-4z" />
            <path d="M12 10v12" />
            <path d="M8 14h8" />
            <path d="M4 18h16" />
           </svg>
           AlbionKit
        </div>

        {/* Tagline */}
        <div style={{ 
          fontSize: 32, 
          color: '#e4e4e7',
          maxWidth: '80%',
          textAlign: 'center',
          lineHeight: 1.4,
          fontWeight: 500,
        }}>
          Master the Open World
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
