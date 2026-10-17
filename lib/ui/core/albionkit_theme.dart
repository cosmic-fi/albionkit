import 'package:flutter/material.dart';

import '../widgets/ak_widgets.dart';

class AlbionKitTheme {
  static const _lightBackground = Color(0xFFF7F6F3);
  static const _lightForeground = Color(0xFF252422);
  static const _lightMuted = Color(0xFF5F5D58);
  static const _lightSecondary = Color(0xFFEEECE8);

  static const _darkBackground = Color(0xFF141516);
  static const _darkForeground = Color(0xFFF3F2EF);
  static const _darkSurface = Color(0xFF1D1E1F);
  static const _darkRaised = Color(0xFF242526);
  static const _darkMuted = Color(0xFFB8B6B1);

  static ThemeData get light {
    const scheme = ColorScheme(
      brightness: Brightness.light,
      primary: akOrange,
      onPrimary: Colors.white,
      secondary: Color(0xFFEEECE8),
      onSecondary: _lightForeground,
      error: Color(0xFFDC3C3C),
      onError: Colors.white,
      surface: Colors.white,
      onSurface: _lightForeground,
      surfaceContainerLowest: Colors.white,
      surfaceContainerLow: _lightBackground,
      surfaceContainer: _lightSecondary,
      surfaceContainerHigh: Color(0xFFE8E5DF),
      surfaceContainerHighest: Color(0xFFE8E5DF),
      onSurfaceVariant: _lightMuted,
      outline: Colors.transparent,
      outlineVariant: Colors.transparent,
      shadow: Color(0x1F252422),
      scrim: Colors.black54,
      inverseSurface: _darkSurface,
      onInverseSurface: _darkForeground,
      inversePrimary: Color(0xFFFFB45E),
      surfaceTint: akOrange,
    );
    return _theme(scheme, _lightBackground);
  }

  static ThemeData get dark {
    const scheme = ColorScheme(
      brightness: Brightness.dark,
      primary: akOrange,
      onPrimary: Colors.white,
      secondary: Color(0xFF292A2B),
      onSecondary: Color(0xFFE9E7E3),
      error: Color(0xFFEF4444),
      onError: Colors.white,
      surface: _darkSurface,
      onSurface: _darkForeground,
      surfaceContainerLowest: _darkBackground,
      surfaceContainerLow: _darkSurface,
      surfaceContainer: _darkRaised,
      surfaceContainerHigh: Color(0xFF303031),
      surfaceContainerHighest: Color(0xFF303031),
      onSurfaceVariant: _darkMuted,
      outline: Colors.transparent,
      outlineVariant: Colors.transparent,
      shadow: Colors.black54,
      scrim: Colors.black87,
      inverseSurface: Colors.white,
      onInverseSurface: _lightForeground,
      inversePrimary: Color(0xFFB65E00),
      surfaceTint: akOrange,
    );
    return _theme(scheme, _darkBackground);
  }

  static ThemeData _theme(ColorScheme scheme, Color background) {
    final dark = scheme.brightness == Brightness.dark;
    return ThemeData(
      // Leave font selection to Flutter's platform defaults for script coverage.
      fontFamily: null,
      colorScheme: scheme,
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      appBarTheme: AppBarTheme(
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        centerTitle: false,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: dark ? 0 : 1,
        shadowColor: scheme.shadow,
        margin: EdgeInsets.zero,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: dark ? _darkRaised : _lightBackground,
        labelStyle: TextStyle(color: scheme.onSurfaceVariant),
        hintStyle: TextStyle(color: scheme.onSurfaceVariant),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.transparent),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.transparent),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.transparent, width: 1.5),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.transparent),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.transparent),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.transparent, width: 1.5),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: scheme.surface,
        indicatorColor: akOrange.withValues(alpha: .14),
        surfaceTintColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            color: states.contains(WidgetState.selected)
                ? scheme.onSurface
                : scheme.onSurfaceVariant,
            fontSize: 12,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
          ),
        ),
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: background,
        indicatorColor: akOrange.withValues(alpha: .14),
        selectedIconTheme: const IconThemeData(color: akOrange),
        unselectedIconTheme: IconThemeData(color: scheme.onSurfaceVariant),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: scheme.surfaceContainerHigh,
        selectedColor: akOrange,
        side: BorderSide.none,
        labelStyle: TextStyle(color: scheme.onSurface),
        secondaryLabelStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.selected)
                ? akOrange
                : scheme.surfaceContainerHigh,
          ),
          foregroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.selected)
                ? Colors.white
                : scheme.onSurface,
          ),
          side: WidgetStateProperty.all(BorderSide.none),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: akOrange,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          backgroundColor: scheme.surfaceContainerHigh,
          side: BorderSide.none,
        ),
      ),
      dividerTheme: DividerThemeData(
        color: scheme.onSurface.withValues(alpha: dark ? .14 : .1),
      ),
    );
  }
}
