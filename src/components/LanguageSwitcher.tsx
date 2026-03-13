'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { setLocale } from '@/app/actions/locale';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'pl', label: 'Polish', native: 'Polski' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'ko', label: 'Korean', native: '한국어' },
];

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const currentLanguage = LANGUAGES.find(l => l.code === currentLocale) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = async (locale: string) => {
    if (locale === currentLocale) {
      setIsOpen(false);
      return;
    }

    await setLocale(locale);
    setIsOpen(false);
    // Force a full page reload to apply the new locale
    window.location.href = window.location.pathname;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors border border-transparent hover:border-border"
        title="Change Language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden lg:inline uppercase">{currentLocale}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-xl overflow-hidden z-[70] shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1 max-h-[400px] overflow-y-auto">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLocaleChange(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                  currentLocale === lang.code 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span>{lang.native}</span>
                  <span className="text-[10px] opacity-60 font-normal">{lang.label}</span>
                </div>
                {currentLocale === lang.code && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
