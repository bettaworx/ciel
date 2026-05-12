import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

// tests for PublicEmoji
void main() {
  final instance = PublicEmojiBuilder();
  // TODO add properties to the builder and call build()

  group(PublicEmoji, () {
    // Custom emoji shortcode (alphanumeric and underscore only, Mastodon-compatible).
    // String shortcode
    test('to test the property `shortcode`', () async {
      // TODO
    });

    // URL of the emoji WebP image.
    // String imageUrl
    test('to test the property `imageUrl`', () async {
      // TODO
    });

    // Optional display name for the emoji.
    // String name
    test('to test the property `name`', () async {
      // TODO
    });

    // Optional category for grouping emojis.
    // String category
    test('to test the property `category`', () async {
      // TODO
    });

    // Optional license information for the emoji image.
    // String license
    test('to test the property `license`', () async {
      // TODO
    });
  });
}
