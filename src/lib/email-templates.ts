
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
}

function getBaseHtml({ title, content, previewText, bannerUrl = GLOBAL_BANNER_URL }: BaseTemplateProps) {
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
        Your companion for Albion Online - Builds, Market Data, and PvP Intel.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} AlbionKit. All rights reserved.</p>
      <p>
        <a href="https://albionkit.com/privacy">Privacy Policy</a> • 
        <a href="https://albionkit.com/terms">Terms of Service</a> • 
        <a href="https://albionkit.com/settings">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getVerificationEmailHtml(link: string) {
  const content = `
    <h1>Verify your email address</h1>
    <p>Welcome to <strong>AlbionKit</strong>! We're excited to have you on board.</p>
    <p>Please confirm your email address to unlock full access to all features, including creating builds, tracking market data, and more.</p>
    
    <div class="btn-container">
      <a href="${link}" class="btn">Verify Email Address</a>
    </div>
    
    <p class="small-text" style="text-align: center;">
      Or copy and paste this link into your browser:<br>
      <span style="word-break: break-all; color: #f59e0b;">${link}</span>
    </p>
    
    <p class="small-text" style="text-align: center; margin-top: 24px;">
      If you didn't create an account with AlbionKit, you can safely ignore this email.
    </p>
  `;
  
  return getBaseHtml({
    title: 'Verify your email - AlbionKit',
    previewText: 'Please verify your email address to complete your registration.',
    content
  });
}

export function getWelcomeEmailHtml(name: string) {
  const content = `
    <h1>Welcome, ${name}!</h1>
    <p>Thanks for joining <strong>AlbionKit</strong>. You've just taken the first step towards mastering Albion Online.</p>
    <p>Here are a few powerful tools you can start using right now:</p>
    
    <ul>
      <li><strong>Builds Database:</strong> Discover and share the meta.</li>
      <li><strong>Market Flipper:</strong> Find profitable trades across cities.</li>
      <li><strong>PvP Intel:</strong> Analyze battles and kill feeds in real-time.</li>
    </ul>
    
    <div class="btn-container">
      <a href="https://albionkit.com" class="btn">Explore AlbionKit</a>
    </div>
  `;
  
  return getBaseHtml({
    title: 'Welcome to AlbionKit',
    previewText: 'Welcome to AlbionKit! Start exploring our tools today.',
    content
  });
}

export function getPurchaseSuccessEmailHtml(name: string) {
  const content = `
    <h1>Subscription Active 🚀</h1>
    <p>Hi ${name},</p>
    <p>Thank you for your support! Your <strong>AlbionKit Premium</strong> subscription is now active.</p>
    <p>You now have unlimited access to:</p>
    
    <ul>
      <li>✨ <strong>Ad-free experience</strong> across the entire platform</li>
      <li>📈 <strong>Advanced Analytics</strong> for PvP and Market data</li>
      <li>📜 <strong>Unlimited History</strong> for kill feeds and market trends</li>
      <li>🏆 <strong>Supporter Badge</strong> on your profile</li>
    </ul>
    
    <div class="btn-container">
      <a href="https://albionkit.com/settings" class="btn">Manage Subscription</a>
    </div>
    
    <p>We appreciate your support in keeping this project alive and growing!</p>
  `;
  
  return getBaseHtml({
    title: 'Subscription Activated - AlbionKit',
    previewText: 'Your AlbionKit Premium subscription is now active!',
    content
  });
}

export function getRankUpEmailHtml(rank: string) {
  const content = `
    <h1>Level Up! 🎉</h1>
    <p>Congratulations!</p>
    <p>You have reached the <strong>${rank}</strong> rank on AlbionKit.</p>
    <p>Keep creating builds and contributing to the community to reach the next rank!</p>
    
    <div class="btn-container">
      <a href="https://albionkit.com/profile" class="btn">View Profile</a>
    </div>
  `;
  
  return getBaseHtml({
    title: `You've reached ${rank} Rank!`,
    previewText: `Congratulations on reaching ${rank} rank!`,
    content
  });
}

export function getReminderEmailHtml(message: string) {
  const content = `
    <h1>Reminder</h1>
    <p>${message}</p>
    
    <div class="btn-container">
      <a href="https://albionkit.com" class="btn">Open AlbionKit</a>
    </div>
  `;
  
  return getBaseHtml({
    title: 'Reminder - AlbionKit',
    previewText: message,
    content
  });
}
