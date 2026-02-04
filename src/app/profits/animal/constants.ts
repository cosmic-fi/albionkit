// Minimal definitions for ID generation
export const ANIMAL_DEFINITIONS = [
  { id: 'chicken', tier: 3, type: 'pasture' },
  { id: 'goat', tier: 4, type: 'pasture' },
  { id: 'goose', tier: 5, type: 'pasture' },
  { id: 'sheep', tier: 6, type: 'pasture' },
  { id: 'pig', tier: 7, type: 'pasture' },
  { id: 'cow', tier: 8, type: 'pasture' },
  { id: 'horse', tier: 3, type: 'mount' },
  { id: 'ox', tier: 3, type: 'mount' }
];

export interface Animal {
  id: string;
  name: string;
  tier: number;
  babyId: string;
  adultId: string;
  growthTime: number;
  foodConsumption: number;
  offspringRate: number;
  offspringRateFocus: number;
  produceId?: string;
  produceYield?: number;
  meatId?: string;
  meatYield?: number;
  favoriteFoodId?: string;
}

// Deprecated: ANIMALS constant removed in favor of dynamic generation
export const ANIMALS: Animal[] = [];
