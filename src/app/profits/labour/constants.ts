
export interface LabourerType {
  id: string;
  name: string;
  journalPrefix: string;
  category: 'crafting' | 'gathering' | 'mercenary';
  resourceType?: string; // e.g. 'METALBAR', 'LEATHER', 'WOOD'
}

// Minimal definitions
export const LABOURER_DEFINITIONS: LabourerType[] = [
  // Crafting
  { id: 'blacksmith', name: 'Blacksmith', journalPrefix: 'WARRIOR', category: 'crafting', resourceType: 'METALBAR' },
  { id: 'fletcher', name: 'Fletcher', journalPrefix: 'HUNTER', category: 'crafting', resourceType: 'LEATHER' },
  { id: 'imbuer', name: 'Imbuer', journalPrefix: 'MAGE', category: 'crafting', resourceType: 'CLOTH' },
  { id: 'tinker', name: 'Tinker', journalPrefix: 'TOOLMAKER', category: 'crafting', resourceType: 'PLANKS' },
  // Gathering
  { id: 'lumberjack', name: 'Lumberjack', journalPrefix: 'WOODGATHERER', category: 'gathering', resourceType: 'WOOD' },
  { id: 'stonecutter', name: 'Stonecutter', journalPrefix: 'STONEGATHERER', category: 'gathering', resourceType: 'STONE' },
  { id: 'prospector', name: 'Prospector', journalPrefix: 'OREGATHERER', category: 'gathering', resourceType: 'ORE' },
  { id: 'cropper', name: 'Cropper', journalPrefix: 'FIBERGATHERER', category: 'gathering', resourceType: 'FIBER' },
  { id: 'gamekeeper', name: 'Gamekeeper', journalPrefix: 'HIDEGATHERER', category: 'gathering', resourceType: 'HIDE' },
  { id: 'fisherman', name: 'Fisherman', journalPrefix: 'FISHING', category: 'gathering' }, // Returns specific fish or chopped? Usually fish.
  // Mercenary
  { id: 'mercenary', name: 'Mercenary', journalPrefix: 'MERCENARY', category: 'mercenary' }, // Returns Silver
];

// Deprecated: LABOURER_TYPES replaced by LABOURER_DEFINITIONS
export const LABOURER_TYPES: LabourerType[] = [];

export const JOURNAL_TIERS = [2, 3, 4, 5, 6, 7, 8];

// CITIES removed, use LOCATIONS from market-service

export function getJournalId(tier: number, type: LabourerType, state: 'EMPTY' | 'FULL'): string {
  if (state === 'EMPTY') {
    return `T${tier}_JOURNAL_${type.journalPrefix}`;
  }
  return `T${tier}_JOURNAL_${type.journalPrefix}_${state}`;
}

export function getResourceId(tier: number, type: LabourerType, enchantment: number = 0): string | null {
  if (type.category === 'mercenary') return null; // Returns Silver
  if (type.id === 'fisherman') {
    if (enchantment > 0) return null;
    return `T${tier}_FISH_FRESHWATER_ALL_COMMON`;
  }
  
  const resource = type.resourceType;
  if (!resource) return null;

  const suffix = enchantment > 0 ? `@${enchantment}` : '';
  return `T${tier}_${resource}${suffix}`;
}

// Base returns for 100% Happiness (100% Yield)
// Based on approximate community values.
export const BASE_RETURNS_CRAFTING: Record<number, number> = {
  2: 38,
  3: 24,
  4: 16,
  5: 8,
  6: 5.3,
  7: 4.5,
  8: 4.1
};

export const BASE_RETURNS_GATHERING: Record<number, number> = {
  2: 38,
  3: 60,
  4: 48,
  5: 32,
  6: 32,
  7: 38.4,
  8: 38.4
};

// Yield calculation helpers
export function getYield(journalTier: number, houseTier: number): number {
  // Simplified logic:
  // If House Tier >= Journal Tier -> Max Happiness possible (150% Yield with trophies)
  // If House Tier < Journal Tier -> Happiness capped.
  
  // For this calculator, we'll assume:
  // House Tier >= Journal Tier = 150% Yield (User usually optimizes)
  // House Tier < Journal Tier = Penalty.
  // Actually, user inputs "House Tier".
  // If House Tier >= Journal Tier, we assume 150% Yield (Max Happiness).
  // If House Tier < Journal Tier, yield drops significantly.
  // Formula: Base Happiness = House Tier * 100.
  // Journal Requirement: Journal Tier * 100? No.
  
  // Let's use a simpler look-up based on the Wiki table or standard practice.
  // Standard practice: Always use House Tier >= Journal Tier.
  // If User sets House Tier 5, and looks at T6 Journal -> Yield is low.
  
  // Yield % = Min(150, (Happiness / 10) * X?)
  // Let's assume standard "Max Possible Happiness" for the given House Tier.
  // T5 House (500 Base + Furniture) -> ~150% for T5 Journal.
  
  if (houseTier >= journalTier) return 1.5; // 150%
  
  // Penalty for lower house tier
  const diff = journalTier - houseTier;
  // Rough approximation: 10% less yield per tier drop? 
  // Actually, you can't even give a T6 journal to a T5 laborer? 
  // Wiki: "Laborers cannot take a journal higher than the tier of the Laborer"
  // And Laborer Tier is usually limited by House Tier (can't settle T6 in T5 house? Actually you can, but happiness is capped).
  // Wiki: "The minimum quota of happiness is fulfilled by having beds and tables of the same tier or higher than the Laborer"
  
  // CRITICAL: You cannot process a T(X) Journal if the Laborer is T(X-1). 
  // The Laborer must be at least the tier of the Journal.
  // And the Laborer needs a House of at least his tier to be happy?
  // Actually, you CAN put a T8 Laborer in a T2 House, but he will be unhappy.
  
  // Assumption for Calculator:
  // Laborer Tier = Journal Tier.
  // House Tier is the constraint.
  
  if (houseTier < journalTier) {
     // Happiness is capped by furniture tier (House Tier).
     // Yield drops.
     // Let's approximate: 1.0 (100%) or lower.
     return 1.0 - (diff * 0.1); 
  }
  
  return 1.5;
}
