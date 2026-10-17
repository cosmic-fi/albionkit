import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models/specialized_profit_models.dart';
import '../../data/repositories/albionkit_repository.dart';
import '../localization/app_text.dart';
import '../widgets/ak_widgets.dart';
import '../widgets/localized_item_name.dart';
import '../widgets/profit_tool_widgets.dart';

class ChoppedFishProfitScreen extends StatefulWidget {
  const ChoppedFishProfitScreen({
    super.key,
    required this.region,
    required this.repository,
  });

  final String region;
  final AlbionKitRepository repository;

  @override
  State<ChoppedFishProfitScreen> createState() =>
      _ChoppedFishProfitScreenState();
}

class _ChoppedFishProfitScreenState extends State<ChoppedFishProfitScreen> {
  final _targetController = TextEditingController(text: '100');
  Timer? _loadTimer;
  String _region = '';
  String _buyCity = 'Martlock';
  String _sellCity = 'Martlock';
  bool _premium = true;
  bool _buyOrder = true;
  bool _includeTax = true;
  bool _loading = false;
  int _loadGeneration = 0;
  String? _error;
  List<ChoppedFishProfitResult> _results = const [];

  int get _target =>
      (int.tryParse(_targetController.text) ?? 100).clamp(1, 999);

  @override
  void initState() {
    super.initState();
    _region = widget.region;
    _load();
  }

  @override
  void didUpdateWidget(covariant ChoppedFishProfitScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.region != widget.region) {
      _region = widget.region;
      _load();
    }
  }

  @override
  void dispose() {
    _loadTimer?.cancel();
    _targetController.dispose();
    super.dispose();
  }

  void _scheduleLoad() {
    _loadTimer?.cancel();
    _loadTimer = Timer(const Duration(milliseconds: 350), _load);
  }

  Future<void> _load() async {
    final generation = ++_loadGeneration;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await widget.repository.getChoppedFishProfits(
        region: _region,
        buyCity: _buyCity,
        sellCity: _sellCity,
        targetChops: _target,
        premium: _premium,
        buyOrder: _buyOrder,
        includeTax: _includeTax,
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
  Widget build(BuildContext context) => ProfitToolScaffold(
    title: appText(context, 'Chopped fish profits'),
    eyebrow: appText(context, 'PROFIT CALCULATOR'),
    subtitle: appText(
      context,
      'Compare fish types by chopping yield and live market prices.',
    ),
    onRefresh: _load,
    children: [
      _buildFilters(),
      const SizedBox(height: 16),
      _buildResults(),
      const SizedBox(height: 20),
      _buildGuide(),
    ],
  );

  Widget _buildFilters() => AkPanel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ProfitCityPair(
          firstTitle: appText(context, 'Buy fish from'),
          firstCity: _buyCity,
          onFirstChanged: (city) {
            setState(() => _buyCity = city);
            _load();
          },
          secondTitle: appText(context, 'Sell chopped fish in'),
          secondCity: _sellCity,
          onSecondChanged: (city) {
            setState(() => _sellCity = city);
            _load();
          },
        ),
        const SizedBox(height: 12),
        TextField(
          key: const ValueKey('chopped-fish-target'),
          controller: _targetController,
          autofocus: false,
          keyboardType: TextInputType.number,
          inputFormatters: const [StackQuantityInputFormatter()],
          onTapOutside: akUnfocusOnTapOutside,
          decoration: InputDecoration(
            labelText: appText(context, 'Chopped fish required'),
            prefixIcon: Icon(LucideIcons.hash),
            helperText: appText(context, 'Maximum 999 chops per stack'),
          ),
          onChanged: (_) => _scheduleLoad(),
          onSubmitted: (_) {
            _targetController.text = '$_target';
            FocusManager.instance.primaryFocus?.unfocus();
            _load();
          },
        ),
        const SizedBox(height: 8),
        ProfitModeToggle(
          key: const ValueKey('chopped-fish-premium-toggle'),
          title: appText(context, 'Premium'),
          subtitle: appText(
            context,
            'Use the 4% marketplace tax rate instead of 8%.',
          ),
          value: _premium,
          onChanged: (value) {
            setState(() => _premium = value);
            _load();
          },
          color: akGreen,
        ),
        ProfitModeToggle(
          key: const ValueKey('chopped-fish-buy-order-toggle'),
          title: appText(context, 'Buy order'),
          subtitle: appText(
            context,
            'Include the 2.5% buy fee when purchasing fish.',
          ),
          value: _buyOrder,
          onChanged: (value) {
            setState(() => _buyOrder = value);
            _load();
          },
        ),
        ProfitModeToggle(
          key: const ValueKey('chopped-fish-tax-toggle'),
          title: appText(context, 'Include sell fees'),
          subtitle: appText(
            context,
            'Apply premium/non-premium tax and the 2.5% fee.',
          ),
          value: _includeTax,
          onChanged: (value) {
            setState(() => _includeTax = value);
            _load();
          },
        ),
        if (_loading) ...[
          const SizedBox(height: 8),
          const LinearProgressIndicator(minHeight: 2),
        ],
      ],
    ),
  );

  Widget _buildResults() {
    if (_error != null) {
      return AkMessagePanel(
        title: appText(context, 'Market data unavailable'),
        message: _error!,
        isError: true,
        onRetry: _load,
      );
    }
    if (_results.isEmpty && _loading) {
      return const AkPanel(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }
    if (_results.isEmpty) {
      return AkMessagePanel(
        title: appText(context, 'No fish prices available'),
        message: appText(context, 'Pull down to refresh market data.'),
        icon: LucideIcons.fish,
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AkSectionTitle(
          appText(context, 'Fish profit results'),
          trailing: Text(
            appText(
              context,
              '{count} fish types',
            ).replaceAll('{count}', '${_results.length}'),
            style: TextStyle(color: akMutedOf(context), fontSize: 12),
          ),
        ),
        const SizedBox(height: 10),
        for (final result in _results) _resultCard(result),
      ],
    );
  }

  Widget _resultCard(ChoppedFishProfitResult result) {
    final color = result.profit >= 0 ? akGreen : akRed;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: ValueKey('chopped-fish-result-${result.fish.id}'),
          borderRadius: BorderRadius.circular(18),
          onTap: () {
            FocusManager.instance.primaryFocus?.unfocus();
            _showDetails(result);
          },
          child: AkPanel(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                Image.network(
                  'https://render.albiononline.com/v1/item/${result.fish.id}?count=1&quality=1&size=48',
                  width: 40,
                  height: 40,
                  errorBuilder: (context, error, stackTrace) =>
                      const Icon(LucideIcons.fish, color: akOrange),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      LocalizedItemName(
                        repository: widget.repository,
                        itemId: result.fish.id,
                        fallback: result.fish.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      Text(
                        appText(context, 'T{tier} · {count} chops each')
                            .replaceAll('{tier}', '${result.fish.tier}')
                            .replaceAll(
                              '{count}',
                              '${result.fish.chopsPerFish}',
                            ),
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
                  width: 112,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        result.warning == null
                            ? appText(context, '{amount} silver').replaceAll(
                                '{amount}',
                                formatSilver(result.profit),
                              )
                            : appText(context, result.warning!),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.end,
                        style: TextStyle(
                          color: result.warning == null ? color : akOrange,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        appText(context, '{percent}% ROI').replaceAll(
                          '{percent}',
                          result.roi.toStringAsFixed(1),
                        ),
                        style: TextStyle(
                          color: result.roi > 0 ? akGreen : akRed,
                          fontSize: 11,
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

  Future<void> _showDetails(
    ChoppedFishProfitResult result,
  ) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Theme.of(context).colorScheme.surface,
    builder: (context) => SafeArea(
      child: ConstrainedBox(
        key: const ValueKey('chopped-fish-detail-sheet'),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * .78,
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: LocalizedItemName(
                      repository: widget.repository,
                      itemId: result.fish.id,
                      fallback: result.fish.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleLarge
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ),
                  Text(
                    ' · T${result.fish.tier}',
                    style: Theme.of(context).textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              AkPanel(
                child: Column(
                  children: [
                    ProfitDetailRow(
                      label: appText(context, 'Target chopped fish'),
                      value: '${result.targetChops}',
                    ),
                    ProfitDetailRow(
                      label: appText(context, 'Fish required'),
                      value: '${result.fishRequired}',
                    ),
                    ProfitDetailRow(
                      label: appText(context, 'Chops produced'),
                      value:
                          '${result.fishRequired * result.fish.chopsPerFish}',
                    ),
                    ProfitDetailRow(
                      label: appText(
                        context,
                        'Fish cost · {city}',
                      ).replaceAll('{city}', result.buyCity),
                      value: appText(
                        context,
                        '{amount} silver',
                      ).replaceAll('{amount}', formatSilver(result.fishCost)),
                    ),
                    ProfitDetailRow(
                      label: appText(
                        context,
                        'Output revenue · {city}',
                      ).replaceAll('{city}', result.sellCity),
                      value: appText(
                        context,
                        '{amount} silver',
                      ).replaceAll('{amount}', formatSilver(result.revenue)),
                    ),
                    ProfitDetailRow(
                      label: appText(context, 'Net profit'),
                      value: appText(
                        context,
                        '{amount} silver',
                      ).replaceAll('{amount}', formatSilver(result.profit)),
                      valueColor: result.profit >= 0 ? akGreen : akRed,
                    ),
                    ProfitDetailRow(
                      label: appText(context, 'ROI'),
                      value: '${result.roi.toStringAsFixed(1)}%',
                    ),
                  ],
                ),
              ),
              if (result.warning != null) ...[
                const SizedBox(height: 12),
                Text(
                  appText(context, result.warning!),
                  style: const TextStyle(color: akOrange),
                ),
              ],
            ],
          ),
        ),
      ),
    ),
  );

  Widget _buildGuide() => AkPanel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AkSectionTitle(appText(context, 'Chopped fish guide')),
        const SizedBox(height: 8),
        Text(
          appText(
            context,
            'Fish requirements round up to whole fish. Profit estimates include the selected purchase fee and marketplace tax assumptions.',
          ),
          style: TextStyle(
            color: akMutedOf(context),
            fontSize: 12,
            height: 1.5,
          ),
        ),
      ],
    ),
  );
}
