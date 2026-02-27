'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { useAuth } from '@/context/AuthContext';
import { ThreadCategory, ServerRegion } from '@/lib/community-service';
import { createThreadAction } from '@/app/actions/community';
import {
  Plus,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Shield,
  Coins,
  Sword,
  Target,
  Trophy,
  AlertCircle,
  Globe,
  Users,
  Eye,
  Save,
  Tag
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useLoginModal } from '@/context/LoginModalContext';
import dynamic from 'next/dynamic';
import { Select } from '@/components/ui/Select';
import { useTheme } from 'next-themes';

// Load Markdown Editor dynamically
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

const MarkdownViewer = dynamic<{ source: string | undefined }>(
  () => import('@uiw/react-md-editor').then((mod) => {
    const { Markdown } = mod.default as any;
    return Markdown || (() => null);
  }),
  { ssr: false }
);

const CATEGORIES: { value: ThreadCategory; label: string; icon: any; color: string; adminOnly?: boolean }[] = [
  { value: 'General', label: 'General Discussion', icon: <MessageCircle className="h-4 w-4" />, color: 'text-blue-400' },
  { value: 'Builds', label: 'Build Discussion', icon: <Shield className="h-4 w-4" />, color: 'text-orange-400' },
  { value: 'Market', label: 'Market Intel', icon: <Coins className="h-4 w-4" />, color: 'text-yellow-400' },
  { value: 'PvP', label: 'PvP Discussion', icon: <Sword className="h-4 w-4" />, color: 'text-red-400' },
  { value: 'Guilds', label: 'Guild Talk', icon: <Users className="h-4 w-4" />, color: 'text-purple-400' },
  { value: 'Recruitment', label: 'Guild Recruitment', icon: <Target className="h-4 w-4" />, color: 'text-green-400' },
  { value: 'LFG', label: 'Looking for Group (LFG)', icon: <Trophy className="h-4 w-4" />, color: 'text-pink-400' },
  { value: 'Trading', label: 'Trading & Deals', icon: <Coins className="h-4 w-4" />, color: 'text-emerald-400' },
  { value: 'Guides', label: 'Guides & Tutorials', icon: <Target className="h-4 w-4" />, color: 'text-indigo-400' },
  { value: 'Announcements', label: 'Announcements', icon: <AlertCircle className="h-4 w-4" />, color: 'text-red-500', adminOnly: true },
  { value: 'Official', label: 'Official', icon: <Shield className="h-4 w-4" />, color: 'text-blue-500', adminOnly: true },
  { value: 'News', label: 'Official News', icon: <AlertCircle className="h-4 w-4" />, color: 'text-sky-400', adminOnly: true },
];

const SERVERS: { value: ServerRegion; label: string; icon: any }[] = [
  { value: 'All', label: 'Global / All Servers', icon: <Globe className="h-4 w-4" /> },
  { value: 'Americas', label: 'Americas', icon: <Globe className="h-4 w-4 text-blue-400" /> },
  { value: 'Asia', label: 'Asia', icon: <Globe className="h-4 w-4 text-yellow-400" /> },
  { value: 'Europe', label: 'Europe', icon: <Globe className="h-4 w-4 text-emerald-400" /> },
];

export default function NewThreadClient() {
  const { user, profile } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string | undefined>('');
  const [category, setCategory] = useState<ThreadCategory>('General');
  const [server, setServer] = useState<ServerRegion>('All');
  const [guildName, setGuildName] = useState('');
  const [activityType, setActivityType] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();

      const restrictedTags = ['official', 'rules', 'guidelines', 'announcement', 'announcements', 'news', 'admin'];
      if (restrictedTags.includes(tag) && !profile?.isAdmin) {
        toast.error('Only admins can use official tags');
        setTagInput('');
        return;
      }

      if (tag && !tags.includes(tag) && tags.length < 5) {
        setTags([...tags, tag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      openLoginModal('Please sign in to post a thread');
      return;
    }

    if (title.length < 5) {
      toast.error('Title is too short');
      return;
    }

    if (!content || content.length < 10) {
      toast.error('Content is too short. Please provide more details.');
      return;
    }

    setIsSubmitting(true);
    const result = await createThreadAction({
      authorId: user.uid,
      authorName: profile.displayName || 'Anonymous',
      authorPhotoURL: profile.photoURL,
      authorRank: (profile as any).rank || 'Wanderer',
      title,
      content,
      category,
      server,
      tags,
      guildName: category === 'Recruitment' ? guildName : undefined,
      activityType: category === 'LFG' ? activityType : undefined
    });

    if (result.success) {
      toast.success('Thread created successfully!');
      router.push(`/community/thread/${result.threadId}`);
    } else {
      toast.error(result.error || 'Failed to create thread');
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Start a Discussion"
      description="Share your knowledge, recruit for your guild, or ask the community."
      icon={<Plus className="h-6 w-6" />}
      headerActions={
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Thread Title</label>
                  <span className={`text-[10px] font-bold ${title.length > 80 ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {title.length} / 100
                  </span>
                </div>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., How to optimize T8 refining in Martlock?"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-md text-foreground focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Content</label>
                    <span className="text-[10px] text-muted-foreground font-bold">
                      {(content?.length || 0).toLocaleString()} characters
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreview(!preview)}
                    className={`text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${preview
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      }`}
                  >
                    {preview ? <Save className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {preview ? 'Edit Mode' : 'Live Preview'}
                  </button>
                </div>

                <div data-color-mode={isMounted && resolvedTheme === 'dark' ? 'dark' : 'light'} className="rounded-xl overflow-hidden border border-border min-h-[400px]">
                  {isMounted ? (
                    preview ? (
                      <div className={`p-6 prose max-w-none min-h-[400px] bg-background ${resolvedTheme === 'dark' ? 'prose-invert' : ''}`}>
                        <MarkdownViewer source={content} />
                      </div>
                    ) : (
                      <MDEditor
                        value={content || ''}
                        onChange={setContent}
                        preview="edit"
                        height={400}
                        hideToolbar={false}
                        className="bg-background"
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center min-h-[400px] text-muted-foreground text-xs font-bold uppercase tracking-widest">
                      Loading Editor...
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground italic">Markdown is supported. You can add links, lists, and code blocks.</p>
              </div>

              {/* Tags Section */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5" />
                  Search Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 group animate-in zoom-in-95"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <Plus className="h-3 w-3 rotate-45" />
                      </button>
                    </span>
                  ))}
                  {tags.length < 5 && (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder={tags.length === 0 ? "Add tags (press Enter)..." : "Add more..."}
                      className="bg-transparent border-none outline-none text-xs text-foreground min-w-[120px]"
                    />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">Add up to 5 tags to help players find your discussion (e.g., mists, refining, zandri).</p>
              </div>
            </div>

            {/* Compact Publish Section below editor */}
            <div className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${title && content ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {title && content ? 'Ready to share' : 'Awaiting input'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title || !content}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Publish Discussion
                </button>
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-4 sticky top-24">
              <div className="bg-card border border-border rounded-xl p-5 space-y-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-border pb-3">
                  <Save className="h-3.5 w-3.5 text-primary" />
                  Settings
                </h3>

                <div className="space-y-4">
                  <Select
                    label="Category"
                    options={CATEGORIES.filter(c => !c.adminOnly || profile?.isAdmin)}
                    value={category}
                    onChange={(val) => setCategory(val as ThreadCategory)}
                    placeholder="Choose category"
                  />

                  <Select
                    label="Server"
                    options={SERVERS}
                    value={server}
                    onChange={(val) => setServer(val as ServerRegion)}
                    placeholder="Select server"
                  />

                  {category === 'Recruitment' && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Guild Name</label>
                      <input
                        required
                        type="text"
                        value={guildName}
                        onChange={(e) => setGuildName(e.target.value)}
                        placeholder="e.g., Blue Army"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-primary outline-none transition-all"
                      />
                    </div>
                  )}

                  {category === 'LFG' && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                      <label className="text-[13px] text-muted-foreground">Activity Type</label>
                      <input
                        required
                        type="text"
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value)}
                        placeholder="e.g., T8 Static, Ganking"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-primary outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Help Card */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  Quick Tips
                </h4>
                <ul className="space-y-2.5">
                  <li className="text-[10px] text-muted-foreground flex gap-2.5 leading-relaxed">
                    <span className="text-primary font-bold">01.</span>
                    <span>Use clear titles for better search results.</span>
                  </li>
                  <li className="text-[10px] text-muted-foreground flex gap-2.5 leading-relaxed">
                    <span className="text-primary font-bold">02.</span>
                    <span>Select the correct server region.</span>
                  </li>
                  <li className="text-[10px] text-muted-foreground flex gap-2.5 leading-relaxed">
                    <span className="text-primary font-bold">03.</span>
                    <span>Markdown lists and code blocks are supported.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
