import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:albionkit/data/repositories/albionkit_repository.dart';
import 'package:albionkit/data/services/albionkit_api.dart';

void main() {
  test('generic profit calculator rejects quantities over one stack', () async {
    var requests = 0;
    final repository = AlbionKitRepository(
      apiClient: AlbionKitApiClient(
        client: MockClient((_) async {
          requests++;
          return http.Response('{}', 200);
        }),
      ),
    );

    await expectLater(
      repository.calculateProfit(
        type: 'crafting',
        itemId: 'T4_BAG',
        quantity: 1000,
        region: 'west',
      ),
      throwsArgumentError,
    );
    expect(requests, 0);
  });
}
