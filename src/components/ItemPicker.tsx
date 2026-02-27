'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { getItems, SimpleItem } from '@/lib/item-service';
import { ItemIcon } from './ItemIcon';

interface ItemPickerProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filter?: (item: SimpleItem) => boolean;
}

export function ItemPicker({ label, value, onChange, placeholder, filter }: ItemPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load items once
    getItems().then(setItems).catch(console.error);
  }, []);

  useEffect(() => {
    if (!query) {
      setFilteredItems([]);
      return;
    }
    const lower = query.toLowerCase();
    setFilteredItems(
      items
        .filter(i => {
            const matchesQuery = i.name.toLowerCase().includes(lower) || i.id.toLowerCase().includes(lower);
            if (!matchesQuery) return false;
            if (filter) return filter(i);
            return true;
        })
        .slice(0, 50)
    );
  }, [query, items, filter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SimpleItem) => {
    onChange(item.id);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
      
      {value ? (
        <div className="flex items-center gap-3 p-2 bg-muted border border-border rounded-lg group">
          <ItemIcon item={{ Type: value }} size={48} className="w-12 h-12" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{value}</div>
          </div>
          <button 
            onClick={() => onChange('')}
            className="p-1 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div 
            className="flex items-center gap-2 w-full p-2 bg-background border border-border rounded-lg focus-within:border-primary transition-colors cursor-text"
            onClick={() => setIsOpen(true)}
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-muted-foreground"
              placeholder={placeholder || "Search item..."}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
          </div>

          {isOpen && query && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg  max-h-60 overflow-y-auto">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-3 transition-colors"
                    onClick={() => handleSelect(item)}
                  >
                    <ItemIcon item={{ Type: item.id }} size={32} className="w-8 h-8 object-contain" />
                    <span className="text-sm text-foreground truncate">{item.name}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">No items found</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
