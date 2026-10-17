import 'dart:convert';

import 'package:http/http.dart' as http;

class AlbionGameInfoApi {
  AlbionGameInfoApi({http.Client? client}) : _client = client ?? http.Client();

  static const _apiRoot = 'https://gameinfo.albiononline.com/api/gameinfo';

  final http.Client _client;

  Future<Map<String, String>> getItemLocalizedNames(String itemId) async {
    final canonicalId = itemId.split('@').first.trim();
    if (canonicalId.isEmpty) {
      throw ArgumentError.value(itemId, 'itemId', 'Item ID cannot be empty');
    }
    final response = await _client.get(
      Uri.parse('$_apiRoot/items/${Uri.encodeComponent(canonicalId)}/data'),
      headers: const {'Accept': 'application/json'},
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AlbionGameInfoApiException(
        'Albion Online GameInfo returned HTTP ${response.statusCode}',
        statusCode: response.statusCode,
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map) {
      throw const FormatException('Unexpected GameInfo item response');
    }
    final localizedNames = decoded['localizedNames'];
    if (localizedNames is! Map) {
      throw const FormatException('GameInfo response has no localized names');
    }
    return {
      for (final entry in localizedNames.entries)
        if (entry.key is String && entry.value is String)
          (entry.key as String).toUpperCase(): entry.value as String,
    };
  }
}

class AlbionGameInfoApiException implements Exception {
  const AlbionGameInfoApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}
