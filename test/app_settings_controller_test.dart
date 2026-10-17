import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:albionkit/data/models/albionkit_models.dart';
import 'package:albionkit/data/services/local_notification_service.dart';
import 'package:albionkit/ui/settings/app_language.dart';
import 'package:albionkit/ui/settings/app_settings_controller.dart';

void main() {
  late SharedPreferences preferences;
  late _TestNotifications notifications;
  late AppSettingsController settings;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    preferences = await SharedPreferences.getInstance();
    notifications = _TestNotifications();
    settings = AppSettingsController.forTesting(
      preferences: preferences,
      notifications: notifications,
    );
  });

  tearDown(() => settings.dispose());

  test('theme selection persists and starts in light mode', () async {
    expect(settings.themeMode, ThemeMode.light);

    await settings.setThemeMode(ThemeMode.dark);

    expect(settings.themeMode, ThemeMode.dark);
    expect(preferences.getString('settings.themeMode'), 'dark');
  });

  test(
    'supported app languages persist and reject unknown languages',
    () async {
      expect(AppLanguage.supported.map((language) => language.code), [
        'en',
        'de',
        'fr',
        'ru',
        'pl',
        'pt',
        'es',
        'tr',
        'zh',
        'ko',
      ]);
      expect(settings.languageCode, 'en');

      await settings.setLanguage('de');

      expect(settings.languageCode, 'de');
      expect(settings.locale, const Locale('de'));
      expect(preferences.getString('settings.language'), 'de');
      await expectLater(settings.setLanguage('xx'), throwsArgumentError);
    },
  );

  test('notification requests use the selected app language', () async {
    await settings.setLanguage('de');
    await settings.setGoldAlert(threshold: 1000, direction: 'above');
    await settings.setGoldAlertsEnabled(true);

    await settings.checkGoldPrice(price: 1000, region: 'west');

    expect(notifications.lastGoldLanguageCode, 'de');
    expect(
      LocalNotificationService.marketFlipNotificationTitle(
        'west',
        languageCode: 'de',
      ),
      'Marktchance in West (Americas)',
    );
  });

  test('language changes update scheduled bandit reminder copy', () async {
    await settings.setBanditAlertsEnabled(true, region: 'west');
    expect(notifications.lastBanditLanguageCode, 'en');

    await settings.setLanguage('fr');

    expect(notifications.lastBanditLanguageCode, 'fr');
  });

  test('unsupported saved language falls back to English', () async {
    SharedPreferences.setMockInitialValues({'settings.language': 'xx'});
    final invalidPreferences = await SharedPreferences.getInstance();
    final controller = AppSettingsController.forTesting(
      preferences: invalidPreferences,
      notifications: notifications,
    );
    addTearDown(controller.dispose);

    expect(controller.languageCode, 'en');
    expect(controller.locale, const Locale('en'));
  });

  test('server region persists and rejects unsupported values', () async {
    expect(settings.serverRegion, 'west');

    await settings.setServerRegion('east');

    expect(settings.serverRegion, 'east');
    expect(preferences.getString('settings.serverRegion'), 'east');
    await expectLater(settings.setServerRegion('unknown'), throwsArgumentError);
  });

  test(
    'gold alert fires once per crossing and rearms below the target',
    () async {
      await settings.setGoldAlert(threshold: 1000, direction: 'above');
      await settings.setGoldAlertsEnabled(true);

      expect(
        await settings.checkGoldPrice(price: 999, region: 'west'),
        isFalse,
      );
      expect(
        await settings.checkGoldPrice(price: 1000, region: 'west'),
        isTrue,
      );
      expect(
        await settings.checkGoldPrice(price: 1100, region: 'west'),
        isFalse,
      );
      expect(notifications.goldAlertsShown, 1);

      await settings.checkGoldPrice(price: 999, region: 'west');
      expect(
        await settings.checkGoldPrice(price: 1000, region: 'west'),
        isTrue,
      );
      expect(notifications.goldAlertsShown, 2);
    },
  );

  test(
    'valuable flip alerts notify once for each new qualified opportunity',
    () async {
      expect(settings.flipAlertsEnabled, isFalse);
      expect(settings.flipMinimumProfit, 100000);

      await settings.setFlipAlertsEnabled(true);
      final flips = [
        _flip('T4_BAG', 80000),
        _flip('T5_BAG', 125000),
        _flip('T6_BAG', 250000),
      ];

      expect(
        await settings.checkMarketFlips(flips: flips, region: 'west'),
        isTrue,
      );
      expect(notifications.flipAlertsShown, 1);
      expect(notifications.lastAlertedFlips, hasLength(2));
      expect(
        await settings.checkMarketFlips(flips: flips, region: 'west'),
        isFalse,
      );
      expect(notifications.flipAlertsShown, 1);

      await settings.checkMarketFlips(
        flips: [...flips, _flip('T7_BAG', 300000)],
        region: 'west',
      );
      expect(notifications.flipAlertsShown, 2);
      expect(notifications.lastAlertedFlips, hasLength(1));
    },
  );

  test('minimum flip profit validates and persists', () async {
    await expectLater(settings.setFlipMinimumProfit(-1), throwsArgumentError);

    await settings.setFlipMinimumProfit(0);

    expect(settings.flipMinimumProfit, 0);
    expect(preferences.getInt('settings.flipMinimumProfit'), 0);
  });
}

MarketFlip _flip(String itemId, int profit) => MarketFlip(
  itemId: itemId,
  itemName: itemId,
  buyCity: 'Martlock',
  buyPrice: 100000,
  sellCity: 'Bridgewatch',
  sellPrice: 100000 + profit,
  profit: profit,
  margin: 10,
);

class _TestNotifications implements NotificationGateway {
  int goldAlertsShown = 0;
  int flipAlertsShown = 0;
  List<MarketFlip> lastAlertedFlips = const [];
  String? lastGoldLanguageCode;
  String? lastFlipLanguageCode;
  String? lastBanditLanguageCode;

  @override
  bool get isSupported => true;

  @override
  Future<void> initialize() async {}

  @override
  Future<bool> requestPermission() async => true;

  @override
  Future<void> showGoldPriceAlert({
    required int price,
    required int threshold,
    required String direction,
    required String region,
    required String languageCode,
  }) async {
    goldAlertsShown++;
    lastGoldLanguageCode = languageCode;
  }

  @override
  Future<void> showMarketFlipAlert({
    required List<MarketFlip> flips,
    required String region,
    required String languageCode,
  }) async {
    flipAlertsShown++;
    lastAlertedFlips = flips;
    lastFlipLanguageCode = languageCode;
  }

  @override
  Future<void> scheduleBanditReminder({
    required DateTime utcTime,
    required String region,
    required String languageCode,
  }) async {
    lastBanditLanguageCode = languageCode;
  }

  @override
  Future<void> cancelBanditReminder() async {}
}
