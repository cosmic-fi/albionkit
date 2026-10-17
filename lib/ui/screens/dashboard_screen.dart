import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/models/albionkit_api_status.dart';
import '../../data/repositories/albionkit_repository.dart';
import '../localization/app_text.dart';
import '../settings/app_settings_controller.dart';
import '../widgets/ak_widgets.dart';
import 'tools_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    required this.onNavigate,
    required this.region,
    required this.onRegionChanged,
    required this.settings,
    required this.repository,
    required this.loadApiStatus,
  });

  final ValueChanged<int> onNavigate;
  final String region;
  final ValueChanged<String?> onRegionChanged;
  final AppSettingsController settings;
  final AlbionKitRepository repository;
  final Future<AlbionKitApiStatus> Function() loadApiStatus;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final PageController _heroController = PageController();
  final GlobalKey<MarketFlipsPanelState> _flipsPanelKey =
      GlobalKey<MarketFlipsPanelState>();
  final GlobalKey<GoldPricePanelState> _goldPanelKey =
      GlobalKey<GoldPricePanelState>();
  late Future<AlbionKitApiStatus> _apiStatus;
  int _heroPage = 0;

  @override
  void initState() {
    super.initState();
    _apiStatus = widget.loadApiStatus();
  }

  Future<void> _refreshApiStatus() async {
    final status = widget.loadApiStatus();
    setState(() {
      _apiStatus = status;
    });
    await status;
  }

  Future<void> _refreshDashboard() async {
    final flipsPanel = _flipsPanelKey.currentState;
    final goldPanel = _goldPanelKey.currentState;
    await Future.wait([
      flipsPanel?.refresh() ??
          widget.repository.getMarketFlips(region: widget.region),
      goldPanel?.refresh() ??
          widget.repository.getGoldHistory(region: widget.region),
      _refreshApiStatus(),
    ]);
  }

  @override
  void dispose() {
    _heroController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: akOrange,
      onRefresh: _refreshDashboard,
      child: ListView(
        key: const ValueKey('home-scroll-view'),
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        children: [
          _HeroCarousel(
            controller: _heroController,
            currentPage: _heroPage,
            onPageChanged: (page) => setState(() => _heroPage = page),
            onNavigate: widget.onNavigate,
          ),
          const SizedBox(height: 18),
          _RegionSelector(
            region: widget.region,
            onChanged: widget.onRegionChanged,
          ),
          const SizedBox(height: 26),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      appText(context, 'Trending flips'),
                      style: Theme.of(context).textTheme.titleLarge
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      appText(
                        context,
                        'Profitable spreads · {region}',
                      ).replaceAll('{region}', widget.region.toUpperCase()),
                      style: TextStyle(color: akMutedOf(context), fontSize: 12),
                    ),
                  ],
                ),
              ),
              TextButton(
                key: const ValueKey('view-all-flips'),
                onPressed: () => widget.onNavigate(2),
                child: Text(appText(context, 'View all')),
              ),
            ],
          ),
          const SizedBox(height: 10),
          MarketFlipsPanel(
            key: _flipsPanelKey,
            repository: widget.repository,
            region: widget.region,
            settings: widget.settings,
            maxResults: 3,
            showHeading: false,
          ),
          const SizedBox(height: 26),
          GoldPricePanel(
            key: _goldPanelKey,
            repository: widget.repository,
            region: widget.region,
            settings: widget.settings,
          ),
          const Padding(
            padding: EdgeInsets.only(top: 18, bottom: 18),
            child: Divider(height: 1),
          ),
          _ServerStatusPanel(status: _apiStatus),
          const SizedBox(height: 12),
          _ApiStatusPanel(status: _apiStatus, onRetry: _refreshApiStatus),
        ],
      ),
    );
  }
}

class _HeroCarousel extends StatefulWidget {
  const _HeroCarousel({
    required this.controller,
    required this.currentPage,
    required this.onPageChanged,
    required this.onNavigate,
  });

  final PageController controller;
  final int currentPage;
  final ValueChanged<int> onPageChanged;
  final ValueChanged<int> onNavigate;

  @override
  State<_HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<_HeroCarousel>
    with WidgetsBindingObserver {
  Timer? _autoAdvanceTimer;

  static const _slides = [
    _HeroSlide(
      title: 'Find your next\nprofitable trade.',
      subtitle: 'Compare prices across cities to spot good trades.',
      action: 'Explore flips',
      icon: LucideIcons.arrowLeftRight,
      destination: 2,
      accent: Color(0xFFE5A34C),
    ),
    _HeroSlide(
      title: 'Follow the\nsilver swings.',
      subtitle: 'Track gold prices and see what your silver is worth.',
      action: 'Check gold',
      icon: LucideIcons.coins,
      destination: 1,
      accent: Color(0xFF75C5A2),
    ),
    _HeroSlide(
      title: 'Time your next\nfaction push',
      subtitle: 'Check when the next bandit window is expected.',
      action: 'View faction tracker',
      icon: LucideIcons.swords,
      destination: 4,
      accent: Color(0xFF9EB9E8),
    ),
    _HeroSlide(
      title: 'Join us on\nDiscord',
      subtitle:
          'Connect with Albion Online players and keep up with AlbionKit.',
      action: 'Join our Discord',
      icon: LucideIcons.messageCircle,
      externalUrl: 'https://discord.gg/92GbV3QVs3',
      externalLinkDescription: 'the Discord invite',
      accent: Color(0xFF9C8CE8),
    ),
    _HeroSlide(
      title: 'Support\nAlbionKit',
      subtitle: 'If AlbionKit is useful, your support helps keep it free and ad-free.',
      action: 'Donate to AlbionKit',
      icon: LucideIcons.heart,
      externalUrl: 'https://www.buymeacoffee.com/cosmic_fi',
      externalLinkDescription: 'the donation page',
      accent: Color(0xFFE88E9D),
    ),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _startAutoAdvance();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startAutoAdvance();
    } else {
      _autoAdvanceTimer?.cancel();
      _autoAdvanceTimer = null;
    }
  }

  void _startAutoAdvance() {
    _autoAdvanceTimer?.cancel();
    _autoAdvanceTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (!mounted || !widget.controller.hasClients) return;
      final page = widget.controller.page?.round() ?? widget.currentPage;
      final nextPage = (page + 1) % _slides.length;
      widget.controller.animateToPage(
        nextPage,
        duration: const Duration(milliseconds: 550),
        curve: Curves.easeInOut,
      );
    });
  }

  void _activateSlide(_HeroSlide slide) {
    if (slide.destination case final destination?) {
      widget.onNavigate(destination);
    } else if (slide.externalUrl case final url?) {
      unawaited(
        _openExternalLink(
          url,
          appText(context, slide.externalLinkDescription ?? 'the link'),
        ),
      );
    }
  }

  Future<void> _openExternalLink(String url, String linkDescription) async {
    try {
      final opened = await launchUrl(
        Uri.parse(url),
        mode: LaunchMode.externalApplication,
      );
      if (!opened && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              appText(
                context,
                'Could not open {linkDescription}.',
              ).replaceAll('{linkDescription}', linkDescription),
            ),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              appText(context, 'Could not open {linkDescription}: {error}')
                  .replaceAll('{linkDescription}', linkDescription)
                  .replaceAll('{error}', error.toString()),
            ),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _autoAdvanceTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 230,
          child: PageView.builder(
            key: const ValueKey('home-hero-carousel'),
            controller: widget.controller,
            itemCount: _slides.length,
            onPageChanged: widget.onPageChanged,
            itemBuilder: (context, index) => _HeroBanner(
              slide: _slides[index],
              onTap: () => _activateSlide(_slides[index]),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(_slides.length, (index) {
            final selected = index == widget.currentPage;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Semantics(
                button: true,
                selected: selected,
                label: appText(context, 'Show feature {index} of {total}')
                    .replaceAll('{index}', (index + 1).toString())
                    .replaceAll('{total}', _slides.length.toString()),
                child: GestureDetector(
                  key: ValueKey('hero-page-indicator-$index'),
                  onTap: () => widget.controller.animateToPage(
                    index,
                    duration: const Duration(milliseconds: 280),
                    curve: Curves.easeOut,
                  ),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: selected ? 22 : 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: selected
                          ? akOrange
                          : akMutedOf(context).withValues(alpha: .28),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}

class _HeroSlide {
  const _HeroSlide({
    required this.title,
    required this.subtitle,
    required this.action,
    required this.icon,
    this.destination,
    this.externalUrl,
    this.externalLinkDescription,
    required this.accent,
  });

  final String title;
  final String subtitle;
  final String action;
  final IconData icon;
  final int? destination;
  final String? externalUrl;
  final String? externalLinkDescription;
  final Color accent;
}

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({required this.slide, required this.onTap});

  final _HeroSlide slide;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 1),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24),
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF302A22), Color(0xFF191919)],
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(23),
              child: Stack(
                children: [
                  Positioned(
                    right: -14,
                    top: 8,
                    child: Icon(
                      slide.icon,
                      size: 190,
                      color: slide.accent.withValues(alpha: .1),
                    ),
                  ),
                  Positioned(
                    right: 25,
                    bottom: -76,
                    child: Container(
                      width: 190,
                      height: 190,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: slide.accent.withValues(alpha: .055),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 14, 20, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          appText(context, slide.title),
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(
                                color: Colors.white,
                                fontSize: 26,
                                height: 1.02,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -.8,
                              ),
                        ),
                        const SizedBox(height: 4),
                        ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 320),
                          child: Text(
                            appText(context, slide.subtitle),
                            style: const TextStyle(
                              color: Color(0xFFD0CDC7),
                              fontSize: 12,
                              height: 1.35,
                            ),
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: onTap,
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 13,
                              vertical: 10,
                            ),
                            backgroundColor: Colors.white.withValues(alpha: .1),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                appText(context, slide.action),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 9),
                              Icon(
                                slide.externalUrl == null
                                    ? LucideIcons.arrowRight
                                    : LucideIcons.externalLink,
                                size: 16,
                                color: slide.accent,
                              ),
                            ],
                          ),
                        ),
                      ],
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

class _RegionSelector extends StatelessWidget {
  const _RegionSelector({required this.region, required this.onChanged});

  static const _regions = ['west', 'east', 'europe'];

  final String region;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return AkPanel(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: const ValueKey('server-region-selector'),
          borderRadius: BorderRadius.circular(14),
          onTap: () => _showRegionPicker(context),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: akOrange.withValues(alpha: .12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(LucideIcons.globe2, color: akOrange),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      appText(context, 'SERVER REGION'),
                      style: TextStyle(
                        color: akMutedOf(context),
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: .8,
                      ),
                    ),
                    Text(
                      _regionName(region),
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                LucideIcons.chevronRight,
                color: akMutedOf(context),
                size: 18,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showRegionPicker(BuildContext context) async {
    final selectedRegion = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                appText(context, 'Choose server region'),
                style: Theme.of(context).textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Text(
                appText(
                  context,
                  'This region will be used across your Albion tools.',
                ),
                style: TextStyle(color: akMutedOf(context)),
              ),
              const SizedBox(height: 14),
              ..._regions.map((option) {
                final selected = option == region;
                return ListTile(
                  key: ValueKey('server-region-option-$option'),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                  leading: Icon(
                    LucideIcons.globe2,
                    color: selected ? akOrange : akMutedOf(context),
                  ),
                  title: Text(_regionName(option)),
                  trailing: selected
                      ? const Icon(LucideIcons.check, color: akOrange)
                      : null,
                  onTap: () => Navigator.of(context).pop(option),
                );
              }),
            ],
          ),
        ),
      ),
    );
    if (selectedRegion != null && selectedRegion != region) {
      onChanged(selectedRegion);
    }
  }

  String _regionName(String value) => albionServerRegionDisplayName(value);
}

class _ServerStatusPanel extends StatelessWidget {
  const _ServerStatusPanel({required this.status});

  final Future<AlbionKitApiStatus> status;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AlbionKitApiStatus>(
      future: status,
      builder: (context, snapshot) {
        if (snapshot.hasError) return const SizedBox.shrink();
        if (!snapshot.hasData) {
          return AkPanel(
            child: Row(
              children: [
                SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Text(appText(context, 'Checking game servers…')),
                ),
              ],
            ),
          );
        }
        return AkPanel(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.server, color: akOrange, size: 18),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      appText(context, 'Albion servers'),
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                  Text(
                    appText(context, 'LIVE STATUS'),
                    style: TextStyle(
                      color: akMutedOf(context),
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: .7,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ...snapshot.data!.servers.map((server) {
                final availability = server.availability;
                final color = availability == AlbionServerAvailability.online
                    ? akGreen
                    : availability == AlbionServerAvailability.maintenance
                    ? akOrange
                    : akRed;
                final regionName = server.region.name;
                final availabilityName = availability.name;
                return Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          albionServerRegionDisplayName(regionName),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 7),
                      Text(
                        availabilityName[0].toUpperCase() +
                            availabilityName.substring(1),
                        style: TextStyle(
                          color: color,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }
}

class _ApiStatusPanel extends StatelessWidget {
  const _ApiStatusPanel({required this.status, required this.onRetry});

  final Future<AlbionKitApiStatus> status;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AlbionKitApiStatus>(
      future: status,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return AkMessagePanel(
            title: appText(context, 'API status unavailable'),
            message: snapshot.error.toString(),
            isError: true,
            onRetry: onRetry,
          );
        }
        if (!snapshot.hasData) {
          return AkPanel(
            child: Row(
              children: [
                SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Text(appText(context, 'Checking AlbionKit API…')),
                ),
              ],
            ),
          );
        }

        final api = snapshot.data!;
        final apiOnline = api.status == 'ok';
        return AkPanel(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              const Icon(LucideIcons.cloud, color: akOrange, size: 21),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      api.name,
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      appText(context, 'API v{version}  ·  {status}')
                          .replaceAll('{version}', api.version)
                          .replaceAll(
                            '{status}',
                            apiOnline
                                ? appText(context, 'Online')
                                : appText(context, 'Offline'),
                          ),
                      style: TextStyle(
                        color: apiOnline ? akGreen : akRed,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
