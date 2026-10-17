import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../localization/app_text.dart';
import '../settings/app_language.dart';
import '../settings/app_settings_controller.dart';
import '../widgets/app_language_selector.dart';
import '../widgets/ak_widgets.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    super.key,
    required this.settings,
    required this.region,
  });

  final AppSettingsController settings;
  final String region;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final TextEditingController _thresholdController;
  TextEditingController? _flipProfitController;
  late final Future<PackageInfo> _packageInfo;
  ThemeMode? _draftThemeModeValue;
  bool? _draftBanditAlertsEnabledValue;
  int? _draftBanditReminderMinutesValue;
  bool? _draftFlipAlertsEnabledValue;
  bool? _draftGoldAlertsEnabledValue;
  String? _draftGoldAlertDirectionValue;
  bool _saving = false;

  ThemeMode get _draftThemeMode =>
      _draftThemeModeValue ?? widget.settings.themeMode;
  bool get _draftBanditAlertsEnabled =>
      _draftBanditAlertsEnabledValue ?? widget.settings.banditAlertsEnabled;
  int get _draftBanditReminderMinutes =>
      _draftBanditReminderMinutesValue ?? widget.settings.banditReminderMinutes;
  bool get _draftFlipAlertsEnabled =>
      _draftFlipAlertsEnabledValue ?? widget.settings.flipAlertsEnabled;
  bool get _draftGoldAlertsEnabled =>
      _draftGoldAlertsEnabledValue ?? widget.settings.goldAlertsEnabled;
  String get _draftGoldAlertDirection =>
      _draftGoldAlertDirectionValue ?? widget.settings.goldAlertDirection;

  TextEditingController get _flipProfitTextController =>
      _flipProfitController ??= TextEditingController(
        text: widget.settings.flipMinimumProfit.toString(),
      )..addListener(_onDraftChanged);

  int get _draftFlipMinimumProfit =>
      int.tryParse(_flipProfitTextController.text.trim()) ??
      widget.settings.flipMinimumProfit;

  int get _draftGoldThreshold =>
      int.tryParse(_thresholdController.text.trim()) ??
      widget.settings.goldThreshold;

  bool get _hasUnsavedChanges =>
      _draftThemeMode != widget.settings.themeMode ||
      _draftBanditAlertsEnabled != widget.settings.banditAlertsEnabled ||
      _draftBanditReminderMinutes != widget.settings.banditReminderMinutes ||
      _draftFlipAlertsEnabled != widget.settings.flipAlertsEnabled ||
      _draftFlipMinimumProfit != widget.settings.flipMinimumProfit ||
      _draftGoldAlertsEnabled != widget.settings.goldAlertsEnabled ||
      _draftGoldThreshold != widget.settings.goldThreshold ||
      _draftGoldAlertDirection != widget.settings.goldAlertDirection ||
      int.tryParse(_thresholdController.text.trim()) == null ||
      (_draftFlipAlertsEnabled &&
          int.tryParse(_flipProfitTextController.text.trim()) == null);

  @override
  void initState() {
    super.initState();
    _draftThemeModeValue = widget.settings.themeMode;
    _draftBanditAlertsEnabledValue = widget.settings.banditAlertsEnabled;
    _draftBanditReminderMinutesValue = widget.settings.banditReminderMinutes;
    _draftFlipAlertsEnabledValue = widget.settings.flipAlertsEnabled;
    _draftGoldAlertsEnabledValue = widget.settings.goldAlertsEnabled;
    _draftGoldAlertDirectionValue = widget.settings.goldAlertDirection;
    _thresholdController = TextEditingController(
      text: widget.settings.goldThreshold.toString(),
    )..addListener(_onDraftChanged);
    _packageInfo = PackageInfo.fromPlatform();
  }

  @override
  void dispose() {
    _thresholdController.dispose();
    _flipProfitController?.dispose();
    super.dispose();
  }

  void _onDraftChanged() {
    if (mounted) setState(() {});
  }

  Future<bool> _saveChanges() async {
    final goldThreshold = int.tryParse(_thresholdController.text.trim());
    if (goldThreshold == null || goldThreshold < 1) {
      _showMessage(
        appText(context, 'Enter a valid silver price greater than zero.'),
      );
      return false;
    }
    final flipMinimumProfit = int.tryParse(
      _flipProfitTextController.text.trim(),
    );
    if (flipMinimumProfit == null || flipMinimumProfit < 0) {
      _showMessage(
        appText(context, 'Enter a non-negative minimum flip profit.'),
      );
      return false;
    }

    setState(() => _saving = true);
    try {
      final saved = await widget.settings.saveSettings(
        themeMode: _draftThemeMode,
        banditAlertsEnabled: _draftBanditAlertsEnabled,
        banditReminderMinutes: _draftBanditReminderMinutes,
        flipAlertsEnabled: _draftFlipAlertsEnabled,
        flipMinimumProfit: flipMinimumProfit,
        goldAlertsEnabled: _draftGoldAlertsEnabled,
        goldThreshold: goldThreshold,
        goldAlertDirection: _draftGoldAlertDirection,
        region: widget.region,
      );
      if (!mounted) return false;
      if (!saved) {
        _showMessage(
          widget.settings.notificationsSupported
              ? appText(
                  context,
                  'Allow notifications in your device settings to enable alerts.',
                )
              : appText(
                  context,
                  'Local notifications are available on Android and iOS devices.',
                ),
        );
        return false;
      }
      _showMessage(appText(context, 'Settings saved.'));
      return true;
    } catch (error) {
      if (mounted) {
        _showMessage(
          appText(
            context,
            'Could not save settings: {error}',
          ).replaceAll('{error}', '$error'),
        );
      }
      return false;
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<bool> _confirmLeave() async {
    final choice = await showDialog<_LeaveSettingsChoice>(
      context: context,
      builder: (context) => _UnsavedChangesDialog(
        onKeepEditing: () =>
            Navigator.of(context).pop(_LeaveSettingsChoice.keepEditing),
        onDiscard: () =>
            Navigator.of(context).pop(_LeaveSettingsChoice.discard),
      ),
    );
    if (!mounted ||
        choice == null ||
        choice == _LeaveSettingsChoice.keepEditing) {
      return false;
    }
    if (choice == _LeaveSettingsChoice.discard) return true;
    return false;
  }

  Future<void> _handlePop(bool didPop) async {
    if (didPop || _saving || !_hasUnsavedChanges) return;
    _unfocusInputs();
    final shouldLeave = await _confirmLeave();
    if (shouldLeave && mounted) Navigator.of(context).pop();
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  void _unfocusInputs() {
    FocusManager.instance.primaryFocus?.unfocus();
  }

  Future<void> _openExternalLink(Uri uri) async {
    _unfocusInputs();
    try {
      final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!opened && mounted) {
        _showMessage(
          appText(
            context,
            'Could not open {host}.',
          ).replaceAll('{host}', uri.host),
        );
      }
    } catch (error) {
      if (mounted) {
        _showMessage(
          appText(
            context,
            'Could not open {host}: {error}',
          ).replaceAll('{host}', uri.host).replaceAll('{error}', '$error'),
        );
      }
    }
  }

  Future<void> _selectLanguage(AppLanguage language) async {
    try {
      await widget.settings.setLanguage(language.code);
    } catch (error) {
      if (mounted) {
        _showMessage(
          appText(
            context,
            'Could not save language preference: {error}',
          ).replaceAll('{error}', '$error'),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return PopScope(
      canPop: !_hasUnsavedChanges && !_saving,
      onPopInvokedWithResult: (didPop, _) => _handlePop(didPop),
      child: Scaffold(
        appBar: AppBar(
          title: Text(appText(context, 'Settings')),
          actions: [
            TextButton.icon(
              key: const ValueKey('save-settings'),
              onPressed: _hasUnsavedChanges && !_saving
                  ? () {
                      _unfocusInputs();
                      _saveChanges();
                    }
                  : null,
              label: Text(
                _saving ? appText(context, 'Saving') : appText(context, 'Save'),
              ),
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: ListView(
          key: const ValueKey('settings-list'),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            AkPageHeading(
              title: appText(context, 'Preferences'),
              subtitle: appText(
                context,
                'Choose a theme and manage your alerts.',
              ),
            ),
            const SizedBox(height: 26),
            AkPanel(
              child: AppLanguageSelector(
                language: AppLanguage.fromCode(widget.settings.languageCode)!,
                onChanged: _selectLanguage,
              ),
            ),
            const SizedBox(height: 24),
            AkSectionTitle(appText(context, 'Appearance')),
            const SizedBox(height: 10),
            AkPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    appText(context, 'Theme'),
                    style: Theme.of(context).textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    appText(
                      context,
                      'Choose light, dark, or follow your device setting.',
                    ),
                    style: TextStyle(color: akMutedOf(context), fontSize: 12),
                  ),
                  const SizedBox(height: 14),
                  SegmentedButton<ThemeMode>(
                    segments: [
                      ButtonSegment(
                        value: ThemeMode.light,
                        label: Text(appText(context, 'Light')),
                        icon: Icon(LucideIcons.sun),
                      ),
                      ButtonSegment(
                        value: ThemeMode.dark,
                        label: Text(appText(context, 'Dark')),
                        icon: Icon(LucideIcons.moon),
                      ),
                      ButtonSegment(
                        value: ThemeMode.system,
                        label: Text(appText(context, 'System')),
                        icon: Icon(LucideIcons.sunMoon),
                      ),
                    ],
                    selected: {_draftThemeMode},
                    onSelectionChanged: (selected) {
                      _unfocusInputs();
                      setState(() => _draftThemeModeValue = selected.first);
                    },
                    showSelectedIcon: false,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            AkSectionTitle(appText(context, 'Smart alerts')),
            const SizedBox(height: 10),
            AkPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: _draftBanditAlertsEnabled,
                    onChanged: (enabled) {
                      _unfocusInputs();
                      setState(() => _draftBanditAlertsEnabledValue = enabled);
                    },
                    title: Text(
                      appText(context, 'Bandit assault'),
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle: Text(
                      appText(
                        context,
                        'A local reminder before the next {region} window.',
                      ).replaceAll('{region}', widget.region.toUpperCase()),
                      style: TextStyle(color: akMutedOf(context), fontSize: 12),
                    ),
                    secondary: const Icon(LucideIcons.swords, color: akOrange),
                  ),
                  if (_draftBanditAlertsEnabled) ...[
                    const SizedBox(height: 8),
                    DropdownButtonFormField<int>(
                      initialValue: _draftBanditReminderMinutes,
                      decoration: InputDecoration(
                        labelText: appText(context, 'Remind me before'),
                        prefixIcon: Icon(LucideIcons.clock3),
                      ),
                      items: const [5, 10, 15, 30]
                          .map(
                            (minutes) => DropdownMenuItem(
                              value: minutes,
                              child: Text(
                                appText(
                                  context,
                                  '{minutes} minutes',
                                ).replaceAll('{minutes}', '$minutes'),
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (minutes) {
                        if (minutes != null) {
                          _unfocusInputs();
                          setState(
                            () => _draftBanditReminderMinutesValue = minutes,
                          );
                        }
                      },
                    ),
                  ],
                  const SizedBox(height: 8),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: _draftFlipAlertsEnabled,
                    onChanged: (enabled) {
                      _unfocusInputs();
                      setState(() => _draftFlipAlertsEnabledValue = enabled);
                    },
                    title: Text(
                      appText(context, 'Valuable market flips'),
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle: Text(
                      appText(
                        context,
                        'Checks for qualifying flips when you open or refresh the Flips list.',
                      ),
                      style: TextStyle(color: akMutedOf(context), fontSize: 12),
                    ),
                    secondary: const Icon(
                      LucideIcons.chartNoAxesCombined,
                      color: akOrange,
                    ),
                  ),
                  if (_draftFlipAlertsEnabled) ...[
                    const SizedBox(height: 8),
                    TextField(
                      controller: _flipProfitTextController,
                      keyboardType: TextInputType.number,
                      autofocus: false,
                      onTapOutside: akUnfocusOnTapOutside,
                      decoration: InputDecoration(
                        labelText: appText(context, 'Minimum flip profit'),
                        suffixText: appText(context, 'silver'),
                        prefixIcon: Icon(LucideIcons.coins),
                        helperText: appText(
                          context,
                          'Enter any non-negative silver amount',
                        ),
                      ),
                    ),
                  ],
                  const Divider(height: 28),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: _draftGoldAlertsEnabled,
                    onChanged: (enabled) {
                      _unfocusInputs();
                      setState(() => _draftGoldAlertsEnabledValue = enabled);
                    },
                    title: Text(
                      appText(context, 'Gold price alert'),
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle: Text(
                      appText(
                        context,
                        'Checks your target when you open or refresh Gold prices.',
                      ),
                      style: TextStyle(color: akMutedOf(context), fontSize: 12),
                    ),
                    secondary: const Icon(
                      LucideIcons.bellRing,
                      color: akOrange,
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _thresholdController,
                    keyboardType: TextInputType.number,
                    autofocus: false,
                    onTapOutside: akUnfocusOnTapOutside,
                    decoration: InputDecoration(
                      labelText: appText(context, 'Target price'),
                      suffixText: appText(context, 'silver / gold'),
                      prefixIcon: Icon(LucideIcons.coins),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SegmentedButton<String>(
                    segments: [
                      ButtonSegment(
                        value: 'above',
                        label: Text(appText(context, 'At or above')),
                        icon: Icon(LucideIcons.trendingUp),
                      ),
                      ButtonSegment(
                        value: 'below',
                        label: Text(appText(context, 'At or below')),
                        icon: Icon(LucideIcons.trendingDown),
                      ),
                    ],
                    selected: {_draftGoldAlertDirection},
                    onSelectionChanged: (selected) {
                      _unfocusInputs();
                      setState(
                        () => _draftGoldAlertDirectionValue = selected.first,
                      );
                    },
                    showSelectedIcon: false,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.settings.notificationsSupported
                        ? appText(
                            context,
                            'Gold and flip alerts are checked when market data is refreshed. Flip alerts only fire once per new opportunity. Bandit reminders can arrive while the app is closed.',
                          )
                        : appText(
                            context,
                            'Web preview does not support local notifications. Gold and flip rules are saved and checked on Android or iOS when market data is refreshed.',
                          ),
                    style: TextStyle(
                      color: akMutedOf(context),
                      fontSize: 11,
                      height: 1.45,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            AkPanel(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(LucideIcons.shieldCheck, color: colors.onSurfaceVariant),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      appText(
                        context,
                        'Your preferences stay on this device. Alert rules are local and do not require an AlbionKit account.',
                      ),
                      style: TextStyle(
                        color: akMutedOf(context),
                        fontSize: 12,
                        height: 1.45,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            AkSectionTitle(appText(context, 'Legal & about')),
            const SizedBox(height: 10),
            AkPanel(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _ExternalLinkTile(
                    icon: LucideIcons.shieldCheck,
                    title: appText(context, 'Privacy Policy'),
                    onTap: () => _openExternalLink(
                      Uri.https('albionkit.com', '/privacy'),
                    ),
                  ),
                  const Divider(height: 1, indent: 56),
                  _ExternalLinkTile(
                    icon: LucideIcons.fileText,
                    title: appText(context, 'Terms of Service'),
                    onTap: () =>
                        _openExternalLink(Uri.https('albionkit.com', '/terms')),
                  ),
                  const Divider(height: 1, indent: 56),
                  _ExternalLinkTile(
                    icon: LucideIcons.cookie,
                    title: appText(context, 'Cookie Policy'),
                    onTap: () => _openExternalLink(
                      Uri.https('albionkit.com', '/cookies'),
                    ),
                  ),
                  const Divider(height: 1, indent: 56),
                  _ExternalLinkTile(
                    icon: LucideIcons.globe,
                    title: appText(context, 'AlbionKit website'),
                    onTap: () => _openExternalLink(Uri.https('albionkit.com')),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            FutureBuilder<PackageInfo>(
              future: _packageInfo,
              builder: (context, snapshot) {
                final versionText = switch (snapshot.connectionState) {
                  ConnectionState.done when snapshot.hasData =>
                    appText(context, 'Version {version} ({build})')
                        .replaceAll('{version}', snapshot.data!.version)
                        .replaceAll('{build}', snapshot.data!.buildNumber),
                  ConnectionState.done => appText(
                    context,
                    'Version unavailable',
                  ),
                  _ => appText(context, 'Loading version…'),
                };
                return Column(
                  children: [
                    Text(
                      versionText,
                      key: const ValueKey('app-version'),
                      style: TextStyle(
                        color: akMutedOf(context),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      appText(
                        context,
                        'AlbionKit is a fan-made companion and is not affiliated with or endorsed by Sandbox Interactive GmbH.',
                      ),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: akMutedOf(context),
                        fontSize: 10,
                        height: 1.4,
                      ),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

enum _LeaveSettingsChoice { keepEditing, discard }

class _UnsavedChangesDialog extends StatelessWidget {
  const _UnsavedChangesDialog({
    required this.onKeepEditing,
    required this.onDiscard,
  });

  final VoidCallback onKeepEditing;
  final VoidCallback onDiscard;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Dialog(
      key: const ValueKey('unsaved-settings-dialog'),
      insetPadding: const EdgeInsets.symmetric(horizontal: 28),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 26, 24, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: akOrange.withValues(alpha: .12),
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.save, color: akOrange, size: 26),
            ),
            const SizedBox(height: 18),
            Text(
              appText(context, 'Unsaved changes'),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            Text(
              appText(
                context,
                'Your settings have changed. Discard your edits or keep editing.',
              ),
              textAlign: TextAlign.center,
              style: TextStyle(color: colors.onSurfaceVariant, height: 1.45),
            ),
            const SizedBox(height: 22),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: onDiscard,
                    child: Text(appText(context, 'Discard')),
                  ),
                ),
                Expanded(
                  child: OutlinedButton(
                    onPressed: onKeepEditing,
                    child: Text(appText(context, 'Keep editing')),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ExternalLinkTile extends StatelessWidget {
  const _ExternalLinkTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: akOrange),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
      trailing: Icon(
        LucideIcons.arrowUpRight,
        size: 18,
        color: akMutedOf(context),
      ),
      onTap: onTap,
    );
  }
}
