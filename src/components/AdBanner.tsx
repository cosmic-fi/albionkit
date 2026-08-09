'use client';

import { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  /** AdSense ad slot ID (data-ad-slot) */
  slot: string;
  /** Ad format: auto, rectangle, horizontal, vertical */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  /** Responsive width */
  responsive?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Lazy load when in viewport */
  lazy?: boolean;
}

const ADSENSE_PUB_ID = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID || 'ca-pub-2727426305626479';

export function AdBanner({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  lazy = true,
}: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(!lazy);

  useEffect(() => {
    if (!lazy) {
      initAd();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  useEffect(() => {
    if (inView) {
      initAd();
    }
  }, [inView]);

  function initAd() {
    if (typeof window === 'undefined') return;
    try {
      // @ts-ignore - AdSense global
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }

  return (
    <div
      ref={adRef}
      className={`ad-banner relative ${className}`}
      style={{ minHeight: lazy ? '1px' : 'auto' }}
    >
      {inView && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={ADSENSE_PUB_ID}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      )}
    </div>
  );
}