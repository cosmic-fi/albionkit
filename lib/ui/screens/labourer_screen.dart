import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models/specialized_profit_models.dart';
import '../../data/repositories/albionkit_repository.dart';
import '../localization/app_text.dart';
import '../widgets/ak_widgets.dart';
import '../widgets/profit_tool_widgets.dart';

class LabourerProfitScreen extends StatefulWidget {
  const LabourerProfitScreen({
    super.key,
    required this.region,
    required this.repository,
  });

  final String region;
  final AlbionKitRepository repository;

  @override
  State<LabourerProfitScreen> createState() => _LabourerProfitScreenState();
}

class _LabourerProfitScreenState extends State<LabourerProfitScreen> {
  final _countController = TextEditingController(text: '1');
  Timer? _loadTimer;
  String _region = '';
  String _labourerId = 'blacksmith';
  String _buyCity = 'Martlock';
  String _sellCity = 'Martlock';
  int _houseTier = 6;
  bool _premium = true;
  bool _sellOrder = true;
  bool _enchantedReturns = false;
  bool _loading = false;
  int _loadGeneration = 0;
  String? _error;
  List<LabourerProfitResult> _results = const [];

  LabourerType get _labourer => AlbionKitRepository.labourerTypes.firstWhere(
    (type) => type.id == _labourerId,
  );

  int get _count => (int.tryParse(_countController.text) ?? 1).clamp(1, 999);

  @override
  void initState() {
    super.initState();
    _region = widget.region;
    _load();
  }

  @override
  void didUpdateWidget(covariant LabourerProfitScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.region != widget.region) {
      _region = widget.region;
      _load();
    }
  }

  @override
  void dispose() {
    _loadTimer?.cancel();
    _countController.dispose();
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
      final results = await widget.repository.getLabourerProfits(
        region: _region,
        labourerId: _labourerId,
        buyCity: _buyCity,
        sellCity: _sellCity,
        houseTier: _houseTier,
        journalCount: _count,
        premium: _premium,
        sellOrder: _sellOrder,
        includeEnchantedReturns: _enchantedReturns,
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
    title: appText(context, 'Labourer profits'),
    eyebrow: appText(context, 'PROFIT CALCULATOR'),
    subtitle: appText(
      context,
      'Compare journal costs, empty journal resale and returned resources.',
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
        Text(
          appText(context, 'LABOURER TYPE'),
          style: TextStyle(
            color: akMutedOf(context),
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: .6,
          ),
        ),
        const SizedBox(height: 6),
        OutlinedButton(
          key: const ValueKey('labourer-type-picker'),
          onPressed: _pickLabourer,
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(48),
            alignment: Alignment.centerLeft,
          ),
          child: Row(
            children: [
              Expanded(child: Text(appText(context, _labourer.name))),
              const Icon(LucideIcons.chevronDown, size: 18),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ProfitCityPair(
          firstTitle: appText(context, 'Buy full journals from'),
          firstCity: _buyCity,
          onFirstChanged: (city) {
            setState(() => _buyCity = city);
            _load();
          },
          secondTitle: appText(context, 'Sell empty journals and returns in'),
          secondCity: _sellCity,
          onSecondChanged: (city) {
            setState(() => _sellCity = city);
            _load();
          },
        ),
        const SizedBox(height: 14),
        Text(
          appText(context, 'HOUSE TIER · HAPPINESS'),
          style: TextStyle(
            color: akMutedOf(context),
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: .6,
          ),
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (var tier = 2; tier <= 8; tier++) ...[
                ChoiceChip(
                  key: ValueKey('labourer-house-tier-$tier'),
                  label: Text('T$tier'),
                  selected: _houseTier == tier,
                  onSelected: (_) {
                    FocusManager.instance.primaryFocus?.unfocus();
                    setState(() => _houseTier = tier);
                    _load();
                  },
                ),
                const SizedBox(width: 8),
              ],
            ],
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          key: const ValueKey('labourer-journal-count'),
          controller: _countController,
          autofocus: false,
          keyboardType: TextInputType.number,
          inputFormatters: const [StackQuantityInputFormatter()],
          onTapOutside: akUnfocusOnTapOutside,
          decoration: InputDecoration(
            labelText: appText(context, 'Journal count'),
            prefixIcon: Icon(LucideIcons.hash),
            helperText: appText(context, 'Maximum 999 journals per stack'),
          ),
          onChanged: (_) => _scheduleLoad(),
          onSubmitted: (_) {
            _countController.text = '$_count';
            FocusManager.instance.primaryFocus?.unfocus();
            _load();
          },
        ),
        const SizedBox(height: 8),
        ProfitModeToggle(
          key: const ValueKey('labourer-premium'),
          title: appText(context, 'Premium'),
          subtitle: appText(context, 'Use 4% marketplace tax instead of 8%.'),
          value: _premium,
          onChanged: (value) {
            setState(() => _premium = value);
            _load();
          },
          color: akGreen,
        ),
        ProfitModeToggle(
          key: const ValueKey('labourer-sell-order'),
          title: appText(context, 'Sell order'),
          subtitle: appText(
            context,
            'Include the 2.5% empty journal sale fee.',
          ),
          value: _sellOrder,
          onChanged: (value) {
            setState(() => _sellOrder = value);
            _load();
          },
        ),
        if (_labourer.id != 'mercenary')
          ProfitModeToggle(
            key: const ValueKey('labourer-enchanted-returns'),
            title: appText(context, 'Include enchanted returns'),
            subtitle: appText(
              context,
              'Add .1, .2 and .3 resource prices to the estimate.',
            ),
            value: _enchantedReturns,
            onChanged: (value) {
              setState(() => _enchantedReturns = value);
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

  Future<void> _pickLabourer() async {
    FocusManager.instance.primaryFocus?.unfocus();
    final selected = await showModalBottomSheet<String>(
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
                  appText(context, 'Choose labourer'),
                  style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                for (final type in AlbionKitRepository.labourerTypes)
                  ListTile(
                    key: ValueKey('labourer-option-${type.id}'),
                    leading: Icon(
                      type.category == 'mercenary'
                          ? LucideIcons.swords
                          : type.category == 'gathering'
                          ? LucideIcons.pickaxe
                          : LucideIcons.hammer,
                    ),
                    title: Text(appText(context, type.name)),
                    subtitle: Text(appText(context, type.category)),
                    trailing: type.id == _labourerId
                        ? const Icon(LucideIcons.check, color: akOrange)
                        : null,
                    onTap: () => Navigator.of(context).pop(type.id),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
    if (selected != null && mounted) {
      setState(() {
        _labourerId = selected;
        if (selected == 'mercenary') _enchantedReturns = false;
      });
      _load();
    }
  }

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
        title: appText(context, 'No journal results'),
        message: appText(context, 'Pull down to refresh market data.'),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AkSectionTitle(
          appText(
            context,
            '{name} journal returns',
          ).replaceAll('{name}', appText(context, _labourer.name)),
          trailing: Text(
            appText(
              context,
              '{count} tiers',
            ).replaceAll('{count}', '${_results.length}'),
            style: TextStyle(color: akMutedOf(context), fontSize: 12),
          ),
        ),
        const SizedBox(height: 10),
        for (final result in _results) _resultCard(result),
      ],
    );
  }

  Widget _resultCard(LabourerProfitResult result) {
    final color = result.profit >= 0 ? akGreen : akRed;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: ValueKey('labourer-result-${result.tier}'),
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
                  'https://render.albiononline.com/v1/item/${result.fullJournalId}?count=1&quality=1&size=48',
                  width: 40,
                  height: 40,
                  errorBuilder: (context, error, stackTrace) =>
                      const Icon(LucideIcons.bookOpen, color: akOrange),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appText(context, 'T{tier} {name} journal')
                            .replaceAll('{tier}', '${result.tier}')
                            .replaceAll(
                              '{name}',
                              appText(context, _labourer.name),
                            ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      Text(
                        appText(context, '{yield}% yield · {count} journals')
                            .replaceAll(
                              '{yield}',
                              result.yieldPercent.toStringAsFixed(0),
                            )
                            .replaceAll('{count}', '${result.journalCount}'),
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

  Future<void> _showDetails(LabourerProfitResult result) =>
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        backgroundColor: Theme.of(context).colorScheme.surface,
        builder: (context) => SafeArea(
          child: ConstrainedBox(
            key: const ValueKey('labourer-detail-sheet'),
            constraints: BoxConstraints(
              maxHeight: MediaQuery.sizeOf(context).height * .78,
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    appText(context, 'T{tier} {name}')
                        .replaceAll('{tier}', '${result.tier}')
                        .replaceAll(
                          '{name}',
                          appText(context, result.labourer.name),
                        ),
                    style: Theme.of(context).textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 14),
                  AkPanel(
                    child: Column(
                      children: [
                        ProfitDetailRow(
                          label: appText(context, 'Total profit'),
                          value: appText(
                            context,
                            '{amount} silver',
                          ).replaceAll('{amount}', formatSilver(result.profit)),
                          valueColor: result.profit >= 0 ? akGreen : akRed,
                        ),
                        ProfitDetailRow(
                          label: appText(context, 'Journal cost'),
                          value: appText(context, '{amount} silver').replaceAll(
                            '{amount}',
                            formatSilver(result.totalCost),
                          ),
                        ),
                        ProfitDetailRow(
                          label: appText(context, 'Empty journal resale'),
                          value: appText(context, '{amount} silver').replaceAll(
                            '{amount}',
                            formatSilver(result.emptyJournalRevenue),
                          ),
                        ),
                        ProfitDetailRow(
                          label: appText(context, 'Returned materials'),
                          value: appText(context, '{amount} silver').replaceAll(
                            '{amount}',
                            formatSilver(result.materialRevenue),
                          ),
                        ),
                        ProfitDetailRow(
                          label: appText(context, 'ROI'),
                          value: '${result.roi.toStringAsFixed(1)}%',
                        ),
                        ProfitDetailRow(
                          label: appText(context, 'House happiness yield'),
                          value: '${result.yieldPercent.toStringAsFixed(0)}%',
                        ),
                        for (final material in result.materials)
                          ProfitDetailRow(
                            label: material.itemId,
                            labelItemId: material.itemId,
                            repository: widget.repository,
                            value:
                                appText(context, '{quantity} × {amount} silver')
                                    .replaceAll(
                                      '{quantity}',
                                      material.quantity.toStringAsFixed(1),
                                    )
                                    .replaceAll(
                                      '{amount}',
                                      formatSilver(material.price),
                                    ),
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
        AkSectionTitle(appText(context, 'Labourer guide')),
        const SizedBox(height: 8),
        Text(
          appText(
            context,
            'House happiness is estimated from the selected house tier: matching or exceeding journal tier gives 150% yield; every tier below reduces yield by 10 percentage points.',
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
