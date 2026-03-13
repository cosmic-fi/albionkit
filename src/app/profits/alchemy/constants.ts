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
  // --- POISON POTIONS (using correct Albion item IDs) ---
  {
    id: 'T4_POTION_COOLDOWN',
    name: 'Poison Potion',
    tier: 4,
    productId: 'T4_POTION_COOLDOWN',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T4_BURDOCK', name: '', count: 12, enchantable: true },
      { itemId: 'T4_MILK', name: '', count: 12 }
    ]
  },
  {
    id: 'T6_POTION_COOLDOWN',
    name: 'Major Poison Potion',
    tier: 6,
    productId: 'T6_POTION_COOLDOWN',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T6_FOXGLOVE', name: '', count: 24, enchantable: true },
      { itemId: 'T6_MILK', name: '', count: 12 },
      { itemId: 'T6_ALCOHOL', name: '', count: 6 }
    ]
  },
  {
    id: 'T8_POTION_COOLDOWN',
    name: 'Grandmaster Poison Potion',
    tier: 8,
    productId: 'T8_POTION_COOLDOWN',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T8_YARROW', name: '', count: 72, enchantable: true },
      { itemId: 'T8_MILK', name: '', count: 36 },
      { itemId: 'T8_ALCOHOL', name: '', count: 18 }
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
      { itemId: 'T4_BURDOCK', name: '', count: 24, enchantable: true },
      { itemId: 'T3_EGG', name: '', count: 6 }
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
      { itemId: 'T6_FOXGLOVE', name: '', count: 72, enchantable: true },
      { itemId: 'T5_EGG', name: '', count: 18 },
      { itemId: 'T6_ALCOHOL', name: '', count: 18 }
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
      { itemId: 'T4_BURDOCK', name: '', count: 24, enchantable: true },
      { itemId: 'T4_MILK', name: '', count: 6 }
    ]
  },

  // --- FOCUS POTIONS (RESTORATION) ---
  {
    id: 'UNIQUE_FOCUSPOTION_ADC_GENERAL_01',
    name: 'Focus Restoration Potion',
    tier: 8,
    productId: 'UNIQUE_FOCUSPOTION_ADC_GENERAL_01',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T8_YARROW', name: '', count: 72, enchantable: true },
      { itemId: 'T8_ALCOHOL', name: '', count: 36 }
    ]
  },

  // --- INVISIBILITY POTIONS ---
  {
    id: 'T8_POTION_CLEANSE',
    name: 'Invisibility Potion',
    tier: 8,
    productId: 'T8_POTION_CLEANSE',
    yield: 5,
    nutrition: 0,
    itemWeight: WEIGHT_POTION,
    ingredients: [
      { itemId: 'T8_YARROW', name: '', count: 72, enchantable: true },
      { itemId: 'T8_ALCOHOL', name: '', count: 36 }
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
