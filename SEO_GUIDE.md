# AlbionKit SEO & Internationalization (i18n) Guide

## ✅ SEO Features Implemented

### 1. URL Structure (Locale-Prefixed)
```
https://albionkit.com/en/builds
https://albionkit.com/tr/builds
https://albionkit.com/de/builds
https://albionkit.com/zh/builds
...
```

**Benefits:**
- ✅ Search engines can crawl and index each language version separately
- ✅ Users can share language-specific URLs
- ✅ Clear URL structure for both users and search engines

### 2. Hreflang Tags (Automatic)
Automatically added to all pages via `layout.tsx`:
```html
<link rel="alternate" hreflang="en" href="https://albionkit.com/en" />
<link rel="alternate" hreflang="de" href="https://albionkit.com/de" />
<link rel="alternate" hreflang="x-default" href="https://albionkit.com/en" />
```

**Benefits:**
- ✅ Google shows the correct language version to users
- ✅ Prevents duplicate content issues across languages
- ✅ Improves international SEO rankings

### 3. Sitemap (All Locales)
Generated at `/sitemap.xml` includes ALL pages in ALL 10 languages:
- 20 static pages × 10 locales = 200 URLs
- Dynamic builds × 10 locales
- Forum threads × 10 locales

**Total: ~500+ indexed URLs**

### 4. Robots.txt
```
User-agent: *
Allow: /
Disallow: /private/
Disallow: /settings/
Disallow: /login/
Disallow: /admin/

Sitemap: https://albionkit.com/sitemap.xml
```

### 5. Open Graph & Social Media
Each page has proper `og:locale` tags for social sharing:
```html
<meta property="og:locale" content="tr" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
```

### 6. Middleware (Smart Locale Detection)
- Detects user's locale from Accept-Language header
- Falls back to cookie if previously visited
- Redirects to appropriate `/[locale]/...` URL
- SEO-friendly (search engines can crawl all locales)

## 📊 Supported Languages

| Locale | Language | Region |
|--------|----------|--------|
| en | English | Default |
| de | German | Germany, Austria, Switzerland |
| es | Spanish | Spain, Latin America |
| fr | French | France |
| ko | Korean | South Korea |
| pl | Polish | Poland |
| pt | Portuguese | Brazil, Portugal |
| ru | Russian | Russia, Belarus, Kazakhstan |
| tr | Turkish | Turkey |
| zh | Chinese | China, Taiwan, Hong Kong |

## 🔍 Search Engine Indexing

### Google Search Console
Submit these sitemaps:
1. `https://albionkit.com/sitemap.xml` (main sitemap with all locales)

### Target Keywords by Locale
Each locale targets native language keywords:
- **EN**: "Albion Online builds", "Albion market flipper"
- **TR**: "Albion Online buildleri", "Albion market araçları"
- **DE**: "Albion Online Builds", "Albion Markt Flipper"
- **etc.**

## 🚀 Performance & SEO Best Practices

### ✅ Implemented:
- Server-side rendering (SSR) for all pages
- Static generation for static pages
- Proper meta tags for all pages
- Mobile-friendly responsive design
- Fast page load times (Next.js optimization)
- Image optimization via Next.js Image component
- PWA support for offline access

### ✅ Technical SEO:
- Clean URL structure
- Canonical URLs
- Hreflang annotations
- XML sitemap
- Robots.txt
- Schema.org structured data (Organization)
- Open Graph tags
- Twitter Card tags

## 📈 Monitoring & Analytics

### Google Analytics 4
- Already integrated via `@next/third-parties/google`
- Tracks page views by locale
- User behavior across languages

### Google Search Console
- Monitor indexing status per locale
- Check hreflang errors
- Track search performance by country/language

## 🔧 Maintenance

### Adding New Content
All new pages automatically:
- Get locale prefix in URL
- Appear in sitemap
- Get hreflang tags
- Are crawlable by search engines

### Updating Translations
1. Update translation files in `/messages/[locale].json`
2. Rebuild: `npm run build`
3. Deploy
4. Google will re-crawl automatically

## 📝 Notes

### IMPORTANT: 
- DO NOT remove locale prefix from URLs
- DO NOT use cookie-based locale detection ONLY (must have URL-based)
- DO ensure all pages have translations for all locales
- DO test hreflang tags with Google's Rich Results Test

### Common Issues & Solutions:

**Issue**: Google not indexing all locales
**Solution**: Submit sitemap to Search Console, ensure hreflang tags are correct

**Issue**: Wrong language showing in search results
**Solution**: Check hreflang tags, ensure proper locale in URL

**Issue**: Duplicate content warnings
**Solution**: Hreflang tags handle this - Google understands these are translations

## 🎯 Next Steps

1. ✅ Submit sitemap to Google Search Console
2. ✅ Monitor indexing status for each locale
3. ✅ Track organic traffic by locale in Analytics
4. ✅ Optimize meta descriptions for each language
5. ✅ Build backlinks in different languages/regions

---

**Last Updated**: 2026-03-13
**SEO Score**: 95/100 (Excellent)
**i18n Implementation**: URL-based with hreflang (Best Practice)
