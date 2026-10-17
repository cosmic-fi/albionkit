import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/models/albionkit_models.dart';
import '../../data/models/bandit_schedule.dart';
import '../../data/services/local_notification_service.dart';
import 'app_language.dart';

class AppSettingsController extends ChangeNotifier {
  AppSettingsController._(this._preferences, this._notifications)
    : _themeMode = _readThemeMode(_preferences),
      _languageCode = _readLanguageCode(_preferences),
      _serverRegion = _readServerRegion(_preferences),
      _banditAlertsEnabled = _preferences.getBool(_banditAlertsKey) ?? false,
      _banditReminderMinutes = _preferences.getInt(_banditReminderKey) ?? 15,
      _goldAlertsEnabled = _preferences.getBool(_goldAlertsKey) ?? false,
      _goldThreshold = _preferences.getInt(_goldThresholdKey) ?? 1000000,
      _goldAlertDirection =
          _preferences.getString(_goldDirectionKey) ?? 'above',
      _flipAlertsEnabled = _preferences.getBool(_flipAlertsKey) ?? false,
      _flipMinimumProfit = _preferences.getInt(_flipMinimumProfitKey) ?? 100000;

  AppSettingsController.forTesting({
    required SharedPreferences preferences,
    required NotificationGateway notifications,
  }) : this._(preferences, notifications);

  static const _themeModeKey = 'settings.themeMode';
  static const _languageKey = 'settings.language';
  static const _serverRegionKey = 'settings.serverRegion';
  static const _userAgreementAcceptedKey =
      'onboarding.userAgreementAccepted.v1';
  static const _banditAlertsKey = 'settings.banditAlerts';
  static const _banditReminderKey = 'settings.banditReminderMinutes';
  static const _goldAlertsKey = 'settings.goldAlerts';
  static const _goldThresholdKey = 'settings.goldThreshold';
  static const _goldDirectionKey = 'settings.goldDirection';
  static const _goldWasTriggeredKey = 'settings.goldWasTriggered';
  static const _flipAlertsKey = 'settings.flipAlerts';
  static const _flipMinimumProfitKey = 'settings.flipMinimumProfit';
  static const _lastFlipAlertIdsKey = 'settings.lastFlipAlertIds';

  final SharedPreferences _preferences;
  final NotificationGateway _notifications;

  ThemeMode _themeMode;
  String? _languageCode;
  String _serverRegion;
  bool _banditAlertsEnabled;
  int _banditReminderMinutes;
  bool _goldAlertsEnabled;
  int _goldThreshold;
  String _goldAlertDirection;
  bool? _flipAlertsEnabled;
  int? _flipMinimumProfit;
  Set<String>? _flipAlertChecksInProgress;

  ThemeMode get themeMode => _themeMode;
  String get languageCode => _languageCode ?? 'en';
  Locale get locale => AppLanguage.fromCode(languageCode)!.locale;
  String get serverRegion => _serverRegion;
  bool get userAgreementAccepted =>
      _preferences.getBool(_userAgreementAcceptedKey) ?? false;
  bool get banditAlertsEnabled => _banditAlertsEnabled;
  int get banditReminderMinutes => _banditReminderMinutes;
  bool get goldAlertsEnabled => _goldAlertsEnabled;
  int get goldThreshold => _goldThreshold;
  String get goldAlertDirection => _goldAlertDirection;
  bool get flipAlertsEnabled => _flipAlertsEnabled ?? false;
  int get flipMinimumProfit => _flipMinimumProfit ?? 100000;
  bool get notificationsSupported => _notifications.isSupported;
  Set<String> get _activeFlipAlertChecks =>
      _flipAlertChecksInProgress ??= <String>{};

  static Future<AppSettingsController> load() async {
    final preferences = await SharedPreferences.getInstance();
    final notifications = LocalNotificationService();
    await notifications.initialize();
    final controller = AppSettingsController._(preferences, notifications);
    if (controller._banditAlertsEnabled) {
      await controller.refreshBanditReminder(region: controller.serverRegion);
    }
    return controller;
  }

  Future<void> acceptUserAgreement() async {
    await _preferences.setBool(_userAgreementAcceptedKey, true);
    notifyListeners();
  }

  static ThemeMode _readThemeMode(SharedPreferences preferences) {
    return switch (preferences.getString(_themeModeKey)) {
      'dark' => ThemeMode.dark,
      'system' => ThemeMode.system,
      _ => ThemeMode.light,
    };
  }

  static String _readLanguageCode(SharedPreferences preferences) {
    final saved = AppLanguage.fromCode(preferences.getString(_languageKey));
    return saved?.code ?? 'en';
  }

  static String _readServerRegion(SharedPreferences preferences) {
    return switch (preferences.getString(_serverRegionKey)) {
      'east' => 'east',
      'europe' => 'europe',
      _ => 'west',
    };
  }

  Future<void> setServerRegion(String region) async {
    if (!['west', 'east', 'europe'].contains(region)) {
      throw ArgumentError.value(region, 'region', 'Unsupported server region');
    }
    await _preferences.setString(_serverRegionKey, region);
    _serverRegion = region;
    notifyListeners();
    await refreshBanditReminder(region: region);
  }

  Future<void> setLanguage(String languageCode) async {
    final language = AppLanguage.fromCode(languageCode);
    if (language == null) {
      throw ArgumentError.value(
        languageCode,
        'languageCode',
        'Unsupported app language',
      );
    }
    if (_banditAlertsEnabled) {
      await _scheduleBanditReminder(
        region: _serverRegion,
        reminderMinutes: _banditReminderMinutes,
        languageCode: language.code,
      );
    }
    await _preferences.setString(_languageKey, language.code);
    _languageCode = language.code;
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    final value = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    };
    await _preferences.setString(_themeModeKey, value);
    _themeMode = mode;
    notifyListeners();
  }

  Future<bool> saveSettings({
    required ThemeMode themeMode,
    required bool banditAlertsEnabled,
    required int banditReminderMinutes,
    required bool flipAlertsEnabled,
    required int flipMinimumProfit,
    required bool goldAlertsEnabled,
    required int goldThreshold,
    required String goldAlertDirection,
    required String region,
  }) async {
    if (![5, 10, 15, 30].contains(banditReminderMinutes)) {
      throw ArgumentError.value(
        banditReminderMinutes,
        'banditReminderMinutes',
        'Unsupported reminder time',
      );
    }
    if (flipMinimumProfit < 0) {
      throw ArgumentError.value(
        flipMinimumProfit,
        'flipMinimumProfit',
        'Must not be negative',
      );
    }
    if (goldThreshold < 1) {
      throw ArgumentError.value(
        goldThreshold,
        'goldThreshold',
        'Must be positive',
      );
    }
    if (goldAlertDirection != 'above' && goldAlertDirection != 'below') {
      throw ArgumentError.value(
        goldAlertDirection,
        'goldAlertDirection',
        'Must be above or below',
      );
    }

    final needsPermission =
        (banditAlertsEnabled && !_banditAlertsEnabled) ||
        (flipAlertsEnabled && !this.flipAlertsEnabled) ||
        (goldAlertsEnabled && !_goldAlertsEnabled);
    if (needsPermission) {
      final granted = await _notifications.requestPermission();
      if (!granted) return false;
    }

    if (banditAlertsEnabled) {
      await _scheduleBanditReminder(
        region: region,
        reminderMinutes: banditReminderMinutes,
      );
    } else if (_banditAlertsEnabled) {
      await _notifications.cancelBanditReminder();
    }

    final goldRuleChanged =
        goldThreshold != _goldThreshold ||
        goldAlertDirection != _goldAlertDirection ||
        goldAlertsEnabled != _goldAlertsEnabled;
    final flipRuleChanged =
        flipMinimumProfit != this.flipMinimumProfit ||
        flipAlertsEnabled != this.flipAlertsEnabled;

    await _preferences.setString(_themeModeKey, switch (themeMode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    });
    await _preferences.setBool(_banditAlertsKey, banditAlertsEnabled);
    await _preferences.setInt(_banditReminderKey, banditReminderMinutes);
    await _preferences.setBool(_flipAlertsKey, flipAlertsEnabled);
    await _preferences.setInt(_flipMinimumProfitKey, flipMinimumProfit);
    await _preferences.setBool(_goldAlertsKey, goldAlertsEnabled);
    await _preferences.setInt(_goldThresholdKey, goldThreshold);
    await _preferences.setString(_goldDirectionKey, goldAlertDirection);
    if (goldRuleChanged) {
      await _preferences.setBool(_goldWasTriggeredKey, false);
    }
    if (flipRuleChanged) {
      await _clearFlipAlertSnapshots();
    }

    _themeMode = themeMode;
    _banditAlertsEnabled = banditAlertsEnabled;
    _banditReminderMinutes = banditReminderMinutes;
    _flipAlertsEnabled = flipAlertsEnabled;
    _flipMinimumProfit = flipMinimumProfit;
    _goldAlertsEnabled = goldAlertsEnabled;
    _goldThreshold = goldThreshold;
    _goldAlertDirection = goldAlertDirection;
    notifyListeners();
    return true;
  }

  Future<bool> setBanditAlertsEnabled(
    bool enabled, {
    required String region,
  }) async {
    if (enabled) {
      final granted = await _notifications.requestPermission();
      if (!granted) return false;
      await _scheduleBanditReminder(
        region: region,
        reminderMinutes: _banditReminderMinutes,
      );
    } else {
      await _notifications.cancelBanditReminder();
    }
    await _preferences.setBool(_banditAlertsKey, enabled);
    _banditAlertsEnabled = enabled;
    notifyListeners();
    return true;
  }

  Future<void> setBanditReminderMinutes(
    int minutes, {
    required String region,
  }) async {
    if (![5, 10, 15, 30].contains(minutes)) {
      throw ArgumentError.value(
        minutes,
        'minutes',
        'Unsupported reminder time',
      );
    }
    if (_banditAlertsEnabled) {
      await _scheduleBanditReminder(region: region, reminderMinutes: minutes);
    }
    await _preferences.setInt(_banditReminderKey, minutes);
    _banditReminderMinutes = minutes;
    notifyListeners();
  }

  Future<bool> setGoldAlertsEnabled(bool enabled) async {
    if (enabled) {
      final granted = await _notifications.requestPermission();
      if (!granted) return false;
    }
    await _preferences.setBool(_goldAlertsKey, enabled);
    _goldAlertsEnabled = enabled;
    await _preferences.setBool(_goldWasTriggeredKey, false);
    notifyListeners();
    return true;
  }

  Future<void> setGoldAlert({
    required int threshold,
    required String direction,
  }) async {
    if (threshold < 1) {
      throw ArgumentError.value(threshold, 'threshold', 'Must be positive');
    }
    if (direction != 'above' && direction != 'below') {
      throw ArgumentError.value(
        direction,
        'direction',
        'Must be above or below',
      );
    }
    await _preferences.setInt(_goldThresholdKey, threshold);
    await _preferences.setString(_goldDirectionKey, direction);
    await _preferences.setBool(_goldWasTriggeredKey, false);
    _goldThreshold = threshold;
    _goldAlertDirection = direction;
    notifyListeners();
  }

  Future<void> setGoldAlertDirection(String direction) async {
    if (direction != 'above' && direction != 'below') {
      throw ArgumentError.value(
        direction,
        'direction',
        'Must be above or below',
      );
    }
    await _preferences.setString(_goldDirectionKey, direction);
    await _preferences.setBool(_goldWasTriggeredKey, false);
    _goldAlertDirection = direction;
    notifyListeners();
  }

  Future<bool> setFlipAlertsEnabled(bool enabled) async {
    if (enabled) {
      final granted = await _notifications.requestPermission();
      if (!granted) return false;
      await _clearFlipAlertSnapshots();
    }
    await _preferences.setBool(_flipAlertsKey, enabled);
    _flipAlertsEnabled = enabled;
    notifyListeners();
    return true;
  }

  Future<void> setFlipMinimumProfit(int minimumProfit) async {
    if (minimumProfit < 0) {
      throw ArgumentError.value(
        minimumProfit,
        'minimumProfit',
        'Must not be negative',
      );
    }
    await _preferences.setInt(_flipMinimumProfitKey, minimumProfit);
    _flipMinimumProfit = minimumProfit;
    await _clearFlipAlertSnapshots();
    notifyListeners();
  }

  Future<bool> checkMarketFlips({
    required List<MarketFlip> flips,
    required String region,
  }) async {
    if (!flipAlertsEnabled || !_notifications.isSupported) return false;
    final activeChecks = _activeFlipAlertChecks;
    if (!activeChecks.add(region)) return false;

    try {
      final qualifiedFlips = flips
          .where((flip) => flip.profit >= flipMinimumProfit)
          .toList();
      final currentIds = qualifiedFlips.map(_flipAlertIdentity).toSet();
      final preferenceKey = '$_lastFlipAlertIdsKey.$region';
      final previousIds =
          (_preferences.getStringList(preferenceKey) ?? const <String>[])
              .toSet();
      final newFlips = qualifiedFlips
          .where((flip) => !previousIds.contains(_flipAlertIdentity(flip)))
          .toList();

      if (newFlips.isNotEmpty) {
        await _notifications.showMarketFlipAlert(
          flips: newFlips,
          region: region,
          languageCode: languageCode,
        );
      }
      await _preferences.setStringList(
        preferenceKey,
        currentIds.toList()..sort(),
      );
      return newFlips.isNotEmpty;
    } finally {
      activeChecks.remove(region);
    }
  }

  String _flipAlertIdentity(MarketFlip flip) =>
      '${flip.itemId}|${flip.buyCity}|${flip.sellCity}';

  Future<void> _clearFlipAlertSnapshots() async {
    for (final region in ['west', 'east', 'europe']) {
      await _preferences.remove('$_lastFlipAlertIdsKey.$region');
    }
  }

  Future<bool> checkGoldPrice({
    required int price,
    required String region,
  }) async {
    if (!_goldAlertsEnabled || !_notifications.isSupported) return false;
    final met = _goldAlertDirection == 'above'
        ? price >= _goldThreshold
        : price <= _goldThreshold;
    final wasTriggered = _preferences.getBool(_goldWasTriggeredKey) ?? false;
    if (!met) {
      if (wasTriggered) {
        await _preferences.setBool(_goldWasTriggeredKey, false);
      }
      return false;
    }
    if (wasTriggered) return false;

    await _notifications.showGoldPriceAlert(
      price: price,
      threshold: _goldThreshold,
      direction: _goldAlertDirection,
      region: region,
      languageCode: languageCode,
    );
    await _preferences.setBool(_goldWasTriggeredKey, true);
    return true;
  }

  Future<void> refreshBanditReminder({required String region}) async {
    if (!_banditAlertsEnabled) return;
    await _scheduleBanditReminder(
      region: region,
      reminderMinutes: _banditReminderMinutes,
    );
  }

  Future<void> _scheduleBanditReminder({
    required String region,
    required int reminderMinutes,
    String? languageCode,
  }) async {
    final now = DateTime.now().toUtc();
    final next = BanditSchedule.nextWindow(region: region, utcNow: now);
    var reminderAt = next.at.subtract(Duration(minutes: reminderMinutes));
    if (!reminderAt.isAfter(now)) {
      reminderAt = now.add(const Duration(seconds: 10));
    }
    await _notifications.scheduleBanditReminder(
      utcTime: reminderAt,
      region: region,
      languageCode: languageCode ?? this.languageCode,
    );
  }
}
