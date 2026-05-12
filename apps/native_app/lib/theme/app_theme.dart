import 'package:flutter/material.dart';

import 'app_fonts.dart';

class AppTheme {
  const AppTheme._();

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
      textTheme: AppFonts.textTheme(),
    );
  }
}
