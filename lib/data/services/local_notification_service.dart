import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as timezone_data;
import 'package:timezone/timezone.dart' as timezone;

import '../../ui/settings/app_language.dart';
import '../models/albionkit_api_status.dart';
import '../models/albionkit_models.dart';
import 'albion_game_info_api.dart';
import '../../ui/localization/app_text.dart';

abstract interface class NotificationGateway {
  bool get isSupported;

  Future<void> initialize();
  Future<bool> requestPermission();
  Future<void> showGoldPriceAlert({
    required int price,
    required int threshold,
    required String direction,
    required String region,
    required String languageCode,
  });
  Future<void> showMarketFlipAlert({
    required List<MarketFlip> flips,
    required String region,
    required String languageCode,
  });
  Future<void> scheduleBanditReminder({
    required DateTime utcTime,
    required String region,
    required String languageCode,
  });
  Future<void> cancelBanditReminder();
}

class LocalNotificationService implements NotificationGateway {
  LocalNotificationService({AlbionGameInfoApi? gameInfoApi})
    : _gameInfoApi = gameInfoApi ?? AlbionGameInfoApi();

  static final ValueNotifier<String?> notificationTap = ValueNotifier<String?>(
    null,
  );

  static const _banditNotificationId = 4101;
  static const _channelId = 'albionkit_alerts';

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  final AlbionGameInfoApi _gameInfoApi;
  final Map<String, Future<Map<String, String>>> _localizedNames = {};
  bool _initialized = false;

  @override
  bool get isSupported =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  @override
  Future<void> initialize() async {
    if (!isSupported || _initialized) return;

    timezone_data.initializeTimeZones();
    await _plugin.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('albionkit_notification'),
        iOS: DarwinInitializationSettings(
          requestAlertPermission: false,
          requestBadgePermission: false,
          requestSoundPermission: false,
        ),
      ),
      onDidReceiveNotificationResponse: _handleNotificationResponse,
    );
    final launchDetails = await _plugin.getNotificationAppLaunchDetails();
    if (launchDetails?.didNotificationLaunchApp ?? false) {
      _handleNotificationResponse(launchDetails?.notificationResponse);
    }
    _initialized = true;
  }

  static String marketFlipNotificationTitle(
    String region, {
    String languageCode = 'en',
  }) => translateAppText(
    languageCode,
    '{region} Market Opportunity',
  ).replaceAll('{region}', albionServerRegionDisplayName(region));

  void _handleNotificationResponse(NotificationResponse? response) {
    if (response == null) return;
    final destination = switch (response.payload) {
      'gold' => 'gold',
      'flips' => 'flips',
      'faction' => 'faction',
      _ => switch (response.id) {
        4102 => 'gold',
        4103 => 'flips',
        _banditNotificationId => 'faction',
        _ => null,
      },
    };
    if (destination != null) notificationTap.value = destination;
  }

  @override
  Future<bool> requestPermission() async {
    if (!isSupported) return false;
    await initialize();

    if (defaultTargetPlatform == TargetPlatform.android) {
      return await _plugin
              .resolvePlatformSpecificImplementation<
                AndroidFlutterLocalNotificationsPlugin
              >()
              ?.requestNotificationsPermission() ??
          false;
    }

    return await _plugin
            .resolvePlatformSpecificImplementation<
              IOSFlutterLocalNotificationsPlugin
            >()
            ?.requestPermissions(alert: true, badge: true, sound: true) ??
        false;
  }

  @override
  Future<void> showGoldPriceAlert({
    required int price,
    required int threshold,
    required String direction,
    required String region,
    required String languageCode,
  }) async {
    if (!isSupported) return;
    await initialize();
    final title = translateAppText(
      languageCode,
      '{region} Gold Price Alert',
    ).replaceAll('{region}', albionServerRegionDisplayName(region));
    final bodyTemplate = direction == 'above'
        ? '{region} gold reached or exceeded {threshold} silver (latest: {price}).'
        : '{region} gold fell to {threshold} silver (latest: {price}).';
    final body = translateAppText(languageCode, bodyTemplate)
        .replaceAll('{region}', albionServerRegionDisplayName(region))
        .replaceAll('{threshold}', _formatSilver(threshold))
        .replaceAll('{price}', _formatSilver(price));
    await _plugin.show(
      id: 4102,
      title: title,
      body: body,
      notificationDetails: _notificationDetails(
        languageCode: languageCode,
        largeIcon: 'gold_icon',
      ),
      payload: 'gold',
    );
  }

  @override
  Future<void> showMarketFlipAlert({
    required List<MarketFlip> flips,
    required String region,
    required String languageCode,
  }) async {
    if (!isSupported || flips.isEmpty) return;
    await initialize();
    final bestFlip = flips.reduce(
      (best, current) => current.profit > best.profit ? current : best,
    );
    var itemName = bestFlip.itemName?.isNotEmpty == true
        ? bestFlip.itemName!
        : bestFlip.itemId;
    try {
      final names = await _getLocalizedNames(bestFlip.itemId);
      final locale = AppLanguage.gameInfoLocaleFor(languageCode);
      itemName = names[locale] ?? names['EN-US'] ?? itemName;
    } catch (error) {
      debugPrint('Could not localize market flip notification item: $error');
    }
    final bodyTemplate = flips.length == 1
        ? 'A valuable market flip is available. Best: {item} for {profit} silver ({buyCity} to {sellCity}).'
        : '{count} valuable market flips are available. Best: {item} for {profit} silver ({buyCity} to {sellCity}).';
    final body = translateAppText(languageCode, bodyTemplate)
        .replaceAll('{count}', '${flips.length}')
        .replaceAll('{item}', itemName)
        .replaceAll('{profit}', _formatSilver(bestFlip.profit))
        .replaceAll('{buyCity}', bestFlip.buyCity)
        .replaceAll('{sellCity}', bestFlip.sellCity);
    await _plugin.show(
      id: 4103,
      title: marketFlipNotificationTitle(region, languageCode: languageCode),
      body: body,
      notificationDetails: _notificationDetails(
        languageCode: languageCode,
        largeIcon: 'market_icon',
      ),
      payload: 'flips',
    );
  }

  Future<Map<String, String>> _getLocalizedNames(String itemId) {
    final cached = _localizedNames[itemId];
    if (cached != null) return cached;
    final lookup = _gameInfoApi.getItemLocalizedNames(itemId).catchError((
      Object error,
    ) {
      _localizedNames.remove(itemId);
      throw error;
    });
    _localizedNames[itemId] = lookup;
    return lookup;
  }

  @override
  Future<void> scheduleBanditReminder({
    required DateTime utcTime,
    required String region,
    required String languageCode,
  }) async {
    if (!isSupported) return;
    await initialize();
    final scheduledTime = timezone.TZDateTime.from(utcTime, timezone.UTC);
    await _plugin.zonedSchedule(
      id: _banditNotificationId,
      title: translateAppText(languageCode, 'Bandit assault starts soon'),
      body: translateAppText(
        languageCode,
        '{region} bandit window is coming up.',
      ).replaceAll('{region}', albionServerRegionDisplayName(region)),
      scheduledDate: scheduledTime,
      notificationDetails: _notificationDetails(
        languageCode: languageCode,
        largeIcon: 'raid_icon',
      ),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      payload: 'faction',
    );
  }

  @override
  Future<void> cancelBanditReminder() async {
    if (!isSupported) return;
    await initialize();
    await _plugin.cancel(id: _banditNotificationId);
  }

  NotificationDetails _notificationDetails({
    required String languageCode,
    required String largeIcon,
  }) {
    return NotificationDetails(
      android: AndroidNotificationDetails(
        _channelId,
        translateAppText(languageCode, 'AlbionKit alerts'),
        channelDescription: translateAppText(
          languageCode,
          'Gold, market, and faction alerts',
        ),
        icon: 'albionkit_notification',
        largeIcon: DrawableResourceAndroidBitmap(largeIcon),
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: const DarwinNotificationDetails(),
    );
  }

  String _formatSilver(int value) {
    return value.toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (_) => ',',
    );
  }
}
