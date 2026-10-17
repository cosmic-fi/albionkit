import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../localization/app_text.dart';

const akOrange = Color(0xFFD97706);
const akGreen = Color(0xFF10B981);
const akRed = Color(0xFFEF4444);

Color akMutedOf(BuildContext context) =>
    Theme.of(context).colorScheme.onSurfaceVariant;
Color akSurfaceOf(BuildContext context) =>
    Theme.of(context).colorScheme.surfaceContainerLow;
Color akSurfaceRaisedOf(BuildContext context) =>
    Theme.of(context).colorScheme.surfaceContainerHighest;
Color akBorderOf(BuildContext context) =>
    Theme.of(context).colorScheme.outlineVariant;

void akUnfocusOnTapOutside(PointerDownEvent event) {
  FocusManager.instance.primaryFocus?.unfocus();
}

String formatSilver(num value) {
  final rounded = value.round();
  return rounded.toString().replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (_) => ',',
  );
}

class StackQuantityInputFormatter extends TextInputFormatter {
  const StackQuantityInputFormatter();

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text;
    if (text.isEmpty) return newValue;
    if (!RegExp(r'^\d+$').hasMatch(text)) return oldValue;
    final quantity = int.tryParse(text);
    if (quantity == null || quantity <= 999) return newValue;
    return const TextEditingValue(
      text: '999',
      selection: TextSelection.collapsed(offset: 3),
    );
  }
}

class AkPageHeading extends StatelessWidget {
  const AkPageHeading({
    super.key,
    required this.title,
    required this.subtitle,
    this.eyebrow,
  });

  final String title;
  final String subtitle;
  final String? eyebrow;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (eyebrow != null) ...[
          Text(
            eyebrow!.toUpperCase(),
            style: const TextStyle(
              color: akOrange,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.4,
            ),
          ),
          const SizedBox(height: 8),
        ],
        Text(
          title,
          style: Theme.of(context).textTheme.headlineMedium
              ?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -0.8),
        ),
        const SizedBox(height: 6),
        Text(
          subtitle,
          style: TextStyle(color: akMutedOf(context), height: 1.4),
        ),
      ],
    );
  }
}

class AkPanel extends StatelessWidget {
  const AkPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(padding: padding, child: child),
    );
  }
}

class AkMessagePanel extends StatelessWidget {
  const AkMessagePanel({
    super.key,
    required this.title,
    required this.message,
    this.icon = LucideIcons.info,
    this.isError = false,
    this.onRetry,
  });

  final String title;
  final String message;
  final IconData icon;
  final bool isError;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final accent = isError ? akRed : akOrange;
    return AkPanel(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: accent),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: TextStyle(color: akMutedOf(context), height: 1.4),
                ),
                if (onRetry != null) ...[
                  const SizedBox(height: 12),
                  TextButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(LucideIcons.refreshCw),
                    label: Text(appText(context, 'Try again')),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AkSectionTitle extends StatelessWidget {
  const AkSectionTitle(this.title, {super.key, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
          ),
        ),
        ?trailing,
      ],
    );
  }
}

class AkTag extends StatelessWidget {
  const AkTag(this.label, {super.key, this.color = akOrange});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
