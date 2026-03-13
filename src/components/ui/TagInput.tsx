import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ label, value = [], onChange, placeholder, className = '' }: TagInputProps) {
  const t = useTranslations('Common');
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const trimmedInput = inputValue.trim().replace(/,/g, '');
    if (trimmedInput && !value.includes(trimmedInput)) {
      onChange([...value, trimmedInput]);
      setInputValue('');
    } else if (trimmedInput === '') {
        setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const tags = Array.isArray(value) ? value : [];

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>}
      <div 
        className={`
          flex flex-wrap items-center gap-2 px-3 py-2 bg-background border rounded-lg transition-colors cursor-text min-h-[42px]
          ${isFocused ? 'border-primary ring-1 ring-primary/20' : 'border-input hover:border-input/80'}
        `}
        onClick={handleContainerClick}
      >
        {tags.map((tag, index) => (
          <div 
            key={`${tag}-${index}`} 
            className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm group border border-border"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="text-muted-foreground hover:text-destructive transition-colors rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
              setIsFocused(false);
              addTag(); // Auto-add on blur
          }}
          onFocus={() => setIsFocused(true)}
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground min-w-[120px]"
          placeholder={value.length === 0 ? placeholder : ''}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{t('tagInputHint')}</p>
    </div>
  );
}
