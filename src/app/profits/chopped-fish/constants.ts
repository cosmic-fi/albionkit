export interface FishType {
  id: string;
  name: string;
  tier: number;
  choppedYield: number;
  isRare?: boolean;
}

export const CHOPPED_FISH_PRODUCT_ID = 'T1_FISHCHOPS';

// Minimal definitions to generate the full list
export const FISH_DEFINITIONS = [
  // Common Freshwater
  { id: 'T3_FISH_FRESHWATER_ALL_COMMON', tier: 3, isRare: false },
  { id: 'T4_FISH_FRESHWATER_ALL_COMMON', tier: 4, isRare: false },
  { id: 'T5_FISH_FRESHWATER_ALL_COMMON', tier: 5, isRare: false },
  { id: 'T6_FISH_FRESHWATER_ALL_COMMON', tier: 6, isRare: false },
  { id: 'T7_FISH_FRESHWATER_ALL_COMMON', tier: 7, isRare: false },
  { id: 'T8_FISH_FRESHWATER_ALL_COMMON', tier: 8, isRare: false },

  // Common Saltwater
  { id: 'T3_FISH_SALTWATER_ALL_COMMON', tier: 3, isRare: false },
  { id: 'T4_FISH_SALTWATER_ALL_COMMON', tier: 4, isRare: false },
  { id: 'T5_FISH_SALTWATER_ALL_COMMON', tier: 5, isRare: false },
  { id: 'T6_FISH_SALTWATER_ALL_COMMON', tier: 6, isRare: false },
  { id: 'T7_FISH_SALTWATER_ALL_COMMON', tier: 7, isRare: false },
  { id: 'T8_FISH_SALTWATER_ALL_COMMON', tier: 8, isRare: false },

  // Rares (Specific IDs)
  // T3
  { id: 'T3_FISH_FRESHWATER_SWAMP_RARE', tier: 3, isRare: true },
  { id: 'T3_FISH_SALTWATER_ALL_RARE', tier: 3, isRare: true },
  { id: 'T3_FISH_FRESHWATER_FOREST_RARE', tier: 3, isRare: true },
  
  // T5
  { id: 'T5_FISH_SALTWATER_ALL_RARE', tier: 5, isRare: true },
  { id: 'T5_FISH_FRESHWATER_FOREST_RARE', tier: 5, isRare: true },
  { id: 'T5_FISH_FRESHWATER_HIGHLANDS_RARE', tier: 5, isRare: true },
  { id: 'T5_FISH_FRESHWATER_SWAMP_RARE', tier: 5, isRare: true },

  // T7
  { id: 'T7_FISH_SALTWATER_ALL_RARE', tier: 7, isRare: true },
  { id: 'T7_FISH_FRESHWATER_SWAMP_RARE', tier: 7, isRare: true },
  { id: 'T7_FISH_FRESHWATER_FOREST_RARE', tier: 7, isRare: true },
  { id: 'T7_FISH_FRESHWATER_HIGHLANDS_RARE', tier: 7, isRare: true },

  // T8 Boss
  { id: 'T8_FISH_SALTWATER_ALL_BOSS_SHARK', tier: 8, isRare: true }
];

// Deprecated: FISH_TYPES replaced by dynamic generation
export const FISH_TYPES: FishType[] = [];
