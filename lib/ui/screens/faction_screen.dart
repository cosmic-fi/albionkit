import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models/bandit_schedule.dart';
import '../localization/app_text.dart';
import '../settings/app_settings_controller.dart';
import '../widgets/ak_widgets.dart';

class FactionScreen extends StatefulWidget {
  const FactionScreen({
    super.key,
    required this.region,
    required this.settings,
  });

  final String region;
  final AppSettingsController settings;

  @override
  State<FactionScreen> createState() => _FactionScreenState();
}

class _FactionScreenState extends State<FactionScreen> {
  late Timer _timer;
  DateTime _now = DateTime.now().toUtc();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now().toUtc());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  Future<void> _toggleAlerts(bool enabled) async {
    try {
      final accepted = await widget.settings.setBanditAlertsEnabled(
        enabled,
        region: widget.region,
      );
      if (!accepted && mounted) {
        final message = widget.settings.notificationsSupported
            ? appText(
                context,
                'Allow notifications in your device settings to enable reminders.',
              )
            : appText(
                context,
                'Local reminders are available on Android and iOS devices.',
              );
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(message)));
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              appText(
                context,
                'Could not update reminder: {error}',
              ).replaceAll('{error}', error.toString()),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final schedule = BanditSchedule.forRegion(widget.region);
    final activeWindow = schedule
        .where((window) => window.hour == _now.hour)
        .firstOrNull;
    final isRolling = activeWindow != null && _now.minute < 10;
    final nextWindow = BanditSchedule.nextWindow(
      region: widget.region,
      utcNow: _now,
    );
    final remaining = nextWindow.at.difference(_now);
    final imminent = !isRolling && remaining <= const Duration(minutes: 15);
    final status = isRolling
        ? appText(context, 'ASSAULT WINDOW')
        : imminent
        ? appText(context, 'IMMINENT')
        : appText(context, 'STANDBY');
    final statusColor = isRolling
        ? akGreen
        : imminent
        ? const Color(0xFFF4C15D)
        : akMutedOf(context);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
      children: [
        AkPageHeading(
          eyebrow: appText(context, 'FACTION WARFARE'),
          title: appText(context, 'Time your next push.'),
          subtitle: appText(
            context,
            'Check the bandit schedule and see when the next window is expected.',
          ),
        ),
        const SizedBox(height: 20),
        AkPanel(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.swords, color: akOrange),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      appText(context, 'Next bandit assault'),
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                  AkTag(status, color: statusColor),
                ],
              ),
              const SizedBox(height: 24),
              Center(
                child: Text(
                  isRolling
                      ? appText(context, 'LIVE NOW')
                      : _formatRemaining(remaining),
                  style: TextStyle(
                    fontSize: isRolling ? 31 : 42,
                    fontWeight: FontWeight.w900,
                    fontFeatures: const [FontFeature.tabularFigures()],
                    letterSpacing: -1.5,
                    color: isRolling ? akGreen : null,
                  ),
                ),
              ),
              const SizedBox(height: 7),
              Center(
                child: Text(
                  isRolling
                      ? appText(
                          context,
                          'Assault window active until {time} UTC',
                        ).replaceAll(
                          '{time}',
                          _formatUtcHour((_now.hour + 1) % 24),
                        )
                      : appText(
                          context,
                          'Estimated start · {time} UTC',
                        ).replaceAll(
                          '{time}',
                          _formatUtcHour(nextWindow.window.hour),
                        ),
                  style: TextStyle(color: akMutedOf(context), fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 20),
              const Divider(height: 1),
              const SizedBox(height: 15),
              Row(
                children: [
                  Expanded(
                    child: _StatusStat(
                      label: appText(context, 'CHANCE'),
                      value: '${(nextWindow.window.chance * 100).round()}%',
                      valueColor: _probabilityColor(
                        context,
                        nextWindow.window.chance,
                      ),
                    ),
                  ),
                  Expanded(
                    child: _StatusStat(
                      label: appText(context, 'SERVER TIME'),
                      value:
                          '${_twoDigits(_now.hour)}:${_twoDigits(_now.minute)} UTC',
                    ),
                  ),
                  Expanded(
                    child: _StatusStat(
                      label: appText(context, 'SERVER'),
                      value: widget.region.toUpperCase(),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        AkPanel(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: ListenableBuilder(
            listenable: widget.settings,
            builder: (context, _) => SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: widget.settings.banditAlertsEnabled,
              onChanged: _toggleAlerts,
              secondary: const Icon(LucideIcons.bellRing, color: akOrange),
              title: Text(
                appText(context, 'Assault reminders'),
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: Text(
                appText(
                  context,
                  'Get notified {minutes} min before the next window.',
                ).replaceAll(
                  '{minutes}',
                  widget.settings.banditReminderMinutes.toString(),
                ),
                style: TextStyle(color: akMutedOf(context), fontSize: 12),
              ),
            ),
          ),
        ),
        const SizedBox(height: 18),
        AkMessagePanel(
          title: appText(context, 'Schedule estimates, not guarantees'),
          message: appText(
            context,
            'These probabilities use AlbionKit’s regional schedule. In-game timing may vary.',
          ),
          icon: LucideIcons.info,
        ),
        const SizedBox(height: 22),
        AkSectionTitle(appText(context, 'Today’s UTC windows')),
        const SizedBox(height: 12),
        ...schedule.map((window) {
          final isCurrent = window.hour == _now.hour && _now.minute < 10;
          final isNext = !isRolling && window.hour == nextWindow.window.hour;
          final chanceColor = _probabilityColor(context, window.chance);
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: AkPanel(
              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 13),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color:
                          (isCurrent
                                  ? akGreen
                                  : isNext
                                  ? akOrange
                                  : akSurfaceRaisedOf(context))
                              .withValues(alpha: .14),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Icon(
                      isCurrent ? LucideIcons.bolt : LucideIcons.clock3,
                      size: 19,
                      color: isCurrent
                          ? akGreen
                          : isNext
                          ? akOrange
                          : akMutedOf(context),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '${_formatUtcHour(window.hour)} UTC',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                  if (isCurrent)
                    AkTag(appText(context, 'LIVE'), color: akGreen),
                  if (isNext && !isCurrent) AkTag(appText(context, 'NEXT')),
                  const SizedBox(width: 8),
                  Text(
                    '${(window.chance * 100).round()}%',
                    style: TextStyle(
                      color: chanceColor,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  String _formatRemaining(Duration remaining) {
    final seconds = remaining.inSeconds.clamp(0, 86400);
    final hours = seconds ~/ 3600;
    final minutes = (seconds % 3600) ~/ 60;
    final secs = seconds % 60;
    return '${_twoDigits(hours)}:${_twoDigits(minutes)}:${_twoDigits(secs)}';
  }

  String _formatUtcHour(int hour) => '${_twoDigits(hour)}:00';
  String _twoDigits(int value) => value.toString().padLeft(2, '0');

  Color _probabilityColor(BuildContext context, double chance) {
    if (chance >= .6) return akGreen;
    if (chance >= .4) return const Color(0xFFF4C15D);
    if (chance >= .2) return akOrange;
    return akMutedOf(context);
  }
}

class _StatusStat extends StatelessWidget {
  const _StatusStat({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          label,
          style: TextStyle(
            color: akMutedOf(context),
            fontSize: 9,
            letterSpacing: .7,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 5),
        Text(
          value,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
