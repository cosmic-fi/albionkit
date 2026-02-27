'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Plus } from 'lucide-react';
import { searchAlbionItems } from './actions';
import { SimpleItem } from '@/lib/item-service';

interface ItemSearchProps {
  onAddItem: (itemId: string, item?: SimpleItem) => void;
  existingItems: Set<string>;
  value?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ItemSearch({ 
  onAddItem, 
  existingItems, 
  value, 
  onSearchChange,
  placeholder = "Search any item (e.g. Kingmaker, T8 Bag)...",
  className
}: ItemSearchProps) {
  const [internalQuery, setInternalQuery] = useState('');
  const [results, setResults] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const query = value !== undefined ? value : internalQuery;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const items = await searchAlbionItems(query);
          setResults(items);
          setIsOpen(true);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onSearchChange) {
      onSearchChange(newValue);
    } else {
      setInternalQuery(newValue);
    }
  };

  return (
    <div className={`relative w-full ${className || ''}`} ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground transition-all"
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg  max-h-60 overflow-y-auto backdrop-blur-sm">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
            Add to tracking
          </div>
          {results.map((item) => {
            const isAdded = existingItems.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!isAdded) {
                    onAddItem(item.id, item);
                    // Don't clear query if controlled, but maybe close dropdown?
                    setIsOpen(false);
                  }
                }}
                disabled={isAdded}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-accent/50 transition-colors ${
                  isAdded ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <img 
                    src={`https://render.albiononline.com/v1/item/${item.id}.png`}
                    alt="" 
                    className="w-6 h-6 object-contain opacity-80"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <div>
                    <div className="text-foreground font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.id}</div>
                  </div>
                </div>
                {isAdded ? (
                  <span className="text-xs text-success font-medium">Added</span>
                ) : (
                  <Plus className="h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
