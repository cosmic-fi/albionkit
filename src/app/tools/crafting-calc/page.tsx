import { Metadata } from 'next';
import CraftingCalcClient from './CraftingCalcClient';

export const metadata: Metadata = {
  title: 'Albion Online Crafting Calculator - Profit Tool | AlbionKit',
  description: 'Maximize your crafting profits in Albion Online. Calculate resource costs, focus efficiency, and return rates for any item.',
  keywords: ['Albion Online Crafting', 'Crafting Calculator', 'Focus Efficiency', 'Albion Profit Calculator', 'Crafting Tool'],
  openGraph: {
    title: 'Albion Online Crafting Calculator',
    description: 'Calculate crafting costs and profits instantly. Optimize your focus usage and maximize silver per focus.',
    type: 'website',
  },
};

export default function CraftingCalcPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://albionkit.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tools',
        item: 'https://albionkit.com/tools',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Crafting Calculator',
        item: 'https://albionkit.com/tools/crafting-calc',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CraftingCalcClient />
    </>
  );
}
