import { Metadata } from 'next';
import BuildsClient from './BuildsClient';

export const metadata: Metadata = {
  title: 'Albion Online Builds - Meta & Community Database | AlbionKit',
  description: 'Explore the best Albion Online builds for every content type: Solo, Small Scale, ZvZ, Ganking, and more. Create, share, and rate builds.',
  keywords: ['Albion Online Builds', 'Albion Meta', 'Albion PvP Builds', 'Solo Builds', 'ZvZ Builds', 'Albion Build Editor'],
  openGraph: {
    title: 'Albion Online Builds Database | AlbionKit',
    description: 'Find top-rated builds for Solo, Small Scale, ZvZ, and Group content. Join the community and share your own strategies.',
    type: 'website',
  },
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BuildsIndexPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const categoryParam = resolvedSearchParams?.category;
  const initialCategory =
    typeof categoryParam === 'string' && categoryParam
      ? (categoryParam as any)
      : 'all';

  return <BuildsClient initialCategory={initialCategory} />;
}
