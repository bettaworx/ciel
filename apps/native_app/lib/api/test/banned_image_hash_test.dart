import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

// tests for BannedImageHash
void main() {
  final instance = BannedImageHashBuilder();
  // TODO add properties to the builder and call build()

  group(BannedImageHash, () {
    // Banned image hash ID
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // Image hash value (hex or base64)
    // String hash
    test('to test the property `hash`', () async {
      // TODO
    });

    // ImageHashType hashType
    test('to test the property `hashType`', () async {
      // TODO
    });

    // Admin user ID who created this rule
    // String createdBy
    test('to test the property `createdBy`', () async {
      // TODO
    });

    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // Reason why this image is banned
    // String reason
    test('to test the property `reason`', () async {
      // TODO
    });
  });
}
