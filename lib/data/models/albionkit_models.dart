class PlayerSearchResult {
  const PlayerSearchResult({
    required this.id,
    required this.name,
    this.guildName,
    this.allianceName,
    this.killFame,
    this.deathFame,
    this.fameRatio,
    this.avatarUrl,
    this.region,
  });

  final String id;
  final String name;
  final String? guildName;
  final String? allianceName;
  final int? killFame;
  final int? deathFame;
  final double? fameRatio;
  final String? avatarUrl;
  final String? region;

  factory PlayerSearchResult.fromJson(Map<String, dynamic> json) {
    return PlayerSearchResult(
      id: _string(json['Id'] ?? json['id'] ?? json['playerId']),
      name: _string(json['Name'] ?? json['name']),
      guildName: _nullableString(json['GuildName'] ?? json['guildName']),
      allianceName: _nullableString(
        json['AllianceName'] ?? json['allianceName'],
      ),
      killFame: _integer(json['KillFame'] ?? json['killFame']),
      deathFame: _integer(json['DeathFame'] ?? json['deathFame']),
      fameRatio: _decimal(json['FameRatio'] ?? json['fameRatio']),
      avatarUrl: _nullableString(json['Avatar'] ?? json['avatar']),
      region: _nullableString(json['region']),
    );
  }
}

class GuildSearchResult {
  const GuildSearchResult({
    required this.id,
    required this.name,
    this.allianceName,
    this.killFame,
    this.deathFame,
    this.region,
  });

  final String id;
  final String name;
  final String? allianceName;
  final int? killFame;
  final int? deathFame;
  final String? region;

  factory GuildSearchResult.fromJson(Map<String, dynamic> json) {
    return GuildSearchResult(
      id: _string(json['Id'] ?? json['id'] ?? json['GuildId']),
      name: _string(json['Name'] ?? json['name']),
      allianceName: _nullableString(
        json['AllianceName'] ?? json['allianceName'],
      ),
      killFame: _integer(json['KillFame'] ?? json['killFame']),
      deathFame: _integer(json['DeathFame'] ?? json['deathFame']),
      region: _nullableString(json['region']),
    );
  }
}

class ItemSearchResult {
  const ItemSearchResult({
    required this.id,
    required this.name,
    this.category,
    this.iconUrl,
    this.tier,
  });

  final String id;
  final String name;
  final String? category;
  final String? iconUrl;
  final int? tier;

  factory ItemSearchResult.fromJson(Map<String, dynamic> json) {
    final localizedNames = json['LocalizedNames'];
    final localizedName = localizedNames is Map
        ? localizedNames['EN-US'] ?? localizedNames['en']
        : null;

    return ItemSearchResult(
      id: _string(json['item_id'] ?? json['id'] ?? json['UniqueName']),
      name: _string(
        json['name'] ?? json['Name'] ?? localizedName ?? json['item_id'],
      ),
      category: _nullableString(json['category'] ?? json['Category']),
      iconUrl: _nullableString(json['iconUrl'] ?? json['IconUrl']),
      tier: _integer(json['tier'] ?? json['Tier']),
    );
  }
}

class ArmoryBuild {
  const ArmoryBuild({
    required this.id,
    required this.title,
    this.category,
    this.role,
    this.weapon,
    this.previewImageUrl,
  });

  final String id;
  final String title;
  final String? category;
  final String? role;
  final String? weapon;
  final String? previewImageUrl;

  factory ArmoryBuild.fromJson(Map<String, dynamic> json) {
    return ArmoryBuild(
      id: _string(
        json['id'] ?? json['buildId'] ?? json['slug'] ?? json['name'],
      ),
      title: _string(json['title'] ?? json['name'] ?? 'Build'),
      category: _nullableString(json['category'] ?? json['Category']),
      role: _nullableString(json['role'] ?? json['Role']),
      weapon: _nullableString(json['weapon'] ?? json['Weapon']),
      previewImageUrl: _nullableString(
        json['previewImageUrl'] ?? json['avatar'] ?? json['imageUrl'],
      ),
    );
  }
}

class GoldPricePoint {
  const GoldPricePoint({required this.price, required this.timestamp});

  final int price;
  final DateTime timestamp;

  factory GoldPricePoint.fromJson(Map<String, dynamic> json) {
    return GoldPricePoint(
      price: _integer(json['price']) ?? 0,
      timestamp:
          DateTime.tryParse(_string(json['timestamp'])) ??
          DateTime.fromMillisecondsSinceEpoch(0),
    );
  }
}

class MarketFlip {
  const MarketFlip({
    required this.itemId,
    this.itemName,
    required this.buyCity,
    required this.buyPrice,
    required this.sellCity,
    required this.sellPrice,
    required this.profit,
    required this.margin,
  });

  final String itemId;
  final String? itemName;
  final String buyCity;
  final int buyPrice;
  final String sellCity;
  final int sellPrice;
  final int profit;
  final double margin;

  factory MarketFlip.fromJson(Map<String, dynamic> json) {
    return MarketFlip(
      itemId: _string(json['item_id'] ?? json['itemId']),
      itemName: _nullableString(
        json['item_name'] ?? json['itemName'] ?? json['name'],
      ),
      buyCity: _string(json['buy_city'] ?? json['buyCity']),
      buyPrice: _integer(json['buy_price'] ?? json['buyPrice']) ?? 0,
      sellCity: _string(json['sell_city'] ?? json['sellCity']),
      sellPrice: _integer(json['sell_price'] ?? json['sellPrice']) ?? 0,
      profit: _integer(json['profit']) ?? 0,
      margin: _decimal(json['margin']) ?? 0,
    );
  }
}

class ProfitCalculation {
  const ProfitCalculation({
    required this.itemName,
    required this.quantity,
    required this.profit,
    required this.roi,
    required this.revenue,
    required this.effectiveCost,
    required this.profitPerFocus,
  });

  final String itemName;
  final int quantity;
  final int profit;
  final double roi;
  final int revenue;
  final int effectiveCost;
  final int profitPerFocus;

  factory ProfitCalculation.fromJson(Map<String, dynamic> json) {
    return ProfitCalculation(
      itemName: _string(json['itemName']),
      quantity: _integer(json['quantity']) ?? 0,
      profit: _integer(json['profit']) ?? 0,
      roi: _decimal(json['roi']) ?? 0,
      revenue: _integer(json['revenue']) ?? 0,
      effectiveCost: _integer(json['effectiveCost']) ?? 0,
      profitPerFocus: _integer(json['profitPerFocus']) ?? 0,
    );
  }
}

String _string(Object? value) => value?.toString() ?? '';
String? _nullableString(Object? value) => value?.toString();

int? _integer(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return value == null ? null : int.tryParse(value.toString());
}

double? _decimal(Object? value) {
  if (value is num) return value.toDouble();
  return value == null ? null : double.tryParse(value.toString());
}
