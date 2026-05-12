import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleController extends ChangeNotifier {
  LocaleController({SharedPreferences? preferences})
    : _preferencesFuture =
          preferences != null
              ? Future<SharedPreferences>.value(preferences)
              : SharedPreferences.getInstance();

  static const String storageKey = 'app_locale';
  static const List<Locale> supportedLocales = [Locale('en'), Locale('ja')];

  final Future<SharedPreferences> _preferencesFuture;

  Locale _locale = supportedLocales.first;
  Locale get locale => _locale;

  Future<void> init() async {
    final preferences = await _preferencesFuture;
    final savedLanguageCode = preferences.getString(storageKey);

    if (savedLanguageCode != null) {
      _locale = _resolveLocale(Locale(savedLanguageCode));
      return;
    }

    final systemLocale = PlatformDispatcher.instance.locale;
    _locale = _resolveLocale(systemLocale);
    await preferences.setString(storageKey, _locale.languageCode);
  }

  Future<void> setLocale(Locale locale) async {
    final resolvedLocale = _resolveLocale(locale);

    if (_locale == resolvedLocale) {
      return;
    }

    _locale = resolvedLocale;
    final preferences = await _preferencesFuture;
    await preferences.setString(storageKey, _locale.languageCode);
    notifyListeners();
  }

  Locale _resolveLocale(Locale locale) {
    for (final supportedLocale in supportedLocales) {
      if (supportedLocale.languageCode == locale.languageCode) {
        return supportedLocale;
      }
    }

    return supportedLocales.first;
  }
}
