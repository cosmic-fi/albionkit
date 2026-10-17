import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:albionkit/data/repositories/albionkit_repository.dart';
import 'package:albionkit/data/services/albionkit_api.dart';

void main() {
  test(
    'calculates breeding profit including feed and expected offspring',
    () async {
      final requestedCities = <String>{};
      final repository = AlbionKitRepository(
        apiClient: AlbionKitApiClient(
          client: MockClient((request) async {
            final cities = request.url.queryParameters['locations']!.split(',');
            requestedCities.addAll(cities);
            final ids = request.url.pathSegments.last
                .replaceFirst('.json', '')
                .split(',');
            return http.Response(
              jsonEncode([
                for (final city in cities)
                  for (final id in ids)
                    {
                      'item_id': id,
                      'city': city,
                      'sell_price_min': switch (id) {
                        'T3_FARM_CHICKEN_BABY' => 100,
                        'T3_FARM_CHICKEN_GROWN' => 500,
                        'T3_FARM_WHEAT' => 10,
                        _ => 0,
                      },
                    },
              ]),
              200,
            );
          }),
        ),
      );

      final results = await repository.getAnimalProfits(
        region: 'west',
        activity: 'breeding',
        buyCity: 'Bridgewatch',
        sellCity: 'Caerleon',
        quantity: 10,
        premium: false,
        favoriteFood: true,
        useFocus: true,
      );
      final chicken = results.firstWhere(
        (result) => result.animal.id == 'chicken',
      );

      expect(requestedCities, {'Bridgewatch', 'Caerleon'});
      expect(chicken.babyPrice, 100);
      expect(chicken.adultPrice, 500);
      expect(chicken.foodQuantity, 9);
      expect(chicken.foodCost, 90);
      expect(chicken.offspringReturnRate, 140);
      expect(chicken.outputRevenue, 640);
      expect(chicken.cost, 190);
      expect(chicken.profit, 450);
      expect(chicken.totalProfit, 4500);
      expect(chicken.warning, isNull);
    },
  );

  test(
    'calculates animal products and butchering using their yields',
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
                        'T4_FARM_TURNIP' => 20,
                        'T4_MILK' => 30,
                        'T3_FARM_CHICKEN_GROWN' => 500,
                        'T3_MEAT' => 50,
                        _ => 0,
                      },
                    },
              ]),
              200,
            );
          }),
        ),
      );

      final productResults = await repository.getAnimalProfits(
        region: 'west',
        activity: 'products',
        buyCity: 'Martlock',
        sellCity: 'Lymhurst',
        quantity: 1,
        premium: false,
        favoriteFood: true,
        useFocus: false,
      );
      final goat = productResults.firstWhere(
        (result) => result.animal.id == 'goat',
      );
      expect(goat.outputYield, 5);
      expect(goat.outputRevenue, 150);
      expect(goat.foodQuantity, 18);
      expect(goat.foodCost, 360);
      expect(goat.profit, -210);

      final butcheringResults = await repository.getAnimalProfits(
        region: 'west',
        activity: 'butchering',
        buyCity: 'Martlock',
        sellCity: 'Lymhurst',
        quantity: 1,
        premium: true,
        favoriteFood: false,
        useFocus: false,
      );
      final chicken = butcheringResults.firstWhere(
        (result) => result.animal.id == 'chicken',
      );
      expect(chicken.outputYield, 20);
      expect(chicken.outputRevenue, 1000);
      expect(chicken.cost, 500);
      expect(chicken.profit, 500);
    },
  );

  test('returns missing-price warnings and validates filters', () async {
    var requests = 0;
    final repository = AlbionKitRepository(
      apiClient: AlbionKitApiClient(
        client: MockClient((_) async {
          requests++;
          return http.Response('[]', 200);
        }),
      ),
    );
    final results = await repository.getAnimalProfits(
      region: 'europe',
      activity: 'products',
      buyCity: 'Martlock',
      sellCity: 'Caerleon',
      quantity: 1,
      premium: true,
      favoriteFood: true,
      useFocus: false,
    );
    expect(results, isNotEmpty);
    expect(results.first.warning, 'No food price data');

    await expectLater(
      repository.getAnimalProfits(
        region: 'west',
        activity: 'breeding',
        buyCity: 'Martlock',
        sellCity: 'Caerleon',
        quantity: 1000,
        premium: true,
        favoriteFood: true,
        useFocus: false,
      ),
      throwsArgumentError,
    );
    await expectLater(
      repository.getAnimalProfits(
        region: 'west',
        activity: 'unknown',
        buyCity: 'Martlock',
        sellCity: 'Caerleon',
        quantity: 1,
        premium: true,
        favoriteFood: true,
        useFocus: false,
      ),
      throwsArgumentError,
    );
    expect(requests, 1);
  });
}
