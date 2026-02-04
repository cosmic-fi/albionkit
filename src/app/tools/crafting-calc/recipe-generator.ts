
import { Recipe, Ingredient } from './recipes';

// Base Recipe Definition
interface BaseRecipe {
  productId: string;
  productName: string;
  category: Recipe['category'];
  station: string;
  ingredients: {
    resourceType: string; // Key in RESOURCE_MAP
    count: number;
    tierOffset?: number;
  }[];
  // Override ingredients for specific tiers
  ingredientsByTier?: Record<number, {
    resourceType: string;
    count: number;
    tierOffset?: number;
  }[]>;
  yield?: number; // Default 1
}

const RESOURCE_MAP: Record<string, string> = {
  // Resources
  ORE: 'ORE',
  FIBER: 'FIBER',
  HIDE: 'HIDE',
  WOOD: 'WOOD',
  STONE: 'ROCK',
  METALBAR: 'METALBAR',
  CLOTH: 'CLOTH',
  LEATHER: 'LEATHER',
  PLANKS: 'PLANKS',
  STONEBLOCK: 'STONEBLOCK',
  
  // Farming - Vegetables
  CARROT: 'T1_CARROT',
  BEAN: 'T2_BEAN',
  WHEAT: 'T3_WHEAT',
  TURNIP: 'T4_TURNIP',
  CABBAGE: 'T5_CABBAGE',
  POTATO: 'T6_POTATO',
  CORN: 'T7_CORN',
  PUMPKIN: 'T8_PUMPKIN',
  
  // Farming - Herbs
  AGARIC: 'T2_AGARIC',
  COMFREY: 'T3_COMFREY',
  BURDOCK: 'T4_BURDOCK',
  TEASEL: 'T5_TEASEL',
  FOXGLOVE: 'T6_FOXGLOVE',
  MULLEIN: 'T7_MULLEIN',
  YARROW: 'T8_YARROW',
};

const BASE_RECIPES: Record<string, BaseRecipe> = {
  // --- REFINING ---
  'METALBAR': {
    productId: 'METALBAR', productName: 'Metal Bar', category: 'Refining', station: 'Smelter',
    ingredients: [{ resourceType: 'ORE', count: 2 }, { resourceType: 'METALBAR', count: 1, tierOffset: -1 }],
    ingredientsByTier: { 2: [{ resourceType: 'ORE', count: 1 }] }
  },
  'LEATHER': {
    productId: 'LEATHER', productName: 'Leather', category: 'Refining', station: 'Tanner',
    ingredients: [{ resourceType: 'HIDE', count: 2 }, { resourceType: 'LEATHER', count: 1, tierOffset: -1 }],
    ingredientsByTier: { 2: [{ resourceType: 'HIDE', count: 1 }] }
  },
  'CLOTH': {
    productId: 'CLOTH', productName: 'Cloth', category: 'Refining', station: 'Weaver',
    ingredients: [{ resourceType: 'FIBER', count: 2 }, { resourceType: 'CLOTH', count: 1, tierOffset: -1 }],
    ingredientsByTier: { 2: [{ resourceType: 'FIBER', count: 1 }] }
  },
  'PLANKS': {
    productId: 'PLANKS', productName: 'Planks', category: 'Refining', station: 'Lumbermill',
    ingredients: [{ resourceType: 'WOOD', count: 2 }, { resourceType: 'PLANKS', count: 1, tierOffset: -1 }],
    ingredientsByTier: { 2: [{ resourceType: 'WOOD', count: 1 }] }
  },
  'STONEBLOCK': {
    productId: 'STONEBLOCK', productName: 'Stone Block', category: 'Refining', station: 'Stonemason',
    ingredients: [{ resourceType: 'STONE', count: 2 }, { resourceType: 'STONEBLOCK', count: 1, tierOffset: -1 }],
    ingredientsByTier: { 2: [{ resourceType: 'STONE', count: 1 }] }
  },

  // --- TOOLS & ACCESSORIES ---
  'BAG': {
    productId: 'BAG', productName: 'Bag', category: 'Tool', station: 'Toolmaker',
    ingredients: [{ resourceType: 'LEATHER', count: 8 }, { resourceType: 'CLOTH', count: 8 }]
  },
  'CAPE': {
    productId: 'CAPE', productName: 'Cape', category: 'Tool', station: 'Toolmaker',
    ingredients: [{ resourceType: 'CLOTH', count: 4 }, { resourceType: 'LEATHER', count: 4 }] // Estimated count
  },
  'MAIN_PICKAXE': {
    productId: 'MAIN_PICKAXE', productName: 'Pickaxe', category: 'Tool', station: 'Toolmaker',
    ingredients: [{ resourceType: 'PLANKS', count: 3 }, { resourceType: 'METALBAR', count: 1 }] // Estimated
  },
  'MAIN_WOODAXE': {
    productId: 'MAIN_WOODAXE', productName: 'Wood Axe', category: 'Tool', station: 'Toolmaker',
    ingredients: [{ resourceType: 'PLANKS', count: 3 }, { resourceType: 'METALBAR', count: 1 }]
  },
  'MAIN_SICKLE': {
    productId: 'MAIN_SICKLE', productName: 'Sickle', category: 'Tool', station: 'Toolmaker',
    ingredients: [{ resourceType: 'PLANKS', count: 3 }, { resourceType: 'METALBAR', count: 1 }]
  },
  'MAIN_SKINNINGKNIFE': {
    productId: 'MAIN_SKINNINGKNIFE', productName: 'Skinning Knife', category: 'Tool', station: 'Toolmaker',
    ingredients: [{ resourceType: 'PLANKS', count: 3 }, { resourceType: 'METALBAR', count: 1 }]
  },
  'MAIN_STONEHAMMER': {
    productId: 'MAIN_STONEHAMMER', productName: 'Stone Hammer', category: 'Tool', station: 'Toolmaker',
    ingredients: [{ resourceType: 'PLANKS', count: 3 }, { resourceType: 'STONEBLOCK', count: 1 }]
  },

  // --- WARRIOR ---
  'MAIN_SWORD': {
    productId: 'MAIN_SWORD', productName: 'Broadsword', category: 'Weapon', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'METALBAR', count: 16 }, { resourceType: 'LEATHER', count: 8 }]
  },
  '2H_CLAYMORE': {
    productId: '2H_CLAYMORE', productName: 'Claymore', category: 'Weapon', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'METALBAR', count: 20 }, { resourceType: 'LEATHER', count: 12 }]
  },
  '2H_DUALSWORD': {
    productId: '2H_DUALSWORD', productName: 'Dual Swords', category: 'Weapon', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'METALBAR', count: 20 }, { resourceType: 'LEATHER', count: 12 }]
  },
  'MAIN_AXE': {
    productId: 'MAIN_AXE', productName: 'Battleaxe', category: 'Weapon', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'METALBAR', count: 16 }, { resourceType: 'PLANKS', count: 8 }]
  },
  '2H_AXE': {
    productId: '2H_AXE', productName: 'Greataxe', category: 'Weapon', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'METALBAR', count: 20 }, { resourceType: 'PLANKS', count: 12 }]
  },
  '2H_HALBERD': {
    productId: '2H_HALBERD', productName: 'Halberd', category: 'Weapon', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'METALBAR', count: 20 }, { resourceType: 'PLANKS', count: 12 }]
  },
  'MAIN_MACE': {
    productId: 'MAIN_MACE', productName: 'Mace', category: 'Weapon', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'METALBAR', count: 16 }, { resourceType: 'CLOTH', count: 8 }]
  },
  'MAIN_HAMMER': {
    productId: 'MAIN_HAMMER', productName: 'Hammer', category: 'Weapon', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'METALBAR', count: 16 }, { resourceType: 'CLOTH', count: 8 }]
  },
  '2H_CROSSBOW': {
    productId: '2H_CROSSBOW', productName: 'Crossbow', category: 'Weapon', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'PLANKS', count: 20 }, { resourceType: 'METALBAR', count: 12 }]
  },
  'HEAD_PLATE_SET1': {
    productId: 'HEAD_PLATE_SET1', productName: 'Soldier Helmet', category: 'Armor', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'METALBAR', count: 8 }]
  },
  'ARMOR_PLATE_SET1': {
    productId: 'ARMOR_PLATE_SET1', productName: 'Soldier Armor', category: 'Armor', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'METALBAR', count: 16 }]
  },
  'SHOES_PLATE_SET1': {
    productId: 'SHOES_PLATE_SET1', productName: 'Soldier Boots', category: 'Armor', station: 'Warrior\'s Forge',
    ingredients: [{ resourceType: 'METALBAR', count: 8 }]
  },
  // Knight
  'HEAD_PLATE_SET2': { productId: 'HEAD_PLATE_SET2', productName: 'Knight Helmet', category: 'Armor', station: 'Warrior\'s Forge', ingredients: [{ resourceType: 'METALBAR', count: 8 }] },
  'ARMOR_PLATE_SET2': { productId: 'ARMOR_PLATE_SET2', productName: 'Knight Armor', category: 'Armor', station: 'Warrior\'s Forge', ingredients: [{ resourceType: 'METALBAR', count: 16 }] },
  'SHOES_PLATE_SET2': { productId: 'SHOES_PLATE_SET2', productName: 'Knight Boots', category: 'Armor', station: 'Warrior\'s Forge', ingredients: [{ resourceType: 'METALBAR', count: 8 }] },
  // Guardian
  'HEAD_PLATE_SET3': { productId: 'HEAD_PLATE_SET3', productName: 'Guardian Helmet', category: 'Armor', station: 'Warrior\'s Forge', ingredients: [{ resourceType: 'METALBAR', count: 8 }] },
  'ARMOR_PLATE_SET3': { productId: 'ARMOR_PLATE_SET3', productName: 'Guardian Armor', category: 'Armor', station: 'Warrior\'s Forge', ingredients: [{ resourceType: 'METALBAR', count: 16 }] },
  'SHOES_PLATE_SET3': { productId: 'SHOES_PLATE_SET3', productName: 'Guardian Boots', category: 'Armor', station: 'Warrior\'s Forge', ingredients: [{ resourceType: 'METALBAR', count: 8 }] },

  // --- HUNTER ---
  '2H_BOW': {
    productId: '2H_BOW', productName: 'Bow', category: 'Weapon', station: 'Hunter\'s Lodge',
    ingredients: [{ resourceType: 'PLANKS', count: 32 }]
  },
  '2H_WARBOW': {
    productId: '2H_WARBOW', productName: 'Warbow', category: 'Weapon', station: 'Hunter\'s Lodge',
    ingredients: [{ resourceType: 'PLANKS', count: 32 }]
  },
  '2H_LONGBOW': {
    productId: '2H_LONGBOW', productName: 'Longbow', category: 'Weapon', station: 'Hunter\'s Lodge',
    ingredients: [{ resourceType: 'PLANKS', count: 32 }]
  },
  'MAIN_SPEAR': {
    productId: 'MAIN_SPEAR', productName: 'Spear', category: 'Weapon', station: 'Hunter\'s Lodge',
    ingredients: [{ resourceType: 'PLANKS', count: 16 }, { resourceType: 'METALBAR', count: 8 }]
  },
  'MAIN_DAGGER': {
    productId: 'MAIN_DAGGER', productName: 'Dagger', category: 'Weapon', station: 'Hunter\'s Lodge',
    ingredients: [{ resourceType: 'LEATHER', count: 16 }, { resourceType: 'METALBAR', count: 8 }]
  },
  '2H_DAGGERPAIR': {
    productId: '2H_DAGGERPAIR', productName: 'Dagger Pair', category: 'Weapon', station: 'Hunter\'s Lodge',
    ingredients: [{ resourceType: 'LEATHER', count: 20 }, { resourceType: 'METALBAR', count: 12 }]
  },
  '2H_QUARTERSTAFF': {
    productId: '2H_QUARTERSTAFF', productName: 'Quarterstaff', category: 'Weapon', station: 'Hunter\'s Lodge',
    ingredients: [{ resourceType: 'WOOD', count: 20 }, { resourceType: 'LEATHER', count: 12 }] // Check ingredients
  },
  'HEAD_LEATHER_SET1': { productId: 'HEAD_LEATHER_SET1', productName: 'Mercenary Hood', category: 'Armor', station: 'Hunter\'s Lodge', ingredients: [{ resourceType: 'LEATHER', count: 8 }] },
  'ARMOR_LEATHER_SET1': { productId: 'ARMOR_LEATHER_SET1', productName: 'Mercenary Jacket', category: 'Armor', station: 'Hunter\'s Lodge', ingredients: [{ resourceType: 'LEATHER', count: 16 }] },
  'SHOES_LEATHER_SET1': { productId: 'SHOES_LEATHER_SET1', productName: 'Mercenary Shoes', category: 'Armor', station: 'Hunter\'s Lodge', ingredients: [{ resourceType: 'LEATHER', count: 8 }] },
  // Hunter
  'HEAD_LEATHER_SET2': { productId: 'HEAD_LEATHER_SET2', productName: 'Hunter Hood', category: 'Armor', station: 'Hunter\'s Lodge', ingredients: [{ resourceType: 'LEATHER', count: 8 }] },
  'ARMOR_LEATHER_SET2': { productId: 'ARMOR_LEATHER_SET2', productName: 'Hunter Jacket', category: 'Armor', station: 'Hunter\'s Lodge', ingredients: [{ resourceType: 'LEATHER', count: 16 }] },
  'SHOES_LEATHER_SET2': { productId: 'SHOES_LEATHER_SET2', productName: 'Hunter Shoes', category: 'Armor', station: 'Hunter\'s Lodge', ingredients: [{ resourceType: 'LEATHER', count: 8 }] },
  // Assassin
  'HEAD_LEATHER_SET3': { productId: 'HEAD_LEATHER_SET3', productName: 'Assassin Hood', category: 'Armor', station: 'Hunter\'s Lodge', ingredients: [{ resourceType: 'LEATHER', count: 8 }] },
  'ARMOR_LEATHER_SET3': { productId: 'ARMOR_LEATHER_SET3', productName: 'Assassin Jacket', category: 'Armor', station: 'Hunter\'s Lodge', ingredients: [{ resourceType: 'LEATHER', count: 16 }] },
  'SHOES_LEATHER_SET3': { productId: 'SHOES_LEATHER_SET3', productName: 'Assassin Shoes', category: 'Armor', station: 'Hunter\'s Lodge', ingredients: [{ resourceType: 'LEATHER', count: 8 }] },

  // --- MAGE ---
  'MAIN_FIRESTAFF': {
    productId: 'MAIN_FIRESTAFF', productName: 'Fire Staff', category: 'Weapon', station: 'Mage\'s Tower',
    ingredients: [{ resourceType: 'PLANKS', count: 16 }, { resourceType: 'METALBAR', count: 8 }]
  },
  'MAIN_HOLYSTAFF': {
    productId: 'MAIN_HOLYSTAFF', productName: 'Holy Staff', category: 'Weapon', station: 'Mage\'s Tower',
    ingredients: [{ resourceType: 'PLANKS', count: 16 }, { resourceType: 'CLOTH', count: 8 }]
  },
  'MAIN_ARCANESTAFF': {
    productId: 'MAIN_ARCANESTAFF', productName: 'Arcane Staff', category: 'Weapon', station: 'Mage\'s Tower',
    ingredients: [{ resourceType: 'PLANKS', count: 16 }, { resourceType: 'METALBAR', count: 8 }]
  },
  'MAIN_FROSTSTAFF': {
    productId: 'MAIN_FROSTSTAFF', productName: 'Frost Staff', category: 'Weapon', station: 'Mage\'s Tower',
    ingredients: [{ resourceType: 'PLANKS', count: 16 }, { resourceType: 'METALBAR', count: 8 }]
  },
  'MAIN_CURSEDSTAFF': {
    productId: 'MAIN_CURSEDSTAFF', productName: 'Cursed Staff', category: 'Weapon', station: 'Mage\'s Tower',
    ingredients: [{ resourceType: 'PLANKS', count: 16 }, { resourceType: 'LEATHER', count: 8 }]
  },
  'HEAD_CLOTH_SET1': { productId: 'HEAD_CLOTH_SET1', productName: 'Scholar Cowl', category: 'Armor', station: 'Mage\'s Tower', ingredients: [{ resourceType: 'CLOTH', count: 8 }] },
  'ARMOR_CLOTH_SET1': { productId: 'ARMOR_CLOTH_SET1', productName: 'Scholar Robe', category: 'Armor', station: 'Mage\'s Tower', ingredients: [{ resourceType: 'CLOTH', count: 16 }] },
  'SHOES_CLOTH_SET1': { productId: 'SHOES_CLOTH_SET1', productName: 'Scholar Sandals', category: 'Armor', station: 'Mage\'s Tower', ingredients: [{ resourceType: 'CLOTH', count: 8 }] },
  // Cleric
  'HEAD_CLOTH_SET2': { productId: 'HEAD_CLOTH_SET2', productName: 'Cleric Cowl', category: 'Armor', station: 'Mage\'s Tower', ingredients: [{ resourceType: 'CLOTH', count: 8 }] },
  'ARMOR_CLOTH_SET2': { productId: 'ARMOR_CLOTH_SET2', productName: 'Cleric Robe', category: 'Armor', station: 'Mage\'s Tower', ingredients: [{ resourceType: 'CLOTH', count: 16 }] },
  'SHOES_CLOTH_SET2': { productId: 'SHOES_CLOTH_SET2', productName: 'Cleric Sandals', category: 'Armor', station: 'Mage\'s Tower', ingredients: [{ resourceType: 'CLOTH', count: 8 }] },
  // Mage
  'HEAD_CLOTH_SET3': { productId: 'HEAD_CLOTH_SET3', productName: 'Mage Cowl', category: 'Armor', station: 'Mage\'s Tower', ingredients: [{ resourceType: 'CLOTH', count: 8 }] },
  'ARMOR_CLOTH_SET3': { productId: 'ARMOR_CLOTH_SET3', productName: 'Mage Robe', category: 'Armor', station: 'Mage\'s Tower', ingredients: [{ resourceType: 'CLOTH', count: 16 }] },
  'SHOES_CLOTH_SET3': { productId: 'SHOES_CLOTH_SET3', productName: 'Mage Sandals', category: 'Armor', station: 'Mage\'s Tower', ingredients: [{ resourceType: 'CLOTH', count: 8 }] },

  // --- CONSUMABLES (FOOD) ---
  'MEAL_SOUP': {
    productId: 'MEAL_SOUP',
    productName: 'Soup',
    category: 'Consumable',
    station: 'Cook',
    ingredients: [], // Placeholder, driven by tier
    yield: 10,
    ingredientsByTier: {
      1: [{ resourceType: 'CARROT', count: 16 }], // Carrot Soup
      3: [{ resourceType: 'WHEAT', count: 16 }],  // Wheat Soup (Verify count)
      5: [{ resourceType: 'CABBAGE', count: 16 }], // Cabbage Soup
    }
  },
  'MEAL_SALAD': {
    productId: 'MEAL_SALAD',
    productName: 'Salad',
    category: 'Consumable',
    station: 'Cook',
    ingredients: [],
    yield: 10,
    ingredientsByTier: {
      2: [{ resourceType: 'BEAN', count: 16 }], // Bean Salad
      4: [{ resourceType: 'TURNIP', count: 16 }], // Turnip Salad
      6: [{ resourceType: 'POTATO', count: 16 }], // Potato Salad
    }
  },
  
  // --- POTIONS ---
  'POTION_HEAL': {
    productId: 'POTION_HEAL',
    productName: 'Healing Potion',
    category: 'Consumable',
    station: 'Alchemist\'s Lab',
    ingredients: [],
    yield: 5,
    ingredientsByTier: {
      2: [{ resourceType: 'AGARIC', count: 24 }], // Minor Healing (T2)
      4: [{ resourceType: 'BURDOCK', count: 24 }], // Healing (T4)
      6: [{ resourceType: 'FOXGLOVE', count: 24 }], // Major Healing (T6)
    }
  },
  'POTION_ENERGY': {
    productId: 'POTION_ENERGY',
    productName: 'Energy Potion',
    category: 'Consumable',
    station: 'Alchemist\'s Lab',
    ingredients: [],
    yield: 5,
    ingredientsByTier: {
        4: [{ resourceType: 'COMFREY', count: 24 }], // Energy (T4) - Uses T3 Comfrey? Usually T4 Pot uses T3 or T4 herb. Let's assume Comfrey.
        6: [{ resourceType: 'TEASEL', count: 24 }], // Major Energy (T6)
    }
  }
};

export function generateRecipe(itemId: string): Recipe | null {
  // 1. Parse Item ID
  // Format: T{Tier}_{Type} or T{Tier}_{Type}@{Enchantment}
  const match = itemId.match(/^T(\d+)_([A-Z0-9_]+?)(?:@(\d+))?$/);
  if (!match) return null;

  const tier = parseInt(match[1]);
  const type = match[2];
  
  // 2. Lookup Base Recipe
  const baseRecipe = BASE_RECIPES[type];
  if (!baseRecipe) return null;

  // 3. Resolve Ingredients
  let ingredients = baseRecipe.ingredients;
  
  // Check for tier-specific overrides
  if (baseRecipe.ingredientsByTier && baseRecipe.ingredientsByTier[tier]) {
    ingredients = baseRecipe.ingredientsByTier[tier];
  }

  // 4. Map to Recipe Interface
  // Helper to map ingredients
  const mapIngredients = (ings: { resourceType: string; count: number; tierOffset?: number }[]) => {
      return ings.map(ing => {
        const resourceId = RESOURCE_MAP[ing.resourceType];
        let finalItemId = resourceId;
        let isEnchantable = false;

        if (!resourceId) {
            finalItemId = ing.resourceType;
        } else if (resourceId.startsWith('T')) {
            finalItemId = resourceId;
            isEnchantable = false; 
        } else {
            finalItemId = resourceId;
            isEnchantable = true;
        }

        return {
            itemId: finalItemId,
            count: ing.count,
            isEnchantable,
            tierOffset: ing.tierOffset || 0
        };
      });
  };

  const mappedIngredients = mapIngredients(ingredients);

  // Map ingredientsByTier if exists
  let mappedIngredientsByTier: Record<number, Ingredient[]> | undefined = undefined;
  if (baseRecipe.ingredientsByTier) {
      mappedIngredientsByTier = {};
      Object.entries(baseRecipe.ingredientsByTier).forEach(([t, ings]) => {
          if (mappedIngredientsByTier) {
              mappedIngredientsByTier[parseInt(t)] = mapIngredients(ings);
          }
      });
  }

  // 5. Construct Recipe
  return {
    id: itemId,
    productId: type,
    productName: baseRecipe.productName,
    category: baseRecipe.category,
    station: baseRecipe.station,
    ingredients: mappedIngredients,
    ingredientsByTier: mappedIngredientsByTier,
    yield: baseRecipe.yield || 1
  };
}

export function createRecipeFromApi(itemId: string, apiData: any): Recipe | null {
    if (!apiData || !apiData.craftingRequirements) return null;

    const match = itemId.match(/^T(\d+)_([A-Z0-9_]+?)(?:@(\d+))?$/);
    if (!match) return null;
    const productTier = parseInt(match[1]);
    const productType = match[2];

    const requirements = apiData.craftingRequirements;
    const resources = requirements.craftResourceList || [];

    const ingredients: Ingredient[] = resources.map((res: any) => {
        const resMatch = res.uniqueName.match(/^T(\d+)_([A-Z0-9_]+?)(?:@(\d+))?$/);
        let tierOffset = 0;
        let finalItemId = res.uniqueName;
        let isEnchantable = false;

        if (resMatch) {
            const ingTier = parseInt(resMatch[1]);
            const ingType = resMatch[2];
            tierOffset = ingTier - productTier;
            
            // Heuristic: If it's a common resource (Ore, Wood, etc), use base type
            // Otherwise use absolute ID if it looks like a specific item (e.g. Artifact)
            // But to support multi-tier scaling, we prefer base types + offset
            
            // Check if it is a basic resource
            if (['ORE', 'WOOD', 'HIDE', 'FIBER', 'ROCK', 'METALBAR', 'LEATHER', 'CLOTH', 'PLANKS', 'STONEBLOCK'].includes(ingType)) {
                finalItemId = ingType;
                isEnchantable = true;
            } else {
                // Keep as absolute for now, but strip tier to allow reconstruction?
                // Actually, if we use the "Generic" approach, we want T{tier}_TYPE.
                // If we set finalItemId to just TYPE, the calculator will rebuild it as T{productTier+offset}_TYPE.
                // This works for most things.
                finalItemId = ingType;
                // If it was absolute T4_X, and we want T{tier}_X, we set isEnchantable based on if it has enchants?
                // Most craftable items are enchantable or resources are.
                // Let's assume yes if it's not a tool/furniture.
                isEnchantable = true;
            }
        }

        return {
            itemId: finalItemId,
            count: res.count,
            tierOffset: tierOffset,
            isEnchantable
        };
    });

    return {
        id: itemId,
        productId: productType,
        productName: apiData.localizedNames?.['EN-US'] || itemId,
        category: 'Weapon', // Default, maybe infer from folder/subfolder if available?
        station: 'Warrior\'s Forge', // Unknown
        ingredients: ingredients,
        yield: requirements.amountCrafted || 1
    };
}
export function getAllRecipes(): Recipe[] {
    return Object.values(BASE_RECIPES).map(base => {
         let tier = 4;
         // If base ingredients are empty (e.g. tier-specific only), pick the first available tier
         if (base.ingredients.length === 0 && base.ingredientsByTier) {
             const tiers = Object.keys(base.ingredientsByTier).map(Number).sort((a, b) => a - b);
             if (tiers.length > 0) tier = tiers[0];
         }
         return generateRecipe(`T${tier}_${base.productId}`);
    }).filter(r => r !== null) as Recipe[];
}

// Export available base types for browsing
export const AVAILABLE_RECIPES = Object.values(BASE_RECIPES).map(r => ({
    type: r.productId,
    name: r.productName,
    category: r.category
}));
