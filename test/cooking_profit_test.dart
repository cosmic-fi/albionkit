import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:albionkit/data/repositories/albionkit_repository.dart';
import 'package:albionkit/data/services/albionkit_api.dart';

void main() {
  test('calculates unenchanted cooking profit from live market rows', () async {
    final requests = <http.Request>[];
    final repository = AlbionKitRepository(
      apiClient: AlbionKitApiClient(
        client: MockClient((request) async {
          requests.add(request);
          if (request.url.path.contains('/prices/')) {
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
                        'T4_MEAL_STEW' => 1000,
                        'T4_MEAT' => 100,
                        'T4_TURNIP' => 50,
                        'T4_BREAD' => 200,
                        _ => 20,
                      },
                    },
              ]),
              200,
            );
          }
          final ids = request.url.pathSegments.last
              .replaceFirst('.json', '')
              .split(',');
          return http.Response(
            jsonEncode([
              for (final id in ids)
                {
                  'item_id': id,
                  'data': [
                    {'item_count': 120},
                  ],
                },
            ]),
            200,
          );
        }),
      ),
    );

    final results = await repository.getCookingProfits(
      region: 'west',
      recipeId: 'T4_MEAL_STEW',
      sellCity: 'Caerleon',
      ingredientCities: {
        'T4_MEAT': 'Martlock',
        'T4_TURNIP': 'Bridgewatch',
        'T4_BREAD': 'Lymhurst',
      },
      quantity: 10,
      enchanted: false,
      includeBuyTax: true,
      includeSellTax: true,
      sellOrder: true,
      dailyBonus: false,
      useFocus: false,
      customReturnRate: null,
      usageFee: 680,
    );

    expect(requests, hasLength(2));
    expect(
      requests.first.url.queryParameters['locations'],
      contains('Caerleon'),
    );
    expect(results, hasLength(1));
    final stew = results.single;
    expect(stew.displayName, 'Goat Stew');
    expect(stew.productPrice, 1000);
    expect(stew.productVolume, 120);
    expect(stew.ingredients.map((row) => row.unitPrice), [100, 50, 200]);
    expect(stew.ingredientCost, 3911);
    expect(stew.stationFee, 3400);
    expect(stew.revenue, 9350);
    expect(stew.totalCost, 7311);
    expect(stew.profit, 2039);
    expect(stew.returnRate, 15.2);
    expect(stew.warning, isNull);
  });

  test(
    'enchanted cooking adds tiered sauce ingredients and market outputs',
    () async {
      final requestedOutputIds = <String>[];
      final repository = AlbionKitRepository(
        apiClient: AlbionKitApiClient(
          client: MockClient((request) async {
            final ids = request.url.pathSegments.last
                .replaceFirst('.json', '')
                .split(',');
            if (request.url.path.contains('/prices/')) {
              requestedOutputIds.addAll(
                ids.where((id) => id.startsWith('T4_MEAL_STEW')),
              );
              return http.Response(
                jsonEncode([
                  for (final id in ids)
                    {
                      'item_id': id,
                      'city': id.contains('FISHSAUCE')
                          ? 'Lymhurst'
                          : 'Martlock',
                      'sell_price_min': id.endsWith('@1') ? 1200 : 100,
                    },
                ]),
                200,
              );
            }
            return http.Response(
              jsonEncode([
                for (final id in ids)
                  {
                    'item_id': id,
                    'data': [
                      {'item_count': 8},
                    ],
                  },
              ]),
              200,
            );
          }),
        ),
      );

      final results = await repository.getCookingProfits(
        region: 'east',
        recipeId: 'T4_MEAL_STEW',
        sellCity: 'Martlock',
        ingredientCities: const {},
        quantity: 10,
        enchanted: true,
        includeBuyTax: false,
        includeSellTax: false,
        sellOrder: false,
        dailyBonus: false,
        useFocus: true,
        customReturnRate: null,
        usageFee: 0,
      );

      expect(results, hasLength(4));
      expect(
        requestedOutputIds,
        containsAll([
          'T4_MEAL_STEW',
          'T4_MEAL_STEW@1',
          'T4_MEAL_STEW@2',
          'T4_MEAL_STEW@3',
        ]),
      );
      expect(results.first.returnRate, 43.5);
      expect(results[1].displayName, 'Goat Stew (T4.1)');
      expect(results[1].sauceName, 'Basic Fish Sauce');
      expect(results[1].sauceCost, 1000);
      expect(results[1].ingredients.last.ingredient.name, 'Basic Fish Sauce');
      expect(results[1].ingredients.last.unitPrice, 100);
      expect(results[1].productPrice, 1200);
    },
  );

  test(
    'keeps fish sauce in ingredient details when market data is missing',
    () async {
      final repository = AlbionKitRepository(
        apiClient: AlbionKitApiClient(
          client: MockClient((_) async => http.Response('[]', 200)),
        ),
      );

      final results = await repository.getCookingProfits(
        region: 'west',
        recipeId: 'T4_MEAL_STEW',
        sellCity: 'Martlock',
        ingredientCities: const {},
        quantity: 10,
        enchanted: true,
        includeBuyTax: false,
        includeSellTax: false,
        sellOrder: false,
        dailyBonus: false,
        useFocus: false,
        customReturnRate: null,
        usageFee: 0,
      );

      final enchanted = results[1];
      expect(enchanted.sauceName, 'Basic Fish Sauce');
      expect(enchanted.ingredients.last.ingredient.name, 'Basic Fish Sauce');
      expect(enchanted.ingredients.last.unitPrice, 0);
      expect(enchanted.ingredients.last.totalCost, 0);
      expect(enchanted.warning, contains('Basic Fish Sauce'));
      expect(enchanted.missingItemIds, contains('T4_MEAL_STEW@1'));
      expect(enchanted.missingItemIds, contains('T4_TURNIP'));
      expect(enchanted.missingItemIds, contains('T4_FISHSAUCE_LEVEL1'));
    },
  );

  test(
    'tracks missing flour by item ID for localized cooking warnings',
    () async {
      final repository = AlbionKitRepository(
        apiClient: AlbionKitApiClient(
          client: MockClient((_) async => http.Response('[]', 200)),
        ),
      );

      final results = await repository.getCookingProfits(
        region: 'west',
        recipeId: 'T3_MEAL_SOUP',
        sellCity: 'Martlock',
        ingredientCities: const {},
        quantity: 10,
        enchanted: false,
        includeBuyTax: false,
        includeSellTax: false,
        sellOrder: false,
        dailyBonus: false,
        useFocus: false,
        customReturnRate: null,
        usageFee: 0,
      );

      expect(results.single.missingItemIds, contains('T3_FLOUR'));
      expect(results.single.warning, contains('Wheat Soup'));
      expect(results.single.warning, contains('Flour'));
    },
  );

  test('exposes seven cooking categories and twenty-one recipes', () {
    expect(AlbionKitRepository.cookingRecipes, hasLength(21));
    expect(
      AlbionKitRepository.cookingRecipes
          .map((recipe) => recipe.category)
          .toSet(),
      {'stew', 'sandwich', 'soup', 'roast', 'pie', 'omelette', 'salad'},
    );
  });

  test('rejects quantities larger than a single item stack', () async {
    var requests = 0;
    final repository = AlbionKitRepository(
      apiClient: AlbionKitApiClient(
        client: MockClient((_) async {
          requests++;
          return http.Response('[]', 200);
        }),
      ),
    );

    await expectLater(
      repository.getCookingProfits(
        region: 'west',
        recipeId: 'T4_MEAL_STEW',
        sellCity: 'Martlock',
        ingredientCities: const {},
        quantity: 1000,
        enchanted: false,
        includeBuyTax: false,
        includeSellTax: false,
        sellOrder: false,
        dailyBonus: false,
        useFocus: false,
        customReturnRate: null,
        usageFee: 0,
      ),
      throwsArgumentError,
    );
    expect(requests, 0);
  });
}
