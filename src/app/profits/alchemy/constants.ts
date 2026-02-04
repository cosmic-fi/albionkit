export interface Ingredient {
  itemId: string;
  name: string;
  count: number;
  weight?: number;
  enchantable?: boolean; // If true, this ingredient should be enchanted when the product is enchanted
}

export interface AlchemyRecipe {
  id: string;
  name: string;
  tier: number;
  productId: string;
  yield: number;
  nutrition: number; // For consistency with FoodRecipe, though less used
  itemWeight: number;
  ingredients: Ingredient[];
}

// Standard Weights
export const WEIGHT_POTION = 0.5;

export const RECIPES: AlchemyRecipe[] = [
  // --- POISON POTIONS ---
  {
    id: 'T4_POTION_POISON',
    name: 'Poison Potion',
    tier: 4,
    productId: 'T4_POTION_POISON',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T4_BURDOCK', name: 'Crenellated Burdock', count: 12, enchantable: true },
      { itemId: 'T4_MILK', name: 'Goat\'s Milk', count: 12 } // 12 herbs, 12 milk -> yield 5? (Values approx)
    ]
  },
  {
    id: 'T6_POTION_POISON',
    name: 'Major Poison Potion', // Often referred to as Major in legacy or just T6
    tier: 6,
    productId: 'T6_POTION_POISON',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T6_FOXGLOVE', name: 'Elusive Foxglove', count: 24, enchantable: true },
      { itemId: 'T6_MILK', name: 'Sheep\'s Milk', count: 12 },
      { itemId: 'T6_ALCOHOL', name: 'Potato Schnapps', count: 6 } // Alcohol added in higher tiers?
    ]
  },
  {
    id: 'T8_POTION_POISON',
    name: 'Grandmaster Poison Potion',
    tier: 8,
    productId: 'T8_POTION_POISON',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T8_YARROW', name: 'Ghoul Yarrow', count: 72, enchantable: true },
      { itemId: 'T8_MILK', name: 'Cow\'s Milk', count: 36 },
      { itemId: 'T8_ALCOHOL', name: 'Pumpkin Moonshine', count: 18 }
    ]
  },

  // --- HEALING POTIONS ---
  {
    id: 'T4_POTION_HEAL',
    name: 'Healing Potion',
    tier: 4,
    productId: 'T4_POTION_HEAL',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T4_BURDOCK', name: 'Crenellated Burdock', count: 24, enchantable: true },
      { itemId: 'T3_EGG', name: 'Hen Eggs', count: 6 }
    ]
  },
  {
    id: 'T6_POTION_HEAL',
    name: 'Major Healing Potion',
    tier: 6,
    productId: 'T6_POTION_HEAL',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T6_FOXGLOVE', name: 'Elusive Foxglove', count: 72, enchantable: true },
      { itemId: 'T5_EGG', name: 'Goose Eggs', count: 18 },
      { itemId: 'T6_ALCOHOL', name: 'Potato Schnapps', count: 18 }
    ]
  },

  // --- ENERGY POTIONS ---
  {
    id: 'T4_POTION_ENERGY',
    name: 'Energy Potion',
    tier: 4,
    productId: 'T4_POTION_ENERGY',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T4_BURDOCK', name: 'Crenellated Burdock', count: 24, enchantable: true },
      { itemId: 'T4_MILK', name: 'Goat\'s Milk', count: 6 }
    ]
  },
  
  // --- INVISIBILITY POTIONS ---
  {
    id: 'T8_POTION_INVIS',
    name: 'Invisibility Potion',
    tier: 8,
    productId: 'T8_POTION_INVIS',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T8_YARROW', name: 'Ghoul Yarrow', count: 72, enchantable: true },
      { itemId: 'T8_ALCOHOL', name: 'Pumpkin Moonshine', count: 36 }
    ]
  }
];

export const CITY_OPTIONS = [
  { value: 'Bridgewatch', label: 'Bridgewatch' },
  { value: 'Fort Sterling', label: 'Fort Sterling' },
  { value: 'Lymhurst', label: 'Lymhurst' },
  { value: 'Martlock', label: 'Martlock' },
  { value: 'Thetford', label: 'Thetford' },
  { value: 'Caerleon', label: 'Caerleon' },
  { value: 'Brecilien', label: 'Brecilien' },
  { value: 'Black Market', label: 'Black Market' }
];
