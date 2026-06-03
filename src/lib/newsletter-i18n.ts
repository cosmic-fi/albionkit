import { readFileSync } from 'fs';
import { join } from 'path';

export type Locale = 'en' | 'tr' | 'de' | 'es' | 'fr' | 'ko' | 'pl' | 'pt' | 'ru' | 'zh';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'tr', 'de', 'es', 'fr', 'ko', 'pl', 'pt', 'ru', 'zh'];

const messagesCache = new Map<string, any>();

export function resolveLocale(locale?: string | null): Locale {
  if (!locale) return 'en';
  const lower = locale.toLowerCase();
  if (SUPPORTED_LOCALES.includes(lower as Locale)) return lower as Locale;
  const base = lower.split('-')[0];
  if (SUPPORTED_LOCALES.includes(base as Locale)) return base as Locale;
  return 'en';
}

function loadMessages(locale: Locale): any {
  if (messagesCache.has(locale)) return messagesCache.get(locale);
  try {
    const filePath = join(process.cwd(), 'messages', `${locale}.json`);
    const raw = readFileSync(filePath, 'utf-8');
    const messages = JSON.parse(raw);
    messagesCache.set(locale, messages);
    return messages;
  } catch {
    const fallbackPath = join(process.cwd(), 'messages', 'en.json');
    const raw = readFileSync(fallbackPath, 'utf-8');
    const messages = JSON.parse(raw);
    messagesCache.set(locale, messages);
    return messages;
  }
}

export async function buildEmailTranslator(locale?: string) {
  const loc = resolveLocale(locale);
  const messages = loadMessages(loc);
  const t = (key: string, values?: Record<string, any>): string => {
    const fullKey = `Common.Emails.${key}`;
    const parts = fullKey.split('.');
    let result: any = messages;
    for (const p of parts) {
      if (result && typeof result === 'object' && p in result) {
        result = result[p];
      } else {
        return key;
      }
    }
    if (typeof result !== 'string') return key;
    if (values) {
      return result.replace(/\{(\w+)\}/g, (m, k) => (values[k] !== undefined ? String(values[k]) : m));
    }
    return result;
  };
  return { t, locale: loc };
}

export function makeEmailTranslator(messages: any) {
  return (key: string, values?: Record<string, any>): string => {
    const fullKey = `Common.Emails.${key}`;
    const parts = fullKey.split('.');
    let result: any = messages;
    for (const p of parts) {
      if (result && typeof result === 'object' && p in result) {
        result = result[p];
      } else {
        return key;
      }
    }
    if (typeof result !== 'string') return key;
    if (values) {
      return result.replace(/\{(\w+)\}/g, (m, k) => (values[k] !== undefined ? String(values[k]) : m));
    }
    return result;
  };
}
