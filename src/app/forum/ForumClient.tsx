'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '@/components/PageShell';
import { useAuth } from '@/context/AuthContext';
import { Thread, ThreadCategory, ServerRegion } from '@/lib/community-service';
import { likeThreadAction, getThreadsAction } from '@/app/actions/community';
import {
  MessageCircle,
  Plus,
  Search,
  MessageSquare,
  User,
  Clock,
  Filter,
  ChevronRight,
  Loader2,
  TrendingUp,
  ThumbsUp,
  Pin,
  Lock,
  Globe,
  Users,
  Shield,
  Coins,
  Sword,
  Target,
  Trophy,
  AlertCircle,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { useLoginModal } from '@/context/LoginModalContext';
import { useTranslations } from 'next-intl';

// Helper to strip markdown and HTML for plain text previews
const stripMarkdown = (text: string) => {
  if (!text) return '';
  return text
    // Remove HTML tags
    .replace(/<[^>]*>?/gm, '')
    // Remove Markdown images entirely
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove Markdown links (keep link text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove Markdown formatting (bold, italic, strikethrough)
    .replace(/[*_~`]{1,3}/g, '')
    // Remove Markdown headers and blockquotes
    .replace(/^[#>-\s]+/gm, '')
    // Collapse multiple spaces/newlines
    .replace(/\s+/g, ' ')
    .trim();
};

export default function CommunityClient({ initialThreads }: { initialThreads: Thread[] }) {
  const t = useTranslations('Community');
  const { user } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ThreadCategory | 'All'>('All');
  const [server, setServer] = useState<ServerRegion>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(142);

  const [isInitialMount, setIsInitialMount] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const CATEGORIES: { id: ThreadCategory; label: string; icon: any; color: string }[] = [
    { id: 'General', label: t('categories.General'), icon: MessageCircle, color: 'text-blue-400' },
    { id: 'Builds', label: t('categories.Builds'), icon: Shield, color: 'text-orange-400' },
    { id: 'Market', label: t('categories.Market'), icon: Coins, color: 'text-yellow-400' },
    { id: 'PvP', label: t('categories.PvP'), icon: Sword, color: 'text-red-400' },
    { id: 'Guilds', label: t('categories.Guilds'), icon: Users, color: 'text-purple-400' },
    { id: 'Recruitment', label: t('categories.Recruitment'), icon: Target, color: 'text-green-400' },
    { id: 'LFG', label: t('categories.LFG'), icon: Trophy, color: 'text-pink-400' },
    { id: 'Trading', label: t('categories.Trading'), icon: Coins, color: 'text-emerald-400' },
    { id: 'Guides', label: t('categories.Guides'), icon: Target, color: 'text-indigo-400' },
    { id: 'Announcements', label: t('categories.Announcements'), icon: AlertCircle, color: 'text-red-500' },
    { id: 'Official', label: t('categories.Official'), icon: Shield, color: 'text-blue-500' },
    { id: 'News', label: t('categories.News'), icon: AlertCircle, color: 'text-sky-400' },
  ];

  const SERVERS: ServerRegion[] = ['All', 'Americas', 'Asia', 'Europe'];

  useEffect(() => {
    setIsMounted(true);
    setOnlineUsers(Math.floor(Math.random() * 50) + 120); // Random initial users

    const interval = setInterval(() => {
      setOnlineUsers(prev => Math.max(1, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 15000);

    if (isInitialMount) {
      setIsInitialMount(false);
      return () => clearInterval(interval);
    }
    fetchThreads();

    return () => clearInterval(interval);
  }, [category, server]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const result = await getThreadsAction({
        category: category === 'All' ? undefined : category,
        server: server === 'All' ? undefined : server
      });

      if (result.success) {
        setThreads(result.threads);
      } else {
        setThreads([]);
        toast.error(result.error || t('failedToLoad'));
      }
    } catch (err) {
      setThreads([]);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (threadId: string) => {
    if (!user) {
      openLoginModal(t('signInToLike'));
      return;
    }
    const result = await likeThreadAction(threadId, user.uid);
    if (result.success) {
      fetchThreads();
    }
  };

  const filteredThreads = threads.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageShell
      title={t('title')}
      description={t('description')}
      icon={<MessageCircle className="h-6 w-6" />}
      headerActions={
        <Link
          href="/forum/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
        >
          <Plus className="h-4 w-4" />
          {t('startThread')}
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('serverRegion')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {SERVERS.map(s => (
                <button
                  key={s}
                  onClick={() => setServer(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${server === s
                    ? 'bg-primary border-primary text-primary-foreground '
                    : 'bg-muted border-border text-muted-foreground hover:border-primary/50'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('discussionType')}
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setCategory('All')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${category === 'All' ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4" />
                  {t('allDiscussions')}
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${category === 'All' ? 'rotate-90 opacity-100' : 'opacity-0'}`} />
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${category === cat.id ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <cat.icon className={`h-4 w-4 ${cat.color}`} />
                    {cat.label}
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${category === cat.id ? 'rotate-90 opacity-100' : 'opacity-0'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 text-primary">
              <Users className="h-24 w-24 -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-700 ease-out" />
            </div>
            <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-5 relative z-10 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('communityStats')}
            </h3>
            <div className="space-y-5 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('totalThreads')}</span>
                <span className="text-lg font-black text-foreground leading-none">{threads.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('activeUsers')}</span>
                <div className="flex items-center gap-2 bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-black text-green-500">{onlineUsers} {t('online')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 z-10 bg-background/40 backdrop-blur-[1px] flex items-center justify-center rounded-2xl transition-all">
                <div className="flex flex-col items-center gap-3 bg-card border border-border p-6 rounded-2xl">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs font-semibold text-muted-foreground animate-pulse">{t('searching')}</p>
                </div>
              </div>
            )}

            {filteredThreads.length === 0 && !loading ? (
              <div className="bg-card border border-border border-dashed rounded-2xl py-24 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('noThreads')}</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto font-medium">{t('noThreadsDesc')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredThreads.map(thread => {
                  const categoryInfo = CATEGORIES.find(c => c.id === thread.category) || CATEGORIES[0];
                  return (
                    <div key={thread.id} className="group bg-card hover:bg-primary/[0.01] border border-border hover:border-primary/30 rounded-2xl p-5 transition-all relative overflow-hidden">
                      <div className={`absolute top-0 left-0 bottom-0 w-1 ${categoryInfo.color.replace('text-', 'bg-')}`} />

                      <div className="flex gap-5">
                        <div className="flex flex-col items-center gap-1.5 shrink-0 pt-1">
                          <button
                            onClick={(e) => { e.preventDefault(); handleLike(thread.id); }}
                            className={`p-2.5 rounded-xl transition-all ${user && thread.likedBy?.includes(user.uid)
                              ? 'bg-primary text-primary-foreground scale-105'
                              : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                              }`}
                          >
                            <ThumbsUp className={`h-4 w-4 ${user && thread.likedBy?.includes(user.uid) ? 'fill-current' : ''}`} />
                          </button>
                          <span className="text-xs font-semibold text-foreground">{thread.likes || 0}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-border flex items-center gap-1.5 bg-muted/50 ${categoryInfo.color}`}>
                              <categoryInfo.icon className="h-3 w-3" />
                              {t(`categories.${thread.category}`)}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-border bg-secondary text-secondary-foreground">
                              {thread.server}
                            </span>
                            {thread.isPinned && (
                              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                                <Pin className="h-3 w-3 fill-current" /> {t('pinned')}
                              </span>
                            )}
                            {thread.activityType && (
                              <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full text-[10px] font-bold border border-orange-500/20">
                                {thread.activityType}
                              </span>
                            )}
                          </div>

                          <Link href={`/forum/thread/${thread.id}`} className="block group/title">
                            <h2 className="text-lg font-semibold text-foreground group-hover/title:text-primary transition-colors line-clamp-1 mb-2">
                              {thread.title}
                            </h2>
                          </Link>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed font-medium">
                            {stripMarkdown(thread.content)}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border relative">
                                {thread.authorPhotoURL ? (
                                  <img src={thread.authorPhotoURL} alt={thread.authorName} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-full h-full p-1.5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-foreground hover:text-primary cursor-pointer transition-colors leading-none mb-1 flex items-center gap-1.5">
                                  {thread.authorName}
                                  {thread.authorIsAdmin && (
                                    <span className="bg-primary/20 text-primary text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Shield className="h-2.5 w-2.5" /> {t('admin')}
                                    </span>
                                  )}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-tighter opacity-70">
                                  {thread.authorRank}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground/80">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {isMounted ? `${formatDistanceToNow(new Date(thread.createdAt))} ${t('ago')}` : '...'}
                              </div>
                              <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-lg">
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span className="font-semibold text-foreground">{thread.commentCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
