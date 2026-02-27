import { Metadata } from 'next';
import CommunityClient from './CommunityClient';
import { getThreadsAction } from '@/app/actions/community';

export const metadata: Metadata = {
  title: 'AlbionKit Community - Threads, Meta Discussion & Intel',
  description: 'Join the AlbionKit community. Discuss meta builds, market trends, PvP strategies, and find guilds.',
  keywords: ['Albion Online Community', 'Albion Threads', 'Albion Forum', 'Albion Meta Discussion'],
};

export default async function CommunityPage() {
  const result = await getThreadsAction();
  const initialThreads = result.success ? result.threads : [];
  
  return <CommunityClient initialThreads={initialThreads} />;
}
