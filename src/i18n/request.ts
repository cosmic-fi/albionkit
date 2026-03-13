import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const supportedLocales = ['en','de','fr','ru','pl','pt','es','tr','zh','ko'] as const;
  type SupportedLocale = typeof supportedLocales[number];
  const isSupported = (supportedLocales as readonly string[]).includes(cookieLocale);
  const locale: SupportedLocale = isSupported ? (cookieLocale as SupportedLocale) : 'en';

  return {
    locale,
    messages: await (async () => {
      try {
        return (await import(`../../messages/${locale}.json`)).default;
      } catch {
        return (await import(`../../messages/en.json`)).default;
      }
    })()
  };
});
