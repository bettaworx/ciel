// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Japanese (`ja`).
class AppLocalizationsJa extends AppLocalizations {
  AppLocalizationsJa([String locale = 'ja']) : super(locale);

  @override
  String get appTitle => 'Ciel';

  @override
  String get homeTitle => 'ローカライズ確認';

  @override
  String get localizationTestDescription => 'このページで翻訳文言と言語切り替えを確認できます。';

  @override
  String get counterPrompt => 'ボタンを押した回数:';

  @override
  String counterValue(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count回',
      one: '1回',
      zero: '0回',
    );
    return '$_temp0';
  }

  @override
  String get languageSwitcherTitle => '言語';

  @override
  String currentLocaleLabel(String locale) {
    return '現在のロケール: $locale';
  }

  @override
  String get languageEnglish => '英語';

  @override
  String get languageJapanese => '日本語';

  @override
  String get incrementTooltip => 'カウンターを増やす';
}
