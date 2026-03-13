import { Metadata } from 'next';
import ThreadDetailClient from './ThreadDetailClient';
import { getThreadByIdAction, getCommentsAction } from '@/app/actions/community';

// Helper to strip markdown and HTML for plain text previews
const stripMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]{1,3}/g, '')
    .replace(/^[#>-\s]+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const result = await getThreadByIdAction(resolvedParams.id);
  const thread = result.success ? result.thread : null;

  if (!thread) {
    return {
      title: 'Thread Not Found | AlbionKit Community',
      description: 'The requested thread could not be found.',
    };
  }

  const cleanDescription = stripMarkdown(thread.content).substring(0, 160) + (thread.content.length > 160 ? '...' : '');

  return {
    title: `${thread.title} | AlbionKit Community`,
    description: cleanDescription,
    keywords: ['Albion Online', 'AlbionKit', 'Community', thread.category, thread.server, ...(thread.tags || [])],
    authors: [{ name: thread.authorName }],
    openGraph: {
      title: thread.title,
      description: cleanDescription,
      url: `https://albionkit.com/forum/thread/${thread.id}`,
      siteName: 'Albion_Kit',
      type: 'article',
      publishedTime: thread.createdAt,
      authors: [thread.authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title: thread.title,
      description: cleanDescription,
    },
    alternates: {
      canonical: `https://albionkit.com/forum/thread/${thread.id}`,
    }
  };
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  const [threadResult, commentsResult] = await Promise.all([
    getThreadByIdAction(resolvedParams.id),
    getCommentsAction(resolvedParams.id)
  ]);

  return (
    <ThreadDetailClient
      threadId={resolvedParams.id}
      initialThread={threadResult.success ? threadResult.thread : null}
      initialComments={commentsResult.success ? commentsResult.comments : []}
    />
  );
}
