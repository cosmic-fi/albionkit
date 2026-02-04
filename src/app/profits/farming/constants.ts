export interface Crop {
  id: string;
  name: string;
  tier: number;
  seedId: string;
  produceId: string;
  type: 'crop' | 'herb';
  baseYield: number; // Average yield without focus
  seedReturnRate: number; // Percentage chance to get seed back without focus
  focusCost: number; // Focus cost to water
  seedReturnRateFocus: number; // Seed return rate with focus
}

// Minimal definitions
export const CROP_DEFINITIONS: { id: string; tier: number; type: 'crop' | 'herb' }[] = [
  // Crops
  { id: 'carrot', tier: 1, type: 'crop' },
  { id: 'bean', tier: 2, type: 'crop' },
  { id: 'wheat', tier: 3, type: 'crop' },
  { id: 'turnip', tier: 4, type: 'crop' },
  { id: 'cabbage', tier: 5, type: 'crop' },
  { id: 'potato', tier: 6, type: 'crop' },
  { id: 'corn', tier: 7, type: 'crop' },
  { id: 'pumpkin', tier: 8, type: 'crop' },

  // Herbs
  { id: 'agaric', tier: 2, type: 'herb' },
  { id: 'comfrey', tier: 3, type: 'herb' },
  { id: 'burdock', tier: 4, type: 'herb' },
  { id: 'teasel', tier: 5, type: 'herb' },
  { id: 'foxglove', tier: 6, type: 'herb' },
  { id: 'mullein', tier: 7, type: 'herb' },
  { id: 'yarrow', tier: 8, type: 'herb' }
];

// Deprecated: CROPS replaced by dynamic generation
export const CROPS: Crop[] = [];
