class CookingIngredient {
  const CookingIngredient({
    required this.itemId,
    required this.name,
    required this.count,
  });

  final String itemId;
  final String name;
  final int count;
}

class CookingRecipe {
  const CookingRecipe({
    required this.id,
    required this.name,
    required this.category,
    required this.tier,
    required this.productId,
    required this.ingredients,
    this.yield = 10,
    this.itemWeight = 0.5,
  });

  final String id;
  final String name;
  final String category;
  final int tier;
  final String productId;
  final List<CookingIngredient> ingredients;
  final int yield;
  final double itemWeight;
}

class CookingIngredientPrice {
  const CookingIngredientPrice({
    required this.ingredient,
    required this.city,
    required this.unitPrice,
    required this.quantity,
    required this.totalCost,
  });

  final CookingIngredient ingredient;
  final String city;
  final int unitPrice;
  final double quantity;
  final double totalCost;
}

class CookingProfitResult {
  const CookingProfitResult({
    required this.recipe,
    required this.productId,
    required this.displayName,
    required this.enchantment,
    required this.quantity,
    required this.productPrice,
    required this.productVolume,
    required this.ingredients,
    required this.sauceId,
    required this.sauceName,
    required this.saucePrice,
    required this.ingredientCost,
    required this.sauceCost,
    required this.stationFee,
    required this.revenue,
    required this.totalCost,
    required this.profit,
    required this.roi,
    required this.returnRate,
    required this.totalWeight,
    this.warning,
    this.missingItemIds = const [],
  });

  final CookingRecipe recipe;
  final String productId;
  final String displayName;
  final int enchantment;
  final int quantity;
  final int productPrice;
  final int productVolume;
  final List<CookingIngredientPrice> ingredients;
  final String? sauceId;
  final String? sauceName;
  final int saucePrice;
  final int ingredientCost;
  final int sauceCost;
  final int stationFee;
  final int revenue;
  final int totalCost;
  final int profit;
  final double roi;
  final double returnRate;
  final double totalWeight;
  final String? warning;
  final List<String> missingItemIds;
}
