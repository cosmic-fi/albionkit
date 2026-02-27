'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  lastSegmentLabel?: string;
}

export function Breadcrumbs({ lastSegmentLabel }: BreadcrumbsProps) {
  const pathname = usePathname();

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
    } else if (segment.length > 20 || (segment.includes('-') && segment.length > 15)) {
      label = 'Detail';
    } else {
      label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }

    return { label, href };
  });

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
      <Link
        href="/"
        className="hover:text-primary transition-colors flex items-center gap-1"
      >
        <Home className="h-3 w-3" />
        Home
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
  );
}
