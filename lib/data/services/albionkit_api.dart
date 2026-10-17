import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/albionkit_api_status.dart';

class AlbionKitApiClient {
  AlbionKitApiClient({http.Client? client}) : _client = client ?? http.Client();

  static const _apiRoot = 'https://api.albionkit.com/v1';
  static const _regions = {
    'west': 'https://west.albion-online-data.com',
    'east': 'https://east.albion-online-data.com',
    'europe': 'https://europe.albion-online-data.com',
  };

  final http.Client _client;

  Future<AlbionKitApiStatus> getApiStatus() async {
    final decoded = _asMap(await _get(Uri.parse(_apiRoot)));
    return AlbionKitApiStatus.fromEnvelope(decoded);
  }

  Future<List<Map<String, dynamic>>> searchPlayers(
    String query, {
    String region = 'west',
  }) async {
    if (query.trim().isEmpty) return const [];
    final uri = Uri.parse('$_apiRoot/player/search')
        .replace(queryParameters: {'q': query.trim(), 'region': region});
    return _asList(await _get(uri));
  }

  Future<List<Map<String, dynamic>>> searchGuilds(
    String query, {
    String region = 'west',
  }) async {
    if (query.trim().isEmpty) return const [];
    final uri = Uri.parse('$_apiRoot/guild/search')
        .replace(queryParameters: {'q': query.trim(), 'region': region});
    return _asList(await _get(uri));
  }

  Future<Map<String, dynamic>> getPlayerProfile(
    String playerId, {
    String region = 'west',
  }) async {
    final uri = Uri.parse('$_apiRoot/player/${Uri.encodeComponent(playerId)}')
        .replace(queryParameters: {'region': region});
    final decoded = _asMap(await _get(uri));
    return decoded['data'] is Map
        ? Map<String, dynamic>.from(decoded['data'] as Map)
        : decoded;
  }

  Future<Map<String, dynamic>> getGuildInfo(
    String guildId, {
    String region = 'west',
  }) async {
    final uri = Uri.parse('$_apiRoot/guild/${Uri.encodeComponent(guildId)}')
        .replace(queryParameters: {'region': region});
    final decoded = _asMap(await _get(uri));
    return decoded['data'] is Map
        ? Map<String, dynamic>.from(decoded['data'] as Map)
        : decoded;
  }

  Future<List<Map<String, dynamic>>> searchItems(
    String query, {
    int limit = 10,
  }) async {
    if (query.trim().isEmpty) return const [];
    final uri = Uri.parse('$_apiRoot/items/search')
        .replace(queryParameters: {'q': query.trim(), 'limit': '$limit'});
    return _asList(await _get(uri));
  }

  Future<List<Map<String, dynamic>>> searchArmory({
    String query = '',
    int limit = 6,
  }) async {
    final params = <String, String>{'limit': '$limit'};
    if (query.trim().isNotEmpty) params['search'] = query.trim();
    final decoded = await _get(
      Uri.parse('$_apiRoot/armory').replace(queryParameters: params),
    );
    final map = _asMap(decoded);
    final data = map['data'];
    if (data is Map) return _asList(data['builds']);
    return _asList(map['builds'] ?? map['armory'] ?? data);
  }

  Future<List<GoldPricePointData>> getGoldHistory({
    String region = 'west',
    int count = 168,
  }) async {
    final host = _regions[region];
    if (host == null) {
      throw ArgumentError.value(region, 'region', 'Unsupported Albion server');
    }
    final uri = Uri.parse('$host/api/v2/stats/gold')
        .replace(queryParameters: {'count': '$count'});
    final decoded = await _get(uri);
    if (decoded is! List) {
      throw const FormatException('Unexpected gold history response');
    }
    return decoded.map((entry) {
      if (entry is! Map) {
        throw const FormatException('Invalid gold history point');
      }
      return GoldPricePointData.fromJson(Map<String, dynamic>.from(entry));
    }).toList();
  }

  Future<List<Map<String, dynamic>>> getMarketFlips({
    required String region,
    int minProfit = 50000,
    double minMargin = 5,
  }) async {
    final uri = Uri.parse('$_apiRoot/market/flips').replace(
      queryParameters: {
        'region': region,
        'minProfit': '$minProfit',
        'minMargin': '$minMargin',
      },
    );
    final decoded = await _get(uri);
    final map = _asMap(decoded);
    return _asList(map['data'] ?? decoded);
  }

  Future<List<Map<String, dynamic>>> getMarketPrices({
    required List<String> itemIds,
    required String region,
    required List<String> locations,
  }) async {
    final host = _regions[region];
    if (host == null) {
      throw ArgumentError.value(region, 'region', 'Unsupported Albion server');
    }
    if (itemIds.isEmpty || locations.isEmpty) return const [];

    final requests = <Future<List<Map<String, dynamic>>>>[];
    for (var start = 0; start < itemIds.length; start += 50) {
      final chunk = itemIds.skip(start).take(50).join(',');
      final uri = Uri.parse('$host/api/v2/stats/prices/$chunk.json').replace(
        queryParameters: {'locations': locations.join(','), 'qualities': '1'},
      );
      requests.add(_get(uri).then(_asList));
    }
    return (await Future.wait(requests)).expand((rows) => rows).toList();
  }

  Future<List<Map<String, dynamic>>> getMarketHistory({
    required List<String> itemIds,
    required String region,
    required String location,
  }) async {
    final host = _regions[region];
    if (host == null) {
      throw ArgumentError.value(region, 'region', 'Unsupported Albion server');
    }
    if (itemIds.isEmpty) return const [];

    final requests = <Future<List<Map<String, dynamic>>>>[];
    for (var start = 0; start < itemIds.length; start += 50) {
      final chunk = itemIds.skip(start).take(50).join(',');
      final uri = Uri.parse('$host/api/v2/stats/history/$chunk.json').replace(
        queryParameters: {
          'locations': location,
          'qualities': '1',
          'time-scale': '24',
        },
      );
      requests.add(_get(uri).then(_asList));
    }
    return (await Future.wait(requests)).expand((rows) => rows).toList();
  }

  Future<Map<String, dynamic>> calculateProfit({
    required String type,
    required String itemId,
    required int quantity,
    required String region,
  }) async {
    final response = await _client.post(
      Uri.parse('$_apiRoot/calculators/$type'),
      headers: const {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'type': type,
        'itemId': itemId.trim(),
        'quantity': quantity,
        'region': region,
      }),
    );
    final decoded = _decodeResponse(response);
    return _asMap(decoded);
  }

  Future<dynamic> _get(Uri uri) async {
    final response = await _client.get(
      uri,
      headers: const {'Accept': 'application/json'},
    );
    return _decodeResponse(response);
  }

  dynamic _decodeResponse(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AlbionKitApiException(
        'AlbionKit API returned HTTP ${response.statusCode}',
        statusCode: response.statusCode,
      );
    }
    return jsonDecode(response.body);
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is! Map) throw const FormatException('Unexpected API response');
    return Map<String, dynamic>.from(value);
  }

  List<Map<String, dynamic>> _asList(dynamic value) {
    if (value is Map && value['data'] is List) value = value['data'];
    if (value is! List) throw const FormatException('Unexpected list response');
    return value
        .whereType<Map>()
        .map((entry) => Map<String, dynamic>.from(entry))
        .toList();
  }
}

class GoldPricePointData {
  const GoldPricePointData({required this.price, required this.timestamp});

  final int price;
  final String timestamp;

  factory GoldPricePointData.fromJson(Map<String, dynamic> json) {
    final price = json['price'];
    final timestamp = json['timestamp'];
    if (price is! num || timestamp is! String) {
      throw const FormatException('Invalid gold history point fields');
    }
    return GoldPricePointData(price: price.toInt(), timestamp: timestamp);
  }
}

class AlbionKitApiException implements Exception {
  const AlbionKitApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}
