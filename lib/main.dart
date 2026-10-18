import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import 'ui/albionkit_app.dart';
import 'ui/core/albionkit_theme.dart';
import 'ui/localization/app_text.dart';
import 'ui/settings/app_language.dart';
import 'ui/settings/app_settings_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AlbionKitBootstrap());
}

class AlbionKitBootstrap extends StatefulWidget {
  const AlbionKitBootstrap({super.key});

  @override
  State<AlbionKitBootstrap> createState() => _AlbionKitBootstrapState();
}

class _AlbionKitBootstrapState extends State<AlbionKitBootstrap> {
  static const _minimumLoadingDuration = Duration(milliseconds: 1400);

  AppSettingsController? _settings;
  Object? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final loadingTimer = Stopwatch()..start();
    setState(() {
      _loading = true;
      _error = null;
    });
    AppSettingsController? settings;
    Object? loadError;
    try {
      settings = await AppSettingsController.load();
    } catch (error) {
      loadError = error;
    }

    final remaining = _minimumLoadingDuration - loadingTimer.elapsed;
    if (remaining > Duration.zero) await Future<void>.delayed(remaining);
    if (!mounted) {
      settings?.dispose();
      return;
    }

    if (loadError != null) {
      setState(() {
        _error = loadError;
        _loading = false;
      });
    } else {
      setState(() {
        _settings = settings;
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _settings?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = _settings;
    if (settings != null) return AlbionKitApp(settings: settings);
    return MaterialApp(
      title: 'AlbionKit',
      debugShowCheckedModeBanner: false,
      supportedLocales: AppLanguage.supportedLocales,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ],
      theme: AlbionKitTheme.light,
      darkTheme: AlbionKitTheme.dark,
      home: Builder(
        builder: (context) => Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset(
                    'assets/brand/albionkit-mark.png',
                    width: 72,
                    height: 72,
                  ),
                  const SizedBox(height: 20),
                  if (_loading)
                    const CircularProgressIndicator()
                  else ...[
                    Text(
                      appText(
                        context,
                        'Could not start AlbionKit: {error}',
                      ).replaceAll('{error}', '$_error'),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: _loadSettings,
                      icon: const Icon(LucideIcons.refreshCw),
                      label: Text(appText(context, 'Try again')),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
