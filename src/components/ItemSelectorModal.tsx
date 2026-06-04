'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { getItems, searchItemsMultilingual, SimpleItem } from '@/lib/item-service';
import { ItemIcon } from './ItemIcon';
import { createPortal } from 'react-dom';
import { useTranslations, useLocale } from 'next-intl';
import { Preloader } from '@/components/Preloader';

interface ItemSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: SimpleItem) => void;
  filter?: (item: SimpleItem) => boolean;
  title?: string;
}

export function ItemSelectorModal({ isOpen, onClose, onSelect, filter, title }: ItemSelectorModalProps) {
  const t = useTranslations('Common');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getItems(locale).then(data => {
        setItems(data);
        setLoading(false);
        // Focus input after a short delay to allow render
        setTimeout(() => inputRef.current?.focus(), 100);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [isOpen, locale]);

  useEffect(() => {
    if (!items.length) return;
    
    const lower = query.toLowerCase();
    const results = items
      .filter(i => {
          if (query) {
            const matchesQuery = i.name.toLowerCase().includes(lower) || i.id.toLowerCase().includes(lower);
            if (!matchesQuery) return false;
          }
          if (filter) return filter(i);
          return true;
      })
      .slice(0, 50); // Limit results for performance
      
    setFilteredItems(results);
  }, [query, items, filter]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{title || t('selectItem')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-foreground focus:border-primary outline-none transition-colors"
              placeholder={t('searchByName')}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
            <Preloader size="lg" showText text={t('loadingItems')} />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p>{t('noItemsFound')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg text-left transition-colors group"
                >
                  <ItemIcon item={{ Type: item.id }} size={48} className="w-12 h-12" />
                  <div>
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.id}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
