import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import 'locale/locale_controller.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final localeController = LocaleController();
  await localeController.init();

  runApp(MyApp(localeController: localeController));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key, required this.localeController});

  final LocaleController localeController;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: localeController,
      builder: (context, _) {
        return MaterialApp(
          onGenerateTitle: (context) => AppLocalizations.of(context)!.appTitle,
          theme: AppTheme.light(),
          locale: localeController.locale,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
          ],
          supportedLocales: LocaleController.supportedLocales,
          home: HomePage(localeController: localeController),
        );
      },
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key, required this.localeController});

  final LocaleController localeController;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.homeAppBarTitle),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l10n.notoSansTitle, style: textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              l10n.notoSansDescription,
              style: textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            Text(l10n.notoSansJpTitle, style: textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              l10n.notoSansJpDescription,
              style: textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 8,
              children: [
                FilledButton(
                  onPressed: () => localeController.setLocale(const Locale('en')),
                  child: const Text('English'),
                ),
                FilledButton(
                  onPressed: () => localeController.setLocale(const Locale('ja')),
                  child: const Text('日本語'),
                ),
              ],
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        tooltip: l10n.incrementTooltip,
        child: const Icon(Icons.add),
      ),
    );
  }
}
