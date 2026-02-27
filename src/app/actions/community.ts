'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Thread, ThreadCategory, Comment, ServerRegion } from '@/lib/community-service';
import { revalidatePath } from 'next/cache';
import { getUserProfile } from '@/lib/user-profile';

export async function getThreadsAction(filters?: {
  category?: ThreadCategory;
  server?: ServerRegion;
  authorId?: string;
  limit?: number;
}) {
  console.log('[CommunityAction] Fetching threads with filters:', filters);
  try {
    let query: any = adminDb.collection('threads');

    // Apply filters first
    if (filters?.category) {
      console.log('[CommunityAction] Applying category filter:', filters.category);
      query = query.where('category', '==', filters.category);
    }

    if (filters?.server && filters.server !== 'All') {
      console.log('[CommunityAction] Applying server filter:', filters.server);
      query = query.where('server', '==', filters.server);
    }

    if (filters?.authorId) {
      query = query.where('authorId', '==', filters.authorId);
    }

    // Order by isPinned first, then createdAt
    query = query.orderBy('isPinned', 'desc').orderBy('createdAt', 'desc');

    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(20);
    }

    const snapshot = await query.get();
    console.log(`[CommunityAction] Found ${snapshot.size} threads`);
    return { success: true, threads: snapshot.docs.map((doc: any) => doc.data() as Thread) };
  } catch (error) {
    console.error('[CommunityAction] Error getting threads:', error);
    return { success: false, error: 'Failed to fetch threads. This might be due to missing database indexes.', threads: [] };
  }
}

export async function getThreadByIdAction(id: string) {
  try {
    const doc = await adminDb.collection('threads').doc(id).get();
    if (!doc.exists) return { success: false, error: 'Thread not found' };
    return { success: true, thread: doc.data() as Thread };
  } catch (error) {
    console.error('[CommunityAction] Error getting thread:', error);
    return { success: false, error: 'Failed to fetch thread' };
  }
}

export async function getCommentsAction(threadId: string) {
  try {
    const snapshot = await adminDb.collection('threads').doc(threadId).collection('comments').orderBy('createdAt', 'asc').get();
    return { success: true, comments: snapshot.docs.map(doc => doc.data() as Comment) };
  } catch (error) {
    console.error('[CommunityAction] Error getting comments:', error);
    return { success: false, error: 'Failed to fetch comments', comments: [] };
  }
}

export async function getThreadByBuildIdAction(buildId: string) {
  try {
    const snapshot = await adminDb.collection('threads').where('relatedBuildId', '==', buildId).limit(1).get();
    if (snapshot.empty) return { success: false, error: 'Thread not found' };
    return { success: true, thread: snapshot.docs[0].data() as Thread };
  } catch (error) {
    console.error('[CommunityAction] Error getting thread by build id:', error);
    return { success: false, error: 'Failed to fetch thread' };
  }
}

export async function createThreadAction(data: {
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorRank?: string;
  title: string;
  content: string;
  category: ThreadCategory;
  server: ServerRegion;
  tags: string[];
  relatedBuildId?: string;
  guildName?: string;
  activityType?: string;
}) {
  try {
    const profile = await getUserProfile(data.authorId);

    if (['Announcements', 'News', 'Official'].includes(data.category)) {
      if (!profile?.isAdmin) {
        return { success: false, error: 'Unauthorized: Only admins can post in official categories' };
      }
    }

    if (data.tags && data.tags.length > 0) {
      const restrictedTags = ['official', 'rules', 'guidelines', 'announcement', 'announcements', 'news', 'admin'];
      const hasRestricted = data.tags.some(t => restrictedTags.includes(t.toLowerCase()));
      if (hasRestricted && !profile?.isAdmin) {
        return { success: false, error: 'Unauthorized: Only admins can use official tags' };
      }
    }

    // Cooldown check (24 hours)
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const lastThreadQuery = await adminDb.collection('threads')
      .where('authorId', '==', data.authorId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!lastThreadQuery.empty) {
      const lastThread = lastThreadQuery.docs[0].data();
      const lastCreatedAt = new Date(lastThread.createdAt).getTime();
      const nowMs = Date.now();
      const diff = nowMs - lastCreatedAt;

      if (diff < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - diff;
        const hours = Math.floor(remainingMs / (60 * 60 * 1000));
        const minutes = Math.ceil((remainingMs % (60 * 60 * 1000)) / 60000);

        let timeStr = '';
        if (hours > 0) {
          timeStr = `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
        } else {
          timeStr = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }

        return {
          success: false,
          error: `Please wait ${timeStr} before posting another thread.`
        };
      }
    }

    const threadRef = adminDb.collection('threads').doc();
    const now = new Date().toISOString();

    const newThread: Thread = {
      id: threadRef.id,
      ...data,
      authorIsAdmin: profile?.isAdmin || false,
      likes: 0,
      likedBy: [],
      commentCount: 0,
      views: 0,
      isPinned: false,
      isLocked: false,
      createdAt: now,
      updatedAt: now,
    };

    await threadRef.set(newThread);
    revalidatePath('/community');
    return { success: true, threadId: threadRef.id };
  } catch (error) {
    console.error('[CommunityAction] Error creating thread:', error);
    return { success: false, error: 'Failed to create thread' };
  }
}

export async function updateThreadAction(threadId: string, authorId: string, data: Partial<{
  title: string;
  content: string;
  category: ThreadCategory;
  server: ServerRegion;
  tags: string[];
  guildName?: string;
  activityType?: string;
}>) {
  try {
    const profile = await getUserProfile(authorId);

    if (data.category && ['Announcements', 'News', 'Official'].includes(data.category)) {
      if (!profile?.isAdmin) {
        return { success: false, error: 'Unauthorized: Only admins can use official categories' };
      }
    }

    if (data.tags && data.tags.length > 0) {
      const restrictedTags = ['official', 'rules', 'guidelines', 'announcement', 'announcements', 'news', 'admin'];
      const hasRestricted = data.tags.some(t => restrictedTags.includes(t.toLowerCase()));
      if (hasRestricted && !profile?.isAdmin) {
        return { success: false, error: 'Unauthorized: Only admins can use official tags' };
      }
    }

    const threadRef = adminDb.collection('threads').doc(threadId);
    const doc = await threadRef.get();

    if (!doc.exists) return { success: false, error: 'Thread not found' };
    const thread = doc.data() as Thread;

    if (thread.authorId !== authorId) {
      return { success: false, error: 'Unauthorized: You are not the author of this thread' };
    }

    await threadRef.update({
      ...data,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/community');
    revalidatePath(`/community/thread/${threadId}`);
    return { success: true };
  } catch (error) {
    console.error('[CommunityAction] Error updating thread:', error);
    return { success: false, error: 'Failed to update thread' };
  }
}

export async function deleteThreadAction(threadId: string, authorId: string) {
  try {
    const threadRef = adminDb.collection('threads').doc(threadId);
    const doc = await threadRef.get();

    if (!doc.exists) return { success: false, error: 'Thread not found' };
    const thread = doc.data() as Thread;

    if (thread.authorId !== authorId) {
      return { success: false, error: 'Unauthorized: You are not the author of this thread' };
    }

    // Delete comments subcollection first
    const commentsSnapshot = await threadRef.collection('comments').get();
    const batch = adminDb.batch();
    commentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete the thread itself
    batch.delete(threadRef);
    await batch.commit();

    revalidatePath('/community');
    return { success: true };
  } catch (error) {
    console.error('[CommunityAction] Error deleting thread:', error);
    return { success: false, error: 'Failed to delete thread' };
  }
}

export async function likeThreadAction(threadId: string, userId: string) {
  try {
    const threadRef = adminDb.collection('threads').doc(threadId);
    const doc = await threadRef.get();

    if (!doc.exists) return { success: false, error: 'Thread not found' };

    const thread = doc.data() as Thread;
    const likedBy = thread.likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      // Unlike
      await threadRef.update({
        likedBy: likedBy.filter(id => id !== userId),
        likes: Math.max(0, (thread.likes || 1) - 1)
      });
    } else {
      // Like
      await threadRef.update({
        likedBy: [...likedBy, userId],
        likes: (thread.likes || 0) + 1
      });
    }

    revalidatePath('/community');
    revalidatePath(`/community/thread/${threadId}`);
    return { success: true };
  } catch (error) {
    console.error('[CommunityAction] Error liking thread:', error);
    return { success: false, error: 'Failed to like thread' };
  }
}

export async function addCommentAction(data: {
  threadId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorRank?: string;
  content: string;
  replyToId?: string;
}) {
  try {
    const commentRef = adminDb.collection('threads').doc(data.threadId).collection('comments').doc();
    const now = new Date().toISOString();

    const profile = await getUserProfile(data.authorId);

    const newComment = {
      id: commentRef.id,
      ...data,
      authorIsAdmin: profile?.isAdmin || false,
      likes: 0,
      likedBy: [],
      createdAt: now,
      updatedAt: now,
    };

    await commentRef.set(newComment);

    // Update thread comment count
    const threadRef = adminDb.collection('threads').doc(data.threadId);
    await threadRef.update({
      commentCount: (await threadRef.get()).data()?.commentCount + 1 || 1,
      updatedAt: now
    });

    revalidatePath(`/community/thread/${data.threadId}`);
    return { success: true, commentId: commentRef.id };
  } catch (error) {
    console.error('[CommunityAction] Error adding comment:', error);
    return { success: false, error: 'Failed to add comment' };
  }
}

export async function deleteCommentAction(threadId: string, commentId: string, authorId: string) {
  try {
    const threadRef = adminDb.collection('threads').doc(threadId);
    const commentRef = threadRef.collection('comments').doc(commentId);
    const doc = await commentRef.get();

    if (!doc.exists) return { success: false, error: 'Comment not found' };
    const comment = doc.data() as Comment;

    if (comment.authorId !== authorId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if it has replies
    const repliesSnapshot = await threadRef.collection('comments').where('replyToId', '==', commentId).limit(1).get();

    if (!repliesSnapshot.empty) {
      // Has replies, so we only purge content to keep the tree intact
      await commentRef.update({
        content: '[Comment Purged]',
        authorName: '[Deleted User]',
        authorPhotoURL: '',
        authorRank: '',
        updatedAt: new Date().toISOString()
      });
    } else {
      // No replies, safe to delete
      await commentRef.delete();

      // Update thread comment count
      await threadRef.update({
        commentCount: Math.max(0, (await threadRef.get()).data()?.commentCount - 1 || 0),
        updatedAt: new Date().toISOString()
      });
    }

    revalidatePath(`/community/thread/${threadId}`);
    return { success: true };
  } catch (error) {
    console.error('[CommunityAction] Error deleting comment:', error);
    return { success: false, error: 'Failed to delete comment' };
  }
}

export async function submitReportAction(data: {
  reporterId: string;
  targetId: string;
  targetType: 'thread' | 'comment';
  reason: string;
  details?: string;
  threadId: string;
}) {
  try {
    const reportRef = adminDb.collection('reports').doc();
    await reportRef.set({
      ...data,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    return { success: true };
  } catch (error) {
    console.error('[CommunityAction] Error submitting report:', error);
    return { success: false, error: 'Failed to submit report' };
  }
}

export async function togglePinThreadAction(threadId: string, authorId: string) {
  try {
    const profile = await getUserProfile(authorId);
    if (!profile?.isAdmin) {
      return { success: false, error: 'Unauthorized: Only admins can pin threads' };
    }
    const threadRef = adminDb.collection('threads').doc(threadId);
    const doc = await threadRef.get();
    if (!doc.exists) return { success: false, error: 'Thread not found' };
    const thread = doc.data() as Thread;

    await threadRef.update({
      isPinned: !thread.isPinned,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/community');
    revalidatePath(`/community/thread/${threadId}`);
    return { success: true, isPinned: !thread.isPinned };
  } catch (error) {
    console.error('[CommunityAction] Error toggling pin:', error);
    return { success: false, error: 'Failed to toggle pin status' };
  }
}
