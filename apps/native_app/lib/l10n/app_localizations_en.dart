// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Ciel Native App';

  @override
  String get homeTitle => 'Localization Test';

  @override
  String get localizationTestDescription =>
      'Use this page to verify localized text and language switching.';

  @override
  String get counterPrompt => 'You have pushed the button this many times:';

  @override
  String counterValue(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count times',
      one: '1 time',
      zero: '0 times',
    );
    return '$_temp0';
  }

  @override
  String get languageSwitcherTitle => 'Language';

  @override
  String currentLocaleLabel(String locale) {
    return 'Current locale: $locale';
  }

  @override
  String get languageEnglish => 'English';

  @override
  String get languageJapanese => 'Japanese';

  @override
  String get incrementTooltip => 'Increment counter';
}
