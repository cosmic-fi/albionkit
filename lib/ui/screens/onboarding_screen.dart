import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../localization/app_text.dart';
import '../settings/app_language.dart';
import '../settings/app_settings_controller.dart';
import '../widgets/app_language_selector.dart';
import '../widgets/ak_widgets.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.settings});

  final AppSettingsController settings;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  static const _lastPage = 3;
  final PageController _pageController = PageController();
  int _page = 0;
  bool _saving = false;
  String? _error;

  List<_OnboardingPage> _introPages(BuildContext context) => [
    _OnboardingPage(
      title: appText(context, 'Welcome to\nAlbionKit'),
      description: appText(
        context,
        'Check market prices, track gold, and run crafting calculators.',
      ),
      imageAsset: 'assets/images/ak-player.jpg',
    ),
    _OnboardingPage(
      title: appText(context, 'Plan, track,\nand earn'),
      description: appText(
        context,
        'Track gold, compare crafting returns, and check faction times.',
      ),
      imageAsset: 'assets/images/ak-fishing.jpg',
    ),
    _OnboardingPage(
      title: appText(context, 'Set up your\nalerts'),
      description: appText(
        context,
        'Choose your server region and set alerts in Settings.',
      ),
      imageAsset: 'assets/images/ak-factions.jpeg',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_page < _lastPage) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
      );
    }
  }

  Future<void> _openPolicy(String path) async {
    try {
      final opened = await launchUrl(
        Uri.https('albionkit.com', path),
        mode: LaunchMode.externalApplication,
      );
      if (!opened && mounted) {
        setState(
          () => _error = appText(context, 'Could not open the policy page.'),
        );
      }
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = appText(
            context,
            'Could not open the policy: {error}',
          ).replaceAll('{error}', '$error'),
        );
      }
    }
  }

  Future<void> _acceptAndContinue() async {
    if (_saving) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.settings.acceptUserAgreement();
    } catch (error) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = appText(
            context,
            'Could not save your agreement: {error}',
          ).replaceAll('{error}', '$error');
        });
      }
    }
  }

  Future<void> _selectLanguage(AppLanguage language) async {
    try {
      await widget.settings.setLanguage(language.code);
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = appText(
            context,
            'Could not save language preference: {error}',
          ).replaceAll('{error}', '$error'),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final backgroundColor = theme.scaffoldBackgroundColor;
    final systemUiOverlayStyle = SystemUiOverlayStyle(
      statusBarColor: backgroundColor,
      statusBarIconBrightness: colors.brightness == Brightness.light
          ? Brightness.dark
          : Brightness.light,
      statusBarBrightness: colors.brightness,
    );
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: systemUiOverlayStyle,
      child: Scaffold(
        backgroundColor: backgroundColor,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 20),
            child: Column(
              children: [
                Row(
                  children: [
                    AppLanguageSelector(
                      compact: true,
                      language: AppLanguage.fromCode(
                        widget.settings.languageCode,
                      )!,
                      onChanged: _selectLanguage,
                    ),
                    const Spacer(),
                    if (_page < _lastPage) ...[
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: () => _pageController.animateToPage(
                          _lastPage,
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeOutCubic,
                        ),
                        style: TextButton.styleFrom(
                          foregroundColor: colors.onSurfaceVariant,
                          visualDensity: VisualDensity.compact,
                        ),
                        child: Text(appText(context, 'Skip')),
                      ),
                    ],
                  ],
                ),
                Expanded(
                  child: PageView(
                    controller: _pageController,
                    onPageChanged: (page) => setState(() {
                      _page = page;
                      _error = null;
                    }),
                    children: [
                      for (final page in _introPages(context))
                        _IntroPageView(page: page),
                      _AgreementPage(
                        onPrivacyTap: () => _openPolicy('/privacy'),
                        onTermsTap: () => _openPolicy('/terms'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_lastPage + 1, (index) {
                    final active = index == _page;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      width: active ? 24 : 8,
                      height: 5,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: active
                            ? akOrange
                            : colors.onSurfaceVariant.withValues(alpha: .22),
                        borderRadius: BorderRadius.circular(5),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 18),
                if (_error case final error?)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Text(
                      error,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: colors.error, fontSize: 13),
                    ),
                  ),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    key: const ValueKey('onboarding-continue'),
                    onPressed: _saving
                        ? null
                        : _page == _lastPage
                        ? _acceptAndContinue
                        : _nextPage,
                    style: FilledButton.styleFrom(
                      backgroundColor: akOrange,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      child: _page == _lastPage || _saving
                          ? Center(
                              child: Text(
                                _saving
                                    ? appText(context, 'Saving...')
                                    : appButtonText(
                                        context,
                                        'Agree & continue',
                                      ),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  appText(context, 'Continue'),
                                  style: TextStyle(fontWeight: FontWeight.w800),
                                ),
                                SizedBox(width: 9),
                                Icon(LucideIcons.arrowRight, size: 17),
                              ],
                            ),
                    ),
                  ),
                ),
                const SizedBox(height: 5),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _IntroPageView extends StatelessWidget {
  const _IntroPageView({required this.page});

  final _OnboardingPage page;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final compact = MediaQuery.sizeOf(context).height < 700;
    return Center(
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Padding(
              padding: EdgeInsets.only(bottom: compact ? 8 : 28, top: 18),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _WelcomeImageCard(
                    compact: compact,
                    imageAsset: page.imageAsset,
                  ),
                  SizedBox(height: compact ? 24 : 32),
                  Text(
                    page.title,
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontSize: compact ? 36 : 40,
                      fontWeight: FontWeight.w900,
                      height: 1.02,
                      letterSpacing: -1.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    page.description,
                    style: TextStyle(
                      color: colors.onSurfaceVariant,
                      fontSize: 15,
                      height: 1.55,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _WelcomeImageCard extends StatelessWidget {
  const _WelcomeImageCard({required this.compact, required this.imageAsset});

  final bool compact;
  final String imageAsset;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      key: const ValueKey('onboarding-image-card'),
      borderRadius: BorderRadius.circular(24),
      child: SizedBox(
        width: double.infinity,
        height: compact ? 190 : 250,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              imageAsset,
              fit: BoxFit.cover,
              alignment: Alignment.center,
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: .04),
                    Colors.black.withValues(alpha: .48),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AgreementPage extends StatelessWidget {
  const _AgreementPage({required this.onPrivacyTap, required this.onTermsTap});

  final VoidCallback onPrivacyTap;
  final VoidCallback onTermsTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final compact = MediaQuery.sizeOf(context).height < 700;
    return Center(
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Padding(
              padding: EdgeInsets.only(top: 18, bottom: compact ? 8 : 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      color: akOrange.withValues(alpha: .16),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(
                      LucideIcons.fileCheck2,
                      size: 26,
                      color: akOrange,
                    ),
                  ),
                  const SizedBox(height: 25),
                  Text(
                    appText(context, 'Before you jump in'),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: -.8,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    appText(
                      context,
                      'Please review the terms and privacy details before using the app.',
                    ),
                    style: TextStyle(
                      color: colors.onSurfaceVariant,
                      height: 1.5,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 18),
                  _LegalSummaryTile(
                    icon: LucideIcons.scale,
                    title: appText(context, 'Independent fan project'),
                    description: appText(
                      context,
                      'AlbionKit is not affiliated with or endorsed by Sandbox Interactive. Albion Online and related marks belong to their owners.',
                    ),
                  ),
                  const SizedBox(height: 10),
                  _LegalSummaryTile(
                    icon: LucideIcons.shieldCheck,
                    title: appText(context, 'Your privacy matters'),
                    description: appText(
                      context,
                      'See what information is used and how the app works in our privacy policy.',
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    children: [
                      OutlinedButton.icon(
                        onPressed: onTermsTap,
                        icon: const Icon(LucideIcons.externalLink, size: 15),
                        label: Text(appText(context, 'Terms')),
                      ),
                      OutlinedButton.icon(
                        onPressed: onPrivacyTap,
                        icon: const Icon(LucideIcons.externalLink, size: 15),
                        label: Text(appText(context, 'Privacy policy')),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LegalSummaryTile extends StatelessWidget {
  const _LegalSummaryTile({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: akOrange, size: 19),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: colors.onSurface,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    color: colors.onSurfaceVariant,
                    fontSize: 11,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OnboardingPage {
  const _OnboardingPage({
    required this.title,
    required this.description,
    required this.imageAsset,
  });

  final String title;
  final String description;
  final String imageAsset;
}
