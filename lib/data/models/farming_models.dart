class FarmingProduct {
  const FarmingProduct({
    required this.id,
    required this.name,
    required this.tier,
    required this.type,
    required this.seedId,
    required this.produceId,
    required this.baseYield,
    required this.seedReturnRate,
    required this.seedReturnRateWithFocus,
    required this.focusCost,
  });

  final String id;
  final String name;
  final int tier;
  final String type;
  final String seedId;
  final String produceId;
  final int baseYield;
  final double seedReturnRate;
  final double seedReturnRateWithFocus;
  final int focusCost;
}

class FarmingProfitResult {
  const FarmingProfitResult({
    required this.product,
    required this.seedPrice,
    required this.seedVolume,
    required this.producePrice,
    required this.produceVolume,
    required this.expectedYield,
    required this.effectiveSeedReturnRate,
    required this.revenuePerSeed,
    required this.netProfitPerSeed,
    required this.totalProfit,
    required this.roi,
    this.warning,
  });

  final FarmingProduct product;
  final int seedPrice;
  final int seedVolume;
  final int producePrice;
  final int produceVolume;
  final int expectedYield;
  final double effectiveSeedReturnRate;
  final int revenuePerSeed;
  final int netProfitPerSeed;
  final int totalProfit;
  final double roi;
  final String? warning;
}
