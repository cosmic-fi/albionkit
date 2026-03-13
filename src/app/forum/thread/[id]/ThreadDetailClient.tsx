'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '@/components/PageShell';
import { useAuth } from '@/context/AuthContext';
import { Thread, Comment } from '@/lib/community-service';
import {
  likeThreadAction,
  addCommentAction,
  getThreadByIdAction,
  getCommentsAction,
  deleteThreadAction,
  deleteCommentAction,
  submitReportAction,
  togglePinThreadAction
} from '@/app/actions/community';
import {
  X,
  MessageSquare,
  User,
  Clock,
  ThumbsUp,
  Send,
  ArrowLeft,
  Loader2,
  Flame,
  Shield,
  MessageCircle,
  Sword,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUp,
  Share2,
  Flag,
  Check,
  Users,
  Globe,
  Activity,
  Pin,
  PinOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { useLoginModal } from '@/context/LoginModalContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

const MarkdownViewer = dynamic<{ source: string | undefined }>(
  () => import('@uiw/react-md-editor').then((mod) => {
    const { Markdown } = mod.default as any;
    return Markdown || (() => null);
  }),
  { ssr: false }
);

export default function ThreadDetailClient({
  threadId,
  initialThread,
  initialComments
}: {
  threadId: string;
  initialThread: Thread | null | undefined;
  initialComments: Comment[];
}) {
  const t = useTranslations('ThreadDetail');
  const tc = useTranslations('Community');
  const { user, profile } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [thread, setThread] = useState<Thread | null>(initialThread || null);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Advanced comment system states
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToName, setReplyToName] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);

  // Reporting states
  const [reportingItem, setReportingItem] = useState<{ type: 'thread' | 'comment', id: string } | null>(null);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const isAuthor = user && thread && user.uid === thread.authorId;

  const handleDelete = async () => {
    if (!user || !thread) return;
    setIsDeleting(true);
    const result = await deleteThreadAction(thread.id, user.uid);
    if (result.success) {
      toast.success(t('deleteSuccess'));
      router.push('/forum');
    } else {
      toast.error(result.error || t('deleteError'));
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleTogglePin = async () => {
    if (!user || !profile?.isAdmin || !thread) return;
    const result = await togglePinThreadAction(thread.id, user.uid);
    if (result.success) {
      toast.success(result.isPinned ? t('pinned') : t('unpinned'));
      fetchThreadData();
    } else {
      toast.error(result.error || t('pinError'));
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyToId(comment.id);
    setReplyToName(comment.authorName);
    setNewComment(`@${comment.authorName} `);
    // Focus the comment box
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !thread) return;
    setIsDeletingComment(commentId);
    const result = await deleteCommentAction(thread.id, commentId, user.uid);
    if (result.success) {
      toast.success(t('commentDeleted'));
      fetchThreadData();
    } else {
      toast.error(result.error || t('deleteCommentError'));
    }
    setIsDeletingComment(null);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportingItem) return;

    setIsSubmittingReport(true);
    const result = await submitReportAction({
      reporterId: user.uid,
      targetId: reportingItem.id,
      targetType: reportingItem.type,
      reason: reportReason,
      details: reportDetails,
      threadId
    });

    if (result.success) {
      toast.success(t('reportSubmitted'));
      setReportingItem(null);
      setReportReason('Spam');
      setReportDetails('');
    } else {
      toast.error(result.error || t('reportError'));
    }
    setIsSubmittingReport(false);
  };

  const buildCommentTree = (items: Comment[], parentId: string | null = null, depth = 0): any[] => {
    if (depth > 3) return [];
    return items
      .filter(item => (item.replyToId || null) === parentId)
      .map(item => ({
        ...item,
        replies: buildCommentTree(items, item.id, depth + 1),
        depth
      }));
  };

  const commentTree = buildCommentTree(comments);

  useEffect(() => {
    setIsMounted(true);
    // Data is loaded via SSR, only re-fetch if we somehow lose the thread
    if (!thread) {
      fetchThreadData();
    }
  }, [threadId]);

  const fetchThreadData = async () => {
    setLoading(true);
    const [tResult, cResult] = await Promise.all([
      getThreadByIdAction(threadId),
      getCommentsAction(threadId)
    ]);
    if (tResult.success && tResult.thread) {
      setThread(tResult.thread);
    }
    if (cResult.success && cResult.comments) {
      setComments(cResult.comments);
    }
    setLoading(false);
  };

  const renderCommentTree = (nodes: any[]) => {
    return nodes.map(comment => (
      <div
        key={comment.id}
        className={`group/comment relative transition-colors ${comment.depth === 0
          ? 'bg-card border border-border rounded-xl overflow-hidden'
          : 'bg-muted/5 hover:bg-muted/10'
          }`}
      >
        <div
          className={`p-4 sm:p-5 transition-colors relative ${comment.depth > 0 ? 'ml-4 sm:ml-10' : ''
            }`}
        >
          {/* Threading Guide Line */}
          {comment.depth > 0 && (
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border/60 group-hover/comment:bg-primary/40 transition-colors" />
          )}

          <div className="flex gap-3 sm:gap-4">
            <div className="shrink-0 relative z-10">
              <div className={`rounded-lg bg-muted overflow-hidden border border-border ${comment.depth === 0 ? 'w-10 h-10' : 'w-8 h-8'}`}>
                {comment.authorPhotoURL ? (
                  <img src={comment.authorPhotoURL} alt={comment.authorName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-background"><User className="h-4 w-4 text-muted-foreground" /></div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold text-xs ${comment.authorId === thread?.authorId ? 'text-primary' : 'text-foreground'} flex items-center gap-1.5`}>
                    {comment.authorName}
                    {comment.authorIsAdmin && (
                      <span className="bg-primary/20 text-primary text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Shield className="h-2.5 w-2.5" /> {tc('admin')}
                      </span>
                    )}
                  </span>
                  {comment.authorRank && (
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold uppercase border border-border">
                      {comment.authorRank}
                    </span>
                  )}
                  {comment.authorId === thread?.authorId && (
                    <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">{t('op')}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider opacity-60">
                    {isMounted ? `${formatDistanceToNow(new Date(comment.createdAt))} ${tc('ago')}` : '...'}
                  </span>
                  <div className="flex items-center gap-1.5 ml-1">
                    {user && user.uid === comment.authorId && comment.content !== '[Comment Purged]' && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={isDeletingComment === comment.id}
                        className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        title={t('deleteComment')}
                      >
                        {isDeletingComment === comment.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </button>
                    )}
                    {user && user.uid !== comment.authorId && comment.content !== '[Comment Purged]' && (
                      <button
                        onClick={() => setReportingItem({ type: 'comment', id: comment.id })}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title={t('reportComment')}
                      >
                        <Flag className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">
                {comment.content}
              </div>

              {user && comment.content !== '[Comment Purged]' && comment.depth < 3 && (
                <div className="pt-1">
                  <button
                    onClick={() => handleReply(comment)}
                    className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest hover:opacity-80 transition-opacity"
                  >
                    <MessageSquare className="h-2.5 w-2.5" />
                    {t('reply')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className={`space-y-1 ${comment.depth === 0 ? 'pb-2' : ''}`}>
            {renderCommentTree(comment.replies)}
          </div>
        )}
      </div>
    ));
  };

  const handleLike = async () => {
    if (!user) {
      openLoginModal(t('likePrompt'));
      return;
    }
    const result = await likeThreadAction(threadId, user.uid);
    if (result.success) fetchThreadData();
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      openLoginModal(t('commentPrompt'));
      return;
    }

    if (newComment.length < 2) return;

    setIsSubmittingComment(true);
    const result = await addCommentAction({
      threadId,
      authorId: user.uid,
      authorName: profile.displayName || 'Anonymous',
      authorPhotoURL: profile.photoURL,
      authorRank: (profile as any).rank || 'Wanderer',
      content: newComment,
      replyToId: replyToId || undefined
    });

    if (result.success) {
      setNewComment('');
      setReplyToId(null);
      setReplyToName(null);
      fetchThreadData();
      toast.success(t('replyBroadcast'));
    } else {
      toast.error(result.error || t('postCommentError'));
    }
    setIsSubmittingComment(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t('decoding')}</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <PageShell title={t('threadNotFound')} description={t('threadNotFoundDesc')}>
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <AlertTriangle className="h-10 w-10 text-destructive/50" />
          <p className="text-muted-foreground">{t('threadNotFoundDesc')}</p>
          <Link href="/forum" className="text-primary font-bold hover:underline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> {t('returnToHub')}
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={thread.title}
      description={thread.category}
      icon={<MessageCircle className="h-5 w-5" />}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(window.location.href);
                toast.success(t('linkCopied'));
              }
            }}
            className="p-2 bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <Link href="/forum" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-secondary rounded-lg text-sm font-bold text-muted-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Link>
        </div>
      }
    >
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 max-w-7xl mx-auto items-start">
        {/* Left Column: Post + Comments */}
        <div className="space-y-6">
          {/* Main Content Area */}
          <article className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
              {/* Mobile Info */}
              <div className="flex items-center gap-3 lg:hidden pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden">
                  {thread.authorPhotoURL ? (
                    <img src={thread.authorPhotoURL} alt={thread.authorName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    {thread.authorName}
                    {thread.authorRank === 'Admin' && <Shield className="h-3 w-3 text-primary" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
                    <Clock className="h-3 w-3" />
                    {isMounted ? `${formatDistanceToNow(new Date(thread.createdAt))} ${tc('ago')}` : '...'}
                  </div>
                </div>
              </div>

              {/* Tags & Title */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded border border-primary/20">
                    {tc(`categories.${thread.category}` as any) || thread.category}
                  </span>
                  <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider rounded border border-border">
                    {thread.server}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight flex items-start gap-3">
                  {thread.title}
                  {thread.isPinned && (
                    <div className="shrink-0 mt-1" title="Pinned Thread">
                      <Pin className="h-5 w-5 text-primary fill-primary/20 rotate-45" />
                    </div>
                  )}
                </h1>
              </div>

              {/* Metadata */}
              {(thread.guildName || thread.activityType) && (
                <div className="flex flex-wrap gap-2">
                  {thread.guildName && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      <Shield className="h-3.5 w-3.5 opacity-60" />
                      {thread.guildName}
                    </div>
                  )}
                  {thread.activityType && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      <Sword className="h-3.5 w-3.5 opacity-60" />
                      {thread.activityType}
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div data-color-mode={isMounted && resolvedTheme === 'dark' ? 'dark' : 'light'} className="bg-transparent w-full">
                {isMounted ? (
                  <div className={`prose prose-sm md:prose-base max-w-none !bg-transparent ${resolvedTheme === 'dark' ? 'prose-invert' : ''}`}>
                    <MarkdownViewer source={thread.content} />
                  </div>
                ) : (
                  <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium opacity-50">
                    Loading content...
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 flex items-center justify-between border-t border-border">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-xs uppercase tracking-wider ${user && thread.likedBy?.includes(user.uid)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <ArrowUp className={`h-4 w-4 ${user && thread.likedBy?.includes(user.uid) ? 'fill-current' : ''}`} />
                    <span>{thread.likes || 0}</span>
                  </button>

                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 text-muted-foreground rounded-lg text-xs font-bold uppercase tracking-wider">
                    <MessageSquare className="h-4 w-4 opacity-60" />
                    <span>{thread.commentCount || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReportingItem({ type: 'thread', id: thread.id })}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    title="Report Thread"
                  >
                    <Flag className="h-4 w-4" />
                  </button>

                  {(isAuthor || profile?.isAdmin) && (
                    <div className="relative">
                      <button
                        onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {isActionMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsActionMenuOpen(false)} />
                          <div className="absolute right-0 bottom-full mb-2 w-40 bg-card border border-border rounded-lg z-40 py-1 overflow-hidden">
                            {profile?.isAdmin && (
                              <button
                                onClick={() => {
                                  setIsActionMenuOpen(false);
                                  handleTogglePin();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-b border-border"
                              >
                                {thread.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                                {thread.isPinned ? t('unpin') : t('pinThread')}
                              </button>
                            )}
                            {isAuthor && (
                              <Link
                                href={`/forum/edit/${thread.id}`}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                {t('editThread')}
                              </Link>
                            )}
                            {isAuthor && (
                              <button
                                onClick={() => {
                                  setIsActionMenuOpen(false);
                                  setShowDeleteConfirm(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {t('delete')}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>

          {/* Comment Head */}
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{t('comments')}</h3>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('noComments')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {renderCommentTree(commentTree)}
              </div>
            )}
          </div>

          {/* Comment Form */}
          <div className="bg-card border border-border rounded-xl p-5">
            {replyToId && (
              <div className="mb-4 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {t('replyingTo', { name: replyToName || '' })}
                  </p>
                </div>
                <button
                  onClick={() => { setReplyToId(null); setReplyToName(null); if (newComment.startsWith(`@${replyToName}`)) setNewComment(''); }}
                  className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest"
                >
                  {t('cancel')}
                </button>
              </div>
            )}
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div className="flex gap-4">
                <div className="hidden sm:block shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden border border-border">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Me" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={user ? t('writeComment') : t('authRequired')}
                    disabled={!user || isSubmittingComment}
                    rows={3}
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-3 text-foreground focus:border-primary/50 outline-none resize-none transition-all disabled:opacity-50 text-sm font-medium"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="bg-primary hover:bg-primary/90 flex-row align-center flex text-primary-foreground px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="ml-2">{t('submit')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-6 sticky top-24">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden border border-border p-1">
                {thread.authorPhotoURL ? (
                  <img src={thread.authorPhotoURL} alt={thread.authorName} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-background"><User className="h-8 w-8 text-muted-foreground" /></div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-foreground flex items-center justify-center gap-1.5">
                  {thread.authorName}
                  {thread.authorIsAdmin && (
                    <span className="bg-primary/20 text-primary text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 ml-1.5">
                      <Shield className="h-2.5 w-2.5" /> {tc('admin')}
                    </span>
                  )}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{thread.authorRank}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 p-2.5 rounded-lg text-center">
                <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mb-1">{t('status')}</p>
                <p className="text-[10px] font-bold text-emerald-500">{t('active')}</p>
              </div>
              <div className="bg-muted/50 p-2.5 rounded-lg text-center">
                <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Rank</p>
                <p className="text-[10px] font-bold text-foreground">Adept</p>
              </div>
            </div>

            <Link href={`/user/${thread.authorId}`} className="block w-full py-2 bg-muted hover:bg-muted/80 text-[10px] font-bold text-center uppercase tracking-widest rounded-lg transition-colors border border-border">
              {tc('viewProfile')}
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Flame className="h-3.5 w-3.5" />
              {t('threadData')}
            </h4>
            <div className="space-y-3">
              {[
                { label: t('server'), value: thread.server, icon: <Globe className="h-3.5 w-3.5" /> },
                { label: t('channel'), value: tc(`categories.${thread.category}` as any) || thread.category, icon: <Activity className="h-3.5 w-3.5" /> },
                { label: t('guild'), value: thread.guildName || t('none'), icon: <Shield className="h-3.5 w-3.5" /> },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <span className="text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-sm rounded-xl p-6 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground uppercase tracking-tight">{t('confirmDelete')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('deleteWarning')}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted transition-colors border border-border">
                {t('cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Report Modal */}
      {reportingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{t('reportContent')}</h3>
                </div>
                <button
                  onClick={() => setReportingItem(null)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('reportReason')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Spam', 'Harassment', 'Inappropriate', 'Other'].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setReportReason(reason)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${reportReason === reason
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-muted border-border text-muted-foreground hover:border-primary/50'
                          }`}
                      >
                        {t(`reasons.${reason}` as any)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('additionalDetails')}</label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder={t('reportPlaceholder')}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-medium focus:border-primary/50 outline-none resize-none h-32 transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingItem(null)}
                    className="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                  >
                    {isSubmittingReport ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('submitting')}</span>
                      </div>
                    ) : (
                      t('submitReport')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
