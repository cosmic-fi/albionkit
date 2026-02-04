'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ItemIcon } from './ItemIcon';
import { ItemSelectorModal } from './ItemSelectorModal';
import { Tooltip } from './ui/Tooltip';
import { SimpleItem } from '@/lib/item-service';

const formatItemName = (id: string) => {
  if (!id) return '';
  return id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

interface EquipmentSlotProps {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  alternatives?: string[];
  onAlternativesChange?: (alts: string[]) => void;
  filter?: (item: SimpleItem) => boolean;
  placeholderIcon?: React.ReactNode;
  disabled?: boolean;
}

export function EquipmentSlot({ 
  label, 
  value, 
  onChange, 
  alternatives = [], 
  onAlternativesChange, 
  filter,
  placeholderIcon,
  disabled = false,
}: EquipmentSlotProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'main' | 'alt'>('main');

  const handleSelect = (item: SimpleItem) => {
    if (selectingFor === 'main') {
      onChange(item.id);
    } else {
      if (onAlternativesChange && !alternatives.includes(item.id)) {
        onAlternativesChange([...alternatives, item.id]);
      }
    }
    setIsModalOpen(false);
  };

  const removeAlt = (altId: string) => {
    if (onAlternativesChange) {
      onAlternativesChange(alternatives.filter(id => id !== altId));
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        {/* Slot Label */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
          {label}
        </div>

        {/* Main Slot */}
        <Tooltip content={value ? formatItemName(value) : (disabled ? `${label} (Disabled)` : label)}>
          <div 
            onClick={() => {
              if (!disabled) {
                setSelectingFor('main');
                setIsModalOpen(true);
              }
            }}
            className={`
              w-24 h-24 rounded-xl border-1 transition-all relative overflow-hidden flex items-center justify-center
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              ${value 
                ? 'bg-muted border-border hover:border-primary/50' 
                : 'bg-muted/50 border-border border-dashed hover:border-foreground/50 hover:bg-muted'
              }
            `}
          >
            {value ? (
              <>
                <ItemIcon 
                  item={{ Type: value }} 
                  size={96} 
                  className={`w-full h-full object-contain p-0 ${disabled ? 'opacity-50 grayscale' : ''}`} 
                />
                {/* Remove Button */}
                {!disabled && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(undefined);
                    }}
                    className="absolute top-1 right-1 p-0.5 bg-background/80 rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </>
            ) : (
              <div className="text-muted-foreground">
                  {placeholderIcon || <Plus className="h-8 w-8 opacity-20" />}
              </div>
            )}
          </div>
        </Tooltip>

        {/* Alternatives Section */}
        {onAlternativesChange && !disabled && (
          <div className="mt-2 mb-2 flex flex-wrap justify-center gap-1 max-w-[120px]">
            {alternatives.map(alt => (
              <Tooltip key={alt} content={formatItemName(alt)}>
                <div 
                  className="relative group/alt w-8 h-8 bg-muted border border-border rounded cursor-pointer"
                >
                  <ItemIcon item={{ Type: alt }} size={32} className="w-full h-full p-0.5" />
                  <button
                     onClick={(e) => {
                       e.stopPropagation(); // Stop tooltip or other events
                       removeAlt(alt);
                     }}
                     className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 text-destructive-foreground opacity-0 group-hover/alt:opacity-100 transition-opacity"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </div>
              </Tooltip>
            ))}
            
            {/* Add Alt Button - Limited to 1 alternative */}
            {value && alternatives.length < 1 && (
                <Tooltip content="Add Alternative">
                  <button
                  onClick={() => {
                      setSelectingFor('alt');
                      setIsModalOpen(true);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded border border-border border-dashed hover:border-foreground/50 hover:bg-muted text-muted-foreground transition-colors"
                  >
                  <Plus className="h-3 w-3" />
                  </button>
                </Tooltip>
            )}
          </div>
        )}
      </div>
      
      {/* Item Selector Modal */}
      <ItemSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        filter={filter}
        title={selectingFor === 'main' ? `Select ${label}` : `Select Alternative ${label}`}
      />
    </div>
  );
}
