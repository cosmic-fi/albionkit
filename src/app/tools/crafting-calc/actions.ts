'use server';

import { TIERS, ENCHANTMENTS } from './constants';
import { Recipe } from './recipes';

const REGION_URLS = {
  west: 'https://west.albion-online-data.com',
  east: 'https://east.albion-online-data.com',
  europe: 'https://europe.albion-online-data.com'
};

async function fetchPrices(items: string[], region: 'west' | 'east' | 'europe') {
    try {
        const baseUrl = REGION_URLS[region];
        // Split into chunks of 20 items to avoid URL length limits if needed, 
        // but Albion Data API usually handles ~100 items fine.
        // Let's stick to one request for now, but monitor length.
        
        const url = `${baseUrl}/api/v2/stats/prices/${items.join(',')}.json?locations=Martlock,Bridgewatch,Lymhurst,Fort Sterling,Thetford,Caerleon,Brecilien,Black Market`;
        const response = await fetch(url, { 
          next: { revalidate: 60 },
          headers: {
            'User-Agent': 'AlbionTools/1.0 (Development)'
          }
        });
        
        if (!response.ok) throw new Error(`Failed to fetch prices: ${response.status}`);
        
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Price fetch error: Invalid JSON received', text.substring(0, 200));
          throw new Error('Invalid JSON response from API');
        }
        
        return { data, error: undefined };
      } catch (error) {
        console.error('Price fetch error:', error);
        return { error: 'Failed to fetch prices', data: [] };
      }
}

export async function getResourcePrices(rawType: string, refinedType: string, region: 'west' | 'east' | 'europe' = 'west') {
  const items: string[] = [];

  TIERS.forEach(tier => {
    ENCHANTMENTS.forEach(enchantment => {
      const suffix = enchantment > 0 ? `_LEVEL${enchantment}` : '';
      items.push(`T${tier}_${rawType}${suffix}`);
      items.push(`T${tier}_${refinedType}${suffix}`);
    });
  });

  return fetchPrices(items, region);
}

import { searchItemsService, getItemNameService } from '@/lib/item-service';

export async function searchItems(query: string) {
    return await searchItemsService(query);
}

export async function resolveItemName(id: string) {
    return await getItemNameService(id);
}

export async function getRecipePrices(recipe: Recipe, region: 'west' | 'east' | 'europe' = 'west') {
    const items: Set<string> = new Set();
  
    TIERS.forEach(tier => {
      // Determine ingredients for this tier
      const ingredients = (recipe.ingredientsByTier && recipe.ingredientsByTier[tier]) 
        ? recipe.ingredientsByTier[tier] 
        : recipe.ingredients;

      ENCHANTMENTS.forEach(enchantment => {
        const suffix = enchantment > 0 ? `_LEVEL${enchantment}` : '';
        
        // Add Product ID
        items.add(`T${tier}_${recipe.productId}${suffix}`);
  
        // Add Ingredient IDs
        ingredients.forEach(ing => {
           // Handle absolute ID (e.g. T1_CARROT) vs relative Type (e.g. METALBAR)
           // If ID starts with T and a digit, assume it's absolute (or close to it)
           if (/^T\d+_/.test(ing.itemId)) {
             // Absolute ID
             if (ing.isEnchantable) {
                 items.add(`${ing.itemId}${suffix}`);
             } else {
                 items.add(ing.itemId);
             }
           } else {
             // Relative Type
             const ingTier = tier + (ing.tierOffset || 0);
             if (ingTier < 1) return; // Skip invalid tiers

             if (ing.isEnchantable) {
                 items.add(`T${ingTier}_${ing.itemId}${suffix}`);
             } else {
                 items.add(`T${ingTier}_${ing.itemId}`);
             }
           }
        });
      });
    });
  
    return fetchPrices(Array.from(items), region);
  }

export async function getItemData(itemId: string) {
    try {
        const response = await fetch(`https://gameinfo.albiononline.com/api/gameinfo/items/${itemId}/data`, {
            next: { revalidate: 3600 },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching item data:', error);
        return null;
    }
}
