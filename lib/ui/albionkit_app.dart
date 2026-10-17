import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../data/models/albionkit_api_status.dart';
import '../data/repositories/albionkit_repository.dart';
import 'core/albionkit_theme.dart';
import 'screens/home_screen.dart';
import 'screens/onboarding_screen.dart';
import 'settings/app_language.dart';
import 'settings/app_settings_controller.dart';

class AlbionKitApp extends StatelessWidget {
  const AlbionKitApp({
    super.key,
    required this.settings,
    this.apiStatusLoader,
    this.repository,
  });

  final AppSettingsController settings;
  final Future<AlbionKitApiStatus> Function()? apiStatusLoader;
  final AlbionKitRepository? repository;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: settings,
      builder: (context, _) => MaterialApp(
        title: 'AlbionKit Mobile',
        debugShowCheckedModeBanner: false,
        locale: settings.locale,
        supportedLocales: AppLanguage.supportedLocales,
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
        ],
        theme: AlbionKitTheme.light,
        darkTheme: AlbionKitTheme.dark,
        themeMode: settings.themeMode,
        home: settings.userAgreementAccepted
            ? HomeScreen(
                settings: settings,
                apiStatusLoader: apiStatusLoader,
                repository: repository,
              )
            : OnboardingScreen(settings: settings),
      ),
    );
  }
}
