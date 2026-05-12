import 'package:flutter/material.dart';

import 'theme/app_theme.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ciel Native App',
      theme: AppTheme.light(),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ciel'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Noto Sans', style: textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              'The quick brown fox jumps over the lazy dog.',
              style: textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            Text('Noto Sans JP', style: textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              '素早い茶色の狐が怠惰な犬を飛び越える。',
              style: textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}
