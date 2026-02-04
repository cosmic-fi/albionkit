export interface Ingredient {
  itemId: string;
  name: string;
  count: number;
  weight?: number;
}

export interface FoodRecipe {
  id: string;
  name: string;
  tier: number;
  productId: string;
  yield: number;
  nutrition: number;
  itemWeight: number;
  ingredients: Ingredient[];
}

// Standard Weights
const WEIGHT_FOOD = 0.5; // kg
const WEIGHT_SANDWICH = 0.5;
const WEIGHT_STEW = 0.5;
const WEIGHT_ROAST = 0.5;
const WEIGHT_SOUP = 0.5;

export const RECIPES: FoodRecipe[] = [
  // --- STEWS (Combat Damage) ---
  {
    id: 'T4_MEAL_STEW',
    name: 'Goat Stew',
    tier: 4,
    productId: 'T4_MEAL_STEW',
    yield: 10,
    nutrition: 54,
    itemWeight: WEIGHT_STEW,
    ingredients: [
      { itemId: 'T4_MEAT', name: 'Raw Goat', count: 18 },
      { itemId: 'T4_TURNIP', name: 'Turnips', count: 18 },
      { itemId: 'T4_BREAD', name: 'Bread', count: 9 }
    ]
  },
  {
    id: 'T6_MEAL_STEW',
    name: 'Mutton Stew',
    tier: 6,
    productId: 'T6_MEAL_STEW',
    yield: 10,
    nutrition: 108,
    itemWeight: WEIGHT_STEW,
    ingredients: [
      { itemId: 'T6_MEAT', name: 'Raw Mutton', count: 36 },
      { itemId: 'T6_POTATO', name: 'Potatoes', count: 36 },
      { itemId: 'T4_BREAD', name: 'Bread', count: 18 }
    ]
  },
  {
    id: 'T8_MEAL_STEW',
    name: 'Beef Stew',
    tier: 8,
    productId: 'T8_MEAL_STEW',
    yield: 10,
    nutrition: 216,
    itemWeight: WEIGHT_STEW,
    ingredients: [
      { itemId: 'T8_MEAT', name: 'Raw Beef', count: 72 },
      { itemId: 'T6_POTATO', name: 'Potatoes', count: 72 },
      { itemId: 'T7_CORN', name: 'Bundle of Corn', count: 36 }
    ]
  },

  // --- SANDWICHES (Max Health) ---
  {
    id: 'T4_MEAL_SANDWICH',
    name: 'Goat Sandwich',
    tier: 4,
    productId: 'T4_MEAL_SANDWICH',
    yield: 10,
    nutrition: 54,
    itemWeight: WEIGHT_SANDWICH,
    ingredients: [
      { itemId: 'T4_BREAD', name: 'Bread', count: 18 },
      { itemId: 'T4_MEAT', name: 'Raw Goat', count: 18 },
      { itemId: 'T4_BUTTER', name: 'Goat Butter', count: 9 }
    ]
  },
  {
    id: 'T6_MEAL_SANDWICH',
    name: 'Mutton Sandwich',
    tier: 6,
    productId: 'T6_MEAL_SANDWICH',
    yield: 10,
    nutrition: 108,
    itemWeight: WEIGHT_SANDWICH,
    ingredients: [
      { itemId: 'T4_BREAD', name: 'Bread', count: 36 },
      { itemId: 'T6_MEAT', name: 'Raw Mutton', count: 36 },
      { itemId: 'T6_BUTTER', name: 'Sheep Butter', count: 18 }
    ]
  },
  {
    id: 'T8_MEAL_SANDWICH',
    name: 'Beef Sandwich',
    tier: 8,
    productId: 'T8_MEAL_SANDWICH',
    yield: 10,
    nutrition: 216,
    itemWeight: WEIGHT_SANDWICH,
    ingredients: [
      { itemId: 'T4_BREAD', name: 'Bread', count: 72 },
      { itemId: 'T8_MEAT', name: 'Raw Beef', count: 72 },
      { itemId: 'T8_BUTTER', name: 'Cow Butter', count: 36 }
    ]
  },

  // --- SOUPS (Health Regen) ---
  {
    id: 'T1_MEAL_SOUP',
    name: 'Carrot Soup',
    tier: 1,
    productId: 'T1_MEAL_SOUP',
    yield: 10,
    nutrition: 14,
    itemWeight: WEIGHT_SOUP,
    ingredients: [
      { itemId: 'T1_CARROT', name: 'Carrots', count: 16 }
    ]
  },
  {
    id: 'T3_MEAL_SOUP',
    name: 'Wheat Soup',
    tier: 3,
    productId: 'T3_MEAL_SOUP',
    yield: 10,
    nutrition: 28,
    itemWeight: WEIGHT_SOUP,
    ingredients: [
      { itemId: 'T3_WHEAT', name: 'Sheaf of Wheat', count: 32 },
      { itemId: 'T3_FLOUR', name: 'Flour', count: 16 }
    ]
  },
  {
    id: 'T5_MEAL_SOUP',
    name: 'Cabbage Soup',
    tier: 5,
    productId: 'T5_MEAL_SOUP',
    yield: 10,
    nutrition: 84,
    itemWeight: WEIGHT_SOUP,
    ingredients: [
      { itemId: 'T5_CABBAGE', name: 'Cabbage', count: 48 },
      { itemId: 'T3_FLOUR', name: 'Flour', count: 16 }
    ]
  },

  // --- ROASTS (Life Steal / Crowd Control) ---
  {
    id: 'T3_MEAL_ROAST',
    name: 'Roast Chicken',
    tier: 3,
    productId: 'T3_MEAL_ROAST',
    yield: 10,
    nutrition: 28,
    itemWeight: WEIGHT_ROAST,
    ingredients: [
      { itemId: 'T3_MEAT', name: 'Raw Chicken', count: 16 },
      { itemId: 'T2_BEAN', name: 'Beans', count: 16 },
      { itemId: 'T4_MILK', name: 'Goat Milk', count: 8 }
    ]
  },
  {
    id: 'T5_MEAL_ROAST',
    name: 'Roast Goose',
    tier: 5,
    productId: 'T5_MEAL_ROAST',
    yield: 10,
    nutrition: 84,
    itemWeight: WEIGHT_ROAST,
    ingredients: [
      { itemId: 'T5_MEAT', name: 'Raw Goose', count: 32 },
      { itemId: 'T5_CABBAGE', name: 'Cabbage', count: 32 },
      { itemId: 'T6_MILK', name: 'Sheep Milk', count: 16 }
    ]
  },
  {
    id: 'T7_MEAL_ROAST',
    name: 'Roast Pork',
    tier: 7,
    productId: 'T7_MEAL_ROAST',
    yield: 10,
    nutrition: 168,
    itemWeight: WEIGHT_ROAST,
    ingredients: [
      { itemId: 'T7_MEAT', name: 'Raw Pork', count: 64 },
      { itemId: 'T7_CORN', name: 'Bundle of Corn', count: 64 },
      { itemId: 'T8_MILK', name: 'Cow Milk', count: 32 }
    ]
  },

  // --- PIES (Max Load / Gather Yield) ---
  {
    id: 'T3_MEAL_PIE',
    name: 'Chicken Pie',
    tier: 3,
    productId: 'T3_MEAL_PIE',
    yield: 10,
    nutrition: 28,
    itemWeight: 0.5,
    ingredients: [
      { itemId: 'T3_MEAT', name: 'Raw Chicken', count: 8 },
      { itemId: 'T3_WHEAT', name: 'Sheaf of Wheat', count: 16 },
      { itemId: 'T3_FLOUR', name: 'Flour', count: 8 }
    ]
  },
  {
    id: 'T5_MEAL_PIE',
    name: 'Goose Pie',
    tier: 5,
    productId: 'T5_MEAL_PIE',
    yield: 10,
    nutrition: 84,
    itemWeight: 0.5,
    ingredients: [
      { itemId: 'T5_MEAT', name: 'Raw Goose', count: 16 },
      { itemId: 'T5_CABBAGE', name: 'Cabbage', count: 32 },
      { itemId: 'T3_FLOUR', name: 'Flour', count: 16 },
      { itemId: 'T4_MILK', name: 'Goat Milk', count: 8 }
    ]
  },
  {
    id: 'T7_MEAL_PIE',
    name: 'Pork Pie',
    tier: 7,
    productId: 'T7_MEAL_PIE',
    yield: 10,
    nutrition: 168,
    itemWeight: 0.5,
    ingredients: [
      { itemId: 'T7_MEAT', name: 'Raw Pork', count: 32 },
      { itemId: 'T7_CORN', name: 'Bundle of Corn', count: 64 },
      { itemId: 'T3_FLOUR', name: 'Flour', count: 32 },
      { itemId: 'T6_MILK', name: 'Sheep Milk', count: 16 }
    ]
  },

  // --- OMELETTES (Cooldown / Cast Speed) ---
  {
    id: 'T3_MEAL_OMELETTE',
    name: 'Chicken Omelette',
    tier: 3,
    productId: 'T3_MEAL_OMELETTE',
    yield: 10,
    nutrition: 28,
    itemWeight: 0.3,
    ingredients: [
      { itemId: 'T3_MEAT', name: 'Raw Chicken', count: 8 },
      { itemId: 'T3_EGG', name: 'Hen Eggs', count: 16 },
      { itemId: 'T3_WHEAT', name: 'Sheaf of Wheat', count: 4 }
    ]
  },
  {
    id: 'T5_MEAL_OMELETTE',
    name: 'Goose Omelette',
    tier: 5,
    productId: 'T5_MEAL_OMELETTE',
    yield: 10,
    nutrition: 84,
    itemWeight: 0.3,
    ingredients: [
      { itemId: 'T5_MEAT', name: 'Raw Goose', count: 16 },
      { itemId: 'T5_EGG', name: 'Goose Eggs', count: 32 },
      { itemId: 'T5_CABBAGE', name: 'Cabbage', count: 8 }
    ]
  },
  {
    id: 'T7_MEAL_OMELETTE',
    name: 'Pork Omelette',
    tier: 7,
    productId: 'T7_MEAL_OMELETTE',
    yield: 10,
    nutrition: 168,
    itemWeight: 0.3,
    ingredients: [
      { itemId: 'T7_MEAT', name: 'Raw Pork', count: 32 },
      { itemId: 'T5_EGG', name: 'Goose Eggs', count: 64 },
      { itemId: 'T7_CORN', name: 'Bundle of Corn', count: 16 }
    ]
  },

  // --- SALADS (Crafting Speed / Quality) ---
  {
    id: 'T2_MEAL_SALAD',
    name: 'Bean Salad',
    tier: 2,
    productId: 'T2_MEAL_SALAD',
    yield: 10,
    nutrition: 14,
    itemWeight: 0.2,
    ingredients: [
      { itemId: 'T2_BEAN', name: 'Beans', count: 16 },
      { itemId: 'T1_CARROT', name: 'Carrots', count: 8 }
    ]
  },
  {
    id: 'T4_MEAL_SALAD',
    name: 'Turnip Salad',
    tier: 4,
    productId: 'T4_MEAL_SALAD',
    yield: 10,
    nutrition: 54,
    itemWeight: 0.2,
    ingredients: [
      { itemId: 'T4_TURNIP', name: 'Turnips', count: 32 },
      { itemId: 'T2_BEAN', name: 'Beans', count: 16 },
      { itemId: 'T3_WHEAT', name: 'Sheaf of Wheat', count: 8 }
    ]
  },
  {
    id: 'T6_MEAL_SALAD',
    name: 'Potato Salad',
    tier: 6,
    productId: 'T6_MEAL_SALAD',
    yield: 10,
    nutrition: 108,
    itemWeight: 0.2,
    ingredients: [
      { itemId: 'T6_POTATO', name: 'Potatoes', count: 64 },
      { itemId: 'T4_TURNIP', name: 'Turnips', count: 32 },
      { itemId: 'T2_BEAN', name: 'Beans', count: 16 }
    ]
  }
];

export const FISH_SAUCES = [
  { id: 'T4_FISHSAUCE_LEVEL1', name: 'Basic Fish Sauce' },
  { id: 'T6_FISHSAUCE_LEVEL2', name: 'Fancy Fish Sauce' },
  { id: 'T8_FISHSAUCE_LEVEL3', name: 'Special Fish Sauce' }
];
