import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:albionkit/data/repositories/albionkit_repository.dart';
import 'package:albionkit/data/services/albionkit_api.dart';

void main() {
  test('requests market prices and history from the selected region', () async {
    final requests = <http.Request>[];
    final repository = AlbionKitRepository(
      apiClient: AlbionKitApiClient(
        client: MockClient((request) async {
          requests.add(request);
          expect(request.url.host, 'west.albion-online-data.com');
          expect(request.url.queryParameters['qualities'], '1');
          if (request.url.path.contains('/prices/')) {
            expect(request.url.queryParameters['locations'], 'Martlock');
            return http.Response(
              jsonEncode([
                {
                  'item_id': 'T1_FARM_CARROT_SEED',
                  'city': 'Martlock',
                  'sell_price_min': 100,
                },
                {
                  'item_id': 'T1_CARROT',
                  'city': 'Martlock',
                  'sell_price_min': 10,
                },
              ]),
              200,
            );
          }
          expect(request.url.queryParameters['time-scale'], '24');
          expect(request.url.queryParameters['locations'], 'Martlock');
          final itemIds = request.url.pathSegments.last
              .replaceFirst('.json', '')
              .split(',');
          return http.Response(
            jsonEncode([
              for (final itemId in itemIds)
                {
                  'item_id': itemId,
                  'data': [
                    {'item_count': 20},
                  ],
                },
            ]),
            200,
          );
        }),
      ),
    );

    final results = await repository.getFarmingProfits(
      region: 'west',
      productType: 'crop',
      seedCity: 'Martlock',
      produceCity: 'Martlock',
      plots: 12,
      cycles: 1,
      customReturnRate: 0,
      premium: true,
      useFocus: true,
    );

    expect(requests, hasLength(3));
    expect(results, hasLength(8));
    final carrot = results.first;
    expect(carrot.product.name, 'Carrot');
    expect(carrot.seedPrice, 100);
    expect(carrot.seedVolume, 20);
    expect(carrot.producePrice, 10);
    expect(carrot.produceVolume, 20);
    expect(carrot.expectedYield, 16);
    expect(carrot.effectiveSeedReturnRate, 200);
    expect(carrot.revenuePerSeed, 360);
    expect(carrot.netProfitPerSeed, 260);
    expect(carrot.totalProfit, 3120);
    expect(carrot.roi, 260);
    expect(carrot.warning, isNull);
  });

  test(
    'calculates herbs without Premium or Focus and reports missing prices',
    () async {
      final repository = AlbionKitRepository(
        apiClient: AlbionKitApiClient(
          client: MockClient((_) async => http.Response('[]', 200)),
        ),
      );

      final results = await repository.getFarmingProfits(
        region: 'europe',
        productType: 'herb',
        seedCity: 'Bridgewatch',
        produceCity: 'Caerleon',
        plots: 1,
        cycles: 1,
        customReturnRate: 0,
        premium: false,
        useFocus: false,
      );

      expect(results, hasLength(7));
      expect(results.first.product.name, 'Agaric');
      expect(results.first.expectedYield, 8);
      expect(results.first.effectiveSeedReturnRate, 0);
      expect(results.first.warning, 'No seed price data');
      expect(results.first.roi, 0);
    },
  );

  test(
    'rejects invalid farming filters before requesting market data',
    () async {
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
        repository.getFarmingProfits(
          region: 'west',
          productType: 'crop',
          seedCity: 'Unknown',
          produceCity: 'Martlock',
          plots: 12,
          cycles: 1,
          customReturnRate: 0,
          premium: true,
          useFocus: true,
        ),
        throwsArgumentError,
      );
      expect(requests, 0);
    },
  );
}
