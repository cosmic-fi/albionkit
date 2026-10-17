import 'package:flutter_test/flutter_test.dart';

import 'package:albionkit/ui/localization/app_text.dart';
import 'package:albionkit/ui/localization/translations_bootstrap.dart';
import 'package:albionkit/ui/localization/translations_calculators.dart';
import 'package:albionkit/ui/localization/translations_core.dart';
import 'package:albionkit/ui/localization/translations_market.dart';
import 'package:albionkit/ui/localization/translations_notifications.dart';
import 'package:albionkit/ui/localization/translations_specialized.dart';
import 'package:albionkit/ui/localization/translations_tools.dart';
import 'package:albionkit/ui/settings/app_language.dart';

void main() {
  const catalogs = <String, Map<String, Map<String, String>>>{
    'bootstrap': bootstrapTranslations,
    'calculators': calculatorTranslations,
    'core': coreTranslations,
    'market': marketTranslations,
    'notifications': notificationTranslations,
    'specialized': specializedTranslations,
    'tools': toolTranslations,
  };
  final placeholderPattern = RegExp(r'\{([^{}]+)\}');

  test('every translation catalog covers all nine app languages', () {
    for (final entry in catalogs.entries) {
      expect(
        entry.value.keys,
        containsAll(['de', 'fr', 'ru', 'pl', 'pt', 'es', 'tr', 'zh', 'ko']),
        reason: '${entry.key} catalog is missing a supported language',
      );
    }
  });

  test('navigation labels stay compact in every supported language', () {
    const labels = ['Home', 'Gold', 'Flips', 'Tools', 'Faction', 'Settings'];
    const locales = ['de', 'fr', 'ru', 'pl', 'pt', 'es', 'tr', 'zh', 'ko'];

    for (final locale in locales) {
      for (final label in labels) {
        expect(
          navigationTextFor(locale, label).runes.length,
          lessThanOrEqualTo(9),
          reason: '$locale "$label" navigation text is too long',
        );
      }
    }
  });

  test('app languages map to Albion Online GameInfo locales', () {
    expect(AppLanguage.gameInfoLocaleFor('en'), 'EN-US');
    expect(AppLanguage.gameInfoLocaleFor('de'), 'DE-DE');
    expect(AppLanguage.gameInfoLocaleFor('fr'), 'FR-FR');
    expect(AppLanguage.gameInfoLocaleFor('ru'), 'RU-RU');
    expect(AppLanguage.gameInfoLocaleFor('pl'), 'PL-PL');
    expect(AppLanguage.gameInfoLocaleFor('pt'), 'PT-BR');
    expect(AppLanguage.gameInfoLocaleFor('es'), 'ES-ES');
    expect(AppLanguage.gameInfoLocaleFor('tr'), 'TR-TR');
    expect(AppLanguage.gameInfoLocaleFor('zh'), 'ZH-CN');
    expect(AppLanguage.gameInfoLocaleFor('ko'), 'KO-KR');
  });

  test('tool labels and labourer names use translated catalog entries', () {
    expect(translateAppText('de', 'crop'), 'Feldfrucht');
    expect(translateAppText('fr', 'Pasture animal'), 'Animal d’élevage');
    expect(translateAppText('es', 'Lumberjack'), 'Leñador');
    expect(
      translateAppText(
        'de',
        'Yield {yield} · Quantity {quantity} · Sell in {city}',
      ),
      'Ertrag {yield} · Menge {quantity} · Verkauf in {city}',
    );
    expect(translateAppText('tr', 'No market price'), 'Pazar fiyatı yok');
  });

  test('gold calculator labels and ranges use translated catalog entries', () {
    expect(translateAppText('zh', 'GOLD'), '黄金');
    expect(translateAppText('zh', 'SILVER'), '银币');
    expect(translateAppText('zh', '{amount} gold'), '{amount} 金币');
    expect(translateAppText('zh', '{amount} silver'), '{amount} 银币');
    expect(translateAppText('zh', '1d'), '1天');
    expect(translateAppText('zh', '1w'), '1周');
    expect(translateAppText('zh', '1m'), '1月');
  });

  test(
    'Turkish catalog preserves dotted and dotless letters and diacritics',
    () {
      final turkishCalculators = calculatorTranslations['tr']!;

      expect(turkishCalculators['Animal breeding'], 'Hayvan yetiştiriciliği');
      expect(turkishCalculators['Farming'], 'Çiftçilik');
      expect(
        turkishCalculators['Choose a meal from the {category} list.'],
        '{category} listesinden bir yemek seçin.',
      );
    },
  );

  test('catalog translations are complete and preserve placeholders', () {
    for (final entry in catalogs.entries) {
      final catalog = entry.value;
      final englishKeys = catalog.values.first.keys.toSet();
      expect(englishKeys, isNotEmpty, reason: '${entry.key} has no strings');

      for (final locale in catalog.entries) {
        expect(
          locale.value.keys,
          equals(englishKeys),
          reason: '${entry.key} has incomplete ${locale.key} translations',
        );
        for (final translation in locale.value.entries) {
          expect(
            translation.value.trim(),
            isNotEmpty,
            reason: '${entry.key}/${locale.key} has an empty translation',
          );
          expect(
            placeholderPattern
                .allMatches(translation.key)
                .map((match) => match.group(1))
                .toSet(),
            equals(
              placeholderPattern
                  .allMatches(translation.value)
                  .map((match) => match.group(1))
                  .toSet(),
            ),
            reason:
                '${entry.key}/${locale.key} changed placeholders in '
                '"${translation.key}"',
          );
        }
      }
    }
  });
}
