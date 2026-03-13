import { Metadata } from 'next';
import ForumClient from './ForumClient';
import { getThreadsAction } from '@/app/actions/community';

export const metadata: Metadata = {
  title: 'AlbionKit Forum - Threads, Meta Discussion & Intel',
  description: 'Join the AlbionKit forum. Discuss meta builds, market trends, PvP strategies, and find guilds.',
  keywords: ['Albion Online Forum', 'Albion Threads', 'Albion Forum', 'Albion Meta Discussion'],
};

export default async function ForumPage() {
  const result = await getThreadsAction();
  const initialThreads = result.success ? result.threads : [];
  
  return <ForumClient initialThreads={initialThreads} />;
}
