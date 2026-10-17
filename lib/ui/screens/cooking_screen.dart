import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models/cooking_models.dart';
import '../../data/repositories/albionkit_repository.dart';
import '../widgets/ak_widgets.dart';
import '../widgets/localized_item_name.dart';
import '../localization/app_text.dart';

class CookingProfitScreen extends StatefulWidget {
  const CookingProfitScreen({
    super.key,
    required this.region,
    required this.repository,
  });

  final String region;
  final AlbionKitRepository repository;

  @override
  State<CookingProfitScreen> createState() => _CookingProfitScreenState();
}

class _CookingProfitScreenState extends State<CookingProfitScreen> {
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

  static const _categories = [
    (id: 'stew', label: 'Stews'),
    (id: 'sandwich', label: 'Sandwiches'),
    (id: 'soup', label: 'Soups'),
    (id: 'roast', label: 'Roasts'),
    (id: 'pie', label: 'Pies'),
    (id: 'omelette', label: 'Omelettes'),
    (id: 'salad', label: 'Salads'),
  ];

  final _quantityController = TextEditingController(text: '10');
  final _returnRateController = TextEditingController();
  final _usageFeeController = TextEditingController(text: '680');
  final Map<String, String> _ingredientCities = {};
  Timer? _filterTimer;
  String _category = 'stew';
  String? _recipeId;
  String _sellCity = 'Martlock';
  bool _enchanted = false;
  bool _advanced = false;
  bool _includeBuyTax = true;
  bool _includeSellTax = true;
  bool _sellOrder = true;
  bool _dailyBonus = false;
  bool _useFocus = false;
  bool _loading = false;
  int _loadGeneration = 0;
  String? _error;
  List<CookingProfitResult> _results = const [];
  String _region = '';

  CookingRecipe? get _selectedRecipe {
    for (final recipe in AlbionKitRepository.cookingRecipes) {
      if (recipe.id == _recipeId) return recipe;
    }
    return null;
  }

  List<CookingRecipe> get _categoryRecipes => AlbionKitRepository.cookingRecipes
      .where((recipe) => recipe.category == _category)
      .toList();

  @override
  void initState() {
    super.initState();
    _region = widget.region;
  }

  @override
  void didUpdateWidget(covariant CookingProfitScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.region != widget.region) {
      _region = widget.region;
      _load();
    }
  }

  @override
  void dispose() {
    _filterTimer?.cancel();
    _quantityController.dispose();
    _returnRateController.dispose();
    _usageFeeController.dispose();
    super.dispose();
  }

  int get _quantity {
    final value = int.tryParse(_quantityController.text) ?? 10;
    return value.clamp(1, 999);
  }

  double? get _customReturnRate {
    final value = double.tryParse(_returnRateController.text);
    if (value == null || value <= 0) return null;
    return value.clamp(0, 100);
  }

  int get _usageFee {
    final value = int.tryParse(_usageFeeController.text) ?? 0;
    return value.clamp(0, 1000000);
  }

  void _scheduleLoad() {
    _filterTimer?.cancel();
    _filterTimer = Timer(const Duration(milliseconds: 400), _load);
  }

  void _unfocusInputs() {
    FocusManager.instance.primaryFocus?.unfocus();
  }

  Future<void> _load() async {
    final recipe = _selectedRecipe;
    if (recipe == null) {
      setState(() {
        _results = const [];
        _error = null;
        _loading = false;
      });
      return;
    }
    final generation = ++_loadGeneration;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await widget.repository.getCookingProfits(
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
        includeBuyTax: _includeBuyTax,
        includeSellTax: _includeSellTax,
        sellOrder: _sellOrder,
        dailyBonus: _dailyBonus,
        useFocus: _useFocus,
        customReturnRate: _customReturnRate,
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
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(appText(context, 'Cooking profits'))),
      body: RefreshIndicator(
        color: akOrange,
        onRefresh: _load,
        child: ListView(
          key: const ValueKey('cooking-profit-scroll-view'),
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          children: [
            AkPageHeading(
              eyebrow: appText(context, 'PROFIT CALCULATOR'),
              title: appText(context, 'Cooking'),
              subtitle: appText(
                context,
                'Compare live meal costs, returns and crafting profit.',
              ),
            ),
            const SizedBox(height: 18),
            _buildCategorySelector(context),
            const SizedBox(height: 14),
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

  Widget _buildCategorySelector(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final category in _categories) ...[
            ChoiceChip(
              key: ValueKey('cooking-category-${category.id}'),
              label: Text(_categoryLabel(category.id)),
              selected: _category == category.id,
              onSelected: (_) {
                _unfocusInputs();
                setState(() {
                  _category = category.id;
                  _recipeId = null;
                  _results = const [];
                  _error = null;
                });
              },
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }

  Widget _buildFilters(BuildContext context) {
    final recipe = _selectedRecipe;
    return AkPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final recipeField = _selectionField(
                label: appText(context, 'Recipe'),
                value: recipe?.name ?? appText(context, 'Select recipe'),
                itemId: recipe?.productId,
                icon: LucideIcons.utensils,
                onTap: _pickRecipe,
              );
              final cityField = _selectionField(
                label: appText(context, 'Sell to'),
                value: _sellCity,
                icon: LucideIcons.mapPin,
                onTap: () async {
                  _unfocusInputs();
                  final city = await _pickCity(
                    appText(context, 'Choose sell city'),
                    _sellCity,
                  );
                  if (city != null && mounted) {
                    setState(() => _sellCity = city);
                    _load();
                  }
                },
              );
              if (constraints.maxWidth < 420) {
                return Column(
                  children: [
                    recipeField,
                    const SizedBox(height: 12),
                    cityField,
                  ],
                );
              }
              return Row(
                children: [
                  Expanded(child: recipeField),
                  const SizedBox(width: 12),
                  Expanded(child: cityField),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          TextField(
            key: const ValueKey('cooking-quantity'),
            controller: _quantityController,
            autofocus: false,
            keyboardType: TextInputType.number,
            inputFormatters: const [StackQuantityInputFormatter()],
            decoration: InputDecoration(
              labelText: appText(context, 'Quantity'),
              isDense: true,
              prefixIcon: Icon(LucideIcons.calculator),
              helperText: appText(context, 'Maximum 999 items per stack'),
            ),
            onChanged: (_) => _scheduleLoad(),
            onTapOutside: akUnfocusOnTapOutside,
            onEditingComplete: () {
              _quantityController.text = '$_quantity';
              FocusScope.of(context).unfocus();
              _load();
            },
          ),
          const SizedBox(height: 12),
          _CookingToggle(
            key: const ValueKey('cooking-enchanted'),
            title: appText(context, 'Enchanted meals'),
            subtitle: appText(
              context,
              'Include .1, .2 and .3 meal variants with fish sauce.',
            ),
            value: _enchanted,
            onChanged: (value) {
              _unfocusInputs();
              setState(() => _enchanted = value);
              _load();
            },
          ),
          const Divider(height: 24),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              key: const ValueKey('cooking-advanced-settings'),
              onPressed: () {
                _unfocusInputs();
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
            _buildAdvancedSettings(context, recipe),
          ],
          const SizedBox(height: 8),
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

  Widget _selectionField({
    required String label,
    required String value,
    String? itemId,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: .6,
          ),
        ),
        const SizedBox(height: 6),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: onTap,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
              alignment: Alignment.centerLeft,
            ),
            child: Row(
              children: [
                Icon(icon, size: 15, color: akMutedOf(context)),
                const SizedBox(width: 8),
                Expanded(
                  child: itemId == null
                      ? Text(value, overflow: TextOverflow.ellipsis)
                      : LocalizedItemName(
                          repository: widget.repository,
                          itemId: itemId,
                          fallback: value,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
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
        ),
      ],
    );
  }

  Widget _buildAdvancedSettings(BuildContext context, CookingRecipe? recipe) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _CookingToggle(
          title: appText(context, 'Include buy tax'),
          subtitle: appText(context, 'Add 2.5% to ingredient purchase costs.'),
          value: _includeBuyTax,
          onChanged: (value) {
            _unfocusInputs();
            setState(() => _includeBuyTax = value);
            _load();
          },
        ),
        _CookingToggle(
          title: appText(context, 'Include sell tax'),
          subtitle: appText(context, 'Subtract 4% from meal sale revenue.'),
          value: _includeSellTax,
          onChanged: (value) {
            _unfocusInputs();
            setState(() => _includeSellTax = value);
            _load();
          },
        ),
        _CookingToggle(
          title: appText(context, 'Sell order setup fee'),
          subtitle: appText(
            context,
            'Subtract 2.5% when selling with an active sell order.',
          ),
          value: _sellOrder,
          onChanged: (value) {
            _unfocusInputs();
            setState(() => _sellOrder = value);
            _load();
          },
        ),
        const Divider(height: 24),
        AkSectionTitle(appText(context, 'Resource return')),
        _CookingToggle(
          title: appText(context, 'Daily bonus'),
          subtitle: appText(context, 'Use a 25.2% resource return rate.'),
          value: _dailyBonus,
          onChanged: (value) {
            _unfocusInputs();
            setState(() => _dailyBonus = value);
            _load();
          },
        ),
        _CookingToggle(
          title: appText(context, 'Use Focus'),
          subtitle: appText(context, 'Use a 43.5% resource return rate.'),
          value: _useFocus,
          onChanged: (value) {
            _unfocusInputs();
            setState(() => _useFocus = value);
            _load();
          },
        ),
        const SizedBox(height: 8),
        TextField(
          key: const ValueKey('cooking-return-rate'),
          controller: _returnRateController,
          autofocus: false,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: appText(context, 'Custom RRR %'),
            hintText: appText(context, 'Automatic'),
            isDense: true,
          ),
          onChanged: (_) => _scheduleLoad(),
          onTapOutside: akUnfocusOnTapOutside,
        ),
        const Divider(height: 24),
        AkSectionTitle(appText(context, 'Station fee')),
        const SizedBox(height: 8),
        TextField(
          key: const ValueKey('cooking-usage-fee'),
          controller: _usageFeeController,
          autofocus: false,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: appText(context, 'Usage fee per 100 nutrition'),
            isDense: true,
          ),
          onChanged: (_) => _scheduleLoad(),
          onTapOutside: akUnfocusOnTapOutside,
        ),
        if (recipe != null) ...[
          const Divider(height: 24),
          AkSectionTitle(
            appText(context, 'Ingredient sourcing'),
            trailing: Text(
              appText(
                context,
                '{count} items',
              ).replaceAll('{count}', '${recipe.ingredients.length}'),
              style: TextStyle(color: akMutedOf(context), fontSize: 12),
            ),
          ),
          const SizedBox(height: 6),
          for (final ingredient in recipe.ingredients)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        LocalizedItemName(
                          repository: widget.repository,
                          itemId: ingredient.itemId,
                          fallback: ingredient.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        Text(
                          ingredient.itemId,
                          style: TextStyle(
                            color: akMutedOf(context),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 142),
                    child: OutlinedButton(
                      key: ValueKey('cooking-source-${ingredient.itemId}'),
                      onPressed: () async {
                        _unfocusInputs();
                        final currentCity =
                            _ingredientCities[ingredient.itemId] ?? 'Martlock';
                        final city = await _pickCity(
                          appText(
                            context,
                            'Buy {item} in',
                          ).replaceAll('{item}', ingredient.name),
                          currentCity,
                        );
                        if (city != null && mounted) {
                          setState(
                            () => _ingredientCities[ingredient.itemId] = city,
                          );
                          _load();
                        }
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 8,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            LucideIcons.mapPin,
                            size: 14,
                            color: akMutedOf(context),
                          ),
                          const SizedBox(width: 5),
                          Flexible(
                            child: Text(
                              _ingredientCities[ingredient.itemId] ??
                                  'Martlock',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 2),
                          Icon(
                            LucideIcons.chevronDown,
                            size: 14,
                            color: akMutedOf(context),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
        const SizedBox(height: 8),
      ],
    );
  }

  Future<void> _pickRecipe() async {
    _unfocusInputs();
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
                  appText(context, 'Choose {category} recipe').replaceAll(
                    '{category}',
                    _categoryLabel(_category).toLowerCase(),
                  ),
                  style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                for (final recipe in _categoryRecipes)
                  ListTile(
                    key: ValueKey('cooking-recipe-option-${recipe.id}'),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                    leading: _itemIcon(recipe.productId, size: 36),
                    title: LocalizedItemName(
                      repository: widget.repository,
                      itemId: recipe.productId,
                      fallback: recipe.name,
                    ),
                    subtitle: Text(
                      appText(context, 'Tier {tier} · Yield {yield}')
                          .replaceAll('{tier}', '${recipe.tier}')
                          .replaceAll('{yield}', '${recipe.yield}'),
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
        _results = const [];
      });
      _load();
    }
  }

  Future<String?> _pickCity(String title, String selectedCity) {
    _unfocusInputs();
    return showModalBottomSheet<String>(
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
                const SizedBox(height: 10),
                for (final city in _cities)
                  ListTile(
                    key: ValueKey('cooking-city-option-$city'),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                    leading: Icon(
                      LucideIcons.mapPin,
                      color: city == selectedCity
                          ? akOrange
                          : akMutedOf(context),
                    ),
                    title: Text(city),
                    trailing: city == selectedCity
                        ? const Icon(LucideIcons.check, color: akOrange)
                        : null,
                    onTap: () => Navigator.of(context).pop(city),
                  ),
              ],
            ),
          ),
        ),
      ),
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
    if (_selectedRecipe == null) {
      return AkMessagePanel(
        title: appText(context, 'Select a recipe to begin'),
        message: appText(
          context,
          'Choose a meal from the {category} list.',
        ).replaceAll('{category}', _categoryLabel(_category)),
        icon: LucideIcons.utensils,
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
        title: appText(context, 'No cooking data available'),
        message: appText(context, 'Pull down to refresh market prices.'),
        icon: LucideIcons.utensils,
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AkSectionTitle(
          appText(context, 'Profit results'),
          trailing: Text(
            appText(
              context,
              _results.length == 1 ? '{count} variant' : '{count} variants',
            ).replaceAll('{count}', '${_results.length}'),
            style: TextStyle(color: akMutedOf(context), fontSize: 12),
          ),
        ),
        const SizedBox(height: 10),
        for (final result in _results) _resultCard(context, result),
      ],
    );
  }

  Widget _resultCard(BuildContext context, CookingProfitResult result) {
    final profitColor = result.profit >= 0 ? akGreen : akRed;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: ValueKey('cooking-result-${result.productId}'),
          borderRadius: BorderRadius.circular(18),
          onTap: () {
            _unfocusInputs();
            _showResultDetails(result);
          },
          child: AkPanel(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                _itemIcon(result.productId, size: 42),
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
                            ? ' (T${result.recipe.tier}.${result.enchantment})'
                            : '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        appText(context, 'T{tier} · {quantity} made')
                            .replaceAll('{tier}', '${result.recipe.tier}')
                            .replaceAll('{quantity}', '${result.quantity}'),
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
                  width: 112,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (result.warning == null)
                        Text(
                          appText(context, '{amount} silver').replaceAll(
                              '{amount}',
                              formatSilver(result.profit),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.end,
                          style: TextStyle(
                              color: profitColor,
                              fontWeight: FontWeight.w800,
                          ),
                        )
                      else if (result.missingItemIds.isNotEmpty)
                        _LocalizedCookingWarning(
                          repository: widget.repository,
                          result: result,
                        )
                      else
                        Text(
                          appText(context, result.warning!),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.end,
                          style: const TextStyle(
                              color: akOrange,
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

  Future<void> _showResultDetails(CookingProfitResult result) {
    final profitColor = result.profit >= 0 ? akGreen : akRed;
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      builder: (context) => SafeArea(
        child: ConstrainedBox(
          key: const ValueKey('cooking-item-details-sheet'),
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
                    _itemIcon(result.productId, size: 52),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          LocalizedItemName(
                            repository: widget.repository,
                            itemId: result.productId,
                            fallback: result.recipe.name,
                            suffix: result.enchantment > 0
                                ? ' (T${result.recipe.tier}.${result.enchantment})'
                                : '',
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          Text(
                            appText(
                                  context,
                                  'Yield {yield} · Quantity {quantity} · Sell in {city}',
                                )
                                .replaceAll('{yield}', '${result.recipe.yield}')
                                .replaceAll('{quantity}', '${result.quantity}')
                                .replaceAll('{city}', _sellCity),
                            style: TextStyle(color: akMutedOf(context)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                AkPanel(
                  child: Column(
                    children: [
                      _detailLine(
                        appText(context, 'Revenue after sale fees'),
                        appText(
                          context,
                          '{amount} silver',
                        ).replaceAll('{amount}', formatSilver(result.revenue)),
                      ),
                      _detailLine(
                        appText(context, 'Ingredient cost after RRR'),
                        appText(context, '{amount} silver').replaceAll(
                          '{amount}',
                          formatSilver(result.ingredientCost),
                        ),
                      ),
                      if (result.sauceCost > 0)
                        _detailLine(
                          '${result.sauceName} cost',
                          appText(context, '{amount} silver').replaceAll(
                            '{amount}',
                            formatSilver(result.sauceCost),
                          ),
                        ),
                      _detailLine(
                        appText(context, 'Station fee'),
                        appText(context, '{amount} silver').replaceAll(
                          '{amount}',
                          formatSilver(result.stationFee),
                        ),
                      ),
                      _detailLine(
                        appText(context, 'Total cost'),
                        appText(context, '{amount} silver').replaceAll(
                          '{amount}',
                          formatSilver(result.totalCost),
                        ),
                      ),
                      _detailLine(
                        appText(context, 'Net profit'),
                        appText(
                          context,
                          '{amount} silver',
                        ).replaceAll('{amount}', formatSilver(result.profit)),
                        valueColor: profitColor,
                      ),
                      _detailLine(
                        appText(context, 'ROI'),
                        '${result.roi.toStringAsFixed(1)}%',
                      ),
                      _detailLine(
                        appText(context, 'Effective resource return'),
                        '${result.returnRate.toStringAsFixed(1)}%',
                      ),
                      _detailLine(
                        appText(context, 'Market volume (24h)'),
                        formatSilver(result.productVolume),
                      ),
                      _detailLine(
                        appText(context, 'Total weight'),
                        result.totalWeight.toStringAsFixed(1),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                AkSectionTitle(appText(context, 'Ingredients')),
                const SizedBox(height: 8),
                AkPanel(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      for (final price in result.ingredients) ...[
                        _ingredientLine(price),
                        if (price != result.ingredients.last)
                          const Divider(height: 1, indent: 14, endIndent: 14),
                      ],
                    ],
                  ),
                ),
                if (result.missingItemIds.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _LocalizedCookingWarning(
                    repository: widget.repository,
                    result: result,
                  ),
                ],
                if (result.warning != null) ...[
                  const SizedBox(height: 12),
                  if (result.missingItemIds.isEmpty)
                    Text(
                      appText(context, 'No market price'),
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

  Widget _ingredientLine(CookingIngredientPrice price) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          Expanded(
            flex: 6,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LocalizedItemName(
                  repository: widget.repository,
                  itemId: price.ingredient.itemId,
                  fallback: price.ingredient.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                Text(
                  '${price.quantity.toStringAsFixed(1)} × ${formatSilver(price.unitPrice)} · ${price.city}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: akMutedOf(context), fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 4,
            child: Text(
              appText(
                context,
                '{amount} silver',
              ).replaceAll('{amount}', formatSilver(price.totalCost.round())),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.end,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
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
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
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
    return Column(
      children: [
        AkPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AkSectionTitle(appText(context, 'Cooking guide')),
              const SizedBox(height: 10),
              _guideText(
                appText(
                  context,
                  'Meal recipes produce 10 items per craft. Ingredient requirements scale with the requested quantity.',
                ),
              ),
              _guideText(
                appText(
                  context,
                  'Resource return reduces ingredient costs. Focus, daily bonus, or a custom rate can be used in advanced settings.',
                ),
              ),
              _guideText(
                appText(
                  context,
                  'Enchanted meals add fish sauce costs and show .1, .2 and .3 market variants.',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        AkPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AkSectionTitle(appText(context, 'Market data')),
              const SizedBox(height: 10),
              _guideText(
                appText(
                  context,
                  'Prices use the lowest available sell order from each selected ingredient source city and the meal destination city.',
                ),
              ),
              _guideText(
                appText(
                  context,
                  'Ingredient buy taxes, sale taxes, sell-order setup fees and station fees are configurable.',
                ),
              ),
              _guideText(
                appText(
                  context,
                  'Market prices and 24-hour volume are provided by the Albion Online Data Project.',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _guideText(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 7),
    child: Text(
      text,
      style: TextStyle(color: akMutedOf(context), fontSize: 12, height: 1.45),
    ),
  );

  Widget _itemIcon(String itemId, {required double size}) {
    return Image.network(
      'https://render.albiononline.com/v1/item/$itemId?count=1&quality=1&size=64',
      width: size,
      height: size,
      errorBuilder: (context, error, stackTrace) =>
          Icon(LucideIcons.utensils, color: akOrange, size: size * .6),
    );
  }

  String _categoryLabel(String id) {
    final source = _categories
        .firstWhere((category) => category.id == id)
        .label;
    return appText(context, source);
  }
}

class _CookingToggle extends StatelessWidget {
  const _CookingToggle({
    super.key,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                Text(
                  subtitle,
                  style: TextStyle(color: akMutedOf(context), fontSize: 11),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: akOrange,
          ),
        ],
      ),
    );
  }
}

class _LocalizedCookingWarning extends StatelessWidget {
  const _LocalizedCookingWarning({
    required this.repository,
    required this.result,
  });

  final AlbionKitRepository repository;
  final CookingProfitResult result;

  String _fallbackName(String itemId) {
    final canonicalId = itemId.split('@').first.toUpperCase();
    if (result.productId.split('@').first.toUpperCase() == canonicalId) {
      return result.recipe.name;
    }
    for (final ingredient in result.ingredients) {
      if (ingredient.ingredient.itemId.split('@').first.toUpperCase() ==
          canonicalId) {
        return ingredient.ingredient.name;
      }
    }
    if (result.sauceId?.split('@').first.toUpperCase() == canonicalId) {
      return result.sauceName ?? itemId;
    }
    return itemId;
  }

  @override
  Widget build(BuildContext context) {
    final style = TextStyle(
      color: akOrange,
      fontSize: 12,
      fontWeight: FontWeight.w700,
    );
    return Wrap(
      alignment: WrapAlignment.end,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 3,
      runSpacing: 3,
      children: [
        Text('${appText(context, 'No market price')}:', style: style),
        for (var index = 0; index < result.missingItemIds.length; index++) ...[
          if (index > 0) Text(',', style: style),
          LocalizedItemName(
            repository: repository,
            itemId: result.missingItemIds[index],
            fallback: _fallbackName(result.missingItemIds[index]),
            style: style,
          ),
        ],
      ],
    );
  }
}
