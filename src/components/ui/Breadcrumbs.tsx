'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  lastSegmentLabel?: string;
}

export function Breadcrumbs({ lastSegmentLabel }: BreadcrumbsProps) {
  const pathname = usePathname();
  const t = useTranslations('NotFound.breadcrumbs');

  // Convert path to breadcrumbs
  const pathSegments = pathname.split('/').filter(segment => segment !== '');

  const breadcrumbs: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    let href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const isLast = index === pathSegments.length - 1;

    // Redirect map for segments that don't have index pages
    const REDIRECT_MAP: Record<string, string> = {
      '/community/edit': '/community',
      '/community/thread': '/community',
    };

    if (REDIRECT_MAP[href]) {
      href = REDIRECT_MAP[href];
    }

    // Format label (capitalize and replace hyphens)
    // If segment looks like a UUID or long random string, label it as "Detail"
    let label = segment;

    if (isLast && lastSegmentLabel) {
      label = lastSegmentLabel;
    } else if (
      // Long segments are always "Detail"
      segment.length > 20 ||
      // Segments with dashes (like build-slugs) longer than 15 chars
      (segment.includes('-') && segment.length > 15) ||
      // Pure alphanumeric 16+ chars (UUIDs, build IDs)
      /^[A-Za-z0-9]{16,}$/.test(segment)
    ) {
      // UUIDs and random strings should not be translated
      label = 'Detail';
    } else {
      // Try to get translated label first, fallback to formatted segment
      const translatedLabel = t(segment as any);
      if (translatedLabel && translatedLabel !== segment) {
        label = translatedLabel;
      } else {
        label = segment
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    return { label, href };
  });

  if (breadcrumbs.length === 0) return null;

  // Always use production URL for Schema.org (Google crawls production, not localhost)
  const baseUrl = 'https://albionkit.com';

  // Create Schema.org JSON-LD for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('home'),
        item: baseUrl
      },
      ...breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem' as const,
        position: index + 2,
        name: crumb.label,
        item: `${baseUrl}${crumb.href}`
      }))
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
        <Link
          href="/"
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <Home className="h-3 w-3" />
          {t('home')}
        </Link>

        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={`${index}-${crumb.href}`}>
            <ChevronRight className="h-3 w-3 opacity-40" />
            {index === breadcrumbs.length - 1 ? (
              <span className="text-primary/80 font-black">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-primary transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
}
