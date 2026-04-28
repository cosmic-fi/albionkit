export interface FactionReward {
  id: string;
  name: string;
  pointCost: number;
  faction: string;
  category: 'heart' | 'crest' | 'mount' | 'chest';
  tier?: number;
}

export const FACTION_REWARDS: FactionReward[] = [
  // Hearts (Tokens) - Cost: 3,000 pts
  { id: 'T1_FACTION_HIGHLAND_TOKEN_1', name: 'Rock Heart', pointCost: 3000, faction: 'Martlock', category: 'heart' },
  { id: 'T1_FACTION_FOREST_TOKEN_1', name: 'Tree Heart', pointCost: 3000, faction: 'Lymhurst', category: 'heart' },
  { id: 'T1_FACTION_SWAMP_TOKEN_1', name: 'Vine Heart', pointCost: 3000, faction: 'Thetford', category: 'heart' },
  { id: 'T1_FACTION_MOUNTAIN_TOKEN_1', name: 'Mountain Heart', pointCost: 3000, faction: 'Fort Sterling', category: 'heart' },
  { id: 'T1_FACTION_STEPPE_TOKEN_1', name: 'Beast Heart', pointCost: 3000, faction: 'Bridgewatch', category: 'heart' },
  { id: 'T1_FACTION_CAERLEON_TOKEN_1', name: 'Shadowheart', pointCost: 3000, faction: 'Caerleon', category: 'heart' },
  
  // Crests (Blueprints) - Costs: T4: 1,000, T5: 3,000, T6: 9,000, T7: 25,000, T8: 50,000
  // Martlock
  { id: 'T4_CAPEITEM_FW_MARTLOCK_BP', name: 'Adept\'s Martlock Crest', pointCost: 1000, faction: 'Martlock', category: 'crest', tier: 4 },
  { id: 'T5_CAPEITEM_FW_MARTLOCK_BP', name: 'Expert\'s Martlock Crest', pointCost: 3000, faction: 'Martlock', category: 'crest', tier: 5 },
  { id: 'T6_CAPEITEM_FW_MARTLOCK_BP', name: 'Master\'s Martlock Crest', pointCost: 9000, faction: 'Martlock', category: 'crest', tier: 6 },
  { id: 'T7_CAPEITEM_FW_MARTLOCK_BP', name: 'Grandmaster\'s Martlock Crest', pointCost: 25000, faction: 'Martlock', category: 'crest', tier: 7 },
  { id: 'T8_CAPEITEM_FW_MARTLOCK_BP', name: 'Elder\'s Martlock Crest', pointCost: 50000, faction: 'Martlock', category: 'crest', tier: 8 },
  
  // Lymhurst
  { id: 'T4_CAPEITEM_FW_LYMHURST_BP', name: 'Adept\'s Lymhurst Crest', pointCost: 1000, faction: 'Lymhurst', category: 'crest', tier: 4 },
  { id: 'T5_CAPEITEM_FW_LYMHURST_BP', name: 'Expert\'s Lymhurst Crest', pointCost: 3000, faction: 'Lymhurst', category: 'crest', tier: 5 },
  { id: 'T6_CAPEITEM_FW_LYMHURST_BP', name: 'Master\'s Lymhurst Crest', pointCost: 9000, faction: 'Lymhurst', category: 'crest', tier: 6 },
  { id: 'T7_CAPEITEM_FW_LYMHURST_BP', name: 'Grandmaster\'s Lymhurst Crest', pointCost: 25000, faction: 'Lymhurst', category: 'crest', tier: 7 },
  { id: 'T8_CAPEITEM_FW_LYMHURST_BP', name: 'Elder\'s Lymhurst Crest', pointCost: 50000, faction: 'Lymhurst', category: 'crest', tier: 8 },

  // Thetford
  { id: 'T4_CAPEITEM_FW_THETFORD_BP', name: 'Adept\'s Thetford Crest', pointCost: 1000, faction: 'Thetford', category: 'crest', tier: 4 },
  { id: 'T5_CAPEITEM_FW_THETFORD_BP', name: 'Expert\'s Thetford Crest', pointCost: 3000, faction: 'Thetford', category: 'crest', tier: 5 },
  { id: 'T6_CAPEITEM_FW_THETFORD_BP', name: 'Master\'s Thetford Crest', pointCost: 9000, faction: 'Thetford', category: 'crest', tier: 6 },
  { id: 'T7_CAPEITEM_FW_THETFORD_BP', name: 'Grandmaster\'s Thetford Crest', pointCost: 25000, faction: 'Thetford', category: 'crest', tier: 7 },
  { id: 'T8_CAPEITEM_FW_THETFORD_BP', name: 'Elder\'s Thetford Crest', pointCost: 50000, faction: 'Thetford', category: 'crest', tier: 8 },

  // Fort Sterling
  { id: 'T4_CAPEITEM_FW_FORTSTERLING_BP', name: 'Adept\'s Fort Sterling Crest', pointCost: 1000, faction: 'Fort Sterling', category: 'crest', tier: 4 },
  { id: 'T5_CAPEITEM_FW_FORTSTERLING_BP', name: 'Expert\'s Fort Sterling Crest', pointCost: 3000, faction: 'Fort Sterling', category: 'crest', tier: 5 },
  { id: 'T6_CAPEITEM_FW_FORTSTERLING_BP', name: 'Master\'s Fort Sterling Crest', pointCost: 9000, faction: 'Fort Sterling', category: 'crest', tier: 6 },
  { id: 'T7_CAPEITEM_FW_FORTSTERLING_BP', name: 'Grandmaster\'s Fort Sterling Crest', pointCost: 25000, faction: 'Fort Sterling', category: 'crest', tier: 7 },
  { id: 'T8_CAPEITEM_FW_FORTSTERLING_BP', name: 'Elder\'s Fort Sterling Crest', pointCost: 50000, faction: 'Fort Sterling', category: 'crest', tier: 8 },

  // Bridgewatch
  { id: 'T4_CAPEITEM_FW_BRIDGEWATCH_BP', name: 'Adept\'s Bridgewatch Crest', pointCost: 1000, faction: 'Bridgewatch', category: 'crest', tier: 4 },
  { id: 'T5_CAPEITEM_FW_BRIDGEWATCH_BP', name: 'Expert\'s Bridgewatch Crest', pointCost: 3000, faction: 'Bridgewatch', category: 'crest', tier: 5 },
  { id: 'T6_CAPEITEM_FW_BRIDGEWATCH_BP', name: 'Master\'s Bridgewatch Crest', pointCost: 9000, faction: 'Bridgewatch', category: 'crest', tier: 6 },
  { id: 'T7_CAPEITEM_FW_BRIDGEWATCH_BP', name: 'Grandmaster\'s Bridgewatch Crest', pointCost: 25000, faction: 'Bridgewatch', category: 'crest', tier: 7 },
  { id: 'T8_CAPEITEM_FW_BRIDGEWATCH_BP', name: 'Elder\'s Bridgewatch Crest', pointCost: 50000, faction: 'Bridgewatch', category: 'crest', tier: 8 },

  // Caerleon
  { id: 'T4_CAPEITEM_FW_CAERLEON_BP', name: 'Adept\'s Caerleon Crest', pointCost: 1000, faction: 'Caerleon', category: 'crest', tier: 4 },
  { id: 'T5_CAPEITEM_FW_CAERLEON_BP', name: 'Expert\'s Caerleon Crest', pointCost: 3000, faction: 'Caerleon', category: 'crest', tier: 5 },
  { id: 'T6_CAPEITEM_FW_CAERLEON_BP', name: 'Master\'s Caerleon Crest', pointCost: 9000, faction: 'Caerleon', category: 'crest', tier: 6 },
  { id: 'T7_CAPEITEM_FW_CAERLEON_BP', name: 'Grandmaster\'s Caerleon Crest', pointCost: 25000, faction: 'Caerleon', category: 'crest', tier: 7 },
  { id: 'T8_CAPEITEM_FW_CAERLEON_BP', name: 'Elder\'s Caerleon Crest', pointCost: 50000, faction: 'Caerleon', category: 'crest', tier: 8 },

  // Baby Mounts - Cost: 3,000 - 5,000 pts
  { id: 'T5_FARM_RAM_FW_MARTLOCK_BABY', name: 'Bighorn Ram Lamb', pointCost: 3000, faction: 'Martlock', category: 'mount' },
  { id: 'T5_FARM_DIREBOAR_FW_LYMHURST_BABY', name: 'Wild Boarlet', pointCost: 3000, faction: 'Lymhurst', category: 'mount' },
  { id: 'T5_FARM_SWAMPDRAGON_FW_THETFORD_BABY', name: 'Baby Swamp Salamander', pointCost: 3000, faction: 'Thetford', category: 'mount' },
  { id: 'T5_FARM_DIREBEAR_FW_FORTSTERLING_BABY', name: 'Winter Bear Cub', pointCost: 3000, faction: 'Fort Sterling', category: 'mount' },
  { id: 'T5_FARM_MOABIRD_FW_BRIDGEWATCH_BABY', name: 'Baby Moabird', pointCost: 3000, faction: 'Bridgewatch', category: 'mount' },
  { id: 'T5_FARM_GREYWOLF_FW_CAERLEON_BABY', name: 'Caerleon Greywolf Pup', pointCost: 5000, faction: 'Caerleon', category: 'mount' },
];

export const FACTION_CITIES = [
  'Martlock',
  'Lymhurst',
  'Thetford',
  'Fort Sterling',
  'Bridgewatch',
  'Caerleon'
];

export const CAMPAIGN_TIERS = [
  { tier: 1, points: 50000, reward: 'Iron Campaign Chest' },
  { tier: 2, points: 150000, reward: 'Bronze Campaign Chest' },
  { tier: 3, points: 300000, reward: 'Silver Campaign Chest' },
  { tier: 4, points: 500000, reward: 'Gold Campaign Chest' },
  { tier: 5, points: 750000, reward: 'Premium Campaign Chest' },
  { tier: 6, points: 1000000, reward: 'Elite Campaign Chest' },
];
