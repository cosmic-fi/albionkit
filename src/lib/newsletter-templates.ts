// Newsletter email templates for batch sends.
// Uses the same dark-theme visual style as email-templates.ts.
// Translations are loaded from /messages/{locale}.json (Common.Emails namespace).

import { buildEmailTranslator, resolveLocale } from './newsletter-i18n';

const BASE_STYLES = `
  body { margin: 0; padding: 0; background-color: #0f172a; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; -webkit-font-smoothing: antialiased; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background-color: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid #334155; }
  h1 { color: #f8fafc; font-size: 24px; font-weight: 700; margin: 0 0 24px; text-align: center; }
  p { margin: 0 0 24px; line-height: 1.6; color: #cbd5e1; font-size: 16px; }
  .btn-container { text-align: center; margin: 32px 0; }
  .btn { display: inline-block; background-color: #d97706; color: #ffffff; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; }
  .footer { margin-top: 32px; text-align: center; color: #64748b; font-size: 12px; }
  .footer a { color: #94a3b8; text-decoration: none; }
  .divider { height: 1px; background-color: #334155; margin: 32px 0; }
  .small-text { font-size: 13px; color: #64748b; }
`;

const BANNER_URL = 'https://albionkit.com/albionkit-banner.png';

async function wrapInBase(t: (key: string, values?: Record<string, any>) => string, title: string, content: string, previewText?: string): Promise<string> {
  const companion = t('common.companion');
  const rights = t('common.rightsReserved');
  const privacy = t('common.privacy');
  const terms = t('common.terms');
  const unsubscribe = t('common.unsubscribe');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  <style>${BASE_STYLES}</style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a;">
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${previewText || title}
  </div>
  <div class="container" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="https://albionkit.com">
        <img src="${BANNER_URL}" alt="AlbionKit" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;">
      </a>
    </div>
    <div class="card" style="background-color: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid #334155;">
      ${content}
      <div class="divider" style="height: 1px; background-color: #334155; margin: 32px 0;"></div>
      <p style="font-size: 14px; color: #64748b; margin-bottom: 0; text-align: center;">
        ${companion}
      </p>
    </div>
    <div class="footer" style="margin-top: 32px; text-align: center; color: #64748b; font-size: 12px;">
      <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">&copy; ${new Date().getFullYear()} AlbionKit. ${rights}</p>
      <p style="font-size: 12px; color: #64748b; margin: 0;">
        <a href="https://albionkit.com/privacy" style="color: #94a3b8; text-decoration: none;">${privacy}</a> &bull;
        <a href="https://albionkit.com/terms" style="color: #94a3b8; text-decoration: none;">${terms}</a> &bull;
        <a href="https://albionkit.com/settings" style="color: #94a3b8; text-decoration: none;">${unsubscribe}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function getGoldAlertNewsletterHtml(data: {
  name?: string;
  locale?: string;
  region: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
}): Promise<string> {
  const { name, region, currentPrice, previousPrice, change, locale } = data;
  const { t } = await buildEmailTranslator(locale);
  const displayName = name || t('common.travelerName');
  const isUp = change > 0;
  const color = isUp ? '#ef4444' : '#22c55e';
  const icon = isUp ? '📈' : '📉';
  const trendText = isUp ? t('gold.rising') : t('gold.dropping');
  const trendLine = t('gold.trend', { icon, trendText, change: Math.abs(change).toFixed(1) });

  const content = `
    <h1>${t('gold.subject')}</h1>
    <p>${t('gold.greeting', { name: displayName })}</p>
    <p>${t('gold.body', { region: region.toUpperCase() })}</p>

    <div style="background: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #334155; margin: 24px 0; text-align: center;">
      <div style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">${t('gold.currentPriceLabel')}</div>
      <div style="font-size: 36px; font-weight: 900; color: #f8fafc; font-family: monospace;">${currentPrice.toLocaleString()} <span style="font-size: 16px; color: #64748b;">Silver</span></div>
      <div style="font-size: 14px; color: #94a3b8; margin-top: 8px;">Previous: ${previousPrice.toLocaleString()} Silver</div>
      <div style="font-size: 18px; font-weight: bold; color: ${color}; margin-top: 12px;">${trendLine}</div>
    </div>

    <p>${t('gold.advice')}</p>

    <div class="btn-container">
      <a href="https://albionkit.com" class="btn">${t('gold.button')}</a>
    </div>

    <p class="small-text" style="text-align: center;">
      ${t('gold.footer')}<br>
      <a href="https://albionkit.com/settings" style="color: #94a3b8;">${t('common.unsubscribe')}</a>
    </p>
  `;

  return wrapInBase(
    t,
    t('gold.baseTitle', { trendText }),
    content,
    t('gold.preview', { price: currentPrice.toLocaleString(), change: change.toFixed(1) })
  );
}

export async function getFlipDigestNewsletterHtml(flips: Array<{
  itemId: string;
  name: string;
  profit: number;
  roi: number;
  buyPrice?: number;
  sellPrice?: number;
  buyCity?: string;
}>, locale?: string): Promise<string> {
  const { t } = await buildEmailTranslator(locale);
  const topFlips = flips.slice(0, 10);

  const flipsHtml = topFlips.map((flip, i) => `
    <div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: #0f172a; border-radius: 10px; border: 1px solid #334155; margin-bottom: 10px;">
      <div style="font-size: 14px; font-weight: 700; color: #64748b; min-width: 22px; text-align: center;">#${i + 1}</div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 600; color: #f8fafc; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${flip.name}</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">
          ${flip.buyCity ? `${flip.buyPrice?.toLocaleString() || '—'} (${flip.buyCity}) → ` : ''}${flip.sellPrice?.toLocaleString() || ''}
        </div>
      </div>
      <div style="text-align: right; flex-shrink: 0;">
        <div style="font-weight: 700; color: #22c55e; font-size: 15px;">+${flip.profit.toLocaleString()} 🪙</div>
        <div style="font-size: 12px; color: #f59e0b;">${flip.roi}% ROI</div>
      </div>
    </div>`).join('');

  const content = `
    <h1>${t('flip.subject')}</h1>
    <p>${t('flip.body')}</p>

    <div style="margin: 24px 0;">
      ${flipsHtml || `<p style="text-align: center; color: #64748b;">${t('flip.noResults')}</p>`}
    </div>

    <div class="btn-container">
      <a href="https://albionkit.com/tools/market-flipper" class="btn">${t('flip.button')}</a>
    </div>

    <p class="small-text" style="text-align: center;">
      ${t('flip.footer')}<br>
      <a href="https://albionkit.com/settings" style="color: #94a3b8;">${t('common.unsubscribe')}</a>
    </p>
  `;

  return wrapInBase(
    t,
    t('flip.baseTitle'),
    content,
    t('flip.preview', { itemName: topFlips[0]?.name || '' })
  );
}

export async function getGeneralNewsletterHtml(opts: {
  locale?: string;
  title: string;
  body: string;
  buttonUrl?: string;
  buttonText?: string;
}): Promise<string> {
  const { t } = await buildEmailTranslator(opts.locale);
  const { title, body, buttonUrl, buttonText } = opts;
  const content = `
    <h1>${title}</h1>
    <div style="color: #cbd5e1; font-size: 16px; line-height: 1.7;">${body}</div>
    ${buttonUrl && buttonText ? `<div class="btn-container"><a href="${buttonUrl}" class="btn">${buttonText}</a></div>` : ''}
    <p class="small-text" style="text-align: center; margin-top: 24px;">
      <a href="https://albionkit.com/settings" style="color: #94a3b8;">${t('common.unsubscribe')}</a>
    </p>
  `;
  return wrapInBase(t, title, content, title);
}

