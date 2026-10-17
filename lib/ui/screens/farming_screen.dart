import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models/farming_models.dart';
import '../../data/repositories/albionkit_repository.dart';
import '../widgets/ak_widgets.dart';
import '../widgets/localized_item_name.dart';
import '../localization/app_text.dart';

class FarmingProfitScreen extends StatefulWidget {
  const FarmingProfitScreen({
    super.key,
    required this.region,
    required this.repository,
  });

  final String region;
  final AlbionKitRepository repository;

  @override
  State<FarmingProfitScreen> createState() => _FarmingProfitScreenState();
}

class _FarmingProfitScreenState extends State<FarmingProfitScreen> {
  static const _cities = [
    'Martlock',
    'Bridgewatch',
    'Lymhurst',
    'Fort Sterling',
    'Thetford',
    'Caerleon',
    'Brecilien',
    'Black Market',
  ];

  final _plotsController = TextEditingController(text: '12');
  final _cyclesController = TextEditingController(text: '1');
  final _returnRateController = TextEditingController(text: '0');
  Timer? _filterTimer;
  String _productType = 'crop';
  String _seedCity = 'Martlock';
  String _produceCity = 'Martlock';
  bool _premium = true;
  bool _useFocus = true;
  bool _loading = false;
  int _loadGeneration = 0;
  String? _error;
  List<FarmingProfitResult> _results = const [];
  String _region = '';

  @override
  void initState() {
    super.initState();
    _region = widget.region;
    _load();
  }

  @override
  void didUpdateWidget(covariant FarmingProfitScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.region != widget.region) {
      _region = widget.region;
      _load();
    }
  }

  @override
  void dispose() {
    _filterTimer?.cancel();
    _plotsController.dispose();
    _cyclesController.dispose();
    _returnRateController.dispose();
    super.dispose();
  }

  int _boundedInt(TextEditingController controller, int fallback, int max) {
    final value = int.tryParse(controller.text);
    if (value == null) return fallback;
    return value.clamp(1, max);
  }

  double _returnRate() {
    final value = double.tryParse(_returnRateController.text) ?? 0;
    return value.clamp(0, 100);
  }

  void _scheduleLoad() {
    _filterTimer?.cancel();
    _filterTimer = Timer(const Duration(milliseconds: 350), _load);
  }

  void _unfocusInputs() {
    FocusManager.instance.primaryFocus?.unfocus();
  }

  Future<void> _load() async {
    final generation = ++_loadGeneration;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await widget.repository.getFarmingProfits(
        region: _region,
        productType: _productType,
        seedCity: _seedCity,
        produceCity: _produceCity,
        plots: _boundedInt(_plotsController, 12, 24),
        cycles: _boundedInt(_cyclesController, 1, 100),
        customReturnRate: _returnRate(),
        premium: _premium,
        useFocus: _useFocus,
      );
      if (mounted && generation == _loadGeneration) {
        setState(() => _results = results);
      }
    } catch (error) {
      if (mounted && generation == _loadGeneration) {
        setState(() => _error = error.toString());
      }
    } finally {
      if (mounted && generation == _loadGeneration) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(appText(context, 'Farming profits'))),
      body: RefreshIndicator(
        color: akOrange,
        onRefresh: _load,
        child: ListView(
          key: const ValueKey('farming-profit-scroll-view'),
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          children: [
            AkPageHeading(
              eyebrow: appText(context, 'PROFIT CALCULATOR'),
              title: appText(context, 'Farming'),
              subtitle: appText(
                context,
                'Compare crop and herb returns using live market prices.',
              ),
            ),
            const SizedBox(height: 20),
            _buildFilters(context),
            const SizedBox(height: 16),
            _buildResults(context),
            const SizedBox(height: 20),
            _buildGuide(context),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters(BuildContext context) {
    return AkPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SegmentedButton<String>(
            key: const ValueKey('farming-product-type'),
            segments: [
              ButtonSegment(
                value: 'crop',
                label: Text(appText(context, 'Crops')),
                icon: Icon(LucideIcons.wheat),
              ),
              ButtonSegment(
                value: 'herb',
                label: Text(appText(context, 'Herbs')),
                icon: Icon(LucideIcons.leaf),
              ),
            ],
            selected: {_productType},
            onSelectionChanged: (selection) {
              _unfocusInputs();
              setState(() => _productType = selection.first);
              _load();
            },
          ),
          const SizedBox(height: 18),
          LayoutBuilder(
            builder: (context, constraints) {
              final cityFields = [
                _cityField(
                  title: appText(context, 'Buy seeds from'),
                  value: _seedCity,
                  onChanged: (city) {
                    _unfocusInputs();
                    setState(() => _seedCity = city);
                    _load();
                  },
                ),
                _cityField(
                  title: appText(context, 'Sell produce to'),
                  value: _produceCity,
                  onChanged: (city) {
                    _unfocusInputs();
                    setState(() => _produceCity = city);
                    _load();
                  },
                ),
              ];
              if (constraints.maxWidth < 480) {
                return Column(
                  children: [
                    cityFields[0],
                    const SizedBox(height: 12),
                    cityFields[1],
                  ],
                );
              }
              return Row(
                children: [
                  Expanded(child: cityFields[0]),
                  const SizedBox(width: 12),
                  Expanded(child: cityFields[1]),
                ],
              );
            },
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(height: 1),
          ),
          Row(
            children: [
              Expanded(
                child: _numberField(
                  appText(context, 'Plots'),
                  _plotsController,
                  24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _numberField(
                  appText(context, 'Cycles'),
                  _cyclesController,
                  100,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: _numberField(
              appText(context, 'Return rate %'),
              _returnRateController,
              100,
            ),
          ),
          const SizedBox(height: 14),
          _FarmingToggle(
            key: const ValueKey('farming-premium-toggle'),
            title: appText(context, 'Premium'),
            subtitle: appText(context, 'Doubles crop and herb yield.'),
            value: _premium,
            color: akGreen,
            onChanged: (value) {
              _unfocusInputs();
              setState(() => _premium = value);
              _load();
            },
          ),
          const SizedBox(height: 8),
          _FarmingToggle(
            key: const ValueKey('farming-focus-toggle'),
            title: appText(context, 'Focus (watered)'),
            subtitle: appText(context, 'Improves seed return rate.'),
            value: _useFocus,
            color: akOrange,
            onChanged: (value) {
              _unfocusInputs();
              setState(() => _useFocus = value);
              _load();
            },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(LucideIcons.globe, size: 15, color: akMutedOf(context)),
              const SizedBox(width: 6),
              Text(
                appText(
                  context,
                  'Market region: {region}',
                ).replaceAll('{region}', _region.toUpperCase()),
                style: TextStyle(color: akMutedOf(context), fontSize: 12),
              ),
              if (_loading) ...[
                const Spacer(),
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _cityField({
    required String title,
    required String value,
    required ValueChanged<String> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title.toUpperCase(),
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: .6,
          ),
        ),
        const SizedBox(height: 6),
        OutlinedButton(
          key: ValueKey('farming-city-$title'),
          onPressed: () {
            _unfocusInputs();
            _showCityPicker(title, value, onChanged);
          },
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
            alignment: Alignment.centerLeft,
          ),
          child: Row(
            children: [
              Icon(LucideIcons.mapPin, size: 15, color: akMutedOf(context)),
              const SizedBox(width: 8),
              Expanded(child: Text(value, overflow: TextOverflow.ellipsis)),
              const SizedBox(width: 4),
              Icon(
                LucideIcons.chevronDown,
                size: 16,
                color: akMutedOf(context),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _showCityPicker(
    String title,
    String selectedCity,
    ValueChanged<String> onChanged,
  ) async {
    _unfocusInputs();
    final city = await showModalBottomSheet<String>(
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
                  title,
                  style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 12),
                ..._cities.map(
                  (option) => ListTile(
                    key: ValueKey('farming-city-option-$option'),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                    leading: Icon(
                      LucideIcons.mapPin,
                      color: option == selectedCity
                          ? akOrange
                          : akMutedOf(context),
                    ),
                    title: Text(option),
                    trailing: option == selectedCity
                        ? const Icon(LucideIcons.check, color: akOrange)
                        : null,
                    onTap: () => Navigator.of(context).pop(option),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    if (city != null && city != selectedCity) onChanged(city);
  }

  Widget _numberField(String label, TextEditingController controller, int max) {
    return TextField(
      key: ValueKey(
        'farming-input-${label.toLowerCase().replaceAll(' ', '-')}',
      ),
      controller: controller,
      autofocus: false,
      keyboardType: TextInputType.numberWithOptions(
        decimal: controller == _returnRateController,
      ),
      decoration: InputDecoration(labelText: label, isDense: true),
      onChanged: (_) => _scheduleLoad(),
      onTapOutside: akUnfocusOnTapOutside,
      onEditingComplete: () {
        if (controller == _returnRateController) {
          controller.text = _returnRate().toString();
        } else {
          controller.text = '${_boundedInt(controller, 1, max)}';
        }
        FocusScope.of(context).unfocus();
        _load();
      },
    );
  }

  Widget _buildResults(BuildContext context) {
    if (_error != null) {
      return AkMessagePanel(
        title: appText(context, 'Market data unavailable'),
        message: _error!,
        isError: true,
        onRetry: _load,
      );
    }
    if (_loading && _results.isEmpty) {
      return const AkPanel(
        child: Padding(
          padding: EdgeInsets.all(30),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }
    if (_results.isEmpty) {
      return AkMessagePanel(
        title: appText(context, 'No farming data available'),
        message: appText(context, 'Pull down to refresh market prices.'),
        icon: LucideIcons.wheat,
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AkSectionTitle(
          _productType == 'crop'
              ? appText(context, 'Crop profits')
              : appText(context, 'Herb profits'),
          trailing: Text(
            appText(
              context,
              '{count} items',
            ).replaceAll('{count}', '${_results.length}'),
            style: TextStyle(color: akMutedOf(context), fontSize: 12),
          ),
        ),
        const SizedBox(height: 10),
        for (final result in _results) _resultCard(context, result),
      ],
    );
  }

  Widget _resultCard(BuildContext context, FarmingProfitResult result) {
    final profitColor = result.totalProfit >= 0 ? akGreen : akRed;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: ValueKey('farming-result-${result.product.id}'),
          borderRadius: BorderRadius.circular(18),
          onTap: () {
            _unfocusInputs();
            _showResultDetails(result);
          },
          child: AkPanel(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                Image.network(
                  'https://render.albiononline.com/v1/item/${result.product.produceId}?count=1&quality=1&size=64',
                  width: 42,
                  height: 42,
                  errorBuilder: (context, error, stackTrace) =>
                      const Icon(LucideIcons.wheat, color: akOrange),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      LocalizedItemName(
                        repository: widget.repository,
                        itemId: result.product.produceId,
                        fallback: result.product.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        appText(context, 'T{tier} · {type}')
                            .replaceAll('{tier}', '${result.product.tier}')
                            .replaceAll(
                              '{type}',
                              appText(context, result.product.type),
                            ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: akMutedOf(context),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  key: ValueKey('farming-result-summary-${result.product.id}'),
                  width: 112,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        result.warning == null
                            ? appText(context, '{amount} silver').replaceAll(
                                '{amount}',
                                formatSilver(result.totalProfit),
                              )
                            : appText(context, result.warning!),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.end,
                        style: TextStyle(
                          color: result.warning == null
                              ? profitColor
                              : akOrange,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        appText(
                          context,
                          '{value}% ROI',
                        ).replaceAll('{value}', result.roi.toStringAsFixed(1)),
                        style: TextStyle(
                          color: result.roi > 0 ? akGreen : akRed,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  LucideIcons.chevronRight,
                  size: 16,
                  color: akMutedOf(context),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _showResultDetails(FarmingProfitResult result) {
    final profitColor = result.totalProfit >= 0 ? akGreen : akRed;
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      builder: (context) => SafeArea(
        child: ConstrainedBox(
          key: const ValueKey('farming-item-details-sheet'),
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * .78,
          ),
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(
              20,
              8,
              20,
              24 + MediaQuery.viewInsetsOf(context).bottom,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Image.network(
                      'https://render.albiononline.com/v1/item/${result.product.produceId}?count=1&quality=1&size=64',
                      width: 52,
                      height: 52,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        LucideIcons.wheat,
                        color: akOrange,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          LocalizedItemName(
                            repository: widget.repository,
                            itemId: result.product.produceId,
                            fallback: result.product.name,
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          Text(
                            appText(context, 'T{tier} {type}')
                                .replaceAll('{tier}', '${result.product.tier}')
                                .replaceAll(
                                  '{type}',
                                  appText(context, result.product.type),
                                ),
                            style: TextStyle(color: akMutedOf(context)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                AkPanel(
                  child: Column(
                    children: [
                      _detailLine(
                        appText(context, 'Total profit'),
                        appText(context, '{amount} silver').replaceAll(
                          '{amount}',
                          formatSilver(result.totalProfit),
                        ),
                        valueColor: profitColor,
                      ),
                      _detailLine(
                        appText(context, 'Return on investment'),
                        '${result.roi.toStringAsFixed(1)}%',
                      ),
                      _detailLine(
                        appText(context, 'Net profit per seed'),
                        appText(context, '{amount} silver').replaceAll(
                          '{amount}',
                          formatSilver(result.netProfitPerSeed),
                        ),
                      ),
                      _detailLine(
                        appText(context, 'Revenue per seed'),
                        appText(context, '{amount} silver').replaceAll(
                          '{amount}',
                          formatSilver(result.revenuePerSeed),
                        ),
                      ),
                      _detailLine(
                        'Seed price · $_seedCity',
                        appText(context, '{amount} silver').replaceAll(
                          '{amount}',
                          formatSilver(result.seedPrice),
                        ),
                      ),
                      _detailLine(
                        appText(context, 'Seed volume (24h)'),
                        formatSilver(result.seedVolume),
                      ),
                      _detailLine(
                        'Produce price · $_produceCity',
                        appText(context, '{amount} silver').replaceAll(
                          '{amount}',
                          formatSilver(result.producePrice),
                        ),
                      ),
                      _detailLine(
                        appText(context, 'Produce volume (24h)'),
                        formatSilver(result.produceVolume),
                      ),
                      _detailLine(
                        appText(context, 'Expected yield'),
                        appText(
                          context,
                          '{yield} per seed',
                        ).replaceAll('{yield}', '${result.expectedYield}'),
                      ),
                      _detailLine(
                        appText(context, 'Seed return rate'),
                        appText(context, '{rate}%').replaceAll(
                          '{rate}',
                          result.effectiveSeedReturnRate.toStringAsFixed(2),
                        ),
                      ),
                      _detailLine(
                        appText(context, 'Plots'),
                        _plotsController.text,
                      ),
                      _detailLine(
                        appText(context, 'Cycles'),
                        _cyclesController.text,
                      ),
                      _detailLine(
                        appText(context, 'Premium'),
                        _premium
                            ? appText(context, 'Active')
                            : appText(context, 'Off'),
                      ),
                      _detailLine(
                        appText(context, 'Focus'),
                        _useFocus
                            ? appText(context, 'Active')
                            : appText(context, 'Off'),
                      ),
                    ],
                  ),
                ),
                if (result.warning != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    appText(context, result.warning!),
                    style: const TextStyle(color: akOrange, fontSize: 12),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _detailLine(String label, String value, {Color? valueColor}) {
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
          Expanded(
            child: Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.end,
              style: TextStyle(color: valueColor, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGuide(BuildContext context) {
    return AkPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AkSectionTitle(appText(context, 'How farming profit is estimated')),
          const SizedBox(height: 10),
          Text(
            'Prices use the lowest available sell order in the selected seed and produce cities. Yield uses the standard island yield, doubled while Premium is enabled. The focus setting applies the product’s seed-return rate; the return-rate field overrides it when set.',
            style: TextStyle(
              color: akMutedOf(context),
              fontSize: 12,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            appText(
              context,
              'Market prices and 24-hour volume are provided by the Albion Online Data Project.',
            ),
            style: TextStyle(
              color: akMutedOf(context),
              fontSize: 11,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _FarmingToggle extends StatelessWidget {
  const _FarmingToggle({
    super.key,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.color,
    required this.onChanged,
  });

  final String title;
  final String subtitle;
  final bool value;
  final Color color;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: akSurfaceOf(context),
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(color: color, fontWeight: FontWeight.w800),
                ),
                Text(
                  subtitle,
                  style: TextStyle(color: akMutedOf(context), fontSize: 11),
                ),
              ],
            ),
          ),
          Switch(
            key: ValueKey('farming-switch-$title'),
            value: value,
            onChanged: onChanged,
            activeThumbColor: color,
          ),
        ],
      ),
    );
  }
}
