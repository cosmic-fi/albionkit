import { Metadata } from 'next';
import UserProfileClient from './UserProfileClient';
import { getUserProfile } from '@/lib/user-profile';
import { getTranslations, getLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getUserProfile(userId);
  const t = await getTranslations('UserProfile');
  const locale = await getLocale();

  if (!profile) {
    return {
      title: t('userNotFound'),
      description: t('userNotFoundDesc'),
    };
  }

  const title = `${profile.displayName || t('user')} | AlbionKit Profile`;
  const description = profile.signature || t('userProfileDesc', { displayName: profile.displayName || t('user') });
  
  const images = [];
  if (profile.photoURL) images.push(profile.photoURL);
  images.push('https://albionkit.com/og-image.jpg');

  const bannerImage = profile.bannerUrl ? [profile.bannerUrl] : images;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      username: profile.displayName,
      images: images.map(url => ({ url })),
    },
    twitter: {
      card: profile.bannerUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: bannerImage,
    }
  };
}

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UserProfileClient userId={userId} />;
}
