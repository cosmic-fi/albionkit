import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models/specialized_profit_models.dart';
import '../../data/repositories/albionkit_repository.dart';
import '../widgets/ak_widgets.dart';
import '../widgets/localized_item_name.dart';
import '../localization/app_text.dart';
import '../widgets/profit_tool_widgets.dart';

class AlchemyProfitScreen extends StatefulWidget {
  const AlchemyProfitScreen({
    super.key,
    required this.region,
    required this.repository,
  });

  final String region;
  final AlbionKitRepository repository;

  @override
  State<AlchemyProfitScreen> createState() => _AlchemyProfitScreenState();
}

class _AlchemyProfitScreenState extends State<AlchemyProfitScreen> {
  final _quantityController = TextEditingController(text: '5');
  final _usageFeeController = TextEditingController(text: '400');
  final _returnRateController = TextEditingController();
  final _ingredientCities = <String, String>{};
  Timer? _loadTimer;
  String _region = '';
  String _category = 'poison';
  String? _recipeId;
  String _sellCity = 'Martlock';
  bool _enchanted = false;
  bool _advanced = false;
  bool _premium = true;
  bool _sellOrder = true;
  bool _includeSellFees = true;
  bool _dailyBonus = false;
  bool _useFocus = false;
  bool _loading = false;
  int _loadGeneration = 0;
  String? _error;
  List<AlchemyProfitResult> _results = const [];

  static const _categories = [
    (id: 'poison', label: 'Poison'),
    (id: 'heal', label: 'Healing'),
    (id: 'energy', label: 'Energy'),
    (id: 'resist', label: 'Resistance'),
    (id: 'haste', label: 'Haste'),
    (id: 'berserk', label: 'Berserk'),
    (id: 'cleanse', label: 'Cleanse'),
    (id: 'special', label: 'Special'),
  ];

  List<AlchemyRecipe> get _categoryRecipes =>
      AlbionKitRepository.alchemyRecipes.where((recipe) {
        if (_category == 'special') {
          return recipe.id == 'focus-restoration' ||
              recipe.id == 'invisibility';
        }
        return recipe.id.startsWith('$_category-');
      }).toList();

  AlchemyRecipe? get _selectedRecipe {
    for (final recipe in AlbionKitRepository.alchemyRecipes) {
      if (recipe.id == _recipeId) return recipe;
    }
    return null;
  }

  int get _quantity =>
      (int.tryParse(_quantityController.text) ?? 5).clamp(1, 999);
  int get _usageFee =>
      (int.tryParse(_usageFeeController.text) ?? 400).clamp(0, 1000000);
  double get _returnRate {
    final custom = double.tryParse(_returnRateController.text) ?? 0;
    if (custom > 0) return custom.clamp(0, 100);
    if (_useFocus) return 43.5;
    return 15.2 + (_dailyBonus ? 10 : 0);
  }

  @override
  void initState() {
    super.initState();
    _region = widget.region;
    _recipeId = _categoryRecipes.first.id;
    _load();
  }

  @override
  void didUpdateWidget(covariant AlchemyProfitScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.region != widget.region) {
      _region = widget.region;
      _load();
    }
  }

  @override
  void dispose() {
    _loadTimer?.cancel();
    _quantityController.dispose();
    _usageFeeController.dispose();
    _returnRateController.dispose();
    super.dispose();
  }

  void _unfocus() => FocusManager.instance.primaryFocus?.unfocus();

  void _scheduleLoad() {
    _loadTimer?.cancel();
    _loadTimer = Timer(const Duration(milliseconds: 350), _load);
  }

  Future<void> _load() async {
    final recipe = _selectedRecipe;
    if (recipe == null) return;
    final generation = ++_loadGeneration;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await widget.repository.getAlchemyProfits(
        region: _region,
        recipeId: recipe.id,
        sellCity: _sellCity,
        ingredientCities: {
          for (final ingredient in recipe.ingredients)
            ingredient.itemId:
                _ingredientCities[ingredient.itemId] ?? 'Martlock',
        },
        quantity: _quantity,
        enchanted: _enchanted,
        premium: _premium,
        sellOrder: _sellOrder,
        includeSellFees: _includeSellFees,
        returnRate: _returnRate,
        usageFee: _usageFee,
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
    title: appText(context, 'Alchemy profits'),
    eyebrow: appText(context, 'PROFIT CALCULATOR'),
    subtitle: appText(
      context,
      'Compare potion costs, market returns and enchanted variants.',
    ),
    onRefresh: _load,
    children: [
      _buildCategoryPicker(),
      const SizedBox(height: 12),
      _buildFilters(),
      const SizedBox(height: 16),
      _buildResults(),
      const SizedBox(height: 20),
      _buildGuide(),
    ],
  );

  Widget _buildCategoryPicker() => SingleChildScrollView(
    scrollDirection: Axis.horizontal,
    child: Row(
      children: [
        for (final category in _categories) ...[
          ChoiceChip(
            key: ValueKey('alchemy-category-${category.id}'),
            label: Text(_alchemyCategoryLabel(category.id)),
            selected: _category == category.id,
            onSelected: (_) {
              _unfocus();
              setState(() {
                _category = category.id;
                _recipeId = _categoryRecipes.first.id;
                _ingredientCities.clear();
                _results = const [];
              });
              _load();
            },
          ),
          const SizedBox(width: 8),
        ],
      ],
    ),
  );

  Widget _buildFilters() {
    final recipe = _selectedRecipe;
    return AkPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          OutlinedButton(
            key: const ValueKey('alchemy-recipe-picker'),
            onPressed: _pickRecipe,
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              alignment: Alignment.centerLeft,
            ),
            child: Row(
              children: [
                Expanded(
                  child: recipe == null
                      ? Text(appText(context, 'Select potion'))
                      : LocalizedItemName(
                          repository: widget.repository,
                          itemId: recipe.idForOutput,
                          fallback: recipe.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                ),
                const Icon(LucideIcons.chevronDown, size: 18),
              ],
            ),
          ),
          const SizedBox(height: 12),
          ProfitCityField(
            key: const ValueKey('alchemy-sell-city'),
            title: appText(context, 'Sell potions in'),
            city: _sellCity,
            onChanged: (city) {
              setState(() => _sellCity = city);
              _load();
            },
          ),
          const SizedBox(height: 15),
          TextField(
            key: const ValueKey('alchemy-usage-fee'),
            controller: _usageFeeController,
            autofocus: false,
            keyboardType: TextInputType.number,
            onTapOutside: akUnfocusOnTapOutside,
            decoration: InputDecoration(
              labelText: appText(context, 'Station usage fee'),
              prefixIcon: Icon(LucideIcons.coins),
            ),
            onChanged: (_) => _scheduleLoad(),
          ),
          const SizedBox(height: 15),
          TextField(
            key: const ValueKey('alchemy-quantity'),
            controller: _quantityController,
            autofocus: false,
            keyboardType: TextInputType.number,
            inputFormatters: const [StackQuantityInputFormatter()],
            onTapOutside: akUnfocusOnTapOutside,
            decoration: InputDecoration(
              labelText: appText(context, 'Potion quantity'),
              prefixIcon: Icon(LucideIcons.hash),
              helperText: appText(context, 'Maximum 999 items per stack'),
            ),
            onChanged: (_) => _scheduleLoad(),
            onSubmitted: (_) {
              _unfocus();
              _load();
            },
          ),
          const SizedBox(height: 8),
          ProfitModeToggle(
            key: const ValueKey('alchemy-enchanted-toggle'),
            title: appText(context, 'Enchanted variants'),
            subtitle: appText(
              context,
              'Compare .1, .2 and .3 potions and enchanted herbs.',
            ),
            value: _enchanted,
            onChanged: (value) {
              _unfocus();
              setState(() => _enchanted = value);
              _load();
            },
            color: akGreen,
          ),
          const Divider(height: 24),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              key: const ValueKey('alchemy-advanced-settings'),
              onPressed: () {
                _unfocus();
                setState(() => _advanced = !_advanced);
              },
              icon: Icon(
                _advanced ? LucideIcons.chevronUp : LucideIcons.settings2,
                size: 16,
              ),
              label: Text(
                _advanced
                    ? appText(context, 'Hide advanced settings')
                    : appText(context, 'Advanced settings'),
              ),
            ),
          ),
          if (_advanced) ...[
            const SizedBox(height: 8),
            TextField(
              key: const ValueKey('alchemy-return-rate'),
              controller: _returnRateController,
              autofocus: false,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              onTapOutside: akUnfocusOnTapOutside,
              decoration: InputDecoration(
                labelText: appText(context, 'Custom resource return rate %'),
                helperText: appText(
                  context,
                  'Current effective rate: {rate}%',
                ).replaceAll('{rate}', _returnRate.toStringAsFixed(1)),
                prefixIcon: const Icon(LucideIcons.rotateCcw),
              ),
              onChanged: (_) => _scheduleLoad(),
            ),
            const SizedBox(height: 8),
            ProfitModeToggle(
              key: const ValueKey('alchemy-premium-toggle'),
              title: appText(context, 'Premium'),
              subtitle: appText(
                context,
                'Use the premium marketplace tax rate.',
              ),
              value: _premium,
              onChanged: (value) {
                setState(() => _premium = value);
                _load();
              },
              color: akGreen,
            ),
            ProfitModeToggle(
              key: const ValueKey('alchemy-daily-bonus-toggle'),
              title: appText(context, 'Daily bonus'),
              subtitle: appText(
                context,
                'Adds 10 percentage points to resource return.',
              ),
              value: _dailyBonus,
              onChanged: (value) {
                setState(() => _dailyBonus = value);
                _load();
              },
            ),
            ProfitModeToggle(
              key: const ValueKey('alchemy-focus-toggle'),
              title: appText(context, 'Focus'),
              subtitle: appText(
                context,
                'Uses the 43.5% focus resource return rate.',
              ),
              value: _useFocus,
              onChanged: (value) {
                setState(() => _useFocus = value);
                _load();
              },
            ),
            ProfitModeToggle(
              key: const ValueKey('alchemy-sell-order-toggle'),
              title: appText(context, 'Sell order'),
              subtitle: appText(context, 'Include the 2.5% sell order fee.'),
              value: _sellOrder,
              onChanged: (value) {
                setState(() => _sellOrder = value);
                _load();
              },
            ),
            ProfitModeToggle(
              key: const ValueKey('alchemy-sell-fees-toggle'),
              title: appText(context, 'Include sell fees'),
              subtitle: appText(
                context,
                'Apply market tax and enabled sell-order fees.',
              ),
              value: _includeSellFees,
              onChanged: (value) {
                setState(() => _includeSellFees = value);
                _load();
              },
            ),
            if (recipe != null) ...[
              const Divider(height: 24),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  appText(context, 'Ingredient sourcing'),
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
              for (final ingredient in recipe.ingredients)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: ProfitCityField(
                    key: ValueKey('alchemy-ingredient-${ingredient.itemId}'),
                    title: ingredient.name,
                    city: _ingredientCities[ingredient.itemId] ?? 'Martlock',
                    titleItemId: ingredient.itemId,
                    repository: widget.repository,
                    onChanged: (city) {
                      setState(
                        () => _ingredientCities[ingredient.itemId] = city,
                      );
                      _load();
                    },
                  ),
                ),
            ],
          ],
          if (_loading) ...[
            const SizedBox(height: 8),
            const LinearProgressIndicator(minHeight: 2),
          ],
        ],
      ),
    );
  }

  Future<void> _pickRecipe() async {
    _unfocus();
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
                  appText(context, 'Choose {category} potion').replaceAll(
                    '{category}',
                    _alchemyCategoryLabel(_category).toLowerCase(),
                  ),
                  style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 12),
                for (final recipe in _categoryRecipes)
                  ListTile(
                    key: ValueKey('alchemy-recipe-option-${recipe.id}'),
                    leading: Image.network(
                      'https://render.albiononline.com/v1/item/${recipe.idForOutput}?count=1&quality=1&size=48',
                      width: 36,
                      height: 36,
                      errorBuilder: (context, error, stackTrace) =>
                          const Icon(LucideIcons.flaskConical),
                    ),
                    title: LocalizedItemName(
                      repository: widget.repository,
                      itemId: recipe.idForOutput,
                      fallback: recipe.name,
                    ),
                    subtitle: Text(
                      appText(context, 'Tier {tier} · Yield {yield}')
                          .replaceAll('{tier}', '${recipe.tier}')
                          .replaceAll('{yield}', '${recipe.batchYield}'),
                    ),
                    trailing: recipe.id == _recipeId
                        ? const Icon(LucideIcons.check, color: akOrange)
                        : null,
                    onTap: () => Navigator.of(context).pop(recipe.id),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
    if (selected != null && mounted) {
      setState(() {
        _recipeId = selected;
        _ingredientCities.clear();
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
        title: appText(context, 'No potion results'),
        message: appText(context, 'Select a recipe and refresh market prices.'),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AkSectionTitle(appText(context, 'Potion profit results')),
        const SizedBox(height: 10),
        for (final result in _results) _resultCard(result),
      ],
    );
  }

  Widget _resultCard(AlchemyProfitResult result) {
    final color = result.profit >= 0 ? akGreen : akRed;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: ValueKey('alchemy-result-${result.productId}'),
          borderRadius: BorderRadius.circular(18),
          onTap: () {
            _unfocus();
            _showDetails(result);
          },
          child: AkPanel(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                Image.network(
                  'https://render.albiononline.com/v1/item/${result.productId}?count=1&quality=1&size=48',
                  width: 40,
                  height: 40,
                  errorBuilder: (context, error, stackTrace) =>
                      const Icon(LucideIcons.flaskConical, color: akOrange),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      LocalizedItemName(
                        repository: widget.repository,
                        itemId: result.productId,
                        fallback: result.recipe.name,
                        suffix: result.enchantment > 0
                            ? ' .${result.enchantment}'
                            : '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      Text(
                        appText(context, 'T{tier} · {quantity} potions')
                            .replaceAll('{tier}', '${result.recipe.tier}')
                            .replaceAll('{quantity}', '${result.quantity}'),
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
                        appText(
                          context,
                          '{value}% ROI',
                        ).replaceAll('{value}', result.roi.toStringAsFixed(1)),
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
    AlchemyProfitResult result,
  ) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Theme.of(context).colorScheme.surface,
    builder: (context) => SafeArea(
      child: ConstrainedBox(
        key: const ValueKey('alchemy-detail-sheet'),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * .78,
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              LocalizedItemName(
                repository: widget.repository,
                itemId: result.productId,
                fallback: result.recipe.name,
                suffix: result.enchantment > 0 ? ' .${result.enchantment}' : '',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 14),
              AkPanel(
                child: Column(
                  children: [
                    ProfitDetailRow(
                      label: appText(context, 'Revenue after sell fees'),
                      value: appText(
                        context,
                        '{amount} silver',
                      ).replaceAll('{amount}', formatSilver(result.revenue)),
                    ),
                    ProfitDetailRow(
                      label: appText(context, 'Ingredient cost after RRR'),
                      value: appText(context, '{amount} silver').replaceAll(
                        '{amount}',
                        formatSilver(result.ingredientCost),
                      ),
                    ),
                    ProfitDetailRow(
                      label: appText(context, 'Station fee'),
                      value: appText(
                        context,
                        '{amount} silver',
                      ).replaceAll('{amount}', formatSilver(result.stationFee)),
                    ),
                    ProfitDetailRow(
                      label: appText(context, 'Total cost'),
                      value: appText(
                        context,
                        '{amount} silver',
                      ).replaceAll('{amount}', formatSilver(result.totalCost)),
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
                    for (final item in result.ingredients)
                      ProfitDetailRow(
                        label: '${item.ingredient.name} · ${item.city}',
                        labelItemId: item.itemId,
                        labelSuffix: ' · ${item.city}',
                        repository: widget.repository,
                        value: appText(context, '{quantity} × {price} silver')
                            .replaceAll(
                              '{quantity}',
                              item.quantity.toStringAsFixed(1),
                            )
                            .replaceAll(
                              '{price}',
                              formatSilver(item.unitPrice),
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
        AkSectionTitle(appText(context, 'Alchemy guide')),
        const SizedBox(height: 8),
        Text(
          appText(
            context,
            'Estimates use market prices in your selected cities, recipe yield, resource return rate, station fee and enabled sales fees. Prices are refreshed with pull-to-refresh.',
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

  String _alchemyCategoryLabel(String id) {
    final source = _categories
        .firstWhere((category) => category.id == id)
        .label;
    return appText(context, source);
  }
}
