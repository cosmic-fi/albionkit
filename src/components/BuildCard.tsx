'use client';

import { ThumbsUp, MessageSquare, User, Eye, Star, Heart } from 'lucide-react';
import { Build } from '@/lib/builds-service';
import { ItemIcon } from '@/components/ItemIcon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface BuildCardProps {
  build: Build;
  compactMode?: boolean;
}

export function BuildCard({ build, compactMode = false }: BuildCardProps) {
  const t = useTranslations('Builds');
  const router = useRouter();

  // Guard clause for undefined build
  if (!build) return null;

  const categoryKey = build.category ? build.category.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) : 'solo';
  const buildLink = `/builds/${build.category || 'solo'}/${build.id}`;
  const authorLink = `/user/${build.authorId}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on a link or button
    if ((e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(buildLink);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-card/50 border border-border rounded-xl ${compactMode ? 'p-3' : 'p-4'} transition-all cursor-pointer group h-full flex flex-col relative`}
    >
      <div className={`flex items-start justify-between ${compactMode ? 'mb-2' : 'mb-4'}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <ItemIcon item={build.items.MainHand} size={compactMode ? 48 : 64} className={`${compactMode ? 'w-10 h-10' : 'w-14 h-14'} object-contain bg-muted/50 rounded-lg border border-border/50`} alt={build.items.MainHand?.Type || 'Main Hand'} />
            {build.items.OffHand && (
              <div className={`absolute -bottom-0.5 -right-2 ${compactMode ? 'w-6 h-6' : 'w-8 h-8'} rounded-md bg-card border border-border z-10 overflow-hidden`}>
                <ItemIcon item={build.items.OffHand} size={32} className="w-full h-full object-contain" alt={build.items.OffHand.Type || 'Off Hand'} />
              </div>
            )}
          </div>
          <div>
            <h3 className={`font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 ${compactMode ? 'text-sm' : 'text-base'}`}>{build.title}</h3>
            <Link
              href={authorLink}
              className="flex items-center gap-2 text-xs text-muted-foreground mt-1 hover:text-primary transition-colors w-fit relative z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <User className="h-3 w-3" />
              <span>{build.authorName}</span>
            </Link>
          </div>
        </div>
        {build.rating > 0 && (
          <div className="px-2 py-1 bg-primary/10 rounded text-xs font-bold text-primary border border-primary/20 flex items-center gap-1">
            <Star className="h-3 w-3 fill-primary" />
            {build.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Equipment Preview (Small icons) */}
      <div className="flex gap-1 mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
        {[build.items.Head, build.items.Armor, build.items.Shoes, build.items.Cape].map((item, i) => (
          item && <ItemIcon key={i} item={item} size={32} className="w-6 h-6 object-contain bg-muted rounded border border-border" alt={item.Type || 'Item'} />
        ))}
      </div>

      <div className="flex flex-wrap flex-row justify-start gap-2 mb-2 mt-auto">
        <span className="px-2 py-0.5 bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-wider rounded border border-border">
          {t(categoryKey)}
        </span>
        {build.tags?.slice(0, 2).map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-muted/50 text-muted-foreground text-[10px] rounded border border-border">
            {t(`tagOptions.${tag === 'Escape/Gathering' ? 'EscapeGathering' : tag}`)}
          </span>
        ))}
        {(build.tags?.length || 0) > 2 && (
          <span className="px-2 py-0.5 bg-muted/50 text-muted-foreground text-[10px] rounded border border-border cursor-help relative group/tooltip">
            +{build.tags!.length - 2}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:block z-50 w-max max-w-[200px]">
              <div className="bg-popover border border-border rounded p-2 text-xs text-popover-foreground flex flex-wrap gap-1 justify-end">
                {build.tags!.slice(2).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-muted rounded border border-border whitespace-nowrap">
                    {t(`tagOptions.${tag === 'Escape/Gathering' ? 'EscapeGathering' : tag}`)}
                  </span>
                ))}
              </div>
            </div>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>{build.ratingCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{build.likes || 0}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span>{build.views}</span>
        </div>
      </div>
    </div>
  );
}
