import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

// tests for CreateInviteCodeRequest
void main() {
  final instance = CreateInviteCodeRequestBuilder();
  // TODO add properties to the builder and call build()

  group(CreateInviteCodeRequest, () {
    // Optional custom invite code (1-32 characters, alphanumeric with underscore/hyphen). If not provided or null, an 8-character code will be auto-generated.
    // String code
    test('to test the property `code`', () async {
      // TODO
    });

    // Maximum number of times this code can be used. null = unlimited
    // int maxUses
    test('to test the property `maxUses`', () async {
      // TODO
    });

    // Expiration date/time in ISO 8601 format. null = never expires
    // DateTime expiresAt
    test('to test the property `expiresAt`', () async {
      // TODO
    });

    // Optional note about this invite code (e.g., \"For beta testers\")
    // String note
    test('to test the property `note`', () async {
      // TODO
    });
  });
}
