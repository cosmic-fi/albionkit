'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { getItems, SimpleItem } from '@/lib/item-service';
import { ItemIcon } from './ItemIcon';
import { createPortal } from 'react-dom';

interface ItemSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: SimpleItem) => void;
  filter?: (item: SimpleItem) => boolean;
  title?: string;
}

export function ItemSelectorModal({ isOpen, onClose, onSelect, filter, title = "Select Item" }: ItemSelectorModalProps) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getItems().then(data => {
        setItems(data);
        setLoading(false);
        // Focus input after a short delay to allow render
        setTimeout(() => inputRef.current?.focus(), 100);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [isOpen]);

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
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:border-amber-500 outline-none transition-colors"
              placeholder="Search by name..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <Loader2 className="animate-spin h-8 w-8 mr-2" />
              Loading items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p>No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg text-left transition-colors group"
                >
                  <ItemIcon item={{ Type: item.id }} size={48} className="w-12 h-12" />
                  <div>
                    <div className="font-medium text-slate-200 group-hover:text-amber-400 transition-colors">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.id}</div>
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
