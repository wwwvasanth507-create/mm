import 'package:flutter/material.dart';

/// Jalra Brand Color Palette
/// Derived from the official Jalra logo:
/// Obsidian dark backdrop with vibrant electric neon lime green (#76E035) and warm amber gold (#FFB800) accents.
class AppColors {
  AppColors._();

  // Backgrounds - Sleek Obsidian / Charcoal with deep green undertone
  static const Color background = Color(0xFF090D0A);
  static const Color surface = Color(0xFF111813);
  static const Color surfaceLight = Color(0xFF19241C);
  static const Color surfaceHighlight = Color(0xFF223226);
  static const Color card = Color(0xFF141D16);

  // Accents - Official Jalra Logo Palette
  static const Color primary = Color(0xFF76E035); // Electric Jalra Neon Lime Green
  static const Color primaryLight = Color(0xFF8FF252);
  static const Color primaryDark = Color(0xFF55B81C);
  static const Color secondary = Color(0xFFFFB800); // Warm Golden Amber
  static const Color accentCyan = Color(0xFF00E5FF); // Electric Cyan
  static const Color accentViolet = Color(0xFF10B981); // Emerald Green
  static const Color accentEmerald = Color(0xFF00E676); // Success / Offline

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF76E035), Color(0xFF10B981)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient waveGradient = LinearGradient(
    colors: [Color(0xFF76E035), Color(0xFFFFB800), Color(0xFF10B981)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient neonCyanViolet = LinearGradient(
    colors: [Color(0xFF76E035), Color(0xFF00E5FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGlowGradient = LinearGradient(
    colors: [Color(0x3376E035), Color(0x1110B981), Colors.transparent],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient playerBackgroundGradient = LinearGradient(
    colors: [Color(0xFF0E1A11), Color(0xFF09100B), Color(0xFF050806)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // Text Colors
  static const Color textPrimary = Color(0xFFF9FAF9);
  static const Color textSecondary = Color(0xFFA2B0A6);
  static const Color textMuted = Color(0xFF6B7B70);
  static const Color textDisabled = Color(0xFF455249);

  // Status & Utility
  static const Color success = Color(0xFF00E676);
  static const Color warning = Color(0xFFFFB300);
  static const Color error = Color(0xFFFF4D4D);
  static const Color divider = Color(0xFF1C281F);
}
