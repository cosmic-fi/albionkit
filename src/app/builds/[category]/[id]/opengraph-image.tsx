import { ImageResponse } from 'next/og';
import { getBuild } from '@/lib/builds-service';

export const alt = 'Build Details';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ category: string; id: string }> }) {
  const { id } = await params;
  const build = await getBuild(id);

  if (!build) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: '#09090b',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          Build Not Found
        </div>
      ),
      { ...size }
    );
  }

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
          position: 'absolute', 
          top: 60, 
          left: 60, 
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#f59e0b', // amber-500
            letterSpacing: '-0.02em',
          }}>
            AlbionKit
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          maxWidth: '85%', 
          textAlign: 'center', 
          zIndex: 10 
        }}>
          <div style={{ 
            fontSize: 24, 
            color: '#a1a1aa', 
            marginBottom: 24, 
            textTransform: 'uppercase', 
            letterSpacing: '0.15em',
            fontWeight: 600
          }}>
            {build.category} Build
          </div>
          
          <div style={{ 
            fontSize: 72, 
            fontWeight: 900, 
            marginBottom: 32, 
            lineHeight: 1.1,
            background: 'linear-gradient(to bottom, #ffffff, #a1a1aa)',
            backgroundClip: 'text',
            color: 'transparent',
            padding: '0 20px',
          }}>
            {build.title}
          </div>
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 32, 
            color: '#e4e4e7' 
          }}>
            <span style={{ color: '#71717a' }}>by</span>
            <span style={{ fontWeight: 600 }}>{build.authorName}</span>
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
          albionkit.com/builds
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
