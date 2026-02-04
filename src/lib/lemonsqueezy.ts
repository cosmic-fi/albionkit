import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

export function configureLemonSqueezy() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!apiKey) {
    console.warn("LEMONSQUEEZY_API_KEY is not set in environment variables.");
    // In production, we might want to throw an error or handle this more gracefully
    return;
  }

  lemonSqueezySetup({
    apiKey,
    onError: (error) => console.error("Lemon Squeezy Error:", error),
  });
}
