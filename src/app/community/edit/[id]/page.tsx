import { Metadata } from 'next';
import EditThreadClient from './EditThreadClient';
import { getThreadByIdAction } from '@/app/actions/community';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const result = await getThreadByIdAction(resolvedParams.id);
  const thread = result.success ? result.thread : null;
  
  return {
    title: thread ? `Edit: ${thread.title} | AlbionKit` : 'Edit Thread | AlbionKit',
  };
}

export default async function EditThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const result = await getThreadByIdAction(resolvedParams.id);
  
  if (!result.success || !result.thread) {
    redirect('/community');
  }

  return <EditThreadClient initialThread={result.thread} />;
}
