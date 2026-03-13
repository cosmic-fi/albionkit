const BASE_STYLES = `
  body { margin: 0; padding: 0; background-color: #0f172a; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; -webkit-font-smoothing: antialiased; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background-color: #1e293b; border-radius: 16px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border: 1px solid #334155; }
  .header { text-align: center; margin-bottom: 32px; }
  .logo { font-size: 28px; font-weight: 800; color: #f59e0b; text-decoration: none; letter-spacing: -1px; display: inline-block; }
  .logo span { color: #fff; }
  h1 { color: #f8fafc; font-size: 24px; font-weight: 700; margin: 0 0 24px; text-align: center; letter-spacing: -0.5px; }
  p { margin: 0 0 24px; line-height: 1.6; color: #cbd5e1; font-size: 16px; }
  .btn-container { text-align: center; margin: 32px 0; }
  .btn { display: inline-block; background-color: #f59e0b; color: #0f172a; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; transition: all 0.2s; font-size: 16px; }
  .btn:hover { background-color: #d97706; transform: translateY(-1px); }
  .footer { margin-top: 32px; text-align: center; color: #64748b; font-size: 12px; }
  .footer p { font-size: 12px; color: #64748b; margin-bottom: 8px; }
  .footer a { color: #94a3b8; text-decoration: none; transition: color 0.2s; }
  .footer a:hover { color: #cbd5e1; text-decoration: underline; }
  .divider { height: 1px; background-color: #334155; margin: 32px 0; }
  ul { padding-left: 20px; margin-bottom: 24px; color: #cbd5e1; }
  li { margin-bottom: 12px; line-height: 1.5; }
  .highlight { color: #f59e0b; font-weight: 600; }
  .small-text { font-size: 13px; color: #94a3b8; }
`;

// Replace this with your actual banner image URL
const GLOBAL_BANNER_URL = 'https://albionkit.com/albionkit-banner.png';

interface BaseTemplateProps {
  title: string;
  content: string;
  previewText?: string;
  bannerUrl?: string;
  t?: any;
}

function getBaseHtml({ title, content, previewText, bannerUrl = GLOBAL_BANNER_URL, t }: BaseTemplateProps) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  <style>
    ${BASE_STYLES}
    .banner-img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText || title}
  </div>
  <div class="container">
    <div class="header">
      ${bannerUrl 
        ? `<a href="https://albionkit.com"><img src="${bannerUrl}" alt="AlbionKit" class="banner-img"></a>`
        : `<a href="https://albionkit.com" class="logo">Albion<span>Kit</span></a>`
      }
    </div>
    <div class="card">
      ${content}
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #94a3b8; margin-bottom: 0; text-align: center;">
        ${t ? t('common.companion') : 'Your companion for Albion Online - Builds, Market Data, and PvP Intel.'}
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} AlbionKit. ${t ? t('common.rightsReserved') : 'All rights reserved.'}</p>
      <p>
        <a href="https://albionkit.com/privacy">${t ? t('common.privacy') : 'Privacy Policy'}</a> • 
        <a href="https://albionkit.com/terms">${t ? t('common.terms') : 'Terms of Service'}</a> • 
        <a href="https://albionkit.com/settings">${t ? t('common.unsubscribe') : 'Unsubscribe'}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getVerificationEmailHtml(link: string, t?: any) {
  const content = `
    <h1>${t ? t('verification.title') : 'Verify your email address'}</h1>
    <p>${t ? t('verification.welcome') : `Welcome to <strong>AlbionKit</strong>! We're excited to have you on board.`}</p>
    <p>${t ? t('verification.body') : `Please confirm your email address to unlock full access to all features, including creating builds, tracking market data, and more.`}</p>
    
    <div class="btn-container">
      <a href="${link}" class="btn">${t ? t('verification.button') : 'Verify Email Address'}</a>
    </div>
    
    <p class="small-text" style="text-align: center;">
      ${t ? t('verification.altLink') : 'Or copy and paste this link into your browser:'}<br>
      <span style="word-break: break-all; color: #f59e0b;">${link}</span>
    </p>
    
    <p class="small-text" style="text-align: center; margin-top: 24px;">
      ${t ? t('verification.ignore') : `If you didn't create an account with AlbionKit, you can safely ignore this email.`}
    </p>
  `;
  
  return getBaseHtml({
    title: t ? t('verification.title') : 'Verify your email - AlbionKit',
    previewText: t ? t('verification.preview') : 'Please verify your email address to complete your registration.',
    content,
    t
  });
}

export function getWelcomeEmailHtml(name: string, t?: any) {
  const content = `
    <h1>${t ? t('welcome.title', { name }) : `Welcome, ${name}!`}</h1>
    <p>${t ? t('welcome.body1') : `Thanks for joining <strong>AlbionKit</strong>. You've just taken the first step towards mastering Albion Online.`}</p>
    <p>${t ? t('welcome.body2') : `Here are a few powerful tools you can start using right now:`}</p>
    
    <ul>
      <li>${t ? t('welcome.builds') : `<strong>Builds Database:</strong> Discover and share the meta.`}</li>
      <li>${t ? t('welcome.market') : `<strong>Market Flipper:</strong> Find profitable trades across cities.`}</li>
      <li>${t ? t('welcome.pvp') : `<strong>PvP Intel:</strong> Analyze battles and kill feeds in real-time.`}</li>
    </ul>
    
    <div class="btn-container">
      <a href="https://albionkit.com" class="btn">${t ? t('welcome.button') : 'Explore AlbionKit'}</a>
    </div>
  `;
  
  return getBaseHtml({
    title: t ? t('welcome.subject') : 'Welcome to AlbionKit',
    previewText: t ? t('welcome.preview') : 'Welcome to AlbionKit! Start exploring our tools today.',
    content,
    t
  });
}

export function getPurchaseSuccessEmailHtml(name: string, t?: any) {
  const content = `
    <h1>${t ? t('purchase.title') : 'Subscription Active 🚀'}</h1>
    <p>${t ? t('purchase.greeting', { name }) : `Hi ${name},`}</p>
    <p>${t ? t('purchase.body1') : `Thank you for your support! Your <strong>AlbionKit Premium</strong> subscription is now active.`}</p>
    <p>${t ? t('purchase.body2') : `You now have unlimited access to:`}</p>
    
    <ul>
      <li>${t ? t('purchase.feature1') : `✨ <strong>Ad-free experience</strong> across the entire platform`}</li>
      <li>${t ? t('purchase.feature2') : `📈 <strong>Advanced Analytics</strong> for PvP and Market data`}</li>
      <li>${t ? t('purchase.feature3') : `📜 <strong>Unlimited History</strong> for kill feeds and market trends`}</li>
      <li>${t ? t('purchase.feature4') : `🏆 <strong>Supporter Badge</strong> on your profile`}</li>
    </ul>
    
    <div class="btn-container">
      <a href="https://albionkit.com/settings" class="btn">${t ? t('purchase.button') : 'Manage Subscription'}</a>
    </div>
    
    <p>${t ? t('purchase.footer') : `We appreciate your support in keeping this project alive and growing!`}</p>
  `;
  
  return getBaseHtml({
    title: t ? t('purchase.subject') : 'Subscription Activated - AlbionKit',
    previewText: t ? t('purchase.preview') : 'Your AlbionKit Premium subscription is now active!',
    content,
    t
  });
}

export function getRankUpEmailHtml(rank: string, t?: any) {
  const content = `
    <h1>${t ? t('rankUp.title') : 'Level Up! 🎉'}</h1>
    <p>${t ? t('rankUp.congrats') : 'Congratulations!'}</p>
    <p>${t ? t('rankUp.body', { rank }) : `You have reached the <strong>${rank}</strong> rank on AlbionKit.`}</p>
    <p>${t ? t('rankUp.footer') : `Keep creating builds and contributing to the community to reach the next rank!`}</p>
    
    <div class="btn-container">
      <a href="https://albionkit.com/profile" class="btn">${t ? t('rankUp.button') : 'View Profile'}</a>
    </div>
  `;
  
  return getBaseHtml({
    title: t ? t('rankUp.subject', { rank }) : `You've reached ${rank} Rank!`,
    previewText: t ? t('rankUp.preview', { rank }) : `Congratulations on reaching ${rank} rank!`,
    content,
    t
  });
}

export function getReminderEmailHtml(message: string, t?: any) {
  const content = `
    <h1>${t ? t('reminder.title') : 'Reminder'}</h1>
    <p>${message}</p>
    <p>${t ? t('reminder.body') : `Open AlbionKit to see the full list of opportunities.`}</p>
    
    <div class="btn-container">
      <a href="https://albionkit.com/tools/market-flipper" class="btn">${t ? t('reminder.button') : 'View Market Flipper'}</a>
    </div>
  `;
  
  return getBaseHtml({
    title: t ? t('reminder.subject') : 'Market Opportunity - AlbionKit',
    previewText: message,
    content,
    t
  });
}

export function getWatchlistAlertEmailHtml(name: string, items: any[], t?: any) {
  const itemsHtml = items.map(item => `
    <li style="margin-bottom: 16px; list-style: none; background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #334155;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="https://render.albiononline.com/v1/item/${item.itemId}?quality=1" width="48" height="48" style="border-radius: 4px; background: #1e293b;" alt="${item.name}">
        <div>
          <div style="font-weight: bold; color: #f8fafc;">${item.name}</div>
          <div style="font-size: 13px; color: #f59e0b;">
            ${t ? t('watchlist.profit', { profit: Math.round(item.profit || 0).toLocaleString(), roi: item.margin || 0 }) : `Profit: <strong>${Math.round(item.profit || 0).toLocaleString()} Silver</strong> (${item.margin || 0}% ROI)`}
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            ${t ? t('watchlist.buySell', { buyPrice: (item.buyPrice || 0).toLocaleString(), buyCity: item.buyCity || 'Anywhere', sellPrice: (item.sellPrice || 0).toLocaleString() }) : `Buy: ${(item.buyPrice || 0).toLocaleString()} (${item.buyCity || 'Anywhere'}) → Sell: ${(item.sellPrice || 0).toLocaleString()} (BM)`}
          </div>
        </div>
      </div>
    </li>
  `).join('');

  const content = `
    <h1>${t ? t('watchlist.subject') : 'Watchlist Price Alert 🔔'}</h1>
    <p>${t ? t('watchlist.greeting', { name }) : `Hi ${name},`}</p>
    <p>${t ? t('watchlist.body') : `One or more items on your <strong>Market Watchlist</strong> are currently showing profitable flip opportunities on the Black Market!`}</p>
    
    <ul style="padding: 0;">
      ${itemsHtml}
    </ul>
    
    <div class="btn-container">
      <a href="https://albionkit.com/tools/market-flipper?watchlist=true" class="btn">${t ? t('watchlist.button') : 'View My Watchlist'}</a>
    </div>
    
    <p class="small-text" style="text-align: center;">
      ${t ? t('watchlist.footer') : `You're receiving this because you enabled Market Alerts in your settings.`}
    </p>
  `;

  return getBaseHtml({
    title: t ? t('watchlist.baseTitle') : 'Market Watchlist Alert - AlbionKit',
    previewText: t ? t('watchlist.preview', { itemName: items[0].name }) : `Watchlist Alert: ${items[0].name} and more are profitable!`,
    content,
    t
  });
}

export function getGoldAlertEmailHtml(name: string, region: string, currentPrice: number, change: number, t?: any) {
  const isUp = change > 0;
  const color = isUp ? '#ef4444' : '#22c55e'; // Price up is "bad" for buyers, down is "good"
  const trendText = isUp ? (t ? t('gold.rising') : 'Rising') : (t ? t('gold.dropping') : 'Dropping');
  const icon = isUp ? '📈' : '📉';
  
  const content = `
    <h1>${t ? t('gold.subject') : 'Gold Market Alert 💰'}</h1>
    <p>${t ? t('gold.greeting', { name }) : `Hi ${name},`}</p>
    <p>${t ? t('gold.body', { region: region.toUpperCase() }) : `We've detected a significant movement in the **Gold Market (${region.toUpperCase()})**.`}</p>
    
    <div style="background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin: 24px 0; text-align: center;">
      <div style="font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">${t ? t('gold.currentPriceLabel') : 'Current Gold Price'}</div>
      <div style="font-size: 36px; font-weight: 900; color: #f8fafc; font-family: monospace;">${currentPrice.toLocaleString()} <span style="font-size: 16px; color: #94a3b8;">Silver</span></div>
      <div style="font-size: 18px; font-weight: bold; color: ${color}; margin-top: 8px;">
        ${t ? t('gold.trend', { icon, trendText, change: Math.abs(change).toFixed(1) }) : `${icon} ${trendText} by ${Math.abs(change).toFixed(1)}%`}
      </div>
    </div>
    
    <p>${t ? t('gold.advice') : 'This volatility might be a good time to adjust your silver holdings or trade for Gold.'}</p>
    
    <div class="btn-container">
      <a href="https://albionkit.com" class="btn">${t ? t('gold.button') : 'View Live Market Ticker'}</a>
    </div>
    
    <p class="small-text" style="text-align: center;">
      ${t ? t('gold.footer') : `You're receiving this because you enabled Gold Alerts in your settings.`}
    </p>
  `;
  
  return getBaseHtml({
    title: t ? t('gold.baseTitle', { trendText }) : `Gold Alert: Price is ${trendText}!`,
    previewText: t ? t('gold.preview', { price: currentPrice.toLocaleString(), change: change.toFixed(1) }) : `Gold market volatility detected: ${currentPrice.toLocaleString()} Silver (${change.toFixed(1)}%)`,
    content,
    t
  });
}
