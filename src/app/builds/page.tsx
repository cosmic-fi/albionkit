import { Metadata } from 'next';
import BuildsClient from './BuildsClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Builds');

  return {
    title: `${t('title')} | AlbionKit`,
    description: t('description'),
    keywords: ['Albion Online Builds', 'Albion Meta', 'Albion PvP Builds', 'Solo Builds', 'ZvZ Builds', 'Albion Build Editor'],
    openGraph: {
      title: `${t('title')} | AlbionKit`,
      description: t('description'),
      type: 'website',
    },
  };
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BuildsIndexPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const tagParam = resolvedSearchParams?.tag;
  const initialTag =
    typeof tagParam === 'string' && tagParam
      ? (tagParam as any)
      : 'all';

  return <BuildsClient initialTag={initialTag} />;
}
