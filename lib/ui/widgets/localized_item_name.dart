import 'package:flutter/material.dart';

import '../../data/repositories/albionkit_repository.dart';
import '../localization/app_text.dart';

class LocalizedItemName extends StatefulWidget {
  const LocalizedItemName({
    super.key,
    required this.repository,
    required this.itemId,
    required this.fallback,
    this.suffix = '',
    this.style,
    this.maxLines,
    this.overflow,
  });

  final AlbionKitRepository repository;
  final String itemId;
  final String fallback;
  final String suffix;
  final TextStyle? style;
  final int? maxLines;
  final TextOverflow? overflow;

  @override
  State<LocalizedItemName> createState() => _LocalizedItemNameState();
}

class _LocalizedItemNameState extends State<LocalizedItemName> {
  String? _languageCode;
  late Future<String?> _localizedName;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final languageCode = Localizations.localeOf(context).languageCode;
    if (_languageCode != languageCode) {
      _languageCode = languageCode;
      _loadName();
    }
  }

  @override
  void didUpdateWidget(covariant LocalizedItemName oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.repository != widget.repository ||
        oldWidget.itemId != widget.itemId) {
      _loadName();
    }
  }

  void _loadName() {
    _localizedName = widget.repository.getLocalizedItemName(
      widget.itemId,
      languageCode: _languageCode ?? 'en',
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String?>(
      future: _localizedName,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return _LocalizedNameSkeleton(
            maxLines: widget.maxLines ?? 1,
            style: widget.style,
          );
        }
        final localizedName = snapshot.data;
        final text = Text(
          '${localizedName?.isNotEmpty == true ? localizedName! : widget.fallback}${widget.suffix}',
          maxLines: widget.maxLines,
          overflow: widget.overflow,
          style: widget.style,
        );
        if (snapshot.hasError) {
          return Tooltip(
            message: appText(
              context,
              'Could not resolve the item name: {error}',
            ).replaceAll('{error}', snapshot.error.toString()),
            child: text,
          );
        }
        return text;
      },
    );
  }
}

class _LocalizedNameSkeleton extends StatelessWidget {
  const _LocalizedNameSkeleton({required this.maxLines, this.style});

  final int maxLines;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.onSurface
        .withValues(alpha: .09);
    final fontSize = style?.fontSize ?? 14;
    final lineHeight = fontSize * (style?.height ?? 1.2);
    final lineCount = maxLines.clamp(1, 2);

    return ExcludeSemantics(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(lineCount, (index) {
          final widthFactor = index == 0 ? .68 : .42;
          return Padding(
            padding: EdgeInsets.only(
              bottom: index == 0 && lineCount > 1 ? 4 : 0,
            ),
            child: FractionallySizedBox(
              widthFactor: widthFactor,
              alignment: Alignment.centerLeft,
              child: SizedBox(
                height: lineHeight,
                child: DecoratedBox(
                  key: index == 0
                      ? const ValueKey('localized-item-name-skeleton')
                      : null,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(fontSize / 2),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
