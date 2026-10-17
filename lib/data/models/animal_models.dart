class AnimalProduct {
  const AnimalProduct({
    required this.id,
    required this.name,
    required this.tier,
    required this.type,
    required this.growthHours,
    required this.foodPerCycle,
    required this.offspringReturnRate,
    required this.focusOffspringReturnRate,
    required this.favoriteFoodId,
    required this.babyId,
    required this.adultId,
    this.produceId,
    this.produceYield = 0,
    this.meatId,
    this.meatYield = 0,
  });

  final String id;
  final String name;
  final int tier;
  final String type;
  final int growthHours;
  final int foodPerCycle;
  final double offspringReturnRate;
  final double focusOffspringReturnRate;
  final String favoriteFoodId;
  final String babyId;
  final String adultId;
  final String? produceId;
  final int produceYield;
  final String? meatId;
  final int meatYield;

  int get cycles => (growthHours / 22).round().clamp(1, 100);
}

class AnimalProfitResult {
  const AnimalProfitResult({
    required this.animal,
    required this.activity,
    required this.quantity,
    required this.buyCity,
    required this.sellCity,
    required this.babyPrice,
    required this.adultPrice,
    required this.foodId,
    required this.foodPrice,
    required this.favoriteFoodPrice,
    required this.foodQuantity,
    required this.foodCost,
    required this.offspringReturnRate,
    required this.producePrice,
    required this.meatPrice,
    required this.outputYield,
    required this.outputRevenue,
    required this.cost,
    required this.profit,
    required this.profitPerPlot,
    required this.totalProfit,
    required this.roi,
    required this.growthHours,
    required this.warning,
  });

  final AnimalProduct animal;
  final String activity;
  final int quantity;
  final String buyCity;
  final String sellCity;
  final int babyPrice;
  final int adultPrice;
  final String foodId;
  final int foodPrice;
  final int favoriteFoodPrice;
  final double foodQuantity;
  final int foodCost;
  final double offspringReturnRate;
  final int producePrice;
  final int meatPrice;
  final double outputYield;
  final int outputRevenue;
  final int cost;
  final int profit;
  final int profitPerPlot;
  final int totalProfit;
  final double roi;
  final double growthHours;
  final String? warning;
}
