class ToolIngredient {
  const ToolIngredient({
    required this.itemId,
    required this.name,
    required this.quantity,
    this.enchantable = false,
  });

  final String itemId;
  final String name;
  final int quantity;
  final bool enchantable;
}

class AlchemyRecipe {
  const AlchemyRecipe({
    required this.id,
    required this.name,
    required this.tier,
    required this.ingredients,
    this.yield = 5,
  });

  final String id;
  final String name;
  final int tier;
  final List<ToolIngredient> ingredients;
  final int yield;

  int get batchYield => yield;

  String get idForOutput {
    if (id == 'focus-restoration') return 'UNIQUE_FOCUSPOTION_ADC_GENERAL_01';
    final potionType = switch (id.split('-').first) {
      'poison' => 'COOLDOWN',
      'heal' => 'HEAL',
      'energy' => 'ENERGY',
      'resist' => 'RESIST',
      'haste' => 'HASTE',
      'berserk' => 'BERSERK',
      _ => 'CLEANSE',
    };
    return 'T${tier}_POTION_$potionType';
  }
}

class ToolIngredientCost {
  const ToolIngredientCost({
    required this.ingredient,
    required this.itemId,
    required this.city,
    required this.unitPrice,
    required this.quantity,
    required this.totalCost,
  });

  final ToolIngredient ingredient;
  final String itemId;
  final String city;
  final int unitPrice;
  final double quantity;
  final double totalCost;
}

class AlchemyProfitResult {
  const AlchemyProfitResult({
    required this.recipe,
    required this.enchantment,
    required this.quantity,
    required this.productId,
    required this.sellCity,
    required this.productPrice,
    required this.ingredients,
    required this.ingredientCost,
    required this.stationFee,
    required this.revenue,
    required this.totalCost,
    required this.profit,
    required this.roi,
    required this.returnRate,
    required this.warning,
  });

  final AlchemyRecipe recipe;
  final int enchantment;
  final int quantity;
  final String productId;
  final String sellCity;
  final int productPrice;
  final List<ToolIngredientCost> ingredients;
  final int ingredientCost;
  final int stationFee;
  final int revenue;
  final int totalCost;
  final int profit;
  final double roi;
  final double returnRate;
  final String? warning;
}

class ChoppedFishProduct {
  const ChoppedFishProduct({
    required this.id,
    required this.name,
    required this.tier,
    required this.yield,
  });

  final String id;
  final String name;
  final int tier;
  final int yield;

  int get chopsPerFish => yield;
}

class ChoppedFishProfitResult {
  const ChoppedFishProfitResult({
    required this.fish,
    required this.targetChops,
    required this.fishRequired,
    required this.buyCity,
    required this.sellCity,
    required this.fishPrice,
    required this.choppedFishPrice,
    required this.fishCost,
    required this.revenue,
    required this.profit,
    required this.roi,
    required this.warning,
  });

  final ChoppedFishProduct fish;
  final int targetChops;
  final int fishRequired;
  final String buyCity;
  final String sellCity;
  final int fishPrice;
  final int choppedFishPrice;
  final int fishCost;
  final int revenue;
  final int profit;
  final double roi;
  final String? warning;
}

class LabourerType {
  const LabourerType({
    required this.id,
    required this.name,
    required this.journalPrefix,
    required this.category,
    this.resourceType,
  });

  final String id;
  final String name;
  final String journalPrefix;
  final String category;
  final String? resourceType;

  String journalId(int tier, {required bool full}) =>
      'T${tier}_JOURNAL_$journalPrefix${full ? '' : '_FULL'}';

  String? returnItemId(int tier, {int enchantment = 0}) {
    if (id == 'mercenary') return null;
    if (id == 'fisherman') return 'T${tier}_FISH_FRESHWATER_ALL_COMMON';
    final stem = resourceType;
    if (stem == null) return null;
    return 'T${tier}_$stem${enchantment > 0 ? '@$enchantment' : ''}';
  }
}

class LabourerMaterialResult {
  const LabourerMaterialResult({
    required this.itemId,
    required this.enchantment,
    required this.quantity,
    required this.price,
    required this.value,
  });

  final String itemId;
  final int enchantment;
  final double quantity;
  final int price;
  final int value;
}

class LabourerProfitResult {
  const LabourerProfitResult({
    required this.labourer,
    required this.tier,
    required this.houseTier,
    required this.journalCount,
    required this.fullJournalId,
    required this.emptyJournalId,
    required this.fullJournalPrice,
    required this.emptyJournalPrice,
    required this.emptyJournalRevenue,
    required this.yieldPercent,
    required this.materials,
    required this.materialRevenue,
    required this.totalCost,
    required this.totalRevenue,
    required this.profit,
    required this.roi,
    required this.warning,
  });

  final LabourerType labourer;
  final int tier;
  final int houseTier;
  final int journalCount;
  final String fullJournalId;
  final String emptyJournalId;
  final int fullJournalPrice;
  final int emptyJournalPrice;
  final int emptyJournalRevenue;
  final double yieldPercent;
  final List<LabourerMaterialResult> materials;
  final int materialRevenue;
  final int totalCost;
  final int totalRevenue;
  final int profit;
  final double roi;
  final String? warning;
}
