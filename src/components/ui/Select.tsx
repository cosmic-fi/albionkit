import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Option<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps<T extends string | number> {
  label?: React.ReactNode;
  options: Option<T>[];
  value?: T;
  onChange: (value: T) => void;
  containerClassName?: string;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  onSearchTermChange?: (term: string) => void;
}

export function Select<T extends string | number>({
  label,
  options,
  value,
  onChange,
  containerClassName = '',
  className = '',
  placeholder = 'Select an option',
  searchable = false,
  onSearchTermChange
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening if searchable
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm(''); // Reset search when closed? Or keep it? keeping it empty is safer for display
      if (onSearchTermChange) onSearchTermChange('');
    }
  }, [isOpen, searchable]); // Removed onSearchTermChange dependency to avoid loop if it's not memoized

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (onSearchTermChange) {
      onSearchTermChange(term);
    }
  };

  const filteredOptions = searchable && !onSearchTermChange
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={containerClassName} ref={containerRef}>
      {label && (
        <div className="block flex items-center gap-1 text-sm font-medium text-muted-foreground mb-1">
          {label}
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-background border border-input rounded-lg px-4 py-2 text-left flex items-center justify-between focus:border-primary outline-none transition-colors ${className}`}
        >
          <span className={`flex items-center gap-2 ${selectedOption ? 'text-foreground' : 'text-muted-foreground'}`}>
            {selectedOption?.icon}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg max-h-60 overflow-hidden flex flex-col">
            {searchable && (
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search..."
                    className="w-full bg-background border border-input rounded-md py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            <div className="overflow-auto flex-1 p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors
                      ${option.value === value
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </span>
                    {option.value === value && <Check className="h-4 w-4" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
