import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/repositories/albionkit_repository.dart';
import 'ak_widgets.dart';
import 'localized_item_name.dart';

const profitMarketCities = [
  'Martlock',
  'Bridgewatch',
  'Lymhurst',
  'Fort Sterling',
  'Thetford',
  'Caerleon',
  'Brecilien',
  'Black Market',
];

class ProfitCityField extends StatelessWidget {
  const ProfitCityField({
    super.key,
    required this.title,
    required this.city,
    required this.onChanged,
    this.titleItemId,
    this.repository,
  });

  final String title;
  final String city;
  final ValueChanged<String> onChanged;
  final String? titleItemId;
  final AlbionKitRepository? repository;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (titleItemId != null && repository != null)
          LocalizedItemName(
            repository: repository!,
            itemId: titleItemId!,
            fallback: title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: .6,
            ),
          )
        else
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
          key: key,
          onPressed: () async {
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
                        if (titleItemId != null && repository != null)
                          LocalizedItemName(
                            repository: repository!,
                            itemId: titleItemId!,
                            fallback: title,
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.w800),
                          )
                        else
                          Text(
                            title,
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                        const SizedBox(height: 12),
                        for (final option in profitMarketCities)
                          ListTile(
                            key: ValueKey('profit-city-option-$option'),
                            leading: Icon(
                              LucideIcons.mapPin,
                              color: option == city
                                  ? akOrange
                                  : akMutedOf(context),
                            ),
                            title: Text(option),
                            trailing: option == city
                                ? const Icon(LucideIcons.check, color: akOrange)
                                : null,
                            onTap: () => Navigator.of(context).pop(option),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            );
            if (selected != null && selected != city) onChanged(selected);
          },
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
            alignment: Alignment.centerLeft,
          ),
          child: Row(
            children: [
              Icon(LucideIcons.mapPin, size: 15, color: akMutedOf(context)),
              const SizedBox(width: 8),
              Expanded(child: Text(city, overflow: TextOverflow.ellipsis)),
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
}

class ProfitCityPair extends StatelessWidget {
  const ProfitCityPair({
    super.key,
    required this.firstTitle,
    required this.firstCity,
    required this.onFirstChanged,
    required this.secondTitle,
    required this.secondCity,
    required this.onSecondChanged,
  });

  final String firstTitle;
  final String firstCity;
  final ValueChanged<String> onFirstChanged;
  final String secondTitle;
  final String secondCity;
  final ValueChanged<String> onSecondChanged;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final first = ProfitCityField(
          key: ValueKey('profit-city-${firstTitle.toLowerCase()}'),
          title: firstTitle,
          city: firstCity,
          onChanged: onFirstChanged,
        );
        final second = ProfitCityField(
          key: ValueKey('profit-city-${secondTitle.toLowerCase()}'),
          title: secondTitle,
          city: secondCity,
          onChanged: onSecondChanged,
        );
        if (constraints.maxWidth < 440) {
          return Column(children: [first, const SizedBox(height: 12), second]);
        }
        return Row(
          children: [
            Expanded(child: first),
            const SizedBox(width: 12),
            Expanded(child: second),
          ],
        );
      },
    );
  }
}

class ProfitDetailRow extends StatelessWidget {
  const ProfitDetailRow({
    super.key,
    required this.label,
    required this.value,
    this.valueColor,
    this.labelItemId,
    this.repository,
    this.labelSuffix,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final String? labelItemId;
  final AlbionKitRepository? repository;
  final String? labelSuffix;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: labelItemId != null && repository != null
                ? Row(
                    children: [
                      Expanded(
                        child: LocalizedItemName(
                          repository: repository!,
                          itemId: labelItemId!,
                          fallback: label,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: akMutedOf(context),
                            fontSize: 12,
                          ),
                        ),
                      ),
                      if (labelSuffix != null)
                        Text(
                          labelSuffix!,
                          style: TextStyle(
                            color: akMutedOf(context),
                            fontSize: 12,
                          ),
                        ),
                    ],
                  )
                : Text(
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
}

class ProfitModeToggle extends StatelessWidget {
  const ProfitModeToggle({
    super.key,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    this.color = akOrange,
  });

  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  final Color color;

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
        Switch(
          value: value,
          activeThumbColor: color,
          onChanged: (selected) {
            FocusManager.instance.primaryFocus?.unfocus();
            onChanged(selected);
          },
        ),
      ],
    );
  }
}

class ProfitToolScaffold extends StatelessWidget {
  const ProfitToolScaffold({
    super.key,
    required this.title,
    required this.eyebrow,
    required this.subtitle,
    required this.onRefresh,
    required this.children,
  });

  final String title;
  final String eyebrow;
  final String subtitle;
  final Future<void> Function() onRefresh;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: RefreshIndicator(
        color: akOrange,
        onRefresh: onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          children: [
            AkPageHeading(eyebrow: eyebrow, title: title, subtitle: subtitle),
            const SizedBox(height: 20),
            ...children,
          ],
        ),
      ),
    );
  }
}
