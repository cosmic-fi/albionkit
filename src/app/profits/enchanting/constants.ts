
export const ENCHANTMENT_COSTS = {
  ONE_HANDED: 288,
  TWO_HANDED: 384,
  ARMOR: 192,
  BAG: 192,
  HELM: 96,
  BOOTS: 96,
  CAPE: 96,
  OFFHAND: 96
};

export function getEnchantmentMaterialCount(itemId: string): number {
  if (itemId.includes('_BAG') || itemId.includes('_ARMOR_')) {
    return ENCHANTMENT_COSTS.ARMOR;
  }
  if (itemId.includes('_HEAD_') || itemId.includes('_SHOES_') || itemId.includes('_CAPE') || itemId.includes('_OFF_')) {
    return ENCHANTMENT_COSTS.HELM;
  }
  if (itemId.includes('2H_')) {
    return ENCHANTMENT_COSTS.TWO_HANDED;
  }
  if (itemId.includes('MAIN_')) {
    return ENCHANTMENT_COSTS.ONE_HANDED;
  }
  return 0; // Unknown
}

export const ENCHANTMENT_MATERIALS = {
  1: 'RUNE',
  2: 'SOUL',
  3: 'RELIC'
};

export function getMaterialId(tier: number, level: number): string {
  const type = ENCHANTMENT_MATERIALS[level as keyof typeof ENCHANTMENT_MATERIALS];
  return `T${tier}_${type}`;
}
