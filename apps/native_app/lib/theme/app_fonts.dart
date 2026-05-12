import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppFonts {
  const AppFonts._();

  static TextTheme textTheme() {
    final base = ThemeData.light().textTheme;

    final latin = GoogleFonts.notoSansTextTheme(base);
    return GoogleFonts.notoSansJpTextTheme(latin);
  }
}
