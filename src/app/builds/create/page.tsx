'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/PageShell';
import { InfoStrip } from '@/components/InfoStrip';
import { EquipmentSlot } from '@/components/EquipmentSlot';
import { Select } from '@/components/ui/Select';
import { TagInput } from '@/components/ui/TagInput';
import { createBuild, BuildCategory, BuildEquipment } from '@/lib/builds-service';
import { LoginModal } from '@/components/auth/LoginModal';
import { Loader2, Save, ArrowLeft, Info, Shield } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function CreateBuildPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    longDescription: '',
    category: 'solo' as BuildCategory,
    youtubeLink: '',
  });

  const [items, setItems] = useState<BuildEquipment>({});

  // Track unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.title !== '' ||
      formData.description !== '' ||
      formData.longDescription !== '' ||
      formData.youtubeLink !== '' ||
      Object.keys(items).length > 0;

    setIsDirty(hasChanges);
  }, [formData, items]);

  // Warn before leaving page (browser refresh/close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, submitting]);

  // Advanced Details
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [mobility, setMobility] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState<string[]>([]);

  const tagOptions = ['PvP', 'PvE', 'ZvZ', 'Escape/Gathering', 'Ganking', 'Other'];

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleItemChange = (slot: keyof BuildEquipment, type: string | undefined) => {
    setItems(prev => {
      if (!type) {
        const next = { ...prev };
        delete next[slot];
        return next;
      }

      const newState = {
        ...prev,
        [slot]: { ...prev[slot], Type: type }
      };

      // If selecting a 2H weapon, clear the OffHand
      if (slot === 'MainHand' && type.includes('_2H_')) {
        delete newState.OffHand;
      }

      return newState;
    });
  };

  const handleAlternativesChange = (slot: keyof BuildEquipment, alts: string[]) => {
    setItems(prev => {
      const existing = prev[slot];
      if (!existing && alts.length > 0) return prev;

      return {
        ...prev,
        [slot]: { ...existing!, Alternatives: alts }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/builds');
      return;
    }
    if (!formData.title) return toast.error('Title is required');
    if (!items.MainHand) return toast.error('Main Hand weapon is required');

    setSubmitting(true);
    try {
      await createBuild({
        ...formData,
        items,
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || 'Anonymous',
        strengths,
        weaknesses,
        mobility,
        tags,
      });
      router.push(`/builds/${formData.category}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create build');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-muted-foreground">
      <Loader2 className="animate-spin mr-2" /> Loading...
    </div>
  );

  const categoryOptions = [
    { value: 'solo', label: 'Solo' },
    { value: 'small-scale', label: 'Small Scale' },
    { value: 'pvp', label: 'PvP' },
    { value: 'zvz', label: 'ZvZ' },
    { value: 'large-scale', label: 'Large Scale' },
    { value: 'group', label: 'Group' },
  ];

  const mobilityOptions = [
    { value: 'low', label: 'Low Mobility' },
    { value: 'medium', label: 'Medium Mobility' },
    { value: 'high', label: 'High Mobility' },
  ];

  const isMainHand2H = items.MainHand?.Type?.includes('_2H_') || false;

  return (
    <PageShell title="Create Build" description="Share your knowledge with the community">
      <LoginModal
        isOpen={!user}
        onClose={() => {
          if (!user) router.push('/builds');
        }}
        message="You need to be logged in to create a build."
      />

      {user && !user.emailVerified ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-amber-500/10 p-6 rounded-full mb-6 ring-1 ring-amber-500/20">
            <Shield className="h-12 w-12 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">Email Verification Required</h2>
          <p className="text-muted-foreground max-w-md mb-8 text-lg">
            To maintain the quality of our community builds, we require all accounts to be verified.
            Please check your email inbox for a verification link or use the banner at the top of the page to resend it.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()} variant="default">
              I've Verified
            </Button>
            <Button onClick={() => router.push('/builds')} variant="outline">
              Return to Builds
            </Button>
          </div>
        </div>
      ) : user && (
        <>
          <style jsx global>{`
        .w-md-editor-fullscreen {
          background-color: var(--background) !important;
          z-index: 2147483647 !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
        }
        .w-md-editor-toolbar {
           background-color: var(--card) !important;
           border-bottom: 1px solid var(--border) !important;
           padding-block: 10px;
           font-size: 16px
        }
        .w-md-editor-toolbar button{
          font-size: 18px !important
        }
        .w-md-editor-preview {
           background-color: var(--background) !important;
           box-shadow: none !important;
        }
      `}</style>
          <div className="max-w-7xl mx-auto">
            <Link
              href="/builds/solo"
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
              onClick={(e) => {
                if (isDirty && !confirm('You have unsaved changes. Are you sure you want to discard them?')) {
                  e.preventDefault();
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Builds
            </Link>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left Column: Equipment (Paperdoll) */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-card/50 border border-border rounded-xl p-4">
                    <h3 className="text-lg font-bold text-foreground mb-9 pb-2 border-b border-border flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Equipment
                    </h3>

                    {/* Albion-style Grid */}
                    <div className="flex flex-col items-center gap-6">
                      {/* Row 1: [Bag] [Head] [Cape] */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="opacity-30 pointer-events-none grayscale">
                          <EquipmentSlot label="Bag" onChange={() => { }} placeholderIcon={<span className="text-xs">BAG</span>} />
                        </div>
                        <EquipmentSlot
                          label="Head"
                          value={items.Head?.Type}
                          onChange={v => handleItemChange('Head', v)}
                          alternatives={items.Head?.Alternatives}
                          onAlternativesChange={alts => handleAlternativesChange('Head', alts)}
                          filter={i => i.id.includes('_HEAD_')}
                        />
                        <EquipmentSlot
                          label="Cape"
                          value={items.Cape?.Type}
                          onChange={v => handleItemChange('Cape', v)}
                          alternatives={items.Cape?.Alternatives}
                          onAlternativesChange={alts => handleAlternativesChange('Cape', alts)}
                          filter={i => i.id.includes('_CAPE')}
                        />
                      </div>

                      {/* Row 2: [Main] [Armor] [Off] */}
                      <div className="grid grid-cols-3 gap-4">
                        <EquipmentSlot
                          label="Main Hand"
                          value={items.MainHand?.Type}
                          onChange={v => handleItemChange('MainHand', v)}
                          alternatives={items.MainHand?.Alternatives}
                          onAlternativesChange={alts => handleAlternativesChange('MainHand', alts)}
                          filter={i => i.id.includes('_MAIN_') || i.id.includes('_2H_')}
                        />
                        <EquipmentSlot
                          label="Armor"
                          value={items.Armor?.Type}
                          onChange={v => handleItemChange('Armor', v)}
                          alternatives={items.Armor?.Alternatives}
                          onAlternativesChange={alts => handleAlternativesChange('Armor', alts)}
                          filter={i => i.id.includes('_ARMOR_')}
                        />
                        <EquipmentSlot
                          label="Off Hand"
                          value={isMainHand2H ? items.MainHand?.Type : items.OffHand?.Type}
                          onChange={v => handleItemChange('OffHand', v)}
                          alternatives={items.OffHand?.Alternatives}
                          onAlternativesChange={alts => handleAlternativesChange('OffHand', alts)}
                          filter={i => i.id.includes('_OFF_') || i.id.includes('_SHIELD') || i.id.includes('_TORCH') || i.id.includes('_BOOK') || i.id.includes('_TOTEM') || i.id.includes('_HORN') || i.id.includes('_LAMP') || i.id.includes('_CENSER')}
                          disabled={isMainHand2H}
                        />
                      </div>

                      {/* Row 3: [Potion] [Shoes] [Food] */}
                      <div className="grid grid-cols-3 gap-4">
                        <EquipmentSlot
                          label="Potion"
                          value={items.Potion?.Type}
                          onChange={v => handleItemChange('Potion', v)}
                          alternatives={items.Potion?.Alternatives}
                          onAlternativesChange={alts => handleAlternativesChange('Potion', alts)}
                          filter={i => i.id.includes('_POTION_')}
                        />
                        <EquipmentSlot
                          label="Shoes"
                          value={items.Shoes?.Type}
                          onChange={v => handleItemChange('Shoes', v)}
                          alternatives={items.Shoes?.Alternatives}
                          onAlternativesChange={alts => handleAlternativesChange('Shoes', alts)}
                          filter={i => i.id.includes('_SHOES_')}
                        />
                        <EquipmentSlot
                          label="Food"
                          value={items.Food?.Type}
                          onChange={v => handleItemChange('Food', v)}
                          alternatives={items.Food?.Alternatives}
                          onAlternativesChange={alts => handleAlternativesChange('Food', alts)}
                          filter={i => i.id.includes('_MEAL_')}
                        />
                      </div>

                      {/* Row 4: [Mount] */}
                      <div className="grid grid-cols-3 gap-4">
                        <div></div>
                        <div className="opacity-30 pointer-events-none grayscale">
                          <EquipmentSlot label="Mount" onChange={() => { }} placeholderIcon={<span className="text-xs">Mount</span>} />
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Details & Description */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Basic Info */}
                  <div className="bg-card/50 border border-border rounded-xl p-4">
                    <h3 className="text-lg font-bold text-foreground mb-4 pb-2 flex items-center border-b border-border gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Build Details
                    </h3>
                    <div className="grid gap-6">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Build Title</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-background border border-input rounded-lg px-4 py-2 text-foreground focus:border-primary outline-none transition-colors"
                          placeholder="e.g. 1H Sword Mist Fighter"
                          value={formData.title}
                          onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select
                          label="Category"
                          options={categoryOptions}
                          value={formData.category}
                          onChange={value => setFormData({ ...formData, category: value as BuildCategory })}
                        />
                        <Select
                          label="Mobility"
                          options={mobilityOptions}
                          value={mobility}
                          onChange={value => setMobility(value as any)}
                        />
                      </div>

                      {/* Tags Selection */}
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {tagOptions.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`
                                            px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                                            ${tags.includes(tag)
                                  ? 'bg-primary/20 text-primary border-primary/50'
                                  : 'bg-card/50 text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
                                }
                                        `}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">YouTube Video (Optional)</label>
                        <input
                          type="url"
                          className="w-full bg-background border border-input rounded-lg px-4 py-2 text-foreground focus:border-primary outline-none transition-colors"
                          placeholder="https://youtube.com/watch?v=..."
                          value={formData.youtubeLink}
                          onChange={e => setFormData({ ...formData, youtubeLink: e.target.value })}
                        />
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TagInput
                          label="Strengths"
                          value={strengths}
                          onChange={setStrengths}
                          placeholder="e.g. High DPS, Fast Clear, Cheap"
                        />
                        <TagInput
                          label="Weaknesses"
                          value={weaknesses}
                          onChange={setWeaknesses}
                          placeholder="e.g. Low Mobility, Expensive, Squishy"
                        />
                      </div>

                      {/* Description Editor */}

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Short Description</label>
                        <textarea
                          required
                          rows={3}
                          className="w-full bg-background border border-input rounded-lg px-4 py-2 text-foreground focus:border-primary outline-none transition-colors"
                          placeholder="Brief summary of the build..."
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Guide - Full Width */}
              <div className="w-full bg-card/50 border border-border rounded-xl p-5" data-color-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}>
                <h3 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-border">Detailed Guide</h3>
                <div className="bg-background border border-input rounded-lg overflow-hidden">
                  <MDEditor
                    value={formData.longDescription}
                    onChange={(val) => setFormData({ ...formData, longDescription: val || '' })}
                    preview="edit"
                    height={500}
                    style={{ backgroundColor: 'transparent', color: 'hsl(var(--foreground))' }}
                    textareaProps={{
                      placeholder: "Write a detailed guide about how to play this build, matchups, rotations, etc..."
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 pb-12">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                  Publish Build
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      <InfoStrip currentPage="builds" />
    </PageShell>
  );
}
