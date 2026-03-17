# 🎯 SEO Enhancement Plan - Get Rich Search Results

## Current Status vs Target

### What albiononlinegrind.com Has:
```
✅ Organization structured data
✅ WebSite with SearchAction
✅ Multiple content sections in SERP
✅ Sitelinks (automatic from Google)
✅ Rich snippets for tools/pages
✅ High domain authority
```

### What AlbionKit Has:
```
✅ Basic Organization schema
✅ WebSite schema (on homepage)
✅ Sitemap.xml
✅ Robots.txt
❌ Missing: Enhanced page-level schemas
❌ Missing: BreadcrumbList on all pages
❌ Missing: SoftwareApplication schema for tools
❌ Missing: FAQPage schema
❌ Missing: AggregateRating for builds
```

---

## 📋 Implementation Checklist

### **Phase 1: Enhanced Structured Data** (HIGH PRIORITY)

#### 1. Add SoftwareApplication Schema to Tools
**Files to update:**
- `src/app/tools/market-flipper/page.tsx`
- `src/app/tools/kill-feed/page.tsx`
- `src/app/tools/crafting-calc/page.tsx`
- All tool pages

**Schema to add:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Market Flipper - AlbionKit",
  "applicationCategory": "GameUtility",
  "operatingSystem": "Web Browser",
  "description": "Real-time market flipping tool for Albion Online with profit calculator and price alerts.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "156"
  },
  "featureList": "Market tracking, Profit calculator, Price alerts, Watchlist"
}
```

---

#### 2. Add BreadcrumbList to ALL Pages
**Create component:** `src/components/Breadcrumb.tsx`

```tsx
import { useLocale, useTranslations } from 'next-intl';

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://albionkit.com${item.url}`
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="flex text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-2">
          {items.map((item, index) => (
            <li key={item.url} className="inline-flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              <a href={item.url} className="hover:text-foreground">
                {item.name}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
```

**Usage example:**
```tsx
<Breadcrumb items={[
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'Market Flipper', url: '/tools/market-flipper' }
]} />
```

---

#### 3. Add FAQPage Schema
**Update:** `src/app/page.tsx` (FAQ section)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is AlbionKit safe to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! AlbionKit uses only official APIs and read-only data. No account credentials required."
      }
    },
    {
      "@type": "Question",
      "name": "Is AlbionKit free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, most features are free. Premium features available for $4.99/month."
      }
    }
    // Add all FAQ items
  ]
}
```

---

#### 4. Add HowTo Schema for Guides
**For guide pages like crafting guide, market flipping guide:**

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Make Money with Market Flipping in Albion Online",
  "description": "Step-by-step guide to profitable market flipping",
  "totalTime": "PT30M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Open Market Flipper",
      "text": "Navigate to the Market Flipper tool on AlbionKit"
    },
    {
      "@type": "HowToStep",
      "name": "Set Your Filters",
      "text": "Filter by minimum profit (2500 silver) and margin (10%)"
    }
  ]
}
```

---

#### 5. Add ItemList Schema for Build Lists
**For builds pages:**

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Best Solo PvP Build 2026",
      "url": "https://albionkit.com/builds/solo/abc123"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Best Group Healing Build",
      "url": "https://albionkit.com/builds/group/def456"
    }
  ]
}
```

---

### **Phase 2: Sitelinks Search Box** (MEDIUM PRIORITY)

Google automatically generates sitelinks, but you can help by adding **SearchAction** schema:

**Already implemented in homepage!** ✅

But enhance it with this in `src/app/layout.tsx`:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AlbionKit",
  "url": "https://albionkit.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://albionkit.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

**Note:** You need an actual search page for this to work. Consider adding:
- `/search` route that searches builds, guides, tools
- Search functionality in header

---

### **Phase 3: Page-Specific Metadata** (HIGH PRIORITY)

Each page needs **unique, descriptive metadata**:

#### Example for Market Flipper:
```tsx
// src/app/tools/market-flipper/page.tsx
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Pages.marketFlipper');
  
  return {
    title: 'Albion Online Market Flipper - Real-Time Profit Calculator | AlbionKit',
    description: 'Find profitable market flips in Albion Online. Track prices across all cities, set alerts, and maximize profits with real-time data. Free tool with premium features.',
    keywords: ['Albion Online market', 'market flipper', 'profit calculator', 'Albion trading', 'price tracker'],
    openGraph: {
      title: 'Market Flipper - AlbionKit',
      description: 'Find profitable market flips in real-time',
      images: ['/og-market-flipper.jpg'], // Unique OG image
    },
    alternates: {
      canonical: 'https://albionkit.com/tools/market-flipper'
    }
  };
}
```

**Do this for ALL major pages:**
- ✅ Homepage
- ❌ Market Flipper
- ❌ Kill Feed
- ❌ Crafting Calculator
- ❌ PvP Intel
- ❌ Each profit calculator page
- ❌ Builds category pages

---

### **Phase 4: Internal Linking Structure** (MEDIUM PRIORITY)

Google discovers sitelinks from your **internal linking**. Add:

#### 1. Footer with All Major Pages
**Create:** `src/components/Footer.tsx`

```tsx
<footer className="border-t border-border py-12">
  <div className="container mx-auto px-4">
    <div className="grid md:grid-cols-4 gap-8">
      <div>
        <h3 className="font-bold mb-4">Tools</h3>
        <ul className="space-y-2">
          <li><Link href="/tools/market-flipper">Market Flipper</Link></li>
          <li><Link href="/tools/kill-feed">Kill Feed</Link></li>
          <li><Link href="/tools/crafting-calc">Crafting Calculator</Link></li>
          <li><Link href="/tools/pvp-intel">PvP Intel</Link></li>
        </ul>
      </div>
      <div>
        <h3 className="font-bold mb-4">Profit Calculators</h3>
        <ul className="space-y-2">
          <li><Link href="/profits/farming">Farming</Link></li>
          <li><Link href="/profits/cooking">Cooking</Link></li>
          <li><Link href="/profits/alchemy">Alchemy</Link></li>
          <li><Link href="/profits/labour">Laborers</Link></li>
        </ul>
      </div>
      <div>
        <h3 className="font-bold mb-4">Community</h3>
        <ul className="space-y-2">
          <li><Link href="/builds">Builds</Link></li>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/discord">Discord</Link></li>
        </ul>
      </div>
    </div>
  </div>
</footer>
```

#### 2. Table of Contents on Long Pages
For guides and long-form content, add TOC with anchor links.

---

### **Phase 5: Google Search Console** (CRITICAL)

#### 1. Verify Site
- Go to https://search.google.com/search-console
- Add property: `albionkit.com`
- Verify via DNS record or HTML file upload

#### 2. Submit Sitemap
- Submit: `https://albionkit.com/sitemap.xml`
- Monitor indexing status

#### 3. Request Indexing
After making changes:
- Use "URL Inspection" tool
- Request indexing for updated pages

#### 4. Monitor Performance
- Track impressions, clicks, CTR
- Identify top queries
- Fix crawl errors

---

### **Phase 6: Content Enhancements** (ONGOING)

#### 1. Add Unique Descriptions to All Pages
Each page should have 150-160 character meta description.

#### 2. Create Topic Clusters
Example for "Market Flipping":
- Main pillar: `/tools/market-flipper`
- Supporting content:
  - `/guides/market-flipping-beginners`
  - `/guides/advanced-trading-strategies`
  - `/guides/city-price-differences`

All interlinked together → signals authority to Google.

#### 3. Add User-Generated Content
- Reviews/ratings for tools
- Comments on builds
- Forum discussions

Fresh content = more indexing opportunities.

---

## 📊 Expected Timeline

| Phase | Time to Implement | Time to See Results |
|-------|------------------|---------------------|
| Phase 1: Structured Data | 2-3 days | 1-2 weeks |
| Phase 2: Sitelinks Search | 1 day | 2-4 weeks |
| Phase 3: Page Metadata | 1-2 days | 1-2 weeks |
| Phase 4: Internal Linking | 1 day | 2-3 weeks |
| Phase 5: Search Console | 30 min | Immediate monitoring |
| Phase 6: Content | Ongoing | 1-3 months |

---

## 🎯 Success Metrics

Track these in Google Search Console:

1. **Impressions**: Should increase 50-100%
2. **Clicks**: Should increase 30-50%
3. **CTR**: Target 3-5% for branded queries
4. **Sitelinks**: Should appear after 1-2 months
5. **Rich Results**: Enhanced snippets in search

---

## 🔧 Quick Wins (Do These TODAY)

1. ✅ Add FAQPage schema to homepage
2. ✅ Add BreadcrumbList to all tool pages
3. ✅ Add SoftwareApplication schema to Market Flipper
4. ✅ Update page titles to be more descriptive
5. ✅ Submit sitemap to Google Search Console
6. ✅ Add footer with internal links

---

## 📝 Example: Complete Page Enhancement

Here's how to enhance a single page (Market Flipper):

```tsx
// src/app/tools/market-flipper/page.tsx

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Albion Online Market Flipper - Real-Time Profit Calculator | AlbionKit',
    description: 'Find profitable market flips in Albion Online. Track prices across all cities, set alerts, and maximize profits with real-time data.',
    keywords: ['Albion Online market', 'market flipper', 'profit calculator', 'Albion trading'],
  };
}

export default function MarketFlipperPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'Market Flipper - AlbionKit',
      'applicationCategory': 'GameUtility',
      'description': 'Real-time market flipping tool',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://albionkit.com' },
        { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://albionkit.com/tools' },
        { '@type': 'ListItem', position: 3, name: 'Market Flipper', item: 'https://albionkit.com/tools/market-flipper' }
      ]
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Page content */}
    </>
  );
}
```

---

## 🚀 After Implementation

1. Wait 1-2 weeks for Google to crawl
2. Check Search Console for rich results
3. Monitor search appearance
4. Iterate based on performance data

**Expected outcome:** Within 4-8 weeks, you should see:
- Sitelinks appearing
- Rich snippets in search results
- Improved CTR from search
- Higher rankings for target keywords
