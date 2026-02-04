
export interface Ingredient {
  itemId: string;
  count: number;
  isEnchantable?: boolean; // If true, matches the tier/enchantment of the product
  tierOffset?: number; // e.g. -1 for using lower tier refined material
}

export interface Recipe {
  id: string;
  productId: string;
  productName: string;
  category: 'Refining' | 'Weapon' | 'Armor' | 'Consumable' | 'Tool';
  station: string;
  ingredients: Ingredient[];
  ingredientsByTier?: Record<number, Ingredient[]>; // Optional override per tier
  craftingFocus?: number;
  yield?: number; // Amount produced per craft (default 1)
}

export const RECIPES: Recipe[] = [
  // --- Weapons ---
  {
    id: 'BROADSWORD',
    productId: 'MAIN_SWORD',
    productName: 'Broadsword',
    category: 'Weapon',
    station: 'Warrior\'s Forge',
    ingredients: [
      { itemId: 'METALBAR', count: 16, isEnchantable: true },
      { itemId: 'LEATHER', count: 8, isEnchantable: true }
    ]
  },
  {
    id: 'CLAYMORE',
    productId: '2H_CLAYMORE',
    productName: 'Claymore',
    category: 'Weapon',
    station: 'Warrior\'s Forge',
    ingredients: [
      { itemId: 'METALBAR', count: 20, isEnchantable: true },
      { itemId: 'LEATHER', count: 12, isEnchantable: true }
    ]
  },
  {
    id: 'BATTLEAXE',
    productId: 'MAIN_AXE',
    productName: 'Battleaxe',
    category: 'Weapon',
    station: 'Warrior\'s Forge',
    ingredients: [
      { itemId: 'METALBAR', count: 16, isEnchantable: true },
      { itemId: 'PLANKS', count: 8, isEnchantable: true }
    ]
  },
  
  // --- Armor ---
  {
    id: 'SCHOLAR_COWL',
    productId: 'HEAD_CLOTH_SET2',
    productName: 'Scholar Cowl',
    category: 'Armor',
    station: 'Mage\'s Tower',
    ingredients: [
      { itemId: 'CLOTH', count: 8, isEnchantable: true }
    ]
  },
  {
    id: 'CLERIC_ROBE',
    productId: 'ARMOR_CLOTH_SET2',
    productName: 'Cleric Robe',
    category: 'Armor',
    station: 'Mage\'s Tower',
    ingredients: [
      { itemId: 'CLOTH', count: 16, isEnchantable: true }
    ]
  },
  {
    id: 'SOLDIER_BOOTS',
    productId: 'SHOES_PLATE_SET1',
    productName: 'Soldier Boots',
    category: 'Armor',
    station: 'Warrior\'s Forge',
    ingredients: [
      { itemId: 'METALBAR', count: 8, isEnchantable: true }
    ]
  },

  // --- Refining (Simplified - T4 Baseline) ---
  {
    id: 'ORE_REFINING',
    productId: 'METALBAR',
    productName: 'Metal Bar (Refining)',
    category: 'Refining',
    station: 'Smelter',
    ingredients: [
      { itemId: 'ORE', count: 2, isEnchantable: true },
      { itemId: 'METALBAR', count: 1, isEnchantable: false, tierOffset: -1 }
    ]
  },
  {
    id: 'FIBER_REFINING',
    productId: 'CLOTH',
    productName: 'Cloth (Refining)',
    category: 'Refining',
    station: 'Weaver',
    ingredients: [
      { itemId: 'FIBER', count: 2, isEnchantable: true },
      { itemId: 'CLOTH', count: 1, isEnchantable: false, tierOffset: -1 }
    ]
  },
   {
    id: 'HIDE_REFINING',
    productId: 'LEATHER',
    productName: 'Leather (Refining)',
    category: 'Refining',
    station: 'Tanner',
    ingredients: [
      { itemId: 'HIDE', count: 2, isEnchantable: true },
      { itemId: 'LEATHER', count: 1, isEnchantable: false, tierOffset: -1 }
    ]
  }
];

export const CATEGORIES = ['Weapon', 'Armor', 'Refining'];
