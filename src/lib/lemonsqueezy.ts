import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

export function configureLemonSqueezy() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!apiKey) {
    console.error("❌ LEMON_SQUEEZY_API_KEY is not set in environment variables.");
    throw new Error("Lemon Squeezy API key is missing. Please check your .env.local file.");
  }

  // Clean the API key (remove quotes, whitespace, etc.)
  const cleanApiKey = apiKey.trim().replace(/^["']|["']$/g, '');
  
  console.log("✅ Configuring Lemon Squeezy with API key (length:", cleanApiKey.length, ")");
  console.log("✅ API key starts with 'lsat_':", cleanApiKey.startsWith('lsat_'));

  lemonSqueezySetup({
    apiKey: cleanApiKey,
    onError: (error) => console.error("Lemon Squeezy Error:", error),
  });
}
