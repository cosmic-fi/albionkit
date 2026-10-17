import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models/albionkit_models.dart';
import '../../data/repositories/albionkit_repository.dart';
import '../localization/app_text.dart';
import '../settings/app_settings_controller.dart';
import '../widgets/ak_widgets.dart';
import '../widgets/localized_item_name.dart';
import 'animal_breeding_screen.dart';
import 'alchemy_screen.dart';
import 'chopped_fish_screen.dart';
import 'cooking_screen.dart';
import 'farming_screen.dart';
import 'labourer_screen.dart';

class ToolsScreen extends StatefulWidget {
  const ToolsScreen({
    super.key,
    required this.region,
    required this.repository,
  });

  final String region;
  final AlbionKitRepository repository;

  @override
  State<ToolsScreen> createState() => _ToolsScreenState();
}

class _ToolsScreenState extends State<ToolsScreen> {
  static const _profitTools = [
    (
      title: 'Farming',
      type: 'farming',
      subtitle: 'Compare crop and herb returns across cities.',
      icon: LucideIcons.wheat,
    ),
    (
      title: 'Cooking',
      type: 'cooking',
      subtitle: 'Compare meal crafting costs with market prices.',
      icon: LucideIcons.cookingPot,
    ),
    (
      title: 'Animal breeding',
      type: 'animal',
      subtitle: 'Compare animal costs, products, and market prices.',
      icon: LucideIcons.pawPrint,
    ),
    (
      title: 'Alchemy',
      type: 'alchemy',
      subtitle: 'Compare potion costs with market prices.',
      icon: LucideIcons.flaskConical,
    ),
    (
      title: 'Labourers',
      type: 'labour',
      subtitle: 'Compare journal costs with laborer returns.',
      icon: LucideIcons.hammer,
    ),
    (
      title: 'Chopped fish',
      type: 'chopped-fish',
      subtitle: 'Compare fish prices with chopped-fish returns.',
      icon: LucideIcons.fish,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
      children: [
        AkPageHeading(
          eyebrow: appText(context, 'TOOLS'),
          title: appText(context, 'Plan your next craft.'),
          subtitle: appText(
            context,
            'Estimate costs, returns and focus efficiency before you commit.',
          ),
        ),
        const SizedBox(height: 24),
        for (final tool in _profitTools) ...[
          _EconomyToolCard(
            icon: tool.icon,
            title: tool.title,
            subtitle: tool.subtitle,
            detail: appText(context, 'Market prices · profit · ROI'),
            onTap: () {
              if (tool.type == 'farming') {
                _openFarming();
              } else if (tool.type == 'cooking') {
                _openCooking();
              } else if (tool.type == 'animal') {
                _openAnimalBreeding();
              } else if (tool.type == 'alchemy') {
                _openAlchemy();
              } else if (tool.type == 'labour') {
                _openLabourers();
              } else if (tool.type == 'chopped-fish') {
                _openChoppedFish();
              }
            },
          ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }

  void _openFarming() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => FarmingProfitScreen(
          region: widget.region,
          repository: widget.repository,
        ),
      ),
    );
  }

  void _openCooking() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => CookingProfitScreen(
          region: widget.region,
          repository: widget.repository,
        ),
      ),
    );
  }

  void _openAnimalBreeding() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => AnimalBreedingProfitScreen(
          region: widget.region,
          repository: widget.repository,
        ),
      ),
    );
  }

  void _openAlchemy() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => AlchemyProfitScreen(
          region: widget.region,
          repository: widget.repository,
        ),
      ),
    );
  }

  void _openLabourers() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => LabourerProfitScreen(
          region: widget.region,
          repository: widget.repository,
        ),
      ),
    );
  }

  void _openChoppedFish() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ChoppedFishProfitScreen(
          region: widget.region,
          repository: widget.repository,
        ),
      ),
    );
  }
}

class GoldScreen extends StatefulWidget {
  const GoldScreen({
    super.key,
    required this.region,
    required this.settings,
    required this.repository,
  });

  final String region;
  final AppSettingsController settings;
  final AlbionKitRepository repository;

  @override
  State<GoldScreen> createState() => _GoldScreenState();
}

class _GoldScreenState extends State<GoldScreen> {
  final GlobalKey<GoldPricePanelState> _goldPanelKey =
      GlobalKey<GoldPricePanelState>();

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: akOrange,
      onRefresh: () => _goldPanelKey.currentState!.refresh(),
      child: ListView(
        key: const ValueKey('gold-scroll-view'),
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        children: [
          _GoldHero(region: widget.region),
          const SizedBox(height: 20),
          GoldPricePanel(
            key: _goldPanelKey,
            repository: widget.repository,
            region: widget.region,
            settings: widget.settings,
            showCalculator: true,
          ),
        ],
      ),
    );
  }
}

class _GoldHero extends StatelessWidget {
  const _GoldHero({required this.region});

  final String region;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      child: SizedBox(
        height: 230,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset('assets/images/market-bg.jpg', fit: BoxFit.cover),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    colors.surface.withValues(alpha: .32),
                    colors.surface.withValues(alpha: .65),
                    colors.surface.withValues(alpha: 1),
                  ],
                  stops: const [0, .42, 1],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(22),
              child: Align(
                alignment: Alignment.bottomLeft,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      appText(
                        context,
                        'GOLD MARKET  •  {region}',
                      ).replaceAll('{region}', region.toUpperCase()),
                      style: TextStyle(
                        color: colors.onSurface,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      appText(context, 'Gold prices'),
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            color: colors.onSurface,
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -.8,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      appText(
                        context,
                        'Track the market, convert silver and estimate premium.',
                      ),
                      style: TextStyle(
                        color: colors.onSurface.withValues(alpha: .8),
                        fontSize: 13,
                      ),
                    ),
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

class FlipsScreen extends StatefulWidget {
  const FlipsScreen({
    super.key,
    required this.region,
    required this.repository,
    required this.settings,
  });

  final String region;
  final AlbionKitRepository repository;
  final AppSettingsController settings;

  @override
  State<FlipsScreen> createState() => _FlipsScreenState();
}

class _FlipsScreenState extends State<FlipsScreen> {
  final GlobalKey<MarketFlipsPanelState> _flipsPanelKey =
      GlobalKey<MarketFlipsPanelState>();

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: akOrange,
      onRefresh: () => _flipsPanelKey.currentState!.refresh(),
      child: ListView(
        key: const ValueKey('flips-scroll-view'),
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        children: [
          _FlipsHero(region: widget.region),
          const SizedBox(height: 20),
          MarketFlipsPanel(
            key: _flipsPanelKey,
            repository: widget.repository,
            region: widget.region,
            settings: widget.settings,
          ),
        ],
      ),
    );
  }
}

class _FlipsHero extends StatelessWidget {
  const _FlipsHero({required this.region});

  final String region;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      child: SizedBox(
        height: 230,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset('assets/images/market-bg.jpg', fit: BoxFit.cover),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    colors.surface.withValues(alpha: .32),
                    colors.surface.withValues(alpha: .65),
                    colors.surface.withValues(alpha: 1),
                  ],
                  stops: const [0, .42, 1],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(22),
              child: Align(
                alignment: Alignment.bottomLeft,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      appText(
                        context,
                        'MARKET INTELLIGENCE  •  {region}',
                      ).replaceAll('{region}', region.toUpperCase()),
                      style: TextStyle(
                        color: colors.onSurface,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      appText(context, 'Trending flips'),
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            color: colors.onSurface,
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -.8,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      appText(
                        context,
                        'Compare market prices and find your next opportunity.',
                      ),
                      style: TextStyle(
                        color: colors.onSurface.withValues(alpha: .8),
                        fontSize: 13,
                      ),
                    ),
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

class _EconomyToolCard extends StatelessWidget {
  const _EconomyToolCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.detail,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String detail;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: AkPanel(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: akOrange.withValues(alpha: .12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: akOrange),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      appText(context, title),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      appText(context, subtitle),
                      style: TextStyle(
                        color: akMutedOf(context),
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      detail,
                      style: const TextStyle(
                        color: akOrange,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                LucideIcons.chevronRight,
                size: 16,
                color: akMutedOf(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class MarketFlipsPanel extends StatefulWidget {
  const MarketFlipsPanel({
    super.key,
    required this.repository,
    required this.region,
    this.settings,
    this.maxResults = 10,
    this.showHeading = true,
  });

  final AlbionKitRepository repository;
  final String region;
  final AppSettingsController? settings;
  final int maxResults;
  final bool showHeading;

  @override
  MarketFlipsPanelState createState() => MarketFlipsPanelState();
}

class MarketFlipsPanelState extends State<MarketFlipsPanel> {
  bool _loading = true;
  String? _error;
  int _pageIndex = 0;
  List<MarketFlip> _flips = const [];

  Future<void> refresh() => _load();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant MarketFlipsPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.region != widget.region) {
      _pageIndex = 0;
      _load();
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final flips = await widget.repository.getMarketFlips(
        region: widget.region,
        minProfit: widget.settings?.flipAlertsEnabled == true
            ? widget.settings!.flipMinimumProfit
            : 50000,
      );
      if (mounted) {
        setState(() {
          _flips = flips;
          _pageIndex = 0;
        });
        final settings = widget.settings;
        if (settings != null) {
          try {
            await settings.checkMarketFlips(
              flips: flips,
              region: widget.region,
            );
          } catch (error) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    appText(
                      context,
                      'Could not deliver flip alert: {error}',
                    ).replaceAll('{error}', error.toString()),
                  ),
                ),
              );
            }
          }
        }
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pageCount = (_flips.length / widget.maxResults).ceil();
    final start = _pageIndex * widget.maxResults;
    final pageFlips = _flips.skip(start).take(widget.maxResults);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.showHeading)
          AkSectionTitle(appText(context, 'Best market spreads')),
        if (widget.showHeading) const SizedBox(height: 6),
        if (widget.showHeading) ...[
          Text(
            appText(context, 'Regional opportunities'),
            style: TextStyle(color: akMutedOf(context), fontSize: 12),
          ),
          const SizedBox(height: 14),
        ],
        if (_loading && _flips.isEmpty)
          Padding(
            padding: const EdgeInsets.all(36),
            child: const Center(child: CircularProgressIndicator()),
          )
        else if (_error != null)
          AkMessagePanel(
            title: appText(context, 'Market data unavailable'),
            message: _error!,
            isError: true,
            onRetry: _load,
          )
        else if (_flips.isEmpty)
          AkMessagePanel(
            title: appText(context, 'No spreads found right now'),
            message: appText(
              context,
              'Try again later; the market scanner only lists spreads above its minimum thresholds.',
            ),
            icon: LucideIcons.chartNoAxesCombined,
          )
        else ...[
          ...pageFlips.map(
            (flip) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: AkPanel(
                padding: const EdgeInsets.all(15),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _MarketItemIcon(itemId: flip.itemId),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _MarketFlipName(
                            repository: widget.repository,
                            itemId: flip.itemId,
                            itemName: flip.itemName?.isNotEmpty == true
                                ? flip.itemName
                                : null,
                          ),
                        ),
                        AkTag(
                          '+${flip.margin.toStringAsFixed(1)}%',
                          color: akGreen,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Text(
                          flip.buyCity,
                          style: TextStyle(
                            color: akMutedOf(context),
                            fontSize: 12,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 7),
                          child: Icon(
                            LucideIcons.arrowRight,
                            color: akMutedOf(context),
                            size: 14,
                          ),
                        ),
                        Expanded(
                          child: Text(
                            flip.sellCity,
                            style: TextStyle(
                              color: akMutedOf(context),
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: _PriceLabel(
                            label: appText(context, 'BUY'),
                            price: flip.buyPrice,
                          ),
                        ),
                        Expanded(
                          child: _PriceLabel(
                            label: appText(context, 'SELL'),
                            price: flip.sellPrice,
                          ),
                        ),
                        Expanded(
                          child: _PriceLabel(
                            label: appText(context, 'NET PROFIT'),
                            price: flip.profit,
                            accent: akGreen,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (widget.showHeading && pageCount > 1) ...[
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  tooltip: appText(context, 'Previous page'),
                  onPressed: _pageIndex == 0
                      ? null
                      : () => setState(() => _pageIndex--),
                  icon: const Icon(LucideIcons.chevronLeft),
                ),
                Text(
                  appText(context, 'Page {current} of {total}')
                      .replaceAll('{current}', (_pageIndex + 1).toString())
                      .replaceAll('{total}', pageCount.toString()),
                  style: TextStyle(
                    color: akMutedOf(context),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                IconButton(
                  tooltip: appText(context, 'Next page'),
                  onPressed: _pageIndex >= pageCount - 1
                      ? null
                      : () => setState(() => _pageIndex++),
                  icon: const Icon(LucideIcons.chevronRight),
                ),
              ],
            ),
          ],
        ],
      ],
    );
  }
}

class _MarketFlipName extends StatelessWidget {
  const _MarketFlipName({
    required this.repository,
    required this.itemId,
    required this.itemName,
  });

  final AlbionKitRepository repository;
  final String itemId;
  final String? itemName;

  @override
  Widget build(BuildContext context) {
    return LocalizedItemName(
      repository: repository,
      itemId: itemId,
      fallback: itemName?.isNotEmpty == true
          ? itemName!
          : _prettyItemName(itemId),
      style: const TextStyle(fontWeight: FontWeight.w800),
    );
  }
}

class _MarketItemIcon extends StatelessWidget {
  const _MarketItemIcon({required this.itemId});

  final String itemId;

  @override
  Widget build(BuildContext context) {
    final iconUri = Uri.https(
      'render.albiononline.com',
      '/v1/item/${Uri.encodeComponent(itemId)}.png',
    );
    return SizedBox(
      width: 52,
      height: 52,
      child: Image.network(
        iconUri.toString(),
        key: ValueKey('market-item-image-$itemId'),
        width: 52,
        height: 52,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) =>
            const Icon(LucideIcons.package, color: akOrange, size: 22),
      ),
    );
  }
}

class _PriceLabel extends StatelessWidget {
  const _PriceLabel({required this.label, required this.price, this.accent});

  final String label;
  final int price;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: akMutedOf(context),
            fontSize: 9,
            letterSpacing: 0.7,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          formatSilver(price),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: accent,
          ),
        ),
      ],
    );
  }
}

class GoldPricePanel extends StatefulWidget {
  const GoldPricePanel({
    super.key,
    required this.repository,
    required this.region,
    required this.settings,
    this.showCalculator = false,
  });

  final AlbionKitRepository repository;
  final String region;
  final AppSettingsController settings;
  final bool showCalculator;

  @override
  GoldPricePanelState createState() => GoldPricePanelState();
}

class GoldPricePanelState extends State<GoldPricePanel> {
  bool _loading = true;
  String? _error;
  String _range = '1w';
  List<GoldPricePoint> _history = const [];

  int get _count => switch (_range) {
    '1d' => 24,
    '1m' => 720,
    _ => 168,
  };

  Future<void> refresh() => _load();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant GoldPricePanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.region != widget.region) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    late final List<GoldPricePoint> points;
    try {
      points = await widget.repository.getGoldHistory(
        region: widget.region,
        count: _count,
      );
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString();
          _loading = false;
        });
      }
      return;
    }

    if (!mounted) return;
    setState(() {
      _history = points;
      _loading = false;
    });
    if (points.isNotEmpty) {
      try {
        await widget.settings.checkGoldPrice(
          price: points.last.price,
          region: widget.region,
        );
      } catch (error) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                appText(
                  context,
                  'Could not deliver gold alert: {error}',
                ).replaceAll('{error}', error.toString()),
              ),
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final current = _history.isEmpty ? 0 : _history.last.price;
    final previous = _history.length < 2 ? current : _history.first.price;
    final change = current - previous;
    final changePercent = previous == 0 ? 0.0 : (change / previous) * 100;
    final lowest = _history.isEmpty
        ? 0
        : _history.map((point) => point.price).reduce((a, b) => a < b ? a : b);
    final highest = _history.isEmpty
        ? 0
        : _history.map((point) => point.price).reduce((a, b) => a > b ? a : b);
    final average = _history.isEmpty
        ? 0
        : (_history.fold<int>(0, (sum, point) => sum + point.price) /
                  _history.length)
              .round();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AkSectionTitle(appText(context, 'Gold price')),
        const SizedBox(height: 14),
        if (_loading)
          const Padding(
            padding: EdgeInsets.all(36),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_error != null)
          AkMessagePanel(
            title: appText(context, 'Could not load gold data'),
            message: _error!,
            isError: true,
            onRetry: _load,
          )
        else if (_history.isEmpty)
          AkMessagePanel(
            title: appText(context, 'No gold history available'),
            message: appText(
              context,
              'The Albion Online Data Project returned no price history for this region.',
            ),
            icon: LucideIcons.chartLine,
          )
        else ...[
          AkPanel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  appText(
                    context,
                    'CURRENT PRICE · {region}',
                  ).replaceAll('{region}', widget.region.toUpperCase()),
                  style: TextStyle(
                    color: akMutedOf(context),
                    fontSize: 11,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      formatSilver(current),
                      style: const TextStyle(
                        color: akOrange,
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        height: 1,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Padding(
                      padding: EdgeInsets.only(bottom: 3),
                      child: Text(
                        appText(context, 'silver / gold'),
                        style: TextStyle(color: akMutedOf(context)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Icon(
                      change > 0
                          ? LucideIcons.trendingUp
                          : change < 0
                          ? LucideIcons.trendingDown
                          : LucideIcons.minus,
                      color: change > 0
                          ? akGreen
                          : change < 0
                          ? akRed
                          : akMutedOf(context),
                      size: 18,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      '${change > 0 ? '+' : ''}${formatSilver(change)}  (${changePercent.toStringAsFixed(2)}%)',
                      style: TextStyle(
                        color: change > 0
                            ? akGreen
                            : change < 0
                            ? akRed
                            : akMutedOf(context),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 14),
                  child: Divider(height: 1),
                ),
                _GoldMarketStats(
                  lowest: lowest,
                  average: average,
                  highest: highest,
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 14),
                  child: Divider(height: 1),
                ),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final range in ['1d', '1w', '1m'])
                      ChoiceChip(
                        label: Text(appText(context, range).toUpperCase()),
                        selected: _range == range,
                        onSelected: (_) {
                          setState(() => _range = range);
                          _load();
                        },
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  appText(context, 'PRICE HISTORY · SILVER PER GOLD'),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: .7,
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 164,
                  width: double.infinity,
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: CustomPaint(
                          key: const ValueKey('gold-price-chart'),
                          painter: _PriceChartPainter(
                            values: _history
                                .map((point) => point.price.toDouble())
                                .toList(),
                            lineColor: akOrange,
                            gridColor: Theme.of(context).colorScheme.onSurface
                                .withValues(alpha: .14),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 0,
                        right: 0,
                        bottom: 0,
                        child: IgnorePointer(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              _GoldChartLabel(
                                label: appText(context, 'HIGH'),
                                value: highest,
                              ),
                              _GoldChartLabel(
                                label: appText(context, 'AVG'),
                                value: average,
                              ),
                              _GoldChartLabel(
                                label: appText(context, 'LOW'),
                                value: lowest,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _chartDate(_history.first.timestamp),
                      style: TextStyle(color: akMutedOf(context), fontSize: 10),
                    ),
                    Text(
                      _chartDate(_history.last.timestamp),
                      style: TextStyle(color: akMutedOf(context), fontSize: 10),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  appText(
                        context,
                        '{count} history points · Last updated {time}',
                      )
                      .replaceAll('{count}', _history.length.toString())
                      .replaceAll(
                        '{time}',
                        _history.last.timestamp.toLocal().toString().substring(
                          0,
                          16,
                        ),
                      ),
                  style: TextStyle(color: akMutedOf(context), fontSize: 10),
                ),
              ],
            ),
          ),
          if (widget.showCalculator) ...[
            const SizedBox(height: 16),
            _GoldCalculator(goldPrice: current),
          ],
        ],
      ],
    );
  }
}

class _GoldMarketStats extends StatelessWidget {
  const _GoldMarketStats({
    required this.lowest,
    required this.average,
    required this.highest,
  });

  final int lowest;
  final int average;
  final int highest;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: _GoldStat(label: appText(context, 'LOW'), value: lowest),
        ),
        Expanded(
          child: _GoldStat(label: appText(context, 'AVERAGE'), value: average),
        ),
        Expanded(
          child: _GoldStat(label: appText(context, 'HIGH'), value: highest),
        ),
      ],
    );
  }
}

class _GoldStat extends StatelessWidget {
  const _GoldStat({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          label,
          style: TextStyle(
            color: akMutedOf(context),
            fontSize: 9,
            fontWeight: FontWeight.w700,
            letterSpacing: .7,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 3),
        Text(
          formatSilver(value),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
        ),
      ],
    );
  }
}

class _GoldChartLabel extends StatelessWidget {
  const _GoldChartLabel({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: .78),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
        child: Text(
          '$label ${formatSilver(value)}',
          style: TextStyle(
            color: akMutedOf(context),
            fontSize: 9,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

String _chartDate(DateTime date) =>
    '${date.month.toString().padLeft(2, '0')}/${date.day.toString().padLeft(2, '0')}';

class _GoldCalculator extends StatefulWidget {
  const _GoldCalculator({required this.goldPrice});

  final int goldPrice;

  @override
  State<_GoldCalculator> createState() => _GoldCalculatorState();
}

class _GoldCalculatorState extends State<_GoldCalculator> {
  static const _premiumDurations = [
    (days: 30, gold: 3750),
    (days: 90, gold: 11250),
    (days: 180, gold: 22500),
  ];

  final _amountController = TextEditingController(text: '100000');
  final _resultController = TextEditingController();
  bool _silverToGold = true;

  @override
  void initState() {
    super.initState();
    _updateResult();
  }

  @override
  void didUpdateWidget(covariant _GoldCalculator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.goldPrice != widget.goldPrice) _updateResult();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _resultController.dispose();
    super.dispose();
  }

  void _updateResult() {
    final amount = double.tryParse(_amountController.text) ?? 0;
    final converted = widget.goldPrice <= 0
        ? 0.0
        : _silverToGold
        ? amount / widget.goldPrice
        : amount * widget.goldPrice;
    _resultController.text = _silverToGold
        ? converted.toStringAsFixed(2)
        : formatSilver(converted.round());
  }

  @override
  Widget build(BuildContext context) {
    return AkPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AkSectionTitle(appText(context, 'Gold calculator')),
          const SizedBox(height: 4),
          Text(
            appText(context, 'Convert using the latest regional market price.'),
            style: TextStyle(color: akMutedOf(context), fontSize: 12),
          ),
          const SizedBox(height: 14),
          _GoldConversionField(
            label: appText(context, _silverToGold ? 'SILVER' : 'GOLD'),
            controller: _amountController,
            onChanged: (_) => setState(_updateResult),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 2),
            child: Center(
              child: IconButton(
                key: const ValueKey('gold-conversion-swap'),
                tooltip: appText(context, 'Swap conversion direction'),
                style: IconButton.styleFrom(
                  backgroundColor: Theme.of(context)
                      .colorScheme
                      .surfaceContainerHighest,
                  side: BorderSide.none,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () => setState(() {
                  _silverToGold = !_silverToGold;
                  _amountController.text = '1';
                  _updateResult();
                }),
                icon: const Icon(LucideIcons.arrowDownUp),
              ),
            ),
          ),
          _GoldConversionField(
            label: appText(context, _silverToGold ? 'GOLD' : 'SILVER'),
            controller: _resultController,
            readOnly: true,
          ),
          const SizedBox(height: 22),
          AkSectionTitle(appText(context, 'Premium price estimate')),
          const SizedBox(height: 12),
          for (final duration in _premiumDurations)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      appText(
                        context,
                        '{days} days',
                      ).replaceAll('{days}', duration.days.toString()),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      appText(
                        context,
                        '{amount} gold',
                      ).replaceAll('{amount}', formatSilver(duration.gold)),
                      textAlign: TextAlign.end,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: akMutedOf(context), fontSize: 12),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerRight,
                      child: Text(
                        appText(context, '{amount} silver').replaceAll(
                          '{amount}',
                          _formatCompactSilver(
                            duration.gold * widget.goldPrice,
                          ),
                        ),
                        key: ValueKey(
                          'premium-silver-estimate-${duration.days}',
                        ),
                        maxLines: 1,
                        softWrap: false,
                        textAlign: TextAlign.end,
                        style: const TextStyle(
                          color: akOrange,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          Text(
            appText(
              context,
              'Estimates use the current gold price and standard premium gold costs.',
            ),
            style: TextStyle(color: akMutedOf(context), fontSize: 10),
          ),
        ],
      ),
    );
  }
}

String _formatCompactSilver(int value) {
  if (value.abs() < 1000) return formatSilver(value);
  final divisor = value.abs() >= 1000000 ? 1000000 : 1000;
  final suffix = divisor == 1000000 ? 'm' : 'k';
  final amount = (value / divisor)
      .toStringAsFixed(2)
      .replaceFirst(RegExp(r'\.?0+$'), '');
  return '$amount$suffix';
}

class _GoldConversionField extends StatelessWidget {
  const _GoldConversionField({
    required this.label,
    required this.controller,
    this.onChanged,
    this.readOnly = false,
  });

  final String label;
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final bool readOnly;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: akMutedOf(context),
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: .6,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          key: ValueKey('gold-conversion-$label'),
          controller: controller,
          readOnly: readOnly,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          onChanged: onChanged,
          onTapOutside: akUnfocusOnTapOutside,
          decoration: const InputDecoration(
            isDense: true,
            contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 12),
          ),
        ),
      ],
    );
  }
}

class _PriceChartPainter extends CustomPainter {
  const _PriceChartPainter({
    required this.values,
    required this.lineColor,
    required this.gridColor,
  });

  final List<double> values;
  final Color lineColor;
  final Color gridColor;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.length < 2) return;

    final minValue = values.reduce((a, b) => a < b ? a : b);
    final maxValue = values.reduce((a, b) => a > b ? a : b);
    final spread = maxValue == minValue ? 1 : maxValue - minValue;
    final points = <Offset>[];
    for (var i = 0; i < values.length; i++) {
      final x = size.width * i / (values.length - 1);
      final y =
          size.height -
          ((values[i] - minValue) / spread * (size.height - 8)) -
          4;
      points.add(Offset(x, y));
    }
    final area = Path()
      ..moveTo(points.first.dx, size.height)
      ..lineTo(points.first.dx, points.first.dy);
    for (final point in points.skip(1)) {
      area.lineTo(point.dx, point.dy);
    }
    area
      ..lineTo(points.last.dx, size.height)
      ..close();
    final gridPaint = Paint()
      ..color = gridColor
      ..strokeWidth = 1;
    for (var row = 0; row < 4; row++) {
      final y = size.height * row / 3;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }
    canvas.drawPath(
      area,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            lineColor.withValues(alpha: .28),
            lineColor.withValues(alpha: .01),
          ],
        ).createShader(Offset.zero & size),
    );
    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (final point in points.skip(1)) {
      path.lineTo(point.dx, point.dy);
    }
    canvas.drawPath(
      path,
      Paint()
        ..color = lineColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..strokeJoin = StrokeJoin.round
        ..strokeCap = StrokeCap.round,
    );
    final lastPoint = points.last;
    canvas.drawCircle(
      lastPoint,
      7,
      Paint()
        ..color = lineColor.withValues(alpha: .18)
        ..style = PaintingStyle.fill,
    );
    canvas.drawCircle(lastPoint, 4, Paint()..color = lineColor);
  }

  @override
  bool shouldRepaint(covariant _PriceChartPainter oldDelegate) =>
      oldDelegate.values != values ||
      oldDelegate.lineColor != lineColor ||
      oldDelegate.gridColor != gridColor;
}

class ProfitCalculatorPanel extends StatefulWidget {
  const ProfitCalculatorPanel({
    super.key,
    required this.repository,
    required this.region,
    this.initialType = 'crafting',
  });

  final AlbionKitRepository repository;
  final String region;
  final String initialType;

  @override
  State<ProfitCalculatorPanel> createState() => _ProfitCalculatorPanelState();
}

class _ProfitCalculatorPanelState extends State<ProfitCalculatorPanel> {
  static const _types = {
    'Crafting': 'crafting',
    'Cooking': 'cooking',
    'Alchemy': 'alchemy',
    'Farming': 'farming',
    'Chopped fish': 'chopped-fish',
    'Laborer': 'labour',
    'Animal': 'animal',
  };

  final _itemIdController = TextEditingController();
  final _quantityController = TextEditingController(text: '10');
  String _type = 'crafting';
  bool _loading = false;
  String? _error;
  ProfitCalculation? _result;

  @override
  void initState() {
    super.initState();
    _type = widget.initialType;
  }

  Future<void> _calculate() async {
    final itemId = _itemIdController.text.trim();
    final quantity = int.tryParse(_quantityController.text.trim());
    if (itemId.isEmpty || quantity == null || quantity < 1) {
      setState(
        () => _error = appText(
          context,
          'Enter a valid Albion item ID and quantity.',
        ),
      );
      return;
    }
    if (quantity > 999) {
      setState(
        () => _error = appText(
          context,
          'Quantity cannot exceed one 999-item stack.',
        ),
      );
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
      _result = null;
    });
    try {
      final result = await widget.repository.calculateProfit(
        type: _type,
        itemId: itemId,
        quantity: quantity,
        region: widget.region,
      );
      if (mounted) setState(() => _result = result);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _showActivityPicker() async {
    final selectedType = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      builder: (context) => SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  appText(context, 'Choose activity'),
                  style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 12),
                ..._types.entries.map(
                  (entry) => ListTile(
                    key: ValueKey('profit-activity-option-${entry.value}'),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                    title: Text(appText(context, entry.key)),
                    trailing: entry.value == _type
                        ? const Icon(LucideIcons.check, color: akOrange)
                        : null,
                    onTap: () => Navigator.of(context).pop(entry.value),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    if (selectedType != null && mounted) {
      setState(() => _type = selectedType);
    }
  }

  @override
  void dispose() {
    _itemIdController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AkSectionTitle(appText(context, 'Profit calculator')),
        const SizedBox(height: 6),
        Text(
          appText(
            context,
            'Calculate using AlbionKit market data and your selected server.',
          ),
          style: TextStyle(color: akMutedOf(context), fontSize: 12),
        ),
        const SizedBox(height: 14),
        AkPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                appText(context, 'ACTIVITY'),
                style: TextStyle(
                  color: akMutedOf(context),
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: .6,
                ),
              ),
              const SizedBox(height: 6),
              OutlinedButton(
                key: const ValueKey('profit-calculator-activity'),
                onPressed: _showActivityPicker,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 14,
                  ),
                  alignment: Alignment.centerLeft,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        appText(
                          context,
                          _types.entries
                              .firstWhere((entry) => entry.value == _type)
                              .key,
                        ),
                      ),
                    ),
                    Icon(
                      LucideIcons.chevronDown,
                      size: 16,
                      color: akMutedOf(context),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _itemIdController,
                textCapitalization: TextCapitalization.characters,
                onTapOutside: akUnfocusOnTapOutside,
                decoration: InputDecoration(
                  labelText: appText(context, 'Albion item ID'),
                  hintText: 'T4_BAG',
                  prefixIcon: Icon(LucideIcons.package),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _quantityController,
                keyboardType: TextInputType.number,
                inputFormatters: const [StackQuantityInputFormatter()],
                onTapOutside: akUnfocusOnTapOutside,
                decoration: InputDecoration(
                  labelText: appText(context, 'Quantity'),
                  prefixIcon: Icon(LucideIcons.listOrdered),
                  helperText: appText(
                    context,
                    'Maximum {count} items per stack',
                  ).replaceAll('{count}', '999'),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _loading ? null : _calculate,
                  icon: _loading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(LucideIcons.calculator),
                  label: Text(
                    _loading
                        ? appText(context, 'Calculating…')
                        : appText(context, 'Calculate profit'),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: akOrange,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(0, 48),
                  ),
                ),
              ),
            ],
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          AkMessagePanel(
            title: appText(context, 'Calculation failed'),
            message: _error!,
            isError: true,
          ),
        ],
        if (_result != null) ...[
          const SizedBox(height: 12),
          AkPanel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LocalizedItemName(
                  repository: widget.repository,
                  itemId: _itemIdController.text.trim(),
                  fallback: _result!.itemName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 14),
                _ResultLine(
                  label: appText(context, 'Estimated profit'),
                  value: '${formatSilver(_result!.profit)} silver',
                  highlight: true,
                ),
                _ResultLine(
                  label: appText(context, 'Return on investment'),
                  value: '${_result!.roi.toStringAsFixed(1)}%',
                ),
                _ResultLine(
                  label: appText(context, 'Revenue'),
                  value: '${formatSilver(_result!.revenue)} silver',
                ),
                _ResultLine(
                  label: appText(context, 'Effective cost'),
                  value: '${formatSilver(_result!.effectiveCost)} silver',
                ),
                _ResultLine(
                  label: appText(context, 'Profit per focus'),
                  value: '${formatSilver(_result!.profitPerFocus)} silver',
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _ResultLine extends StatelessWidget {
  const _ResultLine({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 9),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(color: akMutedOf(context), fontSize: 12),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: highlight ? akGreen : null,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

String _prettyItemName(String itemId) {
  return itemId
      .replaceAll(RegExp(r'^T\d+_'), '')
      .replaceAll('_', ' ')
      .toLowerCase()
      .split(' ')
      .map(
        (word) => word.isEmpty
            ? word
            : '${word[0].toUpperCase()}${word.substring(1)}',
      )
      .join(' ');
}
