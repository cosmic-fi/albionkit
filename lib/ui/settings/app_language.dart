import 'package:flutter/material.dart';

class AppLanguage {
  const AppLanguage({required this.code, required this.nativeName});

  final String code;
  final String nativeName;

  Locale get locale => Locale(code);

  static const supported = [
    AppLanguage(code: 'en', nativeName: 'English'),
    AppLanguage(code: 'de', nativeName: 'Deutsch'),
    AppLanguage(code: 'fr', nativeName: 'Français'),
    AppLanguage(code: 'ru', nativeName: 'Русский'),
    AppLanguage(code: 'pl', nativeName: 'Polski'),
    AppLanguage(code: 'pt', nativeName: 'Português'),
    AppLanguage(code: 'es', nativeName: 'Español'),
    AppLanguage(code: 'tr', nativeName: 'Türkçe'),
    AppLanguage(code: 'zh', nativeName: '中文'),
    AppLanguage(code: 'ko', nativeName: '한국어'),
  ];

  static const supportedLocales = [
    Locale('en'),
    Locale('de'),
    Locale('fr'),
    Locale('ru'),
    Locale('pl'),
    Locale('pt'),
    Locale('es'),
    Locale('tr'),
    Locale('zh'),
    Locale('ko'),
  ];

  static AppLanguage? fromCode(String? code) {
    for (final language in supported) {
      if (language.code == code) return language;
    }
    return null;
  }

  static String gameInfoLocaleFor(String code) {
    return switch (code) {
      'de' => 'DE-DE',
      'fr' => 'FR-FR',
      'ru' => 'RU-RU',
      'pl' => 'PL-PL',
      'pt' => 'PT-BR',
      'es' => 'ES-ES',
      'tr' => 'TR-TR',
      'zh' => 'ZH-CN',
      'ko' => 'KO-KR',
      _ => 'EN-US',
    };
  }

  static String labelFor(String code) {
    return switch (code) {
      'en' => 'Language',
      'de' => 'Sprache',
      'fr' => 'Langue',
      'ru' => 'Язык',
      'pl' => 'Język',
      'pt' => 'Idioma',
      'es' => 'Idioma',
      'tr' => 'Dil',
      'zh' => '语言',
      'ko' => '언어',
      _ => 'Language',
    };
  }

  static String settingsDescriptionFor(String code) {
    return switch (code) {
      'en' => 'Choose the language used in the app.',
      'de' => 'Wähle die Sprache für die App.',
      'fr' => 'Choisissez la langue de l’application.',
      'ru' => 'Выберите язык приложения.',
      'pl' => 'Wybierz język aplikacji.',
      'pt' => 'Escolha o idioma do aplicativo.',
      'es' => 'Elige el idioma de la aplicación.',
      'tr' => 'Uygulama dilini seçin.',
      'zh' => '选择应用使用的语言。',
      'ko' => '앱에서 사용할 언어를 선택하세요.',
      _ => 'Choose the language used in the app.',
    };
  }

  static String chooseLanguageTitle(String code) {
    return switch (code) {
      'en' => 'Choose a language',
      'de' => 'Sprache auswählen',
      'fr' => 'Choisir une langue',
      'ru' => 'Выберите язык',
      'pl' => 'Wybierz język',
      'pt' => 'Escolha um idioma',
      'es' => 'Elige un idioma',
      'tr' => 'Dil seçin',
      'zh' => '选择语言',
      'ko' => '언어 선택',
      _ => 'Choose a language',
    };
  }
}
