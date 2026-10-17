import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:albionkit/data/models/albionkit_api_status.dart';
import 'package:albionkit/data/repositories/albionkit_repository.dart';
import 'package:albionkit/data/services/albion_game_info_api.dart';
import 'package:albionkit/data/services/albionkit_api.dart';

void main() {
  test('reads API status and all published server regions', () async {
    final client = AlbionKitApiClient(
      client: MockClient((request) async {
        expect(request.url.toString(), 'https://api.albionkit.com/v1');
        return http.Response(
          jsonEncode({
            'data': {
              'name': 'AlbionKit API',
              'version': '0.1.1',
              'status': 'ok',
              'servers': [
                {'region': 'west', 'status': 'online'},
                {'region': 'east', 'status': 'maintenance'},
                {'region': 'europe', 'status': 'offline'},
              ],
            },
          }),
          200,
        );
      }),
    );

    final status = await client.getApiStatus();

    expect(status.name, 'AlbionKit API');
    expect(status.version, '0.1.1');
    expect(status.status, 'ok');
    expect(status.servers.map((server) => server.availability), [
      AlbionServerAvailability.online,
      AlbionServerAvailability.maintenance,
      AlbionServerAvailability.offline,
    ]);
  });

  test('reports non-success status codes explicitly', () async {
    final client = AlbionKitApiClient(
      client: MockClient((_) async => http.Response('Unavailable', 503)),
    );

    await expectLater(
      client.getApiStatus(),
      throwsA(
        isA<AlbionKitApiException>().having(
          (error) => error.statusCode,
          'statusCode',
          503,
        ),
      ),
    );
  });

  test('rejects unsupported server values in the response', () async {
    final client = AlbionKitApiClient(
      client: MockClient(
        (_) async => http.Response(
          jsonEncode({
            'data': {
              'name': 'AlbionKit API',
              'version': '0.1.1',
              'status': 'ok',
              'servers': [
                {'region': 'north', 'status': 'online'},
              ],
            },
          }),
          200,
        ),
      ),
    );

    await expectLater(client.getApiStatus(), throwsFormatException);
  });

  test('resolves and caches localized names for flip item IDs', () async {
    var requests = 0;
    final repository = AlbionKitRepository(
      gameInfoApi: AlbionGameInfoApi(
        client: MockClient((request) async {
          requests++;
          expect(request.url.host, 'gameinfo.albiononline.com');
          expect(
            request.url.path,
            '/api/gameinfo/items/T4_ARMOR_LEATHER_ROYAL/data',
          );
          return http.Response(
            jsonEncode({
              'uniqueName': 'T4_ARMOR_LEATHER_ROYAL',
              'localizedNames': {
                'EN-US': "Adept's Royal Jacket",
                'DE-DE': 'Königliche Adeptenjacke',
              },
            }),
            200,
          );
        }),
      ),
    );

    expect(
      await repository.getLocalizedItemName(
        'T4_ARMOR_LEATHER_ROYAL@1',
        languageCode: 'de',
      ),
      'Königliche Adeptenjacke',
    );
    expect(
      await repository.getLocalizedItemName(
        'T4_ARMOR_LEATHER_ROYAL',
        languageCode: 'de',
      ),
      'Königliche Adeptenjacke',
    );
    expect(requests, 1);
  });
}
