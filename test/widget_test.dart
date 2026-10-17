import 'dart:async';

// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:albionkit/data/models/albionkit_api_status.dart';
import 'package:albionkit/data/models/animal_models.dart';
import 'package:albionkit/data/models/cooking_models.dart';
import 'package:albionkit/data/models/farming_models.dart';
import 'package:albionkit/data/models/albionkit_models.dart';
import 'package:albionkit/data/models/specialized_profit_models.dart';
import 'package:albionkit/data/repositories/albionkit_repository.dart';
import 'package:albionkit/ui/albionkit_app.dart';
import 'package:albionkit/ui/core/albionkit_theme.dart';
import 'package:albionkit/ui/screens/onboarding_screen.dart';
import 'package:albionkit/ui/settings/app_settings_controller.dart';
import 'package:albionkit/ui/screens/cooking_screen.dart';
import 'package:albionkit/ui/screens/farming_screen.dart';
import 'package:albionkit/data/services/local_notification_service.dart';
import 'package:albionkit/ui/widgets/ak_widgets.dart';
import 'package:albionkit/ui/widgets/localized_item_name.dart';

void main() {
  late AppSettingsController settings;
  late _TestRepository repository;
  late SharedPreferences preferences;

  setUp(() async {
    SharedPreferences.setMockInitialValues({
      'onboarding.userAgreementAccepted.v1': true,
    });
    preferences = await SharedPreferences.getInstance();
    PackageInfo.setMockInitialValues(
      appName: 'AlbionKit',
      packageName: 'com.albionkit.mobile',
      version: '1.0.0',
      buildNumber: '1',
      buildSignature: '',
    );
    settings = AppSettingsController.forTesting(
      preferences: preferences,
      notifications: _TestNotifications(),
    );
    repository = _TestRepository();
  });

  tearDown(() {
    LocalNotificationService.notificationTap.value = null;
    settings.dispose();
  });

  testWidgets('input focus survives rebuilds and dismisses on outside taps', (
    WidgetTester tester,
  ) async {
    final focusNode = FocusNode();
    final controller = TextEditingController();
    addTearDown(focusNode.dispose);
    addTearDown(controller.dispose);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StatefulBuilder(
            builder: (context, setState) => Column(
              children: [
                TextField(
                  key: const ValueKey('focus-test-input'),
                  controller: controller,
                  focusNode: focusNode,
                  onChanged: (_) => setState(() {}),
                  onTapOutside: akUnfocusOnTapOutside,
                ),
                const Text('Outside input'),
              ],
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.byKey(const ValueKey('focus-test-input')));
    await tester.enterText(
      find.byKey(const ValueKey('focus-test-input')),
      '123',
    );
    await tester.pump();
    expect(controller.text, '123');
    expect(focusNode.hasFocus, isTrue);

    await tester.tap(find.text('Outside input'));
    await tester.pump();
    expect(focusNode.hasFocus, isFalse);
  });

  test('shared theme does not draw component outlines', () {
    final theme = AlbionKitTheme.light;

    expect(
      (theme.cardTheme.shape! as RoundedRectangleBorder).side,
      BorderSide.none,
    );
    final inputBorder =
        theme.inputDecorationTheme.border! as OutlineInputBorder;
    final enabledInputBorder =
        theme.inputDecorationTheme.enabledBorder! as OutlineInputBorder;
    final focusedInputBorder =
        theme.inputDecorationTheme.focusedBorder! as OutlineInputBorder;
    expect(inputBorder.borderRadius, BorderRadius.circular(14));
    expect(inputBorder.borderSide.color, Colors.transparent);
    expect(enabledInputBorder.borderSide.color, Colors.transparent);
    expect(focusedInputBorder.borderSide.color, Colors.transparent);
    expect(theme.chipTheme.side, BorderSide.none);
    expect(
      theme.chipTheme.backgroundColor,
      theme.colorScheme.surfaceContainerHigh,
    );
    expect(theme.chipTheme.selectedColor, theme.colorScheme.primary);
    expect(theme.chipTheme.secondaryLabelStyle!.color, Colors.white);
    final segmentedStyle = theme.segmentedButtonTheme.style!;
    expect(
      segmentedStyle.backgroundColor!.resolve({WidgetState.selected}),
      theme.colorScheme.primary,
    );
    expect(
      segmentedStyle.backgroundColor!.resolve({}),
      theme.colorScheme.surfaceContainerHigh,
    );
    expect(
      segmentedStyle.foregroundColor!.resolve({WidgetState.selected}),
      Colors.white,
    );
    expect(theme.outlinedButtonTheme.style!.side!.resolve({}), BorderSide.none);
    expect(
      theme.outlinedButtonTheme.style!.backgroundColor!.resolve({}),
      theme.colorScheme.surfaceContainerHigh,
    );
    expect(theme.dividerTheme.color, isNot(Colors.transparent));
    expect(theme.colorScheme.outline, Colors.transparent);
  });

  test('market flip notification titles identify the server region', () {
    expect(
      LocalNotificationService.marketFlipNotificationTitle('west'),
      'West (Americas) Market Opportunity',
    );
    expect(
      LocalNotificationService.marketFlipNotificationTitle('east'),
      'East (Asia) Market Opportunity',
    );
    expect(
      LocalNotificationService.marketFlipNotificationTitle('europe'),
      'Europe Market Opportunity',
    );
  });

  testWidgets('first launch requires agreement before entering the app', (
    WidgetTester tester,
  ) async {
    await preferences.setBool('onboarding.userAgreementAccepted.v1', false);
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Welcome to\nAlbionKit'), findsOneWidget);
    expect(find.text('1 / 4'), findsNothing);
    expect(find.text('Skip'), findsOneWidget);
    expect(find.text('English'), findsOneWidget);
    final languageSelectorCenter = tester.getCenter(
      find.byKey(const ValueKey('language-selector')),
    );
    final skipCenter = tester.getCenter(find.text('Skip'));
    expect(languageSelectorCenter.dx, lessThan(400));
    expect(skipCenter.dx, greaterThan(languageSelectorCenter.dx));
    expect(find.text('YOUR ALBION COMPANION'), findsNothing);
    final onboardingScaffold = tester.widget<Scaffold>(
      find.descendant(
        of: find.byType(OnboardingScreen),
        matching: find.byType(Scaffold),
      ),
    );
    final onboardingOverlay = tester
        .widget<AnnotatedRegion<SystemUiOverlayStyle>>(
          find.descendant(
            of: find.byType(OnboardingScreen),
            matching: find.byType(AnnotatedRegion<SystemUiOverlayStyle>),
          ),
        );
    expect(
      onboardingScaffold.backgroundColor,
      AlbionKitTheme.light.scaffoldBackgroundColor,
    );
    expect(
      onboardingOverlay.value.statusBarColor,
      onboardingScaffold.backgroundColor,
    );
    expect(find.byType(BoxShadow), findsNothing);
    expect(find.byKey(const ValueKey('onboarding-image-card')), findsOneWidget);
    void expectOnboardingImage(String asset) {
      expect(
        (tester
                    .widget<Image>(
                      find.descendant(
                        of: find.byKey(const ValueKey('onboarding-image-card')),
                        matching: find.byType(Image),
                      ),
                    )
                    .image
                as AssetImage)
            .assetName,
        asset,
      );
    }

    expectOnboardingImage('assets/images/ak-player.jpg');
    await tester.tap(find.byKey(const ValueKey('onboarding-continue')));
    await tester.pumpAndSettle();
    expectOnboardingImage('assets/images/ak-fishing.jpg');
    await tester.tap(find.byKey(const ValueKey('onboarding-continue')));
    await tester.pumpAndSettle();
    expectOnboardingImage('assets/images/ak-factions.jpeg');
    await tester.tap(find.byKey(const ValueKey('onboarding-continue')));
    await tester.pumpAndSettle();

    expect(find.text('Before you jump in'), findsOneWidget);
    final continueButton = tester.widget<FilledButton>(
      find.byKey(const ValueKey('onboarding-continue')),
    );
    expect(continueButton.onPressed, isNotNull);
    expect(
      find.descendant(
        of: find.byKey(const ValueKey('onboarding-continue')),
        matching: find.byType(Center),
      ),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: find.byKey(const ValueKey('onboarding-continue')),
        matching: find.byType(Icon),
      ),
      findsNothing,
    );
    expect(find.byKey(const ValueKey('user-agreement-checkbox')), findsNothing);
    expect(find.text('Albion servers'), findsNothing);

    await tester.tap(find.byKey(const ValueKey('onboarding-continue')));
    await tester.pumpAndSettle();

    expect(settings.userAgreementAccepted, isTrue);
    await tester.scrollUntilVisible(
      find.text('Albion servers'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Albion servers'), findsOneWidget);
  });

  testWidgets('onboarding lets the user choose a supported language', (
    WidgetTester tester,
  ) async {
    await preferences.setBool('onboarding.userAgreementAccepted.v1', false);
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('language-selector')));
    await tester.pumpAndSettle();
    expect(find.text('Choose a language'), findsOneWidget);
    expect(find.byKey(const ValueKey('language-option-de')), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('language-option-de')));
    await tester.pumpAndSettle();

    expect(settings.languageCode, 'de');
    expect(preferences.getString('settings.language'), 'de');
    expect(
      tester.widget<MaterialApp>(find.byType(MaterialApp)).locale,
      const Locale('de'),
    );
  });

  testWidgets('app builds with AlbionKit title', (WidgetTester tester) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('AlbionKit'), findsOneWidget);
    expect(find.text('MOBILE'), findsNothing);
    expect(find.text('Intel'), findsNothing);
    expect(find.text('Armory'), findsNothing);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Gold'), findsOneWidget);
    expect(find.text('Flips'), findsOneWidget);
    expect(find.text('Tools'), findsOneWidget);
    expect(find.text('Faction'), findsOneWidget);
    expect(find.byIcon(LucideIcons.settings), findsOneWidget);
    expect(find.text('Find your next\nprofitable trade.'), findsOneWidget);
    expect(find.text('SERVER REGION'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Trending flips'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Trending flips'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Albion servers'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Albion servers'), findsOneWidget);
    expect(find.text('Offline'), findsOneWidget);
    expect(find.text('WEST · OFFLINE'), findsNothing);
    expect(
      tester.getTopLeft(find.text('Gold price')).dy,
      lessThan(tester.getTopLeft(find.text('Albion servers')).dy),
    );
    expect(find.text('Your toolkit'), findsNothing);
    expect(settings.themeMode, ThemeMode.light);
  });

  testWidgets('home hero carousel swipes between feature banners', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();

    await tester.drag(
      find.byKey(const ValueKey('home-hero-carousel')),
      const Offset(-500, 0),
    );
    await tester.pumpAndSettle();

    expect(find.text('Follow the\nsilver swings.'), findsOneWidget);
    expect(find.text('Find your next\nprofitable trade.'), findsNothing);
  });

  testWidgets('home hero carousel shows the full localized description', (
    WidgetTester tester,
  ) async {
    await settings.setLanguage('de');
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();

    final description = find.text(
      'Vergleiche Preise in verschiedenen Städten und finde lohnende Handelschancen.',
    );
    expect(description, findsOneWidget);
    expect(tester.widget<Text>(description).maxLines, isNull);
    expect(tester.widget<Text>(description).overflow, isNull);
  });

  testWidgets('home hero carousel advances automatically', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 11));
    await tester.pumpAndSettle();

    expect(find.text('Follow the\nsilver swings.'), findsOneWidget);
  });

  testWidgets('home hero carousel ends with the Discord community slide', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('hero-page-indicator-3')));
    await tester.pumpAndSettle();

    expect(find.text('Join us on\nDiscord'), findsOneWidget);
    expect(find.text('Join our Discord'), findsOneWidget);
    expect(find.byIcon(LucideIcons.externalLink), findsOneWidget);
    expect(find.text('ALBIONKIT COMMUNITY'), findsNothing);
  });

  testWidgets('home hero carousel includes a donation support slide', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('hero-page-indicator-4')));
    await tester.pumpAndSettle();

    expect(find.text('Support\nAlbionKit'), findsOneWidget);
    expect(
      find.text(
        'If AlbionKit is useful, your support helps keep it free and ad-free.',
      ),
      findsOneWidget,
    );
    expect(find.text('Donate to AlbionKit'), findsOneWidget);
    expect(find.byIcon(LucideIcons.externalLink), findsOneWidget);
    expect(find.text('SUPPORT ALBIONKIT'), findsNothing);
  });

  testWidgets(
    'home pull-to-refresh reloads dashboard data without API button',
    (WidgetTester tester) async {
      var statusRequests = 0;
      Future<AlbionKitApiStatus> loadStatus() {
        statusRequests++;
        return _loadApiStatus();
      }

      await tester.pumpWidget(
        AlbionKitApp(
          settings: settings,
          apiStatusLoader: loadStatus,
          repository: repository,
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byTooltip('Refresh API status'), findsNothing);

      final flipsBefore = repository.marketFlipRequests;
      final goldBefore = repository.goldHistoryRequests;
      await tester.dragFrom(const Offset(400, 100), const Offset(0, 500));
      await tester.pumpAndSettle();

      expect(statusRequests, 2);
      expect(repository.marketFlipRequests, flipsBefore + 1);
      expect(repository.goldHistoryRequests, goldBefore + 1);
    },
  );

  testWidgets('dashboard region selection updates the Gold data region', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('server-region-selector')));
    await tester.pumpAndSettle();
    expect(find.text('Choose server region'), findsOneWidget);
    expect(find.text('West (Americas)'), findsWidgets);
    expect(find.text('East (Asia)'), findsWidgets);
    expect(
      find.byKey(const ValueKey('server-region-option-west')),
      findsOneWidget,
    );
    await tester.tap(find.byKey(const ValueKey('server-region-option-east')));
    await tester.pumpAndSettle();

    expect(find.text('Choose server region'), findsNothing);
    expect(find.text('East (Asia)'), findsOneWidget);
    expect(settings.serverRegion, 'east');
    await tester.tap(find.text('Gold'));
    await tester.pumpAndSettle();

    expect(repository.lastGoldRegion, 'east');
    expect(find.text('Gold prices'), findsOneWidget);
    expect(find.text('Gold calculator'), findsOneWidget);
  });

  testWidgets(
    'Gold page shows market stats, conversion, and premium estimates',
    (WidgetTester tester) async {
      await tester.pumpWidget(
        AlbionKitApp(
          settings: settings,
          apiStatusLoader: _loadApiStatus,
          repository: repository,
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Gold'));
      await tester.pumpAndSettle();

      expect(find.text('Gold prices'), findsOneWidget);
      expect(find.text('LOW'), findsOneWidget);
      expect(find.text('1,000'), findsWidgets);
      expect(find.text('AVERAGE'), findsOneWidget);
      expect(find.text('1,050'), findsWidgets);
      expect(find.text('HIGH'), findsOneWidget);
      expect(find.text('1,100'), findsWidgets);
      expect(find.text('Gold calculator'), findsOneWidget);
      expect(find.text('Premium price estimate'), findsOneWidget);
      expect(find.text('30 days'), findsOneWidget);
      expect(find.text('90 days'), findsOneWidget);
      expect(find.text('180 days'), findsOneWidget);
      expect(find.text('4.13m silver'), findsOneWidget);
      final premiumEstimate = tester.widget<Text>(
        find.byKey(const ValueKey('premium-silver-estimate-30')),
      );
      expect(premiumEstimate.maxLines, 1);
      expect(premiumEstimate.softWrap, isFalse);
      expect(find.text('PRICE HISTORY · SILVER PER GOLD'), findsOneWidget);
      expect(find.byTooltip('Refresh gold prices'), findsNothing);
      expect(repository.lastGoldHistoryCount, 168);
      await tester.tap(find.text('1D'));
      await tester.pumpAndSettle();
      expect(repository.lastGoldHistoryCount, 24);
      await tester.tap(find.text('1W'));
      await tester.pumpAndSettle();

      await tester.ensureVisible(
        find.byKey(const ValueKey('gold-conversion-swap')),
      );
      await tester.pumpAndSettle();
      final silverField = tester.getTopLeft(
        find.byKey(const ValueKey('gold-conversion-SILVER')),
      );
      final swapButton = tester.getTopLeft(
        find.byKey(const ValueKey('gold-conversion-swap')),
      );
      final goldField = tester.getTopLeft(
        find.byKey(const ValueKey('gold-conversion-GOLD')),
      );
      expect(silverField.dy, lessThan(swapButton.dy));
      expect(swapButton.dy, lessThan(goldField.dy));
      await tester.tap(find.byKey(const ValueKey('gold-conversion-swap')));
      await tester.pumpAndSettle();
      expect(find.text('SILVER'), findsOneWidget);
      expect(find.text('GOLD'), findsOneWidget);
      expect(find.text('1,100'), findsWidgets);
      expect(
        tester
            .getTopLeft(find.byKey(const ValueKey('gold-conversion-GOLD')))
            .dy,
        lessThan(
          tester
              .getTopLeft(find.byKey(const ValueKey('gold-conversion-swap')))
              .dy,
        ),
      );
      expect(
        tester
            .getTopLeft(find.byKey(const ValueKey('gold-conversion-swap')))
            .dy,
        lessThan(
          tester
              .getTopLeft(find.byKey(const ValueKey('gold-conversion-SILVER')))
              .dy,
        ),
      );

      final scrollable = find.descendant(
        of: find.byKey(const ValueKey('gold-scroll-view')),
        matching: find.byType(Scrollable),
      );
      tester.state<ScrollableState>(scrollable.first).position.jumpTo(0);
      final requestsBeforeRefresh = repository.goldHistoryRequests;
      await tester.dragFrom(const Offset(400, 100), const Offset(0, 500));
      await tester.pumpAndSettle();
      expect(repository.goldHistoryRequests, requestsBeforeRefresh + 1);
    },
  );

  testWidgets('Gold page localizes currency labels and chart ranges', (
    WidgetTester tester,
  ) async {
    await settings.setLanguage('zh');
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('黄金'));
    await tester.pumpAndSettle();

    expect(find.text('1天'), findsOneWidget);
    expect(find.text('1周'), findsOneWidget);
    expect(find.text('1月'), findsOneWidget);
    expect(find.byKey(const ValueKey('gold-conversion-银币')), findsOneWidget);
    expect(find.byKey(const ValueKey('gold-conversion-黄金')), findsOneWidget);
    expect(find.text('4.13m 银币'), findsOneWidget);
    expect(find.text('3,750 金币'), findsOneWidget);
  });

  testWidgets('Flips navigation opens the full market opportunity list', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Flips'));
    await tester.pumpAndSettle();

    expect(find.text('Trending flips'), findsOneWidget);
    expect(find.text('No spreads found right now'), findsOneWidget);
    expect(find.byTooltip('Refresh market spreads'), findsNothing);
  });

  testWidgets('market opportunity notification opens the Flips destination', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();

    LocalNotificationService.notificationTap.value = 'flips';
    await tester.pumpAndSettle();

    expect(find.text('Trending flips'), findsOneWidget);
  });

  testWidgets('pending market notification opens Flips on cold start', (
    WidgetTester tester,
  ) async {
    LocalNotificationService.notificationTap.value = 'flips';

    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Trending flips'), findsOneWidget);
    expect(LocalNotificationService.notificationTap.value, isNull);
  });

  testWidgets('Flips shows item artwork, paginates, and pull refreshes', (
    WidgetTester tester,
  ) async {
    repository.marketFlips = List.generate(
      12,
      (index) => MarketFlip(
        itemId: 'T4_BAG_$index',
        buyCity: 'Bridgewatch',
        buyPrice: 100000,
        sellCity: 'Lymhurst',
        sellPrice: 150000,
        profit: 50000,
        margin: 50,
      ),
    );
    repository.itemNames = {
      'T4_BAG_0': "Adept's Bag",
      'T4_BAG_10': "Adept's Bag",
    };
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Flips'));
    await tester.pumpAndSettle();

    expect(find.text('MARKET INTELLIGENCE  •  WEST'), findsOneWidget);
    expect(find.text('Page 1 of 2'), findsOneWidget);
    expect(find.text("Adept's Bag"), findsOneWidget);
    expect(find.text('Bag 10'), findsNothing);
    expect(find.byIcon(LucideIcons.arrowRight), findsWidgets);
    final itemImage = tester.widget<Image>(
      find.byKey(const ValueKey('market-item-image-T4_BAG_0')),
    );
    expect(
      (itemImage.image as NetworkImage).url,
      'https://render.albiononline.com/v1/item/T4_BAG_0.png',
    );

    await tester.ensureVisible(find.byTooltip('Next page'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Next page'));
    await tester.pumpAndSettle();
    expect(find.text('Page 2 of 2'), findsOneWidget);
    expect(find.text("Adept's Bag"), findsOneWidget);
    expect(find.text('Bag 0'), findsNothing);

    final requestsBeforeRefresh = repository.marketFlipRequests;
    final flipsScrollable = find.descendant(
      of: find.byKey(const ValueKey('flips-scroll-view')),
      matching: find.byType(Scrollable),
    );
    tester.state<ScrollableState>(flipsScrollable.first).position.jumpTo(0);
    await tester.dragFrom(const Offset(400, 100), const Offset(0, 500));
    await tester.pumpAndSettle();
    expect(repository.marketFlipRequests, requestsBeforeRefresh + 1);
    expect(find.text('Page 1 of 2'), findsOneWidget);
  });

  testWidgets('Flips item names follow the selected app language', (
    WidgetTester tester,
  ) async {
    await settings.setLanguage('de');
    repository.marketFlips = [
      MarketFlip(
        itemId: 'T4_BAG',
        buyCity: 'Bridgewatch',
        buyPrice: 100000,
        sellCity: 'Lymhurst',
        sellPrice: 150000,
        profit: 50000,
        margin: 50,
      ),
    ];
    repository.localizedItemNames = {
      'de': {'T4_BAG': 'Adeptentasche'},
      'fr': {'T4_BAG': 'Sac d’adepte'},
    };
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Flips'));
    await tester.pumpAndSettle();

    expect(find.text('Adeptentasche'), findsOneWidget);
    await settings.setLanguage('fr');
    await tester.pumpAndSettle();
    expect(find.text('Sac d’adepte'), findsOneWidget);
  });

  testWidgets('item name shows a skeleton until translation is fetched', (
    WidgetTester tester,
  ) async {
    final nameCompleter = Completer<String?>();
    repository.localizedNameCompleter = nameCompleter;
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('de'),
        supportedLocales: const [Locale('de')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
        ],
        home: Scaffold(
          body: LocalizedItemName(
            repository: repository,
            itemId: 'T4_BAG',
            fallback: "Adept's Bag",
          ),
        ),
      ),
    );

    expect(
      find.byKey(const ValueKey('localized-item-name-skeleton')),
      findsOneWidget,
    );
    expect(find.text("Adept's Bag"), findsNothing);

    nameCompleter.complete('Adeptentasche');
    await tester.pumpAndSettle();

    expect(find.text('Adeptentasche'), findsOneWidget);
    expect(
      find.byKey(const ValueKey('localized-item-name-skeleton')),
      findsNothing,
    );
  });

  testWidgets('dashboard can retry a failed API status request', (
    WidgetTester tester,
  ) async {
    var attempts = 0;
    Future<AlbionKitApiStatus> loadStatus() {
      attempts++;
      if (attempts == 1) {
        return Future.error(Exception('Service unavailable'));
      }
      return _loadApiStatus();
    }

    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: loadStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();

    final dashboardScrollable = find.descendant(
      of: find.byKey(const ValueKey('home-scroll-view')),
      matching: find.byType(Scrollable),
    );
    await tester.scrollUntilVisible(
      find.text('API status unavailable'),
      200,
      scrollable: dashboardScrollable.first,
    );
    expect(find.text('API status unavailable'), findsOneWidget);
    await tester.ensureVisible(find.text('Try again'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Try again'));
    await tester.pumpAndSettle();

    expect(attempts, 2);
    await tester.scrollUntilVisible(
      find.textContaining('API v0.1.1'),
      200,
      scrollable: dashboardScrollable.first,
    );
    expect(find.textContaining('API v0.1.1'), findsOneWidget);
  });

  testWidgets('settings lets the user switch themes', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();

    expect(find.text('Smart alerts'), findsOneWidget);
    expect(find.text('Bandit assault'), findsOneWidget);
    await tester.tap(find.text('Dark'));
    await tester.pumpAndSettle();

    expect(settings.themeMode, ThemeMode.light);
    await tester.tap(find.byKey(const ValueKey('save-settings')));
    await tester.pumpAndSettle();
    expect(settings.themeMode, ThemeMode.dark);
  });

  testWidgets('settings language selector applies and saves immediately', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();

    expect(find.text('Language'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('language-selector')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('language-option-de')));
    await tester.pumpAndSettle();

    expect(settings.languageCode, 'de');
    expect(preferences.getString('settings.language'), 'de');
    expect(
      tester.widget<MaterialApp>(find.byType(MaterialApp)).locale,
      const Locale('de'),
    );
  });

  testWidgets('settings shows legal links and app version', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();

    final scrollable = find.byType(Scrollable).first;
    for (final label in [
      'Privacy Policy',
      'Terms of Service',
      'Cookie Policy',
      'AlbionKit website',
      'Version 1.0.0 (1)',
    ]) {
      await tester.scrollUntilVisible(
        find.text(label),
        180,
        scrollable: scrollable,
      );
      expect(find.text(label), findsOneWidget);
    }
  });

  testWidgets('settings can enable valuable market flip alerts', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.drag(
      find
          .descendant(
            of: find.byKey(const ValueKey('settings-list')),
            matching: find.byType(Scrollable),
          )
          .first,
      const Offset(0, -240),
    );
    await tester.pumpAndSettle();
    expect(
      find.text(
        'Checks for qualifying flips when you open or refresh the Flips list.',
      ),
      findsOneWidget,
    );

    for (final field in tester.widgetList<TextField>(find.byType(TextField))) {
      expect(field.autofocus, isFalse);
      expect(field.focusNode?.hasFocus ?? false, isFalse);
    }
    expect(find.text('Minimum flip profit'), findsNothing);
    await tester.tap(find.text('Valuable market flips'));
    await tester.pumpAndSettle();

    expect(settings.flipAlertsEnabled, isFalse);
    expect(find.text('Minimum flip profit'), findsOneWidget);
    expect(find.text('Save minimum flip profit'), findsNothing);
    final minimumProfitField = find.byWidgetPredicate(
      (widget) =>
          widget is TextField &&
          widget.decoration?.labelText == 'Minimum flip profit',
    );
    await tester.enterText(minimumProfitField, '0');
    for (final field in tester.widgetList<TextField>(find.byType(TextField))) {
      expect(field.autofocus, isFalse);
    }
    await tester.tap(find.byKey(const ValueKey('save-settings')));
    await tester.pumpAndSettle();
    expect(tester.testTextInput.isVisible, isFalse);
    expect(settings.flipAlertsEnabled, isTrue);
    expect(settings.flipMinimumProfit, 0);
  });

  testWidgets('unsaved settings prompt lets the user discard changes', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Dark'));
    await tester.pumpAndSettle();

    expect(settings.themeMode, ThemeMode.light);
    await tester.pageBack();
    await tester.pumpAndSettle();

    expect(
      find.byKey(const ValueKey('unsaved-settings-dialog')),
      findsOneWidget,
    );
    await tester.tap(find.text('Discard'));
    await tester.pumpAndSettle();

    expect(settings.themeMode, ThemeMode.light);
    expect(find.text('Home'), findsOneWidget);
  });

  testWidgets('unsaved settings prompt only offers discard or keep editing', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Dark'));
    await tester.pumpAndSettle();
    await tester.pageBack();
    await tester.pumpAndSettle();

    expect(
      find.byKey(const ValueKey('unsaved-settings-dialog')),
      findsOneWidget,
    );
    expect(find.text('Save changes'), findsNothing);
    await tester.tap(find.text('Keep editing'));
    await tester.pumpAndSettle();

    expect(settings.themeMode, ThemeMode.light);
    expect(find.text('Settings'), findsOneWidget);
    expect(find.byKey(const ValueKey('unsaved-settings-dialog')), findsNothing);
  });

  testWidgets('Tools lists calculators and opens the Farming page', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.tap(find.text('Tools'));
    await tester.pumpAndSettle();

    expect(find.text('Farming'), findsOneWidget);
    expect(find.text('Cooking'), findsOneWidget);
    expect(find.text('Animal breeding'), findsOneWidget);
    await tester.tap(find.text('Farming'));
    await tester.pumpAndSettle();

    expect(find.text('Farming profits'), findsOneWidget);
    expect(
      find.text('Compare crop and herb returns using live market prices.'),
      findsOneWidget,
    );
    final farmingScrollable = find.descendant(
      of: find.byKey(const ValueKey('farming-profit-scroll-view')),
      matching: find.byType(Scrollable),
    );
    await tester.scrollUntilVisible(
      find.text('Crop profits'),
      200,
      scrollable: farmingScrollable.first,
    );
    expect(find.text('Crop profits'), findsOneWidget);
    expect(find.text('Carrot'), findsOneWidget);
    await tester.drag(
      find.byKey(const ValueKey('farming-profit-scroll-view')),
      const Offset(0, 1200),
    );
    await tester.pumpAndSettle();
    expect(find.text('Herbs'), findsOneWidget);
    await tester.tap(find.text('Herbs'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('Herb profits'),
      200,
      scrollable: farmingScrollable.first,
    );
    expect(find.text('Herb profits'), findsOneWidget);
    expect(find.text('Agaric'), findsOneWidget);
  });

  testWidgets('Farming selectors and item details use bottom sheets', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        home: FarmingProfitScreen(region: 'west', repository: repository),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('farming-refresh-prices')), findsNothing);
    expect(
      find.descendant(
        of: find.byKey(const ValueKey('farming-city-Buy seeds from')),
        matching: find.byIcon(LucideIcons.mapPin),
      ),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: find.byKey(const ValueKey('farming-city-Sell produce to')),
        matching: find.byIcon(LucideIcons.mapPin),
      ),
      findsOneWidget,
    );
    final plotsField = find.byKey(const ValueKey('farming-input-plots'));
    final cyclesField = find.byKey(const ValueKey('farming-input-cycles'));
    final returnRateField = find.byKey(
      const ValueKey('farming-input-return-rate-%'),
    );
    expect(tester.widget<TextField>(plotsField).autofocus, isFalse);
    expect(tester.widget<TextField>(cyclesField).autofocus, isFalse);
    expect(tester.widget<TextField>(returnRateField).autofocus, isFalse);
    expect(
      tester.getSize(returnRateField).width,
      greaterThan(tester.getSize(plotsField).width),
    );
    await tester.tap(find.byKey(const ValueKey('farming-city-Buy seeds from')));
    await tester.pumpAndSettle();
    expect(find.text('Buy seeds from'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.tap(
      find.byKey(const ValueKey('farming-city-option-Caerleon')),
    );
    await tester.pumpAndSettle();
    expect(find.text('Caerleon'), findsOneWidget);

    final scrollable = find.descendant(
      of: find.byKey(const ValueKey('farming-profit-scroll-view')),
      matching: find.byType(Scrollable),
    );
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('farming-result-carrot')),
      180,
      scrollable: scrollable.first,
    );
    final summary = find.byKey(const ValueKey('farming-result-summary-carrot'));
    final resultCard = find
        .ancestor(of: summary, matching: find.byType(Card))
        .first;
    expect(
      tester.getRect(summary).right,
      lessThan(tester.getRect(resultCard).right - 20),
    );
    await tester.tap(find.byKey(const ValueKey('farming-result-carrot')));
    await tester.pumpAndSettle();

    expect(find.text('Seed price · Caerleon'), findsOneWidget);
    expect(find.text('Produce price · Martlock'), findsOneWidget);
    expect(find.text('Net profit per seed'), findsOneWidget);
    expect(find.text('Seed return rate'), findsOneWidget);
    expect(
      tester
          .getSize(find.byKey(const ValueKey('farming-item-details-sheet')))
          .height,
      lessThanOrEqualTo(800 * .78),
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('Tools no longer lists the generic Crafting calculator', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.tap(find.text('Tools'));
    await tester.pumpAndSettle();
    expect(find.text('Farming'), findsOneWidget);
    expect(find.text('Cooking'), findsOneWidget);
    expect(find.text('Animal breeding'), findsOneWidget);
    expect(find.text('Alchemy'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Chopped fish'),
      160,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Labourers'), findsOneWidget);
    expect(find.text('Chopped fish'), findsOneWidget);
    expect(find.text('Enchanting'), findsNothing);
    expect(find.text('Crafting'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('labourer types follow the selected app language', (
    WidgetTester tester,
  ) async {
    await settings.setLanguage('de');
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Tools'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('Arbeiter'),
      160,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Arbeiter'));
    await tester.pumpAndSettle();

    expect(find.text('Waffenschmied'), findsOneWidget);
    expect(find.text('Blacksmith'), findsNothing);

    await tester.tap(find.byKey(const ValueKey('labourer-type-picker')));
    await tester.pumpAndSettle();
    expect(find.text('Holzfäller'), findsOneWidget);
    expect(find.text('Lumberjack'), findsNothing);
  });

  testWidgets('Cooking tool opens recipes, sources and result details', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(360, 1500);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        home: CookingProfitScreen(region: 'west', repository: repository),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Select recipe'), findsOneWidget);
    await tester.tap(find.text('Select recipe'));
    await tester.pumpAndSettle();
    await tester.tap(
      find.byKey(const ValueKey('cooking-recipe-option-T4_MEAL_STEW')),
    );
    await tester.pumpAndSettle();

    expect(find.text('Profit results'), findsOneWidget);
    expect(find.text('Goat Stew'), findsNWidgets(2));
    expect(
      find.byKey(const ValueKey('cooking-result-T4_MEAL_STEW')),
      findsOneWidget,
    );
    await tester.tap(find.byKey(const ValueKey('cooking-advanced-settings')));
    await tester.pumpAndSettle();
    expect(find.text('Ingredient sourcing'), findsOneWidget);
    final meatSourceButton = find.byKey(
      const ValueKey('cooking-source-T4_MEAT'),
    );
    await tester.tap(meatSourceButton);
    await tester.pumpAndSettle();
    expect(find.text('Buy Raw Goat in'), findsOneWidget);
    await tester.tap(
      find.byKey(const ValueKey('cooking-city-option-Caerleon')),
    );
    await tester.pumpAndSettle();
    expect(find.text('Caerleon'), findsOneWidget);

    final enchantedSwitch = find.descendant(
      of: find.byKey(const ValueKey('cooking-enchanted')),
      matching: find.byType(Switch),
    );
    await tester.ensureVisible(enchantedSwitch);
    await tester.tap(enchantedSwitch);
    await tester.pumpAndSettle();
    expect(
      find.byKey(const ValueKey('cooking-result-T4_MEAL_STEW@1')),
      findsOneWidget,
    );
    await tester.ensureVisible(
      find.byKey(const ValueKey('cooking-result-T4_MEAL_STEW')),
    );
    await tester.tap(
      find.byKey(const ValueKey('cooking-result-T4_MEAL_STEW@1')),
    );
    await tester.pumpAndSettle();
    expect(find.text('Ingredients'), findsOneWidget);
    expect(find.text('Revenue after sale fees'), findsOneWidget);
    expect(find.text('Raw Goat'), findsNWidgets(2));
    expect(find.text('Basic Fish Sauce'), findsOneWidget);
    expect(find.text('0 silver'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Cooking detail sheet is height-limited and scrollable', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        home: CookingProfitScreen(region: 'west', repository: repository),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<TextField>(find.byKey(const ValueKey('cooking-quantity')))
          .autofocus,
      isFalse,
    );
    final recipeButton = find.text('Select recipe');
    await tester.ensureVisible(recipeButton);
    await tester.tap(recipeButton);
    await tester.pumpAndSettle();
    await tester.tap(
      find.byKey(const ValueKey('cooking-recipe-option-T4_MEAL_STEW')),
    );
    await tester.pumpAndSettle();

    final resultCard = find.byKey(
      const ValueKey('cooking-result-T4_MEAL_STEW'),
    );
    await tester.ensureVisible(resultCard);
    await tester.tap(resultCard);
    await tester.pumpAndSettle();
    expect(
      find.byKey(const ValueKey('cooking-item-details-sheet')),
      findsOneWidget,
    );
    expect(
      tester
          .getSize(find.byKey(const ValueKey('cooking-item-details-sheet')))
          .height,
      lessThanOrEqualTo(800 * .78),
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('Tools routes Cooking to the dedicated calculator', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.tap(find.text('Tools'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cooking'));
    await tester.pumpAndSettle();

    expect(find.text('Cooking profits'), findsOneWidget);
    expect(find.text('Profit calculator'), findsNothing);
    expect(find.text('Select recipe'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Tools routes animal breeding to its dedicated calculator', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.tap(find.text('Tools'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Animal breeding'));
    await tester.pumpAndSettle();

    expect(find.text('Animal breeding'), findsNWidgets(2));
    expect(
      find.byKey(const ValueKey('animal-activity-selector')),
      findsOneWidget,
    );
    final quantityField = find.byKey(const ValueKey('animal-quantity-input'));
    expect(quantityField, findsOneWidget);
    await tester.enterText(quantityField, '1000');
    expect(tester.widget<TextField>(quantityField).controller!.text, '999');
    expect(repository.lastAnimalActivity, 'breeding');
    await tester.tap(find.byKey(const ValueKey('animal-activity-products')));
    await tester.pumpAndSettle();
    expect(repository.lastAnimalActivity, 'products');
    await tester.tap(find.byKey(const ValueKey('animal-activity-butchering')));
    await tester.pumpAndSettle();
    expect(repository.lastAnimalActivity, 'butchering');
    expect(tester.takeException(), isNull);
  });

  testWidgets('Tools routes remaining profit tools to dedicated pages', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      AlbionKitApp(
        settings: settings,
        apiStatusLoader: _loadApiStatus,
        repository: repository,
      ),
    );
    await tester.tap(find.text('Tools'));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Alchemy'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Alchemy'));
    await tester.pumpAndSettle();

    expect(find.text('Alchemy profits'), findsNWidgets(2));
    expect(find.byKey(const ValueKey('alchemy-recipe-picker')), findsOneWidget);
    final advancedTrigger = find.byKey(
      const ValueKey('alchemy-advanced-settings'),
    );
    expect(find.text('Advanced settings'), findsOneWidget);
    await tester.ensureVisible(advancedTrigger);
    await tester.pumpAndSettle();
    await tester.tap(advancedTrigger);
    await tester.pumpAndSettle();
    expect(find.text('Hide advanced settings'), findsOneWidget);
    expect(find.byKey(const ValueKey('alchemy-return-rate')), findsOneWidget);
    await tester.ensureVisible(advancedTrigger);
    await tester.pumpAndSettle();
    await tester.tap(advancedTrigger);
    await tester.pumpAndSettle();
    expect(find.text('Advanced settings'), findsOneWidget);
    expect(find.byKey(const ValueKey('alchemy-return-rate')), findsNothing);
    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.text('Labourers'),
      160,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Labourers'));
    await tester.pumpAndSettle();
    expect(find.text('Labourer profits'), findsNWidgets(2));
    expect(find.byKey(const ValueKey('labourer-type-picker')), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Tools'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('Chopped fish'),
      160,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Chopped fish'));
    await tester.pumpAndSettle();
    expect(find.text('Chopped fish profits'), findsNWidgets(2));
    expect(find.byKey(const ValueKey('chopped-fish-target')), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
  });
}

class _TestRepository extends AlbionKitRepository {
  String? lastGoldRegion;
  int? lastGoldHistoryCount;
  int goldHistoryRequests = 0;
  List<MarketFlip> marketFlips = const [];
  int marketFlipRequests = 0;
  Map<String, String> itemNames = const {};
  Map<String, Map<String, String>> localizedItemNames = const {};
  Completer<String?>? localizedNameCompleter;
  String? lastFarmingProductType;
  String? lastCookingRecipeId;
  String? lastAnimalActivity;
  String? lastSpecializedProfitType;

  @override
  Future<List<MarketFlip>> getMarketFlips({
    required String region,
    int minProfit = 50000,
  }) async {
    marketFlipRequests++;
    return marketFlips;
  }

  @override
  Future<String?> getLocalizedItemName(
    String itemId, {
    required String languageCode,
  }) =>
      localizedNameCompleter?.future ??
      Future.value(
        localizedItemNames[languageCode]?[itemId] ?? itemNames[itemId],
      );

  @override
  Future<List<GoldPricePoint>> getGoldHistory({
    String region = 'west',
    int count = 168,
  }) async {
    goldHistoryRequests++;
    lastGoldRegion = region;
    lastGoldHistoryCount = count;
    return [
      GoldPricePoint(price: 1000, timestamp: DateTime.utc(2026, 10, 15)),
      GoldPricePoint(price: 1100, timestamp: DateTime.utc(2026, 10, 16)),
    ];
  }

  @override
  Future<List<FarmingProfitResult>> getFarmingProfits({
    required String region,
    required String productType,
    required String seedCity,
    required String produceCity,
    required int plots,
    required int cycles,
    required double customReturnRate,
    required bool premium,
    required bool useFocus,
  }) async {
    lastFarmingProductType = productType;
    return AlbionKitRepository.farmingProducts
        .where((product) => product.type == productType)
        .map(
          (product) => FarmingProfitResult(
            product: product,
            seedPrice: 100,
            seedVolume: 20,
            producePrice: 10,
            produceVolume: 30,
            expectedYield: premium ? product.baseYield * 2 : product.baseYield,
            effectiveSeedReturnRate: useFocus
                ? product.seedReturnRateWithFocus
                : 0,
            revenuePerSeed: 360,
            netProfitPerSeed: 260,
            totalProfit: 3120,
            roi: 260,
          ),
        )
        .toList();
  }

  @override
  Future<List<CookingProfitResult>> getCookingProfits({
    required String region,
    required String recipeId,
    required String sellCity,
    required Map<String, String> ingredientCities,
    required int quantity,
    required bool enchanted,
    required bool includeBuyTax,
    required bool includeSellTax,
    required bool sellOrder,
    required bool dailyBonus,
    required bool useFocus,
    required double? customReturnRate,
    required int usageFee,
  }) async {
    lastCookingRecipeId = recipeId;
    final recipe = AlbionKitRepository.cookingRecipes.firstWhere(
      (entry) => entry.id == recipeId,
    );
    final enchantments = enchanted ? [0, 1, 2, 3] : [0];
    return enchantments.map((enchantment) {
      final productId = enchantment == 0
          ? recipe.productId
          : '${recipe.productId}@$enchantment';
      final ingredients = recipe.ingredients
          .map(
            (ingredient) => CookingIngredientPrice(
              ingredient: ingredient,
              city: ingredientCities[ingredient.itemId] ?? 'Martlock',
              unitPrice: 100,
              quantity: ingredient.count * quantity / recipe.yield,
              totalCost: ingredient.count * quantity / recipe.yield * 100,
            ),
          )
          .toList();
      if (enchantment > 0) {
        ingredients.add(
          CookingIngredientPrice(
            ingredient: const CookingIngredient(
              itemId: 'T4_FISHSAUCE_LEVEL1',
              name: 'Basic Fish Sauce',
              count: 1,
            ),
            city: 'Lymhurst',
            unitPrice: 0,
            quantity: quantity.toDouble(),
            totalCost: 0,
          ),
        );
      }
      return CookingProfitResult(
        recipe: recipe,
        productId: productId,
        displayName: enchantment == 0
            ? recipe.name
            : '${recipe.name} (T${recipe.tier}.$enchantment)',
        enchantment: enchantment,
        quantity: quantity,
        productPrice: 200,
        productVolume: 30,
        ingredients: ingredients,
        sauceId: enchantment == 0 ? null : 'T4_FISHSAUCE_LEVEL1',
        sauceName: enchantment == 0 ? null : 'Basic Fish Sauce',
        saucePrice: 0,
        ingredientCost: 100,
        sauceCost: enchantment == 0 ? 0 : 25 * quantity,
        stationFee: 20,
        revenue: 1800,
        totalCost: 120,
        profit: 1680,
        roi: 1400,
        returnRate: 15.2,
        totalWeight: recipe.itemWeight * quantity,
        warning: enchantment == 0 ? null : 'No market price: Basic Fish Sauce',
      );
    }).toList();
  }

  @override
  Future<List<AnimalProfitResult>> getAnimalProfits({
    required String region,
    required String activity,
    required String buyCity,
    required String sellCity,
    required int quantity,
    required bool premium,
    required bool favoriteFood,
    required bool useFocus,
  }) async {
    lastAnimalActivity = activity;
    return const [];
  }

  @override
  Future<List<AlchemyProfitResult>> getAlchemyProfits({
    required String region,
    required String recipeId,
    required String sellCity,
    required Map<String, String> ingredientCities,
    required int quantity,
    required bool enchanted,
    required bool premium,
    required bool sellOrder,
    required bool includeSellFees,
    required double returnRate,
    required int usageFee,
  }) async {
    lastSpecializedProfitType = 'alchemy';
    return const [];
  }

  @override
  Future<List<LabourerProfitResult>> getLabourerProfits({
    required String region,
    required String labourerId,
    required String buyCity,
    required String sellCity,
    required int houseTier,
    required int journalCount,
    required bool premium,
    required bool sellOrder,
    required bool includeEnchantedReturns,
  }) async {
    lastSpecializedProfitType = 'labour';
    return const [];
  }

  @override
  Future<List<ChoppedFishProfitResult>> getChoppedFishProfits({
    required String region,
    required String buyCity,
    required String sellCity,
    required int targetChops,
    required bool premium,
    required bool buyOrder,
    required bool includeTax,
  }) async {
    lastSpecializedProfitType = 'chopped-fish';
    return const [];
  }

  @override
  @override
  Future<List<ItemSearchResult>> searchItems(
    String query, {
    int limit = 10,
  }) async => query.isEmpty
      ? const []
      : const [ItemSearchResult(id: 'T4_MAIN_AXE', name: 'Battleaxe', tier: 4)];
}

Future<AlbionKitApiStatus> _loadApiStatus() async {
  return const AlbionKitApiStatus(
    name: 'AlbionKit API',
    version: '0.1.1',
    status: 'ok',
    servers: [
      AlbionServerStatus(
        region: AlbionServerRegion.west,
        availability: AlbionServerAvailability.offline,
      ),
      AlbionServerStatus(
        region: AlbionServerRegion.east,
        availability: AlbionServerAvailability.online,
      ),
      AlbionServerStatus(
        region: AlbionServerRegion.europe,
        availability: AlbionServerAvailability.online,
      ),
    ],
  );
}

class _TestNotifications implements NotificationGateway {
  int goldAlertsShown = 0;

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
  }

  @override
  Future<void> showMarketFlipAlert({
    required List<MarketFlip> flips,
    required String region,
    required String languageCode,
  }) async {}

  @override
  Future<void> scheduleBanditReminder({
    required DateTime utcTime,
    required String region,
    required String languageCode,
  }) async {}

  @override
  Future<void> cancelBanditReminder() async {}
}
