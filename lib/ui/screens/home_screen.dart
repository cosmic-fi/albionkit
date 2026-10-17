import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models/albionkit_api_status.dart';
import '../../data/repositories/albionkit_repository.dart';
import '../../data/services/local_notification_service.dart';
import '../localization/app_text.dart';
import '../settings/app_settings_controller.dart';
import '../widgets/ak_widgets.dart';
import 'dashboard_screen.dart';
import 'faction_screen.dart';
import 'settings_screen.dart';
import 'tools_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.settings,
    this.apiStatusLoader,
    this.repository,
  });

  final AppSettingsController settings;
  final Future<AlbionKitApiStatus> Function()? apiStatusLoader;
  final AlbionKitRepository? repository;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  final Set<int> _visitedScreens = {0};
  String _region = 'west';
  late final AlbionKitRepository _repository =
      widget.repository ?? AlbionKitRepository();

  @override
  void initState() {
    super.initState();
    _region = widget.settings.serverRegion;
    LocalNotificationService.notificationTap.addListener(
      _handleNotificationTap,
    );
    _handleNotificationTap();
  }

  @override
  void dispose() {
    LocalNotificationService.notificationTap.removeListener(
      _handleNotificationTap,
    );
    super.dispose();
  }

  void _handleNotificationTap() {
    final destination = LocalNotificationService.notificationTap.value;
    final index = switch (destination) {
      'gold' => 1,
      'flips' => 2,
      'faction' => 4,
      _ => null,
    };
    if (index == null) return;
    LocalNotificationService.notificationTap.value = null;
    _navigateTo(index);
  }

  static const _destinations = [
    _Destination('Home', LucideIcons.house, LucideIcons.house),
    _Destination('Gold', LucideIcons.coins, LucideIcons.coins),
    _Destination(
      'Flips',
      LucideIcons.arrowLeftRight,
      LucideIcons.arrowLeftRight,
    ),
    _Destination(
      'Tools',
      LucideIcons.chartNoAxesCombined,
      LucideIcons.chartNoAxesCombined,
    ),
    _Destination('Faction', LucideIcons.swords, LucideIcons.swords),
  ];

  void _navigateTo(int index) {
    setState(() {
      _selectedIndex = index;
      _visitedScreens.add(index);
    });
  }

  Widget _screenFor(int index) {
    return switch (index) {
      0 => DashboardScreen(
        key: const ValueKey('dashboard'),
        onNavigate: _navigateTo,
        region: _region,
        onRegionChanged: _changeRegion,
        settings: widget.settings,
        repository: _repository,
        loadApiStatus: widget.apiStatusLoader ?? _repository.getApiStatus,
      ),
      1 => GoldScreen(
        key: const ValueKey('gold'),
        region: _region,
        settings: widget.settings,
        repository: _repository,
      ),
      2 => FlipsScreen(
        key: const ValueKey('flips'),
        region: _region,
        repository: _repository,
        settings: widget.settings,
      ),
      3 => ToolsScreen(
        key: const ValueKey('tools'),
        region: _region,
        repository: _repository,
      ),
      _ => FactionScreen(
        key: const ValueKey('faction'),
        region: _region,
        settings: widget.settings,
      ),
    };
  }

  Future<void> _changeRegion(String? region) async {
    if (region == null || region == _region) return;
    setState(() => _region = region);
    try {
      await widget.settings.setServerRegion(region);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              appText(
                context,
                'Could not update the bandit reminder: {error}',
              ).replaceAll('{error}', error.toString()),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 18,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/brand/albionkit-mark.png',
              width: 31,
              height: 31,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 10),
            const Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'Albion',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                  TextSpan(
                    text: 'Kit',
                    style: TextStyle(fontWeight: FontWeight.w300),
                  ),
                ],
              ),
              style: TextStyle(letterSpacing: -.4),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: appText(context, 'Settings'),
            onPressed: () {
              FocusManager.instance.primaryFocus?.unfocus();
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => SettingsScreen(
                    settings: widget.settings,
                    region: _region,
                  ),
                ),
              );
            },
            icon: const Icon(LucideIcons.settings),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final wide = constraints.maxWidth >= 760;
          final children = List<Widget>.generate(
            _destinations.length,
            (index) => _visitedScreens.contains(index)
                ? _screenFor(index)
                : const SizedBox.shrink(),
          );

          return Row(
            children: [
              if (wide)
                NavigationRail(
                  selectedIndex: _selectedIndex,
                  onDestinationSelected: _navigateTo,
                  labelType: NavigationRailLabelType.all,
                  backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                  indicatorColor: akOrange.withValues(alpha: .14),
                  destinations: [
                    for (final destination in _destinations)
                      NavigationRailDestination(
                        icon: Icon(destination.icon),
                        selectedIcon: Icon(
                          destination.selectedIcon,
                          color: akOrange,
                        ),
                        label: Text(
                          appNavigationText(context, destination.label),
                        ),
                      ),
                  ],
                ),
              Expanded(
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1040),
                    child: IndexedStack(
                      index: _selectedIndex,
                      children: children,
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: MediaQuery.sizeOf(context).width >= 760
          ? null
          : NavigationBar(
              selectedIndex: _selectedIndex,
              onDestinationSelected: _navigateTo,
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              height: 76,
              destinations: [
                for (final destination in _destinations)
                  NavigationDestination(
                    icon: Icon(destination.icon),
                    selectedIcon: Icon(destination.selectedIcon),
                    label: appNavigationText(context, destination.label),
                  ),
              ],
            ),
    );
  }
}

class _Destination {
  const _Destination(this.label, this.icon, this.selectedIcon);

  final String label;
  final IconData icon;
  final IconData selectedIcon;
}
