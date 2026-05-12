import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

/// tests for EmojisApi
void main() {
  final instance = CielApi().getEmojisApi();

  group(EmojisApi, () {
    // List custom emojis
    //
    // Returns the list of custom emojis available on this server.
    //
    //Future<EmojiListResponse> emojisGet({ int limit, int offset }) async
    test('test emojisGet', () async {
      // TODO
    });

    // Get a custom emoji by shortcode
    //
    //Future<PublicEmoji> emojisShortcodeGet(String shortcode) async
    test('test emojisShortcodeGet', () async {
      // TODO
    });
  });
}
