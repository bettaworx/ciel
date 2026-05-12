import 'package:flutter/material.dart';
import 'l10n/app_localizations.dart';

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
          title: 'Ciel Native App',
          onGenerateTitle: (context) => AppLocalizations.of(context)!.appTitle,
          theme: AppTheme.light(),
          locale: localeController.locale,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: HomePage(localeController: localeController),
        );
      },
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key, required this.localeController});

  final LocaleController localeController;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.homeTitle),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l10n.localizationTestDescription, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 24),
            Text(l10n.counterPrompt, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 8),
            Text(l10n.counterValue(_counter), style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 24),
            Text(l10n.languageSwitcherTitle, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              l10n.currentLocaleLabel(Localizations.localeOf(context).toLanguageTag()),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: [
                FilledButton(
                  onPressed: () => widget.localeController.setLocale(const Locale('en')),
                  child: Text(l10n.languageEnglish),
                ),
                FilledButton(
                  onPressed: () => widget.localeController.setLocale(const Locale('ja')),
                  child: Text(l10n.languageJapanese),
                ),
              ],
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: l10n.incrementTooltip,
        child: const Icon(Icons.add),
      ),
    );
  }
}
