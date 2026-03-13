'use client';

import { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { getItemNameService } from '@/lib/item-service';
import { useLocale } from 'next-intl';

interface ItemIconProps {
  item?: {
    Type?: string; // ZvZ tracker uses Type
    id?: string;   // Other places use id
    Count?: number;
    Quality?: number;
  } | string | null; // Allow passing just the ID string
  itemId?: string; // Explicit ID override
  count?: number;
  quality?: number;
  enchantment?: number;
  size?: number;
  className?: string;
  alt?: string;
  showTooltip?: boolean; // Show localized name on hover
}

export function ItemIcon({
  item,
  itemId,
  count = 1,
  quality = 1,
  enchantment,
  size = 64,
  className = "",
  alt = "Item",
  showTooltip = true
}: ItemIconProps) {
  const locale = useLocale();
  const [error, setError] = useState(false);
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);
  const [localizedName, setLocalizedName] = useState<string | null>(null);

  // Reset error when item changes
  useEffect(() => {
    let newId = itemId;
    if (!newId && typeof item === 'string') {
      newId = item;
    } else if (!newId && item && typeof item === 'object') {
      newId = item.Type || item.id;
    }

    if (newId !== currentId) {
      setCurrentId(newId);
      setError(false);
      setLocalizedName(null);
    }
  }, [item, itemId, currentId]);

  // Fetch localized name
  useEffect(() => {
    if (!currentId || !showTooltip) return;
    
    let id = currentId;
    // Remove enchantment for name lookup
    if (id.includes('@')) {
      id = id.split('@')[0];
    }
    
    getItemNameService(id, locale).then(name => {
      if (name) setLocalizedName(name);
    });
  }, [currentId, locale, showTooltip]);

  // Resolve values for rendering
  let id = currentId;
  let itemCount = count;
  let itemQuality = quality;

  // Re-calculate values if needed
  if (!id) {
    let tempId = itemId;
    if (!tempId && typeof item === 'string') {
      tempId = item;
    } else if (!tempId && item && typeof item === 'object') {
      tempId = item.Type || item.id;
    }
    id = tempId;
  }

  // Handle enchantment logic
  if (id && enchantment !== undefined) {
    // Remove existing enchantment if present to avoid double suffix
    const baseId = id.split('@')[0];
    id = `${baseId}@${enchantment}`;
  }

  if (item && typeof item === 'object') {
    itemCount = item.Count || count;
    itemQuality = item.Quality || quality;
  }

  if (!id || error) {
    return (
      <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`} title={alt}>
        <ImageOff className="w-1/2 h-1/2 opacity-50" />
      </div>
    );
  }

  const src = `https://render.albiononline.com/v1/item/${id}.png?count=${itemCount}&quality=${itemQuality}&size=${size}`;
  
  // Use localized name for tooltip if available, otherwise use alt
  const tooltip = localizedName || alt;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
      title={showTooltip ? tooltip : undefined}
    />
  );
}
