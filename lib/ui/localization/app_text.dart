import 'package:flutter/widgets.dart';

import 'translations_calculators.dart';
import 'translations_bootstrap.dart';
import 'translations_core.dart';
import 'translations_market.dart';
import 'translations_notifications.dart';
import 'translations_specialized.dart';
import 'translations_tools.dart';

const _translationBundles = [
  calculatorTranslations,
  bootstrapTranslations,
  coreTranslations,
  marketTranslations,
  notificationTranslations,
  specializedTranslations,
  toolTranslations,
];

String appText(BuildContext context, String english) {
  return translateAppText(
    Localizations.localeOf(context).languageCode,
    english,
  );
}

String translateAppText(String languageCode, String english) {
  if (languageCode == 'en') return english;

  for (final bundle in _translationBundles) {
    final translation = bundle[languageCode]?[english];
    if (translation != null) return translation;
  }
  return english;
}

String appNavigationText(BuildContext context, String english) {
  return navigationTextFor(
    Localizations.localeOf(context).languageCode,
    english,
  );
}

String navigationTextFor(String languageCode, String english) {
  return _shortNavigationLabels[languageCode]?[english] ??
      translateAppText(languageCode, english);
}

String appButtonText(BuildContext context, String english) {
  final languageCode = Localizations.localeOf(context).languageCode;
  return _shortButtonLabels[languageCode]?[english] ??
      translateAppText(languageCode, english);
}

const _shortNavigationLabels = <String, Map<String, String>>{
  'de': {
    'Home': 'Start',
    'Gold': 'Gold',
    'Flips': 'Flips',
    'Tools': 'Tools',
    'Faction': 'Fraktion',
    'Settings': 'Einst.',
  },
  'fr': {
    'Home': 'Accueil',
    'Gold': 'Or',
    'Flips': 'Flips',
    'Tools': 'Outils',
    'Faction': 'Faction',
    'Settings': 'Réglages',
  },
  'ru': {
    'Home': 'Главная',
    'Gold': 'Золото',
    'Flips': 'Сделки',
    'Tools': 'Инстр.',
    'Faction': 'Фракция',
    'Settings': 'Настр.',
  },
  'pl': {
    'Home': 'Dom',
    'Gold': 'Złoto',
    'Flips': 'Okazje',
    'Tools': 'Narz.',
    'Faction': 'Frakcja',
    'Settings': 'Ustaw.',
  },
  'pt': {
    'Home': 'Início',
    'Gold': 'Ouro',
    'Flips': 'Ofertas',
    'Tools': 'Ferram.',
    'Faction': 'Facção',
    'Settings': 'Ajustes',
  },
  'es': {
    'Home': 'Inicio',
    'Gold': 'Oro',
    'Flips': 'Ofertas',
    'Tools': 'Herram.',
    'Faction': 'Facción',
    'Settings': 'Ajustes',
  },
  'tr': {
    'Home': 'Ana sayfa',
    'Gold': 'Altın',
    'Flips': 'Pazar',
    'Tools': 'Araçlar',
    'Faction': 'Fraks.',
    'Settings': 'Ayarlar',
  },
  'zh': {
    'Home': '首页',
    'Gold': '黄金',
    'Flips': '倒卖',
    'Tools': '工具',
    'Faction': '阵营',
    'Settings': '设置',
  },
  'ko': {
    'Home': '홈',
    'Gold': '골드',
    'Flips': '거래',
    'Tools': '도구',
    'Faction': '세력',
    'Settings': '설정',
  },
};

const _shortButtonLabels = <String, Map<String, String>>{
  'de': {'Agree & continue': 'Zustimmen'},
  'fr': {'Agree & continue': 'Accepter'},
  'ru': {'Agree & continue': 'Принять'},
  'pl': {'Agree & continue': 'Akceptuj'},
  'pt': {'Agree & continue': 'Aceitar'},
  'es': {'Agree & continue': 'Aceptar'},
  'tr': {'Agree & continue': 'Onayla'},
  'zh': {'Agree & continue': '同意'},
  'ko': {'Agree & continue': '동의'},
};
