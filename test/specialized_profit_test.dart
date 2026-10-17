import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:albionkit/data/repositories/albionkit_repository.dart';
import 'package:albionkit/data/services/albionkit_api.dart';

void main() {
  test(
    'calculates alchemy ingredients, station fee and enchanted variants',
    () async {
      final repository = AlbionKitRepository(
        apiClient: AlbionKitApiClient(
          client: MockClient((request) async {
            final ids = request.url.pathSegments.last
                .replaceFirst('.json', '')
                .split(',');
            final cities = request.url.queryParameters['locations']!.split(',');
            return http.Response(
              jsonEncode([
                for (final city in cities)
                  for (final id in ids)
                    {
                      'item_id': id,
                      'city': city,
                      'sell_price_min': switch (id) {
                        'T4_BURDOCK' => 100,
                        'T4_BURDOCK@1' => 150,
                        'T4_MILK' => 10,
                        'T4_POTION_COOLDOWN' => 1000,
                        'T4_POTION_COOLDOWN@1' => 1200,
                        _ => 0,
                      },
                    },
              ]),
              200,
            );
          }),
        ),
      );

      final results = await repository.getAlchemyProfits(
        region: 'west',
        recipeId: 'poison-t4',
        sellCity: 'Martlock',
        ingredientCities: const {},
        quantity: 5,
        enchanted: true,
        premium: true,
        sellOrder: false,
        includeSellFees: false,
        returnRate: 0,
        usageFee: 100,
      );
      expect(results, hasLength(4));
      final normal = results.firstWhere((result) => result.enchantment == 0);
      expect(normal.productId, 'T4_POTION_COOLDOWN');
      expect(normal.ingredientCost, 1320);
      expect(normal.stationFee, 500);
      expect(normal.revenue, 5000);
      expect(normal.profit, 3180);
      expect(normal.warning, isNull);
      final enchanted = results.firstWhere((result) => result.enchantment == 1);
      expect(enchanted.ingredients.first.itemId, 'T4_BURDOCK@1');
      expect(enchanted.productId, 'T4_POTION_COOLDOWN@1');
    },
  );

  test('calculates chopped fish requirements and sale fees', () async {
    final repository = AlbionKitRepository(
      apiClient: AlbionKitApiClient(
        client: MockClient((request) async {
          final ids = request.url.pathSegments.last
              .replaceFirst('.json', '')
              .split(',');
          final cities = request.url.queryParameters['locations']!.split(',');
          return http.Response(
            jsonEncode([
              for (final city in cities)
                for (final id in ids)
                  {
                    'item_id': id,
                    'city': city,
                    'sell_price_min': id == 'T3_FISH_FRESHWATER_ALL_COMMON'
                        ? 10
                        : id == 'T1_FISHCHOPS'
                        ? 20
                        : 0,
                  },
            ]),
            200,
          );
        }),
      ),
    );
    final results = await repository.getChoppedFishProfits(
      region: 'west',
      buyCity: 'Martlock',
      sellCity: 'Caerleon',
      targetChops: 100,
      premium: true,
      buyOrder: true,
      includeTax: true,
    );
    final fish = results.firstWhere(
      (result) => result.fish.id == 'T3_FISH_FRESHWATER_ALL_COMMON',
    );
    expect(fish.fishRequired, 34);
    expect(fish.fishCost, 348);
    expect(fish.revenue, 1907);
    expect(fish.profit, 1559);
  });

  test(
    'calculates labourer return, empty journal resale and happiness yield',
    () async {
      final repository = AlbionKitRepository(
        apiClient: AlbionKitApiClient(
          client: MockClient((request) async {
            final ids = request.url.pathSegments.last
                .replaceFirst('.json', '')
                .split(',');
            final cities = request.url.queryParameters['locations']!.split(',');
            return http.Response(
              jsonEncode([
                for (final city in cities)
                  for (final id in ids)
                    {
                      'item_id': id,
                      'city': city,
                      'sell_price_min': switch (id) {
                        'T6_JOURNAL_WARRIOR' => 100,
                        'T6_JOURNAL_WARRIOR_FULL' => 50,
                        'T6_METALBAR' => 20,
                        _ => 0,
                      },
                    },
              ]),
              200,
            );
          }),
        ),
      );
      final results = await repository.getLabourerProfits(
        region: 'west',
        labourerId: 'blacksmith',
        buyCity: 'Martlock',
        sellCity: 'Lymhurst',
        houseTier: 6,
        journalCount: 2,
        premium: true,
        sellOrder: true,
        includeEnchantedReturns: false,
      );
      final result = results.firstWhere((row) => row.tier == 6);
      expect(result.fullJournalId, 'T6_JOURNAL_WARRIOR');
      expect(result.emptyJournalId, 'T6_JOURNAL_WARRIOR_FULL');
      expect(result.yieldPercent, 150);
      expect(result.materials.single.quantity, closeTo(15.9, .0001));
      expect(result.materialRevenue, 318);
      expect(result.emptyJournalRevenue, 94);
      expect(result.totalCost, 200);
      expect(result.profit, 212);
      expect(result.warning, isNull);
    },
  );
}
