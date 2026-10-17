import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models/animal_models.dart';
import '../../data/repositories/albionkit_repository.dart';
import '../widgets/ak_widgets.dart';
import '../widgets/localized_item_name.dart';
import '../localization/app_text.dart';

class AnimalBreedingProfitScreen extends StatefulWidget {
  const AnimalBreedingProfitScreen({
    super.key,
    required this.region,
    required this.repository,
  });

  final String region;
  final AlbionKitRepository repository;

  @override
  State<AnimalBreedingProfitScreen> createState() =>
      _AnimalBreedingProfitScreenState();
}

class _AnimalBreedingProfitScreenState
    extends State<AnimalBreedingProfitScreen> {
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

  final _quantityController = TextEditingController(text: '10');
  Timer? _loadTimer;
  String _activity = 'breeding';
  String _buyCity = 'Martlock';
  String _sellCity = 'Martlock';
  String _region = '';
  bool _premium = true;
  bool _favoriteFood = true;
  bool _useFocus = false;
  bool _loading = false;
  int _loadGeneration = 0;
  String? _error;
  List<AnimalProfitResult> _results = const [];

  int get _quantity =>
      (int.tryParse(_quantityController.text) ?? 10).clamp(1, 999);

  @override
  void initState() {
    super.initState();
    _region = widget.region;
    _load();
  }

  @override
  void didUpdateWidget(covariant AnimalBreedingProfitScreen oldWidget) {
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
    super.dispose();
  }

  void _scheduleLoad() {
    _loadTimer?.cancel();
    _loadTimer = Timer(const Duration(milliseconds: 350), _load);
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
      final results = await widget.repository.getAnimalProfits(
        region: _region,
        activity: _activity,
        buyCity: _buyCity,
        sellCity: _sellCity,
        quantity: _quantity,
        premium: _premium,
        favoriteFood: _favoriteFood,
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
      appBar: AppBar(title: Text(appText(context, 'Animal breeding'))),
      body: RefreshIndicator(
        color: akOrange,
        onRefresh: _load,
        child: ListView(
          key: const ValueKey('animal-breeding-scroll-view'),
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          children: [
            AkPageHeading(
              eyebrow: appText(context, 'PROFIT CALCULATOR'),
              title: appText(context, 'Animal breeding'),
              subtitle: appText(
                context,
                'Compare breeding, animal products and butchering with live market prices.',
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
          SingleChildScrollView(
            key: const ValueKey('animal-activity-selector'),
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final mode in const [
                  (id: 'breeding', label: 'Breeding'),
                  (id: 'products', label: 'Products'),
                  (id: 'butchering', label: 'Butchering'),
                ]) ...[
                  ChoiceChip(
                    key: ValueKey('animal-activity-${mode.id}'),
                    label: Text(_activityLabel(mode.id)),
                    selected: _activity == mode.id,
                    onSelected: (_) {
                      _unfocusInputs();
                      setState(() {
                        _activity = mode.id;
                        _results = const [];
                        _error = null;
                      });
                      _load();
                    },
                  ),
                  const SizedBox(width: 8),
                ],
              ],
            ),
          ),
          const SizedBox(height: 18),
          LayoutBuilder(
            builder: (context, constraints) {
              final fields = [
                _cityField(
                  title: _activity == 'butchering'
                      ? appText(context, 'Buy grown animals from')
                      : _activity == 'products'
                      ? appText(context, 'Buy food from')
                      : appText(context, 'Buy babies and food from'),
                  value: _buyCity,
                  keyPrefix: 'buy',
                  onChanged: (city) {
                    setState(() => _buyCity = city);
                    _load();
                  },
                ),
                _cityField(
                  title: _activity == 'butchering'
                      ? appText(context, 'Sell meat to')
                      : _activity == 'products'
                      ? appText(context, 'Sell products to')
                      : appText(context, 'Sell grown animals to'),
                  value: _sellCity,
                  keyPrefix: 'sell',
                  onChanged: (city) {
                    setState(() => _sellCity = city);
                    _load();
                  },
                ),
              ];
              if (constraints.maxWidth < 480) {
                return Column(
                  children: [fields[0], const SizedBox(height: 12), fields[1]],
                );
              }
              return Row(
                children: [
                  Expanded(child: fields[0]),
                  const SizedBox(width: 12),
                  Expanded(child: fields[1]),
                ],
              );
            },
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(height: 1),
          ),
          TextField(
            key: const ValueKey('animal-quantity-input'),
            controller: _quantityController,
            autofocus: false,
            keyboardType: TextInputType.number,
            inputFormatters: const [StackQuantityInputFormatter()],
            textInputAction: TextInputAction.done,
            onTapOutside: akUnfocusOnTapOutside,
            decoration: InputDecoration(
              labelText: appText(context, 'Number of animals'),
              prefixIcon: Icon(LucideIcons.hash),
              helperText: appText(context, 'From 1 to 999 (one stack)'),
            ),
            onChanged: (_) => _scheduleLoad(),
            onSubmitted: (_) {
              _quantityController.text = '$_quantity';
              _unfocusInputs();
              _load();
            },
          ),
          const SizedBox(height: 12),
          _AnimalToggle(
            key: const ValueKey('animal-premium-toggle'),
            title: appText(context, 'Premium'),
            subtitle: _activity == 'products'
                ? appText(context, 'Doubles the expected product yield.')
                : appText(context, 'Halves the animal growth time.'),
            value: _premium,
            color: akGreen,
            onChanged: (value) {
              _unfocusInputs();
              setState(() => _premium = value);
              _load();
            },
          ),
          if (_activity != 'butchering') ...[
            const SizedBox(height: 8),
            _AnimalToggle(
              key: const ValueKey('animal-favorite-food-toggle'),
              title: appText(context, 'Favorite food'),
              subtitle: appText(context, 'Uses half the normal feed quantity.'),
              value: _favoriteFood,
              color: akOrange,
              onChanged: (value) {
                _unfocusInputs();
                setState(() => _favoriteFood = value);
                _load();
              },
            ),
          ],
          if (_activity == 'breeding') ...[
            const SizedBox(height: 8),
            _AnimalToggle(
              key: const ValueKey('animal-focus-toggle'),
              title: appText(context, 'Focus'),
              subtitle: appText(
                context,
                'Improves the expected offspring return rate.',
              ),
              value: _useFocus,
              color: akOrange,
              onChanged: (value) {
                _unfocusInputs();
                setState(() => _useFocus = value);
                _load();
              },
            ),
          ],
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
    required String keyPrefix,
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
          key: ValueKey('animal-city-$keyPrefix'),
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
                  (city) => ListTile(
                    key: ValueKey('animal-city-option-$city'),
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
                ),
              ],
            ),
          ),
        ),
      ),
    );
    if (city != null && city != selectedCity) onChanged(city);
  }

  Widget _buildResults(BuildContext context) {
    final title = switch (_activity) {
      'products' => appText(context, 'Product returns'),
      'butchering' => appText(context, 'Butchering returns'),
      _ => appText(context, 'Breeding returns'),
    };
    final subtitle = switch (_activity) {
      'products' => appText(context, 'Expected yield and silver per animal.'),
      'butchering' => appText(
        context,
        'Meat value less the grown-animal cost.',
      ),
      _ => appText(
        context,
        'Feed and baby cost against grown-animal and offspring value.',
      ),
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.w900),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(color: akMutedOf(context), fontSize: 12),
                  ),
                ],
              ),
            ),
            if (_loading)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (_error != null)
          AkPanel(
            child: Text(
              appText(
                context,
                'Could not load animal market data: {error}',
              ).replaceAll('{error}', _error ?? ''),
              style: const TextStyle(color: akRed),
            ),
          )
        else if (_results.isEmpty && !_loading)
          AkPanel(
            child: Text(
              appText(context, 'No animals are available for this mode.'),
            ),
          )
        else
          for (final result in _results) _buildResultCard(result),
      ],
    );
  }

  Widget _buildResultCard(AnimalProfitResult result) {
    final itemId = switch (_activity) {
      'products' => result.animal.produceId ?? result.animal.adultId,
      'butchering' => result.animal.meatId ?? result.animal.adultId,
      _ => result.animal.babyId,
    };
    final color = result.totalProfit >= 0 ? akGreen : akRed;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: ValueKey('animal-result-${result.animal.id}'),
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
                  'https://render.albiononline.com/v1/item/$itemId?count=1&quality=1&size=64',
                  width: 42,
                  height: 42,
                  errorBuilder: (context, error, stackTrace) =>
                      Icon(LucideIcons.pawPrint, color: akOrange),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      LocalizedItemName(
                        repository: widget.repository,
                        itemId: itemId,
                        fallback: result.animal.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        appText(context, 'T{tier} · {type}')
                            .replaceAll('{tier}', '${result.animal.tier}')
                            .replaceAll(
                              '{type}',
                              appText(context, result.animal.type),
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
                  width: 116,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
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

  Future<void> _showResultDetails(AnimalProfitResult result) {
    final itemId = switch (_activity) {
      'products' => result.animal.produceId ?? result.animal.adultId,
      'butchering' => result.animal.meatId ?? result.animal.adultId,
      _ => result.animal.babyId,
    };
    final profitColor = result.totalProfit >= 0 ? akGreen : akRed;
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      builder: (context) => SafeArea(
        child: ConstrainedBox(
          key: const ValueKey('animal-item-details-sheet'),
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
                      'https://render.albiononline.com/v1/item/$itemId?count=1&quality=1&size=64',
                      width: 52,
                      height: 52,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        LucideIcons.pawPrint,
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
                            itemId: itemId,
                            fallback: result.animal.name,
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          Text(
                            appText(context, 'T{tier} {type}')
                                .replaceAll('{tier}', '${result.animal.tier}')
                                .replaceAll(
                                  '{type}',
                                  appText(context, result.animal.type),
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
                        appText(
                          context,
                          'Total profit · {quantity} animals',
                        ).replaceAll('{quantity}', '${result.quantity}'),
                        appText(context, '{amount} silver').replaceAll(
                          '{amount}',
                          formatSilver(result.totalProfit),
                        ),
                        valueColor: profitColor,
                      ),
                      _detailLine(
                        appText(context, 'Profit per animal'),
                        appText(
                          context,
                          '{amount} silver',
                        ).replaceAll('{amount}', formatSilver(result.profit)),
                      ),
                      _detailLine(
                        appText(context, 'Return on investment'),
                        '${result.roi.toStringAsFixed(1)}%',
                      ),
                      _detailLine(
                        appText(context, 'Estimated cost'),
                        appText(
                          context,
                          '{amount} silver',
                        ).replaceAll('{amount}', formatSilver(result.cost)),
                      ),
                      _detailLine(
                        appText(context, 'Expected output revenue'),
                        appText(context, '{amount} silver').replaceAll(
                          '{amount}',
                          formatSilver(result.outputRevenue),
                        ),
                      ),
                      if (_activity == 'breeding') ...[
                        _detailLine(
                          'Baby price · ${result.buyCity}',
                          appText(context, '{amount} silver').replaceAll(
                            '{amount}',
                            formatSilver(result.babyPrice),
                          ),
                        ),
                        _detailLine(
                          'Grown animal price · ${result.sellCity}',
                          appText(context, '{amount} silver').replaceAll(
                            '{amount}',
                            formatSilver(result.adultPrice),
                          ),
                        ),
                        _detailLine(
                          appText(context, 'Offspring return rate'),
                          appText(context, '{rate}%').replaceAll(
                            '{rate}',
                            result.offspringReturnRate.toStringAsFixed(2),
                          ),
                        ),
                      ],
                      if (_activity != 'butchering') ...[
                        _detailLine(
                          'Feed · ${result.buyCity}',
                          appText(context, '{quantity} × {price} silver')
                              .replaceAll(
                                '{quantity}',
                                result.foodQuantity.toStringAsFixed(1),
                              )
                              .replaceAll(
                                '{price}',
                                formatSilver(result.foodPrice),
                              ),
                        ),
                        _detailLine(
                          appText(context, 'Feed cost'),
                          appText(context, '{amount} silver').replaceAll(
                            '{amount}',
                            formatSilver(result.foodCost),
                          ),
                        ),
                      ],
                      if (_activity == 'products')
                        _detailLine(
                          appText(context, 'Product yield'),
                          appText(context, '{yield} per animal').replaceAll(
                            '{yield}',
                            result.outputYield.toStringAsFixed(1),
                          ),
                        ),
                      if (_activity == 'butchering') ...[
                        _detailLine(
                          'Grown animal · ${result.buyCity}',
                          appText(context, '{amount} silver').replaceAll(
                            '{amount}',
                            formatSilver(result.adultPrice),
                          ),
                        ),
                        _detailLine(
                          appText(context, 'Meat yield'),
                          appText(context, '{yield} per animal').replaceAll(
                            '{yield}',
                            result.outputYield.toStringAsFixed(0),
                          ),
                        ),
                        _detailLine(
                          'Meat price · ${result.sellCity}',
                          appText(context, '{amount} silver').replaceAll(
                            '{amount}',
                            formatSilver(result.meatPrice),
                          ),
                        ),
                      ],
                      _detailLine(
                        appText(context, 'Growth time'),
                        appText(context, '{hours} hours · {cycles} cycles')
                            .replaceAll(
                              '{hours}',
                              result.growthHours.toStringAsFixed(1),
                            )
                            .replaceAll('{cycles}', '${result.animal.cycles}'),
                      ),
                      _detailLine(
                        appText(context, 'Premium'),
                        _premium
                            ? appText(context, 'Active')
                            : appText(context, 'Off'),
                      ),
                      if (_activity != 'butchering')
                        _detailLine(
                          appText(context, 'Favorite food'),
                          _favoriteFood
                              ? appText(context, 'Active')
                              : appText(context, 'Off'),
                        ),
                      if (_activity == 'breeding')
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
      padding: const EdgeInsets.symmetric(vertical: 6),
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
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: valueColor,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
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
          Row(
            children: [
              const Icon(LucideIcons.info, size: 17, color: akOrange),
              const SizedBox(width: 8),
              Text(
                appText(context, 'How estimates work'),
                style: Theme.of(context).textTheme.titleSmall
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            switch (_activity) {
              'products' => appText(
                context,
                'Product yield is based on the selected animal and Premium status. Feed cost uses the selected buy city and favorite-food setting.',
              ),
              'butchering' => appText(
                context,
                'Estimated meat value is compared with the grown animal purchase price. Sell and buy prices use your selected cities.',
              ),
              _ => appText(
                context,
                'Breeding estimates include baby purchase price, feed cost, grown-animal value and expected offspring return. Focus changes the expected offspring rate.',
              ),
            },
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

  String _activityLabel(String id) => appText(context, switch (id) {
    'products' => 'Products',
    'butchering' => 'Butchering',
    _ => 'Breeding',
  });
}

class _AnimalToggle extends StatelessWidget {
  const _AnimalToggle({
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
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
              Text(
                subtitle,
                style: TextStyle(color: akMutedOf(context), fontSize: 11),
              ),
            ],
          ),
        ),
        Switch(value: value, activeThumbColor: color, onChanged: onChanged),
      ],
    );
  }
}
